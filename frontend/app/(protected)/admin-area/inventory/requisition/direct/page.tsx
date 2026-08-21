"use client";

import React, { useEffect, useState } from "react";
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
import {
    ArrowLeft,
    Building,
    Warehouse,
    User,
    Receipt,
    Info,
    ShoppingBag,
    Loader2,
    Plus,
    Trash2,
    ChevronsUpDown,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { useSession } from "@/components/clientSessionProvider";

import HeaderCard from "@/components/ui/header-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ProductCombobox } from "@/components/pr/productCombobox";
import { getAllWarehouses, getInventoryMonitoring } from "@/lib/action/inventory/inventoryAction";
import { fetchAllKaryawan } from "@/lib/action/master/karyawan";
import { coaApi } from "@/lib/action/coa/coa";
import { fetchAllProducts } from "@/lib/action/master/product";
import { createDirectMRAction } from "@/lib/action/inventory/mrInventroyAction";

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

    const selectedOption = options.find((o) => o.id === value);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={isOpen}
                    className="w-full justify-between bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 shadow-sm focus:ring-emerald-500 rounded-lg text-left font-normal h-10 px-3"
                >
                    <span className="truncate flex items-center gap-2">
                        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                        {selectedOption ? (
                            <span className="truncate flex items-center">
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
            </PopoverTrigger>

            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[9999] bg-white dark:bg-slate-950 overflow-hidden"
                align="start"
            >
                <Command>
                    <CommandInput
                        placeholder={searchPlaceholder || "Cari..."}
                        className="h-9 text-sm"
                    />
                    <CommandList className="max-h-56">
                        <CommandEmpty className="py-4 text-center text-xs text-slate-400">
                            {emptyText}
                        </CommandEmpty>
                        <CommandGroup className="p-1">
                            {options.map((opt) => {
                                const isSelected = value === opt.id;
                                return (
                                    <CommandItem
                                        key={opt.id}
                                        value={`${opt.sublabel ?? ""} ${opt.label}`}
                                        onSelect={() => {
                                            onValueChange(opt.id);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "cursor-pointer py-2 px-3 rounded-lg mb-0.5 text-sm",
                                            isSelected
                                                ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 font-semibold data-[selected=true]:bg-emerald-50 dark:data-[selected=true]:bg-emerald-950/60"
                                                : "text-slate-700 dark:text-slate-200"
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
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export default function DirectMRPage() {
    const router = useRouter();
    const { user, isLoading: sessionLoading } = useSession();

    // Form states
    const [warehouseId, setWarehouseId] = useState("");
    const [requestedById, setRequestedById] = useState("");
    const [expenseAccountId, setExpenseAccountId] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<{ productId: string; qty: number; unit: string }[]>([{ productId: "", qty: 1, unit: "" }]);

    // Loaded data states
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [karyawans, setKaryawans] = useState<any[]>([]);
    const [expenseAccounts, setExpenseAccounts] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [stockBalances, setStockBalances] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /* =========================
        ROLE GUARD
    ========================= */
    useEffect(() => {
        if (sessionLoading) return;

        if (user?.role !== "admin" && user?.role !== "staff") {
            router.push("/unauthorized");
        }
    }, [router, user, sessionLoading]);

    /* =========================
        FETCH DATA
    ========================= */
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
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
                console.error("Error loading direct MR page data:", err);
                toast.error("Gagal memuat data formulir");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    /* =========================
        HELPERS & HANDLERS
    ========================= */
    const getAvailableStock = (productId: string, warehouseIdParam: string) => {
        if (!productId || !warehouseIdParam) return 0;
        const match = stockBalances.find(
            (s: any) => s.productId === productId && s.warehouseId === warehouseIdParam
        );
        if (match) {
            return Number(match.availableStock ?? match.stockAkhir ?? 0);
        }
        return 0;
    };

    const hasInsufficientStock = items.some((it) => {
        if (!it.productId || !warehouseId) return false;
        const avail = getAvailableStock(it.productId, warehouseId);
        return it.qty > avail;
    });

    const addItem = () => {
        setItems((prev) => [...prev, { productId: "", qty: 1, unit: "" }]);
    };

    const updateItem = (index: number, field: string, value: any) => {
        setItems((prev) => {
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

    const removeItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!warehouseId) {
            toast.error("Silakan pilih Gudang Asal");
            return;
        }
        if (!requestedById) {
            toast.error("Silakan pilih Karyawan Peminta");
            return;
        }
        if (!expenseAccountId) {
            toast.error("Silakan pilih Akun Biaya Kantor");
            return;
        }
        if (items.length === 0) {
            toast.error("Silakan tambah minimal satu barang");
            return;
        }

        const invalidItem = items.find(it => !it.productId || it.qty <= 0);
        if (invalidItem) {
            toast.error("Semua barang harus dipilih dan jumlah harus lebih dari 0");
            return;
        }

        if (hasInsufficientStock) {
            const badItem = items.find(it => it.productId && warehouseId && it.qty > getAvailableStock(it.productId, warehouseId));
            if (badItem) {
                const prod = products.find(p => p.id === badItem.productId);
                const avail = getAvailableStock(badItem.productId, warehouseId);
                toast.error(`Jumlah pengeluaran "${prod?.name || 'barang'}" (${badItem.qty}) melebihi stok tersedia (${avail} ${badItem.unit || 'pcs'})!`);
            } else {
                toast.error("Ada barang dengan kuantitas melebihi stok tersedia!");
            }
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await createDirectMRAction({
                warehouseId: warehouseId,
                requestedById: requestedById,
                expenseAccountId: expenseAccountId,
                notes: notes,
                items: items
            });

            if (res.success) {
                toast.success("Pengeluaran barang kantor berhasil diajukan");
                router.push("/admin-area/inventory/requisition");
            } else {
                toast.error(res.error || "Gagal mengajukan pengeluaran barang");
            }
        } catch (err: any) {
            toast.error(err.message || "Terjadi kesalahan");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AdminLayout title="Buat Pengeluaran Barang Kantor" role={user?.role || "guest"}>
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
                            <Badge variant="outline" asChild>
                                <Link href="/admin-area/inventory/requisition">Material Requisition</Link>
                            </Badge>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <Badge variant="outline">
                                <BreadcrumbPage>Pengeluaran Barang Kantor</BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* Header */}
                <HeaderCard
                    title="Buat Pengeluaran Barang Kantor"
                    description="Keluarkan barang dari gudang utama untuk keperluan operasional kantor sehari-hari."
                    icon={<Building className="h-5 w-5 md:h-7 md:w-7" />}
                    showActionArea={false}
                    actionArea={false}
                />

                {isLoading || sessionLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-2" />
                        <p className="text-sm text-slate-500">Memuat data pendukung...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        {/* Header Banner */}
                        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md">
                                    <Building className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                        Buat Pengeluaran Barang Kantor
                                        <Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 text-xs">Direct Issue</Badge>
                                    </h1>
                                    <p className="text-white/80 mt-1 text-xs">
                                        Keluarkan barang dari gudang utama untuk keperluan operasional kantor sehari-hari.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
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
                                    <Select value={warehouseId} onValueChange={setWarehouseId}>
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
                                        value={requestedById}
                                        onValueChange={setRequestedById}
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
                                        value={expenseAccountId}
                                        onValueChange={setExpenseAccountId}
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
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
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
                                        {items.length} Barang
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
                                            {items.map((item, index) => {
                                                const availableStock = getAvailableStock(item.productId, warehouseId);
                                                const isInsufficient = item.productId && warehouseId && item.qty > availableStock;
                                                const productsWithStock = products.map((p) => ({
                                                    ...p,
                                                    availableStock: warehouseId ? getAvailableStock(p.id, warehouseId) : undefined
                                                }));

                                                return (
                                                    <React.Fragment key={index}>
                                                        <tr className="group hover:bg-slate-50/30 dark:hover:bg-slate-900/20 transition-colors">
                                                            <td className="py-2.5 pr-2">
                                                                <ProductCombobox
                                                                    value={item.productId}
                                                                    onValueChange={(val) => updateItem(index, 'productId', val)}
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
                                                                    onChange={(e) => updateItem(index, 'qty', e.target.value)}
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
                                                                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                                                    placeholder="Satuan"
                                                                    className="w-full bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 rounded-lg"
                                                                />
                                                            </td>
                                                            <td className="py-2.5 text-center">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => removeItem(index)}
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
                                                                            {!warehouseId ? (
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

                                                                        {warehouseId && isInsufficient && (
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
                                            {items.length === 0 && (
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
                                    onClick={addItem}
                                    className="w-full border-dashed border-2 border-slate-200 hover:border-emerald-500 dark:border-slate-800 dark:hover:border-emerald-600 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-500 transition-all rounded-xl h-10 gap-2 flex items-center justify-center font-medium text-xs shadow-sm"
                                >
                                    <Plus className="h-4 w-4" /> Tambah Baris Barang
                                </Button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/10 flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push("/admin-area/inventory/requisition")}
                                className="rounded-lg shadow-sm border-slate-200/80 dark:border-slate-800 gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || hasInsufficientStock}
                                className={cn(
                                    "font-semibold shadow-md rounded-lg gap-2 flex items-center justify-center px-5 transition-all",
                                    hasInsufficientStock
                                        ? "bg-slate-400 dark:bg-slate-700 text-slate-200 cursor-not-allowed"
                                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                )}
                            >
                                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                Simpan & Ajukan Pengeluaran
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </AdminLayout>
    );
}
