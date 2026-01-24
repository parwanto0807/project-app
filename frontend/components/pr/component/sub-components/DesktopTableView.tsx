// Di dalam DesktopTableView.tsx
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { DetailedTableSkeleton } from "@/components/ui/tableSkeleton";
import { ExpandableRow } from "./ExpandableRow";
import { DesktopTableViewProps } from "../types";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Custom Empty State Component dengan animasi
const CustomEmptyState = ({
  message = "Belum ada data",
  tabType = "all"
}: {
  message?: string;
  tabType?: string;
}) => {
  const iconVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 15
      }
    }
  };

  const textVariants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.2 }
    }
  };

  const getTabColor = () => {
    switch (tabType) {
      case "project": return "from-blue-500 to-cyan-500";
      case "umum": return "from-emerald-500 to-green-500";
      default: return "from-gray-500 to-gray-400";
    }
  };

  return (
    <TableRow>
      <TableCell colSpan={10} className="h-72 text-center">
        <motion.div
          initial="initial"
          animate="animate"
          className="flex flex-col items-center justify-center space-y-6"
        >
          {/* Animated Icon Container */}
          <motion.div
            variants={iconVariants}
            className={cn(
              "relative p-6 rounded-2xl",
              "bg-gradient-to-br from-gray-50 to-white",
              "dark:from-gray-900 dark:to-gray-800",
              "shadow-lg shadow-black/5",
              "border border-gray-200/50 dark:border-gray-700/50"
            )}
          >
            {/* Glow Effect */}
            <div className={cn(
              "absolute -inset-1 rounded-2xl blur-xl opacity-30",
              "bg-gradient-to-r",
              getTabColor(),
              "transition-all duration-500"
            )} />

            {/* Icon */}
            <div className="relative">
              <svg
                className="h-12 w-12 text-gray-300 dark:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>

              {/* Floating Dots */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className={cn(
                    "absolute w-2 h-2 rounded-full",
                    i === 0 ? "bg-blue-400 -top-1 -right-1" :
                      i === 1 ? "bg-emerald-400 -bottom-1 -left-1" :
                        "bg-amber-400 top-1/2 -right-2"
                  )}
                  animate={{
                    y: [0, -8, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.3,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Text Content */}
          <motion.div variants={textVariants} className="space-y-3 max-w-md">
            <h3 className={cn(
              "text-xl font-semibold tracking-tight",
              "bg-gradient-to-r bg-clip-text text-transparent",
              tabType === "project" ? "from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400" :
                tabType === "umum" ? "from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400" :
                  "from-gray-600 to-gray-500 dark:from-gray-400 dark:to-gray-300"
            )}>
              {tabType === "project" ? "Tidak Ada PR Project" :
                tabType === "umum" ? "Tidak Ada PR Umum" :
                  "Tidak Ada Data"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {message}
            </p>
          </motion.div>
        </motion.div>
      </TableCell>
    </TableRow>
  );
};

export function DesktopTableView({
  purchaseRequests,
  isLoading,
  expandedRows,
  role,
  isDeleting,
  onToggleRowExpansion,
  onViewDetail,
  onViewPdf,
  onCreateLpp,
  onEdit,
  onDelete,
  getSerialNumber,
  showSkeleton = false,
  skeletonRows = 10,
  enableTabFilter = false,
  activeTab: controlledActiveTab,
  onTabChange,
  onPrNumberSearch,
  counts: serverCounts,
  onSettleBudget,
}: DesktopTableViewProps) {

  const searchParams = useSearchParams();
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const highlightId = searchParams.get("highlightId") || "";
  const [internalActiveTab, setInternalActiveTab] = useState<"all" | "umum" | "project">("umum");

  const activeTab = controlledActiveTab || internalActiveTab;
  const setActiveTab = (tab: "all" | "umum" | "project") => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };
  const [localSearch, setLocalSearch] = useState("");

  // Filter PR berdasarkan local search (tab filter dilakukan di server jika dikontrol)
  const filteredPRs = purchaseRequests.filter((pr) => {
    const matchesSearch = !localSearch || pr.nomorPr.toLowerCase().includes(localSearch.toLowerCase());
    if (!matchesSearch) return false;

    // Jika tidak dikontrol prop, filter manual di client
    if (!controlledActiveTab) {
      if (activeTab === "all") return true;
      if (activeTab === "umum") return !pr.spkId;
      if (activeTab === "project") return !!pr.spkId;
    }

    return true;
  });

  const handlePrNumberClick = (pr: any) => {
    // Lebih robust: cek spkId atau keberadaan objek spk
    const hasSpk = pr.spkId || (pr.spk && Object.keys(pr.spk).length > 0);
    const targetTab = hasSpk ? "project" : "umum";

    if (onPrNumberSearch) {
      onPrNumberSearch(targetTab, pr.nomorPr);
    } else {
      setActiveTab(targetTab);
      setLocalSearch(pr.nomorPr);
    }
  };

  // Count untuk setiap kategori
  // Count untuk setiap kategori - prioritaskan serverCounts jika ada
  const counts = {
    all: serverCounts?.all ?? purchaseRequests.length,
    project: serverCounts?.project ?? purchaseRequests.filter(pr => pr.spkId).length,
    umum: serverCounts?.umum ?? purchaseRequests.filter(pr => !pr.spkId).length,
  };

  // Effect untuk highlight
  useEffect(() => {
    if (!highlightId) return;
    // ... (kode effect tetap sama)
  }, [highlightId]);

  // Render tabel body
  const renderTableBody = () => {
    if (showSkeleton) {
      return <DetailedTableSkeleton rows={skeletonRows} />;
    }

    if (isLoading && !showSkeleton) {
      return (
        <TableRow>
          <TableCell colSpan={11} className="h-24 text-center">
            <div className="flex justify-center items-center space-x-3">
              <div className="relative">
                <div className="animate-spin rounded-full h-7 w-7 border-2 border-blue-200 border-t-blue-600"></div>
                <div className="absolute inset-0 animate-ping rounded-full border-2 border-blue-400 opacity-20"></div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Memuat data...</p>
                <p className="text-xs text-gray-500">Harap tunggu sebentar</p>
              </div>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (filteredPRs.length === 0) {
      // Custom message berdasarkan tab
      let emptyMessage = "Data akan muncul di sini setelah Anda membuat PR";
      if (activeTab === "umum") emptyMessage = "Buat PR Umum untuk mengelola pengeluaran non-project";
      if (activeTab === "project") emptyMessage = "Buat PR Project untuk kebutuhan pengadaan proyek";

      return <CustomEmptyState message={emptyMessage} tabType={activeTab} />;
    }

    return (
      <AnimatePresence>
        {filteredPRs.map((pr, index) => (
          <ExpandableRow
            key={pr.id}
            ref={(el) => {
              rowRefs.current[pr.id] = el;
            }}
            delay={index * 0.05}
            pr={pr}
            index={getSerialNumber(index)}
            isExpanded={expandedRows.has(pr.id)}
            role={role}
            isDeleting={isDeleting}
            onToggle={() => onToggleRowExpansion(pr.id)}
            onViewDetail={() => onViewDetail(pr)}
            onViewPdf={() => onViewPdf(pr)}
            onCreateLpp={() => onCreateLpp(pr.id)}
            onEdit={() => onEdit(pr)}
            onDelete={() => onDelete(pr.id)}
            onPrClick={handlePrNumberClick}
            onSettleBudget={onSettleBudget}
            highlightId={highlightId}
          />
        ))}
      </AnimatePresence>
    );
  };

  // Tab configuration dengan style premium
  const tabs = [
    {
      id: "umum",
      label: "PR Umum",
      count: counts.umum,
      gradient: "from-emerald-600 via-green-500 to-emerald-500",
      activeGradient: "from-emerald-700 via-green-600 to-emerald-600",
      lightGradient: "from-emerald-50 via-green-50 to-emerald-100",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      id: "project",
      label: "PR Project",
      count: counts.project,
      gradient: "from-blue-600 via-blue-500 to-cyan-500",
      activeGradient: "from-blue-700 via-blue-600 to-cyan-600",
      lightGradient: "from-blue-50 via-cyan-50 to-blue-100",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      id: "all",
      label: "Semua PR",
      count: counts.all,
      gradient: "from-gray-600 via-gray-500 to-gray-400",
      activeGradient: "from-gray-900 via-gray-800 to-gray-700",
      lightGradient: "from-gray-100 via-gray-50 to-white",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
  ];

  // Jika tidak enable tab filter
  if (!enableTabFilter) {
    return (
      <div className="border rounded-xl overflow-hidden border-gray-200/50 dark:border-gray-800/50 shadow-sm bg-white dark:bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
              <TableHead className="w-12 text-center font-semibold text-gray-700 dark:text-gray-300">#</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">PR Number</TableHead>
              <TableHead className="w-20 font-semibold text-gray-700 dark:text-gray-300">Project</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Admin & Request</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Total Amount</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-right">Acc Finance (%)</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-right">Sisa Budget</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Status (PR & FNC)</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Rincian LPP</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderTableBody()}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Jika enable tab filter dengan design premium
  return (
    <div className="space-y-6">
      {/* Premium Tab Navigation */}
      <div className="space-y-3">
        {/* Tab Container dengan glassmorphism effect */}
        <div className="relative">
          {/* Background Blur */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-800/80 backdrop-blur-md rounded-2xl border border-gray-200/40 dark:border-gray-700/40 shadow-lg shadow-black/5" />

          <div className="relative p-2 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setLocalSearch("");
                    }}
                    className={cn(
                      "relative px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300",
                      "flex items-center gap-3 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                      "min-w-[140px] justify-between group",
                      isActive
                        ? "text-white shadow-lg shadow-black/10"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Active Background Gradient */}
                    {isActive && (
                      <>
                        <motion.div
                          layoutId="active-tab"
                          className={cn(
                            "absolute inset-0 rounded-xl",
                            "bg-gradient-to-r",
                            tab.activeGradient,
                            "shadow-inner"
                          )}
                          initial={false}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25
                          }}
                        />
                        {/* Inner Glow */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent" />
                      </>
                    )}

                    {/* Icon and Label */}
                    <div className="relative z-10 flex items-center gap-3">
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        isActive
                          ? "bg-white/20"
                          : cn(
                            "bg-gradient-to-br",
                            tab.lightGradient,
                            "group-hover:shadow-sm"
                          )
                      )}>
                        {tab.icon}
                      </div>
                      <span className="tracking-tight">{tab.label}</span>
                    </div>

                    {/* Count Badge */}
                    <span className={cn(
                      "relative z-10 text-xs font-bold px-2.5 py-1 rounded-full transition-all duration-300",
                      isActive
                        ? "bg-white/20 backdrop-blur-sm text-white"
                        : cn(
                          "bg-gradient-to-br",
                          tab.lightGradient,
                          "text-gray-600 dark:text-gray-400",
                          "group-hover:shadow-sm"
                        )
                    )}>
                      {tab.count}
                    </span>

                    {/* Hover Effect */}
                    {!isActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Active Tab Indicator & Info */}
            <div className="hidden lg:flex items-center gap-4">
              {localSearch && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setLocalSearch("")}
                  className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-2 hover:bg-amber-100 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear Filter: {localSearch}
                </motion.button>
              )}
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50"
              >
                <div className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  activeTab === "all" ? "bg-gray-500" :
                    activeTab === "project" ? "bg-blue-500" :
                      "bg-emerald-500"
                )} />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Menampilkan <span className="font-bold text-gray-900 dark:text-gray-100">{counts[activeTab as keyof typeof counts]}</span> data
                </span>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Tab Content Indicator */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{
            opacity: 1,
            width: "100%",
            transition: { delay: 0.1 }
          }}
          className="h-px bg-gradient-to-r from-transparent via-gray-300/50 to-transparent dark:via-gray-700/50"
        />
      </div>

      {/* Premium Table Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="border rounded-2xl overflow-hidden border-gray-200/50 dark:border-gray-800/50 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950"
      >
        {/* Table Header Gradient */}
        <div className={cn(
          "bg-gradient-to-r",
          activeTab === "all" ? "from-gray-100/50 to-gray-200/50 dark:from-gray-900 dark:to-gray-800" :
            activeTab === "project" ? "from-blue-50/30 to-cyan-50/30 dark:from-blue-900/20 dark:to-cyan-900/20" :
              "from-emerald-50/30 to-green-50/30 dark:from-emerald-900/20 dark:to-green-900/20",
          "border-b border-gray-200/30 dark:border-gray-700/30"
        )}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-6 text-center font-bold text-gray-700 dark:text-gray-300 py-4">#</TableHead>
                <TableHead className="w-40 font-bold text-gray-700 dark:text-gray-300 py-4">PR Number</TableHead>
                <TableHead className="w-20 font-bold text-gray-700 dark:text-gray-300 py-4">Project</TableHead>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300 py-4">Admin & Request</TableHead>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300 py-4">Total Amount</TableHead>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300 text-right py-4">Acc Finance (%)</TableHead>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300 text-right py-4">Sisa Budget</TableHead>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300 py-4">Status (PR & FNC)</TableHead>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300 py-4">Rincian LPP</TableHead>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300 text-right py-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderTableBody()}
            </TableBody>
          </Table>
        </div>

        {/* Table Footer */}
        {filteredPRs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "px-4 py-3 border-t border-gray-200/30 dark:border-gray-700/30",
              "bg-gradient-to-r from-transparent to-white/10 dark:to-gray-900/10",
              "flex items-center justify-between text-xs"
            )}
          >
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                activeTab === "all" ? "bg-gray-400" :
                  activeTab === "project" ? "bg-blue-400" :
                    "bg-emerald-400"
              )} />
              <span className="text-gray-600 dark:text-gray-400">
                Tab: <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {activeTab === "all" ? "Semua PR" : activeTab === "project" ? "PR Project" : "PR Umum"}
                </span>
              </span>
            </div>
            <div className="text-gray-600 dark:text-gray-400 font-medium">
              Total: <span className="text-gray-900 dark:text-gray-100">{filteredPRs.length} data</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}