import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Printer } from 'lucide-react';
import { ChartOfAccountsWithRelations } from '@/types/coa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface ChartOfAccountsPDFGeneratorProps {
    data: ChartOfAccountsWithRelations[];
}

const ChartOfAccountsPDFGenerator = ({ data }: ChartOfAccountsPDFGeneratorProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const generatePDF = (preview: boolean = false) => {
        try {
            setIsLoading(true);
            const doc = new jsPDF('landscape');
            
            // Set up document metadata
            doc.setProperties({
                title: 'Chart of Accounts',
                subject: 'Chart of Accounts Data',
                author: 'System',
                keywords: 'coa, accounting, finance',
                creator: 'System'
            });

            // Header
            doc.setFontSize(16);
            doc.text('Chart of Accounts', 14, 20);
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${format(new Date(), "dd MMM yyyy HH:mm")}`, 14, 28);
            
            doc.text(`Total Accounts: ${data.length}`, 14, 34);

            // Table setup
            const tableColumn = [
                "Code", 
                "Account Name", 
                "Type", 
                "Normal Balance", 
                "Posting Type", 
                "Cashflow Type", 
                "Status", 
                "Reconcilable"
            ];

            // Map data to table rows
            const tableRows = data.map(coa => {
                // Determine indent prefix based on parent relationship
                const prefix = coa.postingType === "POSTING" ? "  - " : "";
                
                return [
                    coa.code,
                    prefix + coa.name,
                    coa.type,
                    coa.normalBalance,
                    coa.postingType,
                    coa.cashflowType !== "NONE" ? coa.cashflowType : "-",
                    coa.status,
                    coa.isReconcilable ? "Yes" : "No"
                ];
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 40,
                styles: { 
                    fontSize: 8,
                    cellPadding: 3,
                },
                headStyles: {
                    fillColor: [59, 130, 246], // Blue-500
                    textColor: 255,
                    fontStyle: 'bold',
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252] // Slate-50
                },
                didParseCell: function(data) {
                    // Make header rows bold
                    if (data.section === 'body') {
                        const rowData = data.row.raw as string[];
                        if (rowData[4] === "HEADER") { // Posting type is HEADER
                            data.cell.styles.fontStyle = 'bold';
                            data.cell.styles.fillColor = [224, 242, 254]; // Sky-100
                        }
                    }
                }
            });

            if (preview) {
                // Preview PDF in new tab
                window.open(doc.output('bloburl'), '_blank');
            } else {
                // Save PDF
                const fileName = `Chart-of-Accounts-${format(new Date(), "yyyy-MM-dd")}.pdf`;
                doc.save(fileName);
            }
            
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-1.5">
            <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-gray-600 border-gray-300 hover:bg-gray-50 flex items-center gap-2"
                onClick={() => generatePDF(true)}
                disabled={isLoading}
            >
                {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <Printer className="h-3.5 w-3.5 text-blue-500" />
                )}
                <span className="hidden md:inline text-xs md:text-sm font-medium">
                    {isLoading ? 'Preparing...' : 'Preview PDF'}
                </span>
            </Button>
            
            <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-gray-600 border-gray-300 hover:bg-gray-50 flex items-center gap-2"
                onClick={() => generatePDF(false)}
                disabled={isLoading}
            >
                {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <FileText className="h-3.5 w-3.5 text-red-500" />
                )}
                <span className="hidden md:inline text-xs md:text-sm font-medium">
                    {isLoading ? 'Preparing...' : 'Download PDF'}
                </span>
            </Button>
        </div>
    );
};

export default ChartOfAccountsPDFGenerator;
