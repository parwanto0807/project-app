"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { getAllTeam } from "@/lib/action/master/team/getAllTeam";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import TeamTableData from "@/components/master/team/tableData";
import { TableLoading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { CardTitle } from "@/components/ui/card";

export default function TeamPageAdmin() {
    const [teams, setTeams] = useState([]); // ✅ Ganti state ke teams
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const userRole = "admin";

    useEffect(() => {
        if (userRole !== "admin") {
            router.push("/unauthorized");
            return;
        }

        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                if (typeof window === "undefined") return;

                const result = await getAllTeam(); // ✅ Panggil fungsi Team

                if (result.success) { // ✅ Sesuaikan dengan struktur respons Anda
                    setTeams(result.data || []); // ✅ Sesuaikan properti data
                } else {
                    setError(result.error || "Gagal memuat data team");
                }
            } catch (err) {
                setError("Terjadi kesalahan saat memuat data");
                console.error("Error fetching teams:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router, userRole]);

    const layoutProps: LayoutProps = {
        title: "Team Management",
        role: "admin",
        children: (
            <>
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

                <div className="h-full w-full">
                    <div className="flex-1 space-y-4 p-2 pt-6 md:p-8">
                        {/* Header dengan statistik loading */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <div className="flex items-center mb-2 md:mb-0">
                                    <Users className="mr-2 h-6 w-6" />
                                    <CardTitle className="text-2xl">Manajemen Team</CardTitle>
                                </div>
                                <p className="text-muted-foreground">
                                    {isLoading ? "Memuat daftar team..." : `Total ${teams.length} team`}
                                </p>
                            </div>
                            {!isLoading && !error && (
                                <Badge variant="outline" className="text-sm px-3 py-1">
                                    {teams.length} Records
                                </Badge>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className="rounded-lg border bg-card p-2 shadow-sm">
                            {isLoading ? (
                                <TableLoading rowCount={8} colCount={5} />
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <div className="bg-destructive/10 p-4 rounded-full">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-10 w-10 text-destructive"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-center text-destructive text-lg font-medium">
                                        {error}
                                    </p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                                    >
                                        Coba Lagi
                                    </button>
                                </div>
                            ) : teams.length === 0 ? ( // ✅ Ganti kondisi ke teams
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <div className="bg-muted p-4 rounded-full">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-10 w-10 text-muted-foreground"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-center text-muted-foreground text-lg font-medium">
                                        Data team tidak ditemukan
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Tidak ada data team yang tersedia saat ini.
                                    </p>
                                    <Link href="/admin-area/master/team/create" className="group"> {/* ✅ Ganti route */}
                                        <Button
                                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-4 md:px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 w-full md:w-auto"
                                            aria-label="Tambah Team Baru"
                                        >
                                            <Plus size={18} className="transition-transform duration-300 group-hover:rotate-90" />
                                            <span className="hidden md:inline">Tambah Team</span> {/* ✅ Ganti teks */}
                                            <span className="md:hidden">Tambah</span>
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <TeamTableData teams={teams} role={userRole} isLoading={isLoading} /> // ✅ Ganti ke komponen Team
                            )}
                        </div>
                    </div>
                </div>
            </>
        ),
    };

    return <AdminLayout {...layoutProps} />;
}