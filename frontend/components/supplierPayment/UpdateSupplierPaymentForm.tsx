"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { SupplierPayment } from "@/types/supplierInvoice";

interface UpdateSupplierPaymentFormProps {
    payment: SupplierPayment;
}

export default function UpdateSupplierPaymentForm({ payment }: UpdateSupplierPaymentFormProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    <CardTitle>Update Supplier Payment</CardTitle>
                </div>
                <CardDescription>
                    Update payment {payment.paymentNumber}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Receipt className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Form Component Coming Soon</p>
                    <p className="text-sm">This form will allow you to update supplier payment details</p>
                </div>
            </CardContent>
        </Card>
    );
}
