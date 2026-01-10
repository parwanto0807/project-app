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
    ShieldCheck
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import HeaderCard from "@/components/ui/header-card";
import { AdminLayout } from "@/components/admin-panel/admin-layout";

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

    const handlePost = async (id: string) => {
        if (!confirm("Peringatan: Saldo awal yang sudah diposting tidak dapat diubah lagi. Lanjutkan?")) return;
        try {
            await postOpeningBalance(id);
            toast.success("Berhasil! Saldo awal telah diposting ke Ledger");
            fetchData();
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
                            onPost={handlePost}
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
