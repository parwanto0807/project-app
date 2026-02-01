"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/apiFetch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface CashAccount {
    id: string;
    code: string;
    name: string;
}

interface CreateCashOpnameDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function CreateCashOpnameDialog({ open, onOpenChange, onSuccess }: CreateCashOpnameDialogProps) {
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<CashAccount[]>([]);
    const [selectedCoaId, setSelectedCoaId] = useState("");
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [physicalAmount, setPhysicalAmount] = useState("");
    const [systemAmount, setSystemAmount] = useState(0);
    const [description, setDescription] = useState("");
    const [calculating, setCalculating] = useState(false);

    // Fetch Cash Accounts (Assets -> Cash & Bank)
    useEffect(() => {
        const fetchAccounts = async () => {
            // Find fetching logic for COA, assuming endpoint exists to filter by type or we fetch all and filter client side
            // Ideally: /api/coa?type=ASSET&isCash=true
            try {
                const data = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/coa/getAllCOA?type=ASSET`);
                if (data.success) {
                    // Filter client side for now if needed, or assume user knows which to pick
                    // For better UX, filters should be strict.
                    // Assuming backend doesn't support granulir filter yet, we just show all or filter by 'Cash' keyword if possible?
                    // Or just show all operational accounts.
                    setAccounts(data.data);
                }
            } catch (e) {
                console.error("Failed to fetch accounts", e);
            }
        };

        if (open) {
            fetchAccounts();
        }
    }, [open]);

    // Fetch System Balance when Coa or Date changes
    useEffect(() => {
        const fetchBalance = async () => {
            if (!selectedCoaId || !date) return;
            setCalculating(true);
            try {
                const data = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounting/cash-opname/balance?coaId=${selectedCoaId}&date=${date}`);
                if (data.success) {
                    setSystemAmount(Number(data.data.systemAmount));
                } else {
                    setSystemAmount(0);
                    toast.error(data.message || "Failed to fetch system balance");
                }
            } catch (error) {
                console.error(error);
                setSystemAmount(0);
            } finally {
                setCalculating(false);
            }
        };

        // Debounce or just run?
        const timer = setTimeout(() => {
            fetchBalance();
        }, 500);
        return () => clearTimeout(timer);

    }, [selectedCoaId, date]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCoaId || !physicalAmount) return;

        setLoading(true);
        try {
            const data = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounting/cash-opname`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    coaId: selectedCoaId,
                    date: new Date(date),
                    physicalAmount: Number(physicalAmount),
                    description,
                    status: 'POSTED' // Auto POST for now
                }),
            });

            if (data.success) {
                toast.success("Cash Opname berhasil dibuat");
                onSuccess();
                onOpenChange(false);
                // Reset form
                setSelectedCoaId("");
                setDate(format(new Date(), "yyyy-MM-dd"));
                setPhysicalAmount("");
                setDescription("");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setLoading(false);
        }
    };

    const difference = Number(physicalAmount || 0) - systemAmount;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Buat Cash Opname Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Akun Kas</Label>
                        <Select value={selectedCoaId} onValueChange={setSelectedCoaId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Akun Kas" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map((acc) => (
                                    <SelectItem key={acc.id} value={acc.id}>
                                        {acc.code} - {acc.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Tanggal Opname</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            max={format(new Date(), "yyyy-MM-dd")}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 border p-4 rounded-md bg-muted/50">
                        <div>
                            <Label className="text-xs text-muted-foreground">Saldo Sistem</Label>
                            <div className="font-semibold text-lg">
                                {calculating ? <Loader2 className="h-4 w-4 animate-spin" /> : formatCurrency(systemAmount)}
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Selisih</Label>
                            <div className={`font-semibold text-lg ${difference !== 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {formatCurrency(difference)}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Saldo Fisik (Hitungan Riil)</Label>
                        <Input
                            type="number"
                            value={physicalAmount}
                            onChange={(e) => setPhysicalAmount(e.target.value)}
                            placeholder="0"
                            min="0"
                            step="any"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Keterangan / Catatan</Label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Contoh: Selisih recehan..."
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={loading || calculating}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Opname
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
