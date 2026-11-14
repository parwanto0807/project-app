import cookie from "cookie";
import { authenticateToken, verifySessionToken } from "./authMiddleware.js";

/**
 * Guard autentikasi global untuk seluruh endpoint /api.
 *
 * Endpoint publik (allowlist):
 *  - /api/auth/*   : login, register, refresh, MFA, Google OAuth, logout, me
 *  - /api/health   : health check
 *
 * Mendukung dua mode autentikasi:
 *  1. Session cookie (session_token / sessionToken) -> verifySessionToken
 *  2. JWT Bearer atau cookie accessToken           -> authenticateToken
 *
 * Kill-switch darurat: set env API_AUTH_ENFORCE=false.
 */
const PUBLIC_PREFIXES = ["/api/auth", "/api/health"];

function isPublicPath(pathname) {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function requireApiAuth(req, res, next) {
  if (process.env.API_AUTH_ENFORCE === "false") return next();

  const pathname = (req.originalUrl || req.url || "").split("?")[0];
  if (isPublicPath(pathname)) return next();

  const cookies = cookie.parse(req.headers.cookie || "");
  if (cookies.session_token || cookies.sessionToken) {
    return verifySessionToken(req, res, next);
  }
  return authenticateToken(req, res, next);
}

export default requireApiAuth;
