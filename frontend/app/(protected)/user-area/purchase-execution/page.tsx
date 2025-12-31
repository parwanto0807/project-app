"use client";


import PurchaseExecutionList from "@/components/dashboard/user/PurchaseExecutionList";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PurchaseExecutionPage() {
    const router = useRouter();

    const layoutProps: LayoutProps = {
        title: "Purchase Execution",
        role: "user",
        children: (
            <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] p-4 md:p-8 pb-32">
                <Breadcrumb className="mb-6">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Badge variant="outline" className="cursor-pointer">
                                    <Link href="/user-area">Dashboard</Link>
                                </Badge>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <Badge variant="outline">
                                <BreadcrumbPage>Purchase Execution</BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="max-w-7xl mx-auto space-y-6">

                    {/* TOP NAVIGATION & BADGE AREA */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Belanja Material Proyek</h1>

                            {/* BADGE SMOOTH MENCOLOK */}
                            <div className="flex items-center gap-2 mt-1">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                </span>
                                <div className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-widest border border-amber-200 dark:border-amber-800 shadow-sm">
                                    Mode Eksekusi Lapangan
                                </div>
                            </div>
                        </div>

                        {/* USER INFO BADGE (Opsional - Agar terlihat lebih Pro) */}
                        <div className="hidden md:flex items-center gap-3 bg-white dark:bg-gray-800 p-2 pr-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-white shadow-inner">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Status Tim</p>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Siap Eksekusi</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* MAIN CONTENT AREA */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <PurchaseExecutionList />
                    </motion.div>
                </div>

                {/* DECORATIVE BACKGROUND ELEMENTS (Agar tidak membosankan) */}
                <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="fixed bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
            </div>
        )
    };

    return <AdminLayout {...layoutProps} />;
}