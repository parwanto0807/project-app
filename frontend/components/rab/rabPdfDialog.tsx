// components/SimpleRABPdfDialog.tsx
"use client";

import React from "react";
import { Document, PDFViewer } from "@react-pdf/renderer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RABPdfPreview from "./rabPdfPreview";
import { RAB } from "@/types/rab";
import { DialogDescription } from "@radix-ui/react-dialog";

interface SimpleRABPdfDialogProps {
    rab: RAB | null; // bisa null dulu
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const SimpleRABPdfDialog: React.FC<SimpleRABPdfDialogProps> = ({ rab, open, onOpenChange }) => {
    if (!rab) return null; // kalau belum ada data, jangan render PDFViewer

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl w-[90vw] h-[90vh] p-0">
                <DialogHeader className="px-4 pt-4">
                    <DialogTitle className="text-center">Preview RAB PDF</DialogTitle>
                    <DialogDescription className="text-xs text-gray-500">
                        Preview dokumen RAB. Pastikan semua data terlihat dengan benar sebelum dicetak.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 h-[80vh]">
                    <PDFViewer width="100%" height="100%">
                        <Document>
                            <RABPdfPreview rab={rab} />
                        </Document>
                    </PDFViewer>
                </div>
            </DialogContent>
        </Dialog>

    );
};

export default SimpleRABPdfDialog;
