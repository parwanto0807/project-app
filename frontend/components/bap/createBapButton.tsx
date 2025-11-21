"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateButtonBAPProps {
    role?: string;
    variant?: "default" | "outline" | "secondary" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    onSuccess?: () => void;
    disabled?: boolean;
    colorScheme?: "orange" | "emerald" | "amber" | "violet" | "blue" | "red";
    withIcon?: boolean;
}

const CreateButtonBAP = ({
    role,
    variant = "default",
    size = "default",
    className = "",
    onSuccess,
    disabled = false,
    colorScheme = "emerald",
    withIcon = true,
}: CreateButtonBAPProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const router = useRouter();

    const getBasePath = (userRole?: string) => {
        const paths: Record<string, string> = {
            super: "/super-admin-area/logistic/bap",
            pic: "/pic-area/logistic/bap",
            admin: "/admin-area/logistic/bap",
        };
        return paths[userRole ?? "admin"] || "/admin-area/logistic/bap";
    };

    const basePath = getBasePath(role);

    const getColorScheme = () => {
        const schemes = {
            orange: {
                gradient: "from-orange-600 via-orange-700 to-orange-800 hover:from-orange-700 hover:via-orange-800 hover:to-orange-900",
                shadow: "shadow-lg shadow-orange-600/30 hover:shadow-orange-600/40",
                border: "border border-orange-400/40",
                pulse: "from-orange-400/30 to-orange-500/30",
                iconBg: "bg-orange-500/20",
                solid: "bg-white text-orange-700 hover:bg-orange-50 border border-orange-200"
            },
            red: {
                gradient: "from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900",
                shadow: "shadow-lg shadow-red-600/30 hover:shadow-red-600/40",
                border: "border border-red-400/40",
                pulse: "from-red-400/30 to-red-500/30",
                iconBg: "bg-red-500/20",
                solid: "bg-white text-red-700 hover:bg-red-50 border border-red-200"
            },
            blue: {
                gradient: "from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900",
                shadow: "shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40",
                border: "border border-blue-400/40",
                pulse: "from-blue-400/30 to-blue-500/30",
                iconBg: "bg-blue-500/20",
                solid: "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
            },
            emerald: {
                gradient: "from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-700 hover:via-emerald-800 hover:to-emerald-900",
                shadow: "shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40",
                border: "border border-emerald-400/40",
                pulse: "from-emerald-400/30 to-emerald-500/30",
                iconBg: "bg-emerald-500/20",
                solid: "bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
            },
            amber: {
                gradient: "from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:via-amber-800 hover:to-amber-900",
                shadow: "shadow-lg shadow-amber-600/30 hover:shadow-amber-600/40",
                border: "border border-amber-400/40",
                pulse: "from-amber-400/30 to-amber-500/30",
                iconBg: "bg-amber-500/20",
                solid: "bg-white text-amber-700 hover:bg-amber-50 border border-amber-200"
            },
            violet: {
                gradient: "from-violet-600 via-violet-700 to-violet-800 hover:from-violet-700 hover:via-violet-800 hover:to-violet-900",
                shadow: "shadow-lg shadow-violet-600/30 hover:shadow-violet-600/40",
                border: "border border-violet-400/40",
                pulse: "from-violet-400/30 to-violet-500/30",
                iconBg: "bg-violet-500/20",
                solid: "bg-white text-violet-700 hover:bg-violet-50 border border-violet-200"
            }
        };
        return schemes[colorScheme] || schemes.orange;
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
        } else if (variant === "outline") {
            const colors = getColorScheme();
            return `
        ${colors.solid}
        shadow-lg hover:shadow-xl 
        transition-all duration-300
        hover:scale-105 active:scale-95
        font-semibold
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
            console.error("Error navigating to BAP create page:", error);
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
                        <div className={`p-1 rounded-lg ${variant === "outline" ? "bg-orange-100 text-orange-700" : colors.iconBg} transition-all duration-200 group-hover:scale-110`}>
                            <Plus className="h-4 w-4" />
                        </div>
                    )}
                    <span className="font-medium">Tambah BAP</span>
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

export default CreateButtonBAP;