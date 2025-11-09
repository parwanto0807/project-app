"use client";

import { Cog } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Simple static loading component for SSR compatibility
function StaticLoadingGears({ 
  size = "lg", 
  variant = "default" 
}: { size?: "sm" | "md" | "lg" | "xl"; variant?: "default" | "minimal" | "elegant" }) {
  const sizes = {
    sm: { container: "w-16 h-16", gear: "w-10 h-10", glow: "w-2 h-2" },
    md: { container: "w-24 h-24", gear: "w-14 h-14", glow: "w-3 h-3" },
    lg: { container: "w-32 h-32", gear: "w-20 h-20", glow: "w-4 h-4" },
    xl: { container: "w-48 h-48", gear: "w-28 h-28", glow: "w-5 h-5" },
  };

  const variants = {
    default: { primary: "text-amber-500", secondary: "text-slate-400", glow: "bg-amber-400" },
    minimal: { primary: "text-blue-400", secondary: "text-slate-500", glow: "bg-blue-400" },
    elegant: { primary: "text-emerald-400", secondary: "text-slate-300", glow: "bg-emerald-400" },
  };

  const currentVariant = variants[variant];

  return (
    <div className={`relative ${sizes[size].container} opacity-70`}>
      <div className="absolute top-1 left-1">
        <Cog className={`${sizes[size].gear} ${currentVariant.primary}`} strokeWidth={2} />
      </div>
      <div className="absolute bottom-1 right-1">
        <Cog className={`${sizes[size].gear} ${currentVariant.secondary}`} strokeWidth={1.8} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`${sizes[size].glow} rounded-full ${currentVariant.glow} opacity-60`} />
      </div>
    </div>
  );
}

// Animated version only for client
function AnimatedLoadingGears({ 
  size = "lg", 
  variant = "default" 
}: { size?: "sm" | "md" | "lg" | "xl"; variant?: "default" | "minimal" | "elegant" }) {
  const sizes = {
    sm: { container: "w-16 h-16", gear: "w-10 h-10", glow: "w-2 h-2" },
    md: { container: "w-24 h-24", gear: "w-14 h-14", glow: "w-3 h-3" },
    lg: { container: "w-32 h-32", gear: "w-20 h-20", glow: "w-4 h-4" },
    xl: { container: "w-48 h-48", gear: "w-28 h-28", glow: "w-5 h-5" },
  };

  const variants = {
    default: {
      primary: "text-amber-500",
      secondary: "text-slate-400",
      glow: "bg-amber-400",
      ring: "border-amber-400/60",
    },
    minimal: {
      primary: "text-blue-400",
      secondary: "text-slate-500",
      glow: "bg-blue-400",
      ring: "border-blue-400/50",
    },
    elegant: {
      primary: "text-emerald-400",
      secondary: "text-slate-300",
      glow: "bg-emerald-400",
      ring: "border-emerald-400/40",
    },
  };

  const currentVariant = variants[variant];

  return (
    <div className={`relative ${sizes[size].container}`}>
      {/* Main Gear */}
      <motion.div
        className="absolute top-1 left-1"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <Cog 
          className={`${sizes[size].gear} ${currentVariant.primary} drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]`} 
          strokeWidth={2}
          fill="currentColor"
          fillOpacity={0.1}
        />
      </motion.div>
      
      {/* Secondary Gear */}
      <motion.div
        className="absolute bottom-1 right-1"
        animate={{ rotate: -360 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
      >
        <Cog 
          className={`${sizes[size].gear} ${currentVariant.secondary} drop-shadow-[0_0_8px_rgba(148,163,184,0.2)]`} 
          strokeWidth={1.8}
          fill="currentColor"
          fillOpacity={0.05}
        />
      </motion.div>

      {/* Central Glow */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative">
          <div className={`${sizes[size].glow} rounded-full ${currentVariant.glow} shadow-[0_0_20px_6px_rgba(245,158,11,0.3)]`} />
          <motion.div 
            className={`absolute inset-0 border rounded-full -z-10 ${currentVariant.ring}`}
            animate={{ scale: [0.8, 1.8, 0.8], opacity: [0, 0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
        </div>
      </motion.div>
    </div>
  );
}

interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
  variant?: "default" | "minimal" | "elegant";
  show?: boolean;
}

export function LoadingScreen({ 
  title = "Loading", 
  subtitle = "Please wait while we prepare your content",
  variant = "default",
  show = true
}: LoadingScreenProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const textVariants = {
    default: "text-amber-400/90",
    minimal: "text-blue-400/90",
    elegant: "text-emerald-400/90",
  };

  // Jika tidak show, return null
  if (!show) {
    return null;
  }

  // Render static version during SSR, animated after mount
  const LoadingContent = isMounted ? AnimatedLoadingGears : StaticLoadingGears;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-xl z-50">
      <div className="relative">
        <LoadingContent size="lg" variant={variant} />
      </div>

      {/* Text Content */}
      <div className="mt-8 text-center space-y-2">
        <div className={`text-xl font-semibold ${textVariants[variant]} ${isMounted ? 'animate-pulse' : 'opacity-70'}`}>
          {title}
        </div>
        <div className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed opacity-80">
          {subtitle}
        </div>
      </div>

      {/* Progress Bar - Only show after mount */}
      {isMounted && (
        <motion.div 
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-48 h-1 bg-slate-700 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className={`h-full ${
              variant === "default" ? "bg-amber-500" : 
              variant === "minimal" ? "bg-blue-500" : 
              "bg-emerald-500"
            } rounded-full`}
            animate={{ width: ["0%", "100%", "0%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </div>
  );
}

// Specialized loading components
export function LogoutLoading() {
  return <LoadingScreen title="Signing Out" subtitle="Securing your account..." variant="default" />;
}

export function AuthLoading() {
  return <LoadingScreen title="Authenticating" subtitle="Verifying your credentials..." variant="minimal" />;
}

export function PageLoading() {
  return <LoadingScreen title="Loading" subtitle="Preparing your content..." variant="elegant" />;
}

// Hook untuk kontrol loading state
export function useLoading() {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  return {
    isLoading,
    startLoading,
    stopLoading,
    LoadingComponent: () => isLoading ? <LoadingScreen /> : null
  };
}