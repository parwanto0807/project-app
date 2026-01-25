"use client";

import React from 'react';
import { pdf } from '@react-pdf/renderer';
import GeneralLedgerPDF from './GeneralLedgerPDF';
import { FileSearch, Loader2 } from 'lucide-react';
import { Ledger } from '@/schemas/accounting/ledger';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface GeneralLedgerPDFGeneratorProps {
    data: Ledger[];
    logoSrc?: string;
    fileName?: string;
    period?: string;
    globalStats?: {
        totalTransactions: number;
        totalDebit: number;
        totalCredit: number;
        balancedCount: number;
    };
    periodId?: string;
    search?: string;
}

const GeneralLedgerPDFGenerator: React.FC<GeneralLedgerPDFGeneratorProps> = ({
    data,
    logoSrc = '/logo.png',
    fileName,
    period = "January 2026 (01-2026)",
    globalStats,
    periodId,
    search
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleOpenPreview = async () => {
        setIsGenerating(true);
        try {
            let pdfData = data;

            // Fetch all data if periodId is provided
            if (periodId) {
                const { getGeneralLedgerLines } = await import("@/lib/action/accounting/ledger");
                const result = await getGeneralLedgerLines({
                    periodId,
                    search: search || undefined,
                    page: 1,
                    limit: 5000
                });

                if (result.success && result.data.length > 0) {
                    pdfData = result.data;
                }
            }

            const doc = (
                <GeneralLedgerPDF
                    data={pdfData}
                    logoSrc={logoSrc}
                    period={period}
                    globalStats={globalStats}
                />
            );
            const blob = await pdf(doc).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            console.error("Error generating PDF:", err);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            onClick={handleOpenPreview}
            disabled={isGenerating || data.length === 0}
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
        >
            {isGenerating ? (
                <>
                    <Loader2 size={18} className="animate-spin" />
                    Memproses...
                </>
            ) : (
                <>
                    <FileSearch size={18} />
                    View General Ledger PDF
                </>
            )}
        </Button>
    );
};

export default GeneralLedgerPDFGenerator;