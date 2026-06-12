"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Download, Loader2, PlusCircle, Settings, FileText, BarChart3, Zap, Send, AlertTriangle, Eye,
} from "lucide-react";
import { fetchAllGaji, fetchPayrollSummary, fetchPayrollConfigs, postBulkPayroll, publishBulkPayroll } from "@/lib/action/hr/payroll";
import PayrollStats from "@/components/hr/payroll/PayrollStats";
import PayrollTable from "@/components/hr/payroll/PayrollTable";
import PayrollPeriodSelector from "@/components/hr/payroll/PayrollPeriodSelector";
import ProcessPayrollDialog from "@/components/hr/payroll/ProcessPayrollDialog";
import BulkPayrollDialog from "@/components/hr/payroll/BulkPayrollDialog";
import PayrollConfigPanel from "@/components/hr/payroll/PayrollConfigPanel";
import { pdf } from "@react-pdf/renderer";
import PayrollBankTransferPdf from "@/components/hr/payroll/PayrollBankTransferPdf";

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState("payroll");
  const [periode, setPeriode] = useState(new Date().toISOString().slice(0, 7));
  const [gaji, setGaji] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [configs, setConfigs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processOpen, setProcessOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [postBulkOpen, setPostBulkOpen] = useState(false);
  const [isPostingBulk, setIsPostingBulk] = useState(false);
  const [publishBulkOpen, setPublishBulkOpen] = useState(false);
  const [isPublishingBulk, setIsPublishingBulk] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [gajiRes, summaryRes] = await Promise.all([
        fetchAllGaji({ periode: periode + "-01" }),
        fetchPayrollSummary(periode + "-01"),
      ]);
      if (gajiRes.gaji) setGaji(gajiRes.gaji);
      if (summaryRes.data) setSummary(summaryRes.data);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [periode]);

  const loadConfigs = useCallback(async () => {
    const res = await fetchPayrollConfigs();
    if (res.data) setConfigs(res.data);
  }, []);

  const handlePostBulk = async () => {
    setIsPostingBulk(true);
    try {
      const res = await postBulkPayroll(periode + "-01");
      if (res.success) {
        toast.success("Semua draft gaji berhasil di-posting");
        loadData();
      } else {
        toast.error(res.error || "Gagal posting massal");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsPostingBulk(false);
      setPostBulkOpen(false);
    }
  };

  const handlePublishBulk = async () => {
    setIsPublishingBulk(true);
    try {
      const res = await publishBulkPayroll(periode + "-01");
      if (res.success) {
        toast.success((res as any).message || "Slip gaji berhasil dipublikasikan");
        loadData();
      } else {
        toast.error(res.error || "Gagal publikasi massal");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsPublishingBulk(false);
      setPublishBulkOpen(false);
    }
  };

  const handleDownloadSummary = async () => {
    if (gaji.length === 0) {
      toast.error("Tidak ada data untuk dibuatkan summary");
      return;
    }
    setIsGeneratingSummary(true);
    try {
      const blob = await pdf(<PayrollBankTransferPdf gajiList={gaji} periode={periode + "-01"} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      toast.success("Preview Summary Bank Transfer berhasil dibuat");
    } catch (error) {
      console.error("Error generating summary PDF:", error);
      toast.error("Gagal membuat PDF Summary");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadConfigs(); }, [loadConfigs]);

  const layoutProps: LayoutProps = {
    title: "Penggajian & Payroll",
    role: "admin",
    children: (
      <div className="flex-1 space-y-8 p-4 pt-6 md:p-8 min-h-screen bg-gray-50/50">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Badge variant="outline" className="hover:bg-blue-50 text-blue-700 border-blue-200">
                  <Link href="/admin-area">Dashboard</Link>
                </Badge>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Badge variant="outline" className="text-gray-500 border-gray-200">
                <BreadcrumbPage>HR Management</BreadcrumbPage>
              </Badge>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Badge variant="secondary" className="bg-emerald-500 text-white border-none">
                <BreadcrumbPage>Penggajian & Payroll</BreadcrumbPage>
              </Badge>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-gray-900 uppercase">
              Penggajian & Payroll
            </h1>
            <p className="text-muted-foreground font-medium">
              Proses gaji karyawan dengan integrasi absensi, pinjaman, kasbon, dan jurnal akuntansi otomatis.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={handleDownloadSummary}
              disabled={isGeneratingSummary || gaji.length === 0}
            >
              {isGeneratingSummary ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Preview Summary Bank
            </Button>
            {activeTab === "payroll" && (
              <>
                <Button
                  variant="outline"
                  className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => setBulkOpen(true)}
                  disabled={true}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Buat Slip Massal
                </Button>
                {summary && summary.totalDrafts > 0 && (
                  <Button
                    variant="outline"
                    className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() => setPostBulkOpen(true)}
                    disabled={true} // Disabled sesuai permintaan user
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Posting Massal ({summary.totalDrafts})
                  </Button>
                )}
                {summary && (summary.totalPosted > 0 || summary.totalDrafts > 0) && (
                  <Button
                    variant="outline"
                    className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() => setPublishBulkOpen(true)}
                    disabled={summary.totalPosted === 0 && summary.totalDrafts === 0}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Publish Massal ({summary.totalPosted + summary.totalDrafts})
                  </Button>
                )}
                <Button
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 text-white"
                  onClick={() => setProcessOpen(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Proses Satu Karyawan
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <TabsList className="bg-white border border-gray-100 shadow-sm rounded-2xl p-1 h-auto">
              <TabsTrigger
                value="payroll"
                className="rounded-xl px-5 py-2.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                <FileText className="h-4 w-4 mr-2" />Slip Gaji
              </TabsTrigger>
              <TabsTrigger
                value="summary"
                className="rounded-xl px-5 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                <BarChart3 className="h-4 w-4 mr-2" />Ringkasan
              </TabsTrigger>
              <TabsTrigger
                value="config"
                className="rounded-xl px-5 py-2.5 data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                <Settings className="h-4 w-4 mr-2" />Konfigurasi
              </TabsTrigger>
            </TabsList>

            {activeTab !== "config" && (
              <PayrollPeriodSelector periode={periode} onChange={setPeriode} />
            )}
          </div>

          {/* ── Tab: Slip Gaji ── */}
          <TabsContent value="payroll">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : (
              <div className="space-y-6">
                <PayrollStats summary={summary} />
                <PayrollTable gaji={gaji} onRefresh={loadData} periode={periode + "-01"} />
              </div>
            )}
          </TabsContent>

          {/* ── Tab: Ringkasan ── */}
          <TabsContent value="summary">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-6">
                <PayrollStats summary={summary} />
                {/* Breakdown per karyawan */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">Detail Per Karyawan</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {summary?.totalKaryawan || 0} karyawan diproses bulan ini
                    </p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {(summary?.detail || []).map((g: any) => (
                      <div key={g.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{g.karyawan?.namaLengkap}</p>
                          <p className="text-xs text-gray-500">{g.karyawan?.jabatan}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 text-sm">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(g.total)}
                          </p>
                          <p className="text-xs text-gray-400">Gaji Bersih</p>
                        </div>
                      </div>
                    ))}
                    {(!summary?.detail || summary.detail.length === 0) && (
                      <p className="text-center py-10 text-gray-500 text-sm">Belum ada data untuk periode ini.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Tab: Konfigurasi ── */}
          <TabsContent value="config">
            <PayrollConfigPanel configs={configs} onRefresh={loadConfigs} />
          </TabsContent>
        </Tabs>

        {/* Process Dialog */}
        <ProcessPayrollDialog
          open={processOpen}
          onOpenChange={setProcessOpen}
          onSuccess={loadData}
          defaultPeriode={periode}
        />

        {/* Bulk Process Dialog */}
        <BulkPayrollDialog
          open={bulkOpen}
          onOpenChange={setBulkOpen}
          onSuccess={loadData}
          periode={periode}
        />

        {/* Post Bulk Confirmation */}
        <AlertDialog open={postBulkOpen} onOpenChange={setPostBulkOpen}>
          <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Send className="h-6 w-6 text-blue-600" />
                </div>
                <AlertDialogTitle className="text-xl font-black text-gray-900">Posting Massal Gaji?</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-gray-600">
                Anda akan mem-posting sebanyak <strong>{summary?.totalDrafts || 0}</strong> draft gaji ke General Ledger.
                Proses ini akan membuat jurnal akuntansi dan mengupdate status pinjaman/kasbon karyawan terkait.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl border-gray-200">Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handlePostBulk}
                disabled={isPostingBulk}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isPostingBulk ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memproses...</> : "Ya, Posting Sekarang"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Publish Bulk Confirmation */}
        <AlertDialog open={publishBulkOpen} onOpenChange={setPublishBulkOpen}>
          <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Send className="h-6 w-6 text-blue-600" />
                </div>
                <AlertDialogTitle className="text-xl font-black text-gray-900">Publikasikan Massal Gaji?</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-gray-600">
                Anda akan mempublikasikan sebanyak <strong>{(summary?.totalPosted || 0) + (summary?.totalDrafts || 0)}</strong> slip gaji (Draft & Posted) agar bisa dilihat oleh karyawan di aplikasi mobile.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl border-gray-200">Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handlePublishBulk}
                disabled={isPublishingBulk}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isPublishingBulk ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memproses...</> : "Ya, Publikasikan Sekarang"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    ),
  };

  return <AdminLayout {...layoutProps} />;
}
