// app/(protected)/admin-area/master/supplier/page.tsx
import { redirect } from "next/navigation";
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
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { fetchSuppliers } from "@/lib/action/supplier/supplierAction";
import { SupplierListResponse } from "@/types/supplierType";
import SupplierClientWrapper from "@/components/supplier/component/supplier-wrapper";

interface SearchParams {
    page?: string;
    limit?: string;
    search?: string;
    activeOnly?: string;
}

interface SupplierPageProps {
    searchParams?: SearchParams;
}

function parseNumber(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
}

export default async function SupplierPageAdmin({ searchParams }: SupplierPageProps) {
    // Role check → Could be replaced with real auth middleware
    const userRole = "admin";
    if (userRole !== "admin") redirect("/unauthorized");

    const resolved = await searchParams || {};

    const page = parseNumber(resolved.page, 1);
    const limit = parseNumber(resolved.limit, 10);
    const search = resolved.search || "";
    const activeOnly = resolved.activeOnly ?? "true";

    let initialData: SupplierListResponse | null = null;

    try {
        const response = await fetchSuppliers({
            page,
            limit,
            search,
            activeOnly,
            includePagination: "true",
        });

        if (!response) throw new Error("Failed to fetch suppliers");
        initialData = response;
    } catch (err) {
        console.error("❌ Error loading supplier data:", err);
    }

    return (
        <AdminLayout title="Supplier Management" role="admin">

            {/* Breadcrumb */}
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
                                Master Data
                            </Badge>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <Badge variant="outline">
                            <BreadcrumbPage>Supplier</BreadcrumbPage>
                        </Badge>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Wrapper Client Component */}
            <div className="h-full w-full">
                <div className="flex-1 space-y-2 p-2 pt-1 md:p-4">
                    <SupplierClientWrapper initialData={initialData} />
                </div>
            </div>

        </AdminLayout>
    );
}
