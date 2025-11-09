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
import { AdminLoading } from "@/components/admin-loading";
import { fetchAllProductsByType } from "@/lib/action/master/product";
import { fetchAllProjects } from "@/lib/action/master/project";
import { useCreateRAB } from "@/hooks/use-rab";
import { RABForm } from "@/components/rab/createFormData";
import { RABCreateInput } from "@/types/rab";
import { useSession } from "@/components/clientSessionProvider";

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

export default function RABCreatePageAdmin() {
    const router = useRouter();
    const { mutate: createRAB, isPending: isCreating } = useCreateRAB();

    // State untuk data master
    const [projects, setProjects] = useState<Project[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingMaster, setIsLoadingMaster] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, isLoading: userLoading } = useSession();

    // Role auth dummy
    const userRole = "admin";

    // Di page.tsx - bagian fetchMasterData
    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                setIsLoadingMaster(true);
                setError(null);

                console.log("Fetching projects and products...");

                const [projectsResponse, productsResponse] = await Promise.all([
                    fetchAllProjects(),
                    fetchAllProductsByType(undefined, "ALL") // atau "PRODUCT", "SERVICE" sesuai kebutuhan
                ]);

                console.log("Projects response:", projectsResponse);
                console.log("Products response:", productsResponse);

                // Cek success flag dari response
                if (!projectsResponse.success) {
                    throw new Error(projectsResponse.message || "Failed to load projects");
                }

                if (!productsResponse.success) {
                    throw new Error(productsResponse.message || "Failed to load products");
                }

                setProjects(projectsResponse.data || []);
                setProducts(productsResponse.data || []);

                console.log("Projects loaded:", projectsResponse.data?.length);
                console.log("Products loaded:", productsResponse.data?.length);

            } catch (err) {
                console.error("Error fetching master data:", err);
                setError(err instanceof Error ? err.message : "Failed to load master data");
            } finally {
                setIsLoadingMaster(false);
            }
        };

        fetchMasterData();
    }, []);

    // Redirect jika bukan admin
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

    // Handle form submission
    const handleSubmit = async (formData: RABCreateInput) => {
        try {
            await createRAB(formData, {
                onSuccess: () => {
                    router.push("/admin-area/logistic/rab");
                },
                onError: (error) => {
                    setError(error.message || "Failed to create RAB");
                }
            });
        } catch (error) {
            setError("An unexpected error occurred");
            console.error("Error creating RAB:", error);
        }
    };

    // Handle loading state
    if (isLoadingMaster) {
        return <AdminLoading message="Loading master data..." />;
    }

    const layoutProps: LayoutProps = {
        title: "Create RAB",
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
                                    <BreadcrumbPage>Create RAB</BreadcrumbPage>
                                </Badge>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <div className="h-full w-full">
                    <div className="flex-1 space-y-4 p-2 pt-1 md:p-4">
                        <RABForm
                            projects={projects}
                            products={products}
                            onSubmit={handleSubmit}
                            isSubmitting={isCreating}
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