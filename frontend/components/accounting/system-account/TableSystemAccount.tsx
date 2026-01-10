"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Edit2, Settings, ShieldCheck, Search, Loader2, Plus, Filter, ChevronRight, Globe } from "lucide-react";
import { SystemAccount } from "@/types/accounting";
import { getSystemAccounts, upsertSystemAccount } from "@/lib/action/systemAccount";
import { useCOAs } from "@/hooks/use-coa";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TableSystemAccount() {
    const [data, setData] = useState<SystemAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<SystemAccount | null>(null);
    const [newCoaId, setNewCoaId] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newMapping, setNewMapping] = useState({ key: "", description: "", coaId: "" });
    const [viewMode, setViewMode] = useState<"table" | "card">("table");

    const { data: coaData, isLoading: isLoadingCoa } = useCOAs({ limit: 1000, postingType: "POSTING" as any });

    const fetchData = async () => {
        setIsLoading(true);
        const res = await getSystemAccounts();
        if (res.success) {
            setData(res.data);
        } else {
            toast.error(res.message || "Gagal mengambil data system account");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEdit = (account: SystemAccount) => {
        setSelectedAccount(account);
        setNewCoaId(account.coaId);
        setEditDescription(account.description || "");
        setIsEditDialogOpen(true);
    };

    const handleSave = async () => {
        if (!selectedAccount || !newCoaId) return;

        setIsSaving(true);
        const res = await upsertSystemAccount({
            key: selectedAccount.key,
            description: editDescription,
            coaId: newCoaId,
        });

        if (res.success) {
            toast.success("Mapping akun berhasil diperbarui");
            setIsEditDialogOpen(false);
            fetchData();
        } else {
            toast.error(res.message || "Gagal memperbarui mapping");
        }
        setIsSaving(false);
    };

    const handleCreate = async () => {
        if (!newMapping.key || !newMapping.coaId) {
            toast.error("Key dan Akun wajib diisi");
            return;
        }

        setIsSaving(true);
        const res = await upsertSystemAccount(newMapping);

        if (res.success) {
            toast.success("Mapping baru berhasil dibuat");
            setIsCreateDialogOpen(false);
            setNewMapping({ key: "", description: "", coaId: "" });
            fetchData();
        } else {
            toast.error(res.message || "Gagal membuat mapping");
        }
        setIsSaving(false);
    };

    const filteredData = data.filter((item) =>
        item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.coa?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.coa?.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Responsive: Switch to card view on mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setViewMode("card");
            } else {
                setViewMode("table");
            }
        };

        handleResize(); // Set initial view
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className="space-y-4 px-1 md:px-0">
            {/* Header Section */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">System Account Mapping</h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Kelola mapping antara system key dengan Chart of Accounts
                        </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 w-9 p-0 sm:w-auto sm:px-3">
                                    <Filter className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">View</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setViewMode("table")}>
                                    Tabel View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setViewMode("card")}>
                                    Card View
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            onClick={() => setIsCreateDialogOpen(true)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md text-xs h-9 w-full sm:w-auto flex-1 sm:flex-none"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Tambah Mapping</span>
                            <span className="sm:hidden">Tambah</span>
                        </Button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Cari key, deskripsi, atau nama akun..."
                        className="pl-9 text-sm h-10 bg-white shadow-sm border-gray-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                            onClick={() => setSearchTerm("")}
                        >
                            ×
                        </Button>
                    )}
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                    <Card className="bg-white/80 backdrop-blur-sm border-gray-100">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500">Total Mapping</p>
                                    <p className="text-lg sm:text-xl font-bold">{data.length}</p>
                                </div>
                                <Globe className="h-5 w-5 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/80 backdrop-blur-sm border-gray-100">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500">Mapped</p>
                                    <p className="text-lg sm:text-xl font-bold text-green-600">
                                        {data.filter(item => item.coaId).length}
                                    </p>
                                </div>
                                <ShieldCheck className="h-5 w-5 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/80 backdrop-blur-sm border-gray-100">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500">Unmapped</p>
                                    <p className="text-lg sm:text-xl font-bold text-amber-600">
                                        {data.filter(item => !item.coaId).length}
                                    </p>
                                </div>
                                <Badge variant="outline" className="border-amber-300 text-amber-600">!</Badge>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/80 backdrop-blur-sm border-gray-100">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500">Tersaring</p>
                                    <p className="text-lg sm:text-xl font-bold text-indigo-600">{filteredData.length}</p>
                                </div>
                                <Filter className="h-5 w-5 text-indigo-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Data Display - Responsive View */}
            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-lg" />
                    ))}
                </div>
            ) : filteredData.length === 0 ? (
                <Card className="border-dashed border-2 bg-gray-50/50">
                    <CardContent className="py-12 text-center">
                        <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Data tidak ditemukan</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Tidak ada mapping yang cocok dengan pencarian "{searchTerm}"
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => setSearchTerm("")}
                            className="text-sm"
                        >
                            Tampilkan semua data
                        </Button>
                    </CardContent>
                </Card>
            ) : viewMode === "table" ? (
                // Desktop Table View
                <Card className="border-none shadow-lg overflow-hidden bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[25%] font-bold text-gray-700 text-xs sm:text-sm py-3 sm:py-4">System Key</TableHead>
                                        <TableHead className="w-[60%] font-bold text-gray-700 text-xs sm:text-sm py-3 sm:py-4">Description</TableHead>
                                        <TableHead className="w-[30%] font-bold text-gray-700 text-xs sm:text-sm py-3 sm:py-4">Mapped COA</TableHead>
                                        <TableHead className="w-[20%] text-right font-bold text-gray-700 text-xs sm:text-sm py-3 sm:py-4">Status & Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.map((item) => (
                                        <TableRow key={item.id} className="group hover:bg-blue-50/30 transition-all duration-200 border-b border-gray-100">
                                            <TableCell className="py-3 sm:py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-blue-100 rounded-lg">
                                                        <ShieldCheck className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div className="font-mono text-xs sm:text-sm font-semibold text-gray-900">
                                                        {item.key}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 sm:py-4">
                                                <div className="text-xs sm:text-sm text-gray-600 italic text-wrap">
                                                    {item.description || (
                                                        <span className="text-gray-400">No description</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 sm:py-4">
                                                {item.coa ? (
                                                    <div className="flex flex-col gap-1.5 group/coa">
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant="outline"
                                                                className="bg-green-700 text-white border-green-600 font-mono text-[12px] px-2 py-0 h-5"
                                                            >
                                                                {item.coa.code}
                                                            </Badge>
                                                            <span className="text-sm font-bold text-gray-800 truncate group-hover/coa:text-blue-700 transition-colors">
                                                                {item.coa.name}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 px-1">
                                                            <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                                                                <span className="h-1 w-1 rounded-full bg-blue-400"></span>
                                                                {item.coa.type}
                                                            </span>
                                                            <span className="text-gray-300">•</span>
                                                            <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                                                                <span className="h-1 w-1 rounded-full bg-indigo-400"></span>
                                                                {item.coa.normalBalance}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex">
                                                        <Badge
                                                            className="bg-red-600 text-white border-transparent hover:bg-red-700 transition-all duration-300 px-3 py-1 shadow-md font-bold text-[10px] flex items-center gap-1.5"
                                                        >
                                                            <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse"></div>
                                                            Perlu Mapping Akun
                                                        </Badge>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right py-3 sm:py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {!item.coaId && (
                                                        <Badge variant="outline" className="text-[10px] px-2 text-amber-600 border-amber-200">
                                                            Perlu Mapping
                                                        </Badge>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                        onClick={() => handleEdit(item)}
                                                    >
                                                        <Edit2 className="h-4 w-4 text-gray-600 hover:text-blue-600 transition-colors" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                // Mobile Card View
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredData.map((item) => (
                        <Card key={item.id} className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 hover:border-l-blue-600">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <ShieldCheck className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                            <h4 className="font-mono text-sm font-bold text-gray-900 truncate">
                                                {item.key}
                                            </h4>
                                        </div>
                                        <p className="text-xs text-gray-600 mb-3 italic">
                                            {item.description || "No description"}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 flex-shrink-0 -mt-1 -mr-2"
                                        onClick={() => handleEdit(item)}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <div className="text-[10px] uppercase text-gray-500 font-medium mb-1">
                                            Mapped Account
                                        </div>
                                        {item.coa ? (
                                            <div className="bg-green-50 rounded-lg p-3">
                                                <div className="flex items-center justify-between mb-1">
                                                    <Badge className="bg-green-600 hover:bg-green-700 text-[10px]">
                                                        {item.coa.code}
                                                    </Badge>
                                                    <ChevronRight className="h-3 w-3 text-green-600" />
                                                </div>
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {item.coa.name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Badge variant="outline" className="text-[9px] px-1.5">
                                                        {item.coa.type}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[9px] px-1.5">
                                                        {item.coa.normalBalance}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse"></div>
                                                    <span className="text-sm font-medium text-amber-700">
                                                        Not Mapped
                                                    </span>
                                                </div>
                                                <p className="text-xs text-amber-600 mt-1">
                                                    Click edit to assign a COA account
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination/Info Footer */}
            {!isLoading && filteredData.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-gray-500">
                        Menampilkan <span className="font-medium">{filteredData.length}</span> dari{' '}
                        <span className="font-medium">{data.length}</span> mapping
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1">
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            <span>Mapped</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
                            <span>Unmapped</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <Settings className="h-5 w-5 text-blue-600" />
                            Edit System Mapping
                        </DialogTitle>
                        <DialogDescription>
                            Ubah akun Chart of Accounts (COA) untuk system key ini.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-gray-600">System Key</Label>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                                <ShieldCheck className="h-4 w-4 text-blue-600" />
                                <span className="font-mono font-medium">{selectedAccount?.key}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-gray-600">Description</Label>
                            <Input
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Masukkan deskripsi fungsi akun..."
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold uppercase text-gray-600">Chart of Account</Label>
                                <span className="text-xs text-blue-600 font-medium">Required</span>
                            </div>
                            <Select value={newCoaId} onValueChange={setNewCoaId}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Pilih akun COA..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[350px]">
                                    {isLoadingCoa ? (
                                        <div className="flex items-center justify-center p-6">
                                            <Loader2 className="h-5 w-5 animate-spin mr-3 text-gray-400" />
                                            <span className="text-sm text-gray-500">Loading accounts...</span>
                                        </div>
                                    ) : (
                                        coaData?.data?.map((coa: any) => (
                                            <SelectItem key={coa.id} value={coa.id}>
                                                <div className="flex flex-col py-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {coa.code}
                                                        </Badge>
                                                        <span className="text-sm font-medium truncate">{coa.name}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1 flex gap-2">
                                                        <span>{coa.type}</span>
                                                        <span>•</span>
                                                        <span>{coa.normalBalance}</span>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedAccount?.coa && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <div className="text-xs font-medium text-blue-800 mb-1">Current Mapping:</div>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-blue-600">{selectedAccount.coa.code}</Badge>
                                    <span className="text-sm text-blue-900">{selectedAccount.coa.name}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !newCoaId}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 min-w-[100px]"
                        >
                            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <Plus className="h-5 w-5 text-blue-600" />
                            Tambah System Mapping Baru
                        </DialogTitle>
                        <DialogDescription>
                            Daftarkan system key baru dan hubungkan ke Chart of Accounts.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold uppercase text-gray-600">System Key</Label>
                                <span className="text-xs text-blue-600 font-medium">Required</span>
                            </div>
                            <Input
                                placeholder="Contoh: ACCOUNTS_RECEIVABLE, SALES_REVENUE"
                                value={newMapping.key}
                                onChange={(e) => setNewMapping({ ...newMapping, key: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                                className="h-10 font-mono"
                            />
                            <p className="text-xs text-gray-500">
                                Gunakan format UPPER_CASE dengan underscore
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-gray-600">Description</Label>
                            <Input
                                placeholder="Deskripsi fungsi akun ini dalam sistem..."
                                value={newMapping.description}
                                onChange={(e) => setNewMapping({ ...newMapping, description: e.target.value })}
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold uppercase text-gray-600">Chart of Account</Label>
                                <span className="text-xs text-blue-600 font-medium">Required</span>
                            </div>
                            <Select value={newMapping.coaId} onValueChange={(val) => setNewMapping({ ...newMapping, coaId: val })}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Pilih akun COA..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[350px]">
                                    {isLoadingCoa ? (
                                        <div className="flex items-center justify-center p-6">
                                            <Loader2 className="h-5 w-5 animate-spin mr-3 text-gray-400" />
                                            <span className="text-sm text-gray-500">Loading accounts...</span>
                                        </div>
                                    ) : (
                                        coaData?.data?.map((coa: any) => (
                                            <SelectItem key={coa.id} value={coa.id}>
                                                <div className="flex flex-col py-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {coa.code}
                                                        </Badge>
                                                        <span className="text-sm font-medium truncate">{coa.name}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1 flex gap-2">
                                                        <span>{coa.type}</span>
                                                        <span>•</span>
                                                        <span>{coa.normalBalance}</span>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={isSaving || !newMapping.key || !newMapping.coaId}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 min-w-[100px]"
                        >
                            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {isSaving ? "Creating..." : "Create Mapping"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}