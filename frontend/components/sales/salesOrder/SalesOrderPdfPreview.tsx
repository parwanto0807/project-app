"use client";

import React from "react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import { Download, FileText, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SalesOrderPDF, SalesOrderPDFProps, buildHppSummary, HppSourceSpk } from "./SalesOrderPDF";

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
    spk?: HppSourceSpk[];
}

export default function SalesOrderPdfPreview({ formData }: { formData: SalesOrderFormData }) {
    const pdfData: SalesOrderPDFProps["data"] = mapFormToPdfData(formData);
    const [isGenerating, setIsGenerating] = React.useState<"print" | "download" | null>(null);

    const generateBlob = () => pdf(<SalesOrderPDF data={pdfData} />).toBlob();

    const handlePrint = async () => {
        try {
            setIsGenerating("print");
            const blob = await generateBlob();
            const url = URL.createObjectURL(blob);
            const win = window.open(url);
            win?.print();
        } catch (error) {
            console.error("Error printing PDF:", error);
        } finally {
            setIsGenerating(null);
        }
    };

    const handleDownload = async () => {
        try {
            setIsGenerating("download");
            const blob = await generateBlob();
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `SalesOrder_${formData.soNumber || new Date().toISOString().slice(0, 10)}.pdf`;
            a.click();

            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            console.error("Error downloading PDF:", error);
        } finally {
            setIsGenerating(null);
        }
    };

    return (
        <div className="flex h-full flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-sm shadow-green-500/30">
                        <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold leading-tight">
                                Pratinjau Sales Order
                            </h3>
                            <Badge variant="secondary" className="hidden font-mono text-[10px] sm:inline-flex">
                                {formData.soNumber}
                            </Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                            {formData.customerName}
                            {formData.project?.name ? ` • ${formData.project.name}` : ""}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrint}
                        disabled={isGenerating !== null}
                        className="cursor-pointer gap-1.5"
                    >
                        {isGenerating === "print"
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Printer className="h-4 w-4" />}
                        Cetak
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleDownload}
                        disabled={isGenerating !== null}
                        className="cursor-pointer gap-1.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/30 hover:from-green-500 hover:to-emerald-600 dark:shadow-green-600/30"
                    >
                        {isGenerating === "download"
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Download className="h-4 w-4" />}
                        Unduh PDF
                    </Button>
                </div>
            </div>

            {/* PDF Viewer */}
            <div className="min-h-[420px] flex-1 bg-slate-200/70 p-3 dark:bg-slate-950">
                <PDFViewer
                    width="100%"
                    height="100%"
                    className="h-full rounded-md border shadow-sm"
                    style={{ minHeight: "60vh" }}
                >
                    <SalesOrderPDF data={pdfData} />
                </PDFViewer>
            </div>
        </div>
    );
}

// Mapper function untuk mengubah data form menjadi data PDF
function mapFormToPdfData(formData: SalesOrderFormData): SalesOrderPDFProps["data"] {
    return {
        soNumber: formData.soNumber || "",
        soDate: formData.soDate,
        customerName: formData.customerName || "N/A",
        branch: formData.branch || "",
        location: formData.location || "",
        projectName: formData.project?.name || formData.projectId || "N/A",
        customerPIC: formData.customerPIC || "",
        notes: formData.notes || null,
        type: formData.type || "REGULAR",
        status: formData.status,
        createdBy: formData.userId || "",
        hpp: buildHppSummary(formData.spk),
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
