"use client";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { generatePagination } from "@/lib/utils";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Ganti nama komponen untuk menghindari konflik
export default function PaginationComponent({ totalPages }: { totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const page = Number(searchParams.get("page")) || 1;
    setCurrentPage(page);
  }, [searchParams]);

  if (totalPages <= 1) return null;

  const createPageURL = (pageNumber: string | number) => {
    const params = new URLSearchParams(searchParams);

    // Pastikan pageSize tetap dikirim
    const pageSize = searchParams.get("pageSize") || "10";
    params.set("pageSize", pageSize);

    // Set page baru
    params.set("page", pageNumber.toString());

    return `${pathname}?${params.toString()}`;
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
    href,
    disabled,
  }: {
    label: string;
    href: string;
    disabled: boolean;
  }) => (
    disabled ? (
      <motion.div
        variants={itemVariants}
        className="flex h-8 px-3 items-center justify-center rounded-lg 
                   border border-gray-200 dark:border-gray-700 
                   bg-gray-100 dark:bg-gray-800 
                   text-gray-400 dark:text-gray-500 
                   text-xs font-medium cursor-not-allowed"
      >
        {label}
      </motion.div>
    ) : (
      <motion.div
        variants={itemVariants}
        whileHover="hover"
        whileTap="tap"
      >
        <Link
          href={href}
          className="flex h-8 px-3 items-center justify-center rounded-lg 
                     border border-gray-300 dark:border-gray-600
                     text-gray-700 dark:text-gray-300 
                     bg-white dark:bg-gray-800
                     hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 
                     dark:hover:from-blue-900/20 dark:hover:to-purple-900/20
                     hover:border-blue-300 dark:hover:border-blue-500
                     hover:text-blue-700 dark:hover:text-blue-300
                     text-xs font-medium shadow-sm hover:shadow-md
                     transition-all duration-200"
          scroll={false}
        >
          {label}
        </Link>
      </motion.div>
    )
  );

  // 🔹 PAGE NUMBER
  const PaginationNumber = ({
    page,
    href,
    position,
    isActive
  }: {
    page: number | string;
    href: string;
    position?: "first" | "last" | "single" | "middle";
    isActive: boolean;
  }) => {
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
        "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-300 dark:hover:border-blue-500": !isActive && position !== "middle",

        // Ellipsis state
        "text-gray-400 dark:text-gray-500 cursor-default bg-transparent border-none": position === "middle",

        // Border adjustments
        "border-l-0": position === "last" || position === "middle",
        "border-r-0": position === "first" || position === "middle",
      }
    );

    return position === "middle" ? (
      <motion.div
        variants={itemVariants}
        className={className}
      >
        {page}
      </motion.div>
    ) : (
      <motion.div
        variants={itemVariants}
        whileHover={!isActive ? "hover" : undefined}
        whileTap="tap"
      >
        <Link
          href={href}
          className={className}
          scroll={false}
          aria-current={isActive ? "page" : undefined}
        >
          {page}
        </Link>
      </motion.div>
    );
  };

  // 🔹 NEXT / PREV BUTTON
  const PaginationArrow = ({
    href,
    direction,
    isDisabled,
  }: {
    href: string;
    direction: "left" | "right";
    isDisabled?: boolean;
  }) => {
    const className = clsx(
      "flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200",
      {
        // Disabled state
        "pointer-events-none text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-not-allowed": isDisabled,

        // Enabled state
        "text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-300 dark:hover:border-blue-500 shadow-sm hover:shadow-md": !isDisabled,

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

    return isDisabled ? (
      <motion.div
        variants={itemVariants}
        className={className}
        aria-disabled="true"
      >
        {icon}
      </motion.div>
    ) : (
      <motion.div
        variants={itemVariants}
        whileHover="hover"
        whileTap="tap"
      >
        <Link
          href={href}
          className={className}
          scroll={false}
          aria-label={`Go to ${direction} page`}
        >
          {icon}
        </Link>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex items-center justify-center gap-1 md:gap-2 py-0"
    >
      {/* 🔹 FIRST PAGE BUTTON - Hidden on mobile */}
      <div className="hidden md:block">
        <PaginationEdgeButton
          label="First"
          href={createPageURL(1)}
          disabled={currentPage === 1}
        />
      </div>

      {/* ← PREVIOUS */}
      <PaginationArrow
        direction="left"
        href={createPageURL(currentPage - 1)}
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
                  href={createPageURL(page)}
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
        href={createPageURL(currentPage + 1)}
        isDisabled={currentPage >= totalPages}
      />

      {/* 🔹 LAST PAGE BUTTON - Hidden on mobile */}
      <div className="hidden md:block">
        <PaginationEdgeButton
          label="Last"
          href={createPageURL(totalPages)}
          disabled={currentPage === totalPages}
        />
      </div>
    </motion.div>
  );
}