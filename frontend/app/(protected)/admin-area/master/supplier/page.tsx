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

// 1. Definisikan tipe SearchParams dengan lebih fleksibel untuk Next.js
interface SearchParams {
    page?: string;
    limit?: string;
    search?: string;
    activeOnly?: string;
    [key: string]: string | string[] | undefined; // Tambahkan index signature
}

// 2. Props halaman sekarang menerima Promise
interface SupplierPageProps {
    searchParams: Promise<SearchParams>;
}

function parseNumber(value: string | string[] | undefined, defaultValue: number): number {
    if (!value || Array.isArray(value)) return defaultValue;
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
}

// 3. Ubah signature fungsi komponen
export default async function SupplierPageAdmin(props: SupplierPageProps) {
    // 4. Await searchParams sebelum mengakses propertinya
    const searchParams = await props.searchParams;

    // Role check → Could be replaced with real auth middleware
    const userRole = "admin";
    if (userRole !== "admin") redirect("/unauthorized");

    // 5. Gunakan searchParams yang sudah di-await
    const page = parseNumber(searchParams.page, 1);
    const limit = parseNumber(searchParams.limit, 10);
    const search = (typeof searchParams.search === 'string' ? searchParams.search : "") || "";
    const activeOnly = (typeof searchParams.activeOnly === 'string' ? searchParams.activeOnly : "true");

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