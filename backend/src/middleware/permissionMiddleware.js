import { prisma } from '../config/db.js';

/**
 * Middleware untuk cek permission berdasarkan code dan action
 * @param {string} permissionCode - Kode permission (contoh: "pr.view", "po.create")
 * @param {string} action - Jenis aksi: "canRead", "canCreate", "canUpdate", "canDelete"
 * @returns {Function} Express middleware
 */
// Middleware untuk cek permission berdasarkan code dan action
export const requirePermission = (permissionCode, action = 'canRead') => {
  return async (req, res, next) => {
    try {
      // 1. Pastikan user sudah authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      // 2. Super admin bypass semua permission check
      if (req.user.role === 'super') {
        return next();
      }

      // 3. PRIORITY 1: Cek User Specific Permission (Override)
      // Kita cek apakah user punya setting khusus untuk permission ini
      const userPermission = await prisma.userPermission.findFirst({
        where: {
          userId: req.user.id,
          permission: { 
            code: permissionCode,
            isActive: true 
          }
        },
        include: {
          permission: true
        }
      });

      // Jika user punya spesifik permission setting, gunakan itu
      if (userPermission) {
        if (userPermission[action]) {
          // Access granted by UserPermission
          req.permission = {
            code: userPermission.permission.code,
            name: userPermission.permission.name,
            module: userPermission.permission.module,
            action: action,
            source: 'user' // Info source permission
          };
          return next();
        } else {
          // Access denied by UserPermission (Explicitly disabled for user)
          return res.status(403).json({
            success: false,
            error: 'Insufficient permissions',
            message: `Akses '${action}' untuk '${permissionCode}' dinonaktifkan untuk user ini.`
          });
        }
      }

      // 4. PRIORITY 2: Cek Role Based Permission (Fallback)
      // Jika tidak ada user-specific permission, cek berdasarkan role
      const rolePermission = await prisma.rolePermission.findFirst({
        where: {
          role: req.user.role,
          permission: { 
            code: permissionCode,
            isActive: true 
          },
          [action]: true, // canCreate, canRead, canUpdate, canDelete
        },
        include: { 
          permission: {
            select: {
              code: true,
              name: true,
              module: true
            }
          } 
        },
      });

      if (!rolePermission) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          required: {
            permission: permissionCode,
            action: action,
            userRole: req.user.role
          },
          message: `Role '${req.user.role}' tidak memiliki akses '${action}' untuk '${permissionCode}'`
        });
      }

      // 5. Attach permission info ke request
      req.permission = {
        code: rolePermission.permission.code,
        name: rolePermission.permission.name,
        module: rolePermission.permission.module,
        action: action,
        source: 'role'
      };

      next();
    } catch (error) {
      console.error('[Permission Middleware Error]:', error);
      return res.status(500).json({
        success: false,
        error: 'Permission check failed',
        message: error.message,
      });
    }
  };
};

/**
 * Middleware untuk cek multiple permissions (OR logic)
 * User hanya perlu punya salah satu permission
 */
export const requireAnyPermission = (permissionConfigs) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      // Super admin bypass
      if (req.user.role === 'super') {
        return next();
      }

      // Cek apakah user punya salah satu permission
      const permissions = await prisma.rolePermission.findMany({
        where: {
          role: req.user.role,
          permission: { 
            code: { in: permissionConfigs.map(p => p.code) },
            isActive: true 
          },
        },
        include: { permission: true },
      });

      // Cek apakah ada permission yang match dengan action yang diminta
      const hasAccess = permissions.some(perm => {
        const config = permissionConfigs.find(c => c.code === perm.permission.code);
        return config && perm[config.action || 'canRead'];
      });

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          required: permissionConfigs,
          message: `Role '${req.user.role}' tidak memiliki akses yang diperlukan`
        });
      }

      next();
    } catch (error) {
      console.error('[Permission Middleware Error]:', error);
      return res.status(500).json({
        success: false,
        error: 'Permission check failed',
      });
    }
  };
};

/**
 * Helper function untuk get user permissions
 * Bisa dipanggil dari controller untuk conditional logic
 */
// Helper function untuk get user permissions (Merged Role + User)
export const getUserPermissions = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return [];
    }

    // Super admin punya semua permission
    if (user.role === 'super') {
      return await prisma.permission.findMany({
        where: { isActive: true }
      });
    }

    // 1. Get Base Role Permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        role: user.role,
      },
      include: {
        permission: true
      }
    });

    // 2. Get User Specific Overrides
    const userPermissions = await prisma.userPermission.findMany({
      where: {
        userId: userId,
      },
      include: {
        permission: true
      }
    });

    // 3. Merge Permissions (User overrides Role)
    // Kita buat map based on permission code untuk memudahkan merging
    const mergedPermissions = new Map();

    // Add role permissions first
    rolePermissions.forEach(rp => {
      mergedPermissions.set(rp.permission.code, {
        ...rp.permission,
        canCreate: rp.canCreate,
        canRead: rp.canRead,
        canUpdate: rp.canUpdate,
        canDelete: rp.canDelete,
        source: 'role'
      });
    });

    // Override with user permissions
    userPermissions.forEach(up => {
      // Jika permission sudah ada (dari role), kita update
      // Jika belum ada (special permission for user), kita add
      const existing = mergedPermissions.get(up.permission.code);
      
      mergedPermissions.set(up.permission.code, {
        ...up.permission,
        canCreate: up.canCreate,
        canRead: up.canRead,
        canUpdate: up.canUpdate,
        canDelete: up.canDelete,
        source: 'user', // Mark as overridden
        originalRolePermission: existing // Optional: simpan info aslinya
      });
    });

    return Array.from(mergedPermissions.values());
  } catch (error) {
    console.error('[Get User Permissions Error]:', error);
    return [];
  }
};

/**
 * Helper function untuk check permission tanpa middleware
 * Useful untuk conditional logic di controller
 */
export const checkUserPermission = async (userId, permissionCode, action = 'canRead') => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return false;
    }

    // Super admin always has permission
    if (user.role === 'super') {
      return true;
    }

    // 1. Cek User Specific Permission (Override)
    const userPermission = await prisma.userPermission.findFirst({
      where: {
        userId: userId,
        permission: { 
          code: permissionCode,
          isActive: true 
        }
      },
    });

    if (userPermission) {
      return !!userPermission[action];
    }

    // 2. Cek Role Based Permission (Fallback)
    const rolePermission = await prisma.rolePermission.findFirst({
      where: {
        role: user.role,
        permission: { 
          code: permissionCode,
          isActive: true 
        },
        [action]: true,
      },
    });

    return !!rolePermission;
  } catch (error) {
    console.error('[Check User Permission Error]:', error);
    return false;
  }
};
