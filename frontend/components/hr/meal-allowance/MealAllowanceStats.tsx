"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Wallet, Banknote, Clock, CalendarDays, CheckCircle2 } from "lucide-react";

interface MealAllowanceStatsProps {
  summary: {
    totalKaryawan: number;
    totalHariHadir: number;
    totalJamLembur: number;
    totalUmHarian: number;
    totalUmLembur: number;
    totalPencairan: number;
    totalPosted: number;
  } | null;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

const MealAllowanceStats: React.FC<MealAllowanceStatsProps> = ({ summary }) => {
  const stats = [
    {
      title: "Karyawan Diproses",
      value: summary?.totalKaryawan ?? 0,
      isCount: true,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Total Hari Hadir",
      value: summary?.totalHariHadir ?? 0,
      isCount: true,
      suffix: " Hari",
      icon: CalendarDays,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Total Jam Lembur",
      value: summary?.totalJamLembur ?? 0,
      isCount: true,
      suffix: " Jam",
      icon: Clock,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
    },
    {
      title: "Total UM Harian",
      value: summary?.totalUmHarian ?? 0,
      isCount: false,
      icon: Wallet,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Total UM Lembur",
      value: summary?.totalUmLembur ?? 0,
      isCount: false,
      icon: Banknote,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Total Pencairan",
      value: summary?.totalPencairan ?? 0,
      isCount: false,
      icon: Banknote,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Sudah Posted",
      value: summary?.totalPosted ?? 0,
      isCount: true,
      icon: CheckCircle2,
      color: "text-green-700",
      bg: "bg-green-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {stats.map((item, idx) => (
        <Card key={idx} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-0">
            <div className="flex flex-col p-4 gap-3">
              <div className={`${item.bg} p-2.5 rounded-xl w-fit group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 leading-tight">{item.title}</p>
                <h3 className="text-lg font-bold text-gray-800 mt-0.5">
                  {item.isCount
                    ? `${item.value}${(item as any).suffix || ""}`
                    : fmt(item.value as number)}
                </h3>
              </div>
            </div>
            <div className={`h-1 w-full ${item.bg}`} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MealAllowanceStats;
