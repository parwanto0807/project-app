"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateProductButtonProps {
  role: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onSuccess?: () => void;
}

const CreateProductButton = ({
  role,
  variant = "default",
  size = "default",
  className = "",
  onSuccess,
}: CreateProductButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const getBasePath = (userRole: string) => {
    const paths: Record<string, string> = {
      super: "/super-admin-area/master/products",
      pic: "/pic-area/master/products", 
      admin: "/admin-area/master/products",
    };
    return paths[userRole] || "/admin-area/master/products";
  };

  const basePath = getBasePath(role);

  const getButtonStyles = () => {
    if (variant === "default") {
      return "bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white";
    }
    return "";
  };

  // Effect untuk mendeteksi ketika navigasi selesai
  useEffect(() => {
    if (isNavigating) {
      const handleRouteChange = () => {
        setIsLoading(false);
        setIsNavigating(false);
      };

      // Simulasi: jika navigasi terlalu lama, timeout setelah 3 detik
      const timeoutId = setTimeout(() => {
        setIsLoading(false);
        setIsNavigating(false);
      }, 3000);

      // Listen untuk route changes
      window.addEventListener('beforeunload', handleRouteChange);

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('beforeunload', handleRouteChange);
      };
    }
  }, [isNavigating]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    setIsLoading(true);
    setIsNavigating(true);
    
    try {
      // Panggil onSuccess callback jika ada
      if (onSuccess) {
        onSuccess();
      }
      
      // Tambahkan delay minimal untuk UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Navigate ke halaman create
      router.push(`${basePath}/create`);
      
    } catch (error) {
      console.error("Error navigating to create page:", error);
      setIsLoading(false);
      setIsNavigating(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`relative transition-all duration-300 ${getButtonStyles()} ${className} ${
        isLoading ? "opacity-90 cursor-not-allowed scale-95" : "hover:scale-105"
      }`}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Preparing Form...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>New Product</span>
        </div>
      )}
      
      {/* Pulse animation selama loading */}
      {isLoading && (
        <div className="absolute inset-0 rounded-md bg-gradient-to-r from-cyan-500/20 to-purple-500/20 animate-pulse" />
      )}
    </Button>
  );
};

export default CreateProductButton;