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
import { useEffect, useState } from "react";
import { use } from "react"; // Import use dari React
import { AdminLoading } from "@/components/admin-loading";
import { fetchAllProductsByType } from "@/lib/action/master/product";
import { fetchAllProjects } from "@/lib/action/master/project";
import { useUpdateRAB } from "@/hooks/use-rab";
import { RABUpdateForm } from "@/components/rab/updateFormData";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRAB } from "@/hooks/use-rab";
import { RABUpdateInput } from "@/types/rab";

interface Product {
    id: string;
    name: string;
    sku?: string;
    price?: number;
    unit?: string;
}

interface Project {
    id: string;
    name: string;
    customer?: {
        name: string;
    };
}

interface RABUpdatePageAdminProps {
    params: Promise<{ // Ubah menjadi Promise
        id: string;
    }>;
}

export default function RABUpdatePageAdmin({ params }: RABUpdatePageAdminProps) {
    const router = useRouter();
    // Unwrap params dengan React.use()
    const unwrappedParams = use(params);
    const { id } = unwrappedParams;

    const { mutate: updateRAB, isPending: isUpdating } = useUpdateRAB();

    // Fetch RAB data untuk update
    const {
        data: rabData,
        isLoading: isLoadingRAB,
        error: rabError
    } = useRAB(id, {
        enabled: !!id && id !== "create"
    });

    // State untuk data master
    const [projects, setProjects] = useState<Project[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingMaster, setIsLoadingMaster] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, loading: userLoading } = useCurrentUser();

    // Role auth dummy
    const userRole = "admin";

    const isCreateMode = id === "create";

    // Di page.tsx - bagian fetchMasterData
    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                setIsLoadingMaster(true);
                setError(null);

                const [projectsResponse, productsResponse] = await Promise.all([
                    fetchAllProjects(),
                    fetchAllProductsByType(undefined, "ALL")
                ]);

                // Cek success flag dari response
                if (!projectsResponse.success) {
                    throw new Error(projectsResponse.message || "Failed to load projects");
                }

                if (!productsResponse.success) {
                    throw new Error(productsResponse.message || "Failed to load products");
                }

                setProjects(projectsResponse.data || []);
                setProducts(productsResponse.data || []);

            } catch (err) {
                console.error("Error fetching master data:", err);
                setError(err instanceof Error ? err.message : "Failed to load master data");
            } finally {
                setIsLoadingMaster(false);
            }
        };

        fetchMasterData();
    }, []);

    // Redirect jika bukan admin atau belum login
    useEffect(() => {
        if (userLoading) return;
        if (!user) {
            router.replace("/auth/login");
            return;
        }
        if (userRole !== "admin") {
            router.push("/unauthorized");
        }
    }, [userRole, router, userLoading, user]);

    // Handle form submission untuk update
    const handleUpdateSubmit = async (formData: RABUpdateInput) => {
        try {
            // Untuk update, pastikan ID termasuk dalam data
            const updateData: RABUpdateInput = {
                ...formData,
                id: id
            };

            await updateRAB(updateData, {
                onSuccess: () => {
                    router.push("/admin-area/logistic/rab");
                },
                onError: (error: unknown) => {
                    const errorMessage = error instanceof Error ? error.message : "Failed to update RAB";
                    setError(errorMessage);
                    console.error("Error updating RAB:", error);
                }
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
            setError(errorMessage);
            console.error("Error in handleUpdateSubmit:", error);
        }
    };

    // Handle loading state
    if (userLoading || isLoadingMaster || (!isCreateMode && isLoadingRAB)) {
        return <AdminLoading message={isCreateMode ? "Loading master data..." : "Loading RAB data..."} />;
    }

    // Handle error state untuk RAB data
    if (!isCreateMode && rabError) {
        return (
            <AdminLayout
                title="Error"
                role="admin"
            >
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading RAB</h2>
                        <p className="text-gray-600 mb-4">
                            {rabError instanceof Error ? rabError.message : "Failed to load RAB data"}
                        </p>
                        <button
                            onClick={() => router.push("/admin-area/logistic/rab")}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Back to RAB List
                        </button>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    // Handle unauthorized access
    if (!user || userRole !== "admin") {
        return (
            <AdminLayout title="Unauthorized" role="admin">
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-red-600 mb-2">Unauthorized Access</h2>
                        <p className="text-gray-600 mb-4">You dont have permission to access this page.</p>
                        <button
                            onClick={() => router.push("/admin-area")}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const pageTitle = isCreateMode ? "Create RAB" : "Update RAB";
    const breadcrumbPage = isCreateMode ? "Create RAB" : `Update RAB - ${rabData?.data?.name || id}`;

    const layoutProps: LayoutProps = {
        title: pageTitle,
        role: "admin",
        children: (
            <>
                <div className="flex justify-between items-center mb-4">
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
                                        <Link href="/admin-area/logistic/rab">RAB List</Link>
                                    </Badge>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <Badge variant="outline">
                                    <BreadcrumbPage>{breadcrumbPage}</BreadcrumbPage>
                                </Badge>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <div className="h-full w-full">
                    <div className="flex-1 space-y-4 p-2 pt-1 md:p-4">
                        <RABUpdateForm
                            rabData={rabData}
                            projects={projects}
                            products={products}
                            onSubmit={handleUpdateSubmit}
                            isSubmitting={isUpdating}
                            user={user}
                            error={error}
                        />
                    </div>
                </div>
            </>
        ),
    };

    return <AdminLayout {...layoutProps} />;
}