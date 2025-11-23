"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Clock, Timer } from "lucide-react";

interface SearchInputProps {
    onSearch: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    initialValue?: string;
    minLength?: number;
    debounceDelay?: number;
    variant?: "default" | "filled" | "glass";
    showTypingIndicator?: boolean;
    showDebounceTimer?: boolean;
    allowManualSubmit?: boolean;
    showLoading?: boolean;
    preserveFocus?: boolean;
    messages?: {
        placeholder?: string;
        minLengthWarning?: (minLength: number) => string;
        clearButtonLabel?: string;
        searchingLabel?: string;
        typingIndicator?: string;
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
    debounceDelay = 600,
    variant = "filled",
    showTypingIndicator = true,
    showDebounceTimer = false,
    allowManualSubmit = true,
    showLoading = true,
    preserveFocus = true,
    messages = {},
    "data-testid": testId = "search-input",
    onError,
}: SearchInputProps) => {
    const [searchTerm, setSearchTerm] = useState(initialValue);
    const [isSearching, setIsSearching] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [hasError, setHasError] = useState(false);

    // 🔥 FIX: Gunakan useRef untuk semua timer dengan type yang benar
    const timerRef = useRef<number | null>(null);
    const typingTimerRef = useRef<number | null>(null);
    const countdownRef = useRef<number | null>(null);
    const onSearchRef = useRef(onSearch);
    const mountedRef = useRef(true);
    const inputRef = useRef<HTMLInputElement>(null);

    // Update ref saat onSearch berubah
    useEffect(() => {
        onSearchRef.current = onSearch;
    }, [onSearch]);

    // 🔥 FIX: Cleanup yang lebih robust
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            
            // Clear semua timeout
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            if (typingTimerRef.current) {
                clearTimeout(typingTimerRef.current);
                typingTimerRef.current = null;
            }
            
            // Clear interval
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
            }
        };
    }, []);

    // 🔥 FIX: Sync initialValue tanpa menyebabkan re-render berlebihan
    useEffect(() => {
        if (initialValue !== searchTerm && mountedRef.current) {
            setSearchTerm(initialValue);
        }
    }, [initialValue, searchTerm]);

    // 🔥 FIX: Debounced search yang lebih reliable
    const triggerSearch = useCallback(
        (value: string, immediate: boolean = false) => {
            // Clear existing timers
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
            }

            // Reset states
            setTimeRemaining(0);
            setIsTyping(false);

            const trimmedValue = value.trim();

            // Handle empty search
            if (trimmedValue === "") {
                try {
                    onSearchRef.current("");
                    if (showLoading) setIsSearching(false);
                    setHasError(false);
                } catch (error) {
                    setHasError(true);
                    onError?.(error as Error);
                }
                return;
            }

            // Handle min length validation
            if (trimmedValue.length < minLength) {
                if (showDebounceTimer) {
                    setTimeRemaining(0);
                }
                if (showLoading) setIsSearching(false);
                return;
            }

            // Immediate search (Enter key atau submit manual)
            if (immediate) {
                if (showLoading) setIsSearching(true);
                try {
                    onSearchRef.current(trimmedValue);
                    // 🔥 FIX: Jangan langsung set false, biarkan parent yang handle
                    setTimeout(() => {
                        if (mountedRef.current && showLoading) {
                            setIsSearching(false);
                        }
                    }, 100);
                } catch (error) {
                    setHasError(true);
                    if (showLoading) setIsSearching(false);
                    onError?.(error as Error);
                }
                return;
            }

            // 🔥 FIX: Debounced search dengan state management yang lebih baik
            if (showLoading) setIsSearching(true);
            setHasError(false);

            if (showDebounceTimer) {
                let remaining = debounceDelay;
                setTimeRemaining(remaining);

                countdownRef.current = window.setInterval(() => {
                    remaining -= 100;
                    if (mountedRef.current) {
                        setTimeRemaining(Math.max(0, remaining));
                    }
                    if (remaining <= 0 && countdownRef.current) {
                        clearInterval(countdownRef.current);
                        countdownRef.current = null;
                    }
                }, 100);
            }

            timerRef.current = window.setTimeout(() => {
                if (!mountedRef.current) return;

                try {
                    onSearchRef.current(trimmedValue);
                    
                    // 🔥 FIX: Delay sedikit sebelum hide loading
                    setTimeout(() => {
                        if (mountedRef.current) {
                            if (showLoading) setIsSearching(false);
                            setTimeRemaining(0);
                        }
                    }, 200);

                    // PRESERVE FOCUS
                    if (preserveFocus && inputRef.current) {
                        setTimeout(() => {
                            inputRef.current?.focus();
                        }, 0);
                    }
                } catch (error) {
                    setHasError(true);
                    if (showLoading) setIsSearching(false);
                    setTimeRemaining(0);
                    onError?.(error as Error);
                }
            }, debounceDelay);
        },
        [minLength, debounceDelay, onError, showDebounceTimer, showLoading, preserveFocus]
    );

    // 🔥 FIX: Handle input change dengan debounce yang proper
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        try {
            setSearchTerm(value);
            setHasError(false);

            // Show typing indicator untuk user lambat
            if (showTypingIndicator) {
                setIsTyping(true);
                if (typingTimerRef.current) {
                    clearTimeout(typingTimerRef.current);
                }
                typingTimerRef.current = window.setTimeout(() => {
                    if (mountedRef.current) {
                        setIsTyping(false);
                    }
                }, 300);
            }

            // Trigger search dengan debounce
            triggerSearch(value);
        } catch (error) {
            setHasError(true);
            onError?.(error as Error);
        }
    };

    const handleClear = () => {
        // Clear semua timer
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current);
            typingTimerRef.current = null;
        }
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }

        setSearchTerm("");
        setIsTyping(false);
        setTimeRemaining(0);

        try {
            onSearch("");
            if (showLoading) setIsSearching(false);
            setHasError(false);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        if (searchTerm.trim().length >= minLength) {
            triggerSearch(searchTerm, true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            handleClear();
        }
        if (e.key === 'Enter' && allowManualSubmit) {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            e.preventDefault();
            triggerSearch(searchTerm, true);
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
        typingIndicator: "Typing...",
        pressEnterToSearch: "Tekan Enter untuk pencarian data...",
    };

    const finalMessages = { ...defaultMessages, ...messages };

    const showClearButton = searchTerm && !isSearching;
    const showMinLengthWarning = searchTerm.length > 0 && searchTerm.length < minLength;
    const showEnterHint = allowManualSubmit && searchTerm.length > 0;

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
                    {/* Typing Indicator */}
                    {isTyping && showTypingIndicator && (
                        <div
                            className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            role="status"
                            aria-label={finalMessages.typingIndicator}
                        >
                            <Clock className="h-3 w-3" />
                            <span className="text-xs font-medium">{finalMessages.typingIndicator}</span>
                        </div>
                    )}

                    {/* Debounce Timer */}
                    {showDebounceTimer && timeRemaining > 0 && (
                        <div
                            className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                            role="timer"
                            aria-label={`Searching in ${timeRemaining / 1000} seconds`}
                        >
                            <Timer className="h-3 w-3" />
                            <span className="text-xs font-medium">{timeRemaining / 1000}s</span>
                        </div>
                    )}

                    {/* Loading Spinner */}
                    {isSearching && !isTyping && showLoading && (
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
                            disabled={disabled}
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
                        className="text-sm text-yellow-200 dark:text-yellow-300 flex items-center gap-1"
                        style={{
                            textShadow: '0 0 10px rgb(253 224 71), 0 0 20px rgb(253 224 71)',
                            animation: 'pulse 2s ease-in-out infinite'
                        }}
                        role="status"
                    >
                        <span 
                            className="text-lg"
                            style={{
                                filter: 'drop-shadow(0 0 8px rgb(253 224 71))'
                            }}
                        >
                            ⏎
                        </span>
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