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
                    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
                        {error && (
                            <div className="text-red-500 p-4 bg-red-50 rounded">
                                {error}
                            </div>
                        )}
                        <EmployeeTable karyawan={karyawan} role={userRole} isLoading={isLoading} />
                    </div>
                </div>
            </>
        ),
    };

    return <AdminLayout {...layoutProps} />;
}