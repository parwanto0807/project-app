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
import DocumentForm from "@/components/master/documents/DocumentForm";
import { PageLoading } from "@/components/ui/loading";
import { useSession } from "@/components/clientSessionProvider";

export default function CreateDocumentPageAdmin() {
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
        <AdminLayout title="Buat Dokumen Baru" role="admin">
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
                            <BreadcrumbLink asChild>
                                <Link href="/admin-area/master/documents" className="text-sm font-medium hover:text-primary transition-colors">
                                    JobDesk & SOP
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="text-sm font-semibold">Buat Baru</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Buat Dokumen Baru</h2>
                <p className="text-muted-foreground mt-1">
                    Lengkapi detail formulir untuk membuat Job Description atau SOP baru
                </p>
            </div>

            <div className="bg-card rounded-lg border shadow-sm p-6">
                <DocumentForm role="admin" />
            </div>
        </AdminLayout>
    );
}
