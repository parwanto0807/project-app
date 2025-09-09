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
import { fetchAllKaryawan } from "@/lib/action/master/karyawan";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import { EmployeeTable } from "@/components/master/karyawan/tableData";
import { TableLoading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function KaryawanPageAdmin() {
    const [karyawan, setKaryawan] = useState([]);
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

                const result = await fetchAllKaryawan();

                if (result.karyawan) {
                    setKaryawan(result.karyawan || []);
                } else {
                    setError(result.karyawan || "Gagal memuat data karyawan");
                }
            } catch (err) {
                setError("Terjadi kesalahan saat memuat data");
                console.error("Error fetching karyawan:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router, userRole]);

    const layoutProps: LayoutProps = {
        title: "Employee Management",
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
                                <BreadcrumbPage>Employee List</BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="h-full w-full">
                    <div className="flex-1 space-y-4 p-2 pt-6 md:p-8">
                        {/* Header dengan statistik loading */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">Data Karyawan</h2>
                                <p className="text-muted-foreground">
                                    {isLoading ? "Memuat daftar karyawan..." : `Total ${karyawan.length} karyawan`}
                                </p>
                            </div>
                            {!isLoading && !error && (
                                <Badge variant="outline" className="text-sm px-3 py-1">
                                    {karyawan.length} Records
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
                            ) : karyawan.length === 0 ? (
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
                                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-center text-muted-foreground text-lg font-medium">
                                        Data karyawan tidak ditemukan
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Tidak ada data karyawan yang tersedia saat ini.
                                    </p>
                                    <Link href="/admin-area/master/karyawan/create" className="group">
                                        <Button
                                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-4 md:px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 w-full md:w-auto"
                                            aria-label="Tambah Karyawan Baru"
                                        >
                                            <Plus size={18} className="transition-transform duration-300 group-hover:rotate-90" />
                                            <span className="hidden md:inline">Tambah Karyawan</span>
                                            <span className="md:hidden">Tambah</span>
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <EmployeeTable karyawan={karyawan} role={userRole} isLoading={isLoading} />
                            )}
                        </div>
                    </div>
                </div>
            </>
        ),
    };

    return <AdminLayout {...layoutProps} />;
}