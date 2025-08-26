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
  Loader2,
  PlusCircle,
  Save,
  Trash2,
  Calculator,
  // DollarSign,
  Percent,
  Package,
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
// import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { CustomerCreateDialog, ProjectCreateDialog } from "./customerProjectDialogPickers";
import { fetchAllProjects } from "@/lib/action/master/project";
import { fetchAllProducts } from "@/lib/action/master/product";
import {
  ApiProductSchema,
  OrderStatusEnum,
  OrderTypeEnum,
  salesOrderDocumentSchema,
  salesOrderItemSchema,
} from "@/schemas/index";
import { ensureFreshToken } from "@/lib/http";

type ApiProduct = z.infer<typeof ApiProductSchema>;
type ProductOption = { id: string; name: string; description?: string | null };

interface Customer {
  id: string
  name: string
  address?: string
}

interface Project {
  id: string
  name: string
}

interface CreateSalesOrderFormProps {
  customers: Customer[]
  projects: Project[]
  isLoading?: boolean
  user?: { id: string }
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

export function CreateSalesOrderForm({
  customers,
  projects,
  isLoading,
  user,
}: CreateSalesOrderFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [customerOptions, setCustomerOptions] = React.useState(customers);
  const [productOptions, setProductOptions] = React.useState<ProductOption[]>([]);
  const [projectOptions, setProjectOptions] = React.useState<Project[]>(projects);
  const [loadingProjects, setLoadingProjects] = React.useState(false);

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
          unitPrice: 0,
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

  React.useEffect(() => {
    (async () => {
      try {
        const { products } = await fetchAllProducts();
        setProductOptions(
          products.map((p: ApiProduct): ProductOption => ({
            id: p.id,
            name: p.name,
            description: p.description ?? undefined,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch products:", error);
        toast.error("Gagal memuat data produk");
      }
    })();
  }, []);

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
  const handleProductSelect = (index: number, productId: string) => {
    const selectedProduct = productOptions.find(p => p.id === productId);
    if (selectedProduct) {
      form.setValue(`items.${index}.productId`, productId);
      form.setValue(`items.${index}.name`, selectedProduct.name);
      form.setValue(`items.${index}.description`, selectedProduct.description || "");
    }
  };
  console.log("Render CreateSalesOrderForm", form.formState.defaultValues);

  function onSubmit(data: CreateSalesOrderPayload) {
    startTransition(async () => {
      try {
        const result = await createSalesOrderAPI(data);

        if (result.error) {
          toast.error("Terjadi Kesalahan", { description: result.error });
        } else if (result.success) {
          toast.success("Sukses!", { description: "Sales Order baru berhasil dibuat." });
          router.push("/super-admin-area/sales/salesOrder");
          router.refresh();
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

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
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
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

              {/* Customer Field */}
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

                      <CustomerCreateDialog
                        createEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/api/master/customer/createCustomer`}
                        onCreated={async (created) => {
                          setCustomerOptions((prev) => [created, ...prev]);
                          field.onChange(created.id);
                          form.setValue("projectId", "");
                          setLoadingProjects(true);
                          try {
                            const { projects } = await fetchAllProjects({ customerId: created.id });
                            setProjectOptions(projects.map((p) => ({ id: p.id, name: p.name })));
                          } finally {
                            setLoadingProjects(false);
                          }
                        }}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Project Field */}
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

                        <ProjectCreateDialog
                          createEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/api/salesOrder/project/create`}
                          customerId={selectedCustomerId}
                          onCreated={(created) => {
                            setProjectOptions((prev) => [created, ...prev]);
                            form.setValue("projectId", created.id);
                          }}
                        />
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

          {/* Bagian Item SO */}
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
                const itemType = form.watch(`items.${index}.itemType`);
                const isProduct = itemType === "PRODUCT";
                const isCatalogItem = ["PRODUCT", "SERVICE"].includes(itemType ?? "");
                const itemNo = String(index + 1).padStart(2, "0"); // ← nomor rapi 2 digit
                const optionsForType =
                  itemType === "SERVICE" ? productOptions /* sementara */ : productOptions;

                const typeColors: Record<string, string> = {
                  PRODUCT: "bg-green-600 text-white shadow-sm",
                  SERVICE: "bg-blue-600 text-white shadow-sm",
                  CUSTOM: "bg-pink-600 text-white shadow-sm",
                };

                const badgeColor = typeColors[itemType ?? "CUSTOM"];

                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-1 gap-4 p-4 border rounded-lg bg-muted/30"
                    aria-label={`Item ${index + 1}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* 🔢 Item Number Badge */}
                        <span
                          className={`inline-flex h-7 items-center rounded px-3 text-sm font-semibold ${badgeColor}`}
                        >
                          Item {itemNo}
                        </span>

                        {/* Label tipe item */}
                        <span className="text-xs text-muted-foreground">
                          {isProduct ? "Product" : itemType === "SERVICE" ? "Service" : "Custom"}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Tipe Item */}
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.itemType`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipe Item</FormLabel>
                              <Select
                                value={field.value ?? "PRODUCT"}
                                onValueChange={(next) => {
                                  field.onChange(next);
                                  // ✅ reset productId HANYA jika bukan PRODUCT & bukan SERVICE (contoh: CUSTOM)
                                  if (!["PRODUCT", "SERVICE"].includes(next)) {
                                    form.setValue(`items.${index}.productId`, null, {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    });
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

                      {/* Pemilihan dari katalog (tampil untuk PRODUCT & SERVICE) */}
                      {isCatalogItem && (
                        <div className="md:col-span-3">
                          <FormField
                            control={form.control}
                            name={`items.${index}.productId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{itemType === "PRODUCT" ? "Produk" : "Jasa"}</FormLabel>
                                <Select
                                  value={field.value ?? undefined}
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    handleProductSelect(index, value); // pastikan fungsi ini bisa menangani SERVICE juga
                                  }}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={`Pilih ${itemType === "PRODUCT" ? "produk" : "jasa"}`} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {/* Jika Anda punya daftar terpisah, ganti ke serviceOptions saat SERVICE */}
                                    {optionsForType.map((opt) => (
                                      <SelectItem key={opt.id} value={opt.id}>
                                        {opt.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {/* Nama Item: span menyesuaikan */}
                      <div className={isCatalogItem ? "md:col-span-7" : "md:col-span-10"}>
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
                      </div>
                    </div>

                    {/* Deskripsi */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deskripsi (Opsional)</FormLabel>
                          <FormControl>
                            <Textarea
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

                    {/* Quantity, Harga, Diskon, Pajak */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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

                      <FormField
                        control={form.control}
                        name={`items.${index}.uom`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UOM</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Pcs, Lot, Kg, Ltr, etc."
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
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </div>
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
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </div>
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
                              <div className="relative">
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
                        )}
                      />

                      <div className="flex flex-col justify-end">
                        <FormLabel>Total</FormLabel>
                        <div className="flex items-center h-10 px-3 rounded-md border bg-background font-medium">
                          <Calculator className="h-4 w-4 mr-2 text-muted-foreground" />
                          {calculateItemTotal(index)}
                        </div>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <div className="flex items-center justify-end pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-white-600 hover:text-red-400 shadow-sm transition-colors"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 mr-2 text-red-400" />
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
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm transition-colors"
                onClick={() =>
                  append({
                    itemType: "PRODUCT",
                    productId: null,
                    name: "",
                    description: "",
                    qty: 1,
                    unitPrice: 0,
                    discount: 0,
                    taxRate: 0,
                  })
                }
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Item
              </Button>
            </div>

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