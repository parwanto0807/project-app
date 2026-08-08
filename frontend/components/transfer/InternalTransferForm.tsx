"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Loader2, ArrowRightLeft, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getWarehouses } from '@/lib/action/wh/whAction';
import { getInventoryMonitoring } from '@/lib/action/inventory/inventoryAction';
import { createDirectTransfer } from '@/lib/action/tf/directTransferAction';
import { fetchAllKaryawan } from '@/lib/action/master/karyawan';
import { toast } from 'sonner';

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

interface Product {
    id: string;
    code: string;
    name: string;
    warehouseId: string;
    availableStock: number;
    stockAkhir: number;
    unit: string;
    pricePerUnit?: number;
}

interface Karyawan {
    id: string;
    namaLengkap: string;
}

interface TransferItem {
    productId: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
}

export default function InternalTransferForm() {
    const router = useRouter();
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [karyawans, setKaryawans] = useState<Karyawan[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [fromWarehouse, setFromWarehouse] = useState('');
    const [toWarehouse, setToWarehouse] = useState('');
    const [senderId, setSenderId] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<TransferItem[]>([{ productId: '', quantity: 1, unit: '', pricePerUnit: 0 }]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Fetch warehouses, karyawan, and products
    useEffect(() => {
        const fetchData = async () => {
            try {
                const now = new Date();
                const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

                const [warehouseRes, karyawanRes, productsRes] = await Promise.all([
                    getWarehouses(),
                    fetchAllKaryawan(),
                    getInventoryMonitoring({ limit: 1000, period })
                ]);

                if (warehouseRes.success && warehouseRes.data) {
                    const warehouseList = warehouseRes.data.data || [];
                    setWarehouses(warehouseList);

                    // Set default warehouses
                    const bengkel = warehouseList.find((w: any) => 
                        w.name.toUpperCase().includes('BENGKEL')
                    );
                    const wip = warehouseList.find((w: any) => 
                        w.name.toUpperCase().includes('WIP')
                    );

                    if (bengkel) setFromWarehouse(bengkel.id);
                    if (wip) setToWarehouse(wip.id);
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
                            unit: item.storageUnit || item.usageUnit || 'pcs',
                            pricePerUnit: Math.round(rawPrice * 100) / 100 // Round to 2 decimals
                        };
                    });
                    setProducts(productOptions);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Gagal memuat data');
            } finally {
                setIsDataLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filter products by fromWarehouse
    const fromWarehouseProducts = fromWarehouse
        ? products.filter(p => p.warehouseId === fromWarehouse)
        : [];

    const availableProducts = fromWarehouseProducts.filter(p => p.availableStock > 0);

    const getItemProduct = (item: TransferItem) => {
        if (!item.productId) return null;
        return fromWarehouseProducts.find(p => p.id === item.productId) || null;
    };

    const isStockInsufficient = (item: TransferItem) => {
        const product = getItemProduct(item);
        if (!product) return false;
        return item.quantity > product.availableStock;
    };

    const hasInsufficientStock = items.some(isStockInsufficient);

    const addItem = () => {
        setItems([...items, { productId: '', quantity: 1, unit: '', pricePerUnit: 0 }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: keyof TransferItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Auto-fill unit and price when product selected
        if (field === 'productId') {
            const product = fromWarehouseProducts.find(p => p.id === value);
            if (product) {
                newItems[index].unit = product.unit;
                newItems[index].pricePerUnit = product.pricePerUnit || 0;
            }
        }

        setItems(newItems);
    };

    const validateTransfer = () => {
        if (!fromWarehouse || !toWarehouse) {
            toast.error('Pilih gudang asal dan tujuan');
            return false;
        }

        if (fromWarehouse === toWarehouse) {
            toast.error('Gudang asal dan tujuan harus berbeda');
            return false;
        }

        const validItems = items.filter(item => item.productId && item.quantity > 0);
        if (validItems.length === 0) {
            toast.error('Minimal 1 item harus ditransfer');
            return false;
        }

        if (items.some(isStockInsufficient)) {
            toast.error('Ada item yang jumlahnya melebihi stok tersedia');
            return false;
        }

        if (!senderId) {
            toast.error('Pilih karyawan pengirim');
            return false;
        }

        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateTransfer()) {
            setShowConfirmDialog(true);
        }
    };

    const executeTransfer = async () => {
        setShowConfirmDialog(false);
        setIsLoading(true);

        try {
            const validItems = items.filter(item => item.productId && item.quantity > 0);
            const result = await createDirectTransfer({
                fromWarehouseId: fromWarehouse,
                toWarehouseId: toWarehouse,
                senderId,
                notes,
                items: validItems.map(item => ({
                    ...item,
                    pricePerUnit: Math.round(item.pricePerUnit * 100) / 100 // Round to 2 decimals
                }))
            });

            if (result.success) {
                toast.success('Internal transfer berhasil!');
                router.push('/admin-area/inventory/internal-transfer');
            } else {
                toast.error(result.message || 'Gagal membuat transfer');
            }
        } catch (error: any) {
            toast.error(error.message || 'Terjadi kesalahan');
        } finally {
            setIsLoading(false);
        }
    };

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
            {/* Warehouse Selection */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Dari Gudang *</Label>
                            <Select value={fromWarehouse} onValueChange={setFromWarehouse}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih gudang asal" />
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
                            <Label>Ke Gudang *</Label>
                            <Select value={toWarehouse} onValueChange={setToWarehouse}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih gudang tujuan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {warehouses.filter(wh => wh.id !== fromWarehouse).map(wh => (
                                        <SelectItem key={wh.id} value={wh.id}>
                                            {wh.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Pengirim *</Label>
                            <Select value={senderId} onValueChange={setSenderId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih karyawan pengirim" />
                                </SelectTrigger>
                                <SelectContent>
                                    {karyawans.map(karyawan => (
                                        <SelectItem key={karyawan.id} value={karyawan.id}>
                                            {karyawan.namaLengkap}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="mt-4 space-y-2">
                        <Label>Catatan (opsional)</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Catatan transfer, Input SO dan SPK untuk melengkapi Data Transfer..."
                            rows={2}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Items */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Daftar Barang</h3>
                        <Button type="button" onClick={addItem} size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Barang
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-3 p-4 border rounded-lg">
                                <div className="col-span-12 md:col-span-3">
                                    <Label className="text-sm">Produk *</Label>
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
                                                {item.productId
                                                    ? (() => {
                                                        const product = fromWarehouseProducts.find(p => p.id === item.productId);
                                                        return product ? `${product.code} - ${product.name}` : 'Pilih produk...';
                                                    })()
                                                    : 'Pilih produk...'}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Cari kode atau nama produk..." />
                                                <CommandList>
                                                    <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
                                                    <CommandGroup>
                                                        {availableProducts.map((product) => (
                                                            <CommandItem
                                                                key={product.id}
                                                                value={`${product.code} ${product.name}`}
                                                                onSelect={() => {
                                                                    updateItem(index, 'productId', product.id);
                                                                    setOpenPopoverIndex(null);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        product.id === item.productId ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{product.code}</span>
                                                                        <span className="text-slate-400 font-light">|</span>
                                                                        <span className="font-medium text-slate-700 dark:text-slate-200">{product.name}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 mt-0.5 text-[10px]">
                                                                        <span className="text-slate-500">
                                                                            Stok Tersedia: <span className="font-bold text-emerald-600 dark:text-emerald-400">{product.availableStock} {product.unit}</span>
                                                                        </span>
                                                                        <span className="text-slate-500">
                                                                            Stok Akhir: <span className="font-bold text-slate-700 dark:text-slate-300">{product.stockAkhir} {product.unit}</span>
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
                                        {item.productId ? (() => {
                                            const product = fromWarehouseProducts.find(p => p.id === item.productId);
                                            return product
                                                ? <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">{product.availableStock} {product.unit}</p>
                                                : <p className="text-slate-400 text-sm">-</p>;
                                        })() : <p className="text-slate-400 text-sm">-</p>}
                                    </div>
                                </div>

                                <div className="col-span-6 md:col-span-2">
                                    <Label className="text-sm">Stok Akhir</Label>
                                    <div className="mt-1.5 px-3 h-10 flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md">
                                        {item.productId ? (() => {
                                            const product = fromWarehouseProducts.find(p => p.id === item.productId);
                                            return product
                                                ? <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">{product.stockAkhir} {product.unit}</p>
                                                : <p className="text-slate-400 text-sm">-</p>;
                                        })() : <p className="text-slate-400 text-sm">-</p>}
                                    </div>
                                </div>

                                <div className="col-span-3 md:col-span-1">
                                    <Label className="text-sm">Jumlah *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        className="mt-1.5 h-10"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                        min="0.01"
                                    />
                                </div>

                                <div className="col-span-3 md:col-span-1">
                                    <Label className="text-sm">Satuan</Label>
                                    <Input value={item.unit} disabled className="mt-1.5 h-10 bg-slate-50" />
                                </div>

                                <div className="col-span-3 md:col-span-1">
                                    <Label className="text-sm">Jumlah *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                        min="0.01"
                                    />
                                    {isStockInsufficient(item) && (() => {
                                        const product = getItemProduct(item);
                                        return (
                                            <p className="mt-1 text-[11px] font-medium text-red-600 dark:text-red-400">
                                                Melebihi stok tersedia ({product?.availableStock} {product?.unit})
                                            </p>
                                        );
                                    })()}
                                </div>

                                <div className="col-span-3 md:col-span-1">
                                    <Label className="text-sm">Total Harga</Label>
                                    <div className="mt-1.5 px-2 h-10 flex items-center bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md">
                                        <p className="font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                                            {new Intl.NumberFormat('id-ID', {
                                                style: 'currency',
                                                currency: 'IDR',
                                                minimumFractionDigits: 0
                                            }).format(item.quantity * item.pricePerUnit)}
                                        </p>
                                    </div>
                                </div>

                                <div className="col-span-12 md:col-span-1 flex flex-col justify-end">
                                    <Label className="text-sm invisible hidden md:block">Action</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeItem(index)}
                                        disabled={items.length === 1}
                                        className="mt-1.5 h-10 w-full md:w-10 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex flex-col items-end gap-2">
                {hasInsufficientStock && (
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        Jumlah transfer melebihi stok tersedia. Periksa kembali item di Daftar Barang.
                    </p>
                )}
                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/admin-area/inventory/internal-transfer')}
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading || hasInsufficientStock}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <ArrowRightLeft className="h-4 w-4 mr-2" />
                                Transfer Sekarang
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Confirm Dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Transfer Stock</AlertDialogTitle>
                        <AlertDialogDescription>
                            Pastikan data transfer sudah benar sebelum disimpan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-3 text-sm">
                        <div className="rounded-md border p-3 space-y-2">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-500 dark:text-slate-400">Dari Gudang</span>
                                <span className="font-semibold text-right">
                                    {warehouses.find(w => w.id === fromWarehouse)?.name || '-'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-500 dark:text-slate-400">Ke Gudang</span>
                                <span className="font-semibold text-right">
                                    {warehouses.find(w => w.id === toWarehouse)?.name || '-'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-500 dark:text-slate-400">Pengirim</span>
                                <span className="font-semibold text-right">
                                    {karyawans.find(k => k.id === senderId)?.namaLengkap || '-'}
                                </span>
                            </div>
                        </div>

                        <div className="rounded-md border p-3">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
                                Daftar Barang ({items.filter(i => i.productId && i.quantity > 0).length})
                            </p>
                            <div className="space-y-1.5 max-h-48 overflow-auto">
                                {items.filter(i => i.productId && i.quantity > 0).map((item, idx) => {
                                    const product = getItemProduct(item);
                                    return (
                                        <div key={idx} className="flex items-center justify-between gap-4 text-sm">
                                            <span className="text-slate-700 dark:text-slate-200 truncate">
                                                {product ? `${product.code} - ${product.name}` : '-'}
                                            </span>
                                            <span className="font-semibold whitespace-nowrap">
                                                {item.quantity} {item.unit}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeTransfer}
                            disabled={isLoading}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                                    Konfirmasi & Transfer
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </form>
    );
}
