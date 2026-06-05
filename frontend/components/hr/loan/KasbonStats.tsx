"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle2, XCircle, Banknote } from "lucide-react";

interface KasbonStatsProps {
  kasbon: any[];
}

const KasbonStats: React.FC<KasbonStatsProps> = ({ kasbon }) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const totalPending = kasbon.filter((k) => k.status === "PENDING").length;
  const totalApproved = kasbon.filter((k) => k.status === "APPROVED").length;
  const totalBulanIni = kasbon.filter((k) => {
    const d = new Date(k.tanggal);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;
  const nilaiTotal = kasbon
    .filter((k) => k.status === "APPROVED" || k.status === "SETTLED")
    .reduce((sum, k) => sum + Number(k.jumlah), 0);

  const totalDilunasi = kasbon
    .filter((k) => k.status === "SETTLED")
    .reduce((sum, k) => sum + Number(k.jumlah), 0);

  const sisaKasbon = kasbon
    .filter((k) => k.status === "APPROVED")
    .reduce((sum, k) => sum + Number(k.jumlah), 0);

  const stats = [
    {
      title: "Menunggu Persetujuan",
      value: totalPending,
      isCount: true,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Disetujui",
      value: totalApproved,
      isCount: true,
      icon: CheckCircle2,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Nilai Total Aktif",
      value: nilaiTotal,
      isCount: false,
      icon: Banknote,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Total Dilunasi",
      value: totalDilunasi,
      isCount: false,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Sisa Kasbon",
      value: sisaKasbon,
      isCount: false,
      icon: Banknote,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "Pengajuan Bulan Ini",
      value: totalBulanIni,
      isCount: true,
      icon: XCircle,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {stats.map((item, idx) => (
        <Card
          key={idx}
          className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300"
        >
          <CardContent className="p-0">
            <div className="flex items-center p-4">
              <div
                className={`${item.bg} p-2.5 rounded-xl mr-3 group-hover:scale-110 transition-transform duration-300`}
              >
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider truncate">{item.title}</p>
                <h3 className="text-sm md:text-base font-bold text-gray-800 truncate mt-0.5">
                  {item.isCount
                    ? item.value
                    : new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      }).format(item.value as number)}
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

export default KasbonStats;
