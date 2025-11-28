import { COOKIE_NAMES, getCookieOptions } from "../config/cookies.js";

export const setTokenCookies = (
  res,
  accessToken,
  refreshToken,
  sessionToken = null
) => {
  console.log(
    "🍪 Setting cookies with domain:",
    process.env.NODE_ENV === "production" ? "rylif-app.com" : "localhost"
  );

  // HTTP ONLY cookies (automatic auth)
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
    ...getCookieOptions(false), // httpOnly: true
    maxAge: 8 * 60 * 60 * 1000, // 8 jam
  });

  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
    ...getCookieOptions(false), // httpOnly: true
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
  });

  // READABLE cookie (untuk client-side Authorization header)
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN_READABLE, accessToken, {
    ...getCookieOptions(true), // httpOnly: false
    maxAge: 8 * 60 * 60 * 1000,
  });

  // SESSION token - PASTIKAN NAMA KONSISTEN
  if (sessionToken) {
    res.cookie(COOKIE_NAMES.SESSION_TOKEN, sessionToken, {
      ...getCookieOptions(false), // httpOnly: true
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  console.log("✅ Cookies set for:", Object.values(COOKIE_NAMES));
};

export const clearAuthCookies = (res) => {
  const allCookieNames = Object.values(COOKIE_NAMES);

  console.log("🧹 Clearing cookies:", allCookieNames);
  console.log("🔧 Environment:", process.env.NODE_ENV);
  console.log(
    "🌐 Domain:",
    process.env.NODE_ENV === "production" ? "rylif-app.com" : "localhost"
  );

  allCookieNames.forEach((cookieName) => {
    const isReadable = cookieName === COOKIE_NAMES.ACCESS_TOKEN_READABLE;
    const options = getCookieOptions(isReadable);

    res.clearCookie(cookieName, options);
    console.log(`✅ Cleared cookie: ${cookieName}`, options);
  });

  // 🚨 CLEAR EXTRA/LEGACY COOKIES untuk pastikan bersih
  const legacyCookies = [
    "sessionToken",
    "accessToken",
    "accessTokenReadable",
    "refreshToken",
  ];
  legacyCookies.forEach((cookieName) => {
    res.clearCookie(cookieName, getCookieOptions(false));
    console.log(`🧹 Cleared legacy cookie: ${cookieName}`);
  });
};
