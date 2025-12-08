"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateSupplierButtonProps {
  role: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onSuccess?: () => void;
  disabled?: boolean;
  colorScheme?: "blue" | "emerald" | "amber" | "violet";
  withIcon?: boolean;
}

const CreateSupplierButton = ({
  role,
  variant = "default",
  size = "default",
  className = "",
  onSuccess,
  disabled = false,
  colorScheme = "emerald",
  withIcon = true,
}: CreateSupplierButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const getBasePath = (userRole: string) => {
    const paths: Record<string, string> = {
      super: "/super-admin-area/master/supplier",
      pic: "/pic-area/master/supplier",
      admin: "/admin-area/master/supplier",
    };
    return paths[userRole] || "/admin-area/master/supplier";
  };

  const basePath = getBasePath(role);

  const getColorScheme = () => {
    const schemes = {
      blue: {
        gradient: "from-blue-600 via-blue-700 to-blue-800",
        shadow: "shadow-blue-600/30",
        border: "border-blue-400/40",
        pulse: "from-blue-400/30 to-blue-500/30",
        iconBg: "bg-blue-500/20"
      },
      emerald: {
        gradient: "from-emerald-600 via-emerald-700 to-emerald-800",
        shadow: "shadow-emerald-600/30",
        border: "border-emerald-400/40",
        pulse: "from-emerald-400/30 to-emerald-500/30",
        iconBg: "bg-emerald-500/20"
      },
      amber: {
        gradient: "from-amber-600 via-amber-700 to-amber-800",
        shadow: "shadow-amber-600/30",
        border: "border-amber-400/40",
        pulse: "from-amber-400/30 to-amber-500/30",
        iconBg: "bg-amber-500/20"
      },
      violet: {
        gradient: "from-violet-600 via-violet-700 to-violet-800",
        shadow: "shadow-violet-600/30",
        border: "border-violet-400/40",
        pulse: "from-violet-400/30 to-violet-500/30",
        iconBg: "bg-violet-500/20"
      }
    };
    return schemes[colorScheme] || schemes.emerald;
  };

  const getButtonStyles = () => {
    if (variant !== "default") return "";
    const c = getColorScheme();
    return `
      bg-gradient-to-r ${c.gradient} 
      text-white font-semibold
      shadow-lg ${c.shadow}
      ${c.border}
      hover:scale-105 active:scale-95
      transition-all duration-200
    `;
  };

  useEffect(() => {
    if (!isNavigating) return;
    const timer = setTimeout(() => {
      setIsLoading(false);
      setIsNavigating(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isNavigating]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setIsNavigating(true);
    try {
      onSuccess?.();
      await new Promise(res => setTimeout(res, 500));
      router.push(`${basePath}/create`);
    } catch (err) {
      console.error("Navigate error:", err);
      setIsLoading(false);
    }
  };

  const c = getColorScheme();

  return (
    <Button
      variant={variant}
      size={size}
      className={`
        relative group overflow-hidden
        ${getButtonStyles()} 
        ${className} 
        ${isLoading ? "opacity-90 cursor-not-allowed" : ""}
      `}
      onClick={handleClick}
      disabled={disabled || isLoading}
    >
      {/* Hover Pulse */}
      <div className={`absolute inset-0 bg-gradient-to-r ${c.pulse} opacity-0 group-hover:opacity-100 transition-opacity`} />

      {isLoading ? (
        <div className="flex items-center gap-2 relative z-10">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Processing...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 relative z-10">
          {withIcon && (
            <div className={`p-1 rounded-md ${c.iconBg}`}>
              <UserPlus className="h-4 w-4" />
            </div>
          )}
          <span>Add Supplier</span>
        </div>
      )}
    </Button>
  );
};

export default CreateSupplierButton;
