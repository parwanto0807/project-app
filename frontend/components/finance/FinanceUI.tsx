"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

/**
 * Shell halaman modul finance/accounting.
 * - Padding responsif (mobile -> tablet -> desktop)
 * - Latar lembut yang konsisten
 * - Container max-width untuk readability di layar lebar
 */
export function FinancePageShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-4 sm:p-6 lg:p-8",
        "bg-slate-50/60 dark:bg-slate-900/40 min-h-screen",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Header halaman finance yang ringkas & elegan.
 */
export function FinancePageHeader({
  title,
  description,
  icon,
  actions,
  className = "",
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

/**
 * Kartu ringkas untuk KPI/statistik.
 */
export function FinanceStatCard({
  label,
  value,
  hint,
  icon,
  tone = "blue",
  className = "",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: "blue" | "emerald" | "amber" | "rose" | "violet" | "slate";
  className?: string;
}) {
  const toneMap: Record<string, string> = {
    blue: "from-blue-500 to-indigo-600",
    emerald: "from-emerald-500 to-teal-600",
    amber: "from-amber-500 to-orange-600",
    rose: "from-rose-500 to-pink-600",
    violet: "from-violet-500 to-purple-600",
    slate: "from-slate-500 to-slate-700",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4",
        className
      )}
    >
      {icon && (
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
            toneMap[tone]
          )}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="truncate text-base font-bold text-slate-900 dark:text-slate-100 sm:text-lg">
          {value}
        </p>
        {hint && (
          <p className="truncate text-[10px] text-slate-400 dark:text-slate-500">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Kartu pembungkus tabel: overflow horizontal di mobile, empty state slot.
 */
export function FinanceTableCard({
  children,
  title,
  description,
  className = "",
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
        className
      )}
    >
      {(title || description) && (
        <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-5">
          {title && (
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 sm:text-base">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

/**
 * Empty state ringkas.
 */
export function FinanceEmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-4 py-10 text-center",
        className
      )}
    >
      {icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
          {icon}
        </span>
      )}
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        {title}
      </p>
      {description && (
        <p className="max-w-xs text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
