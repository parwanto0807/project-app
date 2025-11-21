"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface SalesOrderSearchProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  initialValue?: string;
  minLength?: number;
}

const SalesOrderSearch = ({
  onSearch,
  placeholder = "Search sales order...",
  disabled = false,
  className = "",
  initialValue = "",
  minLength = 2,
}: SalesOrderSearchProps) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);

  // Sync dengan initialValue dari URL
  useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

  // Debounce search dengan useEffect
  useEffect(() => {
    // Jika search term sama dengan initial value, skip
    if (searchTerm === initialValue) return;

    // Jika search term kosong, langsung search
    if (searchTerm.trim() === "") {
      onSearch("");
      setIsSearching(false);
      return;
    }

    // Jika kurang dari minimal karakter, skip
    if (searchTerm.length < minLength) return;

    setIsSearching(true);

    const timerId = setTimeout(() => {
      onSearch(searchTerm.trim());
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timerId);
  }, [searchTerm, initialValue, onSearch, minLength]);

  const handleClear = () => {
    setSearchTerm("");
    onSearch("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trigger search langsung saat submit
    if (searchTerm.trim() === "") {
      onSearch("");
    } else if (searchTerm.length >= minLength) {
      onSearch(searchTerm.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative w-full sm:w-80 ${className}`}>
      <div className="relative">
        {/* Search Icon */}
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        
        {/* Input Field */}
        <Input
          type="search"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={disabled}
          className="w-full pl-10 pr-10"
        />

        {/* Clear Button - hanya muncul ketika ada teks dan tidak sedang searching */}
        {searchTerm && !isSearching && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-transparent"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-3 w-3 text-muted-foreground" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}

        {/* Loading Indicator - menggantikan clear button ketika searching */}
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>

      {/* Validation Message */}
      {searchTerm.length > 0 && searchTerm.length < minLength && (
        <p className="mt-1 text-xs text-muted-foreground">
          Please enter at least {minLength} characters
        </p>
      )}
    </form>
  );
};

export default SalesOrderSearch;