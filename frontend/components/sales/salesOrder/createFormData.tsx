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
  FolderKanban,
  Hash,
  Loader2,
  PlusCircle,
  Save,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { createSalesOrderSchema } from "@/schemas/index"; // Pastikan path ini sesuai

// 1. Impor Server Action Anda
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

// Tipe untuk data props
interface Customer {
  id: string
  name: string
}

interface Project {
  id: string
  name: string
}

interface CreateSalesOrderFormProps {
  customers: Customer[]
  projects: Project[]
  isLoading?: boolean
}

const formSchema = createSalesOrderSchema.omit({ soNumber: true });
type CreateSalesOrderPayload = z.infer<typeof formSchema>;

export function CreateSalesOrderForm({
  customers,
  projects,
  isLoading,
}: CreateSalesOrderFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<CreateSalesOrderPayload>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // soNumber tidak perlu diisi dari form lagi
      soDate: new Date(),
      customerId: "",
      projectId: "",
      poNumber: "",
      type: "REGULAR",
      items: [{ description: "", qty: 1, unitPrice: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })
  console.log("Submitting Sales Order:", form.getValues());
  // 2. Perbarui fungsi onSubmit untuk memanggil Server Action
  function onSubmit(data: CreateSalesOrderPayload) {

    startTransition(async () => {
      try {
        console.log("Mencoba memanggil Server Action dengan data:", data); // <-- LOG 1
        const result = await createSalesOrderAPI(data);
        console.log("Server Action selesai. Hasil:", result); // <-- LOG 2
        // Periksa hasil dari Server Action
        if (result.error) {
          toast.error("Terjadi Kesalahan", {
            description: result.error,
          });
        } else if (result.success) {
          toast.success("Sukses!", {
            description: "Sales Order baru berhasil dibuat.",
          });
          router.push("/super-admin-area/sales/salesOrder");
          router.refresh();
        }
      } catch (error) {
        // Fallback jika terjadi error yang tidak terduga
        const errorMessage = error instanceof Error
          ? error.message
          : "Gagal membuat Sales Order. Silakan coba lagi.";

        toast.error("Terjadi Kesalahan", {
          description: errorMessage,
        });
      }
    });
  }

    console.log("Form Validation Errors:", form.formState.errors);

  // Tampilan Skeleton saat data fetching
  if (isLoading) {
    return <CreateSalesOrderFormSkeleton />
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
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
                      disabled // Menonaktifkan input
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
                          onSelect={field.onChange}
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <SelectTrigger className="pl-9">
                            <SelectValue placeholder="Pilih customer..." />
                          </SelectTrigger>
                        </div>
                      </FormControl>
                      <SelectContent>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
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
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proyek (Opsional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <div className="relative">
                          <FolderKanban className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <SelectTrigger className="pl-9">
                            <SelectValue placeholder="Pilih proyek terkait..." />
                          </SelectTrigger>
                        </div>
                      </FormControl>
                      <SelectContent>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
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
                name="poNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor PO (Opsional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Contoh: PO-12345"
                          className="pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
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
            </div>

            <Separator />

            {/* Bagian Item SO */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Items</h3>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_100px_150px_auto] gap-4 items-start p-4 border rounded-lg"
                >
                  {/* Deskripsi */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={cn(index !== 0 && "sr-only")}>
                          Deskripsi
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Deskripsi item, jasa, atau produk..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Kuantitas */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.qty`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={cn(index !== 0 && "sr-only")}>
                          Qty
                        </FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Harga Satuan */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={cn(index !== 0 && "sr-only")}>
                          Harga Satuan
                        </FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="100000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Tombol Hapus */}
                  <div className={cn(index !== 0 && "md:pt-8")}>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                      className="mt-2 md:mt-0"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Hapus Item</span>
                    </Button>
                  </div>
                </div>
              ))}
              {/* Pesan error global untuk array item */}
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
                  append({ description: "", qty: 1, unitPrice: 0 })
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
            <Button type="submit" disabled={isPending}>
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