export const setTokenCookies = (
  res,
  accessToken,
  refreshToken,
  sessionToken = null
) => {
  const isProduction = process.env.NODE_ENV === "production";

  const httpOnlyCookieOptions = {
    httpOnly: true,
    secure: isProduction, // ✅ localhost false
    sameSite: isProduction ? "none" : "lax", // ✅ localhost "lax"
    path: "/",
  };

  // ✅ Cookie yang bisa dibaca client (untuk Authorization header)
  const readableCookieOptions = {
    httpOnly: false, // ❗️ FALSE - biar client bisa baca
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };

  // ✅ hanya tambah domain di production dan TANPA https:// TANPA slash
  if (isProduction) {
    httpOnlyCookieOptions.domain = "rylif-app.com";
    readableCookieOptions.domain = "rylif-app.com";
  }

  // 🍪 HTTP ONLY COOKIES (untuk automatic auth)
  res.cookie("accessToken", accessToken, {
    ...httpOnlyCookieOptions,
    maxAge: 8 * 60 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...httpOnlyCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // 🆕 READABLE COOKIE (untuk client-side Authorization header)
  res.cookie("accessTokenReadable", accessToken, {
    ...readableCookieOptions,
    maxAge: 8 * 60 * 60 * 1000,
  });

  if (sessionToken) {
    res.cookie("session_token", sessionToken, {
      ...httpOnlyCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  console.log("✅ Cookies set - httpOnly:", httpOnlyCookieOptions);
  console.log("✅ Cookies set - readable:", readableCookieOptions);
};

export const clearAuthCookies = (res) => {
  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };

  const readableCookieOptions = {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };

  if (isProduction) {
    cookieOptions.domain = "rylif-app.com";
    readableCookieOptions.domain = "rylif-app.com";
  }

  // Clear httpOnly cookies
  ["accessToken", "refreshToken", "session_token"].forEach((cookieName) => {
    res.clearCookie(cookieName, cookieOptions);
  });

  // 🆕 Clear readable cookies juga
  res.clearCookie("accessTokenReadable", readableCookieOptions);
};