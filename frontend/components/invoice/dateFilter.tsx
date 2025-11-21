"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateFilterProps {
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  className?: string;
}

export function DateFilter({ dateFilter, onDateFilterChange, className = "" }: DateFilterProps) {
  
  const getDateFilters = () => {
    const today = new Date();
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });
    };

    return [
      { value: "all", label: "Semua Tanggal" },
      { 
        value: "today", 
        label: `Hari Ini (${formatDate(today)})` 
      },
      { 
        value: "this_week", 
        label: `Minggu Ini` 
      },
      { 
        value: "this_month", 
        label: `Bulan Ini (${today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})` 
      },
      { 
        value: "last_7_days", 
        label: "7 Hari Terakhir" 
      },
      { 
        value: "last_30_days", 
        label: "30 Hari Terakhir" 
      },
    ];
  };

  const dateFilters = getDateFilters();

  return (
    <Select value={dateFilter} onValueChange={onDateFilterChange}>
      <SelectTrigger className={`w-48 ${className}`}>
        <SelectValue placeholder="Filter Tanggal" />
      </SelectTrigger>
      <SelectContent>
        {dateFilters.map((filter) => (
          <SelectItem key={filter.value} value={filter.value}>
            {filter.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}