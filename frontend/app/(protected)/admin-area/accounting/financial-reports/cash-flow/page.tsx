"use client";

import React, { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import HeaderCard from "@/components/ui/header-card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CalendarIcon, Filter, TrendingUp, Download, Eye } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { useAuth } from "@/contexts/AuthContext";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import CashFlowTable, { CashFlowData } from "@/components/accounting/financial-reports/CashFlowTable";
import CashFlowPDFButton from "@/components/accounting/financial-reports/CashFlowPDFButton";

export default function CashFlowPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { role } = useAuth();

    // Default to current month
    const [startDate, setStartDate] = useState<Date | undefined>(
        searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : startOfMonth(new Date())
    );
    const [endDate, setEndDate] = useState<Date | undefined>(
        searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : endOfMonth(new Date())
    );

    // State for Data
    const [reportData, setReportData] = useState<CashFlowData | null>(null);
    const [loading, setLoading] = useState(false);

    // Function to Fetch Report
    const fetchReport = async () => {
        if (!startDate || !endDate) {
            toast.error("Silakan pilih rentang tanggal");
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("startDate", format(startDate, "yyyy-MM-dd"));
            params.append("endDate", format(endDate, "yyyy-MM-dd"));

            // Update URL
            router.push(`?${params.toString()}`, { scroll: false });

            const res = await fetch(`/api/accounting/reports/cash-flow?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setReportData(data.data);
            } else {
                toast.error(data.error || "Gagal memproses laporan arus kas");
            }
        } catch (error) {
            console.error("Failed to fetch cash flow", error);
            toast.error("Terjadi kesalahan sistem saat mengambil data");
        } finally {
            setLoading(false);
        }
    };

    // Initial Fetch
    useEffect(() => {
        fetchReport();
    }, []);

    return (
        <AdminLayout title="Laporan Arus Kas" role={role as any}>
            <div className="flex flex-col gap-6 p-4 md:p-8">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={role === 'super' ? "/super-admin-area" : "/admin-area"}>Dashboard</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={role === 'super' ? "/super-admin-area/accounting" : "/admin-area/accounting"}>Accounting</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Laporan Arus Kas (Cash Flow)</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <HeaderCard
                    title="Laporan Arus Kas"
                    description="Aliran kas masuk dan keluar dari Aktivitas Operasi, Investasi, dan Pendanaan"
                />

                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Filter className="w-5 h-5 text-cyan-600" />
                            Filter & Kontrol Laporan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
                            {/* Date Group */}
                            <div className="flex flex-wrap items-end gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mulai Tanggal</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-[200px] justify-start text-left font-normal border-slate-300",
                                                    !startDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 text-cyan-500" />
                                                {startDate ? format(startDate, "PPP") : "Pilih Tanggal"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={startDate}
                                                onSelect={setStartDate}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sampai Tanggal</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-[200px] justify-start text-left font-normal border-slate-300",
                                                    !endDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 text-cyan-500" />
                                                {endDate ? format(endDate, "PPP") : "Pilih Tanggal"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={endDate}
                                                onSelect={setEndDate}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <Button
                                    onClick={fetchReport}
                                    className="bg-cyan-600 hover:bg-cyan-700 min-w-[140px] shadow-sm shadow-cyan-200"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Memproses...
                                        </span>
                                    ) : (
                                        "Tampilkan Laporan"
                                    )}
                                </Button>
                            </div>

                            <div className="flex-grow"></div>

                            {/* Export Group */}
                            <div className="flex gap-2">
                                {reportData && (
                                    <CashFlowPDFButton
                                        data={reportData}
                                        period={{
                                            startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
                                            endDate: endDate ? format(endDate, "yyyy-MM-dd") : ""
                                        }}
                                    />
                                )}
                                <Button variant="outline" className="border-slate-300 gap-2 h-10" disabled={!reportData}>
                                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                                    Excel
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <CashFlowTable
                    data={reportData}
                    isLoading={loading}
                    period={startDate && endDate ? {
                        startDate: format(startDate, "yyyy-MM-dd"),
                        endDate: format(endDate, "yyyy-MM-dd")
                    } : null}
                />
            </div>
        </AdminLayout>
    );
}
