// components/master/coa/UpdateCoaForm.tsx
"use client";

import { JSX, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CoaFormData } from "@/schemas/coa";
import { CoaCashflowType, CoaFormDefaultValues, CoaNormalBalance, CoaPostingType, CoaStatus, CoaType } from "@/types/coa";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, X, Landmark, CreditCard, Building, BarChart3, Wallet, PiggyBank, ChevronDown } from "lucide-react";

interface UpdateCoaFormProps {
    coaData: CoaFormDefaultValues;
    onSubmit: (formData: CoaFormData) => void;
    onCancel: () => void;
    isLoading: boolean;
    role: { id: string } | null;
    parentAccounts?: Array<{ id: string; code: string; name: string; type: CoaType; parentId:string }>;
}

export function UpdateCoaForm({ coaData, onSubmit, onCancel, isLoading, role, parentAccounts = [] }: UpdateCoaFormProps) {
    const [formData, setFormData] = useState<CoaFormData>({
        code: coaData.code || "",
        name: coaData.name || "",
        description: coaData.description || "",
        type: coaData.type || CoaType.ASET,
        normalBalance: coaData.normalBalance || CoaNormalBalance.DEBIT,
        postingType: coaData.postingType || CoaPostingType.POSTING,
        cashflowType: coaData.cashflowType || CoaCashflowType.NONE,
        status: coaData.status || CoaStatus.ACTIVE,
        isReconcilable: coaData.isReconcilable || false,
        defaultCurrency: coaData.defaultCurrency || "IDR",
        parentId: coaData.parentId || null,
        taxRateId: coaData.taxRateId || null,
    });

    const [filteredParentAccounts, setFilteredParentAccounts] = useState(parentAccounts);
    const [hasChanges, setHasChanges] = useState(false);

    // Filter parent accounts berdasarkan type dan exclude current account
    useEffect(() => {
        if (formData.type) {
            const filtered = parentAccounts.filter(account =>
                account.type === formData.type && account.id !== coaData.id
            );
            setFilteredParentAccounts(filtered);
        } else {
            setFilteredParentAccounts(parentAccounts.filter(account => account.id !== coaData.id));
        }
    }, [formData.type, parentAccounts, coaData.id]);

    // Check for changes
    useEffect(() => {
        const originalData = {
            code: coaData.code || "",
            name: coaData.name || "",
            description: coaData.description || "",
            type: coaData.type || CoaType.ASET,
            normalBalance: coaData.normalBalance || CoaNormalBalance.DEBIT,
            postingType: coaData.postingType || CoaPostingType.POSTING,
            cashflowType: coaData.cashflowType || CoaCashflowType.NONE,
            status: coaData.status || CoaStatus.ACTIVE,
            isReconcilable: coaData.isReconcilable || false,
            defaultCurrency: coaData.defaultCurrency || "IDR",
            parentId: coaData.parentId || null,
        };

        const currentData = { ...formData };
        const changed = JSON.stringify(originalData) !== JSON.stringify(currentData);
        setHasChanges(changed);
    }, [formData, coaData]);

    console.log("Role", role);

    const getDefaultNormalBalance = (type: CoaType): CoaNormalBalance => {
        switch (type) {
            case CoaType.ASET:
            case CoaType.BEBAN:
                return CoaNormalBalance.DEBIT;
            case CoaType.LIABILITAS:
            case CoaType.EKUITAS:
            case CoaType.PENDAPATAN:
                return CoaNormalBalance.CREDIT;
            default:
                return CoaNormalBalance.DEBIT;
        }
    };

    const handleChange = (field: string, value: string | boolean | null) => {
        setFormData(prev => {
            const newData = {
                ...prev,
                [field]: value
            };

            if (field === 'type' && value) {
                newData.normalBalance = getDefaultNormalBalance(value as CoaType);

                // Clear parent if type changes and parent type doesn't match
                if (prev.parentId) {
                    const currentParent = parentAccounts.find(acc => acc.id === prev.parentId);
                    if (currentParent && currentParent.type !== value) {
                        newData.parentId = null;
                    }
                }
            }

            return newData;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.code.trim() || !formData.name.trim() || !formData.type) {
            alert("Harap isi semua field yang wajib diisi");
            return;
        }

        const debitTypes = [CoaType.ASET, CoaType.BEBAN];
        const creditTypes = [CoaType.LIABILITAS, CoaType.EKUITAS, CoaType.PENDAPATAN];

        if (debitTypes.includes(formData.type as CoaType) && formData.normalBalance !== CoaNormalBalance.DEBIT) {
            alert(`Akun ${formData.type} harus memiliki saldo normal Debit`);
            return;
        }

        if (creditTypes.includes(formData.type as CoaType) && formData.normalBalance !== CoaNormalBalance.CREDIT) {
            alert(`Akun ${formData.type} harus memiliki saldo normal Credit`);
            return;
        }

        // Prevent circular reference - account cannot be its own parent
        if (formData.parentId === coaData.id) {
            alert("Account tidak dapat menjadi induk dari dirinya sendiri");
            return;
        }

        const submitData: CoaFormData = {
            ...formData,
            code: formData.code.trim().toUpperCase(),
            name: formData.name.trim(),
            description: formData.description?.trim() || "",
            parentId: formData.parentId || null,
        };

        console.log("Updating COA Data:", submitData);
        onSubmit(submitData);
    };

    const getAccountTypeIcon = (type: string) => {
        const icons: Record<string, JSX.Element> = {
            [CoaType.ASET]: <Landmark className="h-4 w-4" />,
            [CoaType.LIABILITAS]: <CreditCard className="h-4 w-4" />,
            [CoaType.EKUITAS]: <Building className="h-4 w-4" />,
            [CoaType.PENDAPATAN]: <BarChart3 className="h-4 w-4" />,
            [CoaType.BEBAN]: <Wallet className="h-4 w-4" />,
        };
        return icons[type] || <PiggyBank className="h-4 w-4" />;
    };

    const getStatusBadge = (status: CoaStatus) => {
        switch (status) {
            case CoaStatus.ACTIVE:
                return <Badge variant="default">Active</Badge>;
            case CoaStatus.INACTIVE:
                return <Badge variant="secondary">Inactive</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getParentAccountLabel = (parentId: string | null) => {
        if (!parentId) return "No Parent (Top Level Account)";
        const parent = parentAccounts.find(acc => acc.id === parentId);
        return parent ? `${parent.code} - ${parent.name}` : "Parent not found";
    };

    const checkCircularReference = (parentId: string | null): boolean => {
        if (!parentId) return false;
        
        // Check if the selected parent is a descendant of current account
        const checkDescendant = (accountId: string, targetId: string): boolean => {
            const children = parentAccounts.filter(acc => acc.parentId === accountId);
            for (const child of children) {
                if (child.id === targetId) return true;
                if (checkDescendant(child.id, targetId)) return true;
            }
            return false;
        };

        return checkDescendant(coaData.id, parentId);
    };

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Landmark className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold">
                                    Edit Chart of Account
                                </CardTitle>
                                <CardDescription className="text-green-100">
                                    Update account details in your chart of accounts
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {getStatusBadge(formData.status as CoaStatus)}
                            {hasChanges && (
                                <Badge variant="outline" className="bg-yellow-500 text-white border-yellow-600">
                                    Unsaved Changes
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                {/* Account ID (Read-only) */}
                                <div className="space-y-2">
                                    <Label htmlFor="accountId" className="font-semibold">Account ID</Label>
                                    <Input
                                        id="accountId"
                                        value={coaData.id}
                                        disabled
                                        className="bg-gray-100 text-gray-600 uppercase"
                                    />
                                    <p className="text-xs text-gray-500">Unique account identifier (cannot be changed)</p>
                                </div>

                                {/* Account Code & Name */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="code" className="flex items-center gap-2">
                                            <span className="font-semibold">Account Code</span>
                                            <Badge variant="outline" className="text-xs">Required</Badge>
                                        </Label>
                                        <Input
                                            id="code"
                                            value={formData.code}
                                            onChange={(e) => handleChange("code", e.target.value)}
                                            placeholder="e.g., 1001"
                                            required
                                            className="focus:ring-2 focus:ring-green-500 uppercase"
                                            pattern="[A-Z0-9.-]+"
                                            title="Hanya huruf kapital, angka, titik, dan strip diperbolehkan"
                                        />
                                        <p className="text-xs text-gray-500">Kode unik untuk akun (auto uppercase)</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="flex items-center gap-2">
                                            <span className="font-semibold">Account Name</span>
                                            <Badge variant="outline" className="text-xs">Required</Badge>
                                        </Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => handleChange("name", e.target.value)}
                                            placeholder="e.g., Cash and Cash Equivalents"
                                            required
                                            className="focus:ring-2 focus:ring-green-500"
                                        />
                                        <p className="text-xs text-gray-500">Nama deskriptif untuk akun</p>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="font-semibold">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description || ""}
                                        onChange={(e) => handleChange("description", e.target.value)}
                                        placeholder="Enter account description or notes..."
                                        rows={3}
                                        className="focus:ring-2 focus:ring-green-500 resize-none"
                                    />
                                </div>

                                {/* Account Classification */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="type" className="flex items-center gap-2">
                                            <span className="font-semibold">Account Type</span>
                                            <Badge variant="outline" className="text-xs">Required</Badge>
                                        </Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(value) => handleChange("type", value)}
                                        >
                                            <SelectTrigger className="focus:ring-2 focus:ring-green-500">
                                                <SelectValue placeholder="Select account type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={CoaType.ASET}>
                                                    <div className="flex items-center gap-2">
                                                        {getAccountTypeIcon(CoaType.ASET)}
                                                        <span>Asset</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value={CoaType.LIABILITAS}>
                                                    <div className="flex items-center gap-2">
                                                        {getAccountTypeIcon(CoaType.LIABILITAS)}
                                                        <span>Liability</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value={CoaType.EKUITAS}>
                                                    <div className="flex items-center gap-2">
                                                        {getAccountTypeIcon(CoaType.EKUITAS)}
                                                        <span>Equity</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value={CoaType.PENDAPATAN}>
                                                    <div className="flex items-center gap-2">
                                                        {getAccountTypeIcon(CoaType.PENDAPATAN)}
                                                        <span>Income</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value={CoaType.BEBAN}>
                                                    <div className="flex items-center gap-2">
                                                        {getAccountTypeIcon(CoaType.BEBAN)}
                                                        <span>Expense</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="normalBalance" className="flex items-center gap-2">
                                            <span className="font-semibold">Normal Balance</span>
                                            <Badge variant="outline" className="text-xs">Required</Badge>
                                        </Label>
                                        <Select
                                            value={formData.normalBalance}
                                            onValueChange={(value) => handleChange("normalBalance", value)}
                                        >
                                            <SelectTrigger className="focus:ring-2 focus:ring-green-500">
                                                <SelectValue placeholder="Select normal balance" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={CoaNormalBalance.DEBIT}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                        <span>Debit</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value={CoaNormalBalance.CREDIT}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                        <span>Credit</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {(() => {
                                            const isDebitType = [CoaType.ASET, CoaType.BEBAN].includes(formData.type as CoaType);
                                            const isCreditType = [CoaType.LIABILITAS, CoaType.EKUITAS, CoaType.PENDAPATAN].includes(formData.type as CoaType);
                                            const hasMismatch =
                                                (isDebitType && formData.normalBalance === CoaNormalBalance.CREDIT) ||
                                                (isCreditType && formData.normalBalance === CoaNormalBalance.DEBIT);

                                            if (hasMismatch) {
                                                return (
                                                    <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                                                        <p className="text-xs text-red-600 font-medium">
                                                            ⚠️ Peringatan: {formData.type} biasanya memiliki saldo normal {isDebitType ? 'Debit' : 'Credit'}
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                </div>

                                {/* Parent Account */}
                                <div className="space-y-2">
                                    <Label htmlFor="parentId" className="font-semibold">Account Induk</Label>
                                    <Select
                                        value={formData.parentId || "NO_PARENT"}
                                        onValueChange={(value) => handleChange("parentId", value === "NO_PARENT" ? null : value)}
                                    >
                                        <SelectTrigger className="focus:ring-2 focus:ring-green-500">
                                            <SelectValue placeholder="Pilih account induk (opsional)">
                                                {formData.parentId ? getParentAccountLabel(formData.parentId) : "No Parent (Top Level Account)"}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NO_PARENT">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <ChevronDown className="h-4 w-4" />
                                                    <span>No Parent (Top Level Account)</span>
                                                </div>
                                            </SelectItem>
                                            {filteredParentAccounts.length > 0 ? (
                                                filteredParentAccounts.map((account) => (
                                                    <SelectItem key={account.id} value={account.id}>
                                                        <div className="flex items-center gap-2">
                                                            {getAccountTypeIcon(account.type)}
                                                            <span className="font-mono text-sm">{account.code}</span>
                                                            <span>-</span>
                                                            <span className="truncate">{account.name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="px-2 py-4 text-center text-sm text-gray-500">
                                                    No parent accounts available for this account type
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <div className="flex flex-col gap-1 text-xs text-gray-500">
                                        <p>• Pilih account induk untuk membuat hierarki akun</p>
                                        <p>• Kosongkan untuk membuat account level teratas</p>
                                        <p>• Hanya menampilkan account dengan tipe yang sama: <strong>{formData.type}</strong></p>
                                        {formData.parentId && (
                                            <p className="text-blue-600 font-medium">
                                                ✓ Account ini akan menjadi sub-account dari: {getParentAccountLabel(formData.parentId)}
                                            </p>
                                        )}
                                        {formData.parentId && checkCircularReference(formData.parentId) && (
                                            <p className="text-red-600 font-medium">
                                                                ⚠️ Peringatan: Circular reference terdeteksi!
                                            </p>
                                        )}
                                        {filteredParentAccounts.length === 0 && formData.type && (
                                            <p className="text-amber-600 font-medium">
                                                ℹ️ Tidak ada account induk yang tersedia untuk tipe {formData.type}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Advanced Settings */}
                            <div className="space-y-6 border-l pl-6 lg:pl-8">
                                <h3 className="font-semibold text-lg text-gray-700">Advanced Settings</h3>

                                {/* Posting Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="postingType" className="font-semibold">Posting Type</Label>
                                    <Select
                                        value={formData.postingType}
                                        onValueChange={(value) => handleChange("postingType", value)}
                                    >
                                        <SelectTrigger className="focus:ring-2 focus:ring-green-500">
                                            <SelectValue placeholder="Select posting type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={CoaPostingType.HEADER}>Header</SelectItem>
                                            <SelectItem value={CoaPostingType.POSTING}>Posting</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Cashflow Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="cashflowType" className="font-semibold">Cashflow Category</Label>
                                    <Select
                                        value={formData.cashflowType}
                                        onValueChange={(value) => handleChange("cashflowType", value)}
                                    >
                                        <SelectTrigger className="focus:ring-2 focus:ring-green-500">
                                            <SelectValue placeholder="Select cashflow type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={CoaCashflowType.NONE}>None</SelectItem>
                                            <SelectItem value={CoaCashflowType.OPERASIONAL}>Operational</SelectItem>
                                            <SelectItem value={CoaCashflowType.INVESTASI}>Investment</SelectItem>
                                            <SelectItem value={CoaCashflowType.PENDANAAN}>Financing</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                    <Label htmlFor="status" className="font-semibold">Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => handleChange("status", value)}
                                    >
                                        <SelectTrigger className="focus:ring-2 focus:ring-green-500">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={CoaStatus.ACTIVE}>Active</SelectItem>
                                            <SelectItem value={CoaStatus.INACTIVE}>Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Currency */}
                                <div className="space-y-2">
                                    <Label htmlFor="defaultCurrency" className="font-semibold">Default Currency</Label>
                                    <Select
                                        value={formData.defaultCurrency}
                                        onValueChange={(value) => handleChange("defaultCurrency", value)}
                                    >
                                        <SelectTrigger className="focus:ring-2 focus:ring-green-500">
                                            <SelectValue placeholder="Select currency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
                                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                                            <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Reconcilable Switch */}
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                    <div className="space-y-1">
                                        <Label htmlFor="isReconcilable" className="font-semibold cursor-pointer">
                                            Reconcile Account
                                        </Label>
                                        <p className="text-xs text-gray-500">
                                            Enable for bank accounts that need reconciliation
                                        </p>
                                    </div>
                                    <Switch
                                        id="isReconcilable"
                                        checked={formData.isReconcilable}
                                        onCheckedChange={(checked) => handleChange("isReconcilable", checked)}
                                    />
                                </div>

                                {/* Last Updated Info */}
                                <div className="p-3 border rounded-lg bg-blue-50">
                                    <h4 className="font-semibold text-sm text-blue-800 mb-2">Account Information</h4>
                                    <div className="space-y-1 text-xs text-blue-600">
                                        <p>ID: {coaData.id}</p>
                                        {coaData.createdAt && (
                                            <p>Created: {new Date(coaData.createdAt).toLocaleDateString()}</p>
                                        )}
                                        {coaData.updatedAt && (
                                            <p>Last Updated: {new Date(coaData.updatedAt).toLocaleDateString()}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={isLoading}
                                className="flex items-center gap-2 sm:w-auto w-full"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || !hasChanges}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 sm:w-auto w-full disabled:bg-gray-400"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        {hasChanges ? "Update Account" : "No Changes"}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}