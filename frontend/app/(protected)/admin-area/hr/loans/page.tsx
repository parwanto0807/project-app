"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { fetchAllLoans } from "@/lib/action/hr/loans";
import LoanStats from "@/components/hr/loan/LoanStats";
import LoanTable from "@/components/hr/loan/LoanTable";
import { Button } from "@/components/ui/button";
import { Download, Filter, Loader2 } from "lucide-react";
import CreateLoanDialogWrapper from "./CreateLoanDialogWrapper";

export default function LoansManagementPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (filters: any = {}) => {
    try {
      setIsLoading(true);
      const result = await fetchAllLoans(filters);
      if (result.loans) {
        setLoans(result.loans);
      }
      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error("Error loading loans:", err);
      setError("Gagal memuat data pinjaman.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const layoutProps: LayoutProps = {
    title: "Pinjaman Karyawan",
    role: "admin",
    children: (
      <div className="flex-1 space-y-8 p-4 pt-6 md:p-8 min-h-screen bg-gray-50/50">
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
                <BreadcrumbPage>Pinjaman Karyawan</BreadcrumbPage>
              </Badge>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tight text-gray-900 uppercase">Pinjaman Karyawan</h1>
              <p className="text-muted-foreground font-medium">Kelola pinjaman, cicilan, dan integrasi payroll otomatis.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="rounded-xl border-gray-200 bg-white">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <CreateLoanDialogWrapper onSuccess={() => loadData()} />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="bg-red-50 p-10 rounded-3xl text-center border border-red-100">
              <p className="text-red-600 font-bold">Terjadi kesalahan: {error}</p>
              <Button variant="outline" className="mt-4" onClick={() => loadData()}>Coba Lagi</Button>
            </div>
          ) : (
            <div className="space-y-6">
              <LoanStats loans={loans} />
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" className="rounded-xl text-blue-700 bg-blue-50">Semua</Button>
                    <Button variant="ghost" className="rounded-xl text-gray-500 hover:bg-gray-100">Aktif</Button>
                    <Button variant="ghost" className="rounded-xl text-gray-500 hover:bg-gray-100">Lunas</Button>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl border-gray-200 bg-white">
                    <Filter className="h-3 w-3 mr-2" /> Filter
                </Button>
              </div>

              <LoanTable loans={loans} onRefresh={loadData} />
            </div>
          )}
        </div>
      </div>
    ),
  };

  return <AdminLayout {...layoutProps} />;
}
