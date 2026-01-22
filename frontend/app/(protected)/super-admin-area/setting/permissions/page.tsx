'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Shield, Eye, Edit, Trash2, Plus, Save, RefreshCw, X, User, Search, Settings } from 'lucide-react';
import { getAllUsers, getUserPermissions, updateUserPermissions } from '@/lib/action/permission/userPermission';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { SuperLayout } from "@/components/admin-panel/super-layout";
import { LayoutProps } from "@/types/layout";
import { Input } from "@/components/ui/input";

type Permission = {
    id: string;
    code: string;
    name: string;
    module: string;
    description: string | null;
    isActive: boolean;
    granted: boolean;
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    userPermissionId: string | null;
};

type GroupedPermissions = {
    [module: string]: Permission[];
};

type User = {
    id: string;
    email: string;
    name: string | null;
    role: string;
    permissionCount?: number;
};

const roleConfig: { [key: string]: { label: string; color: string } } = {
    super: { label: 'Super Admin', color: 'bg-purple-500' },
    admin: { label: 'Admin', color: 'bg-blue-500' },
    pic: { label: 'PIC', color: 'bg-green-500' },
    user: { label: 'User', color: 'bg-gray-500' },
};

const moduleIcons: { [key: string]: string } = {
    purchasing: '🛒',
    inventory: '📦',
    finance: '💰',
    accounting: '🧾',
    project: '🏗️',
    sales: '💼',
    hr: '👥',
    settings: '⚙️',
};

export default function PermissionsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Permission State (for the dialog)
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [originalPermissions, setOriginalPermissions] = useState<Permission[]>([]);
    const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({});
    const [loadingPermissions, setLoadingPermissions] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchUserPermissions(selectedUser.id);
        } else {
            setPermissions([]);
            setGroupedPermissions({});
            setHasChanges(false);
        }
    }, [selectedUser]);

    // Check for changes
    useEffect(() => {
        if (originalPermissions.length > 0 && permissions.length > 0) {
            const changed = JSON.stringify(permissions) !== JSON.stringify(originalPermissions);
            setHasChanges(changed);
        }
    }, [permissions, originalPermissions]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const result = await getAllUsers();
            if (result.success) {
                setUsers(result.data || []);
            } else {
                toast.error(result.error || 'Failed to fetch users');
            }
        } catch (error) {
            console.error('Fetch users error:', error);
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserPermissions = async (userId: string) => {
        setLoadingPermissions(true);
        try {
            const result = await getUserPermissions(userId);
            if (result.success) {
                setPermissions(result.data || []);
                setOriginalPermissions(JSON.parse(JSON.stringify(result.data || [])));
                setGroupedPermissions(result.grouped || {});
            } else {
                toast.error(result.error || 'Failed to fetch permissions');
            }
        } catch (error) {
            console.error('Fetch permissions error:', error);
            toast.error('Failed to fetch permissions');
        } finally {
            setLoadingPermissions(false);
        }
    };

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setSelectedUser(null);
        setHasChanges(false);
    };

    const handleToggle = (
        permissionId: string,
        action: 'canCreate' | 'canRead' | 'canUpdate' | 'canDelete',
        currentValue: boolean
    ) => {
        const newValue = !currentValue;

        setPermissions(prev =>
            prev.map(p => {
                if (p.id === permissionId) {
                    const updated = { ...p, [action]: newValue };
                    updated.granted = updated.canCreate || updated.canRead || updated.canUpdate || updated.canDelete;
                    return updated;
                }
                return p;
            })
        );

        setGroupedPermissions(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(module => {
                updated[module] = updated[module].map(p => {
                    if (p.id === permissionId) {
                        const updatedPerm = { ...p, [action]: newValue };
                        updatedPerm.granted = updatedPerm.canCreate || updatedPerm.canRead || updatedPerm.canUpdate || updatedPerm.canDelete;
                        return updatedPerm;
                    }
                    return p;
                });
            });
            return updated;
        });
    };

    const handleSelectAll = (
        module: string,
        action: 'canCreate' | 'canRead' | 'canUpdate' | 'canDelete',
        value: boolean
    ) => {
        setPermissions(prev =>
            prev.map(p => {
                if (p.module === module) {
                    const updated = { ...p, [action]: value };
                    updated.granted = updated.canCreate || updated.canRead || updated.canUpdate || updated.canDelete;
                    return updated;
                }
                return p;
            })
        );

        setGroupedPermissions(prev => {
            const updated = { ...prev };
            if (updated[module]) {
                updated[module] = updated[module].map(p => {
                    const updatedPerm = { ...p, [action]: value };
                    updatedPerm.granted = updatedPerm.canCreate || updatedPerm.canRead || updatedPerm.canUpdate || updatedPerm.canDelete;
                    return updatedPerm;
                });
            }
            return updated;
        });
    };

    const isAllChecked = (module: string, action: 'canCreate' | 'canRead' | 'canUpdate' | 'canDelete') => {
        const modulePerms = groupedPermissions[module] || [];
        return modulePerms.length > 0 && modulePerms.every(p => p[action]);
    };

    const handleSave = async () => {
        if (!selectedUser) return;

        setSaving(true);
        try {
            const permissionsToSave = permissions.map(p => ({
                permissionId: p.id,
                granted: p.granted,
                canCreate: p.canCreate,
                canRead: p.canRead,
                canUpdate: p.canUpdate,
                canDelete: p.canDelete,
            }));

            const result = await updateUserPermissions(selectedUser.id, permissionsToSave);

            if (result.success) {
                toast.success('Permissions saved successfully!');
                handleCloseDialog();
                fetchUsers(); // Refresh user list to update counts
            } else {
                toast.error(result.error || 'Failed to save permissions');
            }
        } catch (error) {
            console.error('Save permissions error:', error);
            toast.error('Failed to save permissions');
        } finally {
            setSaving(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const layoutProps: LayoutProps = {
        title: "Permission Management",
        role: "super",
        children: (
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <Card className="border-2 border-primary/20 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <Shield className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">Permission Management</CardTitle>
                                    <CardDescription className="text-base mt-1">
                                        Monitor dan kelola hak akses user
                                    </CardDescription>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                {/* User Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>User List</CardTitle>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search users..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-8 w-[250px]"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="text-center">Permissions</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-8 w-[200px]" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-[50px] mx-auto" /></TableCell>
                                                <TableCell><Skeleton className="h-8 w-[80px] ml-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{user.name || 'No Name'}</div>
                                                        <div className="text-sm text-muted-foreground">{user.email}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={roleConfig[user.role]?.color || 'bg-gray-500'}>
                                                        {roleConfig[user.role]?.label || user.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={user.permissionCount && user.permissionCount > 0 ? 'default' : 'secondary'}>
                                                        {user.permissionCount || 0} Permissions
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEditUser(user)}
                                                    >
                                                        <Settings className="h-4 w-4 mr-2" />
                                                        Manage
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                No users found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Edit Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                Manage Permissions
                            </DialogTitle>
                            <DialogDescription>
                                Atur hak akses untuk <strong>{selectedUser?.email}</strong>
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {loadingPermissions ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-64 w-full" />
                                </div>
                            ) : permissions.length > 0 ? (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                                        <span className="text-sm font-medium">Granted Permissions:</span>
                                        <Badge variant="outline">
                                            {permissions.filter(p => p.granted).length} / {permissions.length}
                                        </Badge>
                                    </div>

                                    {Object.entries(groupedPermissions).map(([module, modulePerms]) => (
                                        <div key={module} className="space-y-3">
                                            <div className="flex items-center gap-2 pb-2 border-b">
                                                <span className="text-xl">{moduleIcons[module] || '📋'}</span>
                                                <h3 className="text-lg font-semibold capitalize">{module}</h3>
                                                <Badge variant="secondary" className="ml-auto">
                                                    {modulePerms.filter(p => p.granted).length} / {modulePerms.length}
                                                </Badge>
                                            </div>

                                            <div className="rounded-md border">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-[300px]">Permission</TableHead>
                                                            <TableHead className="text-center w-[100px]">
                                                                <div className="flex flex-col items-center justify-center gap-1 text-xs">
                                                                    <span>Read</span>
                                                                    <Checkbox
                                                                        checked={isAllChecked(module, 'canRead')}
                                                                        onCheckedChange={(checked) => handleSelectAll(module, 'canRead', checked as boolean)}
                                                                        aria-label="Select all Read"
                                                                    />
                                                                </div>
                                                            </TableHead>
                                                            <TableHead className="text-center w-[100px]">
                                                                <div className="flex flex-col items-center justify-center gap-1 text-xs">
                                                                    <span>Create</span>
                                                                    <Checkbox
                                                                        checked={isAllChecked(module, 'canCreate')}
                                                                        onCheckedChange={(checked) => handleSelectAll(module, 'canCreate', checked as boolean)}
                                                                    />
                                                                </div>
                                                            </TableHead>
                                                            <TableHead className="text-center w-[100px]">
                                                                <div className="flex flex-col items-center justify-center gap-1 text-xs">
                                                                    <span>Update</span>
                                                                    <Checkbox
                                                                        checked={isAllChecked(module, 'canUpdate')}
                                                                        onCheckedChange={(checked) => handleSelectAll(module, 'canUpdate', checked as boolean)}
                                                                    />
                                                                </div>
                                                            </TableHead>
                                                            <TableHead className="text-center w-[100px]">
                                                                <div className="flex flex-col items-center justify-center gap-1 text-xs">
                                                                    <span>Delete</span>
                                                                    <Checkbox
                                                                        checked={isAllChecked(module, 'canDelete')}
                                                                        onCheckedChange={(checked) => handleSelectAll(module, 'canDelete', checked as boolean)}
                                                                    />
                                                                </div>
                                                            </TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {modulePerms.map((perm) => (
                                                            <TableRow key={perm.id}>
                                                                <TableCell>
                                                                    <div>
                                                                        <div className="font-medium">{perm.name}</div>
                                                                        <div className="text-xs text-muted-foreground">{perm.code}</div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <Checkbox checked={perm.canRead} onCheckedChange={() => handleToggle(perm.id, 'canRead', perm.canRead)} />
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <Checkbox checked={perm.canCreate} onCheckedChange={() => handleToggle(perm.id, 'canCreate', perm.canCreate)} />
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <Checkbox checked={perm.canUpdate} onCheckedChange={() => handleToggle(perm.id, 'canUpdate', perm.canUpdate)} />
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <Checkbox checked={perm.canDelete} onCheckedChange={() => handleToggle(perm.id, 'canDelete', perm.canDelete)} />
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">User has no roles or permissions assigned.</p>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                            <Button onClick={handleSave} disabled={!hasChanges || saving}>
                                {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        )
    };

    return <SuperLayout {...layoutProps} />;
}
