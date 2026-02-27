"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import DocumentList from "@/components/master/documents/DocumentList";
import { PageLoading } from "@/components/ui/loading";
import { useSession } from "@/components/clientSessionProvider";

export default function DocumentsPageAdmin() {
    const { user, isLoading } = useSession();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/auth/login");
            } else {
                const userRole = user.role as "admin" | "super";
                if (userRole !== "admin" && userRole !== "super") {
                    router.push("/not-authorized");
                } else {
                    setAuthorized(true);
                }
            }
        }
    }, [user, isLoading, router]);

    if (isLoading || !authorized) {
        return <PageLoading />;
    }

    return (
        <AdminLayout title="JobDesk & SOP" role="admin">
            <div className="mb-6">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/admin-area" className="text-sm font-medium hover:text-primary transition-colors">
                                    Dashboard
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="text-sm font-semibold">JobDesk & SOP</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Daftar JobDesk & SOP</h2>
                <p className="text-muted-foreground mt-1">
                    Kelola dokumen deskripsi pekerjaan dan standar operasional prosedur perusahaan
                </p>
            </div>

            <DocumentList role="admin" />
        </AdminLayout>
    );
}
