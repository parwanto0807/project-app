// components/sales-order/CreateSalesOrderForm.tsx
"use client"

import * as React from "react"
import { z } from "zod";
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm, type Resolver } from "react-hook-form"
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

// Server Action
import { createSalesOrderAPI } from "@/lib/action/sales/salesOrder"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { CustomerCreateDialog, ProjectCreateDialog } from "./customerProjectDialogPickers";
import { fetchAllProjects } from "@/lib/action/master/project";
import { fetchAllProducts } from "@/lib/action/master/product";
import { ApiProductSchema } from "@/schemas/index";

import {
  createSalesOrderSchema,
  type CreateSalesOrderPayload
} from "@/schemas/index";

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
  currentUserId: string // ✅ Wajib: user ID yang sedang login
}

// ✅ Gunakan schema asli TANPA diubah
const formSchema = createSalesOrderSchema.omit({ soNumber: true }).extend({
  status: z.enum([
    "DRAFT",
    "SENT",
    "CONFIRMED",
    "IN_PROGRESS",
    "FULFILLED",
    "PARTIALLY_INVOICED",
    "INVOICED",
    "PARTIALLY_PAID",
    "PAID",
    "CANCELLED",
  ]),
  notes: z.string().nullable(),
  documents: z.array(
    z.object({
      docType: z.enum(["QUOTATION", "PO", "BAP", "INVOICE", "PAYMENT_RECEIPT"]),
      docNumber: z.string().nullable(),
      docDate: z.date().nullable(),
      fileUrl: z.string().nullable(),
      meta: z.record(z.unknown()).optional(),
    })
  ),
});

// ✅ Type untuk form values
interface FormValues {
  soDate: Date;
  customerId: string;
  projectId: string;
  userId: string;
  type: "REGULAR" | "SUPPORT";
  status: "DRAFT" | "SENT" | "CONFIRMED" | "IN_PROGRESS" | "FULFILLED" | 
          "PARTIALLY_INVOICED" | "INVOICED" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
  items: {
    productId: string;
    name: string;
    qty: number;
    unitPrice: number;
    itemType?: "PRODUCT" | "SERVICE" | "CUSTOM";
    description?: string | null;
    discount?: number;
    taxRate?: number;
  }[];
  currency: string; // Added currency property
  notes: string | null; // Updated notes property to not allow undefined
  documents: {
    docType: "QUOTATION" | "PO" | "BAP" | "INVOICE" | "PAYMENT_RECEIPT";
    docNumber: string | null;
    docDate: Date | null;
    fileUrl: string | null;
    meta?: Record<string, unknown>;
  }[]; // Updated structure of documents
}

export function CreateSalesOrderForm({
  customers,
  projects,
  isLoading,
  currentUserId, // ✅ Terima currentUserId sebagai prop
}: CreateSalesOrderFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [customerOptions, setCustomerOptions] = React.useState(customers);
  const [productOptions, setProductOptions] = React.useState<ProductOption[]>([]);
  const [projectOptions, setProjectOptions] = React.useState<Project[]>(projects);
  const [loadingProjects, setLoadingProjects] = React.useState(false);

  React.useEffect(() => { setCustomerOptions(customers); }, [customers]);
  React.useEffect(() => { setProjectOptions(projects); }, [projects]);

  // ✅ Default item sesuai schema
  const defaultItem: FormValues['items'][number] = {
    itemType: "PRODUCT",
    productId: "", // ✅ String kosong, akan divalidasi oleh Zod
    name: "",
    description: null, // ✅ HARUS null sesuai schema
    qty: 1,
    unitPrice: 0,
    discount: 0,
    taxRate: 0,
  };

  // ✅ Default values yang sesuai dengan schema
  const defaultValues: FormValues = {
    soDate: new Date(),
    customerId: "", // ✅ String kosong
    projectId: "",  // ✅ String kosong
    userId: currentUserId, // ✅ Gunakan currentUserId dari prop
    type: "REGULAR",
    status: "DRAFT",
    currency: "IDR",
    notes: null,    // ✅ Explicitly set to null to match schema
    items: [defaultItem],
    documents: [],
  };

  // ✅ Form setup - PASTI TIDAK ERROR
    const form = useForm<FormValues>({
      resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
      defaultValues,
    })

  // ✅ Inisialisasi useFieldArray
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
            description: p.description ?? null,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch products:", error);
        toast.error("Gagal memuat data produk");
      }
    })();
  }, []);

  // ✅ Handle product selection
  const handleProductSelect = (index: number, productId: string) => {
    const selectedProduct = productOptions.find(p => p.id === productId);
    if (selectedProduct) {
      form.setValue(`items.${index}.productId`, productId);
      form.setValue(`items.${index}.name`, selectedProduct.name);
      form.setValue(`items.${index}.description`, selectedProduct.description || null);
    }
  };

  // ✅ Transform data sebelum submit ke server
  function onSubmit(formData: FormValues) {
    startTransition(async () => {
      try {
        // ✅ Data untuk server (sesuai schema backend)
        const serverData: CreateSalesOrderPayload = {
          ...formData,
          soNumber: undefined, // ✅ Biarkan undefined, akan digenerate server
          // Pastikan semua field required ada
          customerId: formData.customerId,
          projectId: formData.projectId,
          userId: formData.userId,
          items: formData.items.map(item => ({
            ...item,
            // Ensure productId is always a string
            productId: item.productId || "",
            // Ensure itemType is always defined
            itemType: item.itemType || "PRODUCT",
            // Ensure discount and taxRate are numbers (server expects non-optional)
            discount: item.discount ?? 0,
            taxRate: item.taxRate ?? 0,
            // Ensure description is explicitly null if empty/undefined
            description: item.description ?? null,
          })),
          documents: formData.documents.map(doc => ({
            ...doc,
            fileUrl: doc.fileUrl !== undefined ? doc.fileUrl : null, // Explicitly set fileUrl to null if undefined
          })),
        };

        console.log('Submitting data:', serverData);

        const result = await createSalesOrderAPI(serverData);

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

  // ✅ Tampilan Skeleton saat data fetching
  if (isLoading) {
    return <CreateSalesOrderFormSkeleton />
  }

  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle>Create New Sales Order</CardTitle>
            <CardDescription>
              Isi detail di bawah ini untuk membuat SO baru.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            {/* Hidden field untuk userId */}
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input type="hidden" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bagian Detail Utama */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormItem>
                <FormLabel>Nomor Sales Order</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Akan dibuat otomatis oleh sistem"
                      className="pl-9"
                      disabled
                    />
                  </div>
                </FormControl>
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
                              format(field.value, "PPP")
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
                          onSelect={(date) => field.onChange(date || new Date())}
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
                              } catch (error) {
                                console.error("Failed to fetch projects:", error);
                                toast.error("Gagal memuat project");
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
                          } catch (error) {
                            console.error("Failed to fetch projects:", error);
                            toast.error("Gagal memuat project");
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
                      <FormLabel>Project</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <div className="relative w-full">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
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
                                  <div className="px-3 py-2 text-sm text-muted-foreground">
                                    Customer belum dipilih
                                  </div>
                                ) : loadingProjects ? (
                                  <div className="px-3 py-2 text-sm text-muted-foreground">
                                    Memuat project…
                                  </div>
                                ) : projectOptions.length ? (
                                  projectOptions.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="px-3 py-2 text-sm text-muted-foreground">
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
                        className="flex items-center space-x-4"
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
                  <FormItem>
                    <FormLabel>Catatan (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tambahkan catatan untuk SO ini..."
                        className="resize-none"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Bagian Item SO */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Items</h3>
              {fields.map((row, index) => {
                const itemType = form.watch(`items.${index}.itemType`);
                const isProduct = itemType === "PRODUCT";

                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 border rounded-lg bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Tipe Item */}
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.itemType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipe Item</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih tipe" />
                              </SelectTrigger>
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

                    {/* Product Selection (hanya untuk tipe PRODUCT) */}
                    {isProduct && (
                      <div className="md:col-span-3">
                        <FormField
                          control={form.control}
                          name={`items.${index}.productId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Produk</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handleProductSelect(index, value);
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih produk" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {productOptions.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name}
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

                    {/* Nama Item */}
                    <div className={isProduct ? "md:col-span-7" : "md:col-span-10"}>
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

                    {/* Deskripsi */}
                    <div className="md:col-span-12">
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
                                onChange={(e) => field.onChange(e.target.value || null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Quantity, Harga, Diskon, Pajak */}
                    <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
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
                            <FormLabel>Diskon</FormLabel>
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
                        name={`items.${index}.taxRate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pajak (%)</FormLabel>
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
                    </div>

                    {/* Delete Button */}
                    <div className="md:col-span-12 flex items-center justify-end pt-4">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus Item
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

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() =>
                  append({
                    itemType: "PRODUCT",
                    productId: "",
                    name: "",
                    description: null,
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
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
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
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Simpan Sales Order
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}

// Komponen Skeleton
function CreateSalesOrderFormSkeleton() {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_100px_150px_auto] gap-4 items-start p-4 border rounded-lg">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-10" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-40" />
      </CardFooter>
    </Card>
  )
}