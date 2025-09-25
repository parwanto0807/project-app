"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function AdminLoading({ message = "Loading data..." }: { message?: string }) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center space-y-6 bg-gradient-to-br from-background via-background to-muted p-4">
            {/* Animated Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col items-center space-y-6"
            >
                {/* Glowing Spinner */}
                <div className="relative">
                    <motion.div
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-xl"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                        className="relative z-10 rounded-full bg-card p-6 shadow-lg backdrop-blur-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </motion.div>
                </div>

                {/* Message with Typing Effect */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="text-center"
                >
                    <motion.h3
                        className="text-lg font-medium text-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                    >
                        Please wait...
                    </motion.h3>
                    <motion.p
                        className="mt-2 text-sm text-muted-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                    >
                        {message}
                    </motion.p>
                </motion.div>

                {/* Floating Dots Animation (Optional Decoration) */}
                <div className="absolute -top-10 -left-10 hidden md:block">
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="h-2 w-2 rounded-full bg-blue-400/40"
                            animate={{
                                y: [0, -20, 0],
                                x: [0, i % 2 === 0 ? 10 : -10, 0],
                                opacity: [0.8, 0.3, 0.8],
                            }}
                            transition={{
                                duration: 2 + i * 0.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            style={{ position: "absolute", left: `${i * 30}px` }}
                        />
                    ))}
                </div>

                <div className="absolute -bottom-10 -right-10 hidden md:block">
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="h-2 w-2 rounded-full bg-purple-400/40"
                            animate={{
                                y: [0, 20, 0],
                                x: [0, i % 2 === 0 ? -10 : 10, 0],
                                opacity: [0.8, 0.3, 0.8],
                            }}
                            transition={{
                                duration: 2 + i * 0.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            style={{ position: "absolute", left: `${i * 30}px` }}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
}