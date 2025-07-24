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
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { customerSchema } from "@/schemas";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function UpdateCustomerForm({
  customer,
}: {
  customer: CustomerFormValues & { id: string };
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer,
  });

  const onSubmit = async (data: CustomerFormValues) => {
    try {
      setIsSubmitting(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/master/customer/updateCustomer/${customer.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Gagal memperbarui customer");
      }

      toast.success("Customer berhasil diperbarui");
      router.push("/super-admin-area/master/customer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = [
    { name: "code", label: "Code", Icon: Tag },
    { name: "name", label: "Name", Icon: Building2 },
    { name: "email", label: "Email", Icon: Mail, type: "email" },
    { name: "phone", label: "Phone", Icon: Phone, type: "tel" },
    { name: "branch", label: "Branch", Icon: Landmark },
    { name: "city", label: "City", Icon: MapPin },
    { name: "province", label: "Province", Icon: MapPin },
    { name: "postalCode", label: "Postal Code", Icon: MapPin },
    { name: "taxNumber", label: "Tax Number", Icon: BookText },
    { name: "companyType", label: "Company Type", Icon: Building2 },
    { name: "contactPerson", label: "Contact Person", Icon: Contact2 },
    { name: "picPhone", label: "PIC Phone", Icon: Phone, type: "tel" },
    { name: "picEmail", label: "PIC Email", Icon: Mail, type: "email" },
  ];

  return (
    <Card className="max-w-4xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>Update Customer</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {fields.map(({ name, label, Icon, type = "text" }) => (
              <FormField
                key={name}
                control={form.control}
                name={name as keyof CustomerFormValues}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {label}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type={type}
                        value={typeof field.value === "string" || typeof field.value === "number" ? field.value : ""}
                        className="focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

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
                      {...field}
                      className="min-h-[80px] focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      {...field}
                      className="min-h-[100px] focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status Switch */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center gap-4 md:col-span-2 bg-muted p-4 rounded-md">
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
                  <FormDescription>
                    {field.value
                      ? "This customer is active"
                      : "This customer is inactive"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
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
                    Updating...
                  </>
                ) : (
                  "Update Customer"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
