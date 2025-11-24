"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Plus, Loader2, ClipboardList, FileText, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateQuotationButtonProps {
    role: string;
    className?: string;
    onSuccess?: () => void;
    variant?: "default" | "outline" | "secondary" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
    disabled?: boolean;
    colorScheme?: "blue" | "emerald" | "amber" | "violet";
}

const CreateQuotationButton = ({
    role,
    className = "",
    onSuccess,
    variant = "default",
    size = "default",
    disabled = false,
    colorScheme = "emerald",
}: CreateQuotationButtonProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Tentukan base path berdasarkan role
    const getBasePath = (userRole: string) => {
        const paths: Record<string, string> = {
            super: "/super-admin-area/sales/quotation",
            pic: "/pic-area/sales/quotation",
            admin: "/admin-area/sales/quotation",
        };
        return paths[userRole] || "/admin-area/sales/quotation";
    };

    const getColorScheme = () => {
        const schemes = {
      blue: {
        gradient: "from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900",
        shadow: "shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40",
        border: "border border-blue-400/40",
        pulse: "from-blue-400/30 to-blue-500/30",
        iconBg: "bg-blue-500/20"
      },
      emerald: {
        gradient: "from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-700 hover:via-emerald-800 hover:to-emerald-900",
        shadow: "shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40",
        border: "border border-emerald-400/40",
        pulse: "from-emerald-400/30 to-emerald-500/30",
        iconBg: "bg-emerald-500/20"
      },
      amber: {
        gradient: "from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:via-amber-800 hover:to-amber-900",
        shadow: "shadow-lg shadow-amber-600/30 hover:shadow-amber-600/40",
        border: "border border-amber-400/40",
        pulse: "from-amber-400/30 to-amber-500/30",
        iconBg: "bg-amber-500/20"
      },
      violet: {
        gradient: "from-violet-600 via-violet-700 to-violet-800 hover:from-violet-700 hover:via-violet-800 hover:to-violet-900",
        shadow: "shadow-lg shadow-violet-600/30 hover:shadow-violet-600/40",
        border: "border border-violet-400/40",
        pulse: "from-violet-400/30 to-violet-500/30",
        iconBg: "bg-violet-500/20"
      }
    };
        return schemes[colorScheme] || schemes.blue;
    };

    const getButtonStyles = () => {
        if (variant === "default") {
            const colors = getColorScheme();
            return `
                bg-gradient-to-r ${colors.gradient}
                text-white font-semibold
                shadow-md ${colors.shadow}
                border ${colors.border}
                transition-all duration-200
                hover:scale-105 active:scale-95
            `;
        }
        return "";
    };

    const basePath = getBasePath(role);

    const startLoading = async (callback: () => void) => {
        if (isLoading) return;

        setIsLoading(true);
        if (onSuccess) onSuccess();

        await new Promise((r) => setTimeout(r, 600));

        callback();
        setIsLoading(false);
    };

    // METHOD 1 → Buat dari Sales Order
    const handleCreateFromSalesOrder = () => {
        startLoading(() => {
            router.push(`${basePath}/create?from=salesOrder`);
        });
    };

    // METHOD 2 → Buat Manual
    const handleCreateManual = () => {
        startLoading(() => {
            router.push(`${basePath}/create/manual?mode=manual`);
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    disabled={disabled || isLoading}
                    className={`
                        relative transition-all duration-200 
                        ${getButtonStyles()} 
                        ${className} 
                        ${isLoading ? "opacity-90 cursor-not-allowed" : ""}
                        group
                    `}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Loading...
                        </>
                    ) : (
                        <>
                            <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                            Buat Quotation
                            <ChevronDown className="h-4 w-4 ml-2 group-hover:translate-y-0.5 transition-transform" />
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>

            {!isLoading && (
                <DropdownMenuContent 
                    align="end" 
                    className="w-64 bg-white/95 backdrop-blur-sm border border-gray-200/80 shadow-xl"
                >
                    <DropdownMenuItem
                        onClick={handleCreateFromSalesOrder}
                        className="flex items-center gap-3 cursor-pointer p-3 hover:bg-blue-50/80 transition-colors duration-150 group"
                    >
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                            <ClipboardList className="h-4 w-4 text-blue-700" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">By Sales Order</span>
                            <span className="text-sm text-gray-600">Buat quotation dari sales order</span>
                        </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={handleCreateManual}
                        className="flex items-center gap-3 cursor-pointer p-3 hover:bg-green-50/80 transition-colors duration-150 group"
                    >
                        <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                            <FileText className="h-4 w-4 text-green-700" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">Manual</span>
                            <span className="text-sm text-gray-600">Buat quotation manual</span>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            )}
        </DropdownMenu>
    );
};

export default CreateQuotationButton;