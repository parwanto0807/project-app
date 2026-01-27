import React, { useState, useEffect } from 'react';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, ExternalLink } from 'lucide-react';
import ChartOfAccountsPDF from './ChartOfAccountsPDF';
import { ChartOfAccountsWithRelations } from '@/types/coa';

interface ChartOfAccountsPDFGeneratorProps {
    data: ChartOfAccountsWithRelations[];
}

const ChartOfAccountsPDFGenerator = ({ data }: ChartOfAccountsPDFGeneratorProps) => {
    const [isClient, setIsClient] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handlePreview = async () => {
        try {
            setIsPreviewLoading(true);
            const doc = <ChartOfAccountsPDF data={data} />;
            const asBlob = await pdf(doc).toBlob();
            const url = URL.createObjectURL(asBlob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Failed to generate PDF preview:", error);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    if (!isClient) return null;

    return (
        <div className="flex items-center gap-1.5">
            <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-gray-600 border-gray-300 hover:bg-gray-50 flex items-center gap-2"
                onClick={handlePreview}
                disabled={isPreviewLoading}
            >
                {isPreviewLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <ExternalLink className="h-3.5 w-3.5 text-blue-500" />
                )}
                <span className="hidden md:inline text-xs md:text-sm font-medium">
                    {isPreviewLoading ? 'Preparing...' : 'Preview PDF'}
                </span>
            </Button>

            <PDFDownloadLink
                document={<ChartOfAccountsPDF data={data} />}
                fileName={`Chart-of-Accounts-${new Date().toISOString().split('T')[0]}.pdf`}
            >
                {({ blob, url, loading, error }) => (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 text-gray-600 border-gray-300 hover:bg-gray-50 flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <FileText className="h-3.5 w-3.5 text-red-500" />
                        )}
                        <span className="hidden md:inline text-xs md:text-sm font-medium">
                            {loading ? 'Preparing...' : 'Download PDF'}
                        </span>
                    </Button>
                )}
            </PDFDownloadLink>
        </div>
    );
};

export default ChartOfAccountsPDFGenerator;
