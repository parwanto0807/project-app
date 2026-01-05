"use client";

import { useState, useEffect, useRef } from "react";
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
    variant?: "default" | "filled" | "glass";
    showLoading?: boolean;
    isLoading?: boolean;
    preserveFocus?: boolean;
    messages?: {
        placeholder?: string;
        minLengthWarning?: (minLength: number) => string;
        clearButtonLabel?: string;
        searchingLabel?: string;
        pressEnterToSearch?: string;
    };
    "data-testid"?: string;
    onError?: (error: Error) => void;
}

const SearchInput = ({
    onSearch,
    placeholder = "Search...",
    disabled = false,
    className = "",
    initialValue = "",
    minLength = 1,
    variant = "filled",
    showLoading = true,
    isLoading, // Removed default value to detect controlled mode
    preserveFocus = true,
    messages = {},
    "data-testid": testId = "search-input",
    onError,
}: SearchInputProps) => {
    const [searchTerm, setSearchTerm] = useState(initialValue);
    const [isSearching, setIsSearching] = useState(false);
    const [hasError, setHasError] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const mountedRef = useRef(true);

    // Cleanup
    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Sync dengan initialValue
    useEffect(() => {
        if (mountedRef.current) {
            setSearchTerm(prevSearchTerm => {
                if (initialValue !== prevSearchTerm) {
                    return initialValue;
                }
                return prevSearchTerm;
            });
            setIsSearching(false);
        }
    }, [initialValue]);

    // 🔥 SIMPLE: Handle search ketika Enter ditekan
    const handleSearch = async (value: string) => {
        const trimmedValue = value.trim();

        // Handle empty search
        if (trimmedValue === "") {
            try {
                onSearch("");
                setHasError(false);
            } catch (error) {
                setHasError(true);
                onError?.(error as Error);
            }
            return;
        }

        // Handle min length validation
        if (trimmedValue.length < minLength) {
            return;
        }

        // Execute search
        if (showLoading) setIsSearching(true);
        setHasError(false);

        try {
            await onSearch(trimmedValue);
        } catch (error) {
            setHasError(true);
            onError?.(error as Error);
        } finally {
            if (mountedRef.current && showLoading) {
                setIsSearching(false);
            }

            // PRESERVE FOCUS
            if (preserveFocus && inputRef.current) {
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 0);
            }
        }
    };

    // 🔥 SIMPLE: Handle input change hanya update state
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setHasError(false);
    };

    // 🔥 SIMPLE: Handle submit form (Enter key)
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(searchTerm);
    };

    // 🔥 SIMPLE: Handle key down untuk Escape
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            handleClear();
        }
    };

    const handleClear = () => {
        setSearchTerm("");
        setHasError(false);

        try {
            onSearch("");

            // FOCUS MANAGEMENT
            if (inputRef.current) {
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 0);
            }
        } catch (error) {
            setHasError(true);
            onError?.(error as Error);
        }
    };

    const getInputStyle = () => {
        const baseStyles = `
            w-full pl-10 pr-12 search-clear-none
            transition-all duration-200
            text-gray-900 dark:text-gray-100
            dark:focus:ring-2 dark:focus:ring-gray-500/30
        `;

        const variantStyles = {
            glass: `
                bg-white/80 dark:bg-gray-800/90 
                backdrop-blur-md 
                border-white/40 dark:border-gray-600/50 
                focus:bg-white dark:focus:bg-gray-800 
                focus:border-white/60 dark:focus:border-gray-500 
                placeholder:text-gray-700 dark:placeholder:text-gray-300
            `,
            filled: `
                bg-white/95 dark:bg-gray-800/95 
                border-cyan/30 dark:border-gray-600/40 
                focus:bg-white dark:focus:bg-gray-800 
                focus:border-white/50 dark:focus:border-gray-500 
                placeholder:text-gray-600 dark:placeholder:text-gray-400
            `,
            default: `
                bg-white/90 dark:bg-gray-800/90 
                border-white/40 dark:border-gray-600/50 
                focus:bg-white dark:focus:bg-gray-800 
                placeholder:text-gray-600 dark:placeholder:text-gray-400
            `,
        };

        const errorStyles = hasError
            ? `border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400`
            : ``;

        return `${baseStyles} ${variantStyles[variant]} ${errorStyles}`;
    };

    const defaultMessages = {
        placeholder,
        minLengthWarning: (min: number) => `Please enter at least ${min} characters`,
        clearButtonLabel: "Clear search",
        searchingLabel: "Searching...",
        pressEnterToSearch: "Tekan Enter untuk mencari",
    };

    const finalMessages = { ...defaultMessages, ...messages };

    const showClearButton = searchTerm && !isSearching;
    const showMinLengthWarning = searchTerm.length > 0 && searchTerm.length < minLength;
    const showEnterHint = searchTerm.length > 0;

    // Logic: If isLoading is passed (controlled), use it. Otherwise use internal isSearching.
    const shouldShowLoading = (isLoading !== undefined ? isLoading : isSearching) && showLoading;

    return (
        <form
            onSubmit={handleSubmit}
            className={`relative w-full ${className}`}
            role="search"
            data-testid={testId}
        >
            <div className="relative">
                {/* Search Icon */}
                <Search
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600 dark:text-gray-400"
                    aria-hidden="true"
                />

                {/* Input Field */}
                <Input
                    ref={inputRef}
                    type="search"
                    placeholder={finalMessages.placeholder}
                    value={searchTerm}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    className={getInputStyle()}
                    aria-label="Search input"
                    aria-describedby={
                        showMinLengthWarning ? "min-length-warning" :
                            showEnterHint ? "enter-hint" : undefined
                    }
                    aria-invalid={hasError}
                    data-testid={`${testId}-input`}
                />

                {/* Right Side Indicators */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {/* Loading Spinner */}
                    {shouldShowLoading && (
                        <div
                            className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800"
                            role="status"
                            aria-label={finalMessages.searchingLabel}
                        >
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-600 dark:border-gray-400 border-t-transparent" />
                        </div>
                    )}

                    {/* Clear Button */}
                    {showClearButton && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                            onClick={handleClear}
                            disabled={disabled || isSearching}
                            aria-label={finalMessages.clearButtonLabel}
                            data-testid={`${testId}-clear-button`}
                        >
                            <X className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Validation & Hint Messages */}
            <div className="mt-1 space-y-1">
                {showMinLengthWarning && (
                    <p
                        id="min-length-warning"
                        className="text-xs text-amber-600 dark:text-amber-400"
                        role="alert"
                    >
                        {finalMessages.minLengthWarning(minLength)}
                    </p>
                )}

                {showEnterHint && (
                    <p
                        id="enter-hint"
                        className="text-sm text-white dark:text-white"
                        role="status"
                    >
                        {finalMessages.pressEnterToSearch}
                    </p>
                )}

                {hasError && (
                    <p
                        className="text-xs text-red-600 dark:text-red-400"
                        role="alert"
                        data-testid={`${testId}-error`}
                    >
                        Something went wrong with your search
                    </p>
                )}
            </div>
        </form>
    );
};

export default SearchInput;