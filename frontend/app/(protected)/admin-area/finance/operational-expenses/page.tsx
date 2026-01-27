"use client";

import React, { useState, useEffect, useCallback } from "react";
import HeaderCard from "@/components/ui/header-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Banknote, Plus, Search, RefreshCw, Filter, TrendingUp, Wallet, CheckCircle, Clock } from "lucide-react";
import { getOperationalExpenses } from "@/lib/action/operationalExpense";
import { OperationalExpense } from "@/types/finance/operationalExpense";
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

// We'll create these components next
import TabelOperationalExpense from "@/components/finance/opex/TabelOperationalExpense";
import CreateOpexDialog from "@/components/finance/opex/CreateOpexDialog";

const OperationalExpensePage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [expenses, setExpenses] = useState<OperationalExpense[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const [createOpen, setCreateOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<OperationalExpense | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const result = await getOperationalExpenses();
        if (result.success) {
            setExpenses(result.data);
        } else {
            toast.error(result.error);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const stats = [
        {
            title: "Total Pengeluaran",
            value: formatCurrencyNumber(expenses.reduce((acc, curr) => acc + Number(curr.amount), 0)),
            label: "Semua Kategori",
            icon: <Wallet className="h-5 w-5 text-indigo-600" />,
            color: "bg-indigo-50 border-indigo-100",
        },
        {
            title: "Approved",
            value: expenses.filter(e => e.status === 'APPROVED').length,
            label: "Sudah di-Jurnal",
            icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
            color: "bg-emerald-50 border-emerald-100",
        },
        {
            title: "Draft / Pending",
            value: expenses.filter(e => e.status === 'DRAFT').length,
            label: "Perlu Review",
            icon: <Clock className="h-5 w-5 text-amber-600" />,
            color: "bg-amber-50 border-amber-100",
        },
        {
            title: "Transaksi Bulan Ini",
            value: expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).length,
            label: "Periode Berjalan",
            icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
            color: "bg-blue-50 border-blue-100",
        }
    ];

    return (
        <AdminLayout title="Biaya Operasional" role="admin">
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
                                <BreadcrumbPage>Biaya Operasional</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <div className="space-y-6">
                        <HeaderCard
                            title="Biaya Operasional"
                            description="Catat dan pantau pengeluaran operasional non-proyek dengan otomatisasi jurnal akuntansi."
                            icon={<Banknote className="h-6 w-6 text-white" />}
                            gradientFrom="from-blue-950"
                            gradientTo="to-slate-900"
                            variant="compact"
                            backgroundStyle="pattern"
                            showActionArea
                            actionArea={
                                <Button
                                    onClick={() => setCreateOpen(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-6 shadow-lg shadow-blue-200 transition-all font-bold gap-2 group"
                                >
                                    <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                                    Tambah Biaya
                                </Button>
                            }
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {stats.map((stat, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "relative overflow-hidden group p-5 rounded-2xl border transition-all duration-300 hover:shadow-md",
                                        stat.color
                                    )}
                                >
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
                                        <div className="p-2.5 rounded-xl bg-white shadow-sm">
                                            {stat.icon}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Cari deskripsi atau no opex..."
                                        className="h-11 pl-10 rounded-xl border-slate-200 bg-white shadow-sm focus:ring-blue-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        className="h-11 rounded-xl border-slate-200 bg-white gap-2 text-slate-600 px-4"
                                        onClick={fetchData}
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

                            <TabelOperationalExpense
                                data={expenses.filter(e =>
                                    e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    e.expenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
                                )}
                                isLoading={isLoading}
                                onRefresh={fetchData}
                            />
                        </div>

                        <CreateOpexDialog
                            open={createOpen}
                            onOpenChange={setCreateOpen}
                            onSuccess={fetchData}
                        />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default OperationalExpensePage;
