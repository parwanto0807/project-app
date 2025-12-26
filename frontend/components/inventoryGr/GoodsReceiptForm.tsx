'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { createGoodsReceiptAction } from '@/lib/action/grInventory/grAction';

// Schema validation
const goodsReceiptItemSchema = z.object({
    productId: z.string().min(1, 'Product is required'),
    qtyReceived: z.number().positive('Quantity must be greater than 0'),
    unit: z.string().min(1, 'Unit is required'),
    qtyPassed: z.number().min(0, 'Quantity passed cannot be negative'),
    qtyRejected: z.number().min(0, 'Quantity rejected cannot be negative'),
    qcStatus: z.enum(['PENDING', 'PASSED', 'REJECTED', 'PARTIAL']),
    qcNotes: z.string().optional(),
    purchaseOrderLineId: z.string().optional(),
}).refine(
    (data) => data.qtyPassed + data.qtyRejected === data.qtyReceived,
    {
        message: 'qtyPassed + qtyRejected must equal qtyReceived',
        path: ['qtyConsistency'],
    }
);

const goodsReceiptFormSchema = z.object({
    grNumber: z.string()
        .min(1, 'GR Number is required')
        .regex(/^GRN-\d{6}-\d{4}$/, 'Format must be GRN-YYYYMM-XXXX'),
    receivedDate: z.date(),
    vendorDeliveryNote: z.string().min(1, 'Vendor delivery note is required'),
    vehicleNumber: z.string().optional(),
    driverName: z.string().optional(),
    purchaseOrderId: z.string().min(1, 'Purchase order is required'),
    warehouseId: z.string().min(1, 'Warehouse is required'),
    receivedById: z.string().min(1, 'Receiver is required'),
    notes: z.string().optional(),
    items: z.array(goodsReceiptItemSchema).min(1, 'At least one item is required'),
});

type GoodsReceiptFormValues = z.infer<typeof goodsReceiptFormSchema>;

interface GoodsReceiptFormProps {
    poId?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

interface Product {
    id: string;
    code: string;
    name: string;
    unit: string;
}

interface PurchaseOrder {
    id: string;
    poNumber: string;
    vendor: {
        id: string;
        name: string;
    };
    items: {
        id: string;
        productId: string;
        product: Product;
        quantity: number;
        unit: string;
    }[];
}

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

interface User {
    id: string;
    name: string;
    email: string;
}

export function GoodsReceiptForm({ poId, onSuccess, onCancel }: GoodsReceiptFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

    const form = useForm<GoodsReceiptFormValues>({
        resolver: zodResolver(goodsReceiptFormSchema),
        defaultValues: {
            grNumber: '',
            receivedDate: new Date(),
            vendorDeliveryNote: '',
            vehicleNumber: '',
            driverName: '',
            purchaseOrderId: poId || '',
            warehouseId: '',
            receivedById: '',
            notes: '',
            items: [],
        },
    });

    // Fetch data on component mount
    useEffect(() => {
        fetchInitialData();
    }, []);

    // Auto-select PO if poId is provided
    useEffect(() => {
        if (poId && purchaseOrders.length > 0) {
            handlePOChange(poId);
        }
    }, [poId, purchaseOrders]);

    const fetchInitialData = async () => {
        try {
            // Fetch products
            const productsRes = await fetch('/api/products?limit=100');
            if (productsRes.ok) {
                const data = await productsRes.json();
                if (data.success) {
                    setProducts(data.data.data || []);
                }
            }

            // Fetch purchase orders
            const poRes = await fetch('/api/purchase-orders?status=APPROVED&limit=100');
            if (poRes.ok) {
                const data = await poRes.json();
                if (data.success) {
                    setPurchaseOrders(data.data.data || []);
                }
            }

            // Fetch warehouses
            const warehouseRes = await fetch('/api/warehouses?limit=100');
            if (warehouseRes.ok) {
                const data = await warehouseRes.json();
                if (data.success) {
                    setWarehouses(data.data.data || []);
                }
            }

            // Fetch users
            const usersRes = await fetch('/api/users?role=WAREHOUSE_STAFF&limit=100');
            if (usersRes.ok) {
                const data = await usersRes.json();
                if (data.success) {
                    setUsers(data.data.data || []);
                }
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
        }
    };

    const handlePOChange = (poId: string) => {
        form.setValue('purchaseOrderId', poId);
        const po = purchaseOrders.find(p => p.id === poId);
        setSelectedPO(po || null);

        // Clear existing items and add PO items
        form.setValue('items', []);
        if (po) {
            po.items.forEach(item => {
                form.setValue('items', [
                    ...form.getValues('items'),
                    {
                        productId: item.productId,
                        qtyReceived: item.quantity,
                        unit: item.unit,
                        qtyPassed: item.quantity,
                        qtyRejected: 0,
                        qcStatus: 'PENDING' as const,
                        purchaseOrderLineId: item.id,
                    }
                ]);
            });
        }
    };

    const addEmptyItem = () => {
        form.setValue('items', [
            ...form.getValues('items'),
            {
                productId: '',
                qtyReceived: 0,
                unit: '',
                qtyPassed: 0,
                qtyRejected: 0,
                qcStatus: 'PENDING' as const,
            }
        ]);
    };

    const removeItem = (index: number) => {
        const items = form.getValues('items');
        items.splice(index, 1);
        form.setValue('items', [...items]);
    };

    const handleItemChange = (index: number, field: keyof GoodsReceiptFormValues['items'][0], value: any) => {
        const items = [...form.getValues('items')];
        items[index] = { ...items[index], [field]: value };
        form.setValue('items', items);
    };

    const generateGRNumber = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const sequence = String(form.getValues('items').length + 1).padStart(4, '0');
        return `GRN-${year}${month}-${sequence}`;
    };

    const onSubmit = async (data: GoodsReceiptFormValues) => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (key === 'items') {
                    formData.append(key, JSON.stringify(value));
                } else if (key === 'receivedDate' && value instanceof Date) {
                    formData.append(key, value.toISOString());
                } else if (value !== undefined && value !== null) {
                    formData.append(key, String(value));
                }
            });

            const result = await createGoodsReceiptAction(formData);

            if (result.success) {
                if (onSuccess) {
                    onSuccess();
                } else {
                    // Default: redirect to GR list
                    window.location.href = '/admin-area/inventory/goods-receipt';
                }
            } else {
                alert(result.message || 'Failed to create goods receipt');
            }
        } catch (error) {
            console.error('Error creating goods receipt:', error);
            alert('Failed to create goods receipt');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Header Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="grNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>GR Number *</FormLabel>
                                <div className="flex gap-2">
                                    <FormControl>
                                        <Input {...field} placeholder="GRN-202512-0001" />
                                    </FormControl>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => field.onChange(generateGRNumber())}
                                    >
                                        Generate
                                    </Button>
                                </div>
                                <FormDescription>
                                    Format: GRN-YYYYMM-XXXX
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="receivedDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Received Date *</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date > new Date()}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Vendor Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="vendorDeliveryNote"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vendor Delivery Note *</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="SJ/VEN/001" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="purchaseOrderId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Purchase Order *</FormLabel>
                                <Select onValueChange={handlePOChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select purchase order" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {purchaseOrders.map((po) => (
                                            <SelectItem key={po.id} value={po.id}>
                                                {po.poNumber} - {po.vendor.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Delivery Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="vehicleNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vehicle Number</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="B 1234 CD" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="driverName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Driver Name</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="John Doe" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Warehouse and Receiver */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="warehouseId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Warehouse *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select warehouse" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {warehouses.map((warehouse) => (
                                            <SelectItem key={warehouse.id} value={warehouse.id}>
                                                {warehouse.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="receivedById"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Received By *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select receiver" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {users.map((user) => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Items Section */}
                <Separator />
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Items</h3>
                        <Button type="button" variant="outline" onClick={addEmptyItem}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Item
                        </Button>
                    </div>

                    {form.watch('items').map((item, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="font-medium">Item {index + 1}</h4>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeItem(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormItem>
                                    <FormLabel>Product *</FormLabel>
                                    <Select
                                        value={item.productId}
                                        onValueChange={(value) => handleItemChange(index, 'productId', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map((product) => (
                                                <SelectItem key={product.id} value={product.id}>
                                                    {product.code} - {product.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>

                                <FormItem>
                                    <FormLabel>Quantity Received *</FormLabel>
                                    <Input
                                        type="number"
                                        value={item.qtyReceived}
                                        onChange={(e) => handleItemChange(index, 'qtyReceived', parseFloat(e.target.value) || 0)}
                                        min="0"
                                        step="0.01"
                                    />
                                </FormItem>

                                <FormItem>
                                    <FormLabel>Unit *</FormLabel>
                                    <Input
                                        value={item.unit}
                                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                        placeholder="PCS, KG, etc"
                                    />
                                </FormItem>

                                <FormItem>
                                    <FormLabel>Quantity Passed</FormLabel>
                                    <Input
                                        type="number"
                                        value={item.qtyPassed}
                                        onChange={(e) => handleItemChange(index, 'qtyPassed', parseFloat(e.target.value) || 0)}
                                        min="0"
                                        step="0.01"
                                    />
                                </FormItem>

                                <FormItem>
                                    <FormLabel>Quantity Rejected</FormLabel>
                                    <Input
                                        type="number"
                                        value={item.qtyRejected}
                                        onChange={(e) => handleItemChange(index, 'qtyRejected', parseFloat(e.target.value) || 0)}
                                        min="0"
                                        step="0.01"
                                    />
                                </FormItem>

                                <FormItem>
                                    <FormLabel>QC Status</FormLabel>
                                    <Select
                                        value={item.qcStatus}
                                        onValueChange={(value) => handleItemChange(index, 'qcStatus', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                            <SelectItem value="PASSED">Passed</SelectItem>
                                            <SelectItem value="REJECTED">Rejected</SelectItem>
                                            <SelectItem value="PARTIAL">Partial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>

                                <FormItem className="md:col-span-3">
                                    <FormLabel>QC Notes</FormLabel>
                                    <Input
                                        value={item.qcNotes || ''}
                                        onChange={(e) => handleItemChange(index, 'qcNotes', e.target.value)}
                                        placeholder="Notes for QC inspection"
                                    />
                                </FormItem>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Notes */}
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    placeholder="Additional notes about this goods receipt"
                                    rows={3}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Form Actions */}
                <div className="flex justify-end space-x-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            if (onCancel) {
                                onCancel();
                            } else {
                                window.location.href = '/admin-area/inventory/goods-receipt';
                            }
                        }}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Goods Receipt'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}