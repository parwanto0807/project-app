"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// ===== Shared Types =====
export type Option = { id: string; name: string };

type BaseProps = {
    onCreated: (option: Option) => void; // Called on successful creation
    createEndpoint: string;
};

// NOTE: ProductType enum values are assumed from your schema comment.
// Adjust this array to match your actual Prisma enum.
const productTypes = ["Material", "Jasa", "Alat"] as const;

// ===== Create Schema for Product =====
const productSchema = z.object({
  code: z.string().trim().min(1, "Kode produk wajib diisi"),
  name: z.string().trim().min(2, "Nama produk minimal 2 karakter"),
  description: z.string().optional(),
  type: z.enum(productTypes, {
    required_error: "Tipe produk wajib dipilih",
  }),
  purchaseUnit: z.string().trim().min(1, "Satuan pembelian wajib diisi"),
  storageUnit: z.string().trim().min(1, "Satuan penyimpanan wajib diisi"),
  usageUnit: z.string().trim().min(1, "Satuan penggunaan wajib diisi"),

  // FIX: Add a default value to ensure the type is always 'number'
  conversionToStorage: z.coerce
    .number({ invalid_type_error: "Harus berupa angka" })
    .min(0, "Nilai tidak boleh negatif")
    .default(1), // 👈 FIX IS HERE

  // FIX: Add a default value here as well
  conversionToUsage: z.coerce
    .number({ invalid_type_error: "Harus berupa angka" })
    .min(0, "Nilai tidak boleh negatif")
    .default(1), // 👈 FIX IS HERE

  // FIX: And here, to ensure the type is always 'boolean'
  isConsumable: z.boolean().default(true), // 👈 FIX IS HERE
});

// ======================================================
// ============== Product Create Dialog =================
// ======================================================
export function ProductCreateDialog({ onCreated, createEndpoint }: BaseProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [pending, setPending] = useState(false);

    const form = useForm<z.input<typeof productSchema>>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            code: "",
            name: "",
            description: "",
            purchaseUnit: "",
            storageUnit: "",
            usageUnit: "",
            conversionToStorage: 1,
            conversionToUsage: 1,
            isConsumable: true,   // HARUS boolean, TIDAK undefined
        },
    });

    const submit = async (data: z.input<typeof productSchema>) => {
        setPending(true);
        try {
            const res = await fetch(createEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.message || "Gagal membuat produk");

            const created = { id: json.id, name: json.name } as Option;
            toast.success("Produk dibuat", { description: created.name });
            onCreated(created);
            setDialogOpen(false);
            form.reset();
        } catch (err: unknown) {
            toast.error("Gagal menyimpan", {
                description: err instanceof Error ? err.message : "Terjadi kesalahan",
            });
        } finally {
            setPending(false);
        }
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline">
                    <Plus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Tambah Produk Baru</DialogTitle>
                    <DialogDescription>
                        Isi data produk. Produk yang baru dibuat akan langsung tersedia untuk dipilih.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid max-h-[70vh] gap-4 overflow-y-auto p-1">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="grid gap-1.5">
                            <Label htmlFor="code">Kode Produk (SKU)</Label>
                            <Input id="code" {...form.register("code")} placeholder="e.g., KBL-001" />
                            {form.formState.errors.code && (
                                <p className="text-xs text-red-500">{form.formState.errors.code.message}</p>
                            )}
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="name">Nama Produk</Label>
                            <Input id="name" {...form.register("name")} placeholder="e.g., Kabel UTP Cat 6" />
                            {form.formState.errors.name && (
                                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-1.5">
                        <Label>Tipe Produk</Label>
                        <Controller
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih tipe produk..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {productTypes.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {form.formState.errors.type && (
                            <p className="text-xs text-red-500">{form.formState.errors.type.message}</p>
                        )}
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="description">Deskripsi (Opsional)</Label>
                        <Textarea
                            id="description"
                            rows={2}
                            {...form.register("description")}
                            placeholder="Deskripsi singkat mengenai produk, spesifikasi, dll."
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="purchaseUnit">Satuan Beli</Label>
                            <Input id="purchaseUnit" {...form.register("purchaseUnit")} placeholder="Roll" />
                            {form.formState.errors.purchaseUnit && (
                                <p className="text-xs text-red-500">{form.formState.errors.purchaseUnit.message}</p>
                            )}
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="storageUnit">Satuan Simpan</Label>
                            <Input id="storageUnit" {...form.register("storageUnit")} placeholder="Roll" />
                            {form.formState.errors.storageUnit && (
                                <p className="text-xs text-red-500">{form.formState.errors.storageUnit.message}</p>
                            )}
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="usageUnit">Satuan Pakai</Label>
                            <Input id="usageUnit" {...form.register("usageUnit")} placeholder="Meter" />
                            {form.formState.errors.usageUnit && (
                                <p className="text-xs text-red-500">{form.formState.errors.usageUnit.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="grid gap-1.5">
                            <Label htmlFor="conversionToStorage">Konversi (Beli → Simpan)</Label>
                            <Input
                                id="conversionToStorage"
                                type="number"
                                step="any"
                                {...form.register("conversionToStorage")}
                            />
                            {form.formState.errors.conversionToStorage && (
                                <p className="text-xs text-red-500">{form.formState.errors.conversionToStorage.message}</p>
                            )}
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="conversionToUsage">Konversi (Simpan → Pakai)</Label>
                            <Input
                                id="conversionToUsage"
                                type="number"
                                step="any"
                                {...form.register("conversionToUsage")}
                            />
                            {form.formState.errors.conversionToUsage && (
                                <p className="text-xs text-red-500">{form.formState.errors.conversionToUsage.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Controller
                            control={form.control}
                            name="isConsumable"
                            render={({ field }) => (
                                <Checkbox id="isConsumable" checked={field.value} onCheckedChange={field.onChange} />
                            )}
                        />
                        <Label htmlFor="isConsumable" className="font-normal cursor-pointer">
                            Produk ini habis pakai (consumable)
                        </Label>
                    </div>
                </div>

                <DialogFooter className="mt-4">
                    <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                        Batal
                    </Button>
                    <Button type="button" disabled={pending} onClick={form.handleSubmit(submit)}>
                        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Produk"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}