// hooks/usePdfGenerator.ts
import { useState } from 'react';

export const usePdfGenerator = () => {
    const [isGenerating, setIsGenerating] = useState(false);

    const generateStockBalancePdf = async (data: {
        warehouseId: string;
        period: { start: Date; end: Date };
        companyInfo: any;
    }) => {
        setIsGenerating(true);
        try {
            const response = await fetch('/api/reports/stock-balance/pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to generate PDF');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `stock-balance-${new Date().getTime()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Gagal menghasilkan PDF. Silakan coba lagi.');
        } finally {
            setIsGenerating(false);
        }
    };

    const generateStockCardPdf = async (data: {
        productId: string;
        warehouseId: string;
        period: { start: Date; end: Date };
        companyInfo: any;
    }) => {
        setIsGenerating(true);
        try {
            const response = await fetch('/api/reports/stock-card/pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to generate PDF');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `kartu-stock-${new Date().getTime()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Gagal menghasilkan PDF. Silakan coba lagi.');
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        isGenerating,
        generateStockBalancePdf,
        generateStockCardPdf,
    };
};