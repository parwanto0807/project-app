import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import cookie from 'cookie';

function authenticateToken(req, res, next) {
  try {
    let token = null;

    // 1. Coba ambil dari Authorization header
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. Jika tidak ada, ambil dari cookie
    if (!token && req.headers.cookie) {
      const cookies = cookie.parse(req.headers.cookie);
      token = cookies.accessToken; // ✅ sesuai dengan nama cookie yang kamu set
    }

    // 3. Jika tetap tidak ada, tolak akses
    if (!token) {
      console.warn("❌ Token tidak ditemukan");
      return res.status(401).json({ message: "Unauthorized - Token missing" });
    }

    // 4. Verifikasi token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.warn("❌ Token tidak valid:", err.message);
        return res.status(403).json({ message: "Forbidden - Invalid token" });
      }

      req.user = decoded;
      next();
    });

  } catch (err) {
    console.error("❌ Error autentikasi token:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

// middleware/authorizeAdmin.js
function authorizeAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden - Admin only' });
  }
  next();
}

// middleware/authorizeAdmin.js
function authorizeSuperAdmin(req, res, next) {
  if (req.user?.role !== 'super') {
    return res.status(403).json({ message: 'Forbidden - Super Admin only' });
  }
  next();
}

export { authenticateToken, authorizeAdmin, authorizeSuperAdmin };
