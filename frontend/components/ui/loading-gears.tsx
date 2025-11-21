"use client";

import { Cog } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { useEffect, useState } from "react";

// --- ⚙️ COLOR & CONFIGURATION ---

const VARIANTS_CONFIG = {
  default: {
    title: "text-amber-400 dark:text-amber-300",
    primary: "text-amber-500",
    secondary: "text-slate-500",
    glow: "bg-amber-400",
    ring: "border-amber-400/60",
    progress: "bg-amber-500",
  },
  minimal: {
    title: "text-blue-400 dark:text-blue-300",
    primary: "text-blue-500",
    secondary: "text-slate-600",
    glow: "bg-blue-400",
    ring: "border-blue-400/50",
    progress: "bg-blue-500",
  },
  elegant: {
    title: "text-emerald-400 dark:text-emerald-300",
    primary: "text-emerald-500",
    secondary: "text-slate-700",
    glow: "bg-emerald-400",
    ring: "border-emerald-400/40",
    progress: "bg-emerald-500",
  },
};

const SIZES_CONFIG = {
  sm: { container: "w-16 h-16", gear: "w-10 h-10", glow: "w-2 h-2" },
  md: { container: "w-24 h-24", gear: "w-14 h-14", glow: "w-3 h-3" },
  lg: { container: "w-32 h-32", gear: "w-20 h-20", glow: "w-4 h-4" },
  xl: { container: "w-48 h-48", gear: "w-28 h-28", glow: "w-5 h-5" },
};

// --- ⚙️ STATIC GEARS (SSR) ---

function StaticLoadingGears({
  size = "lg",
  variant = "default"
}: { size?: "sm" | "md" | "lg" | "xl"; variant?: "default" | "minimal" | "elegant" }) {
  const currentVariant = VARIANTS_CONFIG[variant];
  const sizes = SIZES_CONFIG[size];

  return (
    <div className={`relative ${sizes.container} opacity-70`}>
      <div className="absolute top-1 left-1">
        <Cog className={`${sizes.gear} ${currentVariant.primary} transition-colors duration-300`} strokeWidth={2} />
      </div>
      <div className="absolute bottom-1 right-1">
        <Cog className={`${sizes.gear} ${currentVariant.secondary} transition-colors duration-300`} strokeWidth={1.8} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`${sizes.glow} rounded-full ${currentVariant.glow} opacity-60 transition-colors duration-300`} />
      </div>
    </div>
  );
}

// --- ⚙️ ANIMATED GEARS (CLIENT) ---

function AnimatedLoadingGears({
  size = "lg",
  variant = "default"
}: { size?: "sm" | "md" | "lg" | "xl"; variant?: "default" | "minimal" | "elegant" }) {
  const currentVariant = VARIANTS_CONFIG[variant];
  const sizes = SIZES_CONFIG[size];

  // Mengganti drop-shadow dengan nilai CSS variabel untuk fleksibilitas warna
  const primaryGlowShadow = `drop-shadow-[0_0_15px_var(--primary-glow-color)]`;
  const secondaryGlowShadow = `drop-shadow-[0_0_10px_rgba(148,163,184,0.3)]`;

  const getPrimaryGlowColor = () => {
    switch (variant) {
      case "minimal": return 'rgba(66, 153, 225, 0.4)'; // blue-500
      case "elegant": return 'rgba(16, 185, 129, 0.4)'; // emerald-500
      case "default":
      default: return 'rgba(245, 158, 11, 0.4)'; // amber-500
    }
  };

  return (
    <div className={`relative ${sizes.container}`} style={{ '--primary-glow-color': getPrimaryGlowColor() } as React.CSSProperties}>
      {/* Main Gear */}
      <motion.div
        className="absolute top-1 left-1"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <Cog
          className={`${sizes.gear} ${currentVariant.primary} ${primaryGlowShadow} transition-colors duration-300`}
          strokeWidth={2}
          fill="currentColor"
          fillOpacity={0.15} // Lebih tegas
        />
      </motion.div>

      {/* Secondary Gear */}
      <motion.div
        className="absolute bottom-1 right-1"
        animate={{ rotate: -360 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
      >
        <Cog
          className={`${sizes.gear} ${currentVariant.secondary} ${secondaryGlowShadow} transition-colors duration-300`}
          strokeWidth={1.8}
          fill="currentColor"
          fillOpacity={0.08}
        />
      </motion.div>

      {/* Central Glow & Pulse Ring */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative">
          {/* Inner Glow */}
          <div className={`${sizes.glow} rounded-full ${currentVariant.glow} shadow-[0_0_20px_6px_var(--primary-glow-color)] transition-colors duration-300`} />

          {/* Pulsing Ring */}
          <motion.div
            className={`absolute inset-0 border rounded-full -z-10 ${currentVariant.ring} transition-colors duration-300`}
            animate={{ scale: [0.8, 1.8, 0.8], opacity: [0, 0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
        </div>
      </motion.div>
    </div>
  );
}

// --- ⚙️ MAIN SCREEN COMPONENT ---

interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
  variant?: "default" | "minimal" | "elegant";
  show?: boolean;
}

export function LoadingScreen({
  title = "System Processing",
  subtitle = "Initializing core data structures. Please stand by...",
  variant = "default",
  show = true
}: LoadingScreenProps) {
  const [isMounted, setIsMounted] = useState(false);
  const config = VARIANTS_CONFIG[variant];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Animation variants for screen entry/exit
  const screenVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    // Anda juga harus menambahkan state 'exit' jika Anda menggunakan <AnimatePresence>
    exit: { opacity: 0, y: 50, transition: { duration: 0.3 } },
  };
  if (!show) {
    return null;
  }

  const LoadingContent = isMounted ? AnimatedLoadingGears : StaticLoadingGears;

  return (
    // Latar belakang modern: dark, semi-transparan, dengan grid halus
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950/98 backdrop-blur-xl z-50 transition-colors duration-500">
      {/* Latar Belakang Grid Halus */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:30px_30px] opacity-10"
      />

      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={screenVariants}
        className="relative flex flex-col items-center justify-center p-8"
      >
        <LoadingContent size="lg" variant={variant} />

        {/* Text Content */}
        <div className="mt-10 text-center space-y-3">
          <div className={`text-2xl font-extrabold tracking-wide ${config.title} transition-colors duration-300`}>
            {title}
          </div>
          <div className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed opacity-80 font-mono transition-colors duration-300">
            {subtitle}
          </div>
        </div>

        {/* Progress Bar - Only show after mount */}
        {isMounted && (
          <motion.div
            className="mt-10 w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className={`h-full ${config.progress} rounded-full`}
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear" // Linear progress bar
              }}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// --- ⚙️ SPECIALIZED COMPONENTS & HOOK ---

export function LogoutLoading() {
  return <LoadingScreen title="Signing Out" subtitle="Securing your session and clearing credentials..." variant="default" />;
}

export function AuthLoading() {
  return <LoadingScreen title="Authenticating User" subtitle="Verifying your credentials and access permissions..." variant="minimal" />;
}

export function PageLoading() {
  return <LoadingScreen title="Rendering Dashboard" subtitle="Fetching and compiling real-time analytics data..." variant="elegant" />;
}

export function useLoading() {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  return {
    isLoading,
    startLoading,
    stopLoading,
    // Wrap LoadingScreen in motion.div for exit animation (jika menggunakan AnimatePresence)
    LoadingComponent: () => isLoading ? <LoadingScreen show={isLoading} /> : null
  };
}