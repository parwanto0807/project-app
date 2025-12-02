// server.js - PRODUCTION READY VERSION for rylif-app.com
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

// Konfigurasi environment
const isProduction = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 5000;
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Domain configuration
const APP_DOMAIN = "rylif-app.com";
const APP_URL = isProduction
  ? `https://${APP_DOMAIN}`
  : "http://localhost:3000";
const API_URL = isProduction
  ? `https://api.${APP_DOMAIN}`
  : "http://localhost:5000";

console.log(`🌍 Environment: ${isProduction ? "Production" : "Development"}`);
console.log(`🌐 App URL: ${APP_URL}`);
console.log(`🔗 API URL: ${API_URL}`);

// Allowed origins untuk production
const allowedOrigins = isProduction
  ? [
      `https://${APP_DOMAIN}`,
      `https://www.${APP_DOMAIN}`,
      `https://app.${APP_DOMAIN}`,
      `https://admin.${APP_DOMAIN}`,
      "https://rylif-app.com",
      "https://www.rylif-app.com",
      "https://app.rylif-app.com",
      "https://admin.rylif-app.com",
      "http://localhost:3000", // Untuk development
    ]
  : ["http://localhost:3000", "http://localhost:5173"];

// Storage untuk pending updates
const userRoleCache = new Map(); // Cache untuk user roles
const socketToUserMap = new Map(); // Map socket.id -> userId untuk tracking

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

// 2️⃣ Buat Socket.IO server dengan config production
const ioConfig = {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, or curl requests)
      if (!origin && !isProduction) {
        // Di development, allow no origin
        return callback(null, true);
      }

      if (!origin && isProduction) {
        // Di production, log but allow untuk trusted sources
        console.log("🔗 Request with no origin detected");
        return callback(null, true);
      }

      // Check allowed origins
      const isAllowed = allowedOrigins.some((allowedOrigin) => {
        return (
          origin === allowedOrigin ||
          origin?.endsWith(`.${APP_DOMAIN}`) ||
          (isProduction && origin?.includes(APP_DOMAIN))
        );
      });

      if (isAllowed) {
        return callback(null, true);
      }

      const msg = `The CORS policy does not allow access from ${origin}.`;
      console.warn("⚠️ CORS blocked:", origin);
      return callback(new Error(msg), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Cookie",
    ],
  },
  cookie: {
    name: "io",
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/",
    maxAge: 86400000, // 1 hari
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: isProduction ? 30000 : 60000, // 30 detik di production
  pingInterval: isProduction ? 15000 : 25000, // 15 detik di production
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 menit
    skipMiddlewares: true,
  },
  maxHttpBufferSize: 1e6, // 1MB
  serveClient: false, // Tidak serve client file
  // HAPUS wsEngine CONFIG karena menyebabkan error
  // wsEngine: "ws", // REMOVE THIS LINE
  // Timeout config
  connectTimeout: 45000,
};

export const io = new Server(server, ioConfig);

// Middleware untuk rate limiting
const connectionAttempts = new Map();
const MAX_ATTEMPTS = isProduction ? 50 : 100;
const TIME_WINDOW = 60 * 1000; // 15 menit

const rateLimitMiddleware = (socket, next) => {
  try {
    const ip = getClientIP(socket);
    const now = Date.now();

    if (!connectionAttempts.has(ip)) {
      connectionAttempts.set(ip, []);
    }

    const attempts = connectionAttempts.get(ip);

    // Hapus attempt yang sudah lama (lebih dari TIME_WINDOW)
    const recentAttempts = attempts.filter((time) => now - time < TIME_WINDOW);

    if (recentAttempts.length >= MAX_ATTEMPTS) {
      console.warn(
        `🚨 Rate limit exceeded for IP: ${ip} (${recentAttempts.length} attempts)`
      );

      // Hapus semua attempts untuk IP ini agar bisa coba lagi
      connectionAttempts.delete(ip);

      return next(
        new Error(
          "Too many connection attempts. Please wait a moment and try again."
        )
      );
    }

    recentAttempts.push(now);
    connectionAttempts.set(ip, recentAttempts);

    // Auto cleanup untuk mencegah memory leak
    if (recentAttempts.length === 1) {
      setTimeout(() => {
        if (connectionAttempts.has(ip)) {
          const currentAttempts = connectionAttempts.get(ip);
          const filtered = currentAttempts.filter(
            (time) => now - time < TIME_WINDOW
          );
          if (filtered.length === 0) {
            connectionAttempts.delete(ip);
          }
        }
      }, TIME_WINDOW + 1000);
    }

    next();
  } catch (error) {
    console.error("Rate limiting error:", error);
    next(); // Lewati rate limiting jika error
  }
};

// 3️⃣ Middleware untuk authentication
io.use(rateLimitMiddleware);
io.use(async (socket, next) => {
  try {
    console.log("🔑 Authentication attempt for socket:", socket.id);

    const cookieHeader = socket.request.headers.cookie;
    if (!cookieHeader) {
      console.log("❌ No cookies in socket handshake");
      return next(new Error("Authentication error: No cookies provided"));
    }

    const cookies = parseCookies(cookieHeader);

    // Prioritize auth_token (sesuai dengan convention)
    const token =
      cookies.auth_token ||
      cookies.accessToken ||
      cookies.token ||
      cookies.jwt ||
      cookies["access-token"] ||
      socket.handshake.auth?.token;

    if (!token) {
      console.log("❌ No access token found in cookies or auth");
      return next(new Error("Authentication error: No token found"));
    }

    console.log("🔑 Token received:", token.substring(0, 20) + "...");

    // Verifikasi JWT
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        console.log("⚠️ Token expired, attempting refresh...");
        // Coba refresh token
        const refreshToken = cookies.refresh_token || cookies.refreshToken;
        if (refreshToken) {
          // Di sini bisa implementasi refresh token logic
          // Untuk sekarang, tetap reject
          return next(new Error("Authentication error: Token expired"));
        }
      }
      throw jwtError;
    }

    console.log("✅ Token verified for user:", decoded.userId || decoded.id);

    const userId = decoded.userId || decoded.id;
    socket.userId = userId;
    socket.user = decoded;

    // Track socket to user mapping
    socketToUserMap.set(socket.id, userId);

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
        take: 100, // Limit untuk performance
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
        take: 20, // Limit untuk user biasa
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
    const realIp = socket.handshake.headers["x-real-ip"];

    if (forwarded) {
      const ips = forwarded.split(",").map((ip) => ip.trim());
      return ips[0];
    }

    if (realIp) {
      return realIp;
    }

    return socket.handshake.address || socket.conn.remoteAddress || "0.0.0.0";
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
        take: 100,
      });

      data = { sessions: allSessions };
    }

    // Emit ke semua connected sockets yang admin
    let adminCount = 0;
    const sockets = Array.from(io.sockets.sockets.values());

    for (const socket of sockets) {
      if (socket.userRole === "super" || socket.userRole === "admin") {
        try {
          socket.emit(event, data);
          adminCount++;
        } catch (emitError) {
          console.error(
            `Error emitting to socket ${socket.id}:`,
            emitError.message
          );
        }
      }
    }

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

    // Gunakan io.to() yang lebih reliable
    io.to(room).emit(event, data);

    // Cek room size untuk logging
    const roomSockets = io.sockets.adapter.rooms.get(room);
    const roomSize = roomSockets ? roomSockets.size : 0;

    console.log(
      `✅ [User Broadcast] Sent to user ${userId} (${roomSize} sockets)`
    );
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

    // Clear cache
    if (userRoleCache.has(session.userId)) {
      userRoleCache.delete(session.userId);
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

  // Set connection metadata
  socket.connectedAt = new Date();
  socket.lastActivity = new Date();

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

    // Join room untuk tracking
    socket.join(`socket:${socket.id}`);
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
            lastActiveAt: new Date(),
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
            lastActiveAt: new Date(),
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

  // Activity tracking
  socket.onAny((eventName, ...args) => {
    socket.lastActivity = new Date();
  });

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
          lastActiveAt: session.lastActiveAt || session.createdAt,
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
  socket.on("session:revoke", async (data) => {
    console.log("🔨 Session revoke request:", data.sessionId);

    try {
      // Validasi role
      const session = await prisma.userSession.findUnique({
        where: { id: data.sessionId },
        include: { user: true },
      });

      if (!session) {
        throw new Error("Session not found");
      }

      // Cek permission
      if (socket.userRole !== "super" && socket.userRole !== "admin") {
        if (session.userId !== socket.userId) {
          throw new Error("Unauthorized to revoke this session");
        }
      }

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

  // Health check endpoint
  socket.on("health:check", (callback) => {
    if (typeof callback === "function") {
      callback({
        status: "healthy",
        timestamp: new Date().toISOString(),
        socketId: socket.id,
        userId: socket.userId,
        uptime: process.uptime(),
      });
    }
  });

  // Handle ping
  socket.on("ping", (callback) => {
    const sendTime = Date.now();
    if (typeof callback === "function") {
      callback({ pong: sendTime, serverTime: new Date().toISOString() });
    } else {
      socket.emit("pong", sendTime);
    }
  });

  // Handle disconnect
  socket.on("disconnect", async (reason) => {
    console.log("❌ Client disconnected:", socket.id, "Reason:", reason);
    console.log("👤 User was:", socket.userId);

    // Cleanup mapping
    socketToUserMap.delete(socket.id);

    if (socket.userId) {
      try {
        // Hanya update session yang terkait dengan socket ini
        if (socket.userSessionToken) {
          await prisma.userSession.updateMany({
            where: {
              sessionToken: socket.userSessionToken,
              userId: socket.userId,
              isRevoked: false,
            },
            data: {
              isRevoked: true,
              revokedAt: new Date(),
              lastActiveAt: new Date(),
            },
          });
          console.log(
            `[Server] 📝 Session ${socket.userSessionToken?.substring(
              0,
              8
            )} revoked on disconnect`
          );

          // Clear cache
          if (userRoleCache.has(socket.userId)) {
            userRoleCache.delete(socket.userId);
          }

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

// Function untuk emit session update dari mana saja
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
      lastActiveAt: session.lastActiveAt || session.createdAt,
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
    io.to(userRoom).emit(eventType, { sessions: formattedSessions });
    console.log(`✅ [Emit] Session update sent to user ${userId}`);

    // 2. Jika bukan admin, broadcast ke admin room
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
      take: 100,
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

// Graceful shutdown handler
const gracefulShutdown = async () => {
  console.log("🔄 Starting graceful shutdown...");

  try {
    // Notify all connected clients
    io.emit("server:maintenance", {
      message:
        "Server is restarting for maintenance. Please reconnect in a moment.",
      restartTime: new Date(Date.now() + 5000).toISOString(),
    });

    // Wait for notifications to be sent
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Close Socket.IO
    io.close(() => {
      console.log("✅ Socket.IO closed");
    });

    // Close HTTP server
    server.close(() => {
      console.log("✅ HTTP server closed");
    });

    // Close database connection
    await prisma.$disconnect();
    console.log("✅ Database disconnected");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error during graceful shutdown:", error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// 7️⃣ Jalankan server
connectDB()
  .then(() => {
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`
🚀 Server is running!
✅ Environment: ${isProduction ? "Production" : "Development"}
✅ Port: ${PORT}
✅ Domain: ${APP_DOMAIN}
✅ CORS: Enabled for multiple origins
✅ WebSocket: Ready on ws://localhost:${PORT}${
        isProduction ? ` and wss://api.${APP_DOMAIN}` : ""
      }
✅ Admin room: room:admins
✅ Personal rooms: user:{userId}
✅ Database: PostgreSQL with Prisma
      `);
    });
  })
  .catch((err) => {
    console.log("❌ Database connection failed:", err);
    process.exit(1);
  });
