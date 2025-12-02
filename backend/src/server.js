// server.js - COMPLETE PRODUCTION FIXED VERSION
import { connectDB } from "./config/db.js";
import app from "./app.js";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../src/config/db.js";

// ============ CONFIGURATION ============
const isProduction = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 5000;

// Domain configuration
const FRONTEND_URL = isProduction 
  ? "https://rylif-app.com" 
  : "http://localhost:3000";

const API_URL = isProduction
  ? "https://api.rylif-app.com"
  : "http://localhost:5000";

console.log("=".repeat(50));
console.log("🚀 Socket.IO Server Starting");
console.log(`🌍 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`📡 Port: ${PORT}`);
console.log(`🔗 Frontend: ${FRONTEND_URL}`);
console.log(`🔗 API: ${API_URL}`);
console.log("=".repeat(50));

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

// ============ INITIALIZE SERVER ============
const server = http.createServer(app);

// Storage
const userRoleCache = new Map();

// Function untuk mendapatkan user role
const getUserRole = async (userId) => {
  if (userRoleCache.has(userId)) return userRoleCache.get(userId);
  
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
    console.error(`[Server] ❌ Error fetching role:`, error);
    return "user";
  }
};

// ============ SOCKET.IO CONFIGURATION ============
// Allowed origins for production
const allowedOrigins = isProduction
  ? [
      "https://rylif-app.com",
      "https://www.rylif-app.com",
      "https://api.rylif-app.com",
      "http://localhost:3000",
      "http://localhost:5173"
    ]
  : [
      "http://localhost:3000",
      "http://localhost:5173", 
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      "http://localhost:5000"
    ];

// Create Socket.IO server
export const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // ⚠️ FIX: Allow requests without origin (mobile apps, curl, etc.)
      if (!origin) {
        console.log('[CORS] Direct connection (no origin)');
        return callback(null, true);
      }
      
      // ⚠️ FIX: Check if origin is allowed
      if (allowedOrigins.includes(origin)) {
        console.log(`[CORS] ✅ Allowed origin: ${origin}`);
        return callback(null, true);
      }
      
      // ⚠️ FIX: For development, allow localhost variations
      if (!isProduction && origin.includes('localhost')) {
        console.log(`[CORS] ✅ Development origin: ${origin}`);
        return callback(null, true);
      }
      
      // ⚠️ FIX: For production, allow subdomains
      if (isProduction && origin.includes('rylif-app.com')) {
        console.log(`[CORS] ✅ Production subdomain: ${origin}`);
        return callback(null, true);
      }
      
      console.log(`[CORS] ❌ Blocked origin: ${origin}`);
      return callback(new Error('CORS not allowed'), false);
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
      "X-Refresh-Token",
      "Cookie"
    ]
  },
  // ⚠️ PENTING: Cookie settings
  cookie: {
    name: "io",
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/",
    maxAge: 86400000
  },
  // ⚠️ PENTING: Transport configuration
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 30000,
  maxHttpBufferSize: 1e6,
  // ⚠️ PENTING: WebSocket specific
  allowUpgrades: true,
  upgradeTimeout: 10000,
  // ⚠️ PENTING: Path untuk Socket.IO
  path: "/socket.io/",
  // ⚠️ PENTING: CORS preflight
  handlePreflightRequest: (req, res) => {
    const origin = req.headers.origin;
    const headers = {
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Cookie",
      "Access-Control-Allow-Origin": origin || FRONTEND_URL,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
    };
    res.writeHead(200, headers);
    res.end();
  }
});

// ============ PRODUCTION SETTINGS ============
if (isProduction) {
  // Trust proxy untuk mendapatkan real IP
  app.set("trust proxy", 1);
  
  // Tambahkan CORS middleware untuk Express
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Set CORS headers
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cookie');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });
  
  console.log("[Server] ✅ Production settings applied");
}

// ============ AUTHENTICATION MIDDLEWARE ============
io.use(async (socket, next) => {
  try {
    console.log(`[Auth] Socket ${socket.id} attempting authentication`);
    
    let token = null;
    
    // 1. Check cookies first
    const cookieHeader = socket.request.headers.cookie;
    if (cookieHeader) {
      const cookies = parseCookies(cookieHeader);
      const tokenKeys = ["accessToken", "token", "jwt", "auth_token", "access_token"];
      for (const key of tokenKeys) {
        if (cookies[key]) {
          token = cookies[key];
          console.log(`[Auth] ✅ Token found in cookie: ${key}`);
          break;
        }
      }
    }
    
    // 2. Check handshake auth
    if (!token && socket.handshake.auth?.token) {
      token = socket.handshake.auth.token;
      console.log(`[Auth] ✅ Token from handshake auth`);
    }
    
    // 3. Check query parameters
    if (!token && socket.handshake.query?.token) {
      token = socket.handshake.query.token;
      console.log(`[Auth] ✅ Token from query params`);
    }
    
    if (!token) {
      console.log(`[Auth] ❌ No token found for socket ${socket.id}`);
      return next(new Error("Authentication token required"));
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    
    if (!userId) {
      console.log(`[Auth] ❌ Invalid token payload for socket ${socket.id}`);
      return next(new Error("Invalid token payload"));
    }
    
    // Get user role
    const userRole = await getUserRole(userId);
    
    // Attach user data to socket
    socket.userId = userId;
    socket.userRole = userRole;
    socket.user = decoded;
    
    console.log(`[Auth] ✅ Authenticated: ${userId} (${userRole}) on socket ${socket.id}`);
    next();
    
  } catch (error) {
    console.error(`[Auth] ❌ Error for socket ${socket.id}:`, error.message);
    
    if (error.name === "TokenExpiredError") {
      return next(new Error("Token expired. Please login again"));
    } else if (error.name === "JsonWebTokenError") {
      return next(new Error("Invalid token format"));
    } else if (error.name === "NotBeforeError") {
      return next(new Error("Token not yet valid"));
    }
    
    return next(new Error("Authentication failed"));
  }
});

// ============ HELPER FUNCTIONS ============

// Function untuk get sessions berdasarkan role
async function getSessionsBasedOnRole(userId, userRole) {
  try {
    if (userRole === "super" || userRole === "admin") {
      // Admin gets all active sessions
      return await prisma.userSession.findMany({
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
    } else {
      // Regular user gets only their sessions
      return await prisma.userSession.findMany({
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
    }
  } catch (error) {
    console.error("[Server] ❌ Error getting sessions:", error);
    return [];
  }
}

// Format sessions untuk response
const formatSessionsForResponse = (sessions, currentSocket = null) => {
  if (!Array.isArray(sessions)) return [];
  
  return sessions.map((session) => {
    const isCurrentSession = currentSocket?.userSessionToken === session.sessionToken;
    
    return {
      id: session.id || '',
      userId: session.userId || '',
      userAgent: session.userAgent || "Unknown Browser",
      ipAddress: session.ipAddress || "0.0.0.0",
      isRevoked: Boolean(session.isRevoked || false),
      isCurrent: isCurrentSession,
      createdAt: session.createdAt ? session.createdAt.toISOString() : new Date().toISOString(),
      expiresAt: session.expiresAt ? session.expiresAt.toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      revokedAt: session.revokedAt ? session.revokedAt.toISOString() : null,
      lastActiveAt: session.lastActiveAt ? session.lastActiveAt.toISOString() : null,
      user: session.user || {
        id: "unknown",
        name: "Unknown User",
        email: "unknown@example.com",
        role: "user",
      }
    };
  });
};

// Get client IP
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

// Broadcast to user
const broadcastToUser = async (userId, event, data = {}) => {
  try {
    const room = `user:${userId}`;
    const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;
    
    if (roomSize > 0) {
      io.to(room).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
      console.log(`[Broadcast] 📤 To user ${userId}: ${event} (${roomSize} sockets)`);
      return true;
    } else {
      console.log(`[Broadcast] ⚠️ User ${userId} not connected`);
      return false;
    }
  } catch (error) {
    console.error(`[Broadcast] Error:`, error);
    return false;
  }
};

// Broadcast to admins
const broadcastToAdmins = async (event, data = {}) => {
  try {
    let adminCount = 0;
    io.sockets.sockets.forEach((socket) => {
      if (socket.userRole === "super" || socket.userRole === "admin") {
        socket.emit(event, {
          ...data,
          timestamp: new Date().toISOString()
        });
        adminCount++;
      }
    });
    
    if (adminCount > 0) {
      console.log(`[Broadcast] 📤 To ${adminCount} admins: ${event}`);
    }
    
    return adminCount;
  } catch (error) {
    console.error("[Broadcast] Error:", error);
    return 0;
  }
};

// Revoke session
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
        lastActiveAt: new Date(),
      },
    });

    console.log(`[Revoke] ✅ Session revoked: ${sessionId.substring(0, 8)}`);

    // Force disconnect jika session sedang aktif
    if (session.sessionToken) {
      io.sockets.sockets.forEach((sock) => {
        if (sock.userSessionToken === session.sessionToken && sock.id !== currentSocketId) {
          sock.emit("session:force-logout", {
            message: "Session revoked",
            timestamp: new Date().toISOString(),
          });
          
          setTimeout(() => sock.disconnect(true), 1000);
          console.log(`[Revoke] 🔌 Disconnecting socket: ${sock.id}`);
        }
      });
    }

    return session;
  } catch (error) {
    console.error("[Revoke] Error:", error);
    throw error;
  }
};

// ============ SOCKET EVENT HANDLERS ============

io.on("connection", async (socket) => {
  const userId = socket.userId;
  const socketId = socket.id;
  const role = socket.userRole;
  
  console.log(`✅ [Socket] Connected: ${socketId} | User: ${userId} | Role: ${role}`);
  
  // ⚠️ FIX: Send immediate response untuk testing connection
  socket.emit("connected", {
    message: "Socket connected successfully",
    socketId: socketId,
    userId: userId,
    timestamp: new Date().toISOString()
  });
  
  // Join rooms
  if (userId) {
    socket.join(`user:${userId}`);
    console.log(`👤 [Socket] ${userId} joined personal room`);
    
    if (role === "super" || role === "admin") {
      socket.join("room:admins");
      console.log(`👑 [Socket] ${userId} joined admin room`);
    }
  }
  
  // Create session for this socket connection
  if (userId) {
    try {
      const sessionToken = `socket-${socketId}-${Date.now()}`;
      const clientIP = getClientIP(socket);
      const userAgent = socket.handshake.headers["user-agent"] || "Unknown";
      
      // Check for existing session
      const existingSession = await prisma.userSession.findFirst({
        where: {
          userId: userId,
          sessionToken: { contains: `socket-${socketId}` },
          isRevoked: false,
        },
      });
      
      if (existingSession) {
        // Update existing session
        await prisma.userSession.update({
          where: { id: existingSession.id },
          data: {
            sessionToken: sessionToken,
            lastActiveAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
        console.log(`[Session] 🔄 Updated: ${existingSession.id.substring(0, 8)}`);
      } else {
        // Create new session
        const newSession = await prisma.userSession.create({
          data: {
            userId: userId,
            sessionToken: sessionToken,
            refreshToken: `refresh-${socketId}-${Date.now()}`,
            ipAddress: clientIP,
            userAgent: userAgent,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            lastActiveAt: new Date(),
            isRevoked: false,
          },
        });
        console.log(`[Session] 💾 Created: ${newSession.id.substring(0, 8)}`);
      }
      
      socket.userSessionToken = sessionToken;
      
      // Send initial sessions
      setTimeout(async () => {
        try {
          const sessions = await getSessionsBasedOnRole(userId, role);
          const formattedSessions = formatSessionsForResponse(sessions, socket);
          
          socket.emit("session:updated", {
            sessions: formattedSessions,
            timestamp: new Date().toISOString(),
            type: "initial"
          });
          
          console.log(`[Server] 📤 Sent ${formattedSessions.length} initial sessions to ${socketId}`);
        } catch (error) {
          console.error("[Server] ❌ Error sending initial sessions:", error);
        }
      }, 1000);
      
    } catch (error) {
      console.error("[Session] ❌ Error:", error);
    }
  }
  
  // ============ EVENT LISTENERS ============
  
  // Ping handler
  socket.on("ping", () => {
    const sendTime = Date.now();
    socket.emit("pong", sendTime);
    console.log(`🏓 [Socket] Ping from ${socketId}`);
  });
  
  // Get latest sessions
  socket.on("session:get-latest", async () => {
    console.log(`[Server] 📨 ${role} ${userId} requesting sessions`);
    
    if (!userId) {
      return socket.emit("session:updated", {
        sessions: [],
        timestamp: new Date().toISOString(),
        error: "User not authenticated"
      });
    }
    
    try {
      const sessions = await getSessionsBasedOnRole(userId, role);
      const formattedSessions = formatSessionsForResponse(sessions, socket);
      
      socket.emit("session:updated", {
        sessions: formattedSessions,
        timestamp: new Date().toISOString(),
        type: "latest",
        count: formattedSessions.length
      });
      
      console.log(`[Server] 📤 Sent ${formattedSessions.length} sessions to ${socketId}`);
    } catch (error) {
      console.error("[Server] ❌ Error:", error);
      socket.emit("session:updated", {
        sessions: [],
        timestamp: new Date().toISOString(),
        error: "Failed to get sessions"
      });
    }
  });
  
  // Revoke session
  socket.on("session:revoke", async (data) => {
    console.log(`[Server] 🔨 Revoke request from ${socketId}:`, data?.sessionId);
    
    if (!data?.sessionId) {
      return socket.emit("session:error", {
        message: "Session ID is required",
        timestamp: new Date().toISOString()
      });
    }
    
    try {
      const session = await prisma.userSession.findUnique({
        where: { id: data.sessionId }
      });
      
      if (!session) {
        return socket.emit("session:error", {
          message: "Session not found",
          timestamp: new Date().toISOString()
        });
      }
      
      // Check permissions
      if (session.userId !== userId && role !== "super" && role !== "admin") {
        return socket.emit("session:error", {
          message: "Permission denied",
          timestamp: new Date().toISOString()
        });
      }
      
      await revokeSessionById(data.sessionId, socketId);
      
      // Broadcast updates
      const updatedSessions = await getSessionsBasedOnRole(session.userId, role);
      const formattedSessions = formatSessionsForResponse(updatedSessions, socket);
      
      await broadcastToUser(session.userId, "session:updated", {
        sessions: formattedSessions,
        revokedSessionId: data.sessionId
      });
      
      await broadcastToAdmins("session:updated");
      
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
  
  // Logout other devices
  socket.on("session:logout-other", async () => {
    console.log(`[Server] 🚪 Logout other devices request from ${userId}`);
    
    if (!userId) {
      return socket.emit("session:error", {
        message: "User not authenticated",
        timestamp: new Date().toISOString()
      });
    }
    
    try {
      const result = await prisma.userSession.updateMany({
        where: {
          userId: userId,
          sessionToken: { not: socket.userSessionToken },
          isRevoked: false,
        },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          lastActiveAt: new Date(),
        },
      });
      
      console.log(`[Server] ✅ Revoked ${result.count} other sessions`);
      
      // Force disconnect other sockets
      io.sockets.sockets.forEach((sock) => {
        if (sock.userId === userId && sock.id !== socketId) {
          sock.emit("session:force-logout", {
            message: "Logged out from other device",
            timestamp: new Date().toISOString()
          });
          
          setTimeout(() => sock.disconnect(true), 1000);
        }
      });
      
      // Send updated sessions
      const sessions = await getSessionsBasedOnRole(userId, role);
      const formattedSessions = formatSessionsForResponse(sessions, socket);
      
      await broadcastToUser(userId, "session:updated", {
        sessions: formattedSessions,
        type: "logout-other",
        revokedCount: result.count
      });
      
      await broadcastToAdmins("session:updated");
      
      socket.emit("session:logout-other-success", {
        count: result.count,
        message: "Other devices logged out",
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("[Server] ❌ Error logging out other devices:", error);
      socket.emit("session:error", {
        message: "Failed to logout other devices",
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Heartbeat
  const heartbeatInterval = setInterval(() => {
    if (socket.connected) {
      socket.emit("heartbeat", { timestamp: Date.now() });
    }
  }, 30000);
  
  socket.on("heartbeat-response", () => {
    if (socket.userSessionToken) {
      prisma.userSession.updateMany({
        where: { sessionToken: socket.userSessionToken },
        data: { lastActiveAt: new Date() }
      }).catch(console.error);
    }
  });
  
  // Disconnect handler
  socket.on("disconnect", async (reason) => {
    console.log(`❌ [Socket] Disconnected: ${socketId} | Reason: ${reason}`);
    
    // Clear heartbeat interval
    clearInterval(heartbeatInterval);
    
    // Mark session as revoked
    if (userId && socket.userSessionToken) {
      try {
        await prisma.userSession.updateMany({
          where: {
            sessionToken: socket.userSessionToken,
            userId: userId,
            isRevoked: false,
          },
          data: {
            isRevoked: true,
            revokedAt: new Date(),
            lastActiveAt: new Date(),
          },
        });
        
        console.log(`[Server] 📝 Session revoked on disconnect`);
        
        // Notify admins
        setTimeout(async () => {
          try {
            await broadcastToAdmins("session:updated");
          } catch (error) {
            console.error("[Broadcast] Error on disconnect:", error);
          }
        }, 1000);
        
      } catch (error) {
        console.error("[Server] ❌ Error updating session on disconnect:", error);
      }
    }
  });
  
  // Error handler
  socket.on("error", (error) => {
    console.error(`[Socket] Error on ${socketId}:`, error);
  });
});

// ============ START SERVER ============
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log("=".repeat(50));
      console.log("✅ SERVER RUNNING SUCCESSFULLY");
      console.log(`📡 Server URL: ${API_URL}`);
      console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
      console.log(`🌍 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
      console.log(`🔒 HTTPS: ${isProduction ? 'ENABLED' : 'DISABLED'}`);
      console.log(`🍪 Cookies: ${isProduction ? 'SECURE' : 'INSECURE'}`);
      console.log(`🔄 Transports: websocket, polling`);
      console.log("=".repeat(50));
      
      // Health check endpoint
      app.get("/health", (req, res) => {
        res.json({
          status: "healthy",
          timestamp: new Date().toISOString(),
          socketIo: "running",
          environment: process.env.NODE_ENV,
          port: PORT
        });
      });
      
      // Socket.IO test endpoint
      app.get("/socket-test", (req, res) => {
        res.json({
          message: "Socket.IO server is running",
          socketCount: io.engine.clientsCount,
          timestamp: new Date().toISOString()
        });
      });
    });
  })
  .catch((error) => {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  });