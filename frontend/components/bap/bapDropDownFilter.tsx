"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface BapFilterProps {
  filterBy: string;
  onFilterChange: (value: string) => void;
  availableStatus: string[];
  className?: string;
  variant?: "default" | "glass" | "solid";
  size?: "sm" | "md" | "lg";
}

export default function BapFilter({
  filterBy,
  onFilterChange,
  availableStatus,
  className = "",
  variant = "glass",
  size = "md",
}: BapFilterProps) {
  const variantStyles = {
    default: "bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-700",
    glass:
      "bg-white/20 backdrop-blur-sm border-white/30 dark:text-white dark:bg-gray-800/30 dark:border-gray-600/40",
    solid: "bg-orange-600 border-orange-700 text-white dark:bg-orange-700 dark:border-orange-800",
  };

  const sizeStyles = {
    sm: "h-8 text-sm",
    md: "h-10 text-sm",
    lg: "h-12 text-base",
  };

  return (
    <Select value={filterBy} onValueChange={onFilterChange}>
      <SelectTrigger
        className={cn(
          "w-56 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md",
          "border backdrop-blur-md",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
      >
        <SelectValue placeholder="Filter BAP" />
      </SelectTrigger>

      <SelectContent className="rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
        {/* FILTER UMUM */}
        <SelectItem value="all" className="text-orange-600 dark:text-orange-400">
          Semua BAP
        </SelectItem>
        <SelectItem value="pending" className="text-amber-600 dark:text-amber-400">
          Pending
        </SelectItem>
        <SelectItem value="delivered" className="text-green-600 dark:text-green-400">
          Delivered
        </SelectItem>

        <SelectSeparator />

        {/* FILTER STATUS PENGIRIMAN */}
        <SelectGroup>
          <SelectLabel className="font-bold text-blue-700 dark:text-blue-300">
            Status Pengiriman
          </SelectLabel>

          <SelectItem value="partially_delivered" className="text-blue-600 dark:text-blue-400">
            Partially Delivered
          </SelectItem>

          <SelectItem value="in_transit" className="text-indigo-600 dark:text-indigo-400">
            In Transit
          </SelectItem>

          <SelectItem value="awaiting_confirmation" className="text-purple-600 dark:text-purple-400">
            Awaiting Confirmation
          </SelectItem>

          <SelectItem value="cancelled" className="text-red-600 dark:text-red-400">
            Cancelled
          </SelectItem>
        </SelectGroup>

        {/* FILTER STATUS CUSTOM DARI DATA */}
        {availableStatus.length > 0 && (
          <>
            <SelectSeparator />

            <SelectGroup>
              <SelectLabel className="font-bold text-purple-700 dark:text-purple-300">
                Status Lainnya
              </SelectLabel>

              {availableStatus.map((status) => (
                <SelectItem
                  key={status}
                  value={`status-${status}`}
                  className="text-purple-600 dark:text-purple-400"
                >
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectGroup>
          </>
        )}

        <SelectSeparator />

        {/* FILTER TANGGAL */}
        <SelectGroup>
          <SelectLabel className="font-bold text-emerald-700 dark:text-emerald-300">
            Berdasarkan Tanggal
          </SelectLabel>

          <SelectItem value="today" className="text-emerald-600 dark:text-emerald-400">
            Hari Ini
          </SelectItem>

          <SelectItem value="this_week" className="text-emerald-600 dark:text-emerald-400">
            Minggu Ini
          </SelectItem>

          <SelectItem value="this_month" className="text-emerald-700 dark:text-emerald-300">
            Bulan Ini
          </SelectItem>

          <SelectItem value="last_month" className="text-emerald-600 dark:text-emerald-400">
            Bulan Lalu
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}