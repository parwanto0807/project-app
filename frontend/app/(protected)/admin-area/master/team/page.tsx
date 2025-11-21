"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Plus, Users } from "lucide-react";

import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";

import { getAllTeam } from "@/lib/action/master/team/getAllTeam";
import TeamTableData from "@/components/master/team/tableData";
import { TableLoading } from "@/components/ui/loading";

import Pagination from "@/components/ui/paginationNew";

// Define interfaces untuk type safety
interface Team {
    id: string;
    namaTeam: string;
    deskripsi: string;
    karyawan: Array<{
        id: string;
        karyawanId: string;
        teamId: string;
        karyawan: {
            id: string;
            namaLengkap: string;
            departemen: string;
        };
    }>;
    createdAt: string;
    updatedAt: string;
}

interface PaginationInfo {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export default function TeamPageAdmin() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    /** 🧮 Ambil parameter dari URL */
    const currentPage = Number(searchParams.get("page")) || 1;
    const searchTerm = searchParams.get("search") || "";
    const pageSize = Number(searchParams.get("limit")) || 10;

    const [teams, setTeams] = useState<Team[]>([]);
    const [filteredData, setFilteredData] = useState<Team[]>([]);
    const [currentItems, setCurrentItems] = useState<Team[]>([]);
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({
        totalCount: 0,
        totalPages: 1,
        currentPage: 1,
        pageSize: 10,
        hasNext: false,
        hasPrev: false,
    });

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const userRole = "admin";

    /** 🚀 Load Data Team */
    useEffect(() => {
        if (userRole !== "admin") {
            router.push("/unauthorized");
            return;
        }

        const fetchTeams = async () => {
            try {
                setIsLoading(true);

                // Panggil getAllTeam dengan parameter terpisah
                const result = await getAllTeam(currentPage, pageSize, searchTerm);

                if (result.success) {
                    setTeams(result.data || []);
                    setFilteredData(result.data || []);
                    setCurrentItems(result.data || []);

                    if (result.pagination) {
                        setPagination(result.pagination);
                    } else {
                        // Fallback jika pagination tidak tersedia
                        setPagination(prev => ({
                            ...prev,
                            totalCount: result.data?.length || 0,
                            currentPage: currentPage,
                            pageSize: pageSize
                        }));
                    }
                } else {
                    setError(result.error || "Gagal memuat data team.");
                }

            } catch (err) {
                console.error("Error fetching teams:", err);
                setError("Terjadi kesalahan saat memuat data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeams();
    }, [router, userRole, currentPage, pageSize, searchTerm]);

    /** 🔄 Search Handler */
    const handleSearchChange = (term: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (term) {
            params.set("search", term);
            if (searchParams.get("search") !== term) {
                params.set("page", "1"); // Reset hanya jika search berubah
            }
        }

        router.push(`${pathname}?${params.toString()}`);
    };

    /** 🔄 Items Per Page Handler */
    const handleItemsPerPageChange = (count: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("limit", count.toString());
        params.set("page", "1"); // Reset ke page 1 saat ganti items per page
        router.push(`${pathname}?${params.toString()}`);
    };

    /** 🔄 Selected Teams Handler */
    const handleSelectedTeamsChange = (teams: string[]) => {
        setSelectedTeams(teams);
    };

    /** 🔄 Delete Team Handler */
    const handleDeleteTeam = async (team: Team) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/team/deleteTeam/${team.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Refresh data setelah delete dengan parameter terpisah
                const result = await getAllTeam(currentPage, pageSize, searchTerm);

                if (result.success) {
                    setTeams(result.data || []);
                    setFilteredData(result.data || []);
                    setCurrentItems(result.data || []);

                    if (result.pagination) {
                        setPagination(result.pagination);
                    }
                }

                return Promise.resolve();
            } else {
                throw new Error("Gagal menghapus team");
            }
        } catch (error) {
            console.error("Error deleting team:", error);
            return Promise.reject(error);
        }
    };

    const layoutProps: LayoutProps = {
        title: "Team Management",
        role: "admin",
        children: (
            <>
                {/* 🔹 Breadcrumb */}
                <Breadcrumb className="mb-6">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Badge variant="outline" className="hover:bg-accent">
                                    <Link href="/admin-area">Dashboard</Link>
                                </Badge>
                            </BreadcrumbLink>
                        </BreadcrumbItem>

                        <BreadcrumbSeparator />

                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Badge variant="outline">
                                    <BreadcrumbPage>Master Data</BreadcrumbPage>
                                </Badge>
                            </BreadcrumbLink>
                        </BreadcrumbItem>

                        <BreadcrumbSeparator />

                        <BreadcrumbItem>
                            <Badge variant="secondary">
                                <BreadcrumbPage>Team List</BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* 🔹 Page Content */}
                <div className="h-full w-full">
                    <div className="flex-1 space-y-4 p-2 pt-6 md:p-8">

                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <div className="flex items-center mb-2">
                                    <Users className="mr-2 h-6 w-6" />
                                    <CardTitle className="text-2xl">Manajemen Team</CardTitle>
                                </div>
                                <p className="text-muted-foreground">
                                    {isLoading
                                        ? "Memuat daftar team..."
                                        : `Menampilkan ${currentItems.length} dari ${pagination.totalCount} team`}
                                </p>
                            </div>

                            {!isLoading && !error && (
                                <Badge variant="outline" className="text-sm px-3 py-1">
                                    {pagination.totalCount} Total Records
                                </Badge>
                            )}
                        </div>

                        {/* Content */}
                        <div className="rounded-lg border bg-card p-2 shadow-sm">

                            {/* Loading */}
                            {isLoading && <TableLoading rowCount={8} colCount={5} />}

                            {/* Error */}
                            {!isLoading && error && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Users className="h-10 w-10 text-destructive mb-4" />
                                    <p className="text-lg text-destructive font-medium">{error}</p>
                                    <Button onClick={() => window.location.reload()} className="mt-4">
                                        Coba Lagi
                                    </Button>
                                </div>
                            )}

                            {/* No Data */}
                            {!isLoading && !error && teams.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Users className="h-10 w-10 text-muted-foreground mb-4" />
                                    <p className="text-lg text-muted-foreground font-medium">
                                        Data team tidak ditemukan
                                    </p>

                                    <Link href="/admin-area/master/team/create" className="group">
                                        <Button
                                            className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700
                      hover:from-blue-700 hover:to-blue-800 text-white font-semibold 
                      py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all 
                      duration-300 transform hover:-translate-y-0.5 flex items-center gap-2"
                                        >
                                            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                                            Tambah Team
                                        </Button>
                                    </Link>
                                </div>
                            )}

                            {/* TABLE + PAGINATION */}
                            {!isLoading && !error && teams.length > 0 && (
                                <>
                                    <TeamTableData
                                        teams={teams}
                                        role={userRole}
                                        isLoading={isLoading}
                                        currentItems={currentItems}
                                        filteredData={filteredData}
                                        searchTerm={searchTerm}
                                        onSearchChange={handleSearchChange}
                                        itemsPerPage={pageSize}
                                        onItemsPerPageChange={handleItemsPerPageChange}
                                        selectedTeams={selectedTeams}
                                        onSelectedTeamsChange={handleSelectedTeamsChange}
                                        onDeleteTeam={handleDeleteTeam}
                                        currentPage={currentPage}
                                    />

                                    {/* Pagination - Hanya tampilkan jika totalPages > 1 */}
                                    {pagination.totalPages > 1 && (
                                        <div className="flex justify-center mt-2">
                                            <Pagination totalPages={pagination.totalPages} />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </>
        ),
    };

    return <AdminLayout {...layoutProps} />;
}