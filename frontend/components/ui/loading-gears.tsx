"use client";

import { Cog } from "lucide-react";
import { motion } from "framer-motion";

interface LoadingGearsProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingGears({ size = "lg", className }: LoadingGearsProps) {
  const sizes = {
    sm: { container: "w-20 h-20", gear: "w-12 h-12" },
    md: { container: "w-32 h-32", gear: "w-16 h-16" },
    lg: { container: "w-48 h-48", gear: "w-28 h-28" }, // Slightly larger for better visibility
  };

  return (
    <div className={`relative ${sizes[size].container} ${className || ""}`}>
      {/* First Gear - Gold */}
      <motion.div
        className="absolute top-0 left-0"
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <Cog 
          className={`${sizes[size].gear} text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]`} 
          strokeWidth={2.5}
          fill="rgba(245, 158, 11, 0.2)" // Slight fill for depth
        />
      </motion.div>
      
      {/* Second Gear - Silver */}
      <motion.div
        className="absolute bottom-0 right-0"
        animate={{ rotate: -360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <Cog 
          className={`${sizes[size].gear} text-cyan-300 drop-shadow-[0_0_12px_rgba(209,213,219,0.7)]`} 
          strokeWidth={2.5}
          fill="rgba(209, 213, 219, 0.1)" // Slight fill for depth
        />
      </motion.div>
      
      {/* Central Glow Effect */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.7, 1, 0.7],
          rotate: [0, 5, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="relative">
          {/* Main glowing dot */}
          <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_20px_8px_rgba(245,158,11,0.6)]" />
          
          {/* Pulsing rings */}
          <motion.div 
            className="absolute inset-0 border-2 border-amber-400 rounded-full -z-10"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
          <motion.div 
            className="absolute inset-0 border border-amber-300 rounded-full -z-10"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.5
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/90 backdrop-blur-md z-50">
      <LoadingGears size="lg" className="opacity-90" />
      <motion.div 
        className="absolute bottom-1/4 text-amber-400/90 font-medium text-lg"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Loading...
      </motion.div>
    </div>
  );
}