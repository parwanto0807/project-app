"use client";

import { PDFViewer, pdf } from "@react-pdf/renderer";
import { SalesOrderPDF, SalesOrderPDFProps } from "./SalesOrderPDF";
import { Button } from "@/components/ui/button";

type Customer = {
    id: string
    name: string
    address?: string
    branch?: string
    location?: string
    customerPIC?: string
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
    soNumber: string;
    soDate: Date | null;
    customerId: string;
    customerName: string;
    projectId: string;
    userId: string;
    type: "REGULAR" | "SUPPORT";
    status: string;
    currency: string;
    notes?: string | null;
    isTaxInclusive: boolean;
    items: SalesOrderFormItem[];
    documents?: { name: string; url: string }[];
    customer?: Customer;
    project?: Project;
    branch?: string;
    location?: string;
    customerPIC?: string;
    createdBy?: string;
}

export default function SalesOrderPdfPreview({ formData }: { formData: SalesOrderFormData }) {
    const pdfData: SalesOrderPDFProps["data"] = mapFormToPdfData(formData);
    console.log("Mapped PDF Data:", pdfData);

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
        a.download = `SalesOrder_${formData.soNumber || new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
    };

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Pratinjau Sales Order</h2>
                <div className="flex gap-2">
                    <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
                        <i className="fas fa-print mr-2"></i> Cetak
                    </Button>
                    <Button onClick={handleDownload} variant="secondary" className="bg-green-600 hover:bg-green-700 text-white">
                        <i className="fas fa-download mr-2"></i> Unduh PDF
                    </Button>
                </div>
            </div>

            <PDFViewer width="100%" height="600" className="border border-gray-300 rounded-md">
                <SalesOrderPDF data={pdfData} />
            </PDFViewer>
        </div>
    );
}

// Mapper function untuk mengubah data form menjadi data PDF
function mapFormToPdfData(formData: SalesOrderFormData): SalesOrderPDFProps["data"] {
    return {
        soNumber: formData.soNumber || "",
        soDate: formData.soDate,
        customerName: formData.customerName || "N/A",   // pakai field langsung
        branch: formData.branch || "",                  // pakai field langsung
        location: formData.location || "",
        projectName: formData.project?.name || formData.projectId || "N/A",
        customerPIC: formData.customerPIC || "",
        notes: formData.notes || null,
        type: formData.type || "REGULAR",
        createdBy: formData.userId || "",
        items: formData.items?.map((item) => ({
            itemType: item.itemType,
            productId: item.productId || null,
            name: item.name || "N/A",
            description: item.description || null,
            uom: item.uom || null,
            qty: item.qty || 0,
            unitPrice: item.unitPrice || 0,
            discount: item.discount || 0,
            taxRate: item.taxRate || 0,
        })) || []
    };
}
