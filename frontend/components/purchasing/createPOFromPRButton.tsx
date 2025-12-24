"use client";

import { useState, useEffect } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, ShoppingCart, FileText, CheckCircle, ChevronRight, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPOFromPR, getAllPurchaseOrders } from "@/lib/action/po/po";
import { getApprovedPRsForPO } from "@/lib/action/pr/pr";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface CreatePOFromPRButtonProps {
    role: string;
    variant?: "default" | "outline" | "secondary" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    onSuccess?: () => void;
    disabled?: boolean;
    colorScheme?: "blue" | "emerald" | "amber" | "violet";
    withIcon?: boolean;
}

interface ApprovedPR {
    id: string;
    nomorPr: string;
    karyawan?: {
        namaLengkap: string;
        jabatan?: string;
    };
    project?: {
        name: string;
    };
    details: Array<{
        id: string;
        sourceProduct: string;
        estimasiTotalHarga: number;
    }>;
    createdAt: Date;
    approvedDate?: Date;
}

export default function CreatePOFromPRButton({
    role,
    variant = "default",
    size = "default",
    className = "",
    onSuccess,
    disabled = false,
    colorScheme = "blue",
    withIcon = true,
}: CreatePOFromPRButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedPRId, setSelectedPRId] = useState<string>("");
    const [approvedPRs, setApprovedPRs] = useState<ApprovedPR[]>([]);
    const [loadingPRs, setLoadingPRs] = useState(false);
    const router = useRouter();

    const getBasePath = (userRole: string) => {
        const paths: Record<string, string> = {
            super: "/super-admin-area/logistic/purchasing",
            pic: "/pic-area/logistic/purchasing",
            admin: "/admin-area/logistic/purchasing",
        };
        return paths[userRole] || "/admin-area/logistic/purchasing";
    };

    const basePath = getBasePath(role);

    const getColorScheme = () => {
        const schemes = {
            blue: {
                gradient: "from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900",
                shadow: "shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40",
                border: "border border-blue-400/40",
                pulse: "from-blue-400/30 to-blue-500/30",
                iconBg: "bg-blue-500/20",
                dialogBorder: "border-blue-200",
            },
            emerald: {
                gradient: "from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-700 hover:via-emerald-800 hover:to-emerald-900",
                shadow: "shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40",
                border: "border border-emerald-400/40",
                pulse: "from-emerald-400/30 to-emerald-500/30",
                iconBg: "bg-emerald-500/20",
                dialogBorder: "border-emerald-200",
            },
            amber: {
                gradient: "from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:via-amber-800 hover:to-amber-900",
                shadow: "shadow-lg shadow-amber-600/30 hover:shadow-amber-600/40",
                border: "border border-amber-400/40",
                pulse: "from-amber-400/30 to-amber-500/30",
                iconBg: "bg-amber-500/20",
                dialogBorder: "border-amber-200",
            },
            violet: {
                gradient: "from-violet-600 via-violet-700 to-violet-800 hover:from-violet-700 hover:via-violet-800 hover:to-violet-900",
                shadow: "shadow-lg shadow-violet-600/30 hover:shadow-violet-600/40",
                border: "border border-violet-400/40",
                pulse: "from-violet-400/30 to-violet-500/30",
                iconBg: "bg-violet-500/20",
                dialogBorder: "border-violet-200",
            },
        };
        return schemes[colorScheme] || schemes.blue;
    };

    const getButtonStyles = () => {
        if (variant === "default") {
            const colors = getColorScheme();
            return `
        bg-gradient-to-r ${colors.gradient}
        ${colors.shadow}
        ${colors.border}
        text-white font-semibold
        transition-all duration-200
        hover:scale-105 active:scale-95
        hover:shadow-xl
      `;
        }
        return "";
    };

    // Fetch approved PRs when dialog opens
    useEffect(() => {
        if (isDialogOpen && approvedPRs.length === 0) {
            fetchApprovedPRs();
        }
    }, [isDialogOpen]);

    // Effect untuk mendeteksi jika navigasi selesai
    useEffect(() => {
        if (isNavigating) {
            const timeoutId = setTimeout(() => {
                setIsLoading(false);
                setIsNavigating(false);
            }, 3000);

            return () => {
                clearTimeout(timeoutId);
            };
        }
    }, [isNavigating]);

    const fetchApprovedPRs = async () => {
        setLoadingPRs(true);
        try {
            const prs = await getApprovedPRsForPO();
            setApprovedPRs(prs as ApprovedPR[]);
        } catch (error) {
            console.error("Error fetching approved PRs:", error);
            toast.error("Gagal memuat Purchase Request yang sudah disetujui");
        } finally {
            setLoadingPRs(false);
        }
    };

    const handleCreatePO = async () => {
        if (!selectedPRId) {
            toast.error("Please select a Purchase Request");
            return;
        }

        setIsLoading(true);
        setIsNavigating(true);

        try {
            const result = await createPOFromPR(selectedPRId);

            if (result === null) {
                toast.info("No purchase items found in the selected PR");
                setIsDialogOpen(false);
                setIsLoading(false);
                setIsNavigating(false);
                return;
            }

            toast.success("Purchase Order created successfully!", {
                description: `PO Number: ${result.poNumber}`,
            });

            if (onSuccess) onSuccess();

            // Close dialog
            setIsDialogOpen(false);
            setSelectedPRId("");

            // Redirect to the new PO
            router.push(`${basePath}/${result.id}`);
        } catch (error) {
            console.error("Error creating PO from PR:", error);
            toast.error("Failed to create Purchase Order");
            setIsLoading(false);
            setIsNavigating(false);
        }
    };

    const handleManualCreate = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsNavigating(true);
        setIsLoading(true);

        try {
            if (onSuccess) onSuccess();
            router.push(`${basePath}/create`);
        } catch (error) {
            console.error("Error navigating to PO create page:", error);
            setIsLoading(false);
            setIsNavigating(false);
        }
    };

    const colors = getColorScheme();
    const currencyFormatter = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

    return (
        <>
            <Button
                variant={variant}
                size={size}
                className={`
          relative transition-all duration-200 
          ${getButtonStyles()} 
          ${className} 
          ${isLoading ? "opacity-90 cursor-not-allowed" : ""}
          group overflow-hidden
        `}
                onClick={() => setIsDialogOpen(true)}
                disabled={disabled || isLoading}
            >
                {/* Animated background effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${colors.pulse} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                {isLoading ? (
                    <div className="flex items-center gap-2 relative z-10">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="font-medium">Creating...</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 relative z-10">
                        {withIcon && (
                            <div className={`p-1 rounded-lg ${colors.iconBg} transition-all duration-200 group-hover:scale-110`}>
                                <ShoppingCart className="h-4 w-4" />
                            </div>
                        )}
                        <span className="font-medium">New Purchase Order</span>
                    </div>
                )}

                {isLoading && (
                    <div
                        className={`absolute inset-0 bg-gradient-to-r ${colors.pulse} animate-pulse`}
                    />
                )}
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className={`sm:max-w-[600px] ${colors.dialogBorder}`}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            Create Purchase Order
                        </DialogTitle>
                        <DialogDescription>
                            Select an approved Purchase Request to create a Purchase Order or create manually.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Approved PRs Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="pr-select" className="text-base font-semibold">
                                    Select Approved Purchase Request
                                </Label>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approved
                                </Badge>
                            </div>

                            {loadingPRs ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                </div>
                            ) : approvedPRs.length > 0 ? (
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    <Select value={selectedPRId} onValueChange={setSelectedPRId}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a Purchase Request..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {approvedPRs.map((pr) => {
                                                // Calculate total amount and purchase items count
                                                const purchaseItems = pr.details.filter(d => d.sourceProduct === 'PEMBELIAN_BARANG');
                                                const totalAmount = purchaseItems.reduce((sum, item) => sum + (item.estimasiTotalHarga || 0), 0);

                                                return (
                                                    <SelectItem key={pr.id} value={pr.id}>
                                                        <div className="flex flex-col py-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-semibold">{pr.nomorPr}</span>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {purchaseItems.length} items
                                                                </Badge>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                <span>Requestor: {pr.karyawan?.namaLengkap || 'N/A'}</span>
                                                                {pr.project?.name && <span> • {pr.project.name}</span>}
                                                                {pr.approvedDate && (
                                                                    <span> • Approved: {format(new Date(pr.approvedDate), "dd MMM yyyy", { locale: id })}</span>
                                                                )}
                                                            </div>
                                                            <div className="text-sm font-medium mt-1">
                                                                {currencyFormatter.format(totalAmount)}
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>

                                    {selectedPRId && (
                                        <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-blue-600" />
                                                <span className="text-sm font-medium text-blue-800">
                                                    Selected PR: {approvedPRs.find(pr => pr.id === selectedPRId)?.nomorPr}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-6 border rounded-lg bg-muted/20">
                                    <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-muted-foreground">No approved Purchase Requests found</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        All PRs must be approved before creating a Purchase Order
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or
                                </span>
                            </div>
                        </div>

                        {/* Manual Creation Section */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-base font-semibold text-gray-100">Create Manually</Label>
                                <p className="text-sm text-gray-400">
                                    Create a Purchase Order without a Purchase Request for urgent or special purchases.
                                </p>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full justify-start gap-3 h-12 px-4 
               border border-transparent
               bg-gradient-to-br from-blue-950/80 via-gray-900 to-emerald-950/60
               hover:bg-gradient-to-br hover:from-blue-900/90 hover:via-gray-900 hover:to-emerald-900/70
               transition-all duration-700
               group relative overflow-hidden
               before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500/20 before:via-sky-400/10 before:to-emerald-500/20 
               before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-700
               after:absolute after:inset-0 after:bg-gradient-to-r after:from-blue-600/30 after:via-sky-500/20 after:to-emerald-600/30 
               after:translate-x-[-100%] group-hover:after:translate-x-[100%] after:transition-transform after:duration-1500"
                                onClick={handleManualCreate}
                                disabled={isLoading}
                            >
                                {/* Border glow effect */}
                                <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-500 rounded-lg opacity-30 blur-[1px] group-hover:opacity-60 group-hover:blur-[2px] transition-all duration-700" />

                                <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-blue-900/70 to-emerald-900/50 
                    group-hover:from-blue-800/80 group-hover:to-emerald-800/60 
                    transition-all duration-500 z-10">
                                    <ShoppingCart className="h-4 w-4 text-sky-300 group-hover:text-emerald-300 transition-colors duration-500" />
                                </div>

                                <div className="flex flex-col items-start relative z-10">
                                    <span className="font-medium text-gray-100 group-hover:text-white transition-colors duration-300">
                                        Create Manual Purchase Order
                                    </span>
                                    <span className="text-xs text-gray-400 group-hover:text-gray-300">
                                        For direct purchases without PR
                                    </span>
                                </div>

                                <div className="relative ml-auto p-1 rounded-md bg-gradient-to-r from-blue-900/50 to-emerald-900/30 
                    group-hover:from-blue-800/60 group-hover:to-emerald-800/40 transition-all duration-500">
                                    <ArrowRight className="h-4 w-4 text-blue-300 group-hover:text-emerald-300 group-hover:translate-x-1 
                            transition-all duration-500" />
                                </div>
                            </Button>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreatePO}
                            disabled={!selectedPRId || isLoading || loadingPRs}
                            className={`gap-2 ${selectedPRId ? colors.gradient : ""}`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating PO...
                                </>
                            ) : (
                                <>
                                    <ShoppingCart className="h-4 w-4" />
                                    Create from Selected PR
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}