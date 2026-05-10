"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface PayrollPeriodSelectorProps {
  periode: string; // "YYYY-MM"
  onChange: (periode: string) => void;
}

const PayrollPeriodSelector: React.FC<PayrollPeriodSelectorProps> = ({ periode, onChange }) => {
  const prev = () => {
    const d = new Date(periode + "-01");
    d.setMonth(d.getMonth() - 1);
    onChange(d.toISOString().slice(0, 7));
  };

  const next = () => {
    const d = new Date(periode + "-01");
    d.setMonth(d.getMonth() + 1);
    onChange(d.toISOString().slice(0, 7));
  };

  const label = format(new Date(periode + "-01"), "MMMM yyyy", { locale: id });

  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-sm">
      <Calendar className="h-4 w-4 text-gray-400" />
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={prev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2">
        <span className="font-bold text-gray-800 min-w-[140px] text-center">{label}</span>
        <Input
          type="month"
          className="w-[140px] h-7 text-xs rounded-lg border-gray-200 opacity-0 absolute"
          value={periode}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={next}>
        <ChevronRight className="h-4 w-4" />
      </Button>
      <input
        type="month"
        className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-300"
        value={periode}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default PayrollPeriodSelector;
