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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { bulkCreateAssets } from "@/lib/action/accounting/asset";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

interface BulkUploadDialogProps {
    categories: any[];
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function BulkUploadDialog({ categories, isOpen, onClose, onSuccess }: BulkUploadDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [csvData, setCsvData] = useState("");
    const [previewData, setPreviewData] = useState<any[]>([]);

    const handleParse = () => {
        try {
            const lines = csvData.trim().split("\n");
            if (lines.length < 2) return toast.error("CSV minimal harus berisi header dan 1 baris data");

            const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
            const data = lines.slice(1).map(line => {
                const values = line.split(",").map(v => v.trim());
                const obj: any = {};
                headers.forEach((header, i) => {
                    obj[header] = values[i];
                });

                // Find category ID by name if category_name is provided
                if (obj.category_name) {
                    const cat = categories.find(c => c.name.toLowerCase() === obj.category_name.toLowerCase());
                    if (cat) obj.categoryId = cat.id;
                }

                return obj;
            });

            setPreviewData(data);
        } catch (error) {
            toast.error("Gagal memproses CSV. Pastikan format benar (pemisah koma)");
        }
    };

    const handleUpload = async () => {
        if (previewData.length === 0) return;

        const invalid = previewData.some(a => !a.categoryId || !a.name || !a.acquisitioncost);
        if (invalid) return toast.error("Beberapa baris data tidak valid (cek ID Kategori atau Nama)");

        setIsLoading(true);
        try {
            const assets = previewData.map(a => ({
                name: a.name,
                categoryId: a.categoryId,
                acquisitionDate: a.acquisitiondate || new Date().toISOString().split('T')[0],
                acquisitionCost: a.acquisitioncost,
                usefulLife: a.usefullife || 5,
                salvageValue: a.salvagevalue || 0,
                location: a.location,
                serialNumber: a.serialnumber,
                description: a.description
            }));

            await bulkCreateAssets(assets);
            toast.success(`${assets.length} aset berhasil diunggah.`);
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Gagal mengunggah aset");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Bulk Upload Assets</DialogTitle>
                    <DialogDescription>
                        Tempel data CSV (header: name, category_name, acquisitiondate, acquisitioncost, usefullife)
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
                    <div className="space-y-2">
                        <Label>CSV Content (Comma Separated)</Label>
                        <Textarea
                            placeholder="name,category_name,acquisitiondate,acquisitioncost,usefullife&#10;Laptop Dell,Elektronik,2024-01-01,15000000,3"
                            value={csvData}
                            onChange={(e) => setCsvData(e.target.value)}
                            className="font-mono text-xs h-32"
                        />
                        <Button variant="secondary" size="sm" onClick={handleParse} className="w-full">
                            Preview Data
                        </Button>
                    </div>

                    {previewData.length > 0 && (
                        <div className="flex-1 overflow-auto border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Cost</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData.map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="py-2">{row.name}</TableCell>
                                            <TableCell className="py-2">
                                                {row.categoryId ? row.category_name : <span className="text-rose-500 italic">Not Found</span>}
                                            </TableCell>
                                            <TableCell className="py-2">{row.acquisitiondate}</TableCell>
                                            <TableCell className="py-2">{row.acquisitioncost}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        disabled={isLoading || previewData.length === 0}
                        onClick={handleUpload}
                    >
                        {isLoading ? "Uploading..." : `Upload ${previewData.length} Assets`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
