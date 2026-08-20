import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProductCreateDialog } from "../sales/salesOrder/productDialog";

interface ProductComboboxProps {
    value: string;
    onValueChange: (value: string) => void;
    products: Array<{ id: string; name: string; code?: string; availableStock?: number; unit?: string; storageUnit?: string }>;
    error?: boolean;
    placeholder?: string;
    onCreated?: (product: { id: string; name: string; code?: string }) => void;
}

export const ProductCombobox = React.forwardRef<HTMLButtonElement, ProductComboboxProps>(
    ({ value, onValueChange, products, error = false, placeholder = "Pilih Barang / Part Number", onCreated }, ref) => {
        const [isOpen, setIsOpen] = useState(false);
        const [search, setSearch] = useState("");
        const [activeIndex, setActiveIndex] = useState(-1);
        const inputRef = useRef<HTMLInputElement>(null);
        const listRef = useRef<HTMLDivElement>(null);

        const selectedProduct = products.find((p) => p.id === value);

        // Auto focus input when dropdown opens
        useEffect(() => {
            if (isOpen) {
                const timer = setTimeout(() => {
                    inputRef.current?.focus();
                }, 50);
                return () => clearTimeout(timer);
            } else {
                setSearch("");
            }
        }, [isOpen]);

        const filteredProducts = products.filter((p) => {
            if (!search.trim()) return true;
            const q = search.toLowerCase().trim();
            const codeMatch = p.code ? p.code.toLowerCase().includes(q) : false;
            const nameMatch = p.name ? p.name.toLowerCase().includes(q) : false;
            return codeMatch || nameMatch;
        });

        // Reset active index when search changes or dropdown opens
        useEffect(() => {
            setActiveIndex(0);
        }, [search, isOpen]);

        // Scroll active item into view
        useEffect(() => {
            if (isOpen && activeIndex >= 0 && listRef.current) {
                const listItems = listRef.current.querySelectorAll('[data-product-item="true"]');
                const activeElement = listItems[activeIndex] as HTMLElement;
                if (activeElement) {
                    activeElement.scrollIntoView({ block: "nearest" });
                }
            }
        }, [activeIndex, isOpen]);

        const handleSelect = (productId: string) => {
            onValueChange(productId);
            setIsOpen(false);
            setSearch("");
        };

        return (
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        ref={ref}
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={isOpen}
                        className={cn(
                            "w-full justify-between text-left font-normal truncate bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 shadow-sm rounded-lg h-10 px-3",
                            !value && "text-muted-foreground",
                            error && "border-red-500"
                        )}
                    >
                        <span className="truncate flex items-center gap-2">
                            {selectedProduct ? (
                                <>
                                    {selectedProduct.code && (
                                        <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded shrink-0">
                                            {selectedProduct.code}
                                        </span>
                                    )}
                                    <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                                        {selectedProduct.name}
                                    </span>
                                </>
                            ) : (
                                placeholder
                            )}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent 
                    className="w-[var(--radix-popover-trigger-width)] min-w-[340px] max-w-[480px] p-2 space-y-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[9999]" 
                    align="start"
                >
                    {/* Search Input Box */}
                    <div className="relative flex items-center">
                        <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari part number atau nama barang..."
                            className="pl-9 pr-8 h-9 text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg focus-visible:ring-emerald-500"
                            onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                    setIsOpen(false);
                                } else if (e.key === "ArrowDown") {
                                    e.preventDefault();
                                    setActiveIndex((prev) => Math.min(prev + 1, filteredProducts.length - 1));
                                } else if (e.key === "ArrowUp") {
                                    e.preventDefault();
                                    setActiveIndex((prev) => Math.max(prev - 1, 0));
                                } else if (e.key === "Enter") {
                                    e.preventDefault();
                                    if (activeIndex >= 0 && activeIndex < filteredProducts.length) {
                                        handleSelect(filteredProducts[activeIndex].id);
                                    }
                                }
                            }}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Product List */}
                    <div ref={listRef} className="max-h-60 overflow-y-auto space-y-0.5 pr-1">
                        {filteredProducts.length === 0 ? (
                            <div className="p-4 text-center">
                                <p className="text-xs text-slate-400 mb-2">
                                    {search ? `"${search}" tidak ditemukan` : "Tidak ada data barang"}
                                </p>
                                {onCreated && search && (
                                    <ProductCreateDialog
                                        createEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/api/master/product/createProduct`}
                                        onCreated={(created) => {
                                            onCreated(created);
                                            handleSelect(created.id);
                                        }}
                                        trigger={
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs"
                                            >
                                                <Plus className="h-3.5 w-3.5 mr-1.5" />
                                                Tambah Produk Baru
                                            </Button>
                                        }
                                    />
                                )}
                            </div>
                        ) : (
                            filteredProducts.map((p, index) => {
                                const isSelected = value === p.id;
                                const stockVal = p.availableStock;
                                const unitVal = p.storageUnit || p.unit || "pcs";
                                return (
                                    <div
                                        key={p.id}
                                        data-product-item="true"
                                        onClick={() => handleSelect(p.id)}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        className={cn(
                                            "cursor-pointer py-2 px-3 rounded-lg flex items-center justify-between text-sm transition-colors",
                                            isSelected || activeIndex === index
                                                ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 font-semibold"
                                                : "hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            {p.code ? (
                                                <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded shrink-0">
                                                    {p.code}
                                                </span>
                                            ) : (
                                                <span className="font-mono text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                                                    No Code
                                                </span>
                                            )}
                                            <span className="truncate">{p.name}</span>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                            {stockVal !== undefined && (
                                                <span className={cn(
                                                    "text-[11px] font-mono font-semibold px-2 py-0.5 rounded",
                                                    stockVal > 0 
                                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800" 
                                                        : "bg-red-50 text-red-600 dark:bg-red-950/80 dark:text-red-400 border border-red-200/50 dark:border-red-800"
                                                )}>
                                                    Stok: {stockVal} {unitVal}
                                                </span>
                                            )}
                                            {isSelected && (
                                                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        );
    }
);
ProductCombobox.displayName = "ProductCombobox";

