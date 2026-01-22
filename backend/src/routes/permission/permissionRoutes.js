import express from 'express';
import permissionController from '../../controllers/permission/permissionController.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import { authorizeSuperAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();

// ==========================================
// PUBLIC ROUTES (Authenticated users)
// ==========================================

/**
 * GET /api/permissions/my-permissions
 * Get current user's permissions
 */
router.get(
  '/my-permissions',
  authenticateToken,
  permissionController.getMyPermissions.bind(permissionController)
);

// ==========================================
// SUPER ADMIN ONLY ROUTES
// ==========================================

/**
 * GET /api/permissions
 * Get all permissions
 */
router.get(
  '/',
  authenticateToken,
  authorizeSuperAdmin,
  permissionController.getAllPermissions.bind(permissionController)
);

/**
 * GET /api/permissions/role/:role
 * Get permissions for specific role
 */
router.get(
  '/role/:role',
  authenticateToken,
  authorizeSuperAdmin,
  permissionController.getPermissionsByRole.bind(permissionController)
);

/**
 * PUT /api/permissions/role
 * Update role permissions (bulk update)
 * Body: { role: string, permissions: Array<{ permissionId, canCreate, canRead, canUpdate, canDelete }> }
 */
router.put(
  '/role',
  authenticateToken,
  authorizeSuperAdmin,
  permissionController.updateRolePermissions.bind(permissionController)
);

/**
 * POST /api/permissions/toggle
 * Toggle single permission for role
 * Body: { role, permissionId, action, value }
 */
router.post(
  '/toggle',
  authenticateToken,
  authorizeSuperAdmin,
  permissionController.toggleRolePermission.bind(permissionController)
);

// ==========================================
// USER-SPECIFIC PERMISSION ROUTES
// (Must be before /:id route to avoid conflicts)
// ==========================================

/**
 * GET /api/permissions/users
 * Get all users for dropdown
 */
router.get(
  '/users',
  authenticateToken,
  authorizeSuperAdmin,
  permissionController.getAllUsers.bind(permissionController)
);

/**
 * GET /api/permissions/user/:userId
 * Get permissions for specific user
 */
router.get(
  '/user/:userId',
  authenticateToken,
  authorizeSuperAdmin,
  permissionController.getUserPermissions.bind(permissionController)
);

/**
 * PUT /api/permissions/user
 * Update user permissions (bulk update)
 * Body: { userId: string, permissions: Array<{ permissionId, granted, canCreate, canRead, canUpdate, canDelete }> }
 */
router.put(
  '/user',
  authenticateToken,
  authorizeSuperAdmin,
  permissionController.updateUserPermissions.bind(permissionController)
);

// ==========================================
// PERMISSION CRUD ROUTES
// (Dynamic routes must be LAST)
// ==========================================

/**
 * POST /api/permissions
 * Create new permission
 */
router.post(
  '/',
  authenticateToken,
  authorizeSuperAdmin,
  permissionController.createPermission.bind(permissionController)
);

/**
 * PUT /api/permissions/:id
 * Update permission metadata (name, description, isActive)
 * Note: This route must be AFTER specific routes like /user, /role, etc.
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeSuperAdmin,
  permissionController.updatePermission.bind(permissionController)
);

export default router;
