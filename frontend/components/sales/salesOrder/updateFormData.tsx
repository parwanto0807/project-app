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
    Plus,
    PlusCircle,
    Save,
    Trash2,
    Calculator,
    Percent,
    Package,
    ChevronsUpDown,
    Search,
    Check,
    EyeOff,
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ProjectCreateDialog } from "./customerProjectDialogPickers";

type ApiProduct = z.infer<typeof ApiProductSchema>;
type ProductOption = { id: string; name: string; description?: string; usageUnit?: string | null; };

interface Customer {
    id: string
    name: string
    address?: string
    branch?: string
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
    returnUrl: string;
    highlightId: string | null;
    highlightStatus: string | null;
    searchUrl: string | null;
    page: string;
}

// Interface untuk state per item
interface ItemState {
    selectedApiType: "PRODUCT" | "SERVICE" | "CUSTOM" | undefined;
    productOptions: ProductOption[];
    productSearchOpen: boolean;
    productSearchQuery: string;
}

// Gunakan schema yang sama dengan create, tapi tanpa soNumber
const formSchema = createSalesOrderSchema.omit({ soNumber: true });
type UpdateSalesOrderPayload = z.input<typeof formSchema>;

function getBasePath(role?: string) {
    const paths: Record<string, string> = {
        super: "/super-admin-area/sales/salesOrder",
        pic: "/pic-area/sales/salesOrder",
        admin: "/admin-area/sales/salesOrder",
    }
    return paths[role ?? "admin"] || "/admin-area/sales/salesOrder"
}

// Fungsi untuk mengecek apakah role memiliki akses harga
const hasPriceAccess = (role?: string) => {
    return role === "admin" || role === "super";
}

export function UpdateSalesOrderForm({
    customers,
    salesOrder,
    isLoading,
    user,
    role,
    returnUrl,
    highlightId,
    highlightStatus,
    searchUrl,
    page,
}: UpdateSalesOrderFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = React.useTransition()
    const [customerOptions, setCustomerOptions] = React.useState(customers);
    const [projectOptions, setProjectOptions] = React.useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = React.useState(false);
    const [projectSearchOpen, setProjectSearchOpen] = React.useState(false);
    const [projectSearchQuery, setProjectSearchQuery] = React.useState("");
    const itemsEndRef = React.useRef<HTMLDivElement | null>(null);
    const itemTypeRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
    const basePath = getBasePath(role);

    // State per item menggunakan array
    const [itemsState, setItemsState] = React.useState<ItemState[]>(
        salesOrder.items.map(() => ({
            selectedApiType: "PRODUCT",
            productOptions: [],
            productSearchOpen: false,
            productSearchQuery: "",
        }))
    );

    const scrollToBottom = () => {
        itemsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

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
                id: item.id, // Pastikan ID item juga disertakan
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

    // Fungsi untuk update state per item
    const updateItemState = (index: number, updates: Partial<ItemState>) => {
        setItemsState(prev => {
            const newState = [...prev];
            newState[index] = { ...newState[index], ...updates };
            return newState;
        });
    };

    // Fungsi untuk menambah state item baru
    const addNewItemState = () => {
        setItemsState(prev => [
            ...prev,
            {
                selectedApiType: "PRODUCT",
                productOptions: [],
                productSearchOpen: false,
                productSearchQuery: "",
            }
        ]);
    };

    // Fungsi untuk menghapus state item
    const removeItemState = (index: number) => {
        setItemsState(prev => prev.filter((_, i) => i !== index));
    };

    // Fungsi untuk memuat produk berdasarkan tipe untuk item tertentu
    const fetchProductsForItem = React.useCallback(async (index: number, itemType: "PRODUCT" | "SERVICE" | "CUSTOM") => {
        if (itemType === "CUSTOM") {
            setItemsState(prev => {
                const newState = [...prev];
                newState[index] = { ...newState[index], productOptions: [] };
                return newState;
            });
            return;
        }

        try {
            const accessToken = localStorage.getItem("accessToken");
            const response = await fetchAllProductsByType(accessToken ?? undefined, itemType);

            // Based on the error, the response has a 'data' property instead of 'products'
            const options = response.data.map((p: ApiProduct): ProductOption => ({
                id: p.id,
                name: p.name,
                description: p.description,
                usageUnit: p.usageUnit ?? null,
            }));

            setItemsState(prev => {
                const newState = [...prev];
                newState[index] = { ...newState[index], productOptions: options };
                return newState;
            });
        } catch (error) {
            console.error(`Failed to fetch products for item ${index}:`, error);
            toast.error(`Gagal memuat data produk untuk item ${index + 1}`);
        }
    }, []);

    // Fetch projects
    React.useEffect(() => {
        (async () => {
            setLoadingProjects(true);
            try {
                const response = await fetchAllProjects({ customerId: salesOrder.customerId });
                setProjectOptions(
                    response.data.map((p: Project) => ({
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

    // Fetch products untuk setiap item saat mount
    React.useEffect(() => {
        salesOrder.items.forEach(async (item, index) => {
            if (item.itemType && ["PRODUCT", "SERVICE"].includes(item.itemType)) {
                await fetchProductsForItem(index, item.itemType);
            }
        });
    }, [salesOrder.items, fetchProductsForItem]);

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
    const handleProductSelect = (index: number, productId: string) => {
        const selectedProduct = itemsState[index]?.productOptions.find(p => p.id === productId);
        if (!selectedProduct) return;

        const uomValue = selectedProduct.usageUnit ?? "";

        form.setValue(`items.${index}.productId`, productId, { shouldDirty: true, shouldTouch: true });
        form.setValue(`items.${index}.name`, selectedProduct.name ?? "", { shouldDirty: true, shouldTouch: true });
        form.setValue(`items.${index}.description`, selectedProduct.description ?? "", { shouldDirty: true, shouldTouch: true });
        form.setValue(`items.${index}.uom`, uomValue, { shouldDirty: true, shouldTouch: true });
    };

    // Fungsi untuk menghitung total per item
    const calculateItemTotal = (index: number) => {
        const qty = form.watch(`items.${index}.qty`) || 0;
        const unitPrice = form.watch(`items.${index}.unitPrice`) || 0;
        const discount = form.watch(`items.${index}.discount`) || 0;
        const taxRate = form.watch(`items.${index}.taxRate`) || 0;

        const subtotal = qty * unitPrice;
        const discountAmount = subtotal * (discount / 100);
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = taxableAmount * (taxRate / 100);
        const total = taxableAmount + taxAmount;

        return total.toLocaleString('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        });
    };

    async function onSubmit(data: UpdateSalesOrderPayload) {
        startTransition(async () => {
            try {
                // Validasi: harga satuan tidak boleh negatif
                const hasInvalidPrice = data.items.some((item) => item.unitPrice < 0);
                if (hasInvalidPrice) {
                    toast.error("Terjadi Kesalahan", {
                        description: "Harga satuan tidak boleh negatif.",
                    });
                    return;
                }

                const updateData = {
                    ...data,
                    id: salesOrder.id, // Wajib untuk update
                };

                const cleanedData = salesOrderUpdateSchema.parse(updateData);
                const result = await updateSalesOrderAPI(salesOrder.id, cleanedData);

                if (result.error) {
                    toast.error("Terjadi Kesalahan", {
                        description: result.error,
                    });
                    return;
                }

                if (result.success) {
                    toast.success("Berhasil!", {
                        description: "Sales Order berhasil diperbarui.",
                    });

                    // ------------------------------------------------------------
                    // 🔥 REDIRECT SETELAH UPDATE
                    // ------------------------------------------------------------

                    // 1️⃣ Jika halaman sebelumnya mengirim returnUrl → pakai returnUrl
                    if (returnUrl && returnUrl !== "") {
                        router.push(returnUrl);
                        return;
                    }

                    // 2️⃣ Jika tidak ada returnUrl → kembali ke list + highlight
                    const toList = `${basePath}?page=${page ?? 1}&highlightId=${highlightId ?? salesOrder.id}&status=${highlightStatus ?? "UPDATED"}&search=${searchUrl}`;

                    router.push(toList);
                }
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Gagal memperbarui Sales Order.";

                toast.error("Terjadi Kesalahan", { description: errorMessage });
            }
        });
    }

    if (isLoading) {
        return <UpdateSalesOrderFormSkeleton />
    }

    const canSeePrice = hasPriceAccess(role);

    return (
        <div className="w-full mx-auto space-y-6">
            <div className="flex items-center space-x-3 mt-6">
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
                    {/* Bagian Detail Utama */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Informasi Utama</CardTitle>
                            <CardDescription>
                                Informasi dasar mengenai sales order
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-5 bg-gradient-to-r from-primary/5 to-blue-100 dark:from-slate-800 dark:to-slate-900 space-y-3 p-6 m-4 rounded-xl">
                            {/* Nomor SO & Tanggal */}
                            <div className="grid grid-cols-1 gap-4 md:col-span-2 md:grid-cols-2 ">
                                <div>
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
                                </div>
                                <div>
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
                                </div>
                            </div>

                            {/* Customer */}
                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="customerId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Customer</FormLabel>
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
                                                                const response = await fetchAllProjects({ customerId: id });
                                                                // Use response.data instead of response.projects
                                                                setProjectOptions(response.data.map((p: Project) => ({
                                                                    id: p.id,
                                                                    name: p.name
                                                                })));
                                                            } catch (error) {
                                                                console.error("Failed to fetch projects:", error);
                                                                toast.error("Gagal memuat data proyek");
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
                                                                    {c.branch ? `( ${c.branch} )` : ""}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Project */}
                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="projectId"
                                    render={({ field }) => {
                                        const selectedCustomerId = form.watch("customerId");
                                        const disabled = !selectedCustomerId || loadingProjects;

                                        const filteredProjects = projectOptions.filter((project) =>
                                            project.name
                                                .toLowerCase()
                                                .includes(projectSearchQuery.toLowerCase())
                                        );

                                        return (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Project (Opsional)</FormLabel>

                                                <div className="flex flex-row items-start gap-2 w-full">
                                                    {/* Dialog untuk membuat project - tetap sejajar */}
                                                    <div className="flex-shrink-0">
                                                        <ProjectCreateDialog
                                                            createEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/api/salesOrder/project/create`}
                                                            customerId={selectedCustomerId}
                                                            onCreated={(created) => {
                                                                setProjectOptions((prev) => [created, ...prev]);
                                                                form.setValue("projectId", created.id);
                                                            }}
                                                        />
                                                    </div>
                                                    <FormControl>
                                                        <div className="relative w-full">
                                                            <Popover
                                                                open={projectSearchOpen}
                                                                onOpenChange={setProjectSearchOpen}
                                                            >
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        role="combobox"
                                                                        aria-expanded={projectSearchOpen}
                                                                        className="w-full justify-between"
                                                                        disabled={disabled}
                                                                    >
                                                                        {field.value
                                                                            ? projectOptions.find(
                                                                                (project) => project.id === field.value
                                                                            )?.name
                                                                            : !selectedCustomerId
                                                                                ? "Pilih customer dulu"
                                                                                : loadingProjects
                                                                                    ? "Memuat project…"
                                                                                    : "Pilih project..."}
                                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-full p-0">
                                                                    <Command>
                                                                        <div className="flex items-center border-b px-3">
                                                                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                                            <CommandInput
                                                                                placeholder="Cari project..."
                                                                                value={projectSearchQuery}
                                                                                onValueChange={setProjectSearchQuery}
                                                                            />
                                                                        </div>
                                                                        <CommandList>
                                                                            <CommandEmpty>
                                                                                {!selectedCustomerId ? (
                                                                                    "Customer belum dipilih"
                                                                                ) : loadingProjects ? (
                                                                                    "Memuat project…"
                                                                                ) : projectSearchQuery ? (
                                                                                    "Project tidak ditemukan"
                                                                                ) : (
                                                                                    "Tidak ada project untuk customer ini"
                                                                                )}
                                                                            </CommandEmpty>
                                                                            <CommandGroup>
                                                                                {filteredProjects.map((project) => (
                                                                                    <CommandItem
                                                                                        key={project.id}
                                                                                        value={project.name}
                                                                                        onSelect={() => {
                                                                                            form.setValue("projectId", project.id);
                                                                                            setProjectSearchOpen(false);
                                                                                            setProjectSearchQuery("");
                                                                                        }}
                                                                                    >
                                                                                        <Check
                                                                                            className={cn(
                                                                                                "mr-2 h-4 w-4",
                                                                                                field.value === project.id
                                                                                                    ? "opacity-100"
                                                                                                    : "opacity-0"
                                                                                            )}
                                                                                        />
                                                                                        {project.name}
                                                                                    </CommandItem>
                                                                                ))}
                                                                            </CommandGroup>
                                                                        </CommandList>
                                                                    </Command>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </div>
                                                    </FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        );
                                    }}
                                />
                            </div>

                            {/* Notes */}
                            <div className="md:col-span-3">
                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
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
                            </div>

                            {/* Type */}
                            <div className="md:col-span-2">
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
                                                        <FormLabel className="font-normal">Regular</FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="SUPPORT" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">Support</FormLabel>
                                                    </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bagian Item SO */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-lg">Items</CardTitle>
                                    <CardDescription>
                                        Daftar produk atau jasa yang dipesan
                                    </CardDescription>
                                </div>
                                {!canSeePrice && (
                                    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground" hidden>
                                        <EyeOff className="h-4 w-4" />
                                        <span>Informasi harga disembunyikan</span>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="bg-gradient-to-r from-primary/5 to-blue-100 dark:from-slate-800 dark:to-slate-900 space-y-3 p-4 m-4 rounded-xl">
                            {fields.map((row, index) => {
                                const itemType = form.watch(`items.${index}.itemType`);
                                const isProduct = itemType === "PRODUCT";
                                const isCatalogItem = ["PRODUCT", "SERVICE"].includes(itemType ?? "");
                                const itemNo = String(index + 1).padStart(2, "0");
                                const itemState = itemsState[index] || {
                                    selectedApiType: "PRODUCT",
                                    productOptions: [],
                                    productSearchOpen: false,
                                    productSearchQuery: "",
                                };

                                const optionsForType = itemState.productOptions;
                                const typeColors: Record<string, string> = {
                                    PRODUCT: "bg-green-600 text-white shadow-sm",
                                    SERVICE: "bg-blue-600 text-white shadow-sm",
                                    CUSTOM: "bg-pink-600 text-white shadow-sm",
                                };
                                const badgeColor = typeColors[itemType ?? "CUSTOM"];

                                return (
                                    <div
                                        key={row.id}
                                        className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/30"
                                        aria-label={`Item ${index + 1}`}
                                    >
                                        <input type="hidden" {...form.register(`items.${index}.id`)} />

                                        <div className="grid grid-cols-1 md:grid-cols-14 gap-4">
                                            <div className="grid gap-1">
                                                {/* Label tipe item */}
                                                <span className="text-xs text-muted-foreground">
                                                    {isProduct ? "Product" : itemType === "SERVICE" ? "Service" : "Custom"}
                                                </span>
                                                {/* 🔢 Item Number Badge */}
                                                <span
                                                    className={`inline-flex h-7 items-center rounded px-3 text-xs md:text-sm font-semibold ${badgeColor}`}
                                                >
                                                    Item {itemNo}
                                                </span>
                                            </div>

                                            {/* Tipe Item */}
                                            <div className="md:col-span-1">
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
                                                                    updateItemState(index, { selectedApiType: next });

                                                                    if (["PRODUCT", "SERVICE"].includes(next)) {
                                                                        await fetchProductsForItem(index, next);
                                                                    } else {
                                                                        form.setValue(`items.${index}.productId`, null, {
                                                                            shouldValidate: true,
                                                                            shouldDirty: true,
                                                                        });
                                                                        updateItemState(index, { productOptions: [] });
                                                                    }
                                                                }}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger
                                                                        ref={(el) => {
                                                                            itemTypeRefs.current[index] = el;
                                                                        }}
                                                                        className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-xs"
                                                                    >
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

                                            {/* Pemilihan dari katalog (tampil untuk PRODUCT & SERVICE) */}
                                            <div className="md:col-span-3">
                                                {isCatalogItem ? (
                                                    <FormField
                                                        control={form.control}
                                                        name={`items.${index}.productId`}
                                                        render={({ field }) => {
                                                            const filteredOptions = optionsForType.filter((opt) =>
                                                                opt.name.toLowerCase().includes(itemState.productSearchQuery.toLowerCase())
                                                            );

                                                            return (
                                                                <FormItem className="w-full">
                                                                    <FormLabel>{itemType === "PRODUCT" ? "Produk" : "Jasa"}</FormLabel>
                                                                    <div className="flex items-center gap-2 w-full">

                                                                        {["PRODUCT", "SERVICE"].includes(itemType ?? "") && (
                                                                            <ProductCreateDialog
                                                                                createEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/api/master/product/createProduct`}
                                                                                onCreated={async (created) => {
                                                                                    const newProduct = {
                                                                                        id: created.id,
                                                                                        name: created.name,
                                                                                    };
                                                                                    updateItemState(index, {
                                                                                        productOptions: [...optionsForType, newProduct],
                                                                                    });

                                                                                    handleProductSelect(index, created.id);
                                                                                    updateItemState(index, { productSearchOpen: false });
                                                                                }}
                                                                            />
                                                                        )}

                                                                        <Popover
                                                                            open={itemState.productSearchOpen}
                                                                            onOpenChange={(open) =>
                                                                                updateItemState(index, {
                                                                                    productSearchOpen: open,
                                                                                    productSearchQuery: open ? "" : itemState.productSearchQuery,
                                                                                })
                                                                            }
                                                                        >
                                                                            <PopoverTrigger asChild>
                                                                                <FormControl>
                                                                                    <Button
                                                                                        variant="outline"
                                                                                        role="combobox"
                                                                                        className="w-full justify-between overflow-hidden text-ellipsis whitespace-nowrap"
                                                                                    >
                                                                                        {field.value
                                                                                            ? (
                                                                                                <span className="truncate max-w-[85%]">
                                                                                                    {optionsForType.find((opt) => opt.id === field.value)?.name}
                                                                                                </span>
                                                                                            )
                                                                                            : `Pilih ${itemType === "PRODUCT" ? "produk" : "service / jasa"}`}
                                                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                                    </Button>
                                                                                </FormControl>
                                                                            </PopoverTrigger>

                                                                            <PopoverContent className="w-[90vw] sm:w-80 p-0">
                                                                                <Command>
                                                                                    <div className="flex items-center border-b px-3">
                                                                                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                                                        <CommandInput
                                                                                            placeholder={`Cari ${itemType === "PRODUCT" ? "produk" : "jasa"}...`}
                                                                                            value={itemState.productSearchQuery}
                                                                                            onValueChange={(value) =>
                                                                                                updateItemState(index, { productSearchQuery: value })
                                                                                            }
                                                                                        />
                                                                                    </div>

                                                                                    <CommandList>
                                                                                        <CommandEmpty>
                                                                                            <div className="p-4 text-center">
                                                                                                <p className="text-sm text-muted-foreground mb-3">
                                                                                                    {itemState.productSearchQuery
                                                                                                        ? `"${itemState.productSearchQuery}" tidak ditemukan`
                                                                                                        : "Tidak ada data"}
                                                                                                </p>
                                                                                                {itemState.productSearchQuery && (
                                                                                                    <ProductCreateDialog
                                                                                                        createEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/api/master/product/createProduct`}
                                                                                                        onCreated={async (created) => {
                                                                                                            const newProduct = {
                                                                                                                id: created.id,
                                                                                                                name: created.name,
                                                                                                            };
                                                                                                            updateItemState(index, {
                                                                                                                productOptions: [...optionsForType, newProduct],
                                                                                                            });
                                                                                                            handleProductSelect(index, created.id);
                                                                                                            updateItemState(index, {
                                                                                                                productSearchOpen: false,
                                                                                                                productSearchQuery: ""
                                                                                                            });
                                                                                                        }}
                                                                                                        trigger={
                                                                                                            <Button
                                                                                                                type="button"
                                                                                                                variant="outline"
                                                                                                                size="sm"
                                                                                                                className="w-full"
                                                                                                            >
                                                                                                                <Plus className="h-4 w-4 mr-2" />
                                                                                                                Tambah Produk Baru
                                                                                                            </Button>
                                                                                                        }
                                                                                                    />
                                                                                                )}
                                                                                            </div>
                                                                                        </CommandEmpty>
                                                                                        <CommandGroup>
                                                                                            {filteredOptions.map((opt) => (
                                                                                                <CommandItem
                                                                                                    key={opt.id}
                                                                                                    value={opt.name}
                                                                                                    onSelect={() => {
                                                                                                        field.onChange(opt.id);
                                                                                                        handleProductSelect(index, opt.id);
                                                                                                        updateItemState(index, {
                                                                                                            productSearchOpen: false,
                                                                                                            productSearchQuery: "",
                                                                                                        });
                                                                                                    }}
                                                                                                >
                                                                                                    <Check
                                                                                                        className={cn(
                                                                                                            "mr-2 h-4 w-4",
                                                                                                            field.value === opt.id ? "opacity-100" : "opacity-0"
                                                                                                        )}
                                                                                                    />

                                                                                                    {/* ✅ pastikan nama panjang tidak overflow */}
                                                                                                    <span className="truncate">{opt.name}</span>
                                                                                                </CommandItem>
                                                                                            ))}
                                                                                        </CommandGroup>
                                                                                    </CommandList>
                                                                                </Command>
                                                                            </PopoverContent>
                                                                        </Popover>

                                                                    </div>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            );
                                                        }}
                                                    />
                                                ) : (
                                                    <FormField
                                                        control={form.control}
                                                        name={`items.${index}.name`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Nama Item</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="Nama item/jasa..."
                                                                        {...field}
                                                                        value={field.value ?? ""}
                                                                        className="w-full truncate"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                )}
                                            </div>


                                            <div className="md:col-span-1 md:col-start-7">
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.qty`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Quantity</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                    <Input
                                                                        type="number"
                                                                        step="0.0001"
                                                                        min="0"
                                                                        placeholder="1.0000"
                                                                        className="pl-9"
                                                                        value={field.value}
                                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                                    />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="md:col-span-1">
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.uom`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>UOM</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    placeholder="Pcs, Lot, Kg, Ltr, etc."
                                                                    value={field.value ?? ""}
                                                                    onChange={(e) => field.onChange(e.target.value || null)}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Kolom Harga Satuan - Hanya tampil untuk admin dan super */}
                                            {canSeePrice ? (
                                                <>
                                                    <div className="md:col-span-2">
                                                        <FormField
                                                            control={form.control}
                                                            name={`items.${index}.unitPrice`}
                                                            render={({ field }) => {
                                                                return (
                                                                    <FormItem>
                                                                        <div className="flex items-center justify-between">
                                                                            <FormLabel>Harga Satuan</FormLabel>
                                                                        </div>
                                                                        <FormControl>
                                                                            <div className="relative">
                                                                                <span
                                                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-xs md:text-sm text-muted-foreground"
                                                                                    aria-hidden="true"
                                                                                >
                                                                                    Rp
                                                                                </span>
                                                                                <Input
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    min="0"
                                                                                    placeholder="0.00"
                                                                                    className="pl-10"
                                                                                    value={field.value}
                                                                                    onChange={(e) =>
                                                                                        field.onChange(parseFloat(e.target.value) || 0)
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                );
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="md:col-span-1">
                                                        <FormField
                                                            control={form.control}
                                                            name={`items.${index}.discount`}
                                                            render={({ field }) => {
                                                                return (
                                                                    <FormItem>
                                                                        <div className="flex items-center justify-between">
                                                                            <FormLabel className="flex items-center justify-between">
                                                                                <span>Diskon (%)</span>
                                                                            </FormLabel>
                                                                        </div>
                                                                        <FormControl>
                                                                            <div className="relative">
                                                                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                                <Input
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    min="0"
                                                                                    max="100"
                                                                                    placeholder="0.00"
                                                                                    className="pl-9"
                                                                                    value={field.value}
                                                                                    onChange={(e) =>
                                                                                        field.onChange(parseFloat(e.target.value) || 0)
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                );
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="md:col-span-1">
                                                        <FormField
                                                            control={form.control}
                                                            name={`items.${index}.taxRate`}
                                                            render={({ field }) => {
                                                                return (
                                                                    <FormItem>
                                                                        <FormLabel className="flex items-center justify-between">
                                                                            <span>Pajak (%)</span>
                                                                        </FormLabel>
                                                                        <FormControl>
                                                                            <div className="relative w-5/6">
                                                                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                                <Input
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    min="0"
                                                                                    placeholder="0.00"
                                                                                    className="pl-9"
                                                                                    value={field.value}
                                                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                                                />
                                                                            </div>
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                );
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2 pt-0.5 flex flex-col items-center">
                                                        <FormLabel className="mb-1 text-center text-green-600 font-bold">
                                                            Total
                                                        </FormLabel>
                                                        <div className="flex items-center h-10 px-3 rounded-md border bg-background font-medium">
                                                            <Calculator className="h-4 w-4 mr-2 text-muted-foreground" />
                                                            {calculateItemTotal(index)}
                                                        </div>
                                                    </div>
                                                    <div className="md:col-span-1 md:col-start-15 pt-6">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-white-600 hover:text-red-400 shadow-sm transition-colors"
                                                            onClick={() => {
                                                                remove(index);
                                                                removeItemState(index);
                                                            }}
                                                            disabled={fields.length <= 1}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2 text-red-400" />
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                // Untuk role selain admin/super, sembunyikan kolom harga dan tampilkan placeholder
                                                <div className="md:col-span-6 flex items-center justify-center">
                                                    <div className="text-center text-muted-foreground" hidden>
                                                        <EyeOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                        <p className="text-xs md:text-sm">Informasi harga hanya tersedia untuk admin</p>
                                                    </div>
                                                    <div className="pt-6">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-white-600 hover:text-red-400 shadow-sm transition-colors"
                                                            onClick={() => {
                                                                remove(index);
                                                                removeItemState(index);
                                                            }}
                                                            disabled={fields.length <= 1}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2 text-red-400" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Deskripsi untuk CUSTOM items */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                            <div className={`md:col-span-3 md:col-start-3 ${itemType !== "CUSTOM" ? "hidden" : ""}`}>
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
                                                                    value={field.value ?? ""}
                                                                    onChange={(e) => field.onChange(e.target.value || undefined)}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            {form.formState.errors.items?.message && (
                                <p className="text-xs md:text-sm font-medium text-destructive">
                                    {form.formState.errors.items.message}
                                </p>
                            )}
                        </CardContent>

                        <div className="flex items-center justify-end pt-1 pr-6">
                            <Button
                                type="button"
                                size="sm"
                                className="relative overflow-hidden rounded-lg px-3 py-2 font-medium shadow-md transition-all duration-300 
             bg-gradient-to-r from-sky-400 to-cyan-500 text-white hover:from-sky-500 hover:to-cyan-600
             dark:from-emerald-400 dark:to-lime-500 dark:hover:from-emerald-500 dark:hover:to-lime-600
             focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 dark:focus:ring-lime-400"
                                onClick={async () => {
                                    const newIndex = fields.length;
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

                                    // Tambah state untuk item baru
                                    addNewItemState();

                                    // Fetch products untuk item baru
                                    await fetchProductsForItem(newIndex, "PRODUCT");

                                    if (window.innerWidth >= 768) {
                                        setTimeout(scrollToBottom, 100);
                                    }

                                    setTimeout(() => {
                                        itemTypeRefs.current[newIndex]?.focus();
                                    }, 200);
                                }}
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Tambah Item
                            </Button>
                        </div>
                        <div ref={itemsEndRef} />
                    </Card>

                    {/* Action Buttons */}
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
        <div className="w-full mx-auto space-y-6">
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