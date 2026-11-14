"use client";

import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import Link from "next/link";
import {
  Calculator,
  BookOpen,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { FinancePageShell, FinancePageHeader } from "@/components/finance/FinanceUI";

const modules = [
  {
    title: "Trial Balance",
    description: "Saldo awal, mutasi, dan saldo akhir per akun untuk memastikan debit = kredit.",
    href: "/admin-area/accounting/trial-balance",
    icon: Calculator,
    tone: "blue",
    cta: "Lihat Laporan",
  },
  {
    title: "General Ledger",
    description: "Rangkuman mutasi per akun untuk periode tertentu.",
    href: "/admin-area/accounting/ledger",
    icon: BookOpen,
    tone: "emerald",
    cta: "Lihat Ledger",
  },
  {
    title: "Accounting Periods",
    description: "Kelola tahun fiskal dan periode bulanan.",
    href: "/admin-area/accounting/accounting-period",
    icon: Calendar,
    tone: "violet",
    cta: "Kelola Periode",
  },
  {
    title: "General Ledger Summary",
    description: "Ringkasan mutasi per akun dengan KPI.",
    href: "/admin-area/accounting/general-ledger",
    icon: BookOpen,
    tone: "amber",
    cta: "Lihat Ringkasan",
  },
  {
    title: "Opening Balance",
    description: "Saldo awal per akun, posting ke ledger.",
    href: "/admin-area/accounting/opening-balance",
    icon: Calculator,
    tone: "slate",
    cta: "Kelola Saldo Awal",
  },
  {
    title: "Staff Balance",
    description: "Saldo karyawan & ledger detail.",
    href: "/admin-area/accounting/staff-balance",
    icon: Calculator,
    tone: "rose",
    cta: "Lihat Saldo Staff",
  },
];

const toneMap: Record<string, string> = {
  blue: "border-l-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  emerald: "border-l-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
  violet: "border-l-violet-500 bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400",
  amber: "border-l-amber-500 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
  slate: "border-l-slate-500 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  rose: "border-l-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400",
};

export default function AccountingDashboard() {
  const layoutProps: LayoutProps = {
    title: "Accounting",
    role: "admin",
    children: (
      <FinancePageShell>
        <FinancePageHeader
          title="Accounting"
          description="Kelola pencatatan, laporan, dan periode akuntansi."
          icon={<Calculator className="h-5 w-5" />}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.href}
                href={m.href}
                className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneMap[m.tone]}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {m.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                  {m.description}
                </p>
                <span className="mt-3 text-[11px] font-semibold text-brand-600 group-hover:underline dark:text-brand-400">
                  {m.cta}
                </span>
              </Link>
            );
          })}
        </div>
      </FinancePageShell>
    ),
  };

  return <AdminLayout {...layoutProps} />;
}
