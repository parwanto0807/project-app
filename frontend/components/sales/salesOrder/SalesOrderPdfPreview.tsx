"use client";

import { PDFViewer, pdf} from "@react-pdf/renderer";
import { SalesOrderPDF, SalesOrderPDFProps } from "./SalesOrderPDF";
import { Button } from "@/components/ui/button";

type Customer = {
    id: string
    name: string
}

type Project = {
    id: string
    name: string
}


export interface SalesOrderFormItem {
    itemType: "PRODUCT" | "SERVICE" | "CUSTOM";
    productId?: string | null;
    name: string;
    description: string | null;
    uom: string | null;
    qty: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
}

export interface SalesOrderFormData {
    soDate: Date | null;
    customerId: string;
    projectId: string;
    userId: string;
    type: "REGULAR" | "SUPPORT";
    status:
    | "DRAFT"
    | "SENT"
    | "CONFIRMED"
    | "IN_PROGRESS"
    | "FULFILLED"
    | "PARTIALLY_INVOICED"
    | "INVOICED"
    | "PARTIALLY_PAID"
    | "PAID"
    | "CANCELLED";
    currency: string;
    notes?: string | null;
    isTaxInclusive: boolean;
    items: SalesOrderFormItem[];
    documents?: { name: string; url: string }[];
    customer?: Customer;
    project?: Project;
}


export default function SalesOrderPdfPreview({ formData }: { formData: SalesOrderFormData }) {
    const pdfData: SalesOrderPDFProps["data"] = mapFormToPdfData(formData);

    const handlePrint = async () => {
        const blob = await pdf(<SalesOrderPDF data={pdfData} />).toBlob();
        const url = URL.createObjectURL(blob);
        const win = window.open(url);
        win?.print();
    };

    const handleDownload = async () => {
        const blob = await pdf(<SalesOrderPDF data={pdfData} />).toBlob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "SalesOrder.pdf";
        a.click();
    };

    return (
        <div className="flex flex-col gap-4">
            <PDFViewer width="100%" height="600">
                <SalesOrderPDF data={pdfData} />
            </PDFViewer>

            <div className="flex gap-2">
                <Button onClick={handlePrint}>Print</Button>
                <Button onClick={handleDownload} variant="secondary">
                    Download
                </Button>
            </div>
        </div>
    );
}

// mapper function dipindah ke bawah file
function mapFormToPdfData(formData: SalesOrderFormData): SalesOrderPDFProps["data"] {
    return {
        soDate: formData.soDate ?? null,
        customerName: formData.customer?.name ?? formData.customerId ?? "N/A",
        projectName: formData.project?.name ?? formData.projectId ?? "N/A",
        notes: formData.notes ?? null,
        items: formData.items?.map((item) => ({
            itemType: item.itemType,
            productId: item.productId ?? null, // ✅ undefined jadi null
            name: item.name ?? "N/A",
            description: item.description ?? null,
            uom: item.uom ?? null,
            qty: item.qty ?? 0,
            unitPrice: item.unitPrice ?? 0,
            discount: item.discount ?? 0,
            taxRate: item.taxRate ?? 0,
        })) ?? []
    };
}

