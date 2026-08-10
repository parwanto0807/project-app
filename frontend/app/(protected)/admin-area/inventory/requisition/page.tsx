"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Play, Download, Loader2, CheckCircle, XCircle, Plus, Trash2, Building, Warehouse, User, Receipt, Info, ShoppingBag, ChevronsUpDown, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { useSession } from "@/components/clientSessionProvider";

import HeaderCard from "@/components/ui/header-card";
import { getDataMr, bulkIssueMR } from "@/lib/action/inventory/mrInventroyAction";
import TableMR from "@/components/inventoryMr/TableMr";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ProductCombobox } from "@/components/pr/productCombobox";
import { getAllWarehouses, getInventoryMonitoring } from "@/lib/action/inventory/inventoryAction";
import { fetchAllKaryawan } from "@/lib/action/master/karyawan";
import { coaApi } from "@/lib/action/coa/coa";
import { fetchAllProducts } from "@/lib/action/master/product";
import { createDirectMRAction } from "@/lib/action/inventory/mrInventroyAction";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

function SearchableSelect({
    value,
    onValueChange,
    options,
    placeholder,
    searchPlaceholder,
    emptyText = "Tidak ditemukan",
    icon: Icon
}: {
    value: string;
    onValueChange: (val: string) => void;
    options: Array<{ id: string; label: string; sublabel?: string }>;
    placeholder: string;
    searchPlaceholder?: string;
    emptyText?: string;
    icon?: any;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find((o) => o.id === value);

    // Auto focus search input when dropdown opens
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const filteredOptions = options.filter((opt) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase().trim();
        const labelMatch = opt.label ? opt.label.toLowerCase().includes(q) : false;
        const sublabelMatch = opt.sublabel ? opt.sublabel.toLowerCase().includes(q) : false;
        return labelMatch || sublabelMatch;
    });

    const handleSelect = (id: string) => {
        onValueChange(id);
        setIsOpen(false);
        setSearch("");
    };

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Trigger Button */}
            <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen((prev) => !prev)}
                className="w-full justify-between bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 shadow-sm focus:ring-emerald-500 rounded-lg text-left font-normal h-10 px-3"
            >
                <span className="truncate flex items-center gap-2">
                    {Icon && <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                    {selectedOption ? (
                        <span className="truncate">
                            {selectedOption.sublabel ? (
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400 mr-1.5 font-mono text-xs bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                                    {selectedOption.sublabel}
                                </span>
                            ) : null}
                            <span className="font-medium text-slate-800 dark:text-slate-200">{selectedOption.label}</span>
                        </span>
                    ) : (
                        <span className="text-slate-400">{placeholder}</span>
                    )}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {/* Dropdown Content */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-full min-w-[320px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[9999] p-2 space-y-2 animate-in fade-in-50 zoom-in-95">
                    {/* Search Input Box */}
                    <div className="relative flex items-center">
                        <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={searchPlaceholder || "Cari..."}
                            className="pl-9 pr-8 h-9 text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg focus-visible:ring-emerald-500"
                            onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                    setIsOpen(false);
                                }
                            }}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Options List */}
                    <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
                        {filteredOptions.length === 0 ? (
                            <div className="py-4 text-center text-xs text-slate-400">
                                {emptyText}
                            </div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = value === opt.id;
                                return (
                                    <div
                                        key={opt.id}
                                        onClick={() => handleSelect(opt.id)}
                                        className={cn(
                                            "cursor-pointer py-2 px-3 rounded-lg flex items-center justify-between text-sm transition-colors",
                                            isSelected
                                                ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 font-semibold"
                                                : "hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            {opt.sublabel && (
                                                <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded shrink-0">
                                                    {opt.sublabel}
                                                </span>
                                            )}
                                            <span className="truncate">{opt.label}</span>
                                        </div>
                                        {isSelected && (
                                            <Check className="h-4 w-4 text-emerald-600 shrink-0 ml-2" />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MaterialRequisitionPage() {
    const [allMR, setAllMR] = useState<any[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isInternalLoading, setIsInternalLoading] = useState(true);

    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkProgress, setBulkProgress] = useState("");
    const [bulkResult, setBulkResult] = useState<{ succeeded: any[]; failed: any[] } | null>(null);

    const router = useRouter();
    const { user, isLoading: sessionLoading } = useSession();

    // States for Direct MR Dialog (Office Use)
    const [isDirectOpen, setIsDirectOpen] = useState(false);
    const [directWarehouseId, setDirectWarehouseId] = useState("");
    const [directRequestedById, setDirectRequestedById] = useState("");
    const [directExpenseAccountId, setDirectExpenseAccountId] = useState("");
    const [directNotes, setDirectNotes] = useState("");
    const [directItems, setDirectItems] = useState<{ productId: string; qty: number; unit: string }[]>([]);
    
    // Loaded data states
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [karyawans, setKaryawans] = useState<any[]>([]);
    const [expenseAccounts, setExpenseAccounts] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [stockBalances, setStockBalances] = useState<any[]>([]);
    const [isDirectLoading, setIsDirectLoading] = useState(false);
    const [isDirectSubmitting, setIsDirectSubmitting] = useState(false);

    // Fetch data for the Direct MR Form
    useEffect(() => {
        if (!isDirectOpen) return;

        const loadModalData = async () => {
            setIsDirectLoading(true);
            try {
                const now = new Date();
                const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

                const [whRes, karRes, coaRes, prodRes, stockRes] = await Promise.all([
                    getAllWarehouses(),
                    fetchAllKaryawan(),
                    coaApi.getCOAs({ limit: 1000, status: "ACTIVE" as any, postingType: "POSTING" as any, type: "BEBAN" as any }),
                    fetchAllProducts(),
                    getInventoryMonitoring({ limit: 1000, period })
                ]);

                if (Array.isArray(whRes)) {
                    setWarehouses(whRes);
                }
                if (karRes && Array.isArray(karRes.karyawan)) {
                    setKaryawans(karRes.karyawan);
                }
                if (coaRes && coaRes.success && Array.isArray(coaRes.data)) {
                    setExpenseAccounts(coaRes.data);
                }
                if (prodRes && prodRes.success && Array.isArray(prodRes.products)) {
                    setProducts(prodRes.products.filter((p: any) => p.isActive));
                }
                if (stockRes && stockRes.success && stockRes.data && Array.isArray(stockRes.data.data)) {
                    setStockBalances(stockRes.data.data);
                }
            } catch (err) {
                console.error("Error loading direct MR dialog data:", err);
                toast.error("Gagal memuat data formulir");
            } finally {
                setIsDirectLoading(false);
            }
        };

        loadModalData();
    }, [isDirectOpen]);

    const getAvailableStock = (productId: string, warehouseId: string) => {
        if (!productId || !warehouseId) return 0;
        const match = stockBalances.find(
            (s: any) => s.productId === productId && s.warehouseId === warehouseId
        );
        if (match) {
            return Number(match.availableStock ?? match.stockAkhir ?? 0);
        }
        return 0;
    };

    const hasInsufficientStock = directItems.some((it) => {
        if (!it.productId || !directWarehouseId) return false;
        const avail = getAvailableStock(it.productId, directWarehouseId);
        return it.qty > avail;
    });

    const addDirectItem = () => {
        setDirectItems((prev) => [...prev, { productId: "", qty: 1, unit: "" }]);
    };

    const updateDirectItem = (index: number, field: string, value: any) => {
        setDirectItems((prev) => {
            const copy = [...prev];
            const item = { ...copy[index] };
            
            if (field === 'productId') {
                item.productId = value;
                const selectedProd = products.find(p => p.id === value);
                if (selectedProd) {
                    item.unit = selectedProd.storageUnit || selectedProd.unit || selectedProd.usageUnit || 'pcs';
                }
            } else if (field === 'qty') {
                const parsed = value === "" ? "" : parseFloat(value);
                item.qty = (typeof parsed === "number" && !isNaN(parsed)) ? parsed : 0;
            } else if (field === 'unit') {
                item.unit = value;
            }

            copy[index] = item;
            return copy;
        });
    };

    const removeDirectItem = (index: number) => {
        setDirectItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDirectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!directWarehouseId) {
            toast.error("Silakan pilih Gudang Asal");
            return;
        }
        if (!directRequestedById) {
            toast.error("Silakan pilih Karyawan Peminta");
            return;
        }
        if (!directExpenseAccountId) {
            toast.error("Silakan pilih Akun Biaya Kantor");
            return;
        }
        if (directItems.length === 0) {
            toast.error("Silakan tambah minimal satu barang");
            return;
        }

        const invalidItem = directItems.find(it => !it.productId || it.qty <= 0);
        if (invalidItem) {
            toast.error("Semua barang harus dipilih dan jumlah harus lebih dari 0");
            return;
        }

        if (hasInsufficientStock) {
            const badItem = directItems.find(it => it.productId && directWarehouseId && it.qty > getAvailableStock(it.productId, directWarehouseId));
            if (badItem) {
                const prod = products.find(p => p.id === badItem.productId);
                const avail = getAvailableStock(badItem.productId, directWarehouseId);
                toast.error(`Jumlah pengeluaran "${prod?.name || 'barang'}" (${badItem.qty}) melebihi stok tersedia (${avail} ${badItem.unit || 'pcs'})!`);
            } else {
                toast.error("Ada barang dengan kuantitas melebihi stok tersedia!");
            }
            return;
        }

        setIsDirectSubmitting(true);
        try {
            const res = await createDirectMRAction({
                warehouseId: directWarehouseId,
                requestedById: directRequestedById,
                expenseAccountId: directExpenseAccountId,
                notes: directNotes,
                items: directItems
            });

            if (res.success) {
                toast.success("Pengeluaran barang kantor berhasil diajukan");
                setIsDirectOpen(false);
                setDirectWarehouseId("");
                setDirectRequestedById("");
                setDirectExpenseAccountId("");
                setDirectNotes("");
                setDirectItems([]);
                handleRefresh();
            } else {
                toast.error(res.error || "Gagal mengajukan pengeluaran barang");
            }
        } catch (err: any) {
            toast.error(err.message || "Terjadi kesalahan");
        } finally {
            setIsDirectSubmitting(false);
        }
    };

    /* =========================
        FETCH DATA
    ========================= */
    useEffect(() => {
        if (sessionLoading) return;

        if (user?.role !== "admin" && user?.role !== "staff") {
            router.push("/unauthorized");
            return;
        }

        const fetchData = async () => {
            setIsInternalLoading(true);
            try {
                const res = await getDataMr({ pageSize: 9999 });

                if (res.success && res.data) {
                    setAllMR(res.data.data);
                } else {
                    setAllMR([]);
                }
            } catch (error) {
                console.error("❌ Error fetching MR:", error);
                setAllMR([]);
            } finally {
                setIsInternalLoading(false);
            }
        };

        fetchData();
    }, [router, user, sessionLoading, refreshTrigger]);

    /* =========================
        HANDLERS
    ========================= */
    const handleRefresh = useCallback(() => {
        setRefreshTrigger((prev) => prev + 1);
    }, []);

    /* =========================
        BULK APPROVE
    ========================= */
    const handleBulkApprove = async () => {
        if (!user?.id) {
            toast.error("User ID tidak ditemukan");
            return;
        }

        setBulkOpen(true);
        setBulkLoading(true);
        setBulkProgress("Memproses semua MR PENDING...");
        setBulkResult(null);

        try {
            const res = await bulkIssueMR(user.id);
            if (res.success && res.data) {
                setBulkResult(res.data);
                toast.success(`Bulk approve selesai: ${res.data.succeeded.length} berhasil, ${res.data.failed.length} gagal`);
            } else {
                toast.error(res.error || "Gagal bulk approve");
            }
        } catch (err: any) {
            toast.error(err.message || "Terjadi kesalahan");
        } finally {
            setBulkLoading(false);
            setBulkProgress("");
            handleRefresh();
        }
    };

    const exportCSV = () => {
        if (!bulkResult?.failed?.length) return;

        const header = "MR Number,Product Code,Product Name,Qty Requested,Error Message";
        const rows = bulkResult.failed.flatMap((f: any) =>
            (f.items || []).map((it: any) =>
                `"${f.mrNumber}","${it.productCode}","${it.productName}","${it.qtyRequested}","${(f.error || '').replace(/"/g, '""')}"`
            )
        );

        const csv = [header, ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bulk-approve-failed-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <AdminLayout title="Material Requisition" role={user?.role || "guest"}>
            <div className="space-y-4 p-4">
                {/* Breadcrumb */}
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <Badge variant="outline" asChild>
                                <Link href="/admin-area">Dashboard</Link>
                            </Badge>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <Badge variant="outline">Inventory</Badge>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <Badge variant="outline">
                                <BreadcrumbPage>Material Requisition</BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* Header */}
                <HeaderCard
                    title={
                        <span>
                            <span className="md:hidden">MR</span>
                            <span className="hidden md:inline">Material Requisition / Pengambilan Barang Gudang</span>
                        </span>
                    }
                    description="Pantau dan kelola pengeluaran barang gudang"
                    icon={<ClipboardList className="h-5 w-5 md:h-7 md:w-7" />}
                    showActionArea={false}
                    actionArea={false}
                />

                {/* Action Buttons */}
                <div className="flex justify-between items-center gap-4">
                    <Button 
                        onClick={() => {
                            setIsDirectOpen(true);
                            setDirectItems([{ productId: "", qty: 1, unit: "" }]);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 hover:text-white text-white gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Buat Pengeluaran Kantor
                    </Button>
                    <Button onClick={handleBulkApprove} disabled={bulkLoading} className="gap-2">
                        {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        Approve Semua (Bulk)
                    </Button>
                </div>

                {/* Tabel MR */}
                <TableMR
                    data={allMR}
                    isLoading={isInternalLoading || sessionLoading}
                    onRefresh={handleRefresh}
                />
            </div>

            {/* Direct MR Dialog (Office Use) */}
            <Dialog open={isDirectOpen} onOpenChange={setIsDirectOpen}>
                <DialogContent className="!max-w-5xl sm:!max-w-5xl w-full !max-h-[95vh] flex flex-col !p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl">
                    {/* Header Banner */}
                    <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md">
                                <Building className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                                    Buat Pengeluaran Barang Kantor
                                    <Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 text-xs">Direct Issue</Badge>
                                </DialogTitle>
                                <DialogDescription className="text-white/80 mt-1 text-xs">
                                    Keluarkan barang dari gudang utama untuk keperluan operasional kantor sehari-hari.
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    {isDirectLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-24 bg-slate-50/50 dark:bg-slate-900/50">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-2" />
                            <p className="text-sm text-slate-500">Memuat data pendukung...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleDirectSubmit} className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto flex-1 min-h-0">
                                {/* Left Panel: Requisition Info (col-span-4) */}
                                <div className="lg:col-span-4 space-y-4 bg-slate-50/70 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col">
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800">
                                        <Info className="h-4 w-4 text-emerald-600" />
                                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Detail Pengeluaran</h3>
                                    </div>

                                    {/* Gudang Asal */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="warehouse" className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                            <Warehouse className="h-3.5 w-3.5 text-slate-400" /> Gudang Asal
                                        </Label>
                                        <Select value={directWarehouseId} onValueChange={setDirectWarehouseId}>
                                            <SelectTrigger id="warehouse" className="bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 shadow-sm focus:ring-emerald-500 rounded-lg">
                                                <SelectValue placeholder="Pilih Gudang Asal" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {warehouses.map((wh) => (
                                                    <SelectItem key={wh.id} value={wh.id} className="text-sm">
                                                        {wh.name} {wh.isWip ? "(WIP)" : ""}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Karyawan Peminta */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="karyawan" className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5 text-slate-400" /> Karyawan Peminta
                                        </Label>
                                        <SearchableSelect
                                            value={directRequestedById}
                                            onValueChange={setDirectRequestedById}
                                            options={karyawans.map((k) => ({
                                                id: k.id,
                                                label: k.namaLengkap || k.nama,
                                                sublabel: k.nip || k.jabatan || ""
                                            }))}
                                            placeholder="Pilih Karyawan"
                                            searchPlaceholder="Cari nama / NIP / jabatan..."
                                            emptyText="Karyawan tidak ditemukan"
                                            icon={User}
                                        />
                                    </div>

                                    {/* Akun Biaya Kantor */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="expenseAccount" className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                            <Receipt className="h-3.5 w-3.5 text-slate-400" /> Akun Biaya Kantor (Debit)
                                        </Label>
                                        <SearchableSelect
                                            value={directExpenseAccountId}
                                            onValueChange={setDirectExpenseAccountId}
                                            options={expenseAccounts.map((acc) => ({
                                                id: acc.id,
                                                label: acc.name,
                                                sublabel: acc.code
                                            }))}
                                            placeholder="Pilih Akun Biaya"
                                            searchPlaceholder="Cari kode / nama akun..."
                                            emptyText="Akun biaya tidak ditemukan"
                                            icon={Receipt}
                                        />
                                    </div>

                                    {/* Keterangan */}
                                    <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
                                        <Label htmlFor="notes" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            Keterangan / Tujuan Pemakaian
                                        </Label>
                                        <Textarea
                                            id="notes"
                                            placeholder="Tuliskan alasan/keperluan detail (misal: Pembagian bolpoin & kertas printer untuk HRD, Perbaikan lampu teras)"
                                            value={directNotes}
                                            onChange={(e) => setDirectNotes(e.target.value)}
                                            className="bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 shadow-sm focus:ring-emerald-500 resize-none rounded-lg flex-1 min-h-[100px]"
                                        />
                                    </div>
                                </div>

                                {/* Right Panel: Items List (col-span-8) */}
                                <div className="lg:col-span-8 flex flex-col min-h-0 space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <ShoppingBag className="h-4 w-4 text-emerald-600" />
                                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Daftar Barang & Kuantitas</h3>
                                        </div>
                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs rounded-full">
                                            {directItems.length} Barang
                                        </Badge>
                                    </div>

                                    {/* Items Table Container */}
                                    <div className="flex-1 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl p-3 min-h-[280px] bg-slate-50/20 dark:bg-slate-900/10">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-slate-400 font-semibold text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                                                    <th className="text-left pb-2 w-[55%]">Nama Barang / Part Number</th>
                                                    <th className="text-left pb-2 w-[25%]">Jumlah</th>
                                                    <th className="text-left pb-2 w-[15%]">Satuan</th>
                                                    <th className="text-center pb-2 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/40">
                                                {directItems.map((item, index) => {
                                                    const availableStock = getAvailableStock(item.productId, directWarehouseId);
                                                    const isInsufficient = item.productId && directWarehouseId && item.qty > availableStock;
                                                    const productsWithStock = products.map((p) => ({
                                                        ...p,
                                                        availableStock: directWarehouseId ? getAvailableStock(p.id, directWarehouseId) : undefined
                                                    }));

                                                    return (
                                                        <React.Fragment key={index}>
                                                            <tr className="group hover:bg-slate-50/30 dark:hover:bg-slate-900/20 transition-colors">
                                                                <td className="py-2.5 pr-2">
                                                                    <ProductCombobox
                                                                        value={item.productId}
                                                                        onValueChange={(val) => updateDirectItem(index, 'productId', val)}
                                                                        products={productsWithStock}
                                                                        placeholder="Pilih Barang / Part Number"
                                                                    />
                                                                </td>
                                                                <td className="py-2.5 pr-2">
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        step="any"
                                                                        value={item.qty === 0 ? "" : item.qty}
                                                                        onChange={(e) => updateDirectItem(index, 'qty', e.target.value)}
                                                                        placeholder="Qty"
                                                                        className={cn(
                                                                            "w-full bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 shadow-sm rounded-lg",
                                                                            isInsufficient && "border-red-500 text-red-600 focus:ring-red-500"
                                                                        )}
                                                                    />
                                                                </td>
                                                                <td className="py-2.5 pr-2">
                                                                    <Input
                                                                        type="text"
                                                                        value={item.unit || ""}
                                                                        onChange={(e) => updateDirectItem(index, 'unit', e.target.value)}
                                                                        placeholder="Satuan"
                                                                        className="w-full bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 rounded-lg"
                                                                    />
                                                                </td>
                                                                <td className="py-2.5 text-center">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => removeDirectItem(index)}
                                                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg h-9 w-9 transition-colors"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                            {/* Stock Info & Warning Row */}
                                                            {item.productId && (
                                                                <tr>
                                                                    <td colSpan={4} className="pb-3 pt-0.5 px-1 border-b border-slate-100 dark:border-slate-800">
                                                                        <div className="flex items-center justify-between text-xs px-2.5 py-1 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-100 dark:border-slate-800">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="text-slate-500 font-medium">Stok Tersedia:</span>
                                                                                {!directWarehouseId ? (
                                                                                    <span className="text-slate-400 italic text-[11px]">Pilih gudang asal terlebih dahulu</span>
                                                                                ) : (
                                                                                    <span className={cn(
                                                                                        "font-mono font-bold px-2 py-0.5 rounded text-xs",
                                                                                        availableStock > 0 
                                                                                            ? "text-emerald-700 bg-emerald-100/80 dark:bg-emerald-950 dark:text-emerald-300" 
                                                                                            : "text-red-600 bg-red-100/80 dark:bg-red-950 dark:text-red-400"
                                                                                    )}>
                                                                                        {availableStock} {item.unit || 'pcs'}
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            {directWarehouseId && isInsufficient && (
                                                                                <span className="text-red-600 dark:text-red-400 font-semibold text-xs flex items-center gap-1 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded border border-red-200 dark:border-red-900">
                                                                                    ⚠️ Melebihi stok (Maks: {availableStock} {item.unit || 'pcs'})
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                                {directItems.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="text-center py-16 text-slate-400 dark:text-slate-500">
                                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                                <ShoppingBag className="h-8 w-8 text-slate-300 dark:text-slate-700 animate-pulse" />
                                                                <p className="text-xs">Belum ada barang ditambahkan.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Add Item Button */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addDirectItem}
                                        className="w-full border-dashed border-2 border-slate-200 hover:border-emerald-500 dark:border-slate-800 dark:hover:border-emerald-600 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-500 transition-all rounded-xl h-10 gap-2 flex items-center justify-center font-medium text-xs shadow-sm"
                                    >
                                        <Plus className="h-4 w-4" /> Tambah Baris Barang
                                    </Button>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/10 flex justify-end gap-3 rounded-b-xl">
                                <Button type="button" variant="outline" onClick={() => setIsDirectOpen(false)} className="rounded-lg shadow-sm border-slate-200/80 dark:border-slate-800">
                                    Batal
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={isDirectSubmitting || hasInsufficientStock} 
                                    className={cn(
                                        "font-semibold shadow-md rounded-lg gap-2 flex items-center justify-center px-5 transition-all",
                                        hasInsufficientStock 
                                            ? "bg-slate-400 dark:bg-slate-700 text-slate-200 cursor-not-allowed" 
                                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    )}
                                >
                                    {isDirectSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Simpan & Ajukan Pengeluaran
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Bulk Progress / Result Dialog */}
            <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            {bulkLoading ? "Memproses..." : "Hasil Bulk Approve"}
                        </DialogTitle>
                        <DialogDescription>
                            {bulkLoading
                                ? bulkProgress
                                : bulkResult
                                    ? `${bulkResult.succeeded.length} berhasil, ${bulkResult.failed.length} gagal`
                                    : ""}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                        {bulkLoading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            </div>
                        )}

                        {!bulkLoading && bulkResult && (
                            <>
                                {bulkResult.succeeded.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-green-700 mb-1 flex items-center gap-1">
                                            <CheckCircle className="h-4 w-4" /> Berhasil ({bulkResult.succeeded.length})
                                        </h4>
                                        <div className="max-h-32 overflow-y-auto text-xs space-y-0.5">
                                            {bulkResult.succeeded.map((s: any) => (
                                                <div key={s.id} className="text-green-600">✓ {s.mrNumber}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {bulkResult.failed.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-1">
                                            <XCircle className="h-4 w-4" /> Gagal ({bulkResult.failed.length})
                                        </h4>
                                        <div className="max-h-64 overflow-y-auto text-xs space-y-1">
                                            {bulkResult.failed.map((f: any) => (
                                                <div key={f.id} className="p-2 rounded bg-red-50 border border-red-200">
                                                    <span className="font-semibold text-red-800">{f.mrNumber}</span>
                                                    <span className="text-red-600 ml-2">{f.error}</span>
                                                    {f.items?.length > 0 && (
                                                        <div className="mt-1 text-red-500">
                                                            {f.items.map((it: any, i: number) => (
                                                                <div key={i}>
                                                                    {it.productName} ({it.productCode}) x{it.qtyRequested}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        {!bulkLoading && (bulkResult?.failed?.length ?? 0) > 0 && (
                            <Button variant="outline" onClick={exportCSV} className="gap-2">
                                <Download className="h-4 w-4" />
                                Export Gagal ke CSV
                            </Button>
                        )}
                        <Button variant="secondary" onClick={() => setBulkOpen(false)}>
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}