"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, PlusCircle, CreditCard } from "lucide-react";
import { getAllDisbursements } from "@/lib/action/hr/mealAllowance";
import MealAllowanceStats from "@/components/hr/meal-allowance/MealAllowanceStats";
import MealAllowanceTable from "@/components/hr/meal-allowance/MealAllowanceTable";
import ProcessMealAllowanceDialog from "@/components/hr/meal-allowance/ProcessMealAllowanceDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function MealAllowancePage() {
  const [periodeBulan, setPeriodeBulan] = useState(new Date().toISOString().slice(0, 7));
  const [siklus, setSiklus] = useState("1");
  const [disbursements, setDisbursements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processOpen, setProcessOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAllDisbursements(periodeBulan, parseInt(siklus));
      if (res.data) setDisbursements(res.data);
    } catch {
      toast.error("Gagal memuat data pencairan");
    } finally {
      setIsLoading(false);
    }
  }, [periodeBulan, siklus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = React.useMemo(() => {
    if (!disbursements.length) return null;
    return disbursements.reduce(
      (acc, curr) => {
        acc.totalKaryawan += 1;
        acc.totalHariHadir += curr.totalHariHadir || 0;
        acc.totalJamLembur += curr.totalJamLembur || 0;
        acc.totalUmHarian += curr.nominalUangMakan || 0;
        acc.totalUmLembur += curr.nominalUangMakanLembur || 0;
        acc.totalPencairan += curr.totalPencairan || 0;
        if (curr.status === "POSTED" || curr.status === "PUBLISHED") {
          acc.totalPosted += 1;
        }
        if (curr.status === "PUBLISHED") {
          acc.totalPublished += 1;
        }
        return acc;
      },
      {
        totalKaryawan: 0,
        totalHariHadir: 0,
        totalJamLembur: 0,
        totalUmHarian: 0,
        totalUmLembur: 0,
        totalPencairan: 0,
        totalPosted: 0,
        totalPublished: 0,
      }
    );
  }, [disbursements]);

  return (
    <AdminLayout title="Pencairan Uang Makan" role="admin">
      <div className="p-6 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link href="/admin-area">Dashboard</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link href="/admin-area/hr/payroll">HR & Payroll</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Pencairan Uang Makan</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-2xl font-bold mt-2 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-orange-500" />
              Pencairan Uang Makan
            </h1>
            <p className="text-sm text-gray-500 mt-1">Kelola pencairan uang makan harian dan lembur (Siklus 2x Sebulan).</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setProcessOpen(true)} className="bg-orange-600 hover:bg-orange-700 text-white shadow-md">
              <PlusCircle className="w-4 h-4 mr-2" />
              Proses Uang Makan
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-medium text-gray-600 min-w-[60px]">Periode:</span>
            <Input
              type="month"
              value={periodeBulan}
              onChange={(e) => setPeriodeBulan(e.target.value)}
              className="w-[180px]"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-medium text-gray-600 min-w-[60px]">Siklus:</span>
            <Select value={siklus} onValueChange={setSiklus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih Siklus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Siklus 1 (Tgl 21 - 5)</SelectItem>
                <SelectItem value="2">Siklus 2 (Tgl 6 - 20)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <MealAllowanceStats summary={summary} />

        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <p className="text-sm text-gray-500 font-medium animate-pulse">Memuat data pencairan...</p>
          </div>
        ) : (
          <MealAllowanceTable disbursements={disbursements} onRefresh={loadData} />
        )}

        <ProcessMealAllowanceDialog
          open={processOpen}
          onOpenChange={setProcessOpen}
          onSuccess={loadData}
          defaultPeriode={periodeBulan}
          defaultSiklus={parseInt(siklus)}
        />
      </div>
    </AdminLayout>
  );
}
