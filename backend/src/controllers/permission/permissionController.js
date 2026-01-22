import { prisma } from '../../config/db.js';

export class PermissionController {
  /**
   * Get all permissions
   */
  async getAllPermissions(req, res) {
    try {
      const permissions = await prisma.permission.findMany({
        where: { isActive: true },
        include: {
          rolePermissions: {
            select: {
              role: true,
              canCreate: true,
              canRead: true,
              canUpdate: true,
              canDelete: true,
            }
          }
        },
        orderBy: [
          { module: 'asc' },
          { code: 'asc' }
        ]
      });

      // Group by module
      const grouped = permissions.reduce((acc, perm) => {
        if (!acc[perm.module]) {
          acc[perm.module] = [];
        }
        acc[perm.module].push(perm);
        return acc;
      }, {});

      res.json({
        success: true,
        data: permissions,
        grouped: grouped,
      });
    } catch (error) {
      console.error('Get all permissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch permissions',
        error: error.message,
      });
    }
  }

  /**
   * Get permissions by role
   */
  async getPermissionsByRole(req, res) {
    try {
      const { role } = req.params;

      // Validate role
      const validRoles = ['super', 'admin', 'pic', 'user'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role',
        });
      }

      // Get all permissions
      const allPermissions = await prisma.permission.findMany({
        where: { isActive: true },
        orderBy: [
          { module: 'asc' },
          { code: 'asc' }
        ]
      });

      // Get role permissions
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { role },
        include: { permission: true }
      });

      // Map permissions dengan status granted/not granted
      const permissionsWithStatus = allPermissions.map(perm => {
        const rolePerm = rolePermissions.find(rp => rp.permissionId === perm.id);
        
        return {
          ...perm,
          granted: !!rolePerm,
          canCreate: rolePerm?.canCreate || false,
          canRead: rolePerm?.canRead || false,
          canUpdate: rolePerm?.canUpdate || false,
          canDelete: rolePerm?.canDelete || false,
          rolePermissionId: rolePerm?.id || null,
        };
      });

      // Group by module
      const grouped = permissionsWithStatus.reduce((acc, perm) => {
        if (!acc[perm.module]) {
          acc[perm.module] = [];
        }
        acc[perm.module].push(perm);
        return acc;
      }, {});

      res.json({
        success: true,
        role: role,
        data: permissionsWithStatus,
        grouped: grouped,
      });
    } catch (error) {
      console.error('Get permissions by role error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch role permissions',
        error: error.message,
      });
    }
  }

  /**
   * Update role permissions (Bulk update)
   */
  async updateRolePermissions(req, res) {
    try {
      const { role, permissions } = req.body;

      // Validate role
      const validRoles = ['admin', 'pic', 'user']; // Super tidak bisa diubah
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role or cannot modify super admin permissions',
        });
      }

      // Validate permissions array
      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: 'Permissions must be an array',
        });
      }

      await prisma.$transaction(async (tx) => {
        // 1. Delete existing permissions untuk role ini
        await tx.rolePermission.deleteMany({
          where: { role }
        });

        // 2. Create new permissions
        if (permissions.length > 0) {
          const permissionsToCreate = permissions.map(p => ({
            role,
            permissionId: p.permissionId,
            canCreate: p.canCreate || false,
            canRead: p.canRead || false,
            canUpdate: p.canUpdate || false,
            canDelete: p.canDelete || false,
          }));

          await tx.rolePermission.createMany({
            data: permissionsToCreate
          });
        }
      });

      // Get updated permissions
      const updatedPermissions = await prisma.rolePermission.findMany({
        where: { role },
        include: { permission: true }
      });

      res.json({
        success: true,
        message: `Permissions for role '${role}' updated successfully`,
        data: updatedPermissions,
      });
    } catch (error) {
      console.error('Update role permissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update role permissions',
        error: error.message,
      });
    }
  }

  /**
   * Toggle single permission untuk role
   */
  async toggleRolePermission(req, res) {
    try {
      const { role, permissionId, action, value } = req.body;

      // Validate
      const validRoles = ['admin', 'pic', 'user'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role',
        });
      }

      const validActions = ['canCreate', 'canRead', 'canUpdate', 'canDelete'];
      if (!validActions.includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid action',
        });
      }

      // Check if permission exists
      const permission = await prisma.permission.findUnique({
        where: { id: permissionId }
      });

      if (!permission) {
        return res.status(404).json({
          success: false,
          message: 'Permission not found',
        });
      }

      // Find or create role permission
      let rolePermission = await prisma.rolePermission.findUnique({
        where: {
          role_permissionId: {
            role,
            permissionId
          }
        }
      });

      if (!rolePermission) {
        // Create new role permission
        rolePermission = await prisma.rolePermission.create({
          data: {
            role,
            permissionId,
            [action]: value,
          },
          include: { permission: true }
        });
      } else {
        // Update existing
        rolePermission = await prisma.rolePermission.update({
          where: {
            role_permissionId: {
              role,
              permissionId
            }
          },
          data: {
            [action]: value,
          },
          include: { permission: true }
        });

        // If all actions are false, delete the role permission
        if (!rolePermission.canCreate && !rolePermission.canRead && 
            !rolePermission.canUpdate && !rolePermission.canDelete) {
          await prisma.rolePermission.delete({
            where: {
              role_permissionId: {
                role,
                permissionId
              }
            }
          });
          rolePermission = null;
        }
      }

      res.json({
        success: true,
        message: 'Permission toggled successfully',
        data: rolePermission,
      });
    } catch (error) {
      console.error('Toggle role permission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle permission',
        error: error.message,
      });
    }
  }

  /**
   * Get current user's permissions
   */
  async getMyPermissions(req, res) {
    try {
      const userId = req.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Super admin has all permissions
      if (user.role === 'super') {
        const allPermissions = await prisma.permission.findMany({
          where: { isActive: true }
        });

        const permissionsWithAccess = allPermissions.map(p => ({
          ...p,
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
        }));

        return res.json({
          success: true,
          role: 'super',
          data: permissionsWithAccess,
        });
      }

      // 1. Get Role Permissions
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { role: user.role },
        include: { permission: true }
      });

      // 2. Get User Permissions (Overrides)
      const userPermissions = await prisma.userPermission.findMany({
        where: { userId },
        include: { permission: true }
      });

      // 3. Merge Permissions (User overrides Role)
      const mergedPermissions = new Map();

      // Start with Role Permissions
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

      // Apply User Overrides
      userPermissions.forEach(up => {
        mergedPermissions.set(up.permission.code, {
          ...up.permission,
          canCreate: up.canCreate,
          canRead: up.canRead,
          canUpdate: up.canUpdate,
          canDelete: up.canDelete,
          source: 'user'
        });
      });

      const permissions = Array.from(mergedPermissions.values());

      res.json({
        success: true,
        role: user.role,
        data: permissions,
      });
    } catch (error) {
      console.error('Get my permissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user permissions',
        error: error.message,
      });
    }
  }

  /**
   * Create new permission (Super admin only)
   */
  async createPermission(req, res) {
    try {
      const { code, name, module, description } = req.body;

      // Validate required fields
      if (!code || !name || !module) {
        return res.status(400).json({
          success: false,
          message: 'Code, name, and module are required',
        });
      }

      // Check if code already exists
      const existing = await prisma.permission.findUnique({
        where: { code }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Permission code already exists',
        });
      }

      const permission = await prisma.permission.create({
        data: {
          code,
          name,
          module,
          description,
        }
      });

      res.status(201).json({
        success: true,
        message: 'Permission created successfully',
        data: permission,
      });
    } catch (error) {
      console.error('Create permission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create permission',
        error: error.message,
      });
    }
  }

  /**
   * Update permission (Super admin only)
   */
  async updatePermission(req, res) {
    try {
      const { id } = req.params;
      const { name, description, isActive } = req.body;

      const permission = await prisma.permission.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(isActive !== undefined && { isActive }),
        }
      });

      res.json({
        success: true,
        message: 'Permission updated successfully',
        data: permission,
      });
    } catch (error) {
      // Only log non-P2025 errors to reduce console noise
      if (error.code !== 'P2025') {
        console.error('Update permission error:', error);
      }
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Permission not found',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update permission',
        error: error.message,
      });
    }
  }

  /**
   * Get all users with permission summary (Super admin only)
   */
  async getAllUsers(req, res) {
    try {
      const users = await prisma.user.findMany({
        where: { active: true },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          userPermissions: {
            select: {
              id: true,
              canCreate: true,
              canRead: true,
              canUpdate: true,
              canDelete: true,
              permission: {
                select: {
                  code: true,
                  name: true,
                  module: true,
                }
              }
            }
          }
        },
        orderBy: [
          { role: 'asc' },
          { name: 'asc' }
        ]
      });

      // Add permission count and summary
      const usersWithStats = users.map(user => {
        // Hanya hitung permission yang aktif (setidaknya satu action true)
        // Ini agar jika kita menyimpan 'denied' permission (false semua), tidak ikut terhitung visual
        const activePermissions = user.userPermissions.filter(up => 
          up.canRead || up.canCreate || up.canUpdate || up.canDelete
        );

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissionCount: activePermissions.length,
          permissions: activePermissions.map(up => ({
            code: up.permission.code,
            name: up.permission.name,
            module: up.permission.module,
            canCreate: up.canCreate,
            canRead: up.canRead,
            canUpdate: up.canUpdate,
            canDelete: up.canDelete,
          })),
        };
      });

      res.json({
        success: true,
        data: usersWithStats,
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message,
      });
    }
  }


  /**
   * Get permissions for specific user
   */
  async getUserPermissions(req, res) {
    try {
      const { userId } = req.params;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, email: true, name: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Get all permissions
      const allPermissions = await prisma.permission.findMany({
        where: { isActive: true },
        orderBy: [
          { module: 'asc' },
          { code: 'asc' }
        ]
      });

      // Get user-specific permissions
      const userPermissions = await prisma.userPermission.findMany({
        where: { userId },
        include: { permission: true }
      });

      // Map permissions dengan status granted/not granted
      const permissionsWithStatus = allPermissions.map(perm => {
        const userPerm = userPermissions.find(up => up.permissionId === perm.id);
        
        return {
          ...perm,
          granted: !!(userPerm && (userPerm.canRead || userPerm.canCreate || userPerm.canUpdate || userPerm.canDelete)),
          canCreate: userPerm?.canCreate || false,
          canRead: userPerm?.canRead || false,
          canUpdate: userPerm?.canUpdate || false,
          canDelete: userPerm?.canDelete || false,
          userPermissionId: userPerm?.id || null,
        };
      });

      // Group by module
      const grouped = permissionsWithStatus.reduce((acc, perm) => {
        if (!acc[perm.module]) {
          acc[perm.module] = [];
        }
        acc[perm.module].push(perm);
        return acc;
      }, {});

      res.json({
        success: true,
        user: {
          id: userId,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        data: permissionsWithStatus,
        grouped: grouped,
      });
    } catch (error) {
      console.error('Get user permissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user permissions',
        error: error.message,
      });
    }
  }

  /**
   * Update user permissions (Bulk update with Save button)
   */
  async updateUserPermissions(req, res) {
    try {
      const { userId, permissions } = req.body;

      // Validate userId
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Validate permissions array
      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: 'Permissions must be an array',
        });
      }

      await prisma.$transaction(async (tx) => {
        // 1. Delete existing permissions untuk user ini
        await tx.userPermission.deleteMany({
          where: { userId }
        });

        // 2. Create new permissions (ALL permissions including explicitly denied ones)
        // Kita simpan semua state permission untuk user ini agar override berfungsi penuh
        // Jika granted=false, maka canRead/Create/etc akan false, dan record tetap ada
        // sehingga middleware akan menemukan record ini dan menolak akses (meng-override role)
        const permissionsToCreate = permissions
          .map(p => ({
            userId,
            permissionId: p.permissionId,
            canCreate: p.canCreate || false,
            canRead: p.canRead || false,
            canUpdate: p.canUpdate || false,
            canDelete: p.canDelete || false,
          }));

        if (permissionsToCreate.length > 0) {
          await tx.userPermission.createMany({
            data: permissionsToCreate
          });
        }
      });

      // Get updated permissions
      const updatedPermissions = await prisma.userPermission.findMany({
        where: { userId },
        include: { permission: true }
      });

      res.json({
        success: true,
        message: `Permissions for user '${user.email}' updated successfully`,
        data: updatedPermissions,
      });
    } catch (error) {
      console.error('Update user permissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user permissions',
        error: error.message,
      });
    }
  }
}

export default new PermissionController();
