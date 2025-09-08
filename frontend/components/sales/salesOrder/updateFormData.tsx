"use client"

import * as React from "react"
import { z } from "zod";
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import { format } from "date-fns"
import {
    Building,
    CalendarIcon,
    FileText,
    Hash,
    Loader2,
    PlusCircle,
    Save,
    Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { createSalesOrderSchema } from "@/schemas/index";
import { updateSalesOrderAPI } from "@/lib/action/sales/salesOrder"
import { fetchAllProjects } from "@/lib/action/master/project";
import { fetchAllProductsByType } from "@/lib/action/master/product";
import { ApiProductSchema } from "@/schemas/index";

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { salesOrderUpdateSchema } from "@/schemas/index";
import { type SalesOrder } from "@/schemas";
import { ensureFreshToken } from "@/lib/http";
import { ProductCreateDialog } from "./productDialog";

type ApiProduct = z.infer<typeof ApiProductSchema>;
type ProductOption = { id: string; name: string; description?: string; usageUnit?: string | null; };

interface Customer {
    id: string
    name: string
    address?: string
}

interface Project {
    id: string
    name: string
}

interface UpdateSalesOrderFormProps {
    customers: Customer[]
    salesOrder: SalesOrder
    isLoading?: boolean
    user?: { id: string }
    role?: string
}

// Gunakan schema yang sama dengan create, tapi tanpa soNumber
const formSchema = createSalesOrderSchema.omit({ soNumber: true });
type UpdateSalesOrderPayload = z.input<typeof formSchema>;

function getBasePath(role?: string) {
    return role === "super"
        ? "/super-admin-area/sales/saleOrder"
        : "/admin-area/sales/salesOrder"
}

export function UpdateSalesOrderForm({
    customers,
    salesOrder,
    isLoading,
    user,
    role,
}: UpdateSalesOrderFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = React.useTransition()
    const [customerOptions, setCustomerOptions] = React.useState(customers);
    const [projectOptions, setProjectOptions] = React.useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = React.useState(false);
    const itemsEndRef = React.useRef<HTMLDivElement | null>(null);
    const scrollToBottom = () => {
        itemsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // State untuk menyimpan productOptions per index item
    const [productOptionsPerItem, setProductOptionsPerItem] = React.useState<Record<number, ProductOption[]>>({});
    const [loadingProductsPerItem, setLoadingProductsPerItem] = React.useState<Record<number, boolean>>({});

    React.useEffect(() => { setCustomerOptions(customers); }, [customers]);

    const form = useForm<UpdateSalesOrderPayload>({
        resolver: zodResolver(formSchema),
        mode: "onSubmit",
        reValidateMode: "onChange",
        defaultValues: {
            soDate: new Date(salesOrder.soDate),
            customerId: salesOrder.customerId,
            projectId: salesOrder.projectId || "",
            userId: user?.id ?? "",
            type: salesOrder.type,
            status: salesOrder.status || "DRAFT",
            currency: salesOrder.currency || "IDR",
            notes: salesOrder.notes || null,
            isTaxInclusive: salesOrder.isTaxInclusive || false,
            items: salesOrder.items.map(item => ({
                id: item.id,
                itemType: item.itemType || "PRODUCT",
                productId: item.productId || null,
                name: item.name || "",
                description: item.description || null,
                uom: item.uom || null,
                qty: item.qty || 1,
                unitPrice: item.unitPrice || 0,
                discount: item.discount || 0,
                taxRate: item.taxRate || 0,
            })),
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    })

    const ItemTypeContext = React.createContext<"PRODUCT" | "SERVICE">("PRODUCT");
    const ProductCreateDialogWithContext: React.FC<{
        onProductCreated: () => void;
    }> = ({ onProductCreated }) => {
        const itemType = React.useContext(ItemTypeContext);

        const createEndpoint = itemType === "PRODUCT"
            ? "/api/products"
            : "/api/services";

        return (
            <ProductCreateDialog
                createEndpoint={createEndpoint}
                onCreated={onProductCreated}
            />
        );
    };

    // Fungsi untuk memuat produk berdasarkan tipe untuk item tertentu
    const fetchProductsForItem = async (index: number, itemType: "PRODUCT" | "SERVICE" | "CUSTOM") => {
        if (itemType === "CUSTOM") {
            setProductOptionsPerItem(prev => ({ ...prev, [index]: [] }));
            return;
        }

        setLoadingProductsPerItem(prev => ({ ...prev, [index]: true }));
        try {
            const accessToken = localStorage.getItem("accessToken");
            const { products } = await fetchAllProductsByType(accessToken ?? undefined, itemType);

            const options = products.map((p: ApiProduct): ProductOption => ({
                id: p.id,
                name: p.name,
                description: p.description,
                usageUnit: p.usageUnit ?? null,
            }));

            setProductOptionsPerItem(prev => ({ ...prev, [index]: options }));
        } catch (error) {
            console.error(`Failed to fetch products for item ${index}:`, error);
            toast.error(`Gagal memuat data produk untuk item ${index + 1}`);
        } finally {
            setLoadingProductsPerItem(prev => ({ ...prev, [index]: false }));
        }
    };

    // Fetch projects
    React.useEffect(() => {
        (async () => {
            setLoadingProjects(true);
            try {
                const { projects } = await fetchAllProjects({ customerId: salesOrder.customerId });
                setProjectOptions(
                    projects.map((p: Project) => ({
                        id: p.id,
                        name: p.name,
                    }))
                );
            } catch (error) {
                console.error("Failed to fetch projects:", error);
                toast.error("Gagal memuat data proyek");
            } finally {
                setLoadingProjects(false);
            }
        })();
    }, [salesOrder.customerId]);

    React.useEffect(() => {
        const onFocus = () => { ensureFreshToken(); };
        const onVis = () => { if (!document.hidden) ensureFreshToken(); };

        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onVis);

        const id = setInterval(onFocus, 60_000);

        return () => {
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onVis);
            clearInterval(id);
        };
    }, []);

    // Fungsi untuk handle product selection
    const handleProductSelect = (index: number, productId: string | undefined) => {
        if (!productId) {
            form.setValue(`items.${index}.name`, "", { shouldDirty: true, shouldTouch: true });
            form.setValue(`items.${index}.description`, "", { shouldDirty: true, shouldTouch: true });
            form.setValue(`items.${index}.uom`, "", { shouldDirty: true, shouldTouch: true });
            return;
        }

        const selectedProduct = productOptionsPerItem[index]?.find(p => p.id === productId);
        if (!selectedProduct) return;

        const uomValue = selectedProduct.usageUnit ?? "";

        form.setValue(`items.${index}.productId`, productId, { shouldDirty: true, shouldTouch: true });
        form.setValue(`items.${index}.name`, selectedProduct.name ?? "", { shouldDirty: true, shouldTouch: true });
        form.setValue(`items.${index}.description`, selectedProduct.description ?? "", { shouldDirty: true, shouldTouch: true });
        form.setValue(`items.${index}.uom`, uomValue, { shouldDirty: true, shouldTouch: true });
    };

    // Fungsi untuk refresh produk setelah menambah produk baru
    const handleProductCreated = (index: number, itemType: "PRODUCT" | "SERVICE") => {
        fetchProductsForItem(index, itemType);
    };

    function onSubmit(data: UpdateSalesOrderPayload) {
        startTransition(async () => {
            try {
                const cleanedData = salesOrderUpdateSchema.parse(data);
                const result = await updateSalesOrderAPI(salesOrder.id, cleanedData);

                if (result.error) {
                    toast.error("Terjadi Kesalahan", { description: result.error });
                } else if (result.success) {
                    toast.success("Sukses!", { description: "Sales Order berhasil diperbarui." });
                    const basePath = getBasePath(role)
                    router.push(basePath)
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui Sales Order.";
                toast.error("Terjadi Kesalahan", { description: errorMessage });
            }
        });
    }

    if (isLoading) {
        return <UpdateSalesOrderFormSkeleton />
    }

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Update Sales Order #{salesOrder.soNumber}</h1>
                    <p className="text-muted-foreground">
                        Perbarui detail di bawah ini untuk mengubah Sales Order.
                    </p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Informasi Utama</CardTitle>
                            <CardDescription>
                                Informasi dasar mengenai sales order
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormItem>
                                <FormLabel>Nomor Sales Order</FormLabel>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={salesOrder.soNumber}
                                        className="pl-9"
                                        disabled
                                    />
                                </div>
                                <FormMessage />
                            </FormItem>

                            <FormField
                                control={form.control}
                                name="soDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Tanggal SO</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "dd MMM yyyy")
                                                        ) : (
                                                            <span>Pilih tanggal</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={(d) => field.onChange(d ?? field.value ?? new Date())}
                                                    disabled={date =>
                                                        date > new Date() || date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="customerId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Customer</FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <div className="relative w-full">
                                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={async (id) => {
                                                            field.onChange(id);
                                                            form.setValue("projectId", "");
                                                            setLoadingProjects(true);
                                                            try {
                                                                const { projects } = await fetchAllProjects({ customerId: id });
                                                                setProjectOptions(projects.map((p) => ({ id: p.id, name: p.name })));
                                                            } finally {
                                                                setLoadingProjects(false);
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger className="pl-9">
                                                            <SelectValue placeholder="Pilih customer..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {customerOptions.map((c) => (
                                                                <SelectItem key={c.id} value={c.id}>
                                                                    {c.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </FormControl>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="projectId"
                                render={({ field }) => {
                                    const selectedCustomerId = form.watch("customerId");
                                    const disabled = !selectedCustomerId || loadingProjects;

                                    return (
                                        <FormItem>
                                            <FormLabel>Project (Opsional)</FormLabel>
                                            <div className="flex gap-2">
                                                <FormControl>
                                                    <div className="relative w-full">
                                                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Select
                                                            value={field.value ?? undefined}
                                                            onValueChange={(value) => {
                                                                field.onChange(value === "none" ? undefined : value);
                                                            }}
                                                            disabled={disabled}
                                                        >
                                                            <SelectTrigger className="pl-9">
                                                                <SelectValue
                                                                    placeholder={
                                                                        !selectedCustomerId
                                                                            ? "Pilih customer dulu"
                                                                            : loadingProjects
                                                                                ? "Memuat project…"
                                                                                : "Pilih project..."
                                                                    }
                                                                />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {!selectedCustomerId ? (
                                                                    <div className="px-3 py-2 text-sm opacity-60">Customer belum dipilih</div>
                                                                ) : loadingProjects ? (
                                                                    <div className="px-3 py-2 text-sm opacity-60">Memuat project…</div>
                                                                ) : projectOptions.length ? (
                                                                    <>
                                                                        {projectOptions.map((p) => (
                                                                            <SelectItem key={p.id} value={p.id}>
                                                                                {p.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </>
                                                                ) : (
                                                                    <div className="px-3 py-2 text-sm opacity-60">
                                                                        Tidak ada project untuk customer ini
                                                                    </div>
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </FormControl>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />

                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Tipe SO</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4"
                                            >
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="REGULAR" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                        Regular
                                                    </FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="SUPPORT" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                        Support
                                                    </FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Catatan (Opsional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Tambahkan catatan untuk SO ini..."
                                                className="resize-none"
                                                value={field.value || ""}
                                                onChange={(e) => field.onChange(e.target.value || undefined)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-lg">Items</CardTitle>
                                    <CardDescription>
                                        Daftar produk atau jasa yang dipesan
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {fields.map((row, index) => {
                                // type Option = { id: string; name: string };
                                const itemType = form.watch(`items.${index}.itemType`);
                                const isCatalogItem = itemType === "PRODUCT" || itemType === "SERVICE";
                                const itemNo = String(index + 1).padStart(2, "0");
                                const productOptions = productOptionsPerItem[index] || [];
                                const loadingProducts = loadingProductsPerItem[index] || false;

                                const qty = form.watch(`items.${index}.qty`) ?? 0;
                                const unitPrice = form.watch(`items.${index}.unitPrice`) ?? 0;
                                const discount = form.watch(`items.${index}.discount`) ?? 0;
                                const taxRate = form.watch(`items.${index}.taxRate`) ?? 0;

                                const gross = qty * unitPrice;
                                const net = gross * (1 - discount / 100);
                                const total = net * (1 + taxRate / 100);

                                const validateProductId = (type: string, productId: string | null | undefined) => {
                                    if ((type === "PRODUCT" || type === "SERVICE") && !productId) {
                                        return "Produk/jasa harus dipilih";
                                    }
                                    return true;
                                };

                                return (
                                    <div key={row.id} className="grid grid-cols-1 gap-4 p-4 border rounded-lg bg-muted/30">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`inline-flex h-7 items-center rounded-full px-3 text-sm font-semibold shadow-sm
                  ${itemType === "PRODUCT" ? "bg-green-600 text-white"
                                                            : itemType === "SERVICE" ? "bg-blue-600 text-white"
                                                                : "bg-purple-600 text-white"}`}
                                                >
                                                    Item {itemNo}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {itemType === "PRODUCT" ? "Product" : itemType === "SERVICE" ? "Service" : "Custom"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                            <div className="md:col-span-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.itemType`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Tipe Item</FormLabel>
                                                            <Select
                                                                value={field.value ?? "PRODUCT"}
                                                                onValueChange={async (next: "PRODUCT" | "SERVICE" | "CUSTOM") => {
                                                                    field.onChange(next);
                                                                    await fetchProductsForItem(index, next);

                                                                    if (next === "CUSTOM") {
                                                                        form.setValue(`items.${index}.productId`, null, {
                                                                            shouldValidate: true,
                                                                            shouldDirty: true,
                                                                        });
                                                                        form.setValue(`items.${index}.name`, "", { shouldDirty: true });
                                                                        form.setValue(`items.${index}.description`, "", { shouldDirty: true });
                                                                        form.setValue(`items.${index}.uom`, "", { shouldDirty: true });
                                                                    } else if (next === "PRODUCT" || next === "SERVICE") {
                                                                        const currentProductId = form.getValues(`items.${index}.productId`);
                                                                        if (!currentProductId && productOptions.length > 0) {
                                                                            const productIdValue = productOptions[0].id;
                                                                            form.setValue(`items.${index}.productId`, productIdValue, {
                                                                                shouldValidate: true,
                                                                                shouldDirty: true,
                                                                            });
                                                                            handleProductSelect(index, productIdValue);
                                                                        } else if (currentProductId) {
                                                                            handleProductSelect(index, currentProductId);
                                                                        }
                                                                    }
                                                                }}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Pilih tipe" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="PRODUCT">Product</SelectItem>
                                                                    <SelectItem value="SERVICE">Service</SelectItem>
                                                                    <SelectItem value="CUSTOM">Custom</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {isCatalogItem && (
                                                <div className="md:col-span-9">
                                                    <FormField
                                                        control={form.control}
                                                        name={`items.${index}.productId`}
                                                        rules={{ validate: (value) => validateProductId(itemType, value) }}
                                                        render={({ field }) => (
                                                            <FormItem className="w-full">
                                                                <FormLabel>{itemType === "PRODUCT" ? "Produk" : "Jasa"}</FormLabel>
                                                                <Select
                                                                    value={field.value ?? undefined}
                                                                    onValueChange={(value) => {
                                                                        field.onChange(value);
                                                                        handleProductSelect(index, value);
                                                                    }}
                                                                    disabled={loadingProducts}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger className="w-full">
                                                                            <SelectValue
                                                                                placeholder={
                                                                                    loadingProducts
                                                                                        ? "Memuat produk..."
                                                                                        : `Pilih ${itemType === "PRODUCT" ? "produk" : "jasa"}`
                                                                                }
                                                                            />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        {loadingProducts ? (
                                                                            <div className="px-3 py-2 text-sm opacity-60">Memuat...</div>
                                                                        ) : productOptions.length > 0 ? (
                                                                            productOptions.map((opt) => (
                                                                                <SelectItem key={opt.id} value={opt.id}>
                                                                                    {opt.name}
                                                                                </SelectItem>
                                                                            ))
                                                                        ) : (
                                                                            <div className="px-3 py-2 text-sm opacity-60">
                                                                                Tidak ada {itemType === "PRODUCT" ? "produk" : "jasa"} yang tersedia
                                                                            </div>
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            )}

                                            {isCatalogItem && (
                                                <div className="md:col-span-1 flex items-end">
                                                    <ItemTypeContext.Provider value={itemType}>
                                                        <ProductCreateDialogWithContext
                                                            onProductCreated={() => handleProductCreated(index, itemType)}
                                                        />
                                                    </ItemTypeContext.Provider>
                                                </div>
                                            )}
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nama Item</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Nama item/jasa..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.description`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Deskripsi (Opsional)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Deskripsi detail item/jasa..."
                                                            className="resize-none"
                                                            value={field.value || ""}
                                                            onChange={(e) => field.onChange(e.target.value || undefined)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.qty`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Quantity</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.0001"
                                                                min="0"
                                                                placeholder="1.0000"
                                                                value={field.value}
                                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.uom`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>UOM</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="mis. pcs"
                                                                value={field.value ?? ""}
                                                                onChange={(e) => field.onChange(e.target.value || null)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.unitPrice`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Harga Satuan</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                placeholder="0.00"
                                                                value={field.value}
                                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.discount`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Diskon (%)</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                max="100"
                                                                placeholder="0.00"
                                                                value={field.value}
                                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.taxRate`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Pajak (%)</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                placeholder="0.00"
                                                                value={field.value}
                                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="flex flex-col justify-end">
                                                <FormLabel>Subtotal</FormLabel>
                                                <div className="flex items-center h-10 px-3 rounded-md border bg-background font-medium">
                                                    <span className="text-sm">
                                                        Rp {Number.isFinite(total) ? total.toLocaleString("id-ID") : "0"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end pt-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => remove(index)}
                                                disabled={fields.length <= 1}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Hapus
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}

                            {form.formState.errors.items?.message && (
                                <p className="text-sm font-medium text-destructive">
                                    {form.formState.errors.items.message}
                                </p>
                            )}
                        </CardContent>
                        <div className="flex items-center justify-end pt-1 pr-6">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="relative overflow-hidden rounded-lg px-3 py-2 font-medium shadow-md transition-all duration-300 
    bg-gradient-to-r from-sky-400 to-cyan-500 text-white hover:from-sky-500 hover:to-cyan-600
    dark:from-emerald-400 dark:to-lime-500 dark:hover:from-emerald-500 dark:hover:to-lime-600
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 dark:focus:ring-lime-400"
                                onClick={() => {
                                    append({
                                        itemType: "PRODUCT",
                                        productId: null,
                                        name: "",
                                        description: "",
                                        qty: 1,
                                        unitPrice: 0,
                                        discount: 0,
                                        taxRate: 0,
                                    });

                                    if (window.innerWidth >= 768) {
                                        setTimeout(scrollToBottom, 100);
                                    }
                                }}
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Tambah Item
                            </Button>

                            <div ref={itemsEndRef} />
                        </div>
                    </Card>

                    <div className="flex justify-end gap-2 sticky bottom-4 bg-cyan-100 dark:bg-cyan-950 p-4 rounded-lg border shadow-sm">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={isPending}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="min-w-40"
                        >
                            {isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Perbarui Sales Order
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}

function UpdateSalesOrderFormSkeleton() {
    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                        <Skeleton className="h-10 w-32" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="grid grid-cols-1 gap-4 p-4 border rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <Skeleton className="h-10 md:col-span-2" />
                                <Skeleton className="h-10 md:col-span-3" />
                                <Skeleton className="h-10 md:col-span-7" />
                            </div>
                            <Skeleton className="h-20 w-full" />
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                {[...Array(6)].map((_, j) => (
                                    <div key={j} className="space-y-2">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end">
                                <Skeleton className="h-9 w-20" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-40" />
            </div>
        </div>
    )
}