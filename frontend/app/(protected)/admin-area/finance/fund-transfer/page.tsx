"use client";

import React, { useState, useEffect, useCallback } from "react";
import HeaderCard from "@/components/ui/header-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Landmark, Plus, Search, RefreshCw, Filter, TrendingUp, Wallet, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import TabelFundTransfer from "@/components/finance/fund-transfer/TabelFundTransfer";
import CreateFundTransferDialog from "@/components/finance/fund-transfer/CreateFundTransferDialog";
import ViewFundTransferDialog from "@/components/finance/fund-transfer/ViewFundTransferDialog";
import VoidFundTransferDialog from "@/components/finance/fund-transfer/VoidFundTransferDialog";
import { getFundTransfers } from "@/lib/action/fundTransfer";
import { FundTransfer } from "@/types/finance/fundTransfer";
import { toast } from "sonner";
import { cn, formatCurrencyNumber } from "@/lib/utils";

import { AdminLayout } from "@/components/admin-panel/admin-layout";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

const FundTransferPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [transfers, setTransfers] = useState<FundTransfer[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    });

    const [createOpen, setCreateOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [voidOpen, setVoidOpen] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState<FundTransfer | null>(null);

    const fetchData = useCallback(async (page = 1, search = "") => {
        setIsLoading(true);
        try {
            const result = await getFundTransfers({ page, limit: 10, search });
            if (result.success) {
                setTransfers(result.data);
                setPagination(result.pagination);
            } else {
                toast.error("Gagal mengambil data transfer");
            }
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan sistem");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(1, searchTerm);
    }, [fetchData, searchTerm]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData(1, searchTerm);
    };

    const handleView = (transfer: FundTransfer) => {
        setSelectedTransfer(transfer);
        setViewOpen(true);
    };

    const handleVoid = (transfer: FundTransfer) => {
        setSelectedTransfer(transfer);
        setVoidOpen(true);
    };



    return (
        <AdminLayout title="Fund Transfer" role="admin">
            <div className="flex-col md:flex">
                <div className="flex-1 space-y-4 p-8 pt-6">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link href="/admin-area">Dashboard</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link href="/admin-area/finance">Finance</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Fund Transfer</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <div className="space-y-6">
                        {/* Header Area - Reduced height with compact variant */}
                        <HeaderCard
                            title="Transfer Antar Kas & Bank"
                            description="Manajemen pemindahan dana antar akun Bank dan Kas Perusahaan secara real-time."
                            icon={<Landmark className="h-6 w-6 text-white" />}
                            gradientFrom="from-slate-950"
                            gradientTo="to-indigo-950"
                            variant="compact"
                            backgroundStyle="pattern"
                            showActionArea
                            actionArea={
                                <Button
                                    onClick={() => setCreateOpen(true)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-6 shadow-lg shadow-indigo-200 transition-all font-bold gap-2 group"
                                >
                                    <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                                    New Transfer
                                </Button>
                            }
                        />

                        {/* Separated Stats Section with smooth colors */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                {
                                    title: "Total Transaksi",
                                    value: pagination.total,
                                    label: "Semua data",
                                    icon: <RefreshCw className="h-5 w-5 text-indigo-600" />,
                                    color: "bg-indigo-50 border-indigo-100",
                                    iconBg: "bg-white shadow-sm"
                                },
                                {
                                    title: "Total Nominal",
                                    value: formatCurrencyNumber(transfers.reduce((acc, curr) => acc + Number(curr.amount), 0)),
                                    label: "Halaman ini",
                                    icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
                                    color: "bg-emerald-50 border-emerald-100",
                                    iconBg: "bg-white shadow-sm"
                                },
                                {
                                    title: "Admin Fee",
                                    value: formatCurrencyNumber(transfers.reduce((acc, curr) => acc + Number(curr.feeAmount), 0)),
                                    label: "Total biaya bank",
                                    icon: <Wallet className="h-5 w-5 text-amber-600" />,
                                    color: "bg-amber-50 border-amber-100",
                                    iconBg: "bg-white shadow-sm"
                                },
                                {
                                    title: "Voided",
                                    value: transfers.filter(t => t.status === 'VOIDED').length,
                                    label: "Transaksi dibatalkan",
                                    icon: <ArrowDownLeft className="h-5 w-5 text-rose-600" />,
                                    color: "bg-rose-50 border-rose-100",
                                    iconBg: "bg-white shadow-sm"
                                },
                            ].map((stat, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "relative overflow-hidden group p-5 rounded-2xl border transition-all duration-300 hover:shadow-md hover:-translate-y-1",
                                        stat.color
                                    )}
                                >
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                        {React.cloneElement(stat.icon as React.ReactElement<any>, { className: "h-12 w-12" })}
                                    </div>
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="space-y-1.5">
                                            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                                                {stat.title}
                                            </p>
                                            <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                                {stat.value}
                                            </h3>
                                            <p className="text-slate-400 text-[10px] font-medium">
                                                {stat.label}
                                            </p>
                                        </div>
                                        <div className={cn("p-2.5 rounded-xl", stat.iconBg)}>
                                            {stat.icon}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="space-y-4">
                            {/* Toolbar */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <form onSubmit={handleSearch} className="relative w-full md:w-96">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Cari No. Transfer atau Referensi..."
                                        className="h-11 pl-10 rounded-xl border-slate-200 bg-white shadow-sm focus:ring-indigo-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </form>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        className="h-11 rounded-xl border-slate-200 bg-white gap-2 text-slate-600 px-4"
                                        onClick={() => fetchData(pagination.page, searchTerm)}
                                    >
                                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                                        Refresh
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-11 rounded-xl border-slate-200 bg-white px-4 text-slate-600"
                                    >
                                        <Filter className="h-4 w-4 mr-2" />
                                        Filter
                                    </Button>
                                </div>
                            </div>

                            {/* Table Component */}
                            <TabelFundTransfer
                                data={transfers}
                                isLoading={isLoading}
                                onView={handleView}
                                onVoid={handleVoid}
                                onRefresh={() => fetchData(pagination.page, searchTerm)}
                            />

                            {/* Pagination (Simple) */}
                            <div className="flex items-center justify-between px-2 text-sm text-slate-500 font-medium">
                                <p>Total data: {pagination.total}</p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pagination.page <= 1}
                                        onClick={() => fetchData(pagination.page - 1, searchTerm)}
                                        className="rounded-lg border-slate-200 bg-white"
                                    >
                                        Previous
                                    </Button>
                                    <div className="flex items-center px-4 bg-white border border-slate-200 rounded-lg">
                                        Page {pagination.page} of {pagination.totalPages || 1}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pagination.page >= pagination.totalPages}
                                        onClick={() => fetchData(pagination.page + 1, searchTerm)}
                                        className="rounded-lg border-slate-200 bg-white"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Dialogs */}
                        <CreateFundTransferDialog
                            open={createOpen}
                            onOpenChange={setCreateOpen}
                            onSuccess={() => fetchData(1, searchTerm)}
                        />

                        <ViewFundTransferDialog
                            open={viewOpen}
                            onOpenChange={setViewOpen}
                            transfer={selectedTransfer}
                        />

                        <VoidFundTransferDialog
                            open={voidOpen}
                            onOpenChange={setVoidOpen}
                            transfer={selectedTransfer}
                            onSuccess={() => fetchData(pagination.page, searchTerm)}
                        />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default FundTransferPage;
