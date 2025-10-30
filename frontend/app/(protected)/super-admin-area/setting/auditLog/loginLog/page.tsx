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
import { SuperLayout } from "@/components/admin-panel/super-layout";
import { LayoutProps } from "@/types/layout";
import { getAllSessions } from "@/lib/action/session/session";
import SessionListTable from "@/components/session/tableData"; // kamu buat nanti

export default function SessionPage() {
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const userRole = "super"; // nanti ambil dari auth context

    useEffect(() => {
        if (userRole !== "super") {
            router.push("/unauthorized");
            return;
        }

        const fetchData = async () => {
            if (typeof window === "undefined") return;

            try {
                const result = await getAllSessions();
                setSessions(result || []); // ✅ FIX
            } catch (err) {
                console.error("Failed to fetch sessions:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router, userRole]);


    const layoutProps: LayoutProps = {
        title: "Session Management",
        role: "super",
        children: (
            <>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Badge variant="outline">
                                    <Link href="/super-admin-area">Dashboard</Link>
                                </Badge>
                            </BreadcrumbLink>
                        </BreadcrumbItem>

                        <BreadcrumbSeparator />

                        <BreadcrumbItem>
                            <Badge variant="outline">
                                <BreadcrumbPage>Security</BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>

                        <BreadcrumbSeparator />

                        <BreadcrumbItem>
                            <Badge variant="outline">
                                <BreadcrumbPage>Session Management</BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="h-full w-full">
                    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
                        <SessionListTable sessions={sessions} isLoading={isLoading} />
                    </div>
                </div>
            </>
        ),
    };

    return <SuperLayout {...layoutProps} />;
}
