"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchAllLoans, fetchAllKasbon } from "@/lib/action/hr/loans";
import LoanStats from "@/components/hr/loan/LoanStats";
import LoanTable from "@/components/hr/loan/LoanTable";
import KasbonStats from "@/components/hr/loan/KasbonStats";
import KasbonTable from "@/components/hr/loan/KasbonTable";
import { Button } from "@/components/ui/button";
import { Download, Loader2, PlusCircle, Banknote, Building2 } from "lucide-react";
import CreateLoanDialogWrapper from "./CreateLoanDialogWrapper";
import CreateKasbonDialog from "@/components/hr/loan/CreateKasbonDialog";

export default function LoansManagementPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [kasbon, setKasbon] = useState<any[]>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(true);
  const [isLoadingKasbon, setIsLoadingKasbon] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kasbonDialogOpen, setKasbonDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pinjaman");

  const loadLoans = useCallback(async () => {
    try {
      setIsLoadingLoans(true);
      const result = await fetchAllLoans();
      if (result.loans) setLoans(result.loans);
      if (result.error) setError(result.error);
    } catch {
      setError("Gagal memuat data pinjaman.");
    } finally {
      setIsLoadingLoans(false);
    }
  }, []);

  const loadKasbon = useCallback(async () => {
    try {
      setIsLoadingKasbon(true);
      const result = await fetchAllKasbon();
      if (result.kasbon) setKasbon(result.kasbon);
    } catch {
      setError("Gagal memuat data kasbon.");
    } finally {
      setIsLoadingKasbon(false);
    }
  }, []);

  useEffect(() => {
    loadLoans();
    loadKasbon();
  }, [loadLoans, loadKasbon]);

  const pendingKasbonCount = kasbon.filter((k) => k.status === "PENDING").length;

  const layoutProps: LayoutProps = {
    title: "Pinjaman & Kasbon Karyawan",
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
              <Badge variant="secondary" className="bg-blue-500 text-white border-none">
                <BreadcrumbPage>Pinjaman & Kasbon</BreadcrumbPage>
              </Badge>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-gray-900 uppercase">
              Pinjaman & Kasbon
            </h1>
            <p className="text-muted-foreground font-medium">
              Kelola pinjaman karyawan, kasbon, dan integrasi payroll otomatis.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl border-gray-200 bg-white">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {activeTab === "pinjaman" ? (
              <CreateLoanDialogWrapper onSuccess={loadLoans} />
            ) : (
              <Button
                className="rounded-xl bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-200 text-white"
                onClick={() => setKasbonDialogOpen(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Ajukan Kasbon
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border border-gray-100 shadow-sm rounded-2xl p-1 h-auto">
            <TabsTrigger
              value="pinjaman"
              className="rounded-xl px-6 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Pinjaman
            </TabsTrigger>
            <TabsTrigger
              value="kasbon"
              className="rounded-xl px-6 py-2.5 data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <Banknote className="h-4 w-4 mr-2" />
              Kasbon
              {pendingKasbonCount > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0 h-4 border-none">
                  {pendingKasbonCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Pinjaman ── */}
          <TabsContent value="pinjaman" className="mt-6">
            {isLoadingLoans ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : error ? (
              <div className="bg-red-50 p-10 rounded-3xl text-center border border-red-100">
                <p className="text-red-600 font-bold">Terjadi kesalahan: {error}</p>
                <Button variant="outline" className="mt-4" onClick={loadLoans}>
                  Coba Lagi
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <LoanStats loans={loans} />
                <LoanTable loans={loans} onRefresh={loadLoans} />
              </div>
            )}
          </TabsContent>

          {/* ── Tab: Kasbon ── */}
          <TabsContent value="kasbon" className="mt-6">
            {isLoadingKasbon ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            ) : (
              <div className="space-y-6">
                <KasbonStats kasbon={kasbon} />
                <KasbonTable kasbon={kasbon} onRefresh={loadKasbon} />
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Kasbon Dialog */}
        <CreateKasbonDialog
          open={kasbonDialogOpen}
          onOpenChange={setKasbonDialogOpen}
          onSuccess={loadKasbon}
        />
      </div>
    ),
  };

  return <AdminLayout {...layoutProps} />;
}
