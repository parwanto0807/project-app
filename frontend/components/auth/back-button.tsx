"use client";

import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react"; // Optional icon import

interface BackButtonProps {
  href: string;
  label: string;
  className?: string;
  showIcon?: boolean;
  variant?: "link" | "ghost" | "outline";
}

export const BackButton = ({
  href,
  label,
  className = "",
  showIcon = false,
  variant = "link",
}: BackButtonProps) => {
  return (
    <Button
      variant={variant}
      className={`font-normal text-muted-foreground hover:text-primary transition-colors ${className}`}
      size="sm"
      asChild
    >
      <Link href={href} className="flex items-center gap-1">
        {showIcon && <ArrowLeft className="h-4 w-4" />}
        <span>{label}</span>
      </Link>
    </Button>
  );
};