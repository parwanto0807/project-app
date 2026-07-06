"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Wallet, TrendingDown, Banknote, Clock, Send } from "lucide-react";

interface PayrollStatsProps {
  summary: {
    totalKaryawan: number;
    totalGajiPokok: number;
    totalTunjangan: number;
    totalPotongan: number;
    totalBersih: number;
    totalLembur: number;
    totalPublished: number;
  } | null;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

const PayrollStats: React.FC<PayrollStatsProps> = ({ summary }) => {
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
      title: "Total Gaji Pokok",
      value: summary?.totalGajiPokok ?? 0,
      isCount: false,
      icon: Banknote,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Total Tunjangan",
      value: summary?.totalTunjangan ?? 0,
      isCount: false,
      icon: Wallet,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Total Potongan",
      value: summary?.totalPotongan ?? 0,
      isCount: false,
      icon: TrendingDown,
      color: "text-red-500",
      bg: "bg-red-50",
    },
    {
      title: "Total Gaji Bersih",
      value: summary?.totalBersih ?? 0,
      isCount: false,
      icon: Banknote,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Total Jam Lembur",
      value: summary?.totalLembur ?? 0,
      isCount: true,
      suffix: " jam",
      icon: Clock,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
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
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 lg:gap-2 xl:gap-3">
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

export default PayrollStats;
