// components/sales-order/CreateSalesOrderForm.tsx
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
  PlusCircle,
  Trash2,
  Calculator,
  Percent,
  Package,
  ChevronsUpDown,
  Search,
  Check,
  Loader2,
  Save,
  EyeOff,
} from "lucide-react"
import { toast } from "sonner"

// Server Action
import { createSalesOrderAPI } from "@/lib/action/sales/salesOrder"

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
import { CustomerCreateDialog, ProjectCreateDialog } from "./customerProjectDialogPickers";
import { fetchAllProjects } from "@/lib/action/master/project";
import { fetchAllProductsByType } from "@/lib/action/master/product";
import {
  ApiProductSchema,
  OrderStatusEnum,
  OrderTypeEnum,
  salesOrderDocumentSchema,
  salesOrderItemSchema,
} from "@/schemas/index";
import { ensureFreshToken } from "@/lib/http";
import { ProductCreateDialog } from "./productDialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

type ApiProduct = z.infer<typeof ApiProductSchema>;
type ProductOption = ApiProduct

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

interface CreateSalesOrderFormProps {
  customers: Customer[]
  isLoading?: boolean
  user?: { id: string }
  role: string
  projects: Project[]
}


// Interface untuk state per item
interface ItemState {
  selectedApiType: "PRODUCT" | "SERVICE" | "CUSTOM" | undefined;
  productOptions: ProductOption[];
  productSearchOpen: boolean;
  productSearchQuery: string;
}

const salesOrderFormSchema = z.object({
  soDate: z.coerce.date({ required_error: "Tanggal wajib diisi." }),
  customerId: z.string().min(1, "Customer wajib dipilih."),
  projectId: z.string().min(1, "Project wajib dipilih."),
  userId: z.string().min(1, "User wajib dipilih."),
  type: OrderTypeEnum,
  status: OrderStatusEnum.default("DRAFT"),
  currency: z.string().default("IDR"),
  notes: z.string().optional().nullable(),
  items: z.array(salesOrderItemSchema).min(1, "Minimal harus ada satu item."),
  documents: z.array(salesOrderDocumentSchema).optional(),
  isTaxInclusive: z.boolean().optional().default(false),
});

type CreateSalesOrderPayload = z.infer<typeof salesOrderFormSchema>;

function getBasePath(role?: string) {
  return role === "super"
    ? "/super-admin-area/sales/saleOrder"
    : "/admin-area/sales/salesOrder"
}

// Fungsi untuk mengecek apakah role memiliki akses harga
const hasPriceAccess = (role: string) => {
  return role === "admin" || role === "super";
}

export function CreateSalesOrderForm({
  customers,
  role,
  projects,
  isLoading,
  user,
}: CreateSalesOrderFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [customerOptions, setCustomerOptions] = React.useState(customers);
  const [projectOptions, setProjectOptions] = React.useState<Project[]>(projects);
  const [loadingProjects, setLoadingProjects] = React.useState(false);
  const [projectSearchOpen, setProjectSearchOpen] = React.useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = React.useState("");
  const itemsEndRef = React.useRef<HTMLDivElement | null>(null);
  const itemTypeRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  // State per item menggunakan array
  const [itemsState, setItemsState] = React.useState<ItemState[]>([{
    selectedApiType: "PRODUCT",
    productOptions: [],
    productSearchOpen: false,
    productSearchQuery: "",
  }]);

  const scrollToBottom = () => {
    itemsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => { setCustomerOptions(customers); }, [customers]);
  React.useEffect(() => { setProjectOptions(projects); }, [projects]);

  const form = useForm({
    resolver: zodResolver(salesOrderFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      soDate: new Date(),
      customerId: "",
      projectId: "",
      userId: user?.id ?? "",
      type: "REGULAR",
      status: "DRAFT",
      currency: "IDR",
      notes: null,
      isTaxInclusive: false,
      items: [
        {
          itemType: "PRODUCT",
          productId: null,
          name: "",
          description: null,
          uom: null,
          qty: 1,
          unitPrice: 0, // Default 0 diperbolehkan
          discount: 0,
          taxRate: 0,
        },
      ],
      documents: [],
    },
  });

  // Inisialisasi useFieldArray
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

  React.useEffect(() => {
    const onFocus = () => { ensureFreshToken(); };
    const onVis = () => { if (!document.hidden) ensureFreshToken(); };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    const id = setInterval(onFocus, 60_000); // tiap 60s cek ringan (opsional)

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(id);
    };
  }, []);

  // Fungsi untuk menghapus state item
  const removeItemState = (index: number) => {
    setItemsState(prev => prev.filter((_, i) => i !== index));
  };

  // Fetch products untuk item tertentu
  const fetchProductsForItem = React.useCallback(async (index: number, type: "PRODUCT" | "SERVICE" | "CUSTOM" | undefined) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetchAllProductsByType(accessToken ?? undefined, type);

      // Cek jika response success dan data tersedia
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch products");
      }

      setItemsState(prev => {
        const newState = [...prev];
        newState[index] = {
          ...newState[index],
          productOptions: response.data.map((p: ProductOption) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            usageUnit: p.usageUnit ?? null,
          }))
        };
        return newState;
      });
    } catch (error) {
      console.error(`Failed to fetch products for item ${index}:`, error);
      toast.error("Gagal memuat data produk");
    }
  }, []);

  // Fetch products untuk item pertama saat mount
  React.useEffect(() => {
    fetchProductsForItem(0, "PRODUCT");
  }, [fetchProductsForItem]);

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

  // TAMBAHKAN fungsi untuk handle product selection
  const handleProductSelect = React.useCallback((index: number, productId: string) => {
    const selectedProduct = itemsState[index]?.productOptions.find(p => p.id === productId);
    if (!selectedProduct) return;

    const uomValue = selectedProduct.usageUnit ?? "";

    form.setValue(`items.${index}.productId`, productId, { shouldDirty: true, shouldTouch: true });
    form.setValue(`items.${index}.name`, selectedProduct.name ?? "", { shouldDirty: true, shouldTouch: true });
    form.setValue(`items.${index}.description`, selectedProduct.description ?? "", { shouldDirty: true, shouldTouch: true });
    form.setValue(`items.${index}.uom`, uomValue, { shouldDirty: true, shouldTouch: true });
  }, [form, itemsState]);

  function onSubmit(data: CreateSalesOrderPayload) {
    startTransition(async () => {
      try {
        // Validasi tambahan: pastikan semua item memiliki unitPrice >= 0
        const hasInvalidPrice = data.items.some(item => item.unitPrice < 0);
        if (hasInvalidPrice) {
          toast.error("Terjadi Kesalahan", { description: "Harga satuan tidak boleh negatif." });
          return;
        }

        const result = await createSalesOrderAPI(data);

        if (result.error) {
          toast.error("Terjadi Kesalahan", { description: result.error });
        } else if (result.success) {
          toast.success("Sukses!", { description: "Sales Order baru berhasil dibuat." });
          const basePath = getBasePath(role)
          router.push(basePath)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Gagal membuat Sales Order.";
        toast.error("Terjadi Kesalahan", { description: errorMessage });
      }
    });
  }

  // Tampilan Skeleton saat data fetching
  if (isLoading) {
    return <CreateSalesOrderFormSkeleton />
  }

  const canSeePrice = hasPriceAccess(role);

  return (
    <div className="w-full mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50">
          <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Buat Sales Order Baru</h1>
          <p className="text-muted-foreground">
            Isi detail di bawah ini untuk membuat SO baru.
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
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-5 bg-gradient-to-r from-primary/5 to-blue-100 dark:from-slate-800 dark:to-slate-900 space-y-3 p-2 m-2 rounded-xl">
              {/* Nomor SO & Tanggal */}
              <div className="grid grid-cols-1 gap-4 md:col-span-2 md:grid-cols-2 ">
                <div>
                  <FormItem>
                    <FormLabel>Nomor Sales Order</FormLabel>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Akan dibuat otomatis oleh sistem"
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
                              onSelect={(d) =>
                                field.onChange(d ?? field.value ?? new Date())
                              }
                              disabled={(date) =>
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
                    // pastikan FormItem punya min-w-0 agar flex children bisa mengecil
                    <FormItem className="min-w-0">
                      <FormLabel>Customer</FormLabel>

                      {/* Parent flex harus min-w-0 dan w-full */}
                      <div className="flex gap-2 min-w-0 w-full items-stretch">
                        <CustomerCreateDialog
                          createEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/api/master/customer/createCustomer`}
                          onCreated={async (created) => {
                            setCustomerOptions((prev) => [created, ...prev]);
                            field.onChange(created.id);
                            form.setValue("projectId", "");
                            setLoadingProjects(true);
                            try {
                              const response = await fetchAllProjects({ customerId: created.id });
                              setProjectOptions(
                                response.data.map((p: { id: string; name: string }) => ({
                                  id: p.id,
                                  name: p.name,
                                }))
                              );
                            } finally {
                              setLoadingProjects(false);
                            }
                          }}
                        />

                        {/* Wrapper yang relative + flex-1 + min-w-0 */}
                        <FormControl>
                          <div className="relative flex-1 min-w-0">
                            {/* Icon absolute di wrapper */}
                            <Building
                              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                            />

                            <Select
                              value={field.value}
                              onValueChange={async (id) => {
                                field.onChange(id);
                                form.setValue("projectId", "");
                                setLoadingProjects(true);
                                try {
                                  const response = await fetchAllProjects({ customerId: id });
                                  setProjectOptions(
                                    response.data.map((p: { id: string; name: string }) => ({
                                      id: p.id,
                                      name: p.name,
                                    }))
                                  );
                                } finally {
                                  setLoadingProjects(false);
                                }
                              }}
                            >
                              {/* Trigger full width; pl-9 untuk ruang icon */}
                              <SelectTrigger className="w-full pl-9">
                                {/* SelectValue harus menerima truncate */}
                                <SelectValue className="block truncate" placeholder="Pilih customer..." />
                              </SelectTrigger>

                              <SelectContent>
                                {customerOptions.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.name} {c.branch ? `(${c.branch})` : ""}
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
                        <div className="flex gap-2">
                          <ProjectCreateDialog
                            createEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/api/salesOrder/project/create`}
                            customerId={selectedCustomerId}
                            onCreated={(created) => {
                              setProjectOptions((prev) => [created, ...prev]);
                              form.setValue("projectId", created.id);
                            }}
                          />
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
                                    <span className="truncate">
                                      {field.value
                                        ? projectOptions.find(
                                          (project) => project.id === field.value
                                        )?.name
                                        : !selectedCustomerId
                                          ? "Pilih customer dulu"
                                          : loadingProjects
                                            ? "Memuat project…"
                                            : "Pilih project..."}
                                    </span>
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


          { /* Bagian Item SO */}
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
                  <div className="flex items-center gap-2 text-sm text-muted-foreground" hidden>
                    <EyeOff className="h-4 w-4" />
                    <span>Informasi harga disembunyikan</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="bg-gradient-to-r from-primary/5 to-blue-100 dark:from-slate-800 dark:to-slate-900 space-y-2 p-2 m-0 rounded-xl">
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
                    className="flex flex-col gap-4 p-2 border rounded-lg bg-muted/30"
                    aria-label={`Item ${index + 1}`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-14 gap-4">
                      <div className="grid gap-1">
                        {/* Label tipe item */}
                        <span className="text-xs text-muted-foreground">
                          {isProduct ? "Product" : itemType === "SERVICE" ? "Service" : "Custom"}
                        </span>
                        {/* 🔢 Item Number Badge */}
                        <span
                          className={`inline-flex h-7 items-center rounded px-3 text-sm font-semibold ${badgeColor}`}
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
                          // === PRODUCT & SERVICE ===
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
                                  <div className="flex items-center gap-4 min-w-0 w-full">
                                    {["PRODUCT", "SERVICE"].includes(itemType ?? "") && (
                                      <ProductCreateDialog
                                        createEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/api/master/product/createProduct`}
                                        onCreated={(created) => {
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
                                            className="flex-1 overflow-hidden truncate text-left justify-between"
                                          >

                                            <span className="truncate block">
                                              {field.value
                                                ? optionsForType.find((opt) => opt.id === field.value)?.name
                                                : `Pilih ${itemType === "PRODUCT" ? "produk" : "service / jasa"}`}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                          </Button>
                                        </FormControl>
                                      </PopoverTrigger>

                                      <PopoverContent className="w-full p-0">
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
                                              {itemState.productSearchQuery
                                                ? "Tidak ditemukan"
                                                : "Tidak ada data"}
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
                                                      field.value === opt.id
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                    )}
                                                  />
                                                  {opt.name}
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
                          // === CUSTOM ===
                          <FormField
                            control={form.control}
                            name={`items.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nama Item</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nama item/jasa..." {...field} value={field.value ?? ""} />
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
                                      <span className="text-sm text-muted-foreground">
                                        {/* {formattedPrice !== "" ? formattedPrice : "Rp 0"} */}
                                      </span>
                                    </div>
                                    <FormControl>
                                      <div className="relative">
                                        <span
                                          className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
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
                            <p className="text-sm">Informasi harga hanya tersedia untuk admin</p>
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

                    {/* Quantity, Harga, Diskon, Pajak */}
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

                      {/* Delete Button */}
                      {/* {canSeePrice ? (
                        <div className="md:col-span-1 md:col-start-12 pt-5">
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
                            Hapus
                          </Button>
                        </div>
                      ) : (
                        <div className="md:col-span-1 md:col-start-12 pt-5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-white-600 hover:text-red-400 shadow-sm transition-colors"
                            hidden
                            onClick={() => {
                              remove(index);
                              removeItemState(index);
                            }}
                            disabled={fields.length <= 1}
                          >
                            <Trash2 className="h-4 w-4 mr-2 text-red-400" />
                          </Button>
                        </div>
                      )} */}
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
                    unitPrice: 0, // Tetap set ke 0 meskipun disembunyikan
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
              disabled={isPending || !form.watch("customerId")}
              className="min-w-40"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Simpan Sales Order
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

// Komponen Skeleton
function CreateSalesOrderFormSkeleton() {
  return (
    <div className="w-full md:max-w-5/6 mx-auto space-y-6">
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