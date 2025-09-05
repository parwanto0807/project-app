import jwt from "jsonwebtoken";
import cookie from "cookie";
import checkIfNewDevice from "../utils/cekNewDevices.js";
import { PrismaClient } from "../../prisma/generated/prisma/index.js";

const prisma = new PrismaClient();

async function verifySessionToken(req, res, next) {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const sessionToken = cookies.session_token;

    if (!sessionToken) {
      return res
        .status(401)
        .json({ message: "Unauthorized - Session token missing" });
    }

    const session = await prisma.trustedDeviceSession.findUnique({
      where: { sessionToken },
    });

    if (!session || session.isRevoked) {
      return res
        .status(401)
        .json({ message: "Unauthorized - Session invalid or revoked" });
    }

    if (new Date() > session.expiresAt) {
      return res.status(401).json({ message: "Session expired" });
    }

    // Inject user ID ke request (untuk ambil data user nanti)
    req.user = { id: session.userId };
    next();
  } catch (err) {
    console.error("[verifySessionToken ERROR]", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function checkMFAStatus(req, res, next) {
  //  console.log("[MFA STATUS MIDDLEWARE 1]", req.user);

  // Handle both JWT token (userId) and session token (id)
  const userId = req.user?.userId || req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const deviceId = req.headers["x-device-id"] || req.ip;
  const isNewDevice = await checkIfNewDevice(userId, deviceId);

  //  console.log("[DeviceId]", deviceId);
  //  console.log("[IsNewDevice]", isNewDevice);

  // Ambil mfaEnabled dari DB!
  const userDb = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true },
  });

  req.mfaStatus = {
    required: isNewDevice && userDb?.mfaEnabled,
    enabled: userDb?.mfaEnabled,
  };
  //  console.log("[MFA STATUS MIDDLEWARE 2]", req.mfaStatus);
  next();
}

function authenticateToken(req, res, next) {
  const token =
    req.cookies?.accessToken ||
    req.headers.authorization?.split(" ")[1] ||
    req.body?.token;

  if (!token) {
    console.warn("No authentication token found");
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication token required",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.warn("Invalid token:", err.message);
      return res
        .status(401)
        .json({ error: "Unauthorized", message: "Invalid or expired token" });
    }
    req.user = decoded;
    // console.log("[AUTH] JWT decoded:", decoded);
    next();
  });
}

function authorizeAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden - Admin only" });
  }
  next();
}

function authorizeSuperAdmin(req, res, next) {
  if (req.user?.role !== "super") {
    console.log("User at authorizeSuperAdmin:", req.user);
    return res.status(403).json({ message: "Forbidden - Super Admin only" });
  }
  next();
}

function authorizeAdminOrSuper(req, res, next) {
  // console.log("User at authorize:", req.user);
  if (req.user?.role === "admin" || req.user?.role === "super") {
    return next();
  }
  return res
    .status(403)
    .json({ message: "Forbidden - Admin or Super Admin only" });
}

export {
  authenticateToken,
  checkMFAStatus,
  verifySessionToken,
  authorizeAdmin,
  authorizeSuperAdmin,
  authorizeAdminOrSuper,
};
