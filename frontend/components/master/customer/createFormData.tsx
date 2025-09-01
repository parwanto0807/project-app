"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    Landmark,
    StickyNote,
    Contact2,
    BookText,
    Loader2,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription, // Import CardDescription for a better header
} from "@/components/ui/card";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import { useRouter } from "next/navigation";
import { customerSchema } from "@/schemas";


// Helper component for section headers to keep the code DRY
const SectionHeader = ({ title }: { title: string }) => (
    <div className="md:col-span-2 pt-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
        <hr className="mt-2 border-gray-200 dark:border-gray-700" />
    </div>
);

const createCustomerSchema = customerSchema.omit({ code: true });
type CustomerFormValues = z.infer<typeof createCustomerSchema>;

export default function CreateCustomerForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(createCustomerSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            address: "",
            branch: "",
            city: "",
            province: "",
            postalCode: "",
            taxNumber: "",
            companyType: "",
            contactPerson: "",
            picPhone: "",
            picEmail: "",
            notes: "",
            isActive: true,
        },
    });

    const onSubmit = async (data: CustomerFormValues) => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/customer/createCustomer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });


            if (!response.ok) {
                const err = await response.json().catch(() => ({ message: "An unexpected error occurred." }));
                throw new Error(err.message);
            }

            toast.success("Customer created successfully ✨");
            router.push("/super-admin-area/master/customers");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create customer.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="max-w-4xl mx-auto shadow-lg border dark:border-gray-700">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Create New Customer
                </CardTitle>
                <CardDescription>
                    Fill in the details below to add a new customer to the system.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8"
                    >
                        {/* --- Section: Basic Information --- */}
                        <SectionHeader title="Basic Information" />

                        <div className="md:col-span-2">
                            <FormLabel className="mb-2">Code (Auto)</FormLabel>
                            <Input value="Akan dibuat otomatis setelah disimpan" disabled />
                            <FormDescription>Kode akan dihasilkan otomatis oleh sistem (backend).</FormDescription>
                        </div>

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Name *</FormLabel>
                                    <FormControl><Input placeholder="PT Maju Jaya" {...field} /></FormControl>
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
                                    <FormLabel className="flex items-center gap-2"><Mail className="w-4 h-4" /> Email</FormLabel>
                                    <FormControl><Input type="email" placeholder="contact@majujaya.com" {...field} /></FormControl>
                                    <FormDescription>The legal email of the company.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Phone className="w-4 h-4" /> Phone</FormLabel>
                                    <FormControl><Input type="tel" placeholder="021-123-4567" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* --- Section: Address Details --- */}
                        <SectionHeader title="Address Details" />

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Street Address</FormLabel>
                                    <FormControl><Textarea placeholder="Jl. Sudirman No. 123, Central Business District" {...field} /></FormControl>
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
                                    <FormControl><Input placeholder="Jakarta" {...field} /></FormControl>
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
                                    <FormControl><Input placeholder="DKI Jakarta" {...field} /></FormControl>
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
                                    <FormControl><Input placeholder="12190" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* --- Section: Company Information --- */}
                        <SectionHeader title="Company Information" />
                        <FormField
                            control={form.control}
                            name="companyType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Company Type</FormLabel>
                                    <FormControl><Input placeholder="e.g., PT, CV, LLC" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="taxNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><BookText className="w-4 h-4" /> Tax Number (NPWP)</FormLabel>
                                    <FormControl><Input placeholder="00.000.000.0-000.000" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="branch"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Landmark className="w-4 h-4" /> Branch / Cabang</FormLabel>
                                    <FormControl><Input placeholder="Main Office" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />


                        {/* --- Section: Person in Charge (PIC) --- */}
                        <SectionHeader title="Contact Person (PIC)" />
                        <FormField
                            control={form.control}
                            name="contactPerson"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Contact2 className="w-4 h-4" /> PIC Name</FormLabel>
                                    <FormControl><Input placeholder="Budi Santoso" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="picEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Mail className="w-4 h-4" /> PIC Email</FormLabel>
                                    <FormControl><Input type="email" placeholder="budi.s@majujaya.com" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="picPhone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Phone className="w-4 h-4" /> PIC Phone</FormLabel>
                                    <FormControl><Input type="tel" placeholder="0812-3456-7890" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* --- Section: Additional Details --- */}
                        <SectionHeader title="Additional Details" />
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel className="flex items-center gap-2"><StickyNote className="w-4 h-4" /> Notes</FormLabel>
                                    <FormControl><Textarea placeholder="Additional notes about the customer..." {...field} className="min-h-[100px]" /></FormControl>
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

                        {/* --- Action Buttons --- */}
                        <div className="md:col-span-2 flex justify-end gap-3 pt-4">
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
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                    </>
                                ) : "Save Customer"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}