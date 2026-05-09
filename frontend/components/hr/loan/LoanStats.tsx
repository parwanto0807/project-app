"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { HandCoins, ReceiptJapaneseYen, Wallet2, CheckCircle2 } from "lucide-react";

interface LoanStatsProps {
  loans: any[];
}

const LoanStats: React.FC<LoanStatsProps> = ({ loans }) => {
  const totalLoanValue = loans.reduce((sum, l) => sum + Number(l.jumlahPinjaman), 0);
  const totalRemaining = loans.reduce((sum, l) => sum + Number(l.sisaPinjaman), 0);
  const totalPaid = totalLoanValue - totalRemaining;
  const activeLoans = loans.filter((l) => l.status === "ACTIVE").length;

  const stats = [
    {
      title: "Total Pinjaman",
      value: totalLoanValue,
      icon: HandCoins,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Sisa Saldo",
      value: totalRemaining,
      icon: Wallet2,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Total Terbayar",
      value: totalPaid,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Pinjaman Aktif",
      value: activeLoans,
      isCount: true,
      icon: ReceiptJapaneseYen,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((item, idx) => (
        <Card key={idx} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-0">
            <div className="flex items-center p-6">
              <div className={`${item.bg} p-3 rounded-2xl mr-4 group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{item.title}</p>
                <h3 className="text-xl font-bold text-gray-800">
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
            <div className={`h-1 w-full ${item.bg.replace('bg-', 'bg-')}`} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default LoanStats;
