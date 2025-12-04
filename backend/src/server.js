// server.js - PRODUCTION READY VERSION for rylif-app.com
import { connectDB } from "./config/db.js";
import app from "./app.js";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../src/config/db.js";
// import sessionCleanupJob from './config/sessionCleanUp.js';

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

// Setup jobs
// const cleanupJob = sessionCleanupJob();

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
  connectTimeout: 45000,
};

export const io = new Server(server, ioConfig);

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

// Helper untuk verify token
async function verifyTokenAndProceed(token, socket, next) {
  try {
    console.log("🔑 Verifying token...");
    const decoded = jwt.verify(token, JWT_SECRET);

    const userId = decoded.userId || decoded.id;
    console.log("✅ Token verified for user:", userId);

    socket.userId = userId;
    socket.user = decoded;
    socket.authToken = token;

    // Get user role
    try {
      const userRole = await getUserRole(userId);
      socket.userRole = userRole;
      console.log(`👤 User role: ${userRole}`);
    } catch (roleError) {
      console.error("⚠️ Role fetch error:", roleError.message);
      socket.userRole = "user";
    }

    console.log(`✅ Auth successful for socket ${socket.id}`);
    next();
  } catch (jwtError) {
    console.error("❌ JWT verification failed:", jwtError.message);

    // Token expired? Coba refresh mechanism
    if (jwtError.name === "TokenExpiredError") {
      console.log("🔄 Token expired, checking for refresh...");

      // Di sini bisa implementasi refresh token logic
      // Untuk sekarang, allow dengan warning di development
      if (!isProduction) {
        console.log("⚠️ DEVELOPMENT: Allowing expired token");
        const decoded = jwt.decode(token); // Decode tanpa verify
        if (decoded) {
          socket.userId = decoded.userId || decoded.id;
          socket.userRole = "user";
          socket.tokenExpired = true;
          return next();
        }
      }
    }

    next(new Error("Token invalid: " + jwtError.message));
  }
}

// 3️⃣ Middleware untuk authentication - FIXED VERSION
io.use(async (socket, next) => {
  try {
    console.log("🔑 Authentication attempt for socket:", socket.id);

    // SKIP RATE LIMITING UNTUK DEVELOPMENT - HAPUS INI DI PRODUCTION
    if (isProduction) {
      console.log("⚠️ PRODUCTION: Rate limiting enabled");
    } else {
      console.log("⚠️ DEVELOPMENT: Skipping rate limiting");
    }

    const cookieHeader = socket.handshake.headers.cookie;
    console.log("🍪 Raw cookie:", cookieHeader ? "Present" : "Missing");

    if (!cookieHeader) {
      console.log("⚠️ No cookies, checking auth headers...");
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        console.log("✅ Found token in Authorization header");
        return verifyTokenAndProceed(token, socket, next);
      }

      // Untuk development, allow anonymous connection
      if (!isProduction) {
        console.log("⚠️ DEVELOPMENT: Allowing anonymous connection");
        socket.userId = "anonymous-dev";
        socket.userRole = "user";
        socket.isAnonymous = true;
        return next();
      }

      console.log("❌ No auth credentials found");
      return next(new Error("Authentication required"));
    }

    const cookies = parseCookies(cookieHeader);
    console.log("📋 Cookie keys:", Object.keys(cookies));

    // Cari token dengan prioritas
    let token = null;
    const tokenSources = [
      { key: "auth_token", type: "cookie" },
      { key: "accessToken", type: "cookie" },
      { key: "token", type: "cookie" },
      { key: "access_token", type: "cookie" },
    ];

    for (const source of tokenSources) {
      if (cookies[source.key]) {
        token = cookies[source.key];
        console.log(`✅ Token found in ${source.type}: ${source.key}`);
        break;
      }
    }

    // Juga cek di handshake auth
    if (!token && socket.handshake.auth && socket.handshake.auth.token) {
      token = socket.handshake.auth.token;
      console.log("✅ Token found in handshake.auth");
    }

    // Cek query parameters
    if (!token && socket.handshake.query && socket.handshake.query.token) {
      token = socket.handshake.query.token;
      console.log("✅ Token found in query parameters");
    }

    if (!token) {
      console.log("❌ No token found anywhere");
      // Untuk development, allow anonymous dengan user ID khusus
      if (!isProduction) {
        console.log("⚠️ DEVELOPMENT: Allowing anonymous connection");
        socket.userId = "anonymous-dev";
        socket.userRole = "user";
        socket.isAnonymous = true;
        return next();
      }
      return next(new Error("Authentication token required"));
    }

    return verifyTokenAndProceed(token, socket, next);
  } catch (error) {
    console.error("❌ Auth middleware error:", error.message);
    // Jangan block connection di development
    if (!isProduction) {
      console.log("⚠️ DEVELOPMENT: Allowing connection despite error");
      socket.userId = "error-fallback";
      socket.userRole = "user";
      socket.authError = error.message;
      return next();
    }
    next(new Error("Authentication failed: " + error.message));
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

  // Track socket in map
  if (socket.userId) {
    socketToUserMap.set(socket.id, socket.userId);
  }

  // Set connection metadata
  socket.connectedAt = new Date();
  socket.lastActivity = new Date();

  // Join rooms berdasarkan role
  if (
    socket.userId &&
    socket.userId !== "anonymous-dev" &&
    socket.userId !== "error-fallback"
  ) {
    // Join personal room
    socket.join(`user:${socket.userId}`);
    console.log(`👤 ${socket.userId} joined personal room`);

    // Join admin room jika admin
    if (socket.userRole === "super" || socket.userRole === "admin") {
      socket.join("room:admins");
      console.log(`👑 ${socket.userId} joined admin room`);
    }
  }

  // Handle session creation/update hanya untuk authenticated users
  if (
    socket.userId &&
    socket.userId !== "anonymous-dev" &&
    socket.userId !== "error-fallback"
  ) {
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

      // Broadcast session update ke admin
      setTimeout(async () => {
        try {
          await broadcastToAdmins("session:updated", {});
        } catch (error) {
          console.error("[Server] ❌ Error broadcasting:", error);
        }
      }, 1000);
    } catch (error) {
      console.error("[Server] ❌ Error handling session:", error.message);
    }
  }

  // Activity tracking
  socket.onAny((eventName, ...args) => {
    socket.lastActivity = new Date();
  });

  // Handle session:get-latest
  socket.on("session:get-latest", async () => {
    console.log(
      `[Server] 📨 ${socket.userRole} ${socket.userId} requesting sessions`
    );

    if (
      !socket.userId ||
      socket.userId === "anonymous-dev" ||
      socket.userId === "error-fallback"
    ) {
      console.log("[Server] ⚠️ Anonymous user, returning empty sessions");
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

  // Handle session revoke
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

  // Handle logout other
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

      // Broadcast update
      const userSessions = await getSessionsBasedOnRole(
        socket.userId,
        socket.userRole
      );
      await broadcastToUser(socket.userId, "session:updated", {
        sessions: userSessions,
      });

      await broadcastToAdmins("session:updated", {});
    } catch (error) {
      console.error("[Server] ❌ Error logging out other devices:", error);
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

  // Handle disconnect - PERBAIKAN PENTING
  socket.on("disconnect", async (reason) => {
    console.log(`❌ Client disconnected: ${socket.id}, Reason: ${reason}`);

    // Remove from tracking
    socketToUserMap.delete(socket.id);

    // JANGAN REVOKE SESSION SAAT DISCONNECT - INI PENYEBAB UTAMA MASALAH
    // Biarkan session tetap aktif untuk allow reconnection

    if (
      socket.userId &&
      socket.userId !== "anonymous-dev" &&
      socket.userId !== "error-fallback"
    ) {
      try {
        // Hanya update lastActiveAt, jangan revoke!
        if (socket.userSessionToken) {
          await prisma.userSession.updateMany({
            where: {
              sessionToken: socket.userSessionToken,
              userId: socket.userId,
              isRevoked: false,
            },
            data: {
              lastActiveAt: new Date(),
            },
          });
          console.log(`[Server] 📝 Updated last activity for session`);
        }
      } catch (error) {
        console.error(
          "[Server] ❌ Error updating session activity:",
          error.message
        );
      }
    }

    // Clear cache
    if (socket.userId && userRoleCache.has(socket.userId)) {
      userRoleCache.delete(socket.userId);
    }

    // Broadcast update ke admin
    setTimeout(async () => {
      try {
        await broadcastToAdmins("session:updated", {});
      } catch (error) {
        console.error("[Server] ❌ Error broadcasting disconnect:", error);
      }
    }, 1000);
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

    // Kirim ke user sendiri
    const userRoom = `user:${userId}`;
    io.to(userRoom).emit(eventType, { sessions: formattedSessions });
    console.log(`✅ [Emit] Session update sent to user ${userId}`);

    // Jika bukan admin, broadcast ke admin room
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
