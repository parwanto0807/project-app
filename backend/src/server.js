// server.js - PRODUCTION FIXED VERSION
import { connectDB } from "./config/db.js";
import app from "./app.js";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../src/config/db.js";

// Environment variables
const isProduction = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Helper function untuk parse cookies
const parseCookies = (cookieHeader) => {
  if (!cookieHeader) return {};
  
  const cookies = {};
  try {
    cookieHeader.split(";").forEach((cookie) => {
      const parts = cookie.trim().split("=");
      if (parts.length >= 2) {
        const key = parts[0];
        const value = parts.slice(1).join("=");
        cookies[key] = decodeURIComponent(value);
      }
    });
  } catch (error) {
    console.error("[Cookie] Parse error:", error);
  }
  return cookies;
};

// 1️⃣ Buat HTTP server untuk Express
const server = http.createServer(app);

// Storage untuk pending updates
const userRoleCache = new Map();

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
    setTimeout(() => userRoleCache.delete(userId), 5 * 60 * 1000);

    return role;
  } catch (error) {
    console.error(`[Server] ❌ Error fetching role for ${userId}:`, error);
    return "user";
  }
};

// 2️⃣ **PRODUCTION FIX: Socket.IO Configuration**
// List of allowed origins
const allowedOrigins = isProduction
  ? [
      FRONTEND_URL,
      "https://rylif-app.com",
      "https://www.rylif-app.com",
      "https://api.rylif-app.com",
      "http://localhost:3000",
      "http://localhost:5173"
    ]
  : ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"];

export const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // ✅ PRODUCTION FIX: Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        console.log('[CORS] Direct connection (no origin)');
        return callback(null, true);
      }
      
      // ✅ PRODUCTION FIX: Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        console.log(`[CORS] ✅ Allowed origin: ${origin}`);
        return callback(null, true);
      }
      
      // ✅ PRODUCTION FIX: Check for subdomains in production
      if (isProduction && origin.endsWith('.rylif-app.com')) {
        console.log(`[CORS] ✅ Allowed subdomain: ${origin}`);
        return callback(null, true);
      }
      
      // ✅ PRODUCTION FIX: Development localhost
      if (!isProduction && origin.startsWith('http://localhost:')) {
        console.log(`[CORS] ✅ Development: ${origin}`);
        return callback(null, true);
      }
      
      console.log(`[CORS] ❌ Blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "X-Access-Token",
      "X-Refresh-Token"
    ]
  },
  // ✅ PRODUCTION FIX: Cookie settings
  cookie: {
    name: "io",
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax", // ⚠️ Penting untuk cross-domain
    secure: isProduction, // ⚠️ HTTPS required in production
    path: "/",
    maxAge: 86400000 // 24 hours
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  maxHttpBufferSize: 1e6,
  // ✅ PRODUCTION FIX: Connection recovery
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true
  }
});

// 3️⃣ **PRODUCTION FIX: Trust Proxy**
if (isProduction) {
  app.set("trust proxy", 1); // Trust first proxy
  console.log("[Server] ✅ Production mode: Trust proxy enabled");
}

// 4️⃣ Middleware untuk authentication - IMPROVED untuk production
io.use(async (socket, next) => {
  try {
    console.log(`[Auth] Attempt for socket: ${socket.id}`);

    // ✅ PRODUCTION FIX: Multiple token sources
    let token = null;
    
    // 1. From cookies (primary)
    const cookieHeader = socket.request.headers.cookie;
    if (cookieHeader) {
      const cookies = parseCookies(cookieHeader);
      const possibleTokenKeys = [
        "accessToken", "token", "jwt", 
        "auth_token", "access_token", "auth-token"
      ];
      
      for (const key of possibleTokenKeys) {
        if (cookies[key]) {
          token = cookies[key];
          console.log(`✅ [${socket.id}] Token from cookie: ${key}`);
          break;
        }
      }
    }
    
    // 2. From handshake auth (fallback for mobile/SPA)
    if (!token && socket.handshake.auth?.token) {
      token = socket.handshake.auth.token;
      console.log(`✅ [${socket.id}] Token from handshake auth`);
    }
    
    // 3. From query parameters (additional fallback)
    if (!token && socket.handshake.query?.token) {
      token = socket.handshake.query.token;
      console.log(`✅ [${socket.id}] Token from query params`);
    }

    if (!token) {
      console.log(`❌ [${socket.id}] No token found`);
      return next(new Error("Authentication error: No token provided"));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    
    if (!userId) {
      console.log(`❌ [${socket.id}] No userId in token`);
      return next(new Error("Authentication error: Invalid token payload"));
    }

    socket.userId = userId;
    socket.user = decoded;

    // Get user role
    try {
      const userRole = await getUserRole(userId);
      socket.userRole = userRole;
      console.log(`👤 [${socket.id}] User ${userId} role: ${userRole}`);
    } catch (roleError) {
      console.error(`❌ [${socket.id}] Error getting role:`, roleError);
      socket.userRole = "user";
    }

    console.log(
      `✅ [${socket.id}] Authenticated user: ${userId} (${socket.userRole})`
    );
    next();
  } catch (error) {
    console.error(`❌ [Socket] Authentication error:`, error.message);
    
    // Detailed error responses for production
    if (error.name === "JsonWebTokenError") {
      return next(new Error("Invalid authentication token"));
    } else if (error.name === "TokenExpiredError") {
      return next(new Error("Authentication token expired"));
    } else if (error.name === "NotBeforeError") {
      return next(new Error("Token not yet valid"));
    }
    
    return next(new Error("Authentication failed"));
  }
});

// ============ HELPER FUNCTIONS ============

// Function untuk get sessions berdasarkan role
async function getSessionsBasedOnRole(userId, userRole) {
  console.log(`[Server] 🔍 Querying sessions for ${userRole} ${userId}`);

  try {
    if (userRole === "super" || userRole === "admin") {
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
        take: 100 // Limit for performance
      });

      console.log(`[Server] 📊 Admin gets ${sessions.length} sessions`);
      return sessions;
    } else {
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

      console.log(`[Server] 📊 User gets ${sessions.length} sessions`);
      return sessions;
    }
  } catch (error) {
    console.error("[Server] ❌ Query error:", error.message);
    return [];
  }
}

// ✅ PRODUCTION FIX: Format sessions untuk response
const formatSessionsForResponse = (sessions, currentSocket = null) => {
  if (!Array.isArray(sessions)) {
    console.warn('[Format] Sessions is not an array:', sessions);
    return [];
  }
  
  return sessions.map((session) => {
    const isCurrentSession = currentSocket?.userSessionToken === session.sessionToken;
    
    // Format yang konsisten untuk frontend
    return {
      id: session.id || '',
      userId: session.userId || '',
      userAgent: session.userAgent || "Unknown Browser",
      ipAddress: session.ipAddress || "0.0.0.0",
      isRevoked: Boolean(session.isRevoked || false),
      isCurrent: isCurrentSession,
      createdAt: session.createdAt ? session.createdAt.toISOString() : new Date().toISOString(),
      expiresAt: session.expiresAt ? session.expiresAt.toISOString() : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      revokedAt: session.revokedAt ? session.revokedAt.toISOString() : null,
      lastActiveAt: session.lastActiveAt ? session.lastActiveAt.toISOString() : null,
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
        ? `${session.sessionToken.substring(0, 10)}...${session.sessionToken.substring(session.sessionToken.length - 5)}`
        : "No token",
    };
  });
};

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
const broadcastToAdmins = async (event, data = {}) => {
  try {
    console.log(`📤 [Broadcast] ${event} to all admins`);

    // Get all sessions for admins
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
      take: 100
    });

    const formattedSessions = formatSessionsForResponse(allSessions);
    
    // Emit ke semua connected admin sockets
    let adminCount = 0;
    io.sockets.sockets.forEach((socket) => {
      if (socket.userRole === "super" || socket.userRole === "admin") {
        socket.emit(event, { 
          sessions: formattedSessions,
          timestamp: new Date().toISOString(),
          source: "admin-broadcast"
        });
        adminCount++;
      }
    });

    console.log(`✅ [Broadcast] Sent to ${adminCount} admins`);
  } catch (error) {
    console.error(`❌ [Broadcast] Error:`, error);
  }
};

// Function untuk broadcast session updates ke specific user
const broadcastToUser = async (userId, event, data = {}) => {
  try {
    console.log(`📤 [User Broadcast] ${event} to user:${userId}`);

    const userSessions = await getSessionsBasedOnRole(userId, "user");
    const formattedSessions = formatSessionsForResponse(userSessions);

    const room = `user:${userId}`;
    const roomSockets = io.sockets.adapter.rooms.get(room);
    const roomSize = roomSockets ? roomSockets.size : 0;

    if (roomSize > 0) {
      io.to(room).emit(event, { 
        sessions: formattedSessions,
        timestamp: new Date().toISOString(),
        source: "user-broadcast"
      });
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
    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    await prisma.userSession.update({
      where: { id: sessionId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        sessionToken: null,
        refreshToken: null,
        lastActiveAt: new Date(),
      },
    });

    console.log(`✅ Session ${sessionId.substring(0, 8)} revoked`);

    if (session.sessionToken) {
      io.sockets.sockets.forEach((sock) => {
        if (sock.userSessionToken === session.sessionToken && sock.id !== currentSocketId) {
          sock.emit("session:force-logout", {
            message: "Session revoked by admin/user",
            timestamp: new Date().toISOString(),
          });

          setTimeout(() => {
            sock.disconnect(true);
            console.log(`🔌 Force disconnected socket ${sock.id}`);
          }, 1000);
        }
      });
    }

    // Broadcast updates dengan format yang konsisten
    const userSessions = await getSessionsBasedOnRole(
      session.userId,
      session.user?.role || "user"
    );
    
    const formattedSessions = formatSessionsForResponse(userSessions);

    await broadcastToUser(session.userId, "session:updated", {
      sessions: formattedSessions,
      revokedSessionId: sessionId,
    });

    await broadcastToAdmins("session:updated");

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

  // ✅ PRODUCTION FIX: Send welcome message immediately
  socket.emit("welcome", {
    message: "Connected to real-time server",
    socketId: socket.id,
    userId: socket.userId,
    timestamp: new Date().toISOString()
  });

  // Join rooms berdasarkan role
  if (socket.userId) {
    socket.join(`user:${socket.userId}`);
    console.log(`👤 ${socket.userId} joined personal room`);

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
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            lastActiveAt: new Date(),
            isRevoked: false,
          },
        });
        console.log(
          `[Server] 💾 Created session: ${newSession.id.substring(0, 8)}`
        );
      }

      socket.userSessionToken = sessionToken;

      // Send initial sessions to this socket
      setTimeout(async () => {
        try {
          const sessions = await getSessionsBasedOnRole(socket.userId, socket.userRole);
          const formattedSessions = formatSessionsForResponse(sessions, socket);
          
          socket.emit("session:updated", {
            sessions: formattedSessions,
            timestamp: new Date().toISOString(),
            type: "initial",
            source: "connection"
          });
          
          console.log(`[Server] 📤 Sent ${formattedSessions.length} initial sessions to ${socket.id}`);
        } catch (error) {
          console.error("[Server] ❌ Error sending initial sessions:", error);
        }
      }, 1000);

      // Broadcast to admins
      setTimeout(async () => {
        await broadcastToAdmins("session:updated");
      }, 1500);
      
    } catch (error) {
      console.error("[Server] ❌ Error handling session:", error.message);
    }
  }

  // ✅ FIXED: Handle session:get-latest dengan format yang konsisten
  socket.on("session:get-latest", async () => {
    console.log(
      `[Server] 📨 ${socket.userRole} ${socket.userId} requesting sessions`
    );

    if (!socket.userId) {
      console.log("[Server] ❌ No userId found");
      socket.emit("session:updated", { 
        sessions: [],
        timestamp: new Date().toISOString(),
        error: "User not authenticated"
      });
      return;
    }

    try {
      const sessions = await getSessionsBasedOnRole(socket.userId, socket.userRole);
      const formattedSessions = formatSessionsForResponse(sessions, socket);

      console.log(
        `[Server] 📤 Sending ${formattedSessions.length} sessions to ${socket.id}`
      );

      // ✅ PRODUCTION FIX: Always send with consistent format
      socket.emit("session:updated", {
        sessions: formattedSessions,
        timestamp: new Date().toISOString(),
        type: "latest",
        count: formattedSessions.length
      });
    } catch (error) {
      console.error("[Server] ❌ Error:", error.message);
      socket.emit("session:updated", { 
        sessions: [],
        timestamp: new Date().toISOString(),
        error: "Failed to get sessions"
      });
    }
  });

  // Handle session:revoke
  socket.on("session:revoke", async (data) => {
    console.log("🔨 Session revoke request:", data?.sessionId);

    if (!data?.sessionId) {
      socket.emit("session:error", {
        message: "Session ID is required",
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      await revokeSessionById(data.sessionId, socket.id);

      socket.emit("session:revoke-success", {
        sessionId: data.sessionId,
        message: "Session revoked successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("[Server] ❌ Error revoking session:", error);
      socket.emit("session:error", {
        message: "Failed to revoke session",
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle logout other
  socket.on("session:logout-other", async () => {
    console.log("🚪 Logout other devices request from:", socket.userId);

    if (!socket.userId) {
      return socket.emit("session:error", {
        message: "User not authenticated",
        timestamp: new Date().toISOString()
      });
    }

    try {
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
          lastActiveAt: new Date(),
        },
      });

      console.log(`[Server] ✅ Revoked ${result.count} other sessions`);

      // Broadcast to other devices
      socket.broadcast.emit("session:logout-other", {
        userId: socket.userId,
        timestamp: new Date().toISOString(),
        currentSocketId: socket.id,
        revokedCount: result.count
      });

      // Send updated sessions to this user
      const userSessions = await getSessionsBasedOnRole(socket.userId, socket.userRole);
      const formattedSessions = formatSessionsForResponse(userSessions, socket);
      
      await broadcastToUser(socket.userId, "session:updated", {
        sessions: formattedSessions,
        type: "logout-other"
      });

      // Broadcast to admins
      await broadcastToAdmins("session:updated");
      
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

    if (socket.userId && socket.userSessionToken) {
      try {
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
        
        console.log(`[Server] 📝 Session revoked on disconnect`);

        setTimeout(async () => {
          await broadcastToAdmins("session:updated");
        }, 500);
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

export const emitSessionUpdate = async (
  userId,
  eventType = "session:updated"
) => {
  try {
    if (!io) {
      console.error("❌ Socket.io not initialized");
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const userRole = user?.role || "user";
    const sessions = await getSessionsBasedOnRole(userId, userRole);
    const formattedSessions = formatSessionsForResponse(sessions);

    const userRoom = `user:${userId}`;
    const userRoomSize = io.sockets.adapter.rooms.get(userRoom)?.size || 0;

    if (userRoomSize > 0) {
      io.to(userRoom).emit(eventType, { 
        sessions: formattedSessions,
        timestamp: new Date().toISOString(),
        source: "external"
      });
      console.log(`✅ [Emit] Session update sent to user ${userId}`);
    }

    if (userRole !== "super" && userRole !== "admin") {
      await broadcastToAdmins("session:updated");
    }
  } catch (error) {
    console.error("[Emit] Error emitting session update:", error);
  }
};

// 7️⃣ Jalankan server
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log("========================================");
      console.log("🚀 SERVER STARTED SUCCESSFULLY");
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌍 Environment: ${isProduction ? "PRODUCTION" : "DEVELOPMENT"}`);
      console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
      console.log(`🔒 HTTPS: ${isProduction ? "REQUIRED" : "DISABLED"}`);
      console.log(`🍪 Cookies: ${isProduction ? "SECURE" : "INSECURE"}`);
      console.log("========================================");
      console.log(`✅ Socket.IO ready on ws://localhost:${PORT}`);
      console.log(`✅ CORS enabled for: ${allowedOrigins.join(", ")}`);
    });
  })
  .catch((err) => {
    console.log("❌ Database connection failed:", err);
    process.exit(1);
  });
