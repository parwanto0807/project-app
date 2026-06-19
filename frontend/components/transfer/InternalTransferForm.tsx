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
                            unit: item.usageUnit || item.storageUnit || 'pcs',
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
    const availableProducts = fromWarehouse
        ? products.filter(p => p.warehouseId === fromWarehouse && p.availableStock > 0)
        : [];

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
            const product = products.find(p => p.id === value);
            if (product) {
                newItems[index].unit = product.unit;
                newItems[index].pricePerUnit = product.pricePerUnit || 0;
            }
        }

        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!fromWarehouse || !toWarehouse) {
            toast.error('Pilih gudang asal dan tujuan');
            return;
        }

        if (fromWarehouse === toWarehouse) {
            toast.error('Gudang asal dan tujuan harus berbeda');
            return;
        }

        const validItems = items.filter(item => item.productId && item.quantity > 0);
        if (validItems.length === 0) {
            toast.error('Minimal 1 item harus ditransfer');
            return;
        }

        if (!senderId) {
            toast.error('Pilih karyawan pengirim');
            return;
        }

        setIsLoading(true);

        try {
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
                                <div className="col-span-12 md:col-span-4">
                                    <Label className="text-sm">Produk *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between mt-1.5 h-10 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 shadow-sm font-normal"
                                            >
                                                {item.productId
                                                    ? (() => {
                                                        const product = products.find(p => p.id === item.productId);
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
                                                                    <span className="text-[10px] text-slate-500 mt-0.5">
                                                                        Stok Tersedia: <span className="font-bold text-emerald-600 dark:text-emerald-400">{product.availableStock} {product.unit}</span>
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

                                <div className="col-span-4 md:col-span-2">
                                    <Label className="text-sm">Jumlah *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                        min="0.01"
                                    />
                                </div>

                                <div className="col-span-3 md:col-span-1">
                                    <Label className="text-sm">Satuan</Label>
                                    <Input value={item.unit} disabled className="bg-slate-50" />
                                </div>

                                <div className="col-span-3 md:col-span-2">
                                    <Label className="text-sm">Harga/Unit</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={item.pricePerUnit.toFixed(2)}
                                        onChange={(e) => updateItem(index, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                                    />
                                </div>

                                <div className="col-span-4 md:col-span-2">
                                    <Label className="text-sm">Total Harga</Label>
                                    <div className="mt-1.5 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md">
                                        <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                                            {new Intl.NumberFormat('id-ID', {
                                                style: 'currency',
                                                currency: 'IDR',
                                                minimumFractionDigits: 0
                                            }).format(item.quantity * item.pricePerUnit)}
                                        </p>
                                    </div>
                                </div>

                                <div className="col-span-12 md:col-span-1 flex items-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeItem(index)}
                                        disabled={items.length === 1}
                                        className="text-red-600 hover:text-red-700"
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
            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin-area/inventory/internal-transfer')}
                >
                    Batal
                </Button>
                <Button
                    type="submit"
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
                            Transfer Sekarang
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
