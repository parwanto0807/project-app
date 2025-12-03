// app/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, errors as joseErrors } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

// Mapping home per role
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
function redirectToRefreshing(
  req: NextRequest,
  pathname: string,
  reason?: string
): NextResponse {
  const originalPathWithQuery = pathname + req.nextUrl.search;
  const refreshingUrl = new URL("/auth/refreshing", req.url);
  refreshingUrl.searchParams.set("redirect", originalPathWithQuery);

  if (reason) {
    refreshingUrl.searchParams.set("reason", reason);
  }

  console.log(
    `🔄 Middleware: Redirect to refreshing - ${reason || "token issue"}`
  );
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
  response.cookies.delete("accessTokenReadable"); // ✅ BERSIHKAN JUGA READABLE

  console.log(
    `🔐 Middleware: Redirect to login - ${reason || "invalid token"}`
  );
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

/**
 * Cek token dari berbagai sumber (cookies, headers, dll)
 */
function getAccessTokenFromRequest(req: NextRequest): string | undefined {
  // ✅ PERBAIKAN: CEK SEMUA SUMBER TOKEN

  // 1. Cek dari httpOnly cookie (utama - untuk production)
  let accessToken = req.cookies.get("accessToken")?.value;

  // 2. ✅ TAMBAHKAN: Cek dari readable cookie (untuk development)
  if (!accessToken) {
    accessToken = req.cookies.get("accessTokenReadable")?.value;
    if (accessToken) {
      console.log("🔧 Middleware: Using accessTokenReadable cookie");
    }
  }

  // 3. Cek dari Authorization header (fallback untuk API calls)
  if (!accessToken) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      accessToken = authHeader.substring(7);
      console.log("🔧 Middleware: Using Authorization header token");
    }
  }

  // ✅ DEBUG: Log semua cookies yang tersedia
  const allCookies = req.cookies.getAll();
  console.log(
    "🍪 Middleware: All available cookies:",
    allCookies.map((c) => ({ name: c.name, exists: !!c.value }))
  );

  return accessToken;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log(`🛡️ Middleware: Checking ${pathname}`);

  // ================================================================
  // 1. CEK KHUSUS ROOT PATH ('/') - Tetap di paling atas
  // ================================================================
  if (pathname === "/") {
    const accessToken = getAccessTokenFromRequest(req);
    if (accessToken) {
      try {
        const { payload } = await jwtVerify(accessToken, secret);
        const role = String(payload.role || "");
        if (role && roleHomeMap[role]) {
          console.log(
            `🚀 Middleware: Root access with valid token. Auto-redirecting ${role}...`
          );
          return redirectToRoleHome(req, role);
        }
      } catch {
        console.log("⚠️ Middleware: Token found on root but invalid.");
      }
    }
    // Jika tidak ada token, lanjut ke bawah
  }

  // ================================================================
  // 2. CEK AUTH PAGE (GUEST GUARD) - WAJIB DI SINI SEBELUM PUBLIC CHECK
  // ================================================================
  if (pathname.startsWith("/auth")) {
    // Biarkan halaman refreshing lewat
    if (pathname.startsWith("/auth/refreshing")) {
      return NextResponse.next();
    }

    // Cek apakah user sudah punya token valid
    const existingToken = getAccessTokenFromRequest(req);
    if (existingToken) {
      try {
        const { payload } = await jwtVerify(existingToken, secret);
        const role = String(payload.role || "");

        if (role && roleHomeMap[role]) {
          console.log(
            `🔄 Middleware: Already logged in as ${role}, redirecting from auth page`
          );
          return redirectToRoleHome(req, role);
        }
      } catch {
        // Token invalid, biarkan akses
      }
    }
    // Jika tidak punya token, izinkan akses ke halaman login
    // return NextResponse.next() di sini akan menghentikan eksekusi,
    // jadi blok Public Route di bawah tidak akan dijalankan untuk path /auth
    return NextResponse.next();
  }

  // ================================================================
  // 3. CEK PUBLIC ROUTE - WAJIB DI TARUH SETELAH AUTH CHECK
  // ================================================================
  const requiredRoles = getRequiredRoles(pathname);

  // Jika kode sampai sini, berarti BUKAN halaman /auth
  // Jika tidak butuh role (misal: /about, /contact), izinkan lewat
  if (!requiredRoles) {
    console.log(`🔓 Middleware: Public route - ${pathname}`);
    return NextResponse.next();
  }

  // Allow refreshing page tanpa pengecekan token
  if (pathname.startsWith("/auth")) {
    if (pathname.startsWith("/auth/refreshing")) return NextResponse.next();

    // Jika buka login page tapi token sudah valid -> lempar ke home
    const existingToken = getAccessTokenFromRequest(req);
    if (existingToken) {
      try {
        const { payload } = await jwtVerify(existingToken, secret);
        const role = String(payload.role || "");
        return redirectToRoleHome(req, role);
      } catch {
        /* Biarkan login ulang */
      }
    }
    return NextResponse.next();
  }

  // ================================================================
  // 4. PROTECTED ROUTES (Butuh Token & Role)
  // ================================================================
  const accessToken = getAccessTokenFromRequest(req);

  console.log(`🔍 Middleware: Token check result - exists: ${!!accessToken}`);

  if (!accessToken) {
    console.log("❌ Middleware: No access token found");
    return redirectToRefreshing(req, pathname, "no_token");
  }

  try {
    const { payload } = await jwtVerify(accessToken, secret);
    const role = String(payload.role || "");
    const userId = payload.userId || payload.sub;

    console.log(`🔐 Middleware: Token verified - role: "${role}"`);

    if (!requiredRoles.includes(role)) {
      console.log(`🚫 Middleware: Forbidden access`);
      return redirectToRoleHome(req, role);
    }

    console.log(`✅ Middleware: Access granted`);
    const response = NextResponse.next();
    response.headers.set("x-user-role", role);
    if (userId) response.headers.set("x-user-id", String(userId));
    response.headers.set("x-auth-status", "authenticated");

    return response;
  } catch (err) {
    console.log(
      "❌ Middleware: Token verification failed:",
      err instanceof Error ? err.message : "Unknown error"
    );

    // ✅ GUNAKAN fungsi redirect secara konsisten berdasarkan error type
    if (err instanceof joseErrors.JWTExpired) {
      console.log("⏰ Middleware: Token expired");
      return redirectToRefreshing(req, pathname, "token_expired");
    } else if (err instanceof joseErrors.JWTInvalid) {
      console.log("❌ Middleware: Token invalid");
      return redirectToLogin(req, "token_invalid");
    } else if (err instanceof joseErrors.JWTClaimValidationFailed) {
      console.log("❌ Middleware: Token claim validation failed");
      return redirectToLogin(req, "token_claim_invalid");
    } else if (err instanceof joseErrors.JOSEError) {
      console.log("❌ Middleware: JOSE error");
      return redirectToLogin(req, "token_error");
    }

    // Unknown errors - redirect ke login
    console.log("❌ Middleware: Unknown verification error");
    return redirectToLogin(req, "verification_error");
  }
}

export const config = {
  matcher: [
    "/",
    "/super-admin-area/:path*",
    "/admin-area/:path*",
    "/pic-area/:path*",
    "/user-area/:path*",
    "/auth/:path*", // Juga protect auth routes untuk redirect logic
  ],
};
