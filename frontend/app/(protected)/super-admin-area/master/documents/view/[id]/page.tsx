"use client";

import React from "react";
import { use } from "react";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import DocumentView from "@/components/master/documents/DocumentView";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

export default function ViewDocumentPageSuper({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    return (
        <AdminLayout title="Lihat Dokumen (Super Admin)" role="super">
            <div className="mb-6 no-print">
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
                            <BreadcrumbPage className="text-sm font-semibold">Detail Dokumen</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <DocumentView id={id} />
        </AdminLayout>
    );
}
