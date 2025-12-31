"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
    Plus,
    Trash2,
    Loader2,
    Building2,
    MapPin,
    User,
    Package,
    FileText,
    ArrowRightLeft,
    Warehouse
} from 'lucide-react';
import { useCreateTransfer } from '@/hooks/use-tf';
import { createTransferSchema, type CreateTransferInput } from '@/schemas/tf';
import { getWarehouses } from '@/lib/action/wh/whAction';
import { fetchAllKaryawan } from '@/lib/action/master/karyawan';
import { getInventoryMonitoring } from '@/lib/action/inventory/inventoryAction';
import { toast } from 'sonner';

interface TransferFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

interface WarehouseOption {
    id: string;
    code: string;
    name: string;
}

interface KaryawanOption {
    id: string;
    namaLengkap: string;
}

interface ProductOption {
    id: string;
    code: string;
    name: string;
    warehouseId: string;
    warehouseName: string;
    availableStock: number;
    unit: string;
}

export function TransferForm({ onSuccess, onCancel }: TransferFormProps) {
    const createMutation = useCreateTransfer();
    const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
    const [karyawans, setKaryawans] = useState<KaryawanOption[]>([]);
    const [products, setProducts] = useState<ProductOption[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Use ref to access products in Zod schema refinement without recreating schema
    const productsRef = useRef(products);
    productsRef.current = products;

    const formSchema = useMemo(() => {
        return createTransferSchema.superRefine((data, ctx) => {
            data.items.forEach((item, index) => {
                const product = productsRef.current.find(p => p.id === item.productId && p.warehouseId === data.fromWarehouseId);
                if (product) {
                    if (item.quantity > product.availableStock) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: `Maks. stok: ${product.availableStock} ${product.unit}`,
                            path: ['items', index, 'quantity']
                        });
                    }
                }
            });
        });
    }, []);

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<CreateTransferInput>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            items: [{ productId: '', quantity: 1, unit: 'pcs', notes: '' }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items',
    });

    const fromWarehouseId = watch('fromWarehouseId');
    const toWarehouseId = watch('toWarehouseId');

    // Fetch warehouses, karyawan, and products on mount
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingData(true);
            console.log('🔄 Starting data fetch...');

            try {
                // Get current month period for inventory
                const now = new Date();
                const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                console.log('📅 Current period:', period);

                const [warehouseRes, karyawanRes, productsRes] = await Promise.all([
                    getWarehouses(),
                    fetchAllKaryawan(),
                    getInventoryMonitoring({ limit: 1000, period })
                ]);

                console.log('📦 Warehouse response:', warehouseRes);
                console.log('👤 Karyawan response:', karyawanRes);
                console.log('🏭 Products response:', productsRes);

                // Process warehouses
                if (warehouseRes.success && warehouseRes.data) {
                    const warehouseData = warehouseRes.data.data || [];
                    console.log('✅ Warehouses loaded:', warehouseData.length);
                    setWarehouses(warehouseData);
                } else {
                    console.error('❌ Failed to load warehouses:', warehouseRes);
                }

                // Process karyawan
                if (karyawanRes && karyawanRes.karyawan) {
                    console.log('✅ Karyawan loaded:', karyawanRes.karyawan.length);
                    console.log('📋 First karyawan:', karyawanRes.karyawan[0]);
                    setKaryawans(karyawanRes.karyawan);
                    console.log('💾 Karyawan state updated');
                } else {
                    console.error('❌ Failed to load karyawan:', karyawanRes);
                }

                // Process products
                if (productsRes.success && productsRes.data) {
                    const stockData = productsRes.data.data || [];
                    console.log('✅ Stock data loaded:', stockData.length);
                    console.log('📋 First stock item (full):', JSON.stringify(stockData[0], null, 2));
                    console.log('🔍 Stock item keys:', stockData[0] ? Object.keys(stockData[0]) : 'No data');

                    const productOptions: ProductOption[] = stockData.map((item: any) => {
                        // Use availableStock as requested
                        const stockValue = item.availableStock ?? 0;

                        const product = {
                            id: item.productId,
                            code: item.code || item.productCode,
                            name: item.name || item.productName,
                            warehouseId: item.warehouseId,
                            warehouseName: item.warehouseName || item.warehouse?.name || 'Unknown',
                            availableStock: stockValue,
                            unit: item.unit || 'pcs'
                        };

                        console.log(`📦 Product: ${product.code} - Stock: ${stockValue} (from field: availableStock)`);

                        return product;
                    });
                    console.log('✅ Products processed:', productOptions.length);
                    console.log('📋 First processed product:', productOptions[0]);
                    setProducts(productOptions);
                    console.log('💾 Products state updated');
                } else {
                    console.error('❌ Failed to load products:', productsRes);
                }
            } catch (error) {
                console.error('❌ Error fetching data:', error);
                toast.error('Gagal memuat data: ' + (error as Error).message);
            } finally {
                setIsLoadingData(false);
                console.log('✅ Data fetch completed');
            }
        };

        fetchData();
    }, []);

    // Filter products based on selected fromWarehouse
    const availableProducts = fromWarehouseId
        ? products.filter(p => p.warehouseId === fromWarehouseId && p.availableStock > 0)
        : [];

    // Log available products when warehouse changes
    useEffect(() => {
        console.log('🏭 From Warehouse ID:', fromWarehouseId);
        console.log('📦 Total products:', products.length);

        // Show unique warehouse IDs in products
        const uniqueWarehouseIds = [...new Set(products.map(p => p.warehouseId))];
        console.log('🏢 Unique warehouse IDs in products:', uniqueWarehouseIds);

        // Show products for selected warehouse
        const filtered = products.filter(p => p.warehouseId === fromWarehouseId);
        console.log('🔍 Products matching warehouse ID:', filtered.length);

        // Show products with stock
        const withStock = filtered.filter(p => p.availableStock > 0);
        console.log('✅ Available products for this warehouse:', withStock.length);

        if (withStock.length > 0) {
            console.log('📋 First available product:', withStock[0]);
        } else if (filtered.length > 0) {
            console.log('⚠️ Products found but no stock:', filtered[0]);
        } else if (products.length > 0) {
            console.log('⚠️ Sample product warehouse ID:', products[0].warehouseId);
        }
    }, [fromWarehouseId, products, availableProducts]);

    const onSubmit = async (data: CreateTransferInput) => {
        const result = await createMutation.mutateAsync(data);
        if (result.success) {
            onSuccess?.();
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 shadow-lg">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-center gap-4">
                    <div className="rounded-lg bg-white/20 backdrop-blur-sm p-3 shadow-lg">
                        <ArrowRightLeft className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white">Transfer Antar Gudang</h3>
                        <p className="text-white/90 text-sm mt-1">Pindahkan stok dari satu gudang ke gudang lainnya</p>
                    </div>
                </div>
            </div>

            {/* Transfer Information Section */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 shadow-md border border-slate-200 dark:border-slate-700">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl -z-0"></div>

                <div className="relative z-10 space-y-5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 p-2 shadow-md">
                            <Warehouse className="h-5 w-5 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Informasi Transfer</h4>
                    </div>

                    {/* Single Row for Warehouses and Sender */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* From Warehouse */}
                        <div className="space-y-2">
                            <Label htmlFor="fromWarehouseId" className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                                <div className="rounded-md bg-gradient-to-br from-blue-500 to-blue-600 p-1.5 shadow-sm">
                                    <Building2 className="h-4 w-4 text-white" />
                                </div>
                                Dari Gudang *
                            </Label>
                            <Controller
                                name="fromWarehouseId"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={isLoadingData}
                                    >
                                        <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-sm hover:border-blue-400 transition-colors h-11">
                                            <SelectValue placeholder={isLoadingData ? "Memuat..." : "Pilih gudang asal"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {warehouses.map((warehouse) => (
                                                <SelectItem key={warehouse.id} value={warehouse.id}>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{warehouse.code}</span>
                                                        <span className="text-slate-600">-</span>
                                                        <span>{warehouse.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.fromWarehouseId && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <span className="font-medium">⚠</span>
                                    {errors.fromWarehouseId.message}
                                </p>
                            )}
                        </div>

                        {/* To Warehouse */}
                        <div className="space-y-2">
                            <Label htmlFor="toWarehouseId" className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                                <div className="rounded-md bg-gradient-to-br from-purple-500 to-purple-600 p-1.5 shadow-sm">
                                    <MapPin className="h-4 w-4 text-white" />
                                </div>
                                Ke Gudang *
                            </Label>
                            <Controller
                                name="toWarehouseId"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={isLoadingData}
                                    >
                                        <SelectTrigger className={`bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-sm hover:border-purple-400 transition-colors h-11 ${fromWarehouseId && field.value === fromWarehouseId ? 'border-red-500 ring-2 ring-red-200' : ''
                                            }`}>
                                            <SelectValue placeholder={isLoadingData ? "Memuat..." : "Pilih gudang tujuan"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {warehouses.map((warehouse) => (
                                                <SelectItem
                                                    key={warehouse.id}
                                                    value={warehouse.id}
                                                    disabled={warehouse.id === fromWarehouseId}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{warehouse.code}</span>
                                                        <span className="text-slate-600">-</span>
                                                        <span>{warehouse.name}</span>
                                                        {warehouse.id === fromWarehouseId && (
                                                            <span className="text-xs text-red-500 ml-2">(Sama dengan gudang asal)</span>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.toWarehouseId && (
                                <p className="text-sm text-red-500 flex items-center gap-1 font-medium">
                                    <span>⚠</span>
                                    {errors.toWarehouseId.message}
                                </p>
                            )}
                        </div>

                        {/* Sender */}
                        <div className="space-y-2">
                            <Label htmlFor="senderId" className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                                <div className="rounded-md bg-gradient-to-br from-green-500 to-green-600 p-1.5 shadow-sm">
                                    <User className="h-4 w-4 text-white" />
                                </div>
                                Pengirim *
                            </Label>
                            <Controller
                                name="senderId"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={isLoadingData}
                                    >
                                        <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-sm hover:border-green-400 transition-colors h-11">
                                            <SelectValue placeholder={isLoadingData ? "Memuat..." : "Pilih karyawan pengirim"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {karyawans.map((karyawan) => (
                                                <SelectItem key={karyawan.id} value={karyawan.id}>
                                                    {karyawan.namaLengkap}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.senderId && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <span className="font-medium">⚠</span>
                                    {errors.senderId.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Notes - Row 2 */}
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                            <div className="rounded-md bg-gradient-to-br from-amber-500 to-amber-600 p-1.5 shadow-sm">
                                <FileText className="h-4 w-4 text-white" />
                            </div>
                            Catatan
                        </Label>
                        <Textarea
                            id="notes"
                            {...register('notes')}
                            placeholder="Catatan transfer (opsional)"
                            rows={2}
                            className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-sm hover:border-amber-400 transition-colors resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Items Section */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 shadow-md border border-slate-200 dark:border-slate-700">
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-pink-500/10 to-orange-500/10 rounded-full blur-3xl -z-0"></div>

                <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 p-2 shadow-md">
                                <Package className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Daftar Barang</h4>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ productId: '', quantity: 1, unit: 'pcs', notes: '' })}
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 hover:from-indigo-600 hover:to-purple-600 shadow-md hover:shadow-lg transition-all"
                            disabled={!fromWarehouseId}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Barang
                        </Button>
                    </div>

                    {!fromWarehouseId && (
                        <div className="text-center py-8 text-slate-500">
                            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Pilih gudang asal terlebih dahulu untuk menambahkan barang</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {fields.map((field, index) => {
                            const selectedProduct = products.find(p => p.id === watch(`items.${index}.productId`) && p.warehouseId === fromWarehouseId);

                            return (
                                <Card key={field.id} className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-12 gap-4">
                                            <div className="col-span-12 md:col-span-5">
                                                <Label className="text-slate-700 dark:text-slate-300 font-medium">Produk *</Label>
                                                <Controller
                                                    name={`items.${index}.productId`}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Select
                                                            onValueChange={(value) => {
                                                                field.onChange(value);
                                                                const product = products.find(p => p.id === value);
                                                                if (product) {
                                                                    setValue(`items.${index}.unit`, product.unit);
                                                                }
                                                            }}
                                                            value={field.value}
                                                            disabled={!fromWarehouseId}
                                                        >
                                                            <SelectTrigger className="mt-1.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 shadow-sm">
                                                                <SelectValue placeholder="Pilih produk" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {availableProducts.map((product) => (
                                                                    <SelectItem key={product.id} value={product.id}>
                                                                        <div className="flex flex-col">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-medium">{product.code}</span>
                                                                                <span>-</span>
                                                                                <span>{product.name}</span>
                                                                            </div>
                                                                            <span className="text-xs text-slate-500">
                                                                                Stok: {product.availableStock} {product.unit}
                                                                            </span>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                                {errors.items?.[index]?.productId && (
                                                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                                                        <span>⚠</span>
                                                        {errors.items[index]?.productId?.message}
                                                    </p>
                                                )}
                                                {selectedProduct && (
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                                        Stok tersedia: <span className="font-semibold">{selectedProduct.availableStock} {selectedProduct.unit}</span>
                                                    </p>
                                                )}
                                            </div>

                                            <div className="col-span-6 md:col-span-2">
                                                <Label className="text-slate-700 dark:text-slate-300 font-medium">Jumlah *</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    {...register(`items.${index}.quantity`, {
                                                        valueAsNumber: true,
                                                        max: {
                                                            value: selectedProduct?.availableStock || 0,
                                                            message: `Maks. ${selectedProduct?.availableStock || 0}`
                                                        }
                                                    })}
                                                    max={selectedProduct?.availableStock}
                                                    placeholder="0"
                                                    className={`mt-1.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 shadow-sm ${(errors.items?.[index]?.quantity || (watch(`items.${index}.quantity`) > (selectedProduct?.availableStock || 0))) ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                                />
                                                {errors.items?.[index]?.quantity && (
                                                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                                                        <span>⚠</span>
                                                        {errors.items[index]?.quantity?.message}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="col-span-6 md:col-span-1">
                                                <Label className="text-slate-700 dark:text-slate-300 font-medium">Satuan *</Label>
                                                <Input
                                                    {...register(`items.${index}.unit`)}
                                                    placeholder="pcs"
                                                    className="mt-1.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 shadow-sm"
                                                    readOnly
                                                />
                                            </div>

                                            <div className="col-span-10 md:col-span-3">
                                                <Label className="text-slate-700 dark:text-slate-300 font-medium">Catatan</Label>
                                                <Input
                                                    {...register(`items.${index}.notes`)}
                                                    placeholder="Catatan"
                                                    className="mt-1.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 shadow-sm"
                                                />
                                            </div>

                                            <div className="col-span-2 md:col-span-1 flex items-end">
                                                {fields.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={() => remove(index)}
                                                        className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-md hover:shadow-lg transition-all"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>


            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-2">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={createMutation.isPending}
                        className="px-8 py-6 text-base font-semibold"
                    >
                        Batal
                    </Button>
                )}
                <Button
                    type="submit"
                    disabled={createMutation.isPending || isLoadingData}
                    className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all px-8 py-6 text-base font-semibold"
                >
                    {createMutation.isPending && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                    {createMutation.isPending ? 'Membuat Transfer...' : 'Buat Transfer - GR - MR'}
                </Button>
            </div>
        </form>
    );
}
