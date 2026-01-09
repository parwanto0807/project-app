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
import { UpdateCoaForm } from "@/components/master/coa/updateFormData";
import { useUpdateCOA, useCOA, useCOAs } from "@/hooks/use-coa";
import { useEffect } from "react";
import { AdminLoading } from "@/components/admin-loading";
import { CoaFormData } from "@/schemas/coa";
import { CoaPostingType, CoaStatus } from "@/types/coa";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/clientSessionProvider";

interface UpdateCOAPageAdminProps {
    params: Promise<{
        id: string;
    }>;
}

export default function UpdateCOAPageAdmin({ params }: UpdateCOAPageAdminProps) {
    // Unwrap params dengan React.use()
    const { id } = use(params);

    const { mutate: updateCOA, isPending } = useUpdateCOA();
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
        data: coaResponse,
        isLoading: isCOALoading,
    } = useCOA(id);

    const {
        data: coasResponse,
        isLoading: isCOAsLoading,
    } = useCOAs({
        limit: 1000,
        postingType: CoaPostingType.HEADER,
        status: CoaStatus.ACTIVE
    });

    const handleSubmit = (formData: CoaFormData) => {
        updateCOA({
            id: id,
            data: formData
        }, {
            onSuccess: () => {
                router.push("/admin-area/master/coa");
            }
        });
    };

    const handleCancel = () => {
        router.push("/admin-area/master/coa");
    };

    if (isCOALoading || isCOAsLoading) {
        return <AdminLoading message="Loading Chart of Accounts data..." />;
    }

    // Handle case when COA data is not found
    if (!coaResponse?.data) {
        return (
            <AdminLayout
                title="Update Chart of Account"
                role="admin"
            >
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">
                            COA Not Found
                        </h2>
                        <p className="text-gray-500 mb-4">
                            The Chart of Account you&apos;re trying to edit doesn&apos;t exist or may have been deleted.
                        </p>
                        <Button
                            onClick={() => router.push("/admin-area/master/coa")}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Back to COA List
                        </Button>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const currentCOA = coaResponse.data;
    const parentAccounts = coasResponse?.data?.filter(coa => coa.id !== currentCOA.id) || [];

    const layoutProps: LayoutProps = {
        title: `Update Chart of Account - ${currentCOA.name}`,
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
                                <BreadcrumbPage>Update {currentCOA.name}</BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="h-full w-full">
                    <div className="flex-1 space-y-2 p-2 pt-1 md:p-4">
                        <UpdateCoaForm
                            coaData={currentCOA}
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