"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ListFilter } from "lucide-react";

interface ItemsPerPageDropdownProps {
    itemsPerPage: number;
    itemsPerPageOptions: number[];
    onItemsPerPageChange: (value: number) => void;
    disabled?: boolean;
}

export default function ItemsPerPageDropdown({
    itemsPerPage,
    itemsPerPageOptions,
    onItemsPerPageChange,
    disabled = false,
}: ItemsPerPageDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
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

    const handleOptionClick = (option: number) => {
        onItemsPerPageChange(option);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="outline"
                className="flex items-center gap-2 bg-transparent dark:hover:bg-slate-800 hover:bg-slate-100"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
            >
                <ListFilter className="h-4 w-4" />
                {itemsPerPage} per page
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </Button>

            {/* Custom Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-1 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-50 overflow-hidden">
                    {itemsPerPageOptions.map((option) => (
                        <button
                            key={option}
                            onClick={() => handleOptionClick(option)}
                            className={`w-full px-3 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${itemsPerPage === option
                                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                                    : "text-slate-700 dark:text-slate-300"
                                }`}
                        >
                            {option} per page
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}