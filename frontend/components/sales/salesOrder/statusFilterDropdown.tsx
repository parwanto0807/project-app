"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Filter, ChevronDown } from "lucide-react";
import { OrderStatusEnum } from "@/schemas/index";
import z from "zod";

type OrderStatus = z.infer<typeof OrderStatusEnum>;

interface StatusFilterConfig {
    label: string;
    className?: string;
}

interface StatusFilterDropdownProps {
    statusFilter: OrderStatus | "ALL";
    setStatusFilter: (value: OrderStatus | "ALL") => void;
    statusConfig: Record<string, StatusFilterConfig>;
    disabled?: boolean;
}

const StatusFilterDropdown = ({
    statusFilter,
    setStatusFilter,
    statusConfig,
    disabled = false,
}: StatusFilterDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleStatusSelect = (status: OrderStatus | "ALL") => {
        setStatusFilter(status);
        setIsOpen(false);
    };

    const getDisplayText = () => {
        if (statusFilter === "ALL") {
            return "All Status";
        }
        return statusConfig[statusFilter]?.label || "Select Status";
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="outline"
                className="flex items-center gap-2 bg-transparent dark:hover:bg-slate-800 hover:bg-slate-100"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
            >
                <Filter className="h-4 w-4" />
                {getDisplayText()}
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-50 overflow-hidden"
                    >
                        {/* All Status Option */}
                        <button
                            onClick={() => handleStatusSelect("ALL")}
                            className={`w-full px-3 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${statusFilter === "ALL"
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                                : "text-slate-700 dark:text-slate-300"
                                }`}
                        >
                            All Status
                        </button>

                        {/* Separator */}
                        <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

                        {/* Status Options */}
                        {Object.entries(statusConfig)
                            .filter(([status]) => status !== "ALL")
                            .map(([status, config]) => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusSelect(status as OrderStatus)}
                                    className={`w-full px-3 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${statusFilter === status
                                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                                        : "text-slate-700 dark:text-slate-300"
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {config.className && (
                                            <div className={`h-2 w-2 rounded-full ${config.className}`} />
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

export default StatusFilterDropdown;