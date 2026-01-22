'use server';

import { api } from '@/lib/http';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Get all permissions
 */
export async function getAllPermissions() {
    try {
        const response = await api.get(`${API_URL}/api/permissions`);

        if (response.data.success) {
            return {
                success: true,
                data: response.data.data,
                grouped: response.data.grouped,
            };
        }

        return {
            success: false,
            error: response.data.message || 'Failed to fetch permissions',
        };
    } catch (error: any) {
        console.error('Get all permissions error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch permissions',
        };
    }
}

/**
 * Get permissions by role
 */
export async function getPermissionsByRole(role: string) {
    try {
        const response = await api.get(`${API_URL}/api/permissions/role/${role}`);

        if (response.data.success) {
            return {
                success: true,
                role: response.data.role,
                data: response.data.data,
                grouped: response.data.grouped,
            };
        }

        return {
            success: false,
            error: response.data.message || 'Failed to fetch role permissions',
        };
    } catch (error: any) {
        console.error('Get permissions by role error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch role permissions',
        };
    }
}

/**
 * Update role permissions (bulk update)
 */
export async function updateRolePermissions(
    role: string,
    permissions: Array<{
        permissionId: string;
        canCreate: boolean;
        canRead: boolean;
        canUpdate: boolean;
        canDelete: boolean;
    }>
) {
    try {
        const response = await api.put(`${API_URL}/api/permissions/role`, {
            role,
            permissions,
        });

        if (response.data.success) {
            return {
                success: true,
                message: response.data.message,
                data: response.data.data,
            };
        }

        return {
            success: false,
            error: response.data.message || 'Failed to update role permissions',
        };
    } catch (error: any) {
        console.error('Update role permissions error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to update role permissions',
        };
    }
}

/**
 * Toggle single permission for role
 */
export async function toggleRolePermission(
    role: string,
    permissionId: string,
    action: 'canCreate' | 'canRead' | 'canUpdate' | 'canDelete',
    value: boolean
) {
    try {
        const response = await api.post(`${API_URL}/api/permissions/toggle`, {
            role,
            permissionId,
            action,
            value,
        });

        if (response.data.success) {
            return {
                success: true,
                message: response.data.message,
                data: response.data.data,
            };
        }

        return {
            success: false,
            error: response.data.message || 'Failed to toggle permission',
        };
    } catch (error: any) {
        console.error('Toggle permission error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to toggle permission',
        };
    }
}

/**
 * Get current user's permissions
 */
export async function getMyPermissions() {
    try {
        const response = await api.get(`${API_URL}/api/permissions/my-permissions`);

        if (response.data.success) {
            return {
                success: true,
                role: response.data.role,
                data: response.data.data,
            };
        }

        return {
            success: false,
            error: response.data.message || 'Failed to fetch user permissions',
        };
    } catch (error: any) {
        console.error('Get my permissions error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch user permissions',
        };
    }
}

/**
 * Create new permission (Super admin only)
 */
export async function createPermission(data: {
    code: string;
    name: string;
    module: string;
    description?: string;
}) {
    try {
        const response = await api.post(`${API_URL}/api/permissions`, data);

        if (response.data.success) {
            return {
                success: true,
                message: response.data.message,
                data: response.data.data,
            };
        }

        return {
            success: false,
            error: response.data.message || 'Failed to create permission',
        };
    } catch (error: any) {
        console.error('Create permission error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to create permission',
        };
    }
}

/**
 * Update permission (Super admin only)
 */
export async function updatePermission(
    id: string,
    data: {
        name?: string;
        description?: string;
        isActive?: boolean;
    }
) {
    try {
        const response = await api.put(`${API_URL}/api/permissions/${id}`, data);

        if (response.data.success) {
            return {
                success: true,
                message: response.data.message,
                data: response.data.data,
            };
        }

        return {
            success: false,
            error: response.data.message || 'Failed to update permission',
        };
    } catch (error: any) {
        console.error('Update permission error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to update permission',
        };
    }
}
