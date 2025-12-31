"use client";

import React, { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

// UI Components (Pastikan path import sesuai struktur project Anda)
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

// Icons
import {
    Loader2, Plus, Trash2, Building, Contact, Banknote, Save,
    Globe, Mail, Phone, MapPin, PackageOpen, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { SupplierSchema } from "@/schemas/supplier/supplierSchema";
import { SupplierCategory, SupplierFormValues, TermOfPayment } from "@/types/supplierType";
import { createSupplier } from "@/lib/action/supplier/supplierAction";

function getBasePath(role?: string) {
    return role === "super"
        ? "/super-admin-area/master/supplier"
        : "/admin-area/master/supplier";
}

// ==================== Main Component ====================
export function CreateSupplierForm({
    role,
    code,
    error,
    categories,
    termOfPayments,
}: {
    role: string;
    code: string; // Auto-generated code passed from parent/server
    error: string | null;
    categories: SupplierCategory[];
    termOfPayments: TermOfPayment[];
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        control,
        setValue,
        formState: { errors },
    } = useForm<SupplierFormValues>({
        resolver: zodResolver(SupplierSchema),
        defaultValues: {
            code: code || "",
            name: "",
            email: "",
            phone: "",
            website: "",
            billingAddress: "",
            shippingAddress: "",
            npwp: "",

            // PENTING: Ini menangani default value secara runtime
            isTaxable: false,

            termOfPaymentId: "",
            supplierCategoryId: "",
            contacts: [{
                name: "",
                position: "",
                email: "",
                phone: "",
                isPrimary: false // Default false di sini
            }],
            bankAccounts: [{
                bankName: "",
                accountHolderName: "",
                accountNumber: "",
                branch: "",
                isPrimary: false // Default false di sini
            }],
        },
    });

    // Dynamic Fields Management
    const {
        fields: contactFields,
        append: appendContact,
        remove: removeContact,
    } = useFieldArray({ control, name: "contacts" });

    const {
        fields: bankFields,
        append: appendBank,
        remove: removeBank,
    } = useFieldArray({ control, name: "bankAccounts" });

    const onInvalid = (errors: FieldErrors<SupplierFormValues>) => {
        // Dipanggil HANYA jika validasi GAGAL
        console.error("Validation Errors:", errors);
        toast.error("Mohon periksa kembali semua field yang wajib diisi!");
        setIsSubmitting(false);
    };


    const onSubmit = async (data: SupplierFormValues) => {
        setIsSubmitting(true);

        try {
            // Panggil backend via helper createSupplier (Axios)
            await createSupplier(data); // cukup panggil saja
            toast.success("Supplier berhasil dibuat!");
            router.push(getBasePath(role));

        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("Terjadi kesalahan saat membuat supplier");
                console.error(error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };


    useEffect(() => {
        if (code) {
            setValue("code", code, { shouldValidate: true }); // pastikan validasi dijalankan
        }
    }, [code, setValue]);

    return (
        // Wrapper dengan padding bottom untuk sticky footer
        <div className="min-h-screen bg-background pb-32">
            <form onSubmit={handleSubmit(onSubmit, onInvalid)}>

                {/* ================= HEADER GRADIENT MODERN 2025 ================= */}
                <div className="relative max-w-6xl mx-auto overflow-hidden border-b bg-background/50 rounded-xl">
                    {/* Abstract Gradient Background blobs */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-[50%] -left-[10%] w-[70%] h-[200%] bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-transparent blur-3xl rounded-full mix-blend-multiply dark:mix-blend-screen dark:opacity-20 animate-pulse-slow" />
                        <div className="absolute top-[10%] right-[10%] w-[40%] h-[80%] bg-gradient-to-l from-blue-500/10 to-transparent blur-3xl rounded-full mix-blend-multiply dark:mix-blend-screen dark:opacity-20" />
                    </div>

                    <div className="container max-w-6xl mx-auto py-8 px-4 md:px-6 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-full border-dashed"
                                        onClick={() => router.back()}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <h1 className="text-2xl font-bold tracking-tight">Create New Supplier</h1>
                                    {/* Badge Code responsive */}
                                    <div className="hidden sm:block">
                                        <Badge variant="outline" className="font-mono bg-primary/5 text-primary border-primary/20">
                                            {code}
                                        </Badge>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground ml-11">
                                    Register a new vendor partner with accurate tax and banking information.
                                </p>
                            </div>
                            {/* Mobile Badge */}
                            <div className="block sm:hidden">
                                <Badge variant="outline" className="font-mono w-full justify-center py-1">
                                    {code}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
                {/* ================= END HEADER ================= */}

                {/* Content Container */}
                <div className="container max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* LEFT COLUMN: PRIMARY DATA forms */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* 1. Company Information */}
                            <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                            <Building className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold">Company Profile</CardTitle>
                                            <CardDescription>General information about the supplier entity.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <Separator className="bg-border/60" />
                                <CardContent className="pt-6 grid gap-6">
                                    {/* Row 1 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Supplier Code</Label>

                                            {/* Input Visual (Hanya Tampilan) */}
                                            <Input
                                                value={code}
                                                disabled
                                                className="bg-muted/50 font-mono"
                                            />

                                            {/* Error Message */}
                                            {error && (
                                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                                                    {error}
                                                </div>
                                            )}

                                            {/* Input Data (Yang dikirim ke Zod) */}
                                            {/* 👇 PERBAIKAN DI SINI: Tambahkan value={code} */}
                                            <input
                                                type="hidden"
                                                {...register("code")}
                                                value={code}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Supplier Name <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="name"
                                                {...register("name")}
                                                className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                                                placeholder="e.g. PT. Mitra Abadi Jaya"
                                            />
                                            {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
                                        </div>
                                    </div>

                                    {/* Row 2 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="flex items-center gap-2">
                                                <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email Address
                                            </Label>
                                            <Input id="email" type="email" {...register("email")} placeholder="procurement@vendor.com" />
                                            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone Number
                                            </Label>
                                            <Input id="phone" {...register("phone")} placeholder="+62 21 5555 1234" />
                                        </div>
                                    </div>

                                    {/* Website */}
                                    <div className="space-y-2">
                                        <Label htmlFor="website" className="flex items-center gap-2">
                                            <Globe className="h-3.5 w-3.5 text-muted-foreground" /> Website
                                        </Label>
                                        <Input id="website" {...register("website")} placeholder="https://" />
                                    </div>

                                    {/* Addresses */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="billingAddress" className="flex items-center gap-2">
                                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Billing Address
                                            </Label>
                                            <Textarea id="billingAddress" {...register("billingAddress")} className="resize-none min-h-[100px]" placeholder="Registered address..." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="shippingAddress" className="flex items-center gap-2">
                                                <PackageOpen className="h-3.5 w-3.5 text-muted-foreground" /> Shipping Address
                                            </Label>
                                            <Textarea id="shippingAddress" {...register("shippingAddress")} className="resize-none min-h-[100px]" placeholder="Warehouse address..." />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 2. Contacts (Dynamic) */}
                            <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
                                <CardHeader className="flex flex-row items-center justify-between pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                            <Contact className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold">Key Contacts</CardTitle>
                                            <CardDescription>Personnel information.</CardDescription>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 border-dashed"
                                        onClick={() => appendContact({ name: "", position: "", email: "", phone: "", isPrimary: false })}
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Person
                                    </Button>
                                </CardHeader>
                                <Separator className="bg-border/60" />
                                <CardContent className="pt-6 space-y-4">
                                    {contactFields.map((field, index) => (
                                        <div
                                            key={field.id}
                                            className={`relative p-5 rounded-xl border transition-all duration-300 ${field.isPrimary
                                                ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10'
                                                : 'border-border bg-card hover:bg-muted/40'
                                                }`}
                                        >
                                            {/* Delete Button */}
                                            {contactFields.length > 1 && (
                                                <div className="absolute right-4 top-4">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        onClick={() => removeContact(index)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Primary Badge */}
                                            {field.isPrimary && (
                                                <div className="absolute right-12 top-4">
                                                    <Badge className="bg-emerald-600 text-white text-[10px] h-5">Primary</Badge>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Full Name</Label>
                                                    <Input {...register(`contacts.${index}.name`)} placeholder="Name" className="h-9" />
                                                    {errors.contacts?.[index]?.name && <p className="text-xs text-red-500">{errors.contacts[index]?.name?.message}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Position</Label>
                                                    <Input {...register(`contacts.${index}.position`)} placeholder="Position" className="h-9" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Email</Label>
                                                    <Input {...register(`contacts.${index}.email`)} placeholder="Email" className="h-9" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Phone</Label>
                                                    <Input {...register(`contacts.${index}.phone`)} placeholder="Phone" className="h-9" />
                                                </div>
                                            </div>

                                            {/* Toggle Primary if not primary */}
                                            {!field.isPrimary && (
                                                <div className="mt-3 pt-3 border-t border-dashed flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`contact-primary-${index}`}
                                                        {...register(`contacts.${index}.isPrimary`)}
                                                        className="h-4 w-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-600 cursor-pointer"
                                                    />
                                                    <Label htmlFor={`contact-primary-${index}`} className="text-sm font-normal cursor-pointer text-muted-foreground hover:text-foreground">
                                                        Set as primary contact
                                                    </Label>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* 3. Bank Accounts (Dynamic) */}
                            <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
                                <CardHeader className="flex flex-row items-center justify-between pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                            <Banknote className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold">Bank Accounts</CardTitle>
                                            <CardDescription>Financial details for transfers.</CardDescription>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 border-dashed"
                                        onClick={() => appendBank({ bankName: "", accountHolderName: "", accountNumber: "", branch: "", isPrimary: false })}
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Bank
                                    </Button>
                                </CardHeader>
                                <Separator className="bg-border/60" />
                                <CardContent className="pt-6 space-y-4">
                                    {bankFields.map((field, index) => (
                                        <div
                                            key={field.id}
                                            className={`relative p-5 rounded-xl border transition-all duration-300 ${field.isPrimary
                                                ? 'border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10'
                                                : 'border-border bg-card hover:bg-muted/40'
                                                }`}
                                        >
                                            {/* Delete Button */}
                                            {bankFields.length > 1 && (
                                                <div className="absolute right-4 top-4">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        onClick={() => removeBank(index)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Primary Badge */}
                                            {field.isPrimary && (
                                                <div className="absolute right-12 top-4">
                                                    <Badge className="bg-amber-600 text-white text-[10px] h-5">Primary</Badge>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Bank Name</Label>
                                                    <Input {...register(`bankAccounts.${index}.bankName`)} placeholder="e.g. BCA" className="h-9" />
                                                    {errors.bankAccounts?.[index]?.bankName && <p className="text-xs text-red-500">{errors.bankAccounts[index]?.bankName?.message}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Account Number</Label>
                                                    <Input {...register(`bankAccounts.${index}.accountNumber`)} placeholder="0000-0000" className="h-9" />
                                                    {errors.bankAccounts?.[index]?.accountNumber && <p className="text-xs text-red-500">{errors.bankAccounts[index]?.accountNumber?.message}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Account Holder</Label>
                                                    <Input {...register(`bankAccounts.${index}.accountHolderName`)} placeholder="Holder Name" className="h-9" />
                                                    {errors.bankAccounts?.[index]?.accountHolderName && <p className="text-xs text-red-500">{errors.bankAccounts[index]?.accountHolderName?.message}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Branch</Label>
                                                    <Input {...register(`bankAccounts.${index}.branch`)} placeholder="Branch" className="h-9" />
                                                </div>
                                            </div>

                                            {!field.isPrimary && (
                                                <div className="mt-3 pt-3 border-t border-dashed flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`bank-primary-${index}`}
                                                        {...register(`bankAccounts.${index}.isPrimary`)}
                                                        className="h-4 w-4 text-amber-600 rounded border-gray-300 focus:ring-amber-600 cursor-pointer"
                                                    />
                                                    <Label htmlFor={`bank-primary-${index}`} className="text-sm font-normal cursor-pointer text-muted-foreground hover:text-foreground">
                                                        Set as primary bank account
                                                    </Label>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                        </div>

                        {/* RIGHT COLUMN: SETTINGS & METADATA */}
                        <div className="space-y-6">
                            <Card className="border-border/60 shadow-sm sticky top-6">
                                <CardHeader className="bg-muted/30 pb-4">
                                    <CardTitle className="text-base font-bold">Classification & Terms</CardTitle>
                                    <CardDescription>Setup payment and tax details.</CardDescription>
                                </CardHeader>
                                <Separator />
                                <CardContent className="space-y-6 pt-6">

                                    {/* Category */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Category
                                        </Label>
                                        <Controller
                                            name="supplierCategoryId"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {/* ⭐ DEBUG 1: Check if categories is array */}
                                                        {Array.isArray(categories) ? (
                                                            // ⭐ DEBUG 2: Check length
                                                            categories.length > 0 ? (
                                                                categories.map((cat) => {
                                                                    return (
                                                                        <SelectItem key={cat.id} value={cat.id}>
                                                                            {cat.name || `Category ${cat.id}`}
                                                                        </SelectItem>
                                                                    );
                                                                })
                                                            ) : (
                                                                <div className="px-3 py-2 text-xs text-muted-foreground">
                                                                    Categories array is empty
                                                                </div>
                                                            )
                                                        ) : (
                                                            <div className="px-3 py-2 text-xs text-red-500">
                                                                ⚠️ Categories is not an array: {typeof categories}
                                                            </div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                    {/* Payment Terms */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Payment Terms
                                        </Label>

                                        <Controller
                                            name="termOfPaymentId"
                                            control={control}
                                            render={({ field }) => {
                                                // Pastikan termOfPayments adalah array
                                                const termArray = Array.isArray(termOfPayments) ? termOfPayments : [];

                                                return (
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        disabled={termArray.length === 0}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue
                                                                placeholder={
                                                                    termArray.length === 0
                                                                        ? "Loading payment terms..."
                                                                        : "Select payment terms"
                                                                }
                                                            />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {termArray.map((term) => (
                                                                <SelectItem key={term.id} value={term.id}>
                                                                    <div className="flex items-center justify-between">
                                                                        <span>{term.name}</span>
                                                                        <span className="text-xs text-muted-foreground ml-2">
                                                                            {term.days === 0 ? 'COD' : `${term.days} days`}
                                                                        </span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}

                                                            {/* Jika tidak ada data dari API, tampilkan default options */}
                                                            {termArray.length === 0 && (
                                                                <>
                                                                    <SelectItem value="cod">COD (Cash on Delivery)</SelectItem>
                                                                    <SelectItem value="net30">Net 30 Days</SelectItem>
                                                                    <SelectItem value="net60">Net 60 Days</SelectItem>
                                                                </>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                );
                                            }}
                                        />

                                        {termOfPayments && Array.isArray(termOfPayments) && termOfPayments.length === 0 && (
                                            <p className="text-xs text-amber-600 mt-1">
                                                ⚠️ No payment terms found. Using default options.
                                            </p>
                                        )}
                                    </div>

                                    <div className="relative py-2">
                                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-dashed" /></div>
                                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Tax Info</span></div>
                                    </div>

                                    {/* NPWP */}
                                    <div className="space-y-2">
                                        <Label htmlFor="npwp">Tax ID (NPWP)</Label>
                                        <Input id="npwp" {...register("npwp")} placeholder="XX.XXX.XXX.X-XXX.XXX" className="font-mono" />
                                    </div>

                                    {/* Taxable Switch */}
                                    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-gradient-to-br from-background to-muted/50">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-semibold">Taxable Entity</Label>
                                            <p className="text-[11px] text-muted-foreground">Is this vendor PKP?</p>
                                        </div>
                                        <Controller
                                            name="isTaxable"
                                            control={control}
                                            render={({ field }) => (
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            )}
                                        />
                                    </div>

                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* ================= STICKY FOOTER ACTION BAR ================= */}
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-border shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)]">
                    <div className="container max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4">
                        <div className="hidden md:flex flex-col">
                            <span className="text-sm font-medium text-foreground">Unsaved Changes</span>
                            <span className="text-xs text-muted-foreground">Please save your work before leaving.</span>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                className="flex-1 md:flex-none h-11 border-muted-foreground/30"
                                onClick={() => router.push(getBasePath(role))}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                size="lg"
                                className="flex-1 md:flex-none h-11 md:min-w-[160px] bg-gradient-to-r from-primary to-primary/90 hover:to-primary shadow-lg shadow-primary/20"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" /> Save Supplier
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

            </form>
        </div>
    );
}