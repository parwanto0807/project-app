"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Filter, ChevronDown } from "lucide-react";
import { SupplierStatus } from "@/types/supplierType";

interface StatusFilterConfig {
  label: string;
  className?: string;
}

interface SupplierStatusDropdownProps {
  statusFilter: SupplierStatus | "ALL";
  setStatusFilter: (value: SupplierStatus | "ALL") => void;
  statusConfig: Record<SupplierStatus, StatusFilterConfig>;
  disabled?: boolean;
}

const SupplierStatusDropdown = ({
  statusFilter,
  setStatusFilter,
  statusConfig,
  disabled = false,
}: SupplierStatusDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (status: SupplierStatus | "ALL") => {
    setStatusFilter(status);
    setIsOpen(false);
  };

  const displayText =
    statusFilter === "ALL"
      ? "All Status"
      : statusConfig[statusFilter]?.label ?? "Select Status";

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        className="flex items-center gap-2 bg-transparent dark:hover:bg-slate-800 hover:bg-slate-100"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <Filter className="h-4 w-4" />
        {displayText}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-50 overflow-hidden"
          >
            {/* ALL */}
            <button
              onClick={() => handleSelect("ALL")}
              className={`w-full px-3 py-2 text-sm text-left transition-colors ${
                statusFilter === "ALL"
                  ? "bg-slate-100 dark:bg-slate-800 font-medium text-black dark:text-white"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-black dark:text-white"
              }`}
            >
              All Status
            </button>

            {/* Divider */}
            <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

            {/* Status List */}
            {Object.entries(statusConfig).map(([status, config]) => (
              <button
                key={status}
                onClick={() => handleSelect(status as SupplierStatus)}
                className={`w-full px-3 py-2 text-sm text-left transition-colors ${
                  statusFilter === status
                    ? "bg-slate-100 dark:bg-slate-800 font-medium text-black dark:text-white"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-black dark:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  {config.className && (
                    <span
                      className={`h-2 w-2 rounded-full ${config.className}`}
                    />
                  )}
                  {config.label}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupplierStatusDropdown;
