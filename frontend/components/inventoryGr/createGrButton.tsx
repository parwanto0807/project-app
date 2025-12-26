"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Truck, Package } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateGoodsReceiptButtonProps {
    role: string;
    variant?: "default" | "outline" | "secondary" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    onSuccess?: () => void;
    disabled?: boolean;
    colorScheme?: "blue" | "emerald" | "amber" | "violet";
    withIcon?: boolean;
}

const CreateGoodsReceiptButton = ({
    role,
    variant = "default",
    size = "default",
    className = "",
    onSuccess,
    disabled = false,
    colorScheme = "emerald",
    withIcon = true,
}: CreateGoodsReceiptButtonProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const router = useRouter();

    const getBasePath = (userRole: string) => {
        const paths: Record<string, string> = {
            super: "/super-admin-area/inventory/goods-receipt",
            pic: "/pic-area/inventory/goods-receipt",
            admin: "/admin-area/inventory/goods-receipt",
        };
        return paths[userRole] || "/inventory/goods-receipt";
    };
    const basePath = getBasePath(role);

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
        return schemes[colorScheme] || schemes.emerald;
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

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (isLoading) return;

        setIsLoading(true);
        setIsNavigating(true);

        try {
            if (onSuccess) onSuccess();

            await new Promise((resolve) => setTimeout(resolve, 500));
            router.push(`${basePath}/create`);
        } catch (error) {
            console.error("Error navigating to Goods Receipt create page:", error);
            setIsLoading(false);
            setIsNavigating(false);
        }
    };

    const colors = getColorScheme();

    return (
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
            onClick={handleClick}
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
                            <Truck className="h-4 w-4" />
                        </div>
                    )}
                    <span className="font-medium">New Goods Receipt</span>
                </div>
            )}

            {isLoading && (
                <div
                    className={`absolute inset-0 bg-gradient-to-r ${colors.pulse} animate-pulse`}
                />
            )}
        </Button>
    );
};

export default CreateGoodsReceiptButton;