"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useState } from "react";
import {
  CreditCard,
  Package,
  Users,
  ChevronLeft,
  FolderOpen,
  FileText,
  ClipboardList,
  Settings,
  DollarSign,
  UserCog,
  PackageOpen,
  PackageCheck,
  Wallet,
  Banknote,
  Briefcase,
  TrendingUp
} from "lucide-react";
import Link from "next/link";

interface MenuItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  menus: MenuItem[];
}

interface MobileShortcutProps {
  basePath?: string;
  customGroups?: MenuGroup[];
}

export function MobileShortcut({ basePath = "/admin-area", customGroups }: MobileShortcutProps) {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  // Default groups untuk admin
  const getDefaultGroups = (): MenuGroup[] => [
    // {
    //   id: "dashboard",
    //   label: "Dashboard",
    //   icon: BarChart3,
    //   color: "from-blue-500 to-blue-600",
    //   menus: [
    //     {
    //       href: basePath,
    //       label: "Admin Dashboard",
    //       icon: BarChart3,
    //       description: "Overview dashboard admin"
    //     }
    //   ]
    // },
    {
      id: "sales",
      label: "Sales",
      icon: CreditCard,
      color: "from-green-500 to-green-600",
      menus: [
        {
          href: `${basePath}/sales/salesOrder`,
          label: "Sales Order",
          icon: FileText,
          description: "Kelola order penjualan"
        },
        {
          href: `${basePath}/sales/quotation`,
          label: "Quotation",
          icon: FileText,
          description: "Buat dan kelola penawaran"
        }
      ]
    },
    {
      id: "logistic",
      label: "Logistic",
      icon: PackageOpen,
      color: "from-orange-500 to-orange-600",
      menus: [
        {
          href: `${basePath}/logistic/spk`,
          label: "Surat Perintah Kerja",
          icon: ClipboardList,
          description: "Buat dan kelola SPK"
        },
        {
          href: `${basePath}/logistic/pr`,
          label: "Purchase Request",
          icon: FileText,
          description: "Permintaan pembelian"
        },
        {
          href: `${basePath}/logistic/bap`,
          label: "Berita Acara",
          icon: FileText,
          description: "Dokumentasi pekerjaan"
        },
        {
          href: `${basePath}/logistic/rab`,
          label: "RAB",
          icon: DollarSign,
          description: "Rancangan anggaran"
        }
      ]
    },
    {
      id: "production",
      label: "Production",
      icon: PackageCheck,
      color: "from-purple-500 to-purple-600",
      menus: [
        {
          href: `${basePath}/logistic/spkReport`,
          label: "SPK Progress",
          icon: TrendingUp,
          description: "Monitor progress pekerjaan"
        }
      ]
    },
    {
      id: "accounting",
      label: "Accounting",
      icon: Wallet,
      color: "from-amber-500 to-amber-600",
      menus: [
        {
          href: `${basePath}/accounting/prVerify`,
          label: "Verifikasi PR",
          icon: Settings,
          description: "Verifikasi purchase request"
        }
      ]
    },
    {
      id: "finance",
      label: "Finance",
      icon: Banknote,
      color: "from-emerald-500 to-emerald-600",
      menus: [
        {
          href: `${basePath}/finance/invoice`,
          label: "Invoicing",
          icon: FileText,
          description: "Kelola invoice dan tagihan"
        },
        {
          href: `${basePath}/finance/prApprove`,
          label: "Request Approval",
          icon: Settings,
          description: "Persetujuan pembiayaan"
        }
      ]
    },
    {
      id: "master",
      label: "Master Data",
      icon: Briefcase,
      color: "from-slate-500 to-slate-600",
      menus: [
        {
          href: `${basePath}/master/customers`,
          label: "Data Customer",
          icon: Users,
          description: "Kelola data pelanggan"
        },
        {
          href: `${basePath}/master/products`,
          label: "Data Products",
          icon: Package,
          description: "Kelola data produk"
        },
        {
          href: `${basePath}/master/karyawan`,
          label: "Data Employee",
          icon: UserCog,
          description: "Kelola data karyawan"
        },
        {
          href: `${basePath}/master/team`,
          label: "Data Team",
          icon: Users,
          description: "Kelola tim kerja"
        },
        {
          href: `${basePath}/master/coa`,
          label: "Chart of Account",
          icon: DollarSign,
          description: "Kelola akun keuangan"
        }
      ]
    }
  ];

  const menuGroups = customGroups || getDefaultGroups();
  const activeGroupData = menuGroups.find(group => group.id === activeGroup);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="lg:hidden mb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
          Quick Access
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
          {menuGroups.length} groups
        </span>
      </div>

      <AnimatePresence mode="wait">
        {!activeGroup ? (
          // Group View
          <motion.div
            key="groups"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-3 gap-3 px-1"
          >
            {menuGroups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="group cursor-pointer"
                onClick={() => setActiveGroup(group.id)}
              >
                <div className={`
                  rounded-xl p-3 flex flex-col items-center justify-center text-center
                  bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm 
                  border border-slate-200/80 dark:border-slate-700/80
                  shadow-xs hover:shadow-sm transition-all duration-200
                  group-hover:border-slate-300/60 dark:group-hover:border-slate-600/60
                `}>
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center mb-2
                    bg-gradient-to-br ${group.color} shadow-md
                    group-hover:shadow-lg transition-all duration-200
                  `}>
                    <group.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2">
                    {group.label}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
                    {group.menus.length} menus
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          // Menu Detail View
          <motion.div
            key="menu-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            {/* Group Header */}
            <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${activeGroupData?.color} flex items-center justify-center shadow-sm`}>
                {activeGroupData?.icon && React.createElement(activeGroupData.icon, { className: "w-3 h-3 text-white" })}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {activeGroupData?.label}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  {activeGroupData?.menus.length} menus available
                </p>
              </div>
            </div>

            {/* Menu List */}
            <div className="space-y-3">
              {activeGroupData?.menus.map((menu, index) => (
                <motion.div
                  key={menu.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="group"
                >
                  <Link href={menu.href}>
                    <div
                      className="relative flex items-center gap-3 p-3.5 rounded-xl 
                     bg-white/60 dark:bg-slate-900/40 backdrop-blur-md 
                     border border-slate-200/50 dark:border-slate-700/40 
                     hover:border-slate-300 dark:hover:border-slate-600 
                     shadow-sm hover:shadow-md transition-all duration-300 
                     cursor-pointer overflow-hidden"
                    >
                      {/* Subtle gradient highlight */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-blue-500/5 via-indigo-500/10 to-purple-500/5"></div>

                      {/* Icon */}
                      <div
                        className="relative z-10 w-9 h-9 flex items-center justify-center 
                       rounded-lg bg-gradient-to-tr from-slate-100 to-slate-200 
                       dark:from-slate-800 dark:to-slate-700 
                       group-hover:from-indigo-500/20 group-hover:to-purple-500/20 
                       transition-all duration-300"
                      >
                        <menu.icon className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-indigo-400 transition-colors" />
                      </div>

                      {/* Text */}
                      <div className="relative z-10 flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {menu.label}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {menu.description}
                        </p>
                      </div>

                      {/* Arrow */}
                      <ChevronLeft
                        className="relative z-10 w-3.5 h-3.5 text-slate-400 rotate-180 
                       transform transition-all group-hover:translate-x-1 
                       group-hover:text-indigo-400"
                      />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex justify-end mb-3"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveGroup(null)}
                className="relative flex items-center gap-2 px-4 py-2 text-xs font-medium 
               text-white rounded-full
               bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500
               shadow-md hover:shadow-lg transition-all duration-300
               overflow-hidden"
              >
                {/* Subtle glassy overlay */}
                <span className="absolute inset-0 bg-white/10 blur-md opacity-20"></span>

                <ChevronLeft className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">Back to Groups</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 px-1"
      >
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <FolderOpen className="w-3 h-3" />
            {activeGroup ? activeGroupData?.label : "All Groups"}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            Online
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}