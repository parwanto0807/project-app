"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import CashFlowPDF from './CashFlowPDF';
import { CashFlowData } from './CashFlowTable';

interface CashFlowPDFButtonProps {
    data: CashFlowData;
    period: { startDate: string; endDate: string };
    logoSrc?: string;
}

export default function CashFlowPDFButton({ data, period, logoSrc }: CashFlowPDFButtonProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <Button variant="outline" disabled className="gap-2">
                <Download className="w-4 h-4" />
                Download PDF
            </Button>
        );
    }

    // Generate a unique key to force re-mounting when data changes
    // This prevents React-PDF reconciler internal errors (like "Ro is not a function")
    const pdfKey = `${period.startDate}-${period.endDate}-${data.netChange}-${data.beginningBalance}`;

    return (
        <PDFDownloadLink
            key={pdfKey}
            document={<CashFlowPDF data={data} period={period} logoSrc={logoSrc} />}
            fileName={`Laporan_Arus_Kas_${period.startDate}_${period.endDate}.pdf`}
        >
            {({ loading }) => (
                <Button
                    variant="outline"
                    className="border-slate-300 gap-2 h-10 shadow-sm hover:bg-slate-50"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
                            <span>Memproses...</span>
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4 text-cyan-600" />
                            <span>Unduh PDF</span>
                        </>
                    )}
                </Button>
            )}
        </PDFDownloadLink>
    );
}
