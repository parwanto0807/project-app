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
      className={clsx(
        "flex flex-wrap items-center justify-between gap-y-4 pt-4 pb-2 border-t border-gray-200 dark:border-gray-800 w-full"
      )}
    >
      {/* LEFT: Items per page (Mobile: Bottom Left, Order 2) (Desktop: Left, Order 1) */}
      <motion.div
        variants={itemVariants}
        className="w-1/2 sm:w-1/3 flex justify-start order-2 sm:order-1 pr-2"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Rows:</span>
          <Select
            value={pagination.limit.toString()}
            onValueChange={(value) => onLimitChange(Number(value))}
          >
            <SelectTrigger className="w-[70px] h-8 text-xs bg-background border-input hover:bg-accent hover:text-accent-foreground transition-colors focus:ring-1 focus:ring-ring">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem
                  key={size}
                  value={size.toString()}
                  className="text-xs"
                >
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* CENTER: Pagination Controls (Mobile: Top, Order 1) (Desktop: Center, Order 2) */}
      <motion.div
        variants={itemVariants}
        className="w-full sm:w-1/3 flex justify-center order-1 sm:order-2 mb-2 sm:mb-0"
      >
        <div className="flex items-center gap-1">
          {/* First Page - Hidden on Mobile */}
          <div className="hidden sm:block">
            <PaginationEdgeButton
              onClick={() => onPageChange(1)}
              disabled={pagination.page <= 1}
              className="hidden sm:flex"
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

          {/* Page numbers scrollable area on very small screens */}
          <div className="flex items-center gap-1 mx-1 overflow-x-auto no-scrollbar max-w-[200px] sm:max-w-none justify-center px-1">
            <AnimatePresence mode="popLayout" initial={false}>
              {pageNumbers.map((page, index) => (
                page === '...' ? (
                  <motion.span
                    key={`ellipsis-${index}`}
                    variants={pageNumberVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex h-8 w-6 items-center justify-center text-xs text-muted-foreground select-none"
                  >
                    •••
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
                    layout
                  >
                    <Button
                      variant={pagination.page === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(page as number)}
                      className={clsx(
                        "h-8 w-8 p-0 text-xs font-medium transition-all duration-200 shadow-sm",
                        pagination.page === page
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-background hover:bg-accent hover:text-accent-foreground border-input"
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

          {/* Last Page - Hidden on Mobile */}
          <div className="hidden sm:block">
            <PaginationEdgeButton
              onClick={() => onPageChange(totalPages)}
              disabled={pagination.page >= totalPages}
              className="hidden sm:flex"
            >
              Last
            </PaginationEdgeButton>
          </div>
        </div>
      </motion.div>

      {/* RIGHT: Info (Mobile: Bottom Right, Order 3) (Desktop: Right, Order 3) */}
      <motion.div
        variants={itemVariants}
        className="w-1/2 sm:w-1/3 flex justify-end order-3 sm:order-3 pl-2"
      >
        <div className="text-xs text-muted-foreground whitespace-nowrap text-right">
          {pagination.totalCount === 0 ? (
            "No data"
          ) : (
            <span>
              <span className="font-medium text-foreground">{startItem}</span>-
              <span className="font-medium text-foreground">{endItem}</span> of{" "}
              <span className="font-medium text-foreground">{pagination.totalCount}</span>
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}