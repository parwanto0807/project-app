"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Download, FileText, Printer } from "lucide-react";
import { format } from "date-fns";

interface AssetRegisterReportProps {
    assets: any[];
    isOpen: boolean;
    onClose: () => void;
}

export function AssetRegisterReport({ assets, isOpen, onClose }: AssetRegisterReportProps) {
    const handleExportCSV = () => {
        const headers = ["Code", "Name", "Category", "Acquisition Date", "Cost", "Accum. Deprec", "Book Value", "Status"];
        const rows = assets.map(a => [
            a.assetCode,
            `"${a.name}"`,
            a.category?.name,
            format(new Date(a.acquisitionDate), "yyyy-MM-dd"),
            a.acquisitionCost,
            a.totalDepreciation,
            a.bookValue,
            a.status
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Asset_Register_${format(new Date(), "yyyyMMdd")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[95%] lg:max-w-[1000px] max-h-[90vh] flex flex-col">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle>Asset Register Report</DialogTitle>
                        <DialogDescription>
                            Daftar lengkap aset tetap per tanggal {format(new Date(), "dd MMMM yyyy")}.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex gap-2 mb-4">
                    <Button variant="outline" size="sm" onClick={handleExportCSV}>
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer className="h-3.5 w-3.5 mr-1.5" />
                        Print View
                    </Button>
                </div>

                <div className="flex-1 overflow-auto border rounded-lg bg-white">
                    <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                            <TableRow>
                                <TableHead className="text-[10px] uppercase font-bold text-slate-500">Code</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold text-slate-500">Asset Name</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold text-slate-500">Acq. Date</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold text-slate-500 text-right">Cost</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold text-slate-500 text-right">Accum. Deprec</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold text-slate-500 text-right">Book Value</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold text-slate-500">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assets.map((asset) => (
                                <TableRow key={asset.id} className="text-xs h-8">
                                    <TableCell className="font-mono">{asset.assetCode}</TableCell>
                                    <TableCell className="font-medium">{asset.name}</TableCell>
                                    <TableCell>{format(new Date(asset.acquisitionDate), "dd/MM/yyyy")}</TableCell>
                                    <TableCell className="text-right">Rp{parseFloat(asset.acquisitionCost).toLocaleString('id-ID')}</TableCell>
                                    <TableCell className="text-right text-rose-600">Rp{parseFloat(asset.totalDepreciation).toLocaleString('id-ID')}</TableCell>
                                    <TableCell className="text-right font-bold text-emerald-700">Rp{parseFloat(asset.bookValue).toLocaleString('id-ID')}</TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            "capitalize px-1.5 py-0.5 rounded text-[10px] font-medium",
                                            asset.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                                        )}>
                                            {asset.status.toLowerCase()}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
