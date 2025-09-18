// File: @/components/BottomNavigation.tsx

"use client";

import { motion } from "framer-motion";
import { Home, FileText, BarChart2, User, Settings } from "lucide-react";

interface BottomNavigationProps {
    activeMenu: string;
    onMenuChange: (menuId: string) => void;
}

const BottomNavigation = ({ activeMenu, onMenuChange }: BottomNavigationProps) => {
    return (
        <motion.nav
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="fixed bottom-0 left-1/2 transform -translate-x-1/2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl rounded-3xl shadow-2xl p-3 flex items-center justify-around w-full max-w-md border border-white/30 dark:border-gray-700/30 z-50"
        >
            {[
                { icon: Home, label: "Home", id: "home", color: "from-blue-500/90 to-blue-600/90", darkColor: "from-blue-600/90 to-blue-700/90" },
                { icon: FileText, label: "Buat", id: "create", color: "from-green-500/90 to-emerald-600/90", darkColor: "from-green-600/90 to-emerald-700/90" },
                { icon: BarChart2, label: "Laporan", id: "report", color: "from-purple-500/90 to-violet-600/90", darkColor: "from-purple-600/90 to-violet-700/90" },
                { icon: User, label: "Profil", id: "profile", color: "from-amber-500/90 to-orange-600/90", darkColor: "from-amber-600/90 to-orange-700/90" },
                { icon: Settings, label: "Setelan", id: "settings", color: "from-gray-500/90 to-gray-600/90", darkColor: "from-gray-600/90 to-gray-700/90" }
            ].map((item) => (
                <button
                    key={item.id}
                    onClick={() => onMenuChange(item.id)}
                    className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-300 relative ${activeMenu === item.id
                        ? 'text-blue-600 dark:text-blue-400 scale-105'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${activeMenu === item.id ? (item.color + ' dark:' + item.darkColor) : 'bg-white/50 dark:bg-gray-700/50'} flex items-center justify-center mb-2 transition-all duration-300 backdrop-blur-md border ${activeMenu === item.id ? 'border-white/30' : 'border-white/20 dark:border-gray-600/30'}`}>
                        <item.icon className={`w-6 h-6 ${activeMenu === item.id ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} />
                    </div>
                    <span className="text-xs font-medium">{item.label}</span>
                    {activeMenu === item.id && (
                        <motion.div
                            layoutId="activeNav"
                            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-500 dark:bg-blue-400 rounded-full"
                            transition={{ type: "spring", bounce: 0.3 }}
                        />
                    )}
                </button>
            ))}
        </motion.nav>
    );
};

export default BottomNavigation;