import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, errors as joseErrors } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// Role mappings
const roleHomeMap: Record<string, string> = {
  super: "/super-admin-area",
  admin: "/admin-area",
  pic: "/pic-area",
  warga: "/user-area",
};

const roleAccessMap: Record<string, string[]> = {
  "/super-admin-area": ["super"],
  "/admin-area": ["super","admin"],
  "/pic-area": ["pic", "admin", "super"],
  "/user-area": ["warga", "pic", "admin", "super"],
};

function getRequiredRoles(pathname: string): string[] | null {
  const match = Object.entries(roleAccessMap).find(([prefix]) =>
    pathname.startsWith(prefix)
  );
  return match ? match[1] : null;
}

function createRefreshRedirect(req: NextRequest, pathname: string) {
  const refreshUrl = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`);
  refreshUrl.searchParams.set("redirect", encodeURIComponent(pathname + req.nextUrl.search));

  const response = NextResponse.redirect(refreshUrl);

  // Set backup cookie for redirect URL
  response.cookies.set("original_url", pathname + req.nextUrl.search, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60, // 1 minute
    path: "/",
    sameSite: "strict"
  });

  return response;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get("accessToken")?.value;
  const requiredRoles = getRequiredRoles(pathname);

  // Skip if route doesn't require authentication
  if (!requiredRoles) return NextResponse.next();

  // Case 1: No access token
  if (!accessToken) {
    console.warn("⚠️ Missing accessToken, redirecting to refresh");

    // Pastikan base URL frontend benar
    const frontendBaseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

    // Buat URL tujuan dengan benar
    const destinationUrl = new URL(req.nextUrl.pathname, frontendBaseUrl).toString();

    // Buat URL refresh token
    const refreshUrl = new URL(
      '/api/auth/refresh-token',
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    );

    // Set parameter redirect
    refreshUrl.searchParams.set('redirect', encodeURIComponent(destinationUrl));

    const response = NextResponse.redirect(refreshUrl);

    // Set cookie backup
    response.cookies.set('original_url', destinationUrl, {
      httpOnly: true,
      maxAge: 60,
      path: '/'
    });

    return response;
  }

  try {
    // Verify token
    const { payload } = await jwtVerify(accessToken, secret);
    const userRole = payload.role as string;

    // Check role authorization
    if (!requiredRoles.includes(userRole)) {
      const redirectTo = roleHomeMap[userRole] || "/";
      console.warn(`🚫 Unauthorized role '${userRole}' for '${pathname}'`);
      return NextResponse.redirect(new URL(redirectTo, req.url));
    }

    return NextResponse.next();
  } catch (error) {
    // Case 2: Token expired
    if (error instanceof joseErrors.JWTExpired) {
      console.warn("🔁 Token expired, redirecting to refresh");
      return createRefreshRedirect(req, pathname);
    }

    // Case 3: Other token errors
    console.error("❌ Invalid token:", error);

    // Clear invalid tokens
    const response = NextResponse.redirect(new URL("/auth/login", req.url));
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");

    return response;
  }
}

export const config = {
  matcher: [
    "/super-admin-area/:path*",
    "/admin-area/:path*",
    "/pic-area/:path*",
    "/user-area/:path*",
  ],
};