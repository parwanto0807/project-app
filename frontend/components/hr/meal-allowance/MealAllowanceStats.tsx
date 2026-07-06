"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Wallet, Banknote, Clock, CalendarDays, CheckCircle2, Send } from "lucide-react";

interface MealAllowanceStatsProps {
  summary: {
    totalKaryawan: number;
    totalHariHadir: number;
    totalJamLembur: number;
    totalUmHarian: number;
    totalUmLembur: number;
    totalPencairan: number;
    totalPosted: number;
    totalPublished?: number;
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
    {
      title: "Sudah Publish (Mobile)",
      value: summary?.totalPublished ?? 0,
      isCount: true,
      icon: Send,
      color: "text-blue-700",
      bg: "bg-blue-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 lg:gap-2 xl:gap-3">
      {stats.map((item, idx) => (
        <Card key={idx} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-0 h-full flex flex-col justify-between">
            <div className="flex flex-col p-3 lg:p-2 xl:p-2.5 gap-1.5 lg:gap-1 xl:gap-1.5 justify-between flex-1">
              <div className="flex items-start justify-between gap-1">
                <p className="text-[11px] lg:text-[10px] xl:text-[11px] font-semibold text-gray-500 leading-tight line-clamp-2 min-h-[26px] lg:min-h-[24px] xl:min-h-[26px]">
                  {item.title}
                </p>
                <div className={`${item.bg} p-1.5 lg:p-1 xl:p-1.5 rounded-lg shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className={`h-4 w-4 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 ${item.color}`} />
                </div>
              </div>
              <h3
                className="text-base lg:text-xs xl:text-sm 2xl:text-base font-bold text-gray-800 mt-1 truncate"
                title={item.isCount ? `${item.value}${(item as any).suffix || ""}` : fmt(item.value as number)}
              >
                {item.isCount
                  ? `${item.value}${(item as any).suffix || ""}`
                  : fmt(item.value as number)}
              </h3>
            </div>
            <div className={`h-1 w-full ${item.bg}`} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MealAllowanceStats;
