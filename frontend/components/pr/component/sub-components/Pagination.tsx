import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaginationInfo } from "@/types/pr";
import { PAGE_SIZES } from "../constants";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface PaginationProps {
  pagination: PaginationInfo;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function Pagination({
  pagination,
  totalPages,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  // Generate page numbers dengan logic yang lebih baik
  const generatePageNumbers = () => {
    const currentPage = pagination.page;
    const pages = [];

    // Always show first page
    pages.push(1);

    // Calculate range around current page
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    // Adjust if we're near the start
    if (currentPage <= 3) {
      endPage = Math.min(5, totalPages);
    }

    // Adjust if we're near the end
    if (currentPage >= totalPages - 2) {
      startPage = Math.max(2, totalPages - 4);
    }

    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pages.push('...');
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      if (i > 1 && i < totalPages) {
        pages.push(i);
      }
    }

    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      pages.push('...');
    }

    // Always show last page if there is more than one page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();
  const startItem = ((pagination.page - 1) * pagination.limit) + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.totalCount);

  // Animation variants dengan type yang benar
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 10
      }
    },
    tap: { scale: 0.95 }
  };

  const pageNumberVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 500,
        damping: 30
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.2 }
    }
  };

  // 🔹 CUSTOM BUTTON COMPONENTS dengan style yang ditingkatkan
  const PaginationEdgeButton = ({
    children,
    onClick,
    disabled,
    className = ""
  }: {
    children: React.ReactNode;
    onClick: () => void;
    disabled: boolean;
    className?: string;
  }) => (
    <motion.div
      variants={itemVariants}
      whileHover={!disabled ? "hover" : undefined}
      whileTap="tap"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className={clsx(
          "h-8 px-3 rounded-lg text-xs font-medium transition-all duration-200",
          "border border-gray-300 dark:border-gray-600",
          "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800",
          "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20",
          "hover:border-blue-300 dark:hover:border-blue-500",
          "hover:text-blue-700 dark:hover:text-blue-300",
          "shadow-sm hover:shadow-md",
          "disabled:bg-gray-100 disabled:dark:bg-gray-800 disabled:text-gray-400 disabled:dark:text-gray-500 disabled:border-gray-200 disabled:dark:border-gray-700 disabled:cursor-not-allowed cursor-pointer",
          className
        )}
      >
        {children}
      </Button>
    </motion.div>
  );

  const PaginationArrowButton = ({
    onClick,
    disabled,
    direction,
  }: {
    onClick: () => void;
    disabled: boolean;
    direction: "left" | "right";
  }) => (
    <motion.div
      variants={itemVariants}
      whileHover={!disabled ? "hover" : undefined}
      whileTap="tap"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className={clsx(
          "h-8 w-8 rounded-lg transition-all duration-200",
          "border border-gray-300 dark:border-gray-600",
          "text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800",
          "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20",
          "hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-300 dark:hover:border-blue-500",
          "shadow-sm hover:shadow-md",
          "disabled:bg-gray-100 disabled:dark:bg-gray-800 disabled:text-gray-300 disabled:dark:text-gray-600 disabled:border-gray-200 disabled:dark:border-gray-700 disabled:cursor-not-allowed cursor-pointer"
        )}
      >
        {direction === "left" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>
    </motion.div>
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 pt-6 border-t border-gray-200 dark:border-gray-700"
    >
      {/* Items per page */}
      <motion.div variants={itemVariants} className="flex items-center space-x-2">
        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Rows per page:</span>
        <Select
          value={pagination.limit.toString()}
          onValueChange={(value) => onLimitChange(Number(value))}
        >
          <SelectTrigger className="w-20 sm:w-24 h-8 text-xs border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-500 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
            {PAGE_SIZES.map((size) => (
              <SelectItem 
                key={size} 
                value={size.toString()} 
                className="text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:bg-blue-50 dark:focus:bg-blue-900/20"
              >
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Page info */}
      <motion.div variants={itemVariants} className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">
        {pagination.totalCount === 0 ? (
          "No entries found"
        ) : (
          <>
            Showing <span className="font-medium text-gray-800 dark:text-gray-200">{startItem}</span> to{" "}
            <span className="font-medium text-gray-800 dark:text-gray-200">{endItem}</span> of{" "}
            <span className="font-medium text-gray-800 dark:text-gray-200">{pagination.totalCount}</span> entries
          </>
        )}
      </motion.div>

      {/* Pagination controls */}
      <motion.div variants={itemVariants} className="flex items-center space-x-1 md:space-x-2">
        {/* First Page - Hidden on mobile */}
        <div className="hidden md:block">
          <PaginationEdgeButton
            onClick={() => onPageChange(1)}
            disabled={pagination.page <= 1}
          >
            First
          </PaginationEdgeButton>
        </div>

        {/* Previous Page */}
        <PaginationArrowButton
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
          direction="left"
        />

        {/* Page numbers */}
        <div className="flex items-center space-x-0.5 mx-0.5">
          <AnimatePresence mode="popLayout">
            {pageNumbers.map((page, index) => (
              page === '...' ? (
                <motion.span
                  key={`ellipsis-${index}`}
                  variants={pageNumberVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex h-8 w-8 items-center justify-center text-xs text-gray-400 dark:text-gray-500 px-2"
                >
                  ...
                </motion.span>
              ) : (
                <motion.div
                  key={page}
                  variants={pageNumberVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    className={clsx(
                      "h-8 w-8 p-0 text-xs font-medium transition-all duration-200",
                      "border border-gray-300 dark:border-gray-600",
                      pagination.page === page
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 border-transparent"
                        : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-300 dark:hover:border-blue-500 shadow-sm hover:shadow-md cursor-pointer"
                    )}
                  >
                    {page}
                  </Button>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>

        {/* Next Page */}
        <PaginationArrowButton
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page >= totalPages}
          direction="right"
        />

        {/* Last Page - Hidden on mobile */}
        <div className="hidden md:block">
          <PaginationEdgeButton
            onClick={() => onPageChange(totalPages)}
            disabled={pagination.page >= totalPages}
          >
            Last
          </PaginationEdgeButton>
        </div>
      </motion.div>
    </motion.div>
  );
}