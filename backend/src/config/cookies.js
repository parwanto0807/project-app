// config/cookies.js
export const COOKIE_NAMES = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken", 
  SESSION_TOKEN: "sessionToken", // ❗️GUNAKAN underscore untuk konsistensi
  ACCESS_TOKEN_READABLE: "accessTokenReadable"
};

export const getCookieOptions = (isReadable = false) => {
  const isProduction = process.env.NODE_ENV === "production";
  
  const baseOptions = {
    httpOnly: !isReadable,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };

  // ✅ DOMAIN HARUS SAMA antara set dan clear
  if (isProduction) {
    baseOptions.domain = "rylif-app.com"; // TANPA https:// TANPA /
  }

  return baseOptions;
};