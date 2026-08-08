"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, Trash2, Loader2, Wrench, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getWarehouses } from "@/lib/action/wh/whAction";
import { getInventoryMonitoring } from "@/lib/action/inventory/inventoryAction";
import { fetchAllKaryawan } from "@/lib/action/master/karyawan";
import { fetchAllProducts } from "@/lib/action/master/product";
import { createAssembly } from "@/lib/action/assembly/assemblyAction";
import { toast } from "sonner";

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

interface ProductOption {
    id: string;
    code: string;
    name: string;
    warehouseId?: string;
    availableStock: number;
    stockAkhir: number;
    unit: string;
    storageUnit?: string;
    cogs?: number;
}

interface ComponentRow {
    productId: string;
    quantity: number;
    unit: string;
    cogs: number;
}

export default function AssemblyCreateForm() {
    const router = useRouter();
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [karyawans, setKaryawans] = useState<{ id: string; namaLengkap: string }[]>([]);
    const [stockProducts, setStockProducts] = useState<ProductOption[]>([]);
    const [allProducts, setAllProducts] = useState<ProductOption[]>([]);

    const [warehouseId, setWarehouseId] = useState("");
    const [senderId, setSenderId] = useState("");
    const [notes, setNotes] = useState("");

    const [outputProductId, setOutputProductId] = useState("");
    const [outputQuantity, setOutputQuantity] = useState(1);
    const [outputUnit, setOutputUnit] = useState("");
    const [outputCogs, setOutputCogs] = useState(0);
    const [outputCogsStr, setOutputCogsStr] = useState("0");
    const outputCogsFocused = useRef(false);

    const [components, setComponents] = useState<ComponentRow[]>([{ productId: "", quantity: 1, unit: "", cogs: 0 }]);
    const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);
    const [openOutputPopover, setOpenOutputPopover] = useState(false);

    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const now = new Date();
                const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

                const [warehouseRes, karyawanRes, productsRes, allProductsRes] = await Promise.all([
                    getWarehouses(),
                    fetchAllKaryawan(),
                    getInventoryMonitoring({ limit: 1000, period }),
                    fetchAllProducts({ isActive: true }),
                ]);

                if (warehouseRes.success && warehouseRes.data) {
                    const warehouseList = warehouseRes.data.data || [];
                    setWarehouses(warehouseList);

                    const bengkel = warehouseList.find((w: any) =>
                        w.name.toUpperCase().includes("BENGKEL")
                    );
                    if (bengkel) setWarehouseId(bengkel.id);
                }

                if (karyawanRes && karyawanRes.karyawan) {
                    setKaryawans(karyawanRes.karyawan);
                }

                if (productsRes.success && productsRes.data) {
                    const stockData = productsRes.data.data || [];
                    const productOptions = stockData.map((item: any) => {
                        const rawPrice = Number(item.inventoryValue) / Number(item.stockAkhir) || 0;
                        return {
                            id: item.productId,
                            code: item.code || item.productCode,
                            name: item.name || item.productName,
                            warehouseId: item.warehouseId,
                            availableStock: Number(item.availableStock ?? 0),
                            stockAkhir: Number(item.stockAkhir ?? 0),
                            unit: item.storageUnit || item.usageUnit || "pcs",
                            cogs: Math.round(rawPrice * 100) / 100,
                        };
                    });
                    setStockProducts(productOptions);
                }

                const masterProducts = allProductsRes?.products || allProductsRes?.data?.data || [];
                const outputOptions = masterProducts.map((p: any) => ({
                    id: p.id,
                    code: p.code,
                    name: p.name,
                    availableStock: 0,
                    stockAkhir: 0,
                    unit: p.storageUnit || p.usageUnit || "pcs",
                    storageUnit: p.storageUnit || p.usageUnit || "pcs",
                }));
                setAllProducts(outputOptions);
            } catch (error) {
                console.error("Error fetching assembly data:", error);
                toast.error("Gagal memuat data");
            } finally {
                setIsDataLoading(false);
            }
        };

        fetchData();
    }, []);

    const warehouseStock = warehouseId
        ? stockProducts.filter(p => p.warehouseId === warehouseId)
        : [];

    const availableComponents = warehouseStock.filter(p => p.availableStock > 0);

    const selectedOutputProduct = allProducts.find(p => p.id === outputProductId) || null;

    const suggestedOutputCogs = components.reduce((sum, c) => sum + (c.quantity * c.cogs || 0), 0);

    const outputPricePerUnit = outputQuantity > 0 ? outputCogs / outputQuantity : 0;

    // Auto-fill Harga Pokok = Total Biaya Komponen (kecuali user sedang mengetik manual)
    useEffect(() => {
        if (!outputCogsFocused.current) {
            const total = Math.round(suggestedOutputCogs * 100) / 100;
            setOutputCogs(total);
            setOutputCogsStr(total.toString());
        }
    }, [suggestedOutputCogs]);

    const getComponentProduct = (row: ComponentRow) =>
        row.productId ? warehouseStock.find(p => p.id === row.productId) || null : null;

    const isComponentInsufficient = (row: ComponentRow) => {
        const product = getComponentProduct(row);
        if (!product) return false;
        return row.quantity > product.availableStock;
    };

    const hasInsufficientComponent = components.some(isComponentInsufficient);

    const handleSelectOutput = (product: ProductOption) => {
        setOutputProductId(product.id);
        setOutputUnit(product.unit);
        setOpenOutputPopover(false);
    };

    const addComponent = () => {
        setComponents([...components, { productId: "", quantity: 1, unit: "", cogs: 0 }]);
    };

    const removeComponent = (index: number) => {
        if (components.length > 1) {
            setComponents(components.filter((_, i) => i !== index));
        }
    };

    const updateComponent = (index: number, field: keyof ComponentRow, value: any) => {
        const newComponents = [...components];
        newComponents[index] = { ...newComponents[index], [field]: value };

        if (field === "productId") {
            const product = warehouseStock.find(p => p.id === value);
            if (product) {
                newComponents[index].unit = product.unit;
                newComponents[index].cogs = product.cogs || 0;
            }
        }

        setComponents(newComponents);
    };

    const validate = () => {
        if (!warehouseId) {
            toast.error("Pilih gudang (Bengkel)");
            return false;
        }
        if (!outputProductId) {
            toast.error("Pilih produk hasil perakitan");
            return false;
        }
        if (!outputQuantity || outputQuantity <= 0) {
            toast.error("Jumlah hasil perakitan harus lebih dari 0");
            return false;
        }
        const validComponents = components.filter(c => c.productId && c.quantity > 0);
        if (validComponents.length === 0) {
            toast.error("Minimal 1 komponen harus diisi");
            return false;
        }
        if (hasInsufficientComponent) {
            toast.error("Ada komponen yang jumlahnya melebihi stok tersedia");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        try {
            const validComponents = components.filter(c => c.productId && c.quantity > 0);
            const result = await createAssembly({
                warehouseId,
                outputProductId,
                outputQuantity,
                outputUnit,
                outputCogs,
                notes,
                createdById: senderId || undefined,
                components: validComponents.map(c => ({
                    productId: c.productId,
                    quantity: c.quantity,
                    unit: c.unit,
                    cogs: c.cogs || 0,
                })),
            });

            if (result.success) {
                toast.success("Perakitan berhasil disimpan sebagai DRAFT. Stock belum terpengaruh.");
                router.push("/admin-area/inventory/assembly");
            } else {
                toast.error(result.message || "Gagal membuat perakitan");
            }
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value);

    if (isDataLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <span className="ml-3 text-slate-600">Memuat data...</span>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Gudang & Informasi */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Gudang (Asal Komponen & Hasil) *</Label>
                            <Select value={warehouseId} onValueChange={setWarehouseId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih gudang" />
                                </SelectTrigger>
                                <SelectContent>
                                    {warehouses.map(wh => (
                                        <SelectItem key={wh.id} value={wh.id}>
                                            {wh.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Perakit / Karyawan (opsional)</Label>
                            <Select value={senderId} onValueChange={setSenderId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih karyawan perakit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {karyawans.map(k => (
                                        <SelectItem key={k.id} value={k.id}>
                                            {k.namaLengkap}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Catatan (opsional)</Label>
                            <Input
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Catatan proses perakitan..."
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Komponen Bahan */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">1. Komponen / Bahan (dari Stock Gudang)</h3>
                        <Button type="button" onClick={addComponent} size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Komponen
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {components.map((row, index) => {
                            const product = getComponentProduct(row);
                            return (
                                <div key={index} className="grid grid-cols-12 gap-3 p-4 border rounded-lg items-start">
                                    <div className="col-span-12 md:col-span-3">
                                        <Label className="text-sm">Komponen *</Label>
                                        <Popover
                                            open={openPopoverIndex === index}
                                            onOpenChange={(open) => setOpenPopoverIndex(open ? index : null)}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className="w-full justify-between mt-1.5 h-10 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 shadow-sm font-normal"
                                                >
                                                    {row.productId
                                                        ? (product ? `${product.code} - ${product.name}` : "Pilih komponen...")
                                                        : "Pilih komponen..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[400px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Cari kode atau nama komponen..." />
                                                    <CommandList>
                                                        <CommandEmpty>Komponen tidak ditemukan.</CommandEmpty>
                                                        <CommandGroup>
                                                            {availableComponents.map((comp) => (
                                                                <CommandItem
                                                                    key={comp.id}
                                                                    value={`${comp.code} ${comp.name}`}
                                                                    onSelect={() => {
                                                                        updateComponent(index, "productId", comp.id);
                                                                        setOpenPopoverIndex(null);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            comp.id === row.productId ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    <div className="flex flex-col">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-bold text-indigo-600 dark:text-indigo-400">{comp.code}</span>
                                                                            <span className="text-slate-400 font-light">|</span>
                                                                            <span className="font-medium text-slate-700 dark:text-slate-200">{comp.name}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 mt-0.5 text-[10px]">
                                                                            <span className="text-slate-500">
                                                                                Stok Tersedia: <span className="font-bold text-emerald-600 dark:text-emerald-400">{comp.availableStock} {comp.unit}</span>
                                                                            </span>
                                                                            <span className="text-slate-500">
                                                                                Stok Akhir: <span className="font-bold text-slate-700 dark:text-slate-300">{comp.stockAkhir} {comp.unit}</span>
                                                                            </span>
                                                                            <span className="text-slate-500">
                                                                                Harga: <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(comp.cogs || 0)}</span>
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div className="col-span-6 md:col-span-2">
                                        <Label className="text-sm">Stok Tersedia</Label>
                                        <div className="mt-1.5 px-3 h-10 flex items-center bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md">
                                            {product ? (
                                                <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">{product.availableStock} {product.unit}</p>
                                            ) : (
                                                <p className="text-slate-400 text-sm">-</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-span-6 md:col-span-2">
                                        <Label className="text-sm">Stok Akhir</Label>
                                        <div className="mt-1.5 px-3 h-10 flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md">
                                            {product ? (
                                                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">{product.stockAkhir} {product.unit}</p>
                                            ) : (
                                                <p className="text-slate-400 text-sm">-</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-span-3 md:col-span-1">
                                        <Label className="text-sm">Jumlah *</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={row.quantity}
                                            onChange={(e) => updateComponent(index, "quantity", parseFloat(e.target.value) || 0)}
                                            min="0.01"
                                            className="mt-1.5 h-10"
                                        />
                                        {isComponentInsufficient(row) && (
                                            <p className="mt-1 text-[11px] font-medium text-red-600 dark:text-red-400">
                                                Melebihi stok tersedia ({product?.availableStock} {product?.unit})
                                            </p>
                                        )}
                                    </div>

                                    <div className="col-span-3 md:col-span-1">
                                        <Label className="text-sm">Satuan</Label>
                                        <Input value={row.unit} disabled className="mt-1.5 h-10 bg-slate-50" />
                                    </div>

                                    <div className="col-span-3 md:col-span-1">
                                        <Label className="text-sm">Harga/Unit</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={row.cogs.toFixed(2)}
                                            onChange={(e) => updateComponent(index, "cogs", parseFloat(e.target.value) || 0)}
                                            className="mt-1.5 h-10"
                                        />
                                    </div>

                                    <div className="col-span-3 md:col-span-1">
                                        <Label className="text-sm">Subtotal</Label>
                                        <div className="mt-1.5 px-2 h-10 flex items-center bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md">
                                            <p className="font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                                                {formatCurrency(row.quantity * row.cogs)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="col-span-12 md:col-span-1 flex items-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeComponent(index)}
                                            disabled={components.length === 1}
                                            className="mt-1.5 h-10 w-full md:w-10 text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between">
                        <span className="text-sm text-slate-500">Total Biaya Komponen:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                            {formatCurrency(suggestedOutputCogs)}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Hasil Perakitan */}
            <Card>
                <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">2. Hasil Perakitan (Barang Baru / Part Number)</h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2 md:col-span-2">
                            <Label className="text-sm">Produk Hasil Perakitan *</Label>
                            <Popover open={openOutputPopover} onOpenChange={setOpenOutputPopover}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between mt-1.5 h-10 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 shadow-sm font-normal"
                                    >
                                        {selectedOutputProduct
                                            ? `${selectedOutputProduct.code} - ${selectedOutputProduct.name}`
                                            : "Pilih produk hasil (Part Number)..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Cari kode atau nama produk..." />
                                        <CommandList>
                                            <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                {allProducts.map((p) => (
                                                    <CommandItem
                                                        key={p.id}
                                                        value={`${p.code} ${p.name}`}
                                                        onSelect={() => handleSelectOutput(p)}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                p.id === outputProductId ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-indigo-600 dark:text-indigo-400">{p.code}</span>
                                                                <span className="text-slate-400 font-light">|</span>
                                                                <span className="font-medium text-slate-700 dark:text-slate-200">{p.name}</span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-500 mt-0.5">
                                                                Satuan: {p.unit}
                                                            </span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm">Jumlah Hasil *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={outputQuantity}
                                onChange={(e) => setOutputQuantity(parseFloat(e.target.value) || 0)}
                                min="0.01"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm">Satuan</Label>
                            <Input value={outputUnit} disabled className="bg-slate-50" />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label className="text-sm">Harga Pokok / Hasil (Cogs)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={outputCogsStr}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setOutputCogsStr(v);
                                    setOutputCogs(parseFloat(v) || 0);
                                }}
                                onFocus={() => { outputCogsFocused.current = true; }}
                                onBlur={() => {
                                    outputCogsFocused.current = false;
                                    const n = parseFloat(outputCogsStr) || 0;
                                    const rounded = Math.round(n * 100) / 100;
                                    setOutputCogs(rounded);
                                    setOutputCogsStr(rounded.toString());
                                }}
                            />
                            <p className="text-xs text-slate-500">
                                Otomatis diisi dari total biaya komponen: {formatCurrency(suggestedOutputCogs)}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm">Harga Per Unit</Label>
                            <div className="mt-1.5 px-3 h-10 flex items-center bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-md">
                                <p className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">
                                    {formatCurrency(outputPricePerUnit)}
                                </p>
                            </div>
                            <p className="text-xs text-slate-500">
                                Harga Pokok ÷ Jumlah Hasil ({formatCurrency(outputCogs)} ÷ {outputQuantity})
                            </p>
                        </div>
                    </div>

                    {selectedOutputProduct && (
                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                <span className="font-semibold">Hasil:</span> {selectedOutputProduct.code} - {selectedOutputProduct.name} akan ditambahkan ke stock gudang <span className="font-semibold">{warehouses.find(w => w.id === warehouseId)?.name || "-"}</span> sebanyak {outputQuantity} {outputUnit}.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/admin-area/inventory/assembly")}
                >
                    Batal
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading || hasInsufficientComponent}
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Wrench className="h-4 w-4 mr-2" />
                            Simpan sebagai Draft
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
