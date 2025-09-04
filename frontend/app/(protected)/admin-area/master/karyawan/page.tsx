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
    const router = useRouter();
    const userRole = "admin"; 

    useEffect(() => {
        if (userRole !== "admin") {
            router.push("/unauthorized");
            return;
        }

        const fetchData = async () => {
            if (typeof window === "undefined") return;
            const token = localStorage.getItem("accessToken") || undefined;

            const result = await fetchAllKaryawan(token);
            setKaryawan(result.karyawan);
            setIsLoading(result.isLoading);
        };

        fetchData();
    }, [router, userRole, setKaryawan]);

    const layoutProps: LayoutProps = {
        title: "Employee Management",
        role: "admin",
        children: (
            <>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Badge variant="outline">
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
                            <Badge variant="outline">
                                <BreadcrumbPage>Employee List</BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="h-full w-full">
                    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
                        <EmployeeTable karyawan={karyawan} isLoading={isLoading} role={userRole} />
                    </div>
                </div>
            </>
        ),
    };

    return <AdminLayout {...layoutProps} />;
}
