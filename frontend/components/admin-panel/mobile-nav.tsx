"use client";

import { Easing, motion } from "framer-motion";
import { X, HelpCircle, User2, LayoutDashboard, FileText, BarChart2, LogOut, Settings } from "lucide-react";

interface MobileNavProps {
    onClose: () => void;
}

const MobileNav = ({ onClose }: MobileNavProps) => {
    const navVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut" as Easing
            }
        },
        exit: {
            opacity: 0,
            y: 50,
            transition: {
                duration: 0.4,
                ease: "easeIn" as Easing
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -30 },
        visible: { 
            opacity: 1, 
            x: 0,
            transition: { duration: 0.5, ease: "easeOut" as Easing }
        }
    };

    const getIconStyle = (index: number) => {
        const styles = [
            "from-blue-500/90 to-blue-600/90",
            "from-green-500/90 to-emerald-600/90",
            "from-purple-500/90 to-violet-600/90",
            "from-amber-500/90 to-orange-500/90",
            "from-rose-500/90 to-pink-600/90",
            "from-indigo-500/90 to-indigo-600/90",
        ];
        return styles[index % styles.length];
    };

    const menuItems = [
        { name: "Dashboard", icon: LayoutDashboard, action: () => alert("Navigasi ke Dashboard") },
        { name: "Buat Progress SPK", icon: FileText, action: () => alert("Navigasi ke Buat Progress SPK") },
        { name: "Laporan Progress SPK", icon: BarChart2, action: () => alert("Navigasi ke Laporan Progress SPK") },
        { name: "Pengaturan", icon: Settings, action: () => alert("Navigasi ke Pengaturan") },
        { name: "Pusat Bantuan", icon: HelpCircle, action: () => alert("Navigasi ke Pusat Bantuan") },
        { name: "Akun Saya", icon: User2, action: () => alert("Navigasi ke Akun Saya") },
    ];

    return (
        <motion.div
            className="fixed inset-0 bg-gradient-to-br from-blue-50/20 via-indigo-50/20 to-purple-50/20 dark:from-gray-900/95 dark:via-gray-900/95 dark:to-gray-850/95 backdrop-blur-md z-50 flex flex-col"
            variants={navVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
            </div>

            {/* Header dengan Glass Effect */}
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border-b border-white/30 dark:border-gray-700/30 p-6 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500/90 to-purple-600/90 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md border border-white/30">
                        <LayoutDashboard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Menu Utama
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Navigasi aplikasi SPK</p>
                    </div>
                </div>
                <button 
                    onClick={onClose} 
                    className="p-3 rounded-2xl bg-white/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/70 dark:hover:bg-gray-600/70 backdrop-blur-md border border-white/30 dark:border-gray-600/30 transition-all duration-300 group shadow-sm hover:shadow-md"
                >
                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                </button>
            </div>

            {/* User Profile Section dengan Glass Effect */}
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mx-6 mt-6 p-5 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-gray-700/30 shadow-lg"
            >
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500/90 to-purple-600/90 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md border border-white/30">
                        <User2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">Ahmad Rizki</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Supervisor Teknis</p>
                        <div className="flex items-center mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Online</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Daftar Menu dengan Glass Effect */}
            <motion.ul
                className="flex-1 px-6 py-6 space-y-3 overflow-y-auto"
                variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                initial="hidden"
                animate="visible"
            >
                {menuItems.map((item, index) => (
                    <motion.li
                        key={index}
                        variants={itemVariants}
                        whileHover={{ 
                            x: 8, 
                            scale: 1.02,
                            transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.98 }}
                        className="cursor-pointer"
                    >
                        <a
                            onClick={(e) => {
                                e.preventDefault();
                                item.action();
                                onClose();
                            }}
                            className="flex items-center space-x-4 p-5 rounded-3xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300 shadow-sm hover:shadow-md group"
                        >
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${getIconStyle(index)} flex items-center justify-center shadow-md backdrop-blur-md border border-white/30 group-hover:scale-110 transition-transform duration-300`}>
                                <item.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <span className="font-semibold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {item.name}
                                </span>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="w-2 h-2 bg-blue-500/70 rounded-full"></div>
                            </div>
                        </a>
                    </motion.li>
                ))}
            </motion.ul>

            {/* Logout Button dengan Glass Effect */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="px-6 pb-6 mt-auto"
            >
                <button className="w-full flex items-center justify-center space-x-3 p-5 rounded-3xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 hover:bg-rose-50/50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-all duration-300 shadow-sm hover:shadow-md group">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-rose-500/90 to-pink-600/90 flex items-center justify-center shadow-md backdrop-blur-md border border-white/30 group-hover:scale-110 transition-transform duration-300">
                        <LogOut className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-semibold">Keluar Akun</span>
                </button>
            </motion.div>

            {/* Footer dengan Glass Effect */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border-t border-white/30 dark:border-gray-700/30 p-4 text-center"
            >
                <p className="text-xs text-gray-500 dark:text-gray-400 tracking-wide">
                    © 2024 SPK Management v2.1.0
                </p>
            </motion.div>
        </motion.div>
    );
};

export default MobileNav;