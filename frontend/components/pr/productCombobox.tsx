import React, { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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

        const selectedProduct = products.find((p) => p.id === value);

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
                    className="w-[var(--radix-popover-trigger-width)] min-w-[340px] max-w-[480px] p-0 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[9999] bg-white dark:bg-slate-950 overflow-hidden"
                    align="start"
                >
                    <Command>
                        <div className="relative flex items-center border-b border-slate-100 dark:border-slate-800">
                            <CommandInput
                                placeholder="Cari part number atau nama barang..."
                                className="h-9 text-sm"
                            />
                        </div>
                        <CommandList className="max-h-60">
                            <CommandEmpty className="py-4 text-center">
                                <p className="text-xs text-slate-400 mb-2">
                                    Tidak ditemukan
                                </p>
                                {onCreated && (
                                    <ProductCreateDialog
                                        createEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/api/master/product/createProduct`}
                                        onCreated={(created) => {
                                            onCreated(created);
                                            onValueChange(created.id);
                                            setIsOpen(false);
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
                            </CommandEmpty>
                            <CommandGroup className="p-1">
                                {products.map((p) => {
                                    const isSelected = value === p.id;
                                    const stockVal = p.availableStock;
                                    const unitVal = p.storageUnit || p.unit || "pcs";

                                    return (
                                        <CommandItem
                                            key={p.id}
                                            value={`${p.code ?? ""} ${p.name}`}
                                            onSelect={() => {
                                                onValueChange(p.id);
                                                setIsOpen(false);
                                            }}
                                            className={cn(
                                                "cursor-pointer py-2 px-3 rounded-lg mb-0.5 text-sm",
                                                isSelected
                                                    ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 font-semibold data-[selected=true]:bg-emerald-50 dark:data-[selected=true]:bg-emerald-950/60"
                                                    : "text-slate-700 dark:text-slate-200"
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
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        );
    }
);
ProductCombobox.displayName = "ProductCombobox";
