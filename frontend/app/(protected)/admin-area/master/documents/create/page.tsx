"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, Suspense } from "react";
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
import axios from "axios";

function CreateDocumentFormWrapper({ role, authorized }: { role: string; authorized: boolean }) {
    const searchParams = useSearchParams();
    const copyFrom = searchParams.get("copyFrom");
    const [initialData, setInitialData] = useState<any>(null);
    const [isFetchingCopy, setIsFetchingCopy] = useState(false);

    useEffect(() => {
        if (authorized && copyFrom) {
            const fetchDocumentToCopy = async () => {
                setIsFetchingCopy(true);
                try {
                    const response = await axios.get(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/master/documents/${copyFrom}`,
                        { withCredentials: true }
                    );

                    const doc = response.data;
                    const transformedData = {
                        ...doc,
                        departments: doc.departments.map((d: any) => ({
                            code: d.department.code,
                            isPrimary: d.isPrimary,
                        })),
                        sections: doc.sections.map((s: any) => ({
                            ...s,
                            items: s.items.map((item: any) => ({
                                ...item,
                            }))
                        }))
                    };

                    setInitialData(transformedData);
                } catch (error) {
                    console.error("Gagal mengambil data dokumen untuk disalin:", error);
                } finally {
                    setIsFetchingCopy(false);
                }
            };
            fetchDocumentToCopy();
        }
    }, [authorized, copyFrom]);

    if (isFetchingCopy) {
        return <PageLoading />;
    }

    return <DocumentForm role={role} initialData={initialData} isCopy={!!copyFrom} />;
}

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
                <Suspense fallback={<PageLoading />}>
                    <CreateDocumentFormWrapper role="admin" authorized={authorized} />
                </Suspense>
            </div>
        </AdminLayout>
    );
}
