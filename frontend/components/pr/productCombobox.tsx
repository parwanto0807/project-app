// components/ProductCombobox.tsx
import { forwardRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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

interface ProductComboboxProps {
    value: string;
    onValueChange: (value: string) => void;
    products: Array<{ id: string; name: string }>;
    error?: boolean;
    placeholder?: string;
}

export const ProductCombobox = forwardRef<HTMLButtonElement, ProductComboboxProps>(
    ({ value, onValueChange, products, error = false, placeholder = "Select product..." }, ref) => {
        const [open, setOpen] = useState(false);

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
                <PopoverContent className="w-full p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search product..." className="h-9" />
                        <CommandList>
                            <CommandEmpty>No product found.</CommandEmpty>
                            <CommandGroup>
                                {products.map((p) => (
                                    <CommandItem
                                        key={p.id}
                                        value={p.name}
                                        onSelect={() => {
                                            onValueChange(p.id);
                                            setOpen(false);
                                        }}
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
