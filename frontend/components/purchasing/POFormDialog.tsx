"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShoppingCart, Plus } from "lucide-react";
import { toast } from "sonner";

interface POFormDialogProps {
    onSuccess: () => void;
    variant?: "default" | "outline" | "secondary" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
    disabled?: boolean;
    className?: string;
}

export default function POFormDialog({
    onSuccess,
    variant = "default",
    size = "default",
    disabled = false,
    className = "",
}: POFormDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        poNumber: "",
        supplierId: "",
        warehouseId: "",
        notes: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // TODO: Implement actual PO creation
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast.success("Purchase Order created successfully!");
            onSuccess();
            setOpen(false);
            setFormData({
                poNumber: "",
                supplierId: "",
                warehouseId: "",
                notes: "",
            });
        } catch (error) {
            console.error("Error creating PO:", error);
            toast.error("Failed to create Purchase Order");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Mock data - replace with actual API calls
    const suppliers = [
        { id: "1", name: "Supplier A" },
        { id: "2", name: "Supplier B" },
        { id: "3", name: "Supplier C" },
    ];

    const warehouses = [
        { id: "1", name: "Main Warehouse" },
        { id: "2", name: "Branch Warehouse" },
        { id: "3", name: "Project Site" },
    ];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    disabled={disabled}
                    className={`gap-2 ${className}`}
                >
                    <Plus className="h-4 w-4" />
                    Quick Create PO
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Quick Purchase Order
                    </DialogTitle>
                    <DialogDescription>
                        Create a new Purchase Order quickly. Add items after creation.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="poNumber">PO Number *</Label>
                        <Input
                            id="poNumber"
                            placeholder="e.g., PO-2024-001"
                            value={formData.poNumber}
                            onChange={(e) => handleChange("poNumber", e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="supplierId">Supplier *</Label>
                        <Select
                            value={formData.supplierId}
                            onValueChange={(value) => handleChange("supplierId", value)}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                {suppliers.map((supplier) => (
                                    <SelectItem key={supplier.id} value={supplier.id}>
                                        {supplier.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="warehouseId">Warehouse *</Label>
                        <Select
                            value={formData.warehouseId}
                            onValueChange={(value) => handleChange("warehouseId", value)}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select warehouse" />
                            </SelectTrigger>
                            <SelectContent>
                                {warehouses.map((warehouse) => (
                                    <SelectItem key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Additional notes or instructions"
                            value={formData.notes}
                            onChange={(e) => handleChange("notes", e.target.value)}
                            rows={3}
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !formData.poNumber || !formData.supplierId || !formData.warehouseId}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Create PO
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}