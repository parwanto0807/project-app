"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface ProductSearchProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  initialValue?: string; // ✅ Tambahkan initialValue
}

const ProductSearch = ({
  onSearch,
  placeholder = "Search products...",
  disabled = false,
  className = "",
  initialValue = "", // ✅ Default value
}: ProductSearchProps) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);

  // ✅ Sync dengan initialValue (untuk URL changes)
  useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

  // Debounce search term
  useEffect(() => {
    if (searchTerm === initialValue) return; // ✅ Hindari loop

    if (searchTerm === "") {
      onSearch("");
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timerId = setTimeout(() => {
      onSearch(searchTerm);
      setIsSearching(false);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm, onSearch, initialValue]);

  const handleClear = () => {
    setSearchTerm("");
    onSearch("");
  };

  return (
    <div className={`relative w-full sm:w-80 ${className}`}>
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground ${isSearching ? "animate-pulse" : ""}`} />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={disabled}
          className="w-full pl-10 pr-10 bg-background text-black"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 transform p-0 hover:bg-transparent"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>
      
      {/* Loading indicator */}
      {isSearching && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
};

export default ProductSearch;