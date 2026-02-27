"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
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
import Link from "next/link";
import axios from "axios";

export default function EditDocumentPageSuper({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user, isLoading: sessionLoading } = useSession();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [initialData, setInitialData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!sessionLoading) {
            if (!user) {
                router.push("/auth/login");
            } else {
                const userRole = user.role as "admin" | "super";
                if (userRole !== "super") {
                    router.push("/not-authorized");
                } else {
                    setAuthorized(true);
                }
            }
        }
    }, [user, sessionLoading, router]);

    useEffect(() => {
        if (authorized) {
            const fetchDocument = async () => {
                try {
                    const response = await axios.get(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/master/documents/${id}`,
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
                    console.error("Gagal mengambil data dokumen:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchDocument();
        }
    }, [authorized, id]);

    if (sessionLoading || isLoading || !authorized) {
        return <PageLoading />;
    }

    return (
        <AdminLayout title="Edit Dokumen (Super Admin)" role="super">
            <div className="mb-6">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/super-admin-area" className="text-sm font-medium hover:text-primary transition-colors">
                                    Dashboard
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/super-admin-area/master/documents" className="text-sm font-medium hover:text-primary transition-colors">
                                    JobDesk & SOP
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="text-sm font-semibold">Edit Dokumen</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="bg-card rounded-lg border shadow-sm p-6">
                <DocumentForm role="super" initialData={initialData} />
            </div>
        </AdminLayout>
    );
}
