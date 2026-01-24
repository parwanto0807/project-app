"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import {
    PDFDownloadLink,
    PDFViewer,
} from '@react-pdf/renderer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import IncomeStatementPDF from './IncomeStatementPDF';
import { IncomeStatementData } from './IncomeStatementTable';

interface IncomeStatementPDFButtonProps {
    data: IncomeStatementData;
    period: {
        startDate: string;
        endDate: string;
    };
    logoSrc?: string;
    salesOrderName?: string;
}

const IncomeStatementPDFButton = ({ data, period, logoSrc, salesOrderName }: IncomeStatementPDFButtonProps) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const fileName = `Income-Statement-${new Date(period.startDate).toISOString().split('T')[0]}-to-${new Date(period.endDate).toISOString().split('T')[0]}.pdf`;

    if (!isMounted) {
        return (
            <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled className="gap-2">
                    <Download className="w-4 h-4" />
                    Memuat...
                </Button>
                <Button variant="outline" size="sm" disabled className="gap-2">
                    <Printer className="w-4 h-4" />
                    Preview
                </Button>
            </div>
        );
    }

    // Generate a unique key to force re-mounting when data or filters change
    // This prevents React-PDF reconciler internal errors (like "Eo is not a function")
    const pdfKey = `${period.startDate}-${period.endDate}-${salesOrderName || 'all'}-${data.revenue.total}-${data.netProfit}`;

    return (
        <div className="flex gap-2">
            {/* Tombol Download PDF */}
            <PDFDownloadLink
                key={`download-${pdfKey}`}
                document={<IncomeStatementPDF data={data} period={period} logoSrc={logoSrc} salesOrderName={salesOrderName} />}
                fileName={fileName}
            >
                {({ loading }) => (
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        className="gap-2"
                    >
                        <Download className="w-4 h-4" />
                        {loading ? 'Menyiapkan PDF...' : 'Download PDF'}
                    </Button>
                )}
            </PDFDownloadLink>

            {/* Tombol Preview PDF */}
            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                    >
                        <Printer className="w-4 h-4" />
                        Preview PDF
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Preview Laporan Laba Rugi</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 h-full min-h-[500px] border rounded-lg overflow-hidden">
                        <PDFViewer key={`viewer-${pdfKey}`} width="100%" height="100%" showToolbar={true} className="border-0">
                            <IncomeStatementPDF data={data} period={period} logoSrc={logoSrc} salesOrderName={salesOrderName} />
                        </PDFViewer>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <PDFDownloadLink
                            key={`modal-download-${pdfKey}`}
                            document={<IncomeStatementPDF data={data} period={period} logoSrc={logoSrc} salesOrderName={salesOrderName} />}
                            fileName={fileName}
                        >
                            {({ loading }) => (
                                <Button disabled={loading} className="gap-2">
                                    <Download className="w-4 h-4" />
                                    {loading ? 'Menyiapkan...' : 'Download PDF'}
                                </Button>
                            )}
                        </PDFDownloadLink>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default IncomeStatementPDFButton;