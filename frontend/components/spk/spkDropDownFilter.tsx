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

interface SpkFilterProps {
  filterBy: string;
  onFilterChange: (value: string) => void;
  availableTeams: string[];
  className?: string;
  variant?: "default" | "glass" | "solid";
  size?: "sm" | "md" | "lg";
  mode?: "all" | "progress" | "team";
}

export default function SpkFilter({
  filterBy,
  onFilterChange,
  availableTeams,
  className = "",
  variant = "glass",
  size = "md",
  mode = "all",
}: SpkFilterProps) {
  const variantStyles = {
    default: "bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-700",
    glass:
      "bg-white/20 backdrop-blur-sm border-white/30 dark:text-white dark:bg-gray-800/30 dark:border-gray-600/40",
    solid: "bg-blue-600 border-blue-700 text-white dark:bg-blue-700 dark:border-blue-800",
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
        <SelectValue placeholder={mode === "team" ? "Pilih Tim" : mode === "progress" ? "Progress" : "Filter SPK"} />
      </SelectTrigger>

      <SelectContent className="rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
        {/* SEMUA DATA */}
        {(mode === "all" || mode === "team" || mode === "progress") && (
          <SelectItem value="all" className="text-blue-600 dark:text-blue-400">
            Semua {mode === "team" ? "Tim" : mode === "progress" ? "Status" : "Data"}
          </SelectItem>
        )}

        {/* FILTER UMUM / PROGRESS */}
        {(mode === "all" || mode === "progress") && (
          <>
            <SelectItem value="on-progress" className="text-amber-600 dark:text-amber-400">
              On Progress
            </SelectItem>
            <SelectItem value="open" className="text-blue-600 dark:text-blue-400">
              Open (Belum Closing)
            </SelectItem>
            <SelectItem value="closed" className="text-gray-600 dark:text-gray-400">
              Closed (Sudah Closing)
            </SelectItem>
            
            <SelectSeparator />
            
            <SelectGroup>
              <SelectLabel className="font-bold text-green-700 dark:text-green-300">
                Range Progress
              </SelectLabel>
              <SelectItem value="progress-0" className="text-green-600 dark:text-green-400">
                Progress 0%
              </SelectItem>
              <SelectItem value="progress-1-49" className="text-green-600 dark:text-green-400">
                Progress 1–49%
              </SelectItem>
              <SelectItem value="progress-50-99" className="text-green-700 dark:text-green-300">
                Progress 50–99%
              </SelectItem>
              <SelectItem value="progress-100" className="text-emerald-600 dark:text-emerald-400">
                Progress 100%
              </SelectItem>
            </SelectGroup>
          </>
        )}

        {/* FILTER TEAM */}
        {(mode === "all" || mode === "team") && (
          <>
            {mode === "all" && <SelectSeparator />}
            
            <SelectGroup>
              <SelectLabel className="font-bold text-purple-700 dark:text-purple-300">
                Daftar Tim
              </SelectLabel>
              <SelectItem value="without-team" className="text-red-600 dark:text-red-400">
                Tanpa Tim
              </SelectItem>
              {availableTeams.length > 0 && availableTeams.map((team) => (
                <SelectItem
                  key={team}
                  value={mode === "all" ? `team-${team}` : team}
                  className="text-purple-600 dark:text-purple-400"
                >
                  {team}
                </SelectItem>
              ))}
            </SelectGroup>
          </>
        )}
      </SelectContent>
    </Select>
  );
}
