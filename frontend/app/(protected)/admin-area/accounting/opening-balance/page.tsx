"use client";

import { useEffect, useState, useCallback } from "react";
import {
    getOpeningBalances,
    getOpeningBalanceById,
    createOpeningBalance,
    updateOpeningBalance,
    deleteOpeningBalance,
    postOpeningBalance
} from "@/lib/action/accounting/openingBalance";
import { OpeningBalance } from "@/types/openingBalance";
import { TabelOpeningBalance } from "@/components/accounting/TabelOpeningBalance";
import { OpeningBalanceDialog } from "@/components/accounting/OpeningBalanceDialog";
import { OpeningBalanceDetailSheet } from "@/components/accounting/OpeningBalanceDetailSheet";
import { OpeningBalanceFormValues } from "@/schemas/accounting/openingBalance";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Plus,
    RefreshCw,
    Search,
    Download,
    Wallet,
    TrendingUp,
    ShieldCheck,
    AlertTriangle,
    Send,
    ShieldAlert,
    Lock,
    CheckCircle2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import HeaderCard from "@/components/ui/header-card";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function OpeningBalancePage() {
    const [data, setData] = useState<OpeningBalance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedOb, setSelectedOb] = useState<OpeningBalance | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // View Details State
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [viewData, setViewData] = useState<OpeningBalance | null>(null);

    const fetchData = useCallback(async (query: string = "") => {
        setIsLoading(true);
        try {
            const result = await getOpeningBalances(query);
            setData(result.data);
            setPagination(result.pagination);
        } catch (error) {
            toast.error("Gagal memuat data saldo awal");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData(`?search=${searchTerm}`);
    };

    const handleCreate = async (values: OpeningBalanceFormValues) => {
        setIsSubmitting(true);
        try {
            if (selectedOb) {
                await updateOpeningBalance(selectedOb.id, values);
                toast.success("Saldo awal berhasil diperbarui");
            } else {
                await createOpeningBalance(values);
                toast.success("Saldo awal baru berhasil disimpan sebagai draft");
            }
            setIsDialogOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Gagal menyimpan saldo awal");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus draft saldo awal ini?")) return;
        try {
            await deleteOpeningBalance(id);
            toast.success("Draft berhasil dihapus");
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const [postDialogOpen, setPostDialogOpen] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

    const handlePostClick = (id: string) => {
        setSelectedPostId(id);
        setPostDialogOpen(true);
    };

    const handlePostConfirm = async () => {
        if (!selectedPostId) return;

        try {
            const result = await postOpeningBalance(selectedPostId);
            toast.success(
                result.ledgerNumber
                    ? `Berhasil! Saldo awal telah diposting ke Ledger dengan nomor: ${result.ledgerNumber}`
                    : "Berhasil! Saldo awal telah diposting ke Ledger"
            );
            fetchData();
            setPostDialogOpen(false);
            setSelectedPostId(null);
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleEdit = async (ob: OpeningBalance) => {
        setIsLoading(true);
        try {
            const fullData = await getOpeningBalanceById(ob.id);
            setSelectedOb(fullData);
            setIsDialogOpen(true);
        } catch (error) {
            toast.error("Gagal memuat detail saldo awal");
        } finally {
            setIsLoading(false);
        }
    };

    const handleView = async (id: string) => {
        setIsLoading(true);
        try {
            const fullData = await getOpeningBalanceById(id);
            setViewData(fullData);
            setIsViewOpen(true);
        } catch (error) {
            toast.error("Gagal memuat detail saldo awal");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = () => {
        setSelectedOb(null);
        setIsDialogOpen(true);
    };

    return (
        <AdminLayout
            title="Opening Balance"
            subtitle="Admin Area"
            role="admin"
        >
            <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
                {/* Breadcrumb Section */}
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-white text-slate-600 border-slate-200 hover:bg-slate-50 transition-colors px-3 py-1.5 rounded-lg shadow-sm">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin-area" className="text-slate-500 hover:text-blue-600">Dashboard</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-slate-400" />
                                <BreadcrumbItem>
                                    <span className="text-slate-500">Accounting</span>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-slate-400" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-blue-600 font-medium">Opening Balance</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </Badge>
                </div>

                {/* Header Section */}
                <HeaderCard
                    title="Opening Balance"
                    description="Kelola saldo awal akun (Go-Live) untuk pembukuan digital Anda."
                    icon={<Wallet className="h-6 w-6 text-white" />}
                    gradientFrom="from-blue-600"
                    gradientTo="to-indigo-600"
                    variant="elegant"
                    showActionArea={true}
                    actionArea={
                        <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchData()}
                                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                            >
                                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                                Refresh
                            </Button>
                            <Button
                                onClick={handleAdd}
                                className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Saldo Go-Live
                            </Button>
                        </div>
                    }
                />

                {/* Main Table Card */}
                <Card className="border-none shadow-xl bg-white overflow-hidden rounded-2xl">
                    <CardHeader className="border-b bg-slate-50/50 p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl text-slate-800">Riwayat Saldo Awal</CardTitle>
                                <CardDescription>Daftar semua saldo awal yang telah diinput.</CardDescription>
                            </div>
                            <form onSubmit={handleSearch} className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Cari keterangan..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-white border-slate-200 rounded-xl"
                                />
                            </form>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <TabelOpeningBalance
                            data={data}
                            isLoading={isLoading}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onPost={handlePostClick}
                            onView={handleView}
                        />
                    </CardContent>
                </Card>

                <OpeningBalanceDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    onSubmit={handleCreate}
                    initialData={selectedOb}
                    isSubmitting={isSubmitting}
                />

                <OpeningBalanceDetailSheet
                    open={isViewOpen}
                    onOpenChange={setIsViewOpen}
                    data={viewData}
                />

                {/* Professional Post Confirmation Dialog */}
                <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
                    <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl">
                        {/* Header with Gradient Background */}
                        <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-6 pb-8">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-xl" />

                            <div className="relative flex items-start gap-4">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border-2 border-white/30 shadow-lg">
                                    <AlertTriangle className="h-8 w-8 text-white animate-pulse" />
                                </div>
                                <div className="flex-1">
                                    <DialogTitle className="text-2xl font-black text-white mb-2 tracking-tight">
                                        Konfirmasi Posting ke Ledger
                                    </DialogTitle>
                                    <DialogDescription className="text-amber-50 text-sm leading-relaxed">
                                        Tindakan ini akan memposting saldo awal ke sistem akuntansi secara permanen
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="p-6 space-y-6 bg-gradient-to-b from-white to-slate-50">
                            {/* Warning Box */}
                            <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <ShieldAlert className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-red-900 mb-1 text-sm">⚠️ PERINGATAN PENTING</h4>
                                        <p className="text-xs text-red-700 leading-relaxed">
                                            Setelah diposting, saldo awal <span className="font-bold underline">TIDAK DAPAT DIUBAH atau DIHAPUS</span> lagi.
                                            Data akan tercatat secara permanen dalam sistem akuntansi.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* What Will Happen Section */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                    <Send className="h-4 w-4 text-blue-600" />
                                    Apa yang akan terjadi?
                                </h4>
                                <div className="space-y-2.5">
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                                        <div className="p-1.5 bg-blue-100 rounded-full mt-0.5">
                                            <div className="h-2 w-2 bg-blue-600 rounded-full" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-700 leading-relaxed">
                                                <span className="font-semibold text-slate-900">Ledger Entry:</span> Sistem akan membuat jurnal otomatis dengan nomor referensi unik
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                                        <div className="p-1.5 bg-emerald-100 rounded-full mt-0.5">
                                            <div className="h-2 w-2 bg-emerald-600 rounded-full" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-700 leading-relaxed">
                                                <span className="font-semibold text-slate-900">Trial Balance:</span> Saldo akan ter-update di Trial Balance periode berjalan
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50/50 border border-purple-100">
                                        <div className="p-1.5 bg-purple-100 rounded-full mt-0.5">
                                            <div className="h-2 w-2 bg-purple-600 rounded-full" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-700 leading-relaxed">
                                                <span className="font-semibold text-slate-900">GL Summary:</span> General Ledger Summary akan di-update untuk setiap akun
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50/50 border border-red-100">
                                        <div className="p-1.5 bg-red-100 rounded-full mt-0.5">
                                            <Lock className="h-3 w-3 text-red-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-700 leading-relaxed">
                                                <span className="font-semibold text-slate-900">Status Locked:</span> Data akan dikunci dan tidak bisa diedit/dihapus
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Confirmation Question */}
                            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-100 to-slate-200 border border-slate-300">
                                <p className="text-center text-sm font-bold text-slate-900">
                                    Apakah Anda yakin ingin melanjutkan posting ini?
                                </p>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <DialogFooter className="p-6 pt-0 bg-gradient-to-b from-slate-50 to-white">
                            <div className="flex items-center gap-3 w-full">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPostDialogOpen(false)}
                                    className="flex-1 h-11 border-2 border-slate-300 hover:bg-slate-100 font-semibold text-slate-700"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handlePostConfirm}
                                    className="flex-1 h-11 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold shadow-lg shadow-emerald-500/30 border-0"
                                >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Ya, Posting Sekarang
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}

// Minimal AlertCircle implementation if not imported correctly
const AlertCircle = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);
