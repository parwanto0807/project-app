"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2, X } from "lucide-react";
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
import { toast } from "sonner";

// ===== Shared Types =====
export type Option = { id: string; name: string };

type BaseProps = {
  onCreated: (option: Option) => void; // dipanggil kalau sukses create
  createEndpoint: string;
};

// ===== Create Schemas =====
const customerSchema = z.object({
  name: z.string().min(2, "Minimal 2 karakter"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  notes: z.string().optional(),
});

export const projectSchema = z.object({
  name: z.string().trim().min(2, "Minimal 2 karakter"),
  location: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)) as z.ZodType<string | null>,
});


// ======================================================
// ============== Customer Create Dialog =================
// ======================================================
export function CustomerCreateDialog({ onCreated, createEndpoint }: BaseProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", address: "", phone: "", email: "", notes: "" },
  });

  const submit = async (data: z.infer<typeof customerSchema>) => {
    setPending(true);
    try {
      const res = await fetch(createEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Gagal membuat customer");

      const created = { id: json.id, name: json.name } as Option;
      toast.success("Customer dibuat", { description: created.name });
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
        <Button type="button" variant="outline" size="sm" className="h-9 w-9 p-0 md:h-10 md:w-10">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col rounded-lg md:rounded-xl md:h-auto md:max-w-lg">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 md:flex-col md:items-start md:justify-start md:space-y-2 md:pb-0">
          <div className="flex flex-col space-y-1.5">
            <DialogTitle className="text-lg md:text-xl">Tambah Customer</DialogTitle>
            <DialogDescription className="text-sm md:text-base">
              Isi data customer baru.
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 md:hidden"
            onClick={() => setDialogOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2">
          {/* BUKAN <form> → tidak ada native submit */}
          <div className="space-y-3 px-1">
            <div className="grid gap-1.5">
              <Label className="text-sm md:text-base">Nama Customer</Label>
              <Input 
                {...form.register("name")} 
                placeholder="PT Contoh Jaya" 
                className="h-9 md:h-10"
              />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm md:text-base">Alamat</Label>
              <Textarea rows={3} {...form.register("address")} className="resize-none" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm md:text-base">Telepon</Label>
              <Input {...form.register("phone")} className="h-9 md:h-10" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm md:text-base">Email</Label>
              <Input 
                type="email" 
                {...form.register("email")} 
                className="h-9 md:h-10"
              />
              {form.formState.errors.email && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm md:text-base">Catatan</Label>
              <Textarea rows={2} {...form.register("notes")} className="resize-none" />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setDialogOpen(false)}
            className="mt-0 sm:mt-0"
          >
            Batal
          </Button>
          <Button
            type="button"                     // ⬅️ bukan submit
            disabled={pending}
            onClick={form.handleSubmit(submit)} // ⬅️ submit manual
            className="w-full sm:w-auto"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {pending ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ======================================================
// ============== Project Create Dialog ==================
// ======================================================
export function ProjectCreateDialog(
  { onCreated, createEndpoint, customerId }: BaseProps & { customerId: string | null }
) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, setPending] = useState(false);

  // Schema khusus create Project: name wajib, location opsional
  const projectCreateSchema = z.object({
    name: z.string().min(2, "Minimal 2 karakter"),
    location: z.string().optional(),
  });

  const form = useForm<z.infer<typeof projectCreateSchema>>({
    resolver: zodResolver(projectCreateSchema),
    defaultValues: { name: "", location: "" },
  });

  const submit = async (data: z.infer<typeof projectCreateSchema>) => {
    if (!customerId) {
      toast.error("Pilih customer terlebih dahulu sebelum membuat project.");
      return;
    }
    setPending(true);
    try {
      const payload = {
        customerId,
        name: data.name.trim(),
        location: data.location?.trim() ? data.location.trim() : null, // kirim null jika kosong
      };

      const res = await fetch(createEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Gagal membuat project");

      const created = { id: json.id, name: json.name } as Option;
      toast.success("Project dibuat", { description: created.name });
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
        <Button 
          type="button" 
          variant="outline" 
          disabled={!customerId}
          size="sm" 
          className="h-9 w-9 p-0 md:h-10 md:w-10"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] h-[70vh] flex flex-col rounded-lg md:rounded-xl md:h-auto md:max-w-lg">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 md:flex-col md:items-start md:justify-start md:space-y-2 md:pb-0">
          <div className="flex flex-col space-y-1.5">
            <DialogTitle className="text-lg md:text-xl">Tambah Proyek</DialogTitle>
            <DialogDescription className="text-sm md:text-base">
              Isi data proyek baru.
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 md:hidden"
            onClick={() => setDialogOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2">
          {/* BUKAN <form> → submit manual agar tidak memicu form utama */}
          <div className="space-y-3 px-1">
            <div className="grid gap-1.5">
              <Label className="text-sm md:text-base">Nama Proyek</Label>
              <Input 
                {...form.register("name")} 
                className="h-9 md:h-10"
              />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label className="text-sm md:text-base">Lokasi (opsional)</Label>
              <Input 
                placeholder="Contoh: Jakarta / Site A" 
                {...form.register("location")} 
                className="h-9 md:h-10"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setDialogOpen(false)}
            className="mt-0 sm:mt-0"
          >
            Batal
          </Button>
          <Button
            type="button"
            disabled={pending || !customerId}
            onClick={form.handleSubmit(submit)}
            className="w-full sm:w-auto"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {pending ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}