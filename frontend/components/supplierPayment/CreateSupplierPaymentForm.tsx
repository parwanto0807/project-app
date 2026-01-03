"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";

export default function CreateSupplierPaymentForm() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    <CardTitle>Create Supplier Payment</CardTitle>
                </div>
                <CardDescription>
                    Record a new payment to supplier and allocate to invoices
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Receipt className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Form Component Coming Soon</p>
                    <p className="text-sm">This form will allow you to create payments with invoice allocations</p>
                </div>
            </CardContent>
        </Card>
    );
}
