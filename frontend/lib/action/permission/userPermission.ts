import { api } from '@/lib/http';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Get all users for dropdown
 */
export async function getAllUsers() {
    try {
        const response = await api.get(`${API_URL}/api/permissions/users`);
        return response.data;
    } catch (error: any) {
        console.error('Get all users error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch users',
        };
    }
}

/**
 * Get permissions for specific user
 */
export async function getUserPermissions(userId: string) {
    try {
        const response = await api.get(`${API_URL}/api/permissions/user/${userId}`);
        return response.data;
    } catch (error: any) {
        console.error('Get user permissions error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch user permissions',
        };
    }
}

/**
 * Update user permissions (bulk save)
 */
export async function updateUserPermissions(
    userId: string,
    permissions: Array<{
        permissionId: string;
        granted: boolean;
        canCreate: boolean;
        canRead: boolean;
        canUpdate: boolean;
        canDelete: boolean;
    }>
) {
    try {
        const response = await api.put(`${API_URL}/api/permissions/user`, {
            userId,
            permissions,
        });
        return response.data;
    } catch (error: any) {
        console.error('Update user permissions error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to update user permissions',
        };
    }
}

/**
 * Get current user's permissions
 */
export async function getMyPermissions() {
    try {
        const response = await api.get(`${API_URL}/api/permissions/my-permissions`);
        return response.data;
    } catch (error: any) {
        console.error('Get my permissions error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch my permissions',
        };
    }
}
