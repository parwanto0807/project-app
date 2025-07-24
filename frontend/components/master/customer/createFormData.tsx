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
    Tag,
    Contact2,
    BookText,
    Loader2,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
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
import { toast } from 'sonner'
import { useRouter } from "next/navigation";
import { customerSchema } from "@/schemas";

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function CreateCustomerForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            code: "",
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
        try {
            setIsSubmitting(true);

            const response = await fetch("http://localhost:5000/api/master/customer/createCustomer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const contentType = response.headers.get("content-type");

            if (!response.ok) {
                if (contentType && contentType.includes("application/json")) {
                    const err = await response.json();
                    throw new Error(err.message || "Failed to create customer");
                } else {
                    const errText = await response.text();
                    throw new Error(errText || "Unexpected error from server");
                }
            }

            toast.success("Customer created successfully");
            router.push("/customers");
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Failed to create customer"
            );
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <Card className="max-w-4xl mx-auto shadow-lg border dark:border-gray-700">
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Create New Customer
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        {/* Code Field */}
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Tag className="w-4 h-4" /> Code *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="CUST-001"
                                            {...field}
                                            className="focus-visible:ring-2 focus-visible:ring-primary"
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Unique identifier for the customer
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Name Field */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4" /> Name *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Company Name"
                                            {...field}
                                            className="focus-visible:ring-2 focus-visible:ring-primary"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Email Field */}
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" /> Email
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="example@email.com"
                                            type="email"
                                            {...field}
                                            className="focus-visible:ring-2 focus-visible:ring-primary"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Phone Field */}
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Phone className="w-4 h-4" /> Phone
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="08123456789"
                                            type="tel"
                                            {...field}
                                            className="focus-visible:ring-2 focus-visible:ring-primary"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Address Field */}
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" /> Address
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Full address..."
                                            {...field}
                                            className="min-h-[80px] focus-visible:ring-2 focus-visible:ring-primary"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Dynamic Fields */}
                        {[
                            { name: "branch", label: "Branch", Icon: Landmark, description: "Company branch name" },
                            { name: "city", label: "City", Icon: MapPin, description: "City where company is located" },
                            { name: "province", label: "Province", Icon: MapPin, description: "Province where company is located" },
                            { name: "postalCode", label: "Postal Code", Icon: MapPin, description: "Postal/ZIP code" },
                            { name: "taxNumber", label: "Tax Number", Icon: BookText, description: "Company tax identification number" },
                            { name: "companyType", label: "Company Type", Icon: Building2, description: "e.g., PT, CV, LLC" },
                            { name: "contactPerson", label: "Contact Person", Icon: Contact2, description: "Main contact person" },
                            { name: "picPhone", label: "PIC Phone", Icon: Phone, description: "Person in charge phone number" },
                            { name: "picEmail", label: "PIC Email", Icon: Mail, description: "Person in charge email" },
                        ].map(({ name, label, Icon, description }) => (
                            <FormField
                                key={name}
                                control={form.control}
                                name={name as keyof CustomerFormValues}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Icon className="w-4 h-4" /> {label}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                value={
                                                    typeof field.value === "string" || typeof field.value === "number"
                                                        ? field.value
                                                        : ""
                                                }
                                                className="focus-visible:ring-2 focus-visible:ring-primary"
                                                type={name === "picEmail" ? "email" : name === "picPhone" ? "tel" : "text"}
                                            />
                                        </FormControl>
                                        {description && (
                                            <FormDescription>{description}</FormDescription>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ))}

                        {/* Notes Field */}
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
                                            placeholder="Additional notes..."
                                            {...field}
                                            className="min-h-[100px] focus-visible:ring-2 focus-visible:ring-primary"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Status Field */}
                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-3 space-y-0 md:col-span-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            className="data-[state=checked]:bg-primary"
                                        />
                                    </FormControl>
                                    <FormLabel className="text-sm font-medium leading-none">
                                        Active Customer
                                    </FormLabel>
                                    <FormDescription className="text-sm text-muted-foreground">
                                        {field.value ? "This customer is active" : "This customer is inactive"}
                                    </FormDescription>
                                </FormItem>
                            )}
                        />

                        {/* Submit Button */}
                        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
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
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
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