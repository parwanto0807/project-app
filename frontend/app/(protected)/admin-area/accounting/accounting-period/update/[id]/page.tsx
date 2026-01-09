
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { getPeriodById, updatePeriod } from "@/lib/action/accounting/period";
import { UpdatePeriodSchema, UpdatePeriodFormValues } from "@/schemas/accounting/period";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function UpdateAccountingPeriodPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<UpdatePeriodFormValues>({
        resolver: zodResolver(UpdatePeriodSchema),
        defaultValues: {
            periodName: "",
        },
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const res = await getPeriodById(id);
                if (res.success && res.data) {
                    form.reset({
                        periodName: res.data.periodName,
                        startDate: new Date(res.data.startDate),
                        endDate: new Date(res.data.endDate),
                    });
                } else {
                    toast.error("Period not found");
                    router.push("/admin-area/accounting/accounting-period");
                }
            } catch (e) {
                toast.error("Failed to load period");
            } finally {
                setIsLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    async function onSubmit(data: UpdatePeriodFormValues) {
        try {
            const res = await updatePeriod(id, data);
            if (res.success) {
                toast.success("Accounting Period updated successfully");
                router.push("/admin-area/accounting/accounting-period");
            } else {
                toast.error(res.message || "Failed to update period");
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred");
        }
    }

    if (isLoading) {
        return (
            <AdminLayout title="Edit Accounting Period" role="admin">
                <div className="flex justify-center items-center h-screen">
                    <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Edit Accounting Period" role="admin">
            <div className="space-y-6 max-w-3xl mx-auto">
                <div className="flex items-center gap-4">
                    <Link href="/admin-area/accounting/accounting-period">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Edit Period</h1>
                        <p className="text-gray-500 text-sm">Update fiscal period details.</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Period Details</CardTitle>
                        <CardDescription>Edit the details for the accounting period.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    <FormField
                                        control={form.control}
                                        name="periodName"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>Period Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. January 2025" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="startDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Start Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value instanceof Date && !isNaN(field.value.getTime()) ? (
                                                                    format(field.value, "PPP")
                                                                ) : (
                                                                    <span>Pick a date</span>
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
                                        name="endDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>End Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value instanceof Date && !isNaN(field.value.getTime()) ? (
                                                                    format(field.value, "PPP")
                                                                ) : (
                                                                    <span>Pick a date</span>
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
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Link href="/admin-area/accounting/accounting-period">
                                        <Button variant="outline" type="button">Cancel</Button>
                                    </Link>
                                    <Button type="submit" disabled={form.formState.isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                                        {form.formState.isSubmitting && <span className="animate-spin mr-2">⏳</span>}
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
