"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { SupplierInvoice } from "@/types/supplierInvoice";

interface UpdateSupplierInvoiceFormProps {
    invoice: SupplierInvoice;
}

export default function UpdateSupplierInvoiceForm({ invoice }: UpdateSupplierInvoiceFormProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle>Update Supplier Invoice</CardTitle>
                </div>
                <CardDescription>
                    Update invoice {invoice.invoiceNumber}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <FileText className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Form Component Coming Soon</p>
                    <p className="text-sm">This form will allow you to update supplier invoice details</p>
                </div>
            </CardContent>
        </Card>
    );
}
