"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import HeaderCard from "@/components/ui/header-card";
import { Button } from "@/components/ui/button";
import BalanceSheetTable, { BalanceSheetData } from "@/components/accounting/financial-reports/BalanceSheetTable";
import { toast } from "sonner";
import { CalendarIcon, Filter, Printer, FileText } from "lucide-react";
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
import BalanceSheetPDFButton from "@/components/accounting/financial-reports/BalanceSheetPDFButton";

export default function BalanceSheetPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { role } = useAuth();

    // State for Filters
    const [endDate, setEndDate] = useState<Date | undefined>(
        searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : new Date()
    );

    // State for Data
    const [reportData, setReportData] = useState<BalanceSheetData | null>(null);
    const [loading, setLoading] = useState(false);

    // Function to Fetch Report
    const fetchReport = async () => {
        if (!endDate) {
            toast.error("Silakan pilih tanggal snapshot (End Date)");
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("endDate", format(endDate, "yyyy-MM-dd"));

            // Update URL
            router.push(`?${params.toString()}`, { scroll: false });

            const res = await fetch(`/api/accounting/reports/balance-sheet?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setReportData(data.data);
                if (!data.data.checks.isBalanced) {
                    toast.warning("Peringatan: Posisi neraca tidak seimbang!", {
                        description: `Terdapat selisih ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.data.checks.difference)}`,
                        duration: 5000
                    });
                }
            } else {
                toast.error(data.error || "Gagal memproses neraca");
            }
        } catch (error) {
            console.error("Failed to fetch balance sheet", error);
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
        <AdminLayout title="Laporan Neraca" role={role as any}>
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
                            <BreadcrumbPage>Laporan Neraca (Balance Sheet)</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <HeaderCard
                    title="Laporan Neraca"
                    description="Posisi Keuangan (Aset, Kewajiban, dan Ekuitas) per tanggal tertentu"
                />

                <Card className="shadow-sm border-slate-200 print:hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Filter className="w-5 h-5 text-primary" />
                            Filter Laporan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-700">Per Tanggal (Snapshot Date)</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-[240px] justify-start text-left font-normal border-slate-300",
                                                !endDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
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
                                className="bg-primary hover:bg-primary/90 min-w-[120px]"
                                disabled={loading}
                            >
                                {loading ? "Memproses..." : "Tampilkan Neraca"}
                            </Button>

                            <div className="flex-grow"></div>

                            <div className="flex gap-2">
                                {reportData && endDate && (
                                    <BalanceSheetPDFButton
                                        data={reportData}
                                        snapshotDate={format(endDate, "yyyy-MM-dd")}
                                    />
                                )}
                                <Button variant="outline" className="border-slate-300 gap-2" disabled={!reportData}>
                                    <FileText className="w-4 h-4 text-emerald-600" />
                                    Ekspor Excel
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <BalanceSheetTable
                    data={reportData}
                    isLoading={loading}
                    snapshotDate={endDate ? format(endDate, "yyyy-MM-dd") : null}
                />
            </div>
        </AdminLayout>
    );
}
