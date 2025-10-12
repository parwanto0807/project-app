// components/master/coa/CoaForm.tsx
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
import { Loader2, Plus, X, Landmark, CreditCard, Building, BarChart3, Wallet, PiggyBank, ChevronDown } from "lucide-react";

interface CoaFormProps {
    onSubmit: (formData: CoaFormData) => void;
    onCancel: () => void;
    isLoading: boolean;
    role: { id: string } | null;
    initialData?: CoaFormDefaultValues;
    parentAccounts?: Array<{ id: string; code: string; name: string; type: CoaType }>;
}

export function CreateCoaForm({ onSubmit, onCancel, isLoading, role, initialData, parentAccounts = [] }: CoaFormProps) {
    const [formData, setFormData] = useState<CoaFormData>({
        code: initialData?.code || "",
        name: initialData?.name || "",
        description: initialData?.description || "",
        type: initialData?.type || CoaType.ASET,
        normalBalance: initialData?.normalBalance || CoaNormalBalance.DEBIT,
        postingType: initialData?.postingType || CoaPostingType.POSTING,
        cashflowType: initialData?.cashflowType || CoaCashflowType.NONE,
        status: initialData?.status || CoaStatus.ACTIVE,
        isReconcilable: initialData?.isReconcilable || false,
        defaultCurrency: initialData?.defaultCurrency || "IDR",
        parentId: initialData?.parentId || null,
        taxRateId: initialData?.taxRateId || null,
    });

    const [filteredParentAccounts, setFilteredParentAccounts] = useState(parentAccounts);

    useEffect(() => {
        if (formData.type) {
            const filtered = parentAccounts.filter(account =>
                account.type === formData.type
            );
            setFilteredParentAccounts(filtered);
        } else {
            setFilteredParentAccounts(parentAccounts);
        }
    }, [formData.type, parentAccounts]);

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

        const submitData: CoaFormData = {
            ...formData,
            code: formData.code.trim().toUpperCase(),
            name: formData.name.trim(),
            description: formData.description?.trim() || "",
            parentId: formData.parentId || null,
        };

        console.log("Submitting COA Data:", submitData);
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

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Landmark className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold">
                                    {initialData ? "Edit Chart of Account" : "Create New Chart of Account"}
                                </CardTitle>
                                <CardDescription className="text-blue-100">
                                    {initialData
                                        ? "Update account details in your chart of accounts"
                                        : "Add a new account to your chart of accounts system"
                                    }
                                </CardDescription>
                            </div>
                        </div>
                        {initialData && getStatusBadge(formData.status as CoaStatus)}
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
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
                                            className="focus:ring-2 focus:ring-blue-500 uppercase"
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
                                            className="focus:ring-2 focus:ring-blue-500"
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
                                        className="focus:ring-2 focus:ring-blue-500 resize-none"
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
                                            <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
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
                                            <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
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

                                {/* Parent Account - FIXED VERSION */}
                                <div className="space-y-2">
                                    <Label htmlFor="parentId" className="font-semibold">Account Induk</Label>
                                    <Select
                                        value={formData.parentId || "NO_PARENT"}
                                        onValueChange={(value) => handleChange("parentId", value === "NO_PARENT" ? null : value)}
                                    >
                                        <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
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
                                        <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
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
                                        <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
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
                                        <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
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
                                        <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
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
                                disabled={isLoading}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 sm:w-auto w-full"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {initialData ? "Updating..." : "Creating..."}
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4" />
                                        {initialData ? "Update Account" : "Create Account"}
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