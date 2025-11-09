"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import { CreateCoaForm } from "@/components/master/coa/cretaeFormData";
import { useCreateCOA, useCOAs } from "@/hooks/use-coa";
import { useEffect } from "react";
import { AdminLoading } from "@/components/admin-loading";
import { CoaFormData } from "@/schemas/coa";
import { useSession } from "@/components/clientSessionProvider";

export default function CreateCOAPageAdmin() {
    const { mutate: createCOA, isPending } = useCreateCOA();
    const router = useRouter();
    const { user, isLoading } = useSession();

    // Redirect jika bukan admin
    useEffect(() => {
        if (isLoading) return;
        if (user?.role !== "admin") {
            router.push("/unauthorized");
            return;
        }
    }, [user, router, isLoading]);

    const {
        data: coasResponse,
    } = useCOAs();

    const handleSubmit = (formData: CoaFormData) => {
        createCOA(formData, {
            onSuccess: () => {
                // Redirect ke halaman COA setelah berhasil create
                router.push("/admin-area/master/coa");
            }
        });
    };

    const handleCancel = () => {
        router.push("/admin-area/master/coa");
    };

    if (isLoading) {
        return <AdminLoading message="Loading Chart of Accounts data..." />;
    }
    const parentAccounts = coasResponse?.data || [];

    const layoutProps: LayoutProps = {
        title: "Create Chart of Account",
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
                                    Accounting Master
                                </Badge>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Badge variant="outline">
                                    <Link href="/admin-area/master/coa">Chart of Accounts</Link>
                                </Badge>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <Badge variant="outline">
                                <BreadcrumbPage>Create New</BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="h-full w-full">
                    <div className="flex-1 space-y-2 p-2 pt-1 md:p-4">
                        {/* ✅ Komponen form untuk create COA */}
                        <CreateCoaForm
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            isLoading={isPending}
                            role={user}
                            parentAccounts={parentAccounts}
                        />
                    </div>
                </div>
            </>
        ),
    };

    return <AdminLayout {...layoutProps} />;
}