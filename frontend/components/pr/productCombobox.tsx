import { forwardRef, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ProductCreateDialog } from "../sales/salesOrder/productDialog";

interface ProductComboboxProps {
    value: string;
    onValueChange: (value: string) => void;
    products: Array<{ id: string; name: string }>;
    error?: boolean;
    placeholder?: string;
    onCreated?: (product: { id: string; name: string }) => void;
}

export const ProductCombobox = forwardRef<HTMLButtonElement, ProductComboboxProps>(
    ({ value, onValueChange, products, error = false, placeholder = "Select product...", onCreated }, ref) => {
        const [open, setOpen] = useState(false);
        const [search, setSearch] = useState("");

        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        ref={ref} // ✅ ref untuk focus dari luar
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "w-full justify-between",
                            !value && "text-muted-foreground",
                            error && "border-red-500"
                        )}
                    >
                        {value
                            ? products.find((p) => p.id === value)?.name
                            : placeholder}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                        <CommandInput
                            placeholder="Search product..."
                            className="h-9"
                            value={search}
                            onValueChange={setSearch}
                        />
                        <CommandList>
                            <CommandEmpty>
                                <div className="p-4 text-center">
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {search ? `"${search}" tidak ditemukan` : "Tidak ada data"}
                                    </p>
                                    {onCreated && search && (
                                        <ProductCreateDialog
                                            createEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/api/master/product/createProduct`}
                                            onCreated={(created) => {
                                                onCreated(created);
                                                onValueChange(created.id);
                                                setOpen(false);
                                                setSearch("");
                                            }}
                                            trigger={
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full"
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Tambah Produk Baru
                                                </Button>
                                            }
                                        />
                                    )}
                                </div>
                            </CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                                {products.map((p) => (
                                    <CommandItem
                                        key={p.id}
                                        value={p.name}
                                        onSelect={() => {
                                            onValueChange(p.id);
                                            setOpen(false);
                                            setSearch("");
                                        }}
                                        className="cursor-pointer"
                                    >
                                        {p.name}
                                        <Check
                                            className={cn(
                                                "ml-auto h-4 w-4",
                                                value === p.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        );
    }
);
ProductCombobox.displayName = "ProductCombobox";
