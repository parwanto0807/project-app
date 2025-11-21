"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function AdminLoading({ message = "Loading data..." }: { message?: string }) {
    // Definisi warna yang konsisten dan premium
    const accentColor = "text-amber-500 dark:text-amber-400"; // Aksen kuning/oranye yang lebih kaya
    const bgColor = "bg-slate-50 dark:bg-slate-950"; // Background yang lebih terang dan gelap pekat
    const glowColor = "from-amber-500/40 via-orange-600/40 to-red-700/40"; // Efek glow yang lebih dalam

    return (
        <div className={`min-h-screen w-full ${bgColor} p-4 overflow-hidden relative transition-colors duration-700`}>
            
            {/* 1. Base Layer: Deep Industrial Grid Pattern (Menggunakan background image URL untuk fleksibilitas) */}
            {/* CATATAN: Ini adalah placeholder, Anda bisa menggunakan SVG Grid nyata untuk hasil terbaik. */}
            <div 
                className={`
                    absolute inset-0 
                    bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] 
                    dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)]
                    bg-[size:30px_30px] opacity-70 dark:opacity-10 
                    [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]
                `} 
            />

            {/* 2. Middle Layer: Subtle Gradient Overlay for Depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-transparent to-indigo-100/30 dark:from-blue-900/10 dark:via-transparent dark:to-indigo-900/10 transition-colors duration-700" />
            
            {/* Animated Container (Pusat perhatian) */}
            <div className="flex min-h-screen w-full flex-col items-center justify-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="flex flex-col items-center space-y-8" // Spasi lebih besar
                >
                    {/* Glowing Spinner */}
                    <div className="relative">
                        {/* Efek Glow (Ditingkatkan) */}
                        <motion.div
                            className={`absolute inset-0 rounded-full bg-gradient-to-r ${glowColor} blur-2xl`}
                            animate={{ rotate: 360, scale: [1, 1.1, 1] }} // Animasi pulsing tambahan
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                        {/* Kontainer Spinner (Diperhalus) */}
                        <div className="relative z-10 rounded-full bg-white/90 dark:bg-slate-800/90 p-8 shadow-2xl backdrop-blur-sm border border-white dark:border-slate-700/50 transition-colors duration-500 transform hover:scale-105">
                            <Loader2 className={`h-12 w-12 animate-spin ${accentColor}`} /> {/* Spinner lebih besar */}
                        </div>
                    </div>

                    {/* Message */}
                    <div className="text-center">
                        <motion.h3
                            className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 drop-shadow-lg transition-colors duration-500"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <span className={accentColor}>Project</span> Integrity Awaits...
                        </motion.h3>
                        <motion.p
                            className="mt-2 text-md text-slate-600 dark:text-slate-400 max-w-sm font-medium transition-colors duration-500"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            {message}
                        </motion.p>
                    </div>

                    {/* 3. Parallax Industrial Elements - Floating Gears (Top Left) */}
                    <div className="absolute -top-20 -left-20 hidden lg:block">
                        <motion.div
                            className="h-20 w-20 rounded-full border-4 border-slate-300 dark:border-slate-700 bg-slate-200/40 dark:bg-slate-800/40 flex items-center justify-center shadow-inner transition-colors duration-500"
                            animate={{ 
                                rotate: 360, 
                                x: [0, -10, 0], // Parallax effect
                                y: [0, 10, 0] 
                            }}
                            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                        >
                            <div className="h-10 w-10 rounded-full bg-slate-500 dark:bg-slate-600 transition-colors duration-500" />
                        </motion.div>
                    </div>

                    {/* 4. Parallax Industrial Elements - Floating Beams (Bottom Right) */}
                    <div className="absolute -bottom-20 -right-20 hidden lg:block">
                        <motion.div
                            className="h-32 w-10 bg-slate-400/70 dark:bg-slate-700/70 rounded-md shadow-2xl transition-colors duration-500"
                            animate={{ 
                                y: [0, -15, 0], 
                                x: [0, 15, 0], 
                                rotate: [0, 7, 0] // Rotasi lebih tegas
                            }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div
                            className="h-10 w-32 bg-slate-400/70 dark:bg-slate-700/70 rounded-md shadow-2xl mt-4 ml-4 transition-colors duration-500"
                            animate={{ 
                                y: [0, 15, 0], 
                                x: [0, -15, 0], 
                                rotate: [0, -7, 0] 
                            }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
}