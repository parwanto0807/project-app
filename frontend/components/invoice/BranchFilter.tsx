"use client";

import { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { fetchAllCustomers } from "@/lib/action/master/customer";

interface BranchFilterProps {
    branchFilter: string;
    onBranchFilterChange: (value: string) => void;
    className?: string;
}

export function BranchFilter({
    branchFilter,
    onBranchFilterChange,
    className = "",
}: BranchFilterProps) {
    const [branches, setBranches] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function loadBranches() {
            setIsLoading(true);
            const res = await fetchAllCustomers();
            if (res && res.customers) {
                const uniqueBranches = Array.from(
                    new Set(
                        res.customers
                            .map((c: any) => c.branch)
                            .filter((b: any) => b && b.trim() !== "")
                    )
                ) as string[];
                setBranches(uniqueBranches.sort());
            }
            setIsLoading(false);
        }
        loadBranches();
    }, []);

    return (
        <Select value={branchFilter} onValueChange={onBranchFilterChange} disabled={isLoading}>
            <SelectTrigger className={`w-48 ${className}`}>
                <SelectValue placeholder={isLoading ? "Loading..." : "Filter Cabang"} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Semua Cabang</SelectItem>
                {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                        {branch}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
