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

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 pt-6 border-t"
    >
      {/* Items per page */}
      <motion.div variants={itemVariants} className="flex items-center space-x-2">
        <span className="text-xs sm:text-sm text-muted-foreground">Rows per page:</span>
        <Select
          value={pagination.limit.toString()}
          onValueChange={(value) => onLimitChange(Number(value))}
        >
          <SelectTrigger className="w-20 sm:w-24 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={size.toString()} className="text-xs">
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Page info */}
      <motion.div variants={itemVariants} className="text-xs sm:text-sm text-muted-foreground text-center">
        {pagination.totalCount === 0 ? (
          "No entries found"
        ) : (
          <>
            Showing <span className="font-medium">{startItem}</span> to{" "}
            <span className="font-medium">{endItem}</span> of{" "}
            <span className="font-medium">{pagination.totalCount}</span> entries
          </>
        )}
      </motion.div>

      {/* Pagination controls */}
      <motion.div variants={itemVariants} className="flex items-center space-x-1">
        {/* First Page */}
        <motion.div
          variants={itemVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={pagination.page <= 1}
            className="                     hover:border-blue-300 dark:hover:border-blue-500
"
            title="First page"
          >
            {/* <ChevronsLeft className="h-4 w-4" /> */}
            <span className="text-xs font-bold">First</span>
          </Button>
        </motion.div>

        {/* Previous Page */}
        <motion.div
          variants={itemVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="h-8 w-8 p-0"
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </motion.div>

        {/* Page numbers */}
        <div className="flex items-center space-x-1 mx-2">
          <AnimatePresence mode="popLayout">
            {pageNumbers.map((page, index) => (
              page === '...' ? (
                <motion.span
                  key={`ellipsis-${index}`}
                  variants={pageNumberVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="px-2 text-xs text-muted-foreground"
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
                    variant={pagination.page === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    className={`h-8 w-8 p-0 text-xs font-medium ${pagination.page === page
                      ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : ""
                      }`}
                  >
                    {page}
                  </Button>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>

        {/* Next Page */}
        <motion.div
          variants={itemVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= totalPages}
            className="h-8 w-8 p-0"
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>

        {/* Last Page */}
        <motion.div
          variants={itemVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={pagination.page >= totalPages}
            className="                     border border-gray-300 dark:border-gray-600
"
            title="Last page"
          >
            {/* <ChevronsRight className="h-4 w-4" /> */}
            <span className="text-xs font-bold">Last</span>
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}