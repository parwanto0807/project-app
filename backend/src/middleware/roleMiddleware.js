// middlewares/roleMiddleware.js
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Pastikan user sudah terautentikasi
      if (!req.user) {
        console.warn("Role check failed: No user data found");
        return res.status(401).json({
          error: "Unauthorized",
          message: "Authentication required before role check",
        });
      }

      // Cek apakah user memiliki role yang diizinkan
      const userRole = req.user.role || req.user.userRole;

      if (!userRole) {
        console.warn("Role check failed: User has no role assigned");
        return res.status(403).json({
          error: "Forbidden",
          message: "User role not defined",
        });
      }

      if (!allowedRoles.includes(userRole)) {
        console.warn(
          `Role check failed: User role '${userRole}' not in allowed roles: [${allowedRoles.join(", ")}]`
        );
        return res.status(403).json({
          error: "Forbidden",
          message: `Insufficient permissions. Required roles: ${allowedRoles.join(", ")}`,
        });
      }

      console.log(`[ROLE] Access granted for role: ${userRole}`);
      next();
    } catch (error) {
      console.error("Role middleware error:", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Role verification failed",
      });
    }
  };
};

export default roleMiddleware;