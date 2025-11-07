export const setTokenCookies = (res, accessToken, refreshToken, sessionToken = null) => {
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: sevenDays,
  });

  if (sessionToken) {
    res.cookie("session_token", sessionToken, {
      ...cookieOptions,
      maxAge: sevenDays,
    });
  }
};

export const clearAuthCookies = (res) => {
  const cookies = ["accessToken", "refreshToken", "session_token", "trusted_device"];
  
  cookies.forEach(cookieName => {
    res.clearCookie(cookieName, {
      path: "/",
    });
  });
};