// app/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, errors as joseErrors } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

// Mapping home per role (untuk fallback redirect jika role tak berizin)
const roleHomeMap: Record<string, string> = {
  super: "/super-admin-area",
  admin: "/admin-area",
  pic: "/pic-area",
  user: "/user-area",
};

// Role yang boleh mengakses prefix route tertentu
const roleAccessMap: Record<string, string[]> = {
  "/super-admin-area": ["super"],
  "/admin-area": ["super", "admin"],
  "/pic-area": ["pic", "admin", "super"],
  "/user-area": ["user", "pic", "admin", "super"],
};

/**
 * Mendapatkan role yang diperlukan untuk path tertentu
 */
function getRequiredRoles(pathname: string): string[] | null {
  const match = Object.entries(roleAccessMap).find(([prefix]) =>
    pathname.startsWith(prefix)
  );
  return match ? match[1] : null;
}

/**
 * Mengarahkan pengguna ke halaman refreshing untuk memperbarui token
 */
function redirectToRefreshing(req: NextRequest, pathname: string, reason?: string): NextResponse {
  const originalPathWithQuery = pathname + req.nextUrl.search;
  const refreshingUrl = new URL("/auth/refreshing", req.url);
  refreshingUrl.searchParams.set("redirect", originalPathWithQuery);
  
  if (reason) {
    refreshingUrl.searchParams.set("reason", reason);
  }

  console.log(`🔄 Middleware: Redirect to refreshing - ${reason || 'token issue'}`);
  return NextResponse.redirect(refreshingUrl);
}

/**
 * Mengarahkan pengguna ke halaman login
 */
function redirectToLogin(req: NextRequest, reason?: string): NextResponse {
  const { pathname, search } = req.nextUrl;
  const originalUrl = `${pathname}${search}`;

  const loginUrl = new URL("/auth/login", req.url);
  loginUrl.searchParams.set("redirect", originalUrl);
  
  if (reason) {
    loginUrl.searchParams.set("reason", reason);
  }

  const response = NextResponse.redirect(loginUrl);
  
  // Bersihkan cookie accessToken
  response.cookies.delete("accessToken");
  
  console.log(`🔐 Middleware: Redirect to login - ${reason || 'invalid token'}`);
  return response;
}

/**
 * Redirect pengguna ke home page sesuai role mereka
 */
function redirectToRoleHome(req: NextRequest, role: string): NextResponse {
  const homePath = roleHomeMap[role] || "/";
  console.log(`🏠 Middleware: Redirecting ${role} to their home: ${homePath}`);
  return NextResponse.redirect(new URL(homePath, req.url));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Dapatkan role yang diperlukan untuk path ini
  const requiredRoles = getRequiredRoles(pathname);
  
  // Jika tidak ada role requirement, lanjutkan
  if (!requiredRoles) {
    return NextResponse.next();
  }

  // Allow refreshing page itself untuk menghindari infinite loop
  if (pathname.startsWith("/auth/refreshing")) {
    return NextResponse.next();
  }

  // Dapatkan access token dari cookies
  const accessToken = req.cookies.get("accessToken")?.value;

  // Case 1: Tidak ada token sama sekali
  if (!accessToken) {
    console.log('❌ Middleware: No access token found in cookies');
    return redirectToRefreshing(req, pathname, "no_token");
  }

  try {
    // Verifikasi token JWT
    const { payload } = await jwtVerify(accessToken, secret);
    const role = String(payload.role || "");
    
    console.log(`🔍 Middleware: Token verified for role: ${role}, accessing: ${pathname}`);

    // Case 2: Role tidak diizinkan mengakses route ini
    if (!requiredRoles.includes(role)) {
      console.log(`🚫 Middleware: Role ${role} not allowed to access ${pathname}. Required: ${requiredRoles.join(', ')}`);
      return redirectToRoleHome(req, role);
    }

    // Case 3: Token valid dan role diizinkan - lanjutkan
    console.log(`✅ Middleware: Access granted for ${role} to ${pathname}`);
    return NextResponse.next();
    
  } catch (err) {
    // Case 4: Token expired - redirect ke refreshing page
    if (err instanceof joseErrors.JWTExpired) {
      console.log('⏰ Middleware: Token expired');
      return redirectToRefreshing(req, pathname, "token_expired");
    }
    
    // Case 5: Token invalid/error lainnya - redirect ke login
    console.log('❌ Middleware: Token verification failed:', err instanceof Error ? err.message : 'Unknown error');
    
    if (err instanceof joseErrors.JWTInvalid) {
      return redirectToLogin(req, "token_invalid");
    } else if (err instanceof joseErrors.JWTClaimValidationFailed) {
      return redirectToLogin(req, "token_claim_invalid");
    } else if (err instanceof joseErrors.JOSEError) {
      return redirectToLogin(req, "token_error");
    }
    
    // Unknown errors
    return redirectToLogin(req, "verification_error");
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