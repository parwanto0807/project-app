"use client";

import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { FileDown, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GeneralLedgerSummary } from '@/types/glSummary';
import GeneralLedgerSummaryPDF from './GeneralLedgerSummaryPDF';

interface GeneralLedgerSummaryPDFGeneratorProps {
    data: GeneralLedgerSummary[];
    logoSrc?: string;
    fileName?: string;
    period?: string;
    date?: string;
}

const GeneralLedgerSummaryPDFGenerator: React.FC<GeneralLedgerSummaryPDFGeneratorProps> = ({
    data,
    logoSrc = '/logo.png',
    fileName,
    period = "January 2026 (01-2026)",
    date
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [actionType, setActionType] = useState<'open' | 'download' | null>(null);

    const handlePDFAction = async (action: 'open' | 'download') => {
        if (!data || data.length === 0) {
            alert('Tidak ada data summary untuk di-generate PDF');
            return;
        }

        setIsGenerating(true);
        setActionType(action);

        try {
            // Generate PDF
            const blob = await pdf(
                <GeneralLedgerSummaryPDF
                    data={data}
                    logoSrc={logoSrc}
                    period={period}
                    date={date}
                />
            ).toBlob();

            const pdfUrl = URL.createObjectURL(blob);
            const generatedFileName = fileName || `GL-Summary-${period.replace(/\s+/g, '-')}.pdf`;

            if (action === 'open') {
                // Open in new tab
                window.open(pdfUrl, '_blank');
            } else {
                // Download
                const link = document.createElement('a');
                link.href = pdfUrl;
                link.download = generatedFileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            // Cleanup
            setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Gagal memproses PDF. Silakan coba lagi.');
        } finally {
            setIsGenerating(false);
            setActionType(null);
        }
    };

    return (
        <div className="flex gap-2">
            <Button
                onClick={() => handlePDFAction('open')}
                disabled={isGenerating || !data || data.length === 0}
                variant="outline"
                size="sm"
                className="gap-2"
            >
                {isGenerating && actionType === 'open' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <ExternalLink className="h-4 w-4" />
                )}
                Buka PDF
            </Button>

            <Button
                onClick={() => handlePDFAction('download')}
                disabled={isGenerating || !data || data.length === 0}
                variant="outline"
                size="sm"
                className="gap-2"
            >
                {isGenerating && actionType === 'download' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <FileDown className="h-4 w-4" />
                )}
                Download PDF
            </Button>
        </div>
    );
};

export default GeneralLedgerSummaryPDFGenerator;