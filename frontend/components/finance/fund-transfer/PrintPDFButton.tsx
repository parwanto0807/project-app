"use client";

import React, { useState } from 'react';
import { BlobProvider } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { FundTransfer } from '@/types/finance/fundTransfer';
import FundTransferVoucherPDF from './FundTransferVoucherPDF';

interface PrintPDFButtonProps {
    transfer: FundTransfer;
}

const PrintPDFButton = ({ transfer }: PrintPDFButtonProps) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleOpenInNewTab = (blob: Blob | null) => {
        if (blob) {
            // Buat URL dari blob
            const pdfUrl = URL.createObjectURL(blob);

            // Buka di tab baru
            window.open(pdfUrl, '_blank');

            // Cleanup URL setelah beberapa detik
            setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);

            setIsGenerating(false);
        }
    };

    return (
        <BlobProvider
            document={<FundTransferVoucherPDF data={transfer} />}
        >
            {({ blob, loading, error }) => {
                // Error handling
                if (error) {
                    console.error('PDF generation error:', error);
                    return (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100 transition-all hover:scale-110 shadow-sm"
                            onClick={() => alert('Gagal generate PDF. Silakan coba lagi.')}
                        >
                            <Printer className="h-4 w-4" />
                        </Button>
                    );
                }

                return (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100 transition-all hover:scale-110 shadow-sm"
                        onClick={() => {
                            if (loading || isGenerating) return;

                            setIsGenerating(true);
                            if (blob) {
                                handleOpenInNewTab(blob);
                            }
                        }}
                        disabled={loading || isGenerating}
                    >
                        {loading || isGenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Printer className="h-4 w-4" />
                        )}
                    </Button>
                );
            }}
        </BlobProvider>
    );
};

export default PrintPDFButton;