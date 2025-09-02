"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Tag,
    Building2,
    Mail,
    Phone,
    MapPin,
    Landmark,
    BookText,
    Contact2,
    StickyNote,
    Loader2,
    User,
    Navigation,
    FileText,
    Info
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { customerSchema } from "@/schemas";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
    Form,
    FormItem,
    FormLabel,
    FormField,
    FormControl,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type CustomerFormValues = z.infer<typeof customerSchema>;

// Enhanced section header with icon and improved styling
const SectionHeader = ({ title, icon: Icon, description }: { title: string; icon: React.ElementType; description?: string }) => (
    <div className="md:col-span-2 pt-8 pb-2">
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        {description && <p className="text-sm text-muted-foreground pl-11">{description}</p>}
        <hr className="mt-3 border-gray-200 dark:border-gray-700" />
    </div>
);

// Form section wrapper for better organization
const FormSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
        {children}
    </div>
);

function getBasePath(role?: string) {
    return role === "super-admin"
        ? "/super-admin-area/master/customers"
        : "/admin-area/master/customers"
}

export default function UpdateCustomerForm({
    customer,
    role,
}: {
    customer: CustomerFormValues & { id: string };
    role: string;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: customer,
    });

    const onSubmit = async (data: CustomerFormValues) => {
        setIsSubmitting(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/master/customer/updateCustomer/${customer.id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                }
            );

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to update customer");
            }

            toast.success("Customer updated successfully ✨");
            const basePath = getBasePath(role)
            router.push(basePath)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update customer");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="max-w-4xl mx-auto shadow-lg border dark:border-gray-700">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Building2 className="w-6 h-6" />
                            Update Customer
                        </CardTitle>
                        <CardDescription className="mt-2">
                            Edit the details for customer:{" "}
                            <span className="font-semibold text-primary">{customer.name}</span>
                        </CardDescription>
                    </div>
                    <Badge variant={customer.isActive ? "default" : "secondary"} className="text-sm">
                        {customer.isActive ? "Active" : "Inactive"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-8"
                    >
                        {/* --- Section: Basic Information --- */}
                        <div>
                            <SectionHeader
                                title="Basic Information"
                                icon={Info}
                                description="Core details that identify this customer"
                            />
                            <FormSection className="mt-4">
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Tag className="w-4 h-4" /> Code *
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="CUST-001" disabled {...field} />
                                            </FormControl>
                                            <FormDescription>Unique identifier for the customer.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4" /> Name *
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="PT Maju Jaya" {...field} />
                                            </FormControl>
                                            <FormDescription>The full legal name of the company.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Mail className="w-4 h-4" /> Email
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="contact@majujaya.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Phone className="w-4 h-4" /> Phone
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="tel" placeholder="021-123-4567" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </FormSection>
                        </div>

                        {/* --- Section: Address Details --- */}
                        <div>
                            <SectionHeader
                                title="Address Details"
                                icon={MapPin}
                                description="Physical location information"
                            />
                            <FormSection className="mt-4">
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="flex items-center gap-2">
                                                <Navigation className="w-4 h-4" /> Street Address
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Jl. Sudirman No. 123, Central Business District"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>City</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Jakarta" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="province"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Province</FormLabel>
                                            <FormControl>
                                                <Input placeholder="DKI Jakarta" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="postalCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Postal Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="12190" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </FormSection>
                        </div>

                        {/* --- Section: Company Information --- */}
                        <div>
                            <SectionHeader
                                title="Company Information"
                                icon={Building2}
                                description="Legal and business details"
                            />
                            <FormSection className="mt-4">
                                <FormField
                                    control={form.control}
                                    name="companyType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <FileText className="w-4 h-4" /> Company Type
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., PT, CV, LLC" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="taxNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <BookText className="w-4 h-4" /> Tax Number (NPWP)
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="00.000.000.0-000.000" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="branch"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Landmark className="w-4 h-4" /> Branch / Cabang
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Main Office" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </FormSection>
                        </div>

                        {/* --- Section: Person in Charge (PIC) --- */}
                        <div>
                            <SectionHeader
                                title="Contact Person (PIC)"
                                icon={User}
                                description="Primary contact information"
                            />
                            <FormSection className="mt-4">
                                <FormField
                                    control={form.control}
                                    name="contactPerson"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Contact2 className="w-4 h-4" /> PIC Name
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Budi Santoso" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="picEmail"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Mail className="w-4 h-4" /> PIC Email
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="budi.s@majujaya.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="picPhone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Phone className="w-4 h-4" /> PIC Phone
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="tel" placeholder="0812-3456-7890" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </FormSection>
                        </div>

                        {/* --- Section: Additional Details --- */}
                        <div>
                            <SectionHeader
                                title="Additional Details"
                                icon={StickyNote}
                                description="Additional information and status"
                            />
                            <FormSection className="mt-4">
                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="flex items-center gap-2">
                                                <StickyNote className="w-4 h-4" /> Notes
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Additional notes about the customer..."
                                                    {...field}
                                                    className="min-h-[100px]"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2 flex flex-row items-center justify-between rounded-lg border p-4 dark:border-gray-700">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Customer Status</FormLabel>
                                                <FormDescription>
                                                    Set whether this customer is currently active or inactive.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </FormSection>
                        </div>

                        {/* --- Action Buttons --- */}
                        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="min-w-[150px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                                    </>
                                ) : "Update Customer"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}