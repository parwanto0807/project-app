"use client";

import React from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StatusFilterDropdownProps {
    statusFilter: string;
    setStatusFilter: (status: string) => void;
    statusConfig: Record<string, { label: string; className: string; variant?: string }>;
    disabled?: boolean;
}

export default function StatusFilterDropdown({
    statusFilter,
    setStatusFilter,
    statusConfig,
    disabled = false,
}: StatusFilterDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2"
                    disabled={disabled}
                >
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">Status</span>
                    {statusFilter !== "ALL" && (
                        <Badge
                            variant="secondary"
                            className="ml-1 rounded-sm px-1 font-normal"
                        >
                            {statusConfig[statusFilter]?.label || statusFilter}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setStatusFilter("ALL")}>
                    <span className={statusFilter === "ALL" ? "font-semibold" : ""}>
                        All Statuses
                    </span>
                </DropdownMenuItem>
                {Object.entries(statusConfig).map(([status, config]) => (
                    <DropdownMenuItem
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className="flex items-center justify-between"
                    >
                        <span className={statusFilter === status ? "font-semibold" : ""}>
                            {config.label}
                        </span>
                        <Badge
                            variant={config.variant as "default" | "secondary" | "destructive" | "outline" | undefined}
                            className="ml-2 h-5 w-5 rounded-full p-0"
                        >
                            {""}
                        </Badge>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}