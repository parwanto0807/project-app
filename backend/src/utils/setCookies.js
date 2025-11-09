export const setTokenCookies = (
  res,
  accessToken,
  refreshToken,
  sessionToken = null
) => {
  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // ✅ localhost false
    sameSite: isProduction ? "none" : "lax", // ✅ localhost "lax"
    path: "/",
  };

  // ✅ hanya tambah domain di production dan TANPA https:// TANPA slash
  if (isProduction) {
    cookieOptions.domain = "rylif-app.com";
  }

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 8 * 60 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  if (sessionToken) {
    res.cookie("session_token", sessionToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  console.log("✅ Cookies set using:", cookieOptions);
};

export const clearAuthCookies = (res) => {
  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };

  if (isProduction) {
    cookieOptions.domain = "rylif-app.com";
  }

  ["accessToken", "refreshToken", "session_token"].forEach((cookieName) => {
    res.clearCookie(cookieName, cookieOptions);
  });
};
