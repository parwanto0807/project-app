"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import {
    PDFDownloadLink,
    PDFViewer,
} from '@react-pdf/renderer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import BalanceSheetPDF, { BalanceSheetData } from './BalanceSheetPDF';

interface BalanceSheetPDFButtonProps {
    data: BalanceSheetData;
    snapshotDate: string;
    logoSrc?: string;
}

const BalanceSheetPDFButton = ({ data, snapshotDate, logoSrc }: BalanceSheetPDFButtonProps) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const dateSlug = new Date(snapshotDate).toISOString().split('T')[0];
    const fileName = `Balance-Sheet-${dateSlug}.pdf`;

    if (!isMounted) {
        return (
            <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled className="gap-2 border-slate-300">
                    <Download className="w-4 h-4" />
                    Memuat...
                </Button>
                <Button variant="outline" size="sm" disabled className="gap-2 border-slate-300">
                    <Printer className="w-4 h-4" />
                    Preview
                </Button>
            </div>
        );
    }

    // Generate a unique key to force re-mounting when data or date changes
    const pdfKey = `${snapshotDate}-${data.assets.total}-${data.totalLiabilitiesAndEquity}-${data.checks.isBalanced}`;

    const PDFDoc = <BalanceSheetPDF data={data} snapshotDate={snapshotDate} logoSrc={logoSrc} />;

    return (
        <div className="flex gap-2">
            {/* Tombol Download PDF */}
            <PDFDownloadLink
                key={`download-${pdfKey}`}
                document={PDFDoc}
                fileName={fileName}
            >
                {({ loading }) => (
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        className="gap-2 border-slate-300 hover:bg-slate-50"
                    >
                        <Download className="w-4 h-4" />
                        {loading ? 'Menyiapkan...' : 'Download PDF'}
                    </Button>
                )}
            </PDFDownloadLink>

            {/* Tombol Preview PDF */}
            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-slate-300 hover:bg-slate-50"
                    >
                        <Printer className="w-4 h-4" />
                        Preview PDF
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="flex justify-between items-center pr-8">
                            <span>Preview Laporan Neraca</span>
                            <span className="text-sm font-normal text-slate-500">
                                Per: {new Date(snapshotDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 h-full min-h-[500px] border rounded-lg overflow-hidden">
                        <PDFViewer key={`viewer-${pdfKey}`} width="100%" height="100%" showToolbar={true} className="border-0">
                            {PDFDoc}
                        </PDFViewer>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BalanceSheetPDFButton;
