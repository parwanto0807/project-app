"use client";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { generatePagination } from "@/lib/utils";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PaginationProps {
  totalPages: number;
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  showPageSize?: boolean;
  className?: string;
}

// Ganti nama komponen untuk menghindari konflik
export default function PaginationComponent({
  totalPages,
  currentPage: controlledPage,
  onPageChange,
  className: customClassName
}: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isControlled = controlledPage !== undefined && onPageChange !== undefined;

  const [internalPage, setInternalPage] = useState(1);

  useEffect(() => {
    if (!isControlled) {
      const page = Number(searchParams.get("page")) || 1;
      setInternalPage(page);
    }
  }, [searchParams, isControlled]);

  const currentPage = isControlled ? controlledPage : internalPage;

  if (totalPages <= 1) return null;

  const createPageURL = (pageNumber: string | number) => {
    if (isControlled) return "#";

    const params = new URLSearchParams(searchParams);

    // Pastikan pageSize tetap dikirim
    const pageSize = searchParams.get("pageSize") || "10";
    params.set("pageSize", pageSize);

    // Set page baru
    params.set("page", pageNumber.toString());

    return `${pathname}?${params.toString()}`;
  };

  const handlePageClick = (pageNumber: number, e: React.MouseEvent) => {
    if (isControlled && onPageChange) {
      e.preventDefault();
      onPageChange(pageNumber);
    }
  };

  const allPages = generatePagination(currentPage, totalPages);

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
    hidden: {
      opacity: 0,
      scale: 0.8
    },
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
    tap: {
      scale: 0.95
    }
  };

  const pageNumberVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8
    },
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
      transition: {
        duration: 0.2
      }
    }
  };

  // 🔹 FIRST / LAST BUTTON
  const PaginationEdgeButton = ({
    label,
    page,
    disabled,
  }: {
    label: string;
    page: number;
    disabled: boolean;
  }) => {
    const href = createPageURL(page);

    const content = (
      <div className={clsx(
        "flex h-8 px-3 items-center justify-center rounded-lg border text-xs font-medium transition-all duration-200",
        disabled
          ? "border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-300 shadow-sm hover:shadow-md cursor-pointer"
      )}>
        {label}
      </div>
    );

    if (disabled) {
      return (
        <motion.div variants={itemVariants}>
          {content}
        </motion.div>
      );
    }

    return (
      <motion.div
        variants={itemVariants}
        whileHover="hover"
        whileTap="tap"
      >
        {isControlled ? (
          <div onClick={(e) => handlePageClick(page, e as any)}>
            {content}
          </div>
        ) : (
          <Link href={href} scroll={false}>
            {content}
          </Link>
        )}
      </motion.div>
    );
  };

  // 🔹 PAGE NUMBER
  const PaginationNumber = ({
    page,
    position,
    isActive
  }: {
    page: number | string;
    position?: "first" | "last" | "single" | "middle";
    isActive: boolean;
  }) => {
    // If it's ellipsis ("..."), page is a string
    const isEllipsis = position === "middle";
    const pageNum = typeof page === 'number' ? page : 0;
    const href = createPageURL(pageNum);

    const className = clsx(
      "flex h-8 w-8 items-center justify-center text-xs font-medium transition-all duration-200",
      {
        // Border radius
        "rounded-l-lg": position === "first",
        "rounded-r-lg": position === "last",
        "rounded-lg": position === "single",

        // Active state with gradient
        "z-10 bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25": isActive,

        // Inactive state
        "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer": !isActive && !isEllipsis,

        // Ellipsis state
        "text-gray-400 dark:text-gray-500 cursor-default bg-transparent border-none": isEllipsis,

        // Border adjustments
        "border-l-0": position === "last" || isEllipsis,
        "border-r-0": position === "first" || isEllipsis,
      }
    );

    if (isEllipsis) {
      return (
        <motion.div
          variants={itemVariants}
          className={className}
        >
          {page}
        </motion.div>
      );
    }

    const content = (
      <div className={className} aria-current={isActive ? "page" : undefined}>
        {page}
      </div>
    );

    return (
      <motion.div
        variants={itemVariants}
        whileHover={!isActive ? "hover" : undefined}
        whileTap="tap"
      >
        {isControlled ? (
          <div onClick={(e) => handlePageClick(pageNum, e as any)}>
            {content}
          </div>
        ) : (
          <Link href={href} scroll={false}>
            {content}
          </Link>
        )}
      </motion.div>
    );
  };

  // 🔹 NEXT / PREV BUTTON
  const PaginationArrow = ({
    direction,
    isDisabled,
  }: {
    direction: "left" | "right";
    isDisabled?: boolean;
  }) => {
    const targetPage = direction === "left" ? currentPage - 1 : currentPage + 1;
    const href = createPageURL(targetPage);

    const className = clsx(
      "flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200",
      {
        // Disabled state
        "pointer-events-none text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-not-allowed": isDisabled,

        // Enabled state
        "text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-300 dark:hover:border-blue-500 shadow-sm hover:shadow-md cursor-pointer": !isDisabled,

        // Spacing
        "md:mr-2": direction === "left",
        "md:ml-2": direction === "right",
      }
    );

    const icon =
      direction === "left" ? (
        <ChevronLeftIcon className="w-4 h-4" />
      ) : (
        <ChevronRightIcon className="w-4 h-4" />
      );

    if (isDisabled) {
      return (
        <motion.div
          variants={itemVariants}
          className={className}
          aria-disabled="true"
        >
          {icon}
        </motion.div>
      );
    }

    return (
      <motion.div
        variants={itemVariants}
        whileHover="hover"
        whileTap="tap"
      >
        {isControlled ? (
          <div onClick={(e) => handlePageClick(targetPage, e as any)}>
            <div className={className}>
              {icon}
            </div>
          </div>
        ) : (
          <Link
            href={href}
            className={className}
            scroll={false}
            aria-label={`Go to ${direction} page`}
          >
            {icon}
          </Link>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={clsx("flex items-center justify-center gap-1 md:gap-2 py-0", customClassName)}
    >
      {/* 🔹 FIRST PAGE BUTTON - Hidden on mobile */}
      <div className="hidden md:block">
        <PaginationEdgeButton
          label="First"
          page={1}
          disabled={currentPage === 1}
        />
      </div>

      {/* ← PREVIOUS */}
      <PaginationArrow
        direction="left"
        isDisabled={currentPage <= 1}
      />

      {/* PAGE NUMBERS */}
      <motion.div
        className="flex items-center -space-x-px"
        layout
      >
        <AnimatePresence mode="popLayout">
          {allPages.map((page, index) => {
            let position: "first" | "last" | "single" | "middle" | undefined;

            if (index === 0) position = "first";
            if (index === allPages.length - 1) position = "last";
            if (allPages.length === 1) position = "single";
            if (page === "...") position = "middle";

            return (
              <motion.div
                key={`${page}-${index}`}
                layout
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={pageNumberVariants}
                transition={{
                  type: "spring" as const,
                  stiffness: 500,
                  damping: 30
                }}
              >
                <PaginationNumber
                  page={page}
                  position={position}
                  isActive={currentPage === page}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* → NEXT */}
      <PaginationArrow
        direction="right"
        isDisabled={currentPage >= totalPages}
      />

      {/* 🔹 LAST PAGE BUTTON - Hidden on mobile */}
      <div className="hidden md:block">
        <PaginationEdgeButton
          label="Last"
          page={totalPages}
          disabled={currentPage === totalPages}
        />
      </div>
    </motion.div>
  );
}