// components/supplier/updateFormSupplier.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

// UI Components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Icons
import {
    Loader2, Plus, Trash2, Building, Contact, Banknote, Save,
    Globe, Mail, Phone, MapPin, PackageOpen, ArrowLeft,
    CheckCircle, XCircle, AlertTriangle, Calendar, FileText,
    CreditCard, User, Briefcase
} from "lucide-react";
import { SupplierSchema } from "@/schemas/supplier/supplierSchema";
import { Supplier, SupplierCategory, SupplierFormValues, TermOfPayment } from "@/types/supplierType";
import { updateSupplier, deleteSupplier } from "@/lib/action/supplier/supplierAction";

interface UpdateSupplierFormProps {
    supplier: Supplier;
    categories: SupplierCategory[];
    termOfPayments: TermOfPayment[];
    role: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

// Type untuk update supplier yang sesuai dengan API
type UpdateSupplierInput = Omit<SupplierFormValues, 'code'>;

// ==================== Main Component ====================
export function UpdateSupplierForm({
    role,
    supplier,
    categories,
    termOfPayments,
    onSuccess,
    onCancel,
}: UpdateSupplierFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const router = useRouter();

    // Default values from existing supplier
    const defaultValues: SupplierFormValues = {
        code: supplier.code || "",
        name: supplier.name || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        website: supplier.website || "",
        billingAddress: supplier.billingAddress || "",
        shippingAddress: supplier.shippingAddress || "",
        npwp: supplier.npwp || "",
        isTaxable: supplier.isTaxable || false,
        termOfPaymentId: supplier.termOfPaymentId || "",
        supplierCategoryId: supplier.supplierCategoryId || "",
        contacts: supplier.contacts && supplier.contacts.length > 0
            ? supplier.contacts.map(contact => ({
                ...contact,
                isPrimary: contact.isPrimary || false
            }))
            : [{
                name: "",
                position: "",
                email: "",
                phone: "",
                isPrimary: true
            }],
        bankAccounts: supplier.bankAccounts && supplier.bankAccounts.length > 0
            ? supplier.bankAccounts.map(bank => ({
                ...bank,
                isPrimary: bank.isPrimary || false
            }))
            : [{
                bankName: "",
                accountHolderName: "",
                accountNumber: "",
                branch: "",
                isPrimary: true
            }],
    };

    const {
        register,
        handleSubmit,
        control,
        setValue,
        reset,
        watch,
        formState: { errors, isDirty, isValid },
    } = useForm<SupplierFormValues>({
        resolver: zodResolver(SupplierSchema),
        defaultValues,
        mode: "onChange"
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

    // Watch values untuk logic conditional
    const isTaxable = watch("isTaxable");
    const contacts = watch("contacts");
    const bankAccounts = watch("bankAccounts");

    // Reset form dengan data supplier
    useEffect(() => {
        if (supplier) {
            reset(defaultValues);
        }
    }, [supplier]);

    // Set primary contact logic
    const handleSetPrimaryContact = (index: number) => {
        const currentContacts = contacts || [];
        const newContacts = currentContacts.map((contact, i) => ({
            ...contact,
            isPrimary: i === index
        }));

        newContacts.forEach((_, i) => {
            setValue(`contacts.${i}.isPrimary`, i === index);
        });
    };

    // Set primary bank account logic
    const handleSetPrimaryBank = (index: number) => {
        const currentBanks = bankAccounts || [];
        const newBanks = currentBanks.map((bank, i) => ({
            ...bank,
            isPrimary: i === index
        }));

        newBanks.forEach((_, i) => {
            setValue(`bankAccounts.${i}.isPrimary`, i === index);
        });
    };

    const onInvalid = (errors: FieldErrors<SupplierFormValues>) => {
        console.error("Validation errors:", errors);

        // Cari tab yang mengandung error pertama
        const firstError = Object.keys(errors)[0];
        let errorTab = "basic";

        if (firstError?.includes("contacts")) errorTab = "contacts";
        if (firstError?.includes("bankAccounts")) errorTab = "bank";

        setActiveTab(errorTab);

        // Scroll ke error
        setTimeout(() => {
            const element = document.getElementById(firstError);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.focus();
            }
        }, 100);

        setSubmitError("Please check all required fields!");
        toast.error("Please check all required fields!");
    };

    const onSubmit = async (data: SupplierFormValues) => {
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);

        try {
            // Siapkan data untuk API (exclude code karena tidak bisa diubah)
            const updateData: UpdateSupplierInput = {
                name: data.name,
                email: data.email,
                phone: data.phone,
                website: data.website,
                billingAddress: data.billingAddress,
                shippingAddress: data.shippingAddress,
                npwp: data.npwp,
                isTaxable: data.isTaxable,
                termOfPaymentId: data.termOfPaymentId,
                supplierCategoryId: data.supplierCategoryId,
                contacts: (data.contacts || []).map(contact => ({
                    ...contact,
                    // Pastikan hanya satu primary contact
                    isPrimary: contact.isPrimary || false
                })),
                bankAccounts: (data.bankAccounts || []).map(bank => ({
                    ...bank,
                    // Pastikan hanya satu primary bank
                    isPrimary: bank.isPrimary || false
                })),
            };

            console.log("Updating supplier:", { id: supplier.id, data: updateData });

            // Panggil API
            const result = await updateSupplier(supplier.id, updateData);

            if (result.success) {
                setSubmitSuccess(true);
                toast.success("Supplier updated successfully!", {
                    description: `Supplier ${data.name} has been updated.`
                });

                // Redirect setelah 1.5 detik
                setTimeout(() => {
                    if (onSuccess) {
                        onSuccess();
                    } else {
                        router.push(getBasePath(role));
                        router.refresh(); // Refresh data
                    }
                }, 1500);
            } else {
                setSubmitError(result.message || "Failed to update supplier");
                toast.error("Update failed", {
                    description: result.message || "Please try again."
                });
            }
        } catch (error) {
            console.error("Update error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
            setSubmitError(errorMessage);
            toast.error("Update error", {
                description: errorMessage
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSupplier = async () => {
        if (!window.confirm(`Are you sure you want to delete ${supplier.name}? This action cannot be undone.`)) {
            return;
        }

        setIsDeleting(true);

        try {
            const result = await deleteSupplier(supplier.id);

            if (result.success) {
                toast.success("Supplier deleted successfully!", {
                    description: `${supplier.name} has been removed from the system.`
                });

                // Redirect setelah sukses
                setTimeout(() => {
                    router.push(getBasePath(role));
                    router.refresh();
                }, 1000);
            } else {
                toast.error("Delete failed", {
                    description: result.message || "Please try again."
                });
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Delete error", {
                description: error instanceof Error ? error.message : "An unexpected error occurred"
            });
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleCancel = () => {
        if (isDirty && !submitSuccess) {
            const confirmed = window.confirm(
                "You have unsaved changes. Are you sure you want to leave?"
            );
            if (!confirmed) return;
        }

        if (onCancel) {
            onCancel();
        } else {
            router.push(getBasePath(role));
        }
    };

    // Format date helper
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-background pb-32">
            <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
                {/* ================= HEADER ================= */}
                <div className="relative max-w-6xl mx-auto overflow-hidden border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 rounded-xl">
                    <div className="container max-w-6xl mx-auto py-8 px-4 md:px-6 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-full border-dashed"
                                        onClick={handleCancel}
                                        disabled={isSubmitting}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <div>
                                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                            Update Supplier
                                            <Badge
                                                variant={supplier.status === "ACTIVE" ? "default" : "secondary"}
                                                className="ml-2"
                                            >
                                                {supplier.status === "ACTIVE" ? "Active" : "Inactive"}
                                            </Badge>
                                        </h1>
                                        <p className="text-sm text-muted-foreground ml-11">
                                            Editing supplier: {supplier.name}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Badge variant="outline" className="font-mono py-1 px-3">
                                    {supplier.code}
                                </Badge>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Created</p>
                                    <p className="text-sm font-medium flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(supplier.createdAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Messages */}
                <div className="container max-w-6xl mx-auto px-4 md:px-6 pt-6">
                    {submitError && (
                        <Alert variant="destructive" className="mb-4 animate-in fade-in slide-in-from-top-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Update Failed</AlertTitle>
                            <AlertDescription>{submitError}</AlertDescription>
                        </Alert>
                    )}

                    {submitSuccess && (
                        <Alert className="mb-4 bg-green-50 border-green-200 text-green-800 animate-in fade-in slide-in-from-top-2">
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle>Success!</AlertTitle>
                            <AlertDescription>
                                Supplier updated successfully. Redirecting...
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Content Container */}
                <div className="container max-w-6xl mx-auto px-4 md:px-6 py-8">
                    {/* Tab Navigation */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
                        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
                            <TabsTrigger value="basic" className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                <span className="hidden sm:inline">Basic Info</span>
                            </TabsTrigger>
                            <TabsTrigger value="contacts" className="flex items-center gap-2">
                                <Contact className="h-4 w-4" />
                                <span className="hidden sm:inline">Contacts</span>
                                <Badge variant="outline" className="ml-1 h-5 w-5 p-0">
                                    {contactFields.length}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="bank" className="flex items-center gap-2">
                                <Banknote className="h-4 w-4" />
                                <span className="hidden sm:inline">Bank</span>
                                <Badge variant="outline" className="ml-1 h-5 w-5 p-0">
                                    {bankFields.length}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                <span className="hidden sm:inline">Settings</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Basic Info Tab */}
                        <TabsContent value="basic" className="space-y-8 mt-6">
                            <Card className="border-border/60 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">Company Information</CardTitle>
                                    <CardDescription>General information about the supplier entity.</CardDescription>
                                </CardHeader>
                                <Separator className="bg-border/60" />
                                <CardContent className="pt-6 grid gap-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Supplier Code</Label>
                                            <Input
                                                value={supplier.code}
                                                disabled
                                                className="bg-muted/50 font-mono"
                                            />
                                            <input type="hidden" {...register("code")} value={supplier.code} />
                                        </div>
                                        <div className="space-y-2" id="name">
                                            <Label htmlFor="name">Supplier Name <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="name"
                                                {...register("name")}
                                                className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                                                placeholder="e.g. PT. Mitra Abadi Jaya"
                                                disabled={isSubmitting}
                                            />
                                            {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2" id="email">
                                            <Label htmlFor="email" className="flex items-center gap-2">
                                                <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email Address
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                {...register("email")}
                                                placeholder="procurement@vendor.com"
                                                disabled={isSubmitting}
                                            />
                                            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                                        </div>
                                        <div className="space-y-2" id="phone">
                                            <Label htmlFor="phone" className="flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone Number
                                            </Label>
                                            <Input
                                                id="phone"
                                                {...register("phone")}
                                                placeholder="+62 21 5555 1234"
                                                disabled={isSubmitting}
                                            />
                                            {errors.phone && <p className="text-xs text-red-500">{errors.phone?.message}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2" id="website">
                                        <Label htmlFor="website" className="flex items-center gap-2">
                                            <Globe className="h-3.5 w-3.5 text-muted-foreground" /> Website
                                        </Label>
                                        <Input
                                            id="website"
                                            {...register("website")}
                                            placeholder="https://"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2" id="billingAddress">
                                            <Label htmlFor="billingAddress" className="flex items-center gap-2">
                                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Billing Address
                                            </Label>
                                            <Textarea
                                                id="billingAddress"
                                                {...register("billingAddress")}
                                                className="resize-none min-h-[100px]"
                                                placeholder="Registered address..."
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="space-y-2" id="shippingAddress">
                                            <Label htmlFor="shippingAddress" className="flex items-center gap-2">
                                                <PackageOpen className="h-3.5 w-3.5 text-muted-foreground" /> Shipping Address
                                            </Label>
                                            <Textarea
                                                id="shippingAddress"
                                                {...register("shippingAddress")}
                                                className="resize-none min-h-[100px]"
                                                placeholder="Warehouse address..."
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Contacts Tab */}
                        <TabsContent value="contacts" className="space-y-8 mt-6">
                            <Card className="border-border/60 shadow-sm">
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
                                        onClick={() => appendContact({
                                            name: "",
                                            position: "",
                                            email: "",
                                            phone: "",
                                            isPrimary: false
                                        })}
                                        disabled={isSubmitting}
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
                                                        disabled={isSubmitting}
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
                                                    <Input
                                                        {...register(`contacts.${index}.name`)}
                                                        placeholder="Name"
                                                        className="h-9"
                                                        disabled={isSubmitting}
                                                    />
                                                    {errors.contacts?.[index]?.name && (
                                                        <p className="text-xs text-red-500">{errors.contacts[index]?.name?.message}</p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Position</Label>
                                                    <Input
                                                        {...register(`contacts.${index}.position`)}
                                                        placeholder="Position"
                                                        className="h-9"
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Email</Label>
                                                    <Input
                                                        {...register(`contacts.${index}.email`)}
                                                        placeholder="Email"
                                                        className="h-9"
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Phone</Label>
                                                    <Input
                                                        {...register(`contacts.${index}.phone`)}
                                                        placeholder="Phone"
                                                        className="h-9"
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                            </div>

                                            {/* Toggle Primary Button */}
                                            <div className="mt-3 pt-3 border-t border-dashed">
                                                <Button
                                                    type="button"
                                                    variant={field.isPrimary ? "default" : "outline"}
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => handleSetPrimaryContact(index)}
                                                    disabled={isSubmitting || field.isPrimary}
                                                >
                                                    {field.isPrimary ? (
                                                        <>
                                                            <User className="h-3.5 w-3.5 mr-2" />
                                                            Primary Contact
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Briefcase className="h-3.5 w-3.5 mr-2" />
                                                            Set as Primary Contact
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Bank Accounts Tab */}
                        <TabsContent value="bank" className="space-y-8 mt-6">
                            <Card className="border-border/60 shadow-sm">
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
                                        onClick={() => appendBank({
                                            bankName: "",
                                            accountHolderName: "",
                                            accountNumber: "",
                                            branch: "",
                                            isPrimary: false
                                        })}
                                        disabled={isSubmitting}
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
                                                        disabled={isSubmitting}
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
                                                    <Input
                                                        {...register(`bankAccounts.${index}.bankName`)}
                                                        placeholder="e.g. BCA"
                                                        className="h-9"
                                                        disabled={isSubmitting}
                                                    />
                                                    {errors.bankAccounts?.[index]?.bankName && (
                                                        <p className="text-xs text-red-500">{errors.bankAccounts[index]?.bankName?.message}</p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Account Number</Label>
                                                    <Input
                                                        {...register(`bankAccounts.${index}.accountNumber`)}
                                                        placeholder="0000-0000"
                                                        className="h-9"
                                                        disabled={isSubmitting}
                                                    />
                                                    {errors.bankAccounts?.[index]?.accountNumber && (
                                                        <p className="text-xs text-red-500">{errors.bankAccounts[index]?.accountNumber?.message}</p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Account Holder</Label>
                                                    <Input
                                                        {...register(`bankAccounts.${index}.accountHolderName`)}
                                                        placeholder="Holder Name"
                                                        className="h-9"
                                                        disabled={isSubmitting}
                                                    />
                                                    {errors.bankAccounts?.[index]?.accountHolderName && (
                                                        <p className="text-xs text-red-500">{errors.bankAccounts[index]?.accountHolderName?.message}</p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Branch</Label>
                                                    <Input
                                                        {...register(`bankAccounts.${index}.branch`)}
                                                        placeholder="Branch"
                                                        className="h-9"
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                            </div>

                                            {/* Toggle Primary Button */}
                                            <div className="mt-3 pt-3 border-t border-dashed">
                                                <Button
                                                    type="button"
                                                    variant={field.isPrimary ? "default" : "outline"}
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => handleSetPrimaryBank(index)}
                                                    disabled={isSubmitting || field.isPrimary}
                                                >
                                                    {field.isPrimary ? (
                                                        <>
                                                            <CreditCard className="h-3.5 w-3.5 mr-2" />
                                                            Primary Bank Account
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Banknote className="h-3.5 w-3.5 mr-2" />
                                                            Set as Primary Bank Account
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Settings Tab */}
                        <TabsContent value="settings" className="space-y-8 mt-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Classification Card */}
                                    <Card className="border-border/60 shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-lg font-bold">Classification & Terms</CardTitle>
                                            <CardDescription>Setup payment and tax details.</CardDescription>
                                        </CardHeader>
                                        <Separator className="bg-border/60" />
                                        <CardContent className="pt-6 space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                                disabled={isSubmitting}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select category" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {Array.isArray(categories) && categories.map((cat) => (
                                                                        <SelectItem key={cat.id} value={cat.id}>
                                                                            {cat.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                        Payment Terms
                                                    </Label>
                                                    <Controller
                                                        name="termOfPaymentId"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Select
                                                                onValueChange={field.onChange}
                                                                value={field.value}
                                                                disabled={isSubmitting}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select payment terms" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {Array.isArray(termOfPayments) && termOfPayments.map((term) => (
                                                                        <SelectItem key={term.id} value={term.id}>
                                                                            <div className="flex items-center justify-between">
                                                                                <span>{term.name}</span>
                                                                                <span className="text-xs text-muted-foreground ml-2">
                                                                                    {term.days === 0 ? 'COD' : `${term.days} days`}
                                                                                </span>
                                                                            </div>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    />
                                                </div>
                                            </div>

                                            <Separator />

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="npwp">Tax ID (NPWP)</Label>
                                                    <Input
                                                        id="npwp"
                                                        {...register("npwp")}
                                                        placeholder="XX.XXX.XXX.X-XXX.XXX"
                                                        className="font-mono"
                                                        disabled={isSubmitting}
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-gradient-to-br from-background to-muted/50">
                                                    <div className="space-y-0.5">
                                                        <Label className="text-sm font-semibold flex items-center gap-2">
                                                            Taxable Entity
                                                            {isTaxable && (
                                                                <Badge variant="outline" className="ml-2">PKP</Badge>
                                                            )}
                                                        </Label>
                                                        <p className="text-sm text-muted-foreground">
                                                            {isTaxable
                                                                ? "This vendor is registered as Taxable Entrepreneur (PKP)"
                                                                : "This vendor is not registered as PKP"
                                                            }
                                                        </p>
                                                    </div>
                                                    <Controller
                                                        name="isTaxable"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Switch
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                                disabled={isSubmitting}
                                                            />
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Danger Zone */}
                                    <Card className="border-red-200 dark:border-red-800/50 shadow-sm">
                                        <CardHeader className="bg-red-50 dark:bg-red-950/20">
                                            <CardTitle className="text-lg font-bold text-red-700 dark:text-red-300">
                                                Danger Zone
                                            </CardTitle>
                                            <CardDescription className="text-red-600 dark:text-red-400">
                                                Irreversible actions
                                            </CardDescription>
                                        </CardHeader>
                                        <Separator className="bg-red-200 dark:bg-red-800" />
                                        <CardContent className="pt-6">
                                            <div className="space-y-4">
                                                <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg">
                                                    <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2">
                                                        Delete Supplier
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground mb-4">
                                                        Once you delete this supplier, all related data will be permanently removed. This action cannot be undone.
                                                    </p>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        onClick={handleDeleteSupplier}
                                                        disabled={isDeleting || isSubmitting}
                                                    >
                                                        {isDeleting ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                Deleting...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete Supplier
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Sidebar */}
                                <div className="space-y-6">
                                    <Card className="border-border/60 shadow-sm sticky top-6">
                                        <CardHeader className="bg-muted/30 pb-4">
                                            <CardTitle className="text-base font-bold">Supplier Status</CardTitle>
                                            <CardDescription>Current supplier information</CardDescription>
                                        </CardHeader>
                                        <Separator />
                                        <CardContent className="pt-6 space-y-4">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-muted-foreground">Status</span>
                                                    <Badge variant={supplier.status === "ACTIVE" ? "default" : "secondary"}>
                                                        {supplier.status === "ACTIVE" ? "Active" : "Inactive"}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-muted-foreground">Created</span>
                                                    <span className="text-sm font-medium">
                                                        {formatDate(supplier.createdAt)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-muted-foreground">Last Updated</span>
                                                    <span className="text-sm font-medium">
                                                        {formatDate(supplier.updatedAt || supplier.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* ================= STICKY FOOTER ACTION BAR ================= */}
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-border shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)]">
                    <div className="container max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                {isDirty && !submitSuccess && (
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                )}
                                <span className={`text-sm font-medium ${isDirty ? 'text-amber-600' : 'text-foreground'}`}>
                                    {isDirty && !submitSuccess
                                        ? "You have unsaved changes"
                                        : "All changes saved"}
                                </span>
                            </div>
                            {isDirty && !submitSuccess && (
                                <span className="text-xs text-muted-foreground">
                                    Save your work before leaving
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                className="flex-1 md:flex-none h-11 border-muted-foreground/30"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || submitSuccess || !isDirty}
                                size="lg"
                                className="flex-1 md:flex-none h-11 md:min-w-[160px] bg-gradient-to-r from-primary to-primary/90 hover:to-primary shadow-lg shadow-primary/20"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating...
                                    </>
                                ) : submitSuccess ? (
                                    <>
                                        <CheckCircle className="h-4 w-4 mr-2" /> Updated!
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" /> Update Supplier
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

// Helper function untuk base path
function getBasePath(role?: string) {
    return role === "super"
        ? "/super-admin-area/master/supplier"
        : "/admin-area/master/supplier";
}