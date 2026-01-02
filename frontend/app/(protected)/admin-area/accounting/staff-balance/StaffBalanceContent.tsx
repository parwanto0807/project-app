"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TabelStaffBalance } from "@/components/staffBalance/TabelStaffBalance";
import { StaffBalance, LedgerCategory, getCategoryLabel } from "@/types/staffBalance";
import { Search, Filter, RefreshCw, Plus } from "lucide-react";
import PaginationNew from "@/components/ui/paginationNew";
import { CreateOpeningBalanceGlobalDialog } from "@/components/staffBalance/CreateOpeningBalanceGlobalDialog";

interface StaffBalanceContentProps {
    initialData: StaffBalance[];
    initialPagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    initialSearch: string;
    initialCategory: string;
}

export function StaffBalanceContent({
    initialData,
    initialPagination,
    initialSearch,
    initialCategory,
}: StaffBalanceContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [openingBalanceDialogOpen, setOpeningBalanceDialogOpen] = useState(false);

    const [search, setSearch] = useState(initialSearch);
    const [category, setCategory] = useState(initialCategory);

    const handleSearch = () => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (search) {
                params.set("search", search);
            } else {
                params.delete("search");
            }
            params.set("page", "1"); // Reset to first page
            router.push(`?${params.toString()}`);
        });
    };

    const handleCategoryChange = (value: string) => {
        setCategory(value);
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (value && value !== "ALL") {
                params.set("category", value);
            } else {
                params.delete("category");
            }
            params.set("page", "1"); // Reset to first page
            router.push(`?${params.toString()}`);
        });
    };

    const handleReset = () => {
        setSearch("");
        setCategory("");
        startTransition(() => {
            router.push("/admin-area/accounting/staff-balance");
        });
    };

    const handlePageChange = (page: number) => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("page", page.toString());
            router.push(`?${params.toString()}`);
        });
    };

    const handleDialogSuccess = () => {
        router.refresh(); // Refresh data after creating opening balance
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filter & Pencarian
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari nama karyawan..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                handleSearch();
                                            }
                                        }}
                                        className="pl-10"
                                    />
                                </div>
                                <Button onClick={handleSearch} disabled={isPending}>
                                    Cari
                                </Button>
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="w-full md:w-64">
                            <Select value={category} onValueChange={handleCategoryChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Semua Kategori</SelectItem>
                                    <SelectItem value={LedgerCategory.OPERASIONAL_PROYEK}>
                                        {getCategoryLabel(LedgerCategory.OPERASIONAL_PROYEK)}
                                    </SelectItem>
                                    <SelectItem value={LedgerCategory.PINJAMAN_PRIBADI}>
                                        {getCategoryLabel(LedgerCategory.PINJAMAN_PRIBADI)}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Reset Button */}
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            disabled={isPending}
                            className="gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                            Daftar Staff Balance
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                                ({initialPagination.total} total)
                            </span>
                        </CardTitle>
                        <Button
                            onClick={() => setOpeningBalanceDialogOpen(true)}
                            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Plus className="h-4 w-4" />
                            Buat Saldo Awal
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <TabelStaffBalance data={initialData} isLoading={isPending} />

                    {/* Pagination */}
                    {initialPagination.totalPages > 1 && (
                        <div className="mt-4">
                            <PaginationNew
                                currentPage={initialPagination.page}
                                totalPages={initialPagination.totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Opening Balance Dialog */}
            <CreateOpeningBalanceGlobalDialog
                open={openingBalanceDialogOpen}
                onOpenChange={setOpeningBalanceDialogOpen}
                onSuccess={handleDialogSuccess}
            />
        </div>
    );
}
