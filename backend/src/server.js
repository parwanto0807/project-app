// server.js - COMPLETE FIXED VERSION
import { connectDB } from "./config/db.js";
import app from "./app.js";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../src/config/db.js";

// Helper function untuk parse cookies
const parseCookies = (cookieHeader) => {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const parts = cookie.trim().split("=");
      if (parts.length >= 2) {
        const key = parts[0];
        const value = parts.slice(1).join("=");
        cookies[key] = decodeURIComponent(value);
      }
    });
  }
  return cookies;
};

// 1️⃣ Buat HTTP server untuk Express
const server = http.createServer(app);

// Storage untuk pending updates
const pendingSessionUpdates = new Map();
const userRoleCache = new Map(); // Cache untuk user roles

// Function untuk mendapatkan user role (with cache)
const getUserRole = async (userId) => {
  if (userRoleCache.has(userId)) {
    return userRoleCache.get(userId);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const role = user?.role || "user";
    userRoleCache.set(userId, role);

    // Cache expire setelah 5 menit
    setTimeout(() => userRoleCache.delete(userId), 5 * 60 * 1000);

    return role;
  } catch (error) {
    console.error(`[Server] ❌ Error fetching role for ${userId}:`, error);
    return "user";
  }
};

// 2️⃣ Buat Socket.IO server
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  cookie: {
    name: "io",
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// 3️⃣ Middleware untuk authentication
io.use(async (socket, next) => {
  try {
    console.log("🔑 Authentication attempt for socket:", socket.id);

    const cookieHeader = socket.request.headers.cookie;
    if (!cookieHeader) {
      console.log("❌ No cookies in socket handshake");
      return next(new Error("Authentication error: No cookies provided"));
    }

    const cookies = parseCookies(cookieHeader);
    console.log("🍪 Available cookies:", Object.keys(cookies));

    const possibleTokenKeys = [
      "accessToken",
      "token",
      "jwt",
      "auth_token",
      "access_token",
      "auth-token",
    ];

    let token = null;
    for (const key of possibleTokenKeys) {
      if (cookies[key]) {
        token = cookies[key];
        console.log(`✅ Found token in cookie: ${key}`);
        break;
      }
    }

    if (!token) {
      console.log("❌ No access token found in cookies");
      return next(new Error("Authentication error: No token found in cookies"));
    }

    console.log("🔑 Token received:", token.substring(0, 20) + "...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verified for user:", decoded.userId || decoded.id);

    const userId = decoded.userId || decoded.id;
    socket.userId = userId;
    socket.user = decoded;

    // Dapatkan role user
    try {
      const userRole = await getUserRole(userId);
      socket.userRole = userRole;
      console.log(`👤 User role determined: ${userRole}`);
    } catch (roleError) {
      console.error("❌ Error getting user role:", roleError);
      socket.userRole = "user"; // Default ke user
    }

    console.log(
      `✅ Authenticated user: ${userId} (${socket.userRole}) for socket: ${socket.id}`
    );
    next();
  } catch (error) {
    console.error("❌ Socket authentication error:", error.message);
    if (error.name === "JsonWebTokenError") {
      next(new Error("Authentication error: Invalid token"));
    } else if (error.name === "TokenExpiredError") {
      next(new Error("Authentication error: Token expired"));
    } else {
      next(new Error("Authentication error: " + error.message));
    }
  }
});

// ============ HELPER FUNCTIONS ============

// Function untuk get sessions berdasarkan role
async function getSessionsBasedOnRole(userId, userRole) {
  console.log(`[Server] 🔍 Querying sessions for ${userRole} ${userId}`);

  try {
    if (userRole === "super" || userRole === "admin") {
      // ✅ ADMIN: Dapatkan SEMUA sessions dengan user info
      const sessions = await prisma.userSession.findMany({
        where: {
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      console.log(`[Server] 📊 Admin gets ALL sessions: ${sessions.length}`);
      return sessions;
    } else {
      // ✅ REGULAR USER: Hanya sessions sendiri
      const sessions = await prisma.userSession.findMany({
        where: {
          userId: userId,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      console.log(`[Server] 📊 User gets own sessions: ${sessions.length}`);
      return sessions;
    }
  } catch (error) {
    console.error("[Server] ❌ Query error:", error.message);
    return [];
  }
}

// Helper function untuk get client IP
function getClientIP(socket) {
  try {
    const forwarded = socket.handshake.headers["x-forwarded-for"];
    if (forwarded) {
      const ips = forwarded.split(",").map((ip) => ip.trim());
      return ips[0];
    }
    return socket.handshake.address || "0.0.0.0";
  } catch (error) {
    return "0.0.0.0";
  }
}

// Function untuk broadcast session updates ke admin
const broadcastToAdmins = async (event, data) => {
  try {
    console.log(`📤 [Broadcast] ${event} to all admins`);

    // Dapatkan semua admin sessions
    if (event === "session:updated") {
      const allSessions = await prisma.userSession.findMany({
        where: {
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      data = { sessions: allSessions };
    }

    // Emit ke semua connected sockets yang admin
    let adminCount = 0;
    io.sockets.sockets.forEach((socket) => {
      if (socket.userRole === "super" || socket.userRole === "admin") {
        socket.emit(event, data);
        adminCount++;
      }
    });

    console.log(`✅ [Broadcast] Sent to ${adminCount} admins`);
  } catch (error) {
    console.error(`❌ [Broadcast] Error:`, error);
  }
};

// Function untuk broadcast session updates ke specific user
const broadcastToUser = async (userId, event, data) => {
  try {
    console.log(`📤 [User Broadcast] ${event} to user:${userId}`);

    const room = `user:${userId}`;
    const roomSockets = io.sockets.adapter.rooms.get(room);
    const roomSize = roomSockets ? roomSockets.size : 0;

    if (roomSize > 0) {
      io.to(room).emit(event, data);
      console.log(
        `✅ [User Broadcast] Sent to user ${userId} (${roomSize} sockets)`
      );
    } else {
      console.log(`⚠️ [User Broadcast] User ${userId} not connected`);
    }
  } catch (error) {
    console.error(`❌ [User Broadcast] Error:`, error);
  }
};

const revokeSessionById = async (sessionId, currentSocketId = null) => {
  try {
    // Dapatkan session details
    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    // Revoke session
    await prisma.userSession.update({
      where: { id: sessionId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        sessionToken: null,
        refreshToken: null,
      },
    });

    console.log(`✅ Session ${sessionId.substring(0, 8)} revoked`);

    // Jika session sedang aktif, disconnect socket-nya
    if (session.sessionToken && session.sessionToken.includes("socket-")) {
      // Cari socket berdasarkan sessionToken
      let targetSocket = null;

      io.sockets.sockets.forEach((sock) => {
        if (
          sock.userSessionToken === session.sessionToken &&
          sock.id !== currentSocketId
        ) {
          targetSocket = sock;
        }
      });

      if (targetSocket) {
        targetSocket.emit("session:force-logout", {
          message: "Session revoked by admin/user",
          timestamp: new Date().toISOString(),
        });

        setTimeout(() => {
          targetSocket.disconnect(true);
          console.log(`🔌 Force disconnected socket ${targetSocket.id}`);
        }, 1000);
      }
    }

    // Broadcast updates
    const userSessions = await getSessionsBasedOnRole(
      session.userId,
      session.user?.role || "user"
    );

    // Ke user yang direvoke
    await broadcastToUser(session.userId, "session:updated", {
      sessions: userSessions,
      revokedSessionId: sessionId,
    });

    // Ke semua admin
    await broadcastToAdmins("session:updated", {});

    return { success: true, session };
  } catch (error) {
    console.error("❌ Error revoking session:", error);
    throw error;
  }
};

// ============ SOCKET EVENT HANDLERS ============

io.on("connection", async (socket) => {
  console.log(
    `✅ Client connected: ${socket.id} (${socket.userRole} ${socket.userId})`
  );

  // Join rooms berdasarkan role
  if (socket.userId) {
    // Join personal room
    socket.join(`user:${socket.userId}`);
    console.log(`👤 ${socket.userId} joined personal room`);

    // Join admin room jika admin
    if (socket.userRole === "super" || socket.userRole === "admin") {
      socket.join("room:admins");
      console.log(`👑 ${socket.userId} joined admin room`);
    }
  }

  // Handle session creation/update
  if (socket.userId) {
    try {
      const sessionToken = `socket-${socket.id}-${Date.now()}`;
      const refreshToken = `refresh-${socket.id}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const clientIP = getClientIP(socket);
      const userAgent = socket.handshake.headers["user-agent"] || "Unknown";

      const existingSession = await prisma.userSession.findFirst({
        where: {
          userId: socket.userId,
          ipAddress: clientIP,
          userAgent: userAgent,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (existingSession) {
        await prisma.userSession.update({
          where: { id: existingSession.id },
          data: {
            sessionToken: sessionToken,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
        console.log(
          `[Server] 🔄 Updated session: ${existingSession.id.substring(0, 8)}`
        );
      } else {
        const newSession = await prisma.userSession.create({
          data: {
            userId: socket.userId,
            sessionToken: sessionToken,
            refreshToken: refreshToken,
            ipAddress: clientIP,
            userAgent: userAgent,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isRevoked: false,
            deviceId: null,
            fcmToken: null,
            country: null,
            city: null,
          },
        });
        console.log(
          `[Server] 💾 Created session: ${newSession.id.substring(0, 8)}`
        );
      }

      socket.userSessionToken = sessionToken;

      // ✅ BROADCAST SESSION UPDATE KE ADMIN
      if (socket.userRole === "super" || socket.userRole === "admin") {
        // Admin yang login, dapatkan semua sessions
        setTimeout(async () => {
          await broadcastToAdmins("session:updated", {});
        }, 1000);
      } else {
        // Regular user login, broadcast ke admin
        setTimeout(async () => {
          await broadcastToAdmins("session:updated", {});
        }, 1000);
      }
    } catch (error) {
      console.error("[Server] ❌ Error handling session:", error.message);
    }
  }

  // ✅ FIXED: Handle session:get-latest berdasarkan role
  socket.on("session:get-latest", async () => {
    console.log(
      `[Server] 📨 ${socket.userRole} ${socket.userId} requesting sessions`
    );

    if (!socket.userId) {
      console.log("[Server] ❌ No userId found");
      socket.emit("session:updated", { sessions: [] });
      return;
    }

    try {
      const sessions = await getSessionsBasedOnRole(
        socket.userId,
        socket.userRole
      );

      // Format sessions
      const formattedSessions = sessions.map((session) => {
        const isCurrentSession =
          socket.userSessionToken === session.sessionToken;

        return {
          id: session.id,
          userId: session.userId,
          userAgent: session.userAgent || "Unknown Browser",
          ipAddress: session.ipAddress || "0.0.0.0",
          isRevoked: session.isRevoked || false,
          isCurrent: isCurrentSession,
          createdAt: session.createdAt || new Date(),
          expiresAt:
            session.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
          fcmToken: session.fcmToken || null,
          deviceId: session.deviceId || null,
          location: session.country
            ? `${session.city || ""}, ${session.country}`.trim()
            : "Unknown",
          user: session.user || {
            id: "unknown",
            name: "Unknown User",
            email: "unknown@example.com",
            role: "user",
          },
          sessionTokenPreview: session.sessionToken
            ? `${session.sessionToken.substring(
                0,
                10
              )}...${session.sessionToken.substring(
                session.sessionToken.length - 5
              )}`
            : "No token",
        };
      });

      console.log(
        `[Server] 📤 Sending ${formattedSessions.length} sessions to ${socket.id}`
      );

      socket.emit("session:updated", { sessions: formattedSessions });
    } catch (error) {
      console.error("[Server] ❌ Error:", error.message);
      socket.emit("session:updated", { sessions: [] });
    }
  });

  // ✅ FIXED: Handle session revoke dengan broadcast
  // ✅ FIXED: Handle session:revoke dengan revokeSessionById
  socket.on("session:revoke", async (data) => {
    console.log("🔨 Session revoke request:", data.sessionId);

    try {
      // Gunakan function revokeSessionById
      const result = await revokeSessionById(data.sessionId, socket.id);

      socket.emit("session:revoke-success", {
        sessionId: data.sessionId,
        message: "Session revoked successfully",
      });
    } catch (error) {
      console.error("[Server] ❌ Error revoking session:", error);
      socket.emit("session:error", {
        message: "Failed to revoke session",
        error: error.message,
      });
    }
  });

  // ✅ FIXED: Handle logout other dengan broadcast
  socket.on("session:logout-other", async () => {
    console.log("🚪 Logout other devices request from:", socket.userId);

    try {
      // Revoke semua session kecuali session saat ini
      const result = await prisma.userSession.updateMany({
        where: {
          userId: socket.userId,
          sessionToken: { not: socket.userSessionToken },
          isRevoked: false,
        },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          sessionToken: null,
          refreshToken: null,
        },
      });

      console.log(`[Server] ✅ Revoked ${result.count} other sessions`);

      // Broadcast ke other devices
      socket.broadcast.emit("session:logout-other", {
        userId: socket.userId,
        timestamp: new Date().toISOString(),
        currentSocketId: socket.id,
      });

      // ✅ BROADCAST UPDATE
      // 1. Ke user sendiri
      const userSessions = await getSessionsBasedOnRole(
        socket.userId,
        socket.userRole
      );
      await broadcastToUser(socket.userId, "session:updated", {
        sessions: userSessions,
      });

      // 2. Ke semua admin
      await broadcastToAdmins("session:updated", {});
    } catch (error) {
      console.error("[Server] ❌ Error logging out other devices:", error);
    }
  });

  // Handle ping
  socket.on("ping", () => {
    const sendTime = Date.now();
    socket.emit("pong", sendTime);
    console.log(`🏓 Ping from ${socket.id}, user: ${socket.userId}`);
  });

  // Handle disconnect
  socket.on("disconnect", async (reason) => {
    console.log("❌ Client disconnected:", socket.id, "Reason:", reason);
    console.log("👤 User was:", socket.userId);

    if (socket.userId) {
      try {
        // Hanya update session yang terkait dengan socket ini
        // Cari session berdasarkan sessionToken socket
        if (socket.userSessionToken) {
          await prisma.userSession.updateMany({
            where: {
              sessionToken: socket.userSessionToken, // Hanya session ini
              userId: socket.userId,
              isRevoked: false,
            },
            data: {
              isRevoked: true,
              revokedAt: new Date(),
            },
          });
          console.log(
            `[Server] 📝 Session ${socket.userSessionToken?.substring(
              0,
              8
            )} revoked on disconnect`
          );

          // Broadcast session update ke admin
          setTimeout(async () => {
            await broadcastToAdmins("session:updated", {});
          }, 500);
        } else {
          console.log(
            `[Server] ⚠️ No sessionToken found for socket ${socket.id}`
          );
        }
      } catch (error) {
        console.error(
          "[Server] ❌ Error updating session on disconnect:",
          error.message
        );
      }
    }
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// ============ EXPORTED FUNCTIONS ============

// Function untuk emit session update dari mana saja (contoh: dari route handler)
export const emitSessionUpdate = async (
  userId,
  eventType = "session:updated"
) => {
  try {
    if (!io) {
      console.error("❌ Socket.io not initialized");
      return;
    }

    // Dapatkan user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const userRole = user?.role || "user";

    // Dapatkan sessions berdasarkan role
    const sessions = await getSessionsBasedOnRole(userId, userRole);

    // Format sessions
    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      userId: session.userId,
      userAgent: session.userAgent || "Unknown Browser",
      ipAddress: session.ipAddress || "0.0.0.0",
      isRevoked: session.isRevoked || false,
      createdAt: session.createdAt || new Date(),
      expiresAt:
        session.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
      fcmToken: session.fcmToken || null,
      deviceId: session.deviceId || null,
      user: session.user || {
        id: "unknown",
        name: "Unknown User",
        email: "unknown@example.com",
      },
    }));

    // 1. Kirim ke user sendiri
    const userRoom = `user:${userId}`;
    const userRoomSize = io.sockets.adapter.rooms.get(userRoom)?.size || 0;

    if (userRoomSize > 0) {
      io.to(userRoom).emit(eventType, { sessions: formattedSessions });
      console.log(`✅ [Emit] Session update sent to user ${userId}`);
    }

    // 2. Jika user adalah admin, mereka sudah dapat update dari broadcastToAdmins
    // 3. Jika bukan admin, broadcast ke admin room
    if (userRole !== "super" && userRole !== "admin") {
      await broadcastToAdmins("session:updated", {});
    }
  } catch (error) {
    console.error("[Emit] Error emitting session update:", error);
  }
};

// Function untuk broadcast session creation/update ke semua admin
export const broadcastNewSessionToAdmins = async (sessionData) => {
  try {
    console.log(
      `📤 [Broadcast New] Session created for user: ${sessionData.userId}`
    );

    // Dapatkan semua sessions untuk admin
    const allSessions = await prisma.userSession.findMany({
      where: {
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Broadcast ke admin room
    io.to("room:admins").emit("session:updated", {
      sessions: allSessions,
      source: "new-session",
      timestamp: new Date().toISOString(),
    });

    console.log(`✅ [Broadcast New] Sent to admin room`);
  } catch (error) {
    console.error(`❌ [Broadcast New] Error:`, error);
  }
};

// 7️⃣ Jalankan server
connectDB()
  .then(() => {
    server.listen(5000, () => {
      console.log("✅ Server + Socket.IO running on port 5000");
      console.log("🔗 CORS enabled for: http://localhost:3000");
      console.log("🍪 Cookie authentication: ENABLED");
      console.log("👥 Multi-role support: ACTIVE");
      console.log("👑 Admin room: room:admins");
      console.log("👤 Personal rooms: user:{userId}");
      console.log("🗄️  Database: PostgreSQL with Prisma");
    });
  })
  .catch((err) => {
    console.log("❌ Database connection failed:", err);
    process.exit(1);
  });
