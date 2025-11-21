"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface SearchInputProps {
    onSearch: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    initialValue?: string;
    minLength?: number;
    debounceDelay?: number;
    variant?: "default" | "filled" | "glass";
}

const SearchInput = ({
    onSearch,
    placeholder = "Search...",
    disabled = false,
    className = "",
    initialValue = "",
    minLength = 2,
    debounceDelay = 500,
    variant = "filled",
}: SearchInputProps) => {
    const [searchTerm, setSearchTerm] = useState(initialValue);
    const [isSearching, setIsSearching] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Sync dengan initialValue
    useEffect(() => {
        setSearchTerm(initialValue);
    }, [initialValue]);

    // Debounced search
    const triggerSearch = useCallback(
        (value: string) => {
            if (timerRef.current) clearTimeout(timerRef.current);

            if (value === initialValue) return;
            if (value.trim() === "") {
                onSearch("");
                setIsSearching(false);
                return;
            }
            if (value.length < minLength) return;

            setIsSearching(true);

            timerRef.current = setTimeout(() => {
                onSearch(value.trim());
                setIsSearching(false);
            }, debounceDelay);
        },
        [onSearch, initialValue, minLength, debounceDelay]
    );

    useEffect(() => {
        triggerSearch(searchTerm);

        // Cleanup timer saat unmount
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [searchTerm, triggerSearch]);

    const handleClear = () => {
        setSearchTerm("");
        onSearch("");
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim().length >= minLength) {
            onSearch(searchTerm.trim());
        }
    };

    const getInputStyle = () => {
        switch (variant) {
            case "glass":
                return `
                    bg-white/80 dark:bg-gray-800/90 
                    backdrop-blur-md 
                    border-white/40 dark:border-gray-600/50 
                    focus:bg-white dark:focus:bg-gray-800 
                    focus:border-white/60 dark:focus:border-gray-500 
                    placeholder:text-gray-700 dark:placeholder:text-gray-300
                `;
            case "filled":
                return `
                    bg-white/95 dark:bg-gray-800/95 
                    border-white/30 dark:border-gray-600/40 
                    focus:bg-white dark:focus:bg-gray-800 
                    focus:border-white/50 dark:focus:border-gray-500 
                    placeholder:text-gray-600 dark:placeholder:text-gray-400
                `;
            default:
                return `
                    bg-white/90 dark:bg-gray-800/90 
                    border-white/40 dark:border-gray-600/50 
                    focus:bg-white dark:focus:bg-gray-800 
                    placeholder:text-gray-600 dark:placeholder:text-gray-400
                `;
        }
    };

    const showClearButton = searchTerm && !isSearching;
    const showMinLengthWarning = searchTerm.length > 0 && searchTerm.length < minLength;

    return (
        <form onSubmit={handleSubmit} className={`relative w-full sm:w-80 ${className}`} role="search">
            <div className="relative">
                {/* Search Icon */}
                <Search 
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600 dark:text-gray-400" 
                    aria-hidden="true" 
                />

                {/* Input Field */}
                <Input
                    type="search"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={handleInputChange}
                    disabled={disabled}
                    className={`
                        w-full pl-10 pr-10 search-clear-none
                        ${getInputStyle()}
                        transition-all duration-200
                        text-gray-900 dark:text-gray-100
                        dark:focus:ring-2 dark:focus:ring-gray-500/30
                    `}
                    aria-label="Search input"
                    aria-describedby={showMinLengthWarning ? "min-length-warning" : undefined}
                />

                {/* Clear Button */}
                {showClearButton && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                        onClick={handleClear}
                        disabled={disabled}
                        aria-label="Clear search"
                    >
                        <X className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                    </Button>
                )}

                {/* Loading Spinner */}
                {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Searching">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 dark:border-gray-400 border-t-transparent" />
                    </div>
                )}
            </div>

            {/* Validation Message */}
            {showMinLengthWarning && (
                <p 
                    id="min-length-warning" 
                    className="mt-1 text-xs text-gray-600 dark:text-gray-300" 
                    role="alert"
                >
                    Please enter at least {minLength} characters
                </p>
            )}
        </form>
    );
};

export default SearchInput;