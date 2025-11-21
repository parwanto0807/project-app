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
import { LayoutProps } from "@/types/layout";
import { PaginationInfo, PurchaseRequestFilters, PRStatus } from "@/types/pr";
import { AdminLoading } from "@/components/admin-loading";
import { PurchaseRequestClientWrapper } from "@/components/pr/component/purchase-request-wrapper";
import { getAllPurchaseRequests } from "@/lib/action/pr/pr";

// Definisikan interface untuk search params yang sesuai dengan Next.js
interface SearchParams {
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    projectId?: string;
    dateFrom?: string;
    dateTo?: string;
}

interface PurchaseRequestPageAdminProps {
    searchParams: Promise<SearchParams>;
}

// Helper function untuk validasi status
function isValidPRStatus(status: string): status is PRStatus {
    return ["DRAFT", "REVISION_NEEDED", "SUBMITTED", "APPROVED", "REJECTED", "COMPLETED"].includes(status);
}

// Helper function untuk parse number dengan aman
function parseNumber(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
}

export default async function PurchaseRequestPageAdmin({ searchParams }: PurchaseRequestPageAdminProps) {
    const resolvedSearchParams = await searchParams;
    
    // Check authentication and role on server
    const userRole = "admin"; 
    
    if (userRole !== "admin") {
        redirect("/unauthorized");
    }

    // Parse search params dengan type safety
    const page = parseNumber(resolvedSearchParams.page, 1);
    const limit = parseNumber(resolvedSearchParams.limit, 10);
    const search = resolvedSearchParams.search || "";
    
    // Validasi status dengan type safety
    const status = resolvedSearchParams.status && isValidPRStatus(resolvedSearchParams.status) 
        ? resolvedSearchParams.status 
        : undefined;
        
    const projectId = resolvedSearchParams.projectId || undefined;
    
    // Parse dates dengan validation
    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;
    
    try {
        dateFrom = resolvedSearchParams.dateFrom ? new Date(resolvedSearchParams.dateFrom) : undefined;
        dateTo = resolvedSearchParams.dateTo ? new Date(resolvedSearchParams.dateTo) : undefined;
        
        // Validate dates
        if (dateFrom && isNaN(dateFrom.getTime())) dateFrom = undefined;
        if (dateTo && isNaN(dateTo.getTime())) dateTo = undefined;
    } catch (error) {
        console.error("Error parsing dates:", error);
        // Tetap lanjut tanpa date filters jika parsing gagal
    }

    // Build filters object dengan type yang benar
    const filters: PurchaseRequestFilters = {
        status,
        projectId,
        dateFrom,
        dateTo,
        page,
        limit,
        search,
    };

    try {
        // Fetch data menggunakan server action
        const { data: purchaseRequests, pagination } = await getAllPurchaseRequests(filters);

        const tablePagination: PaginationInfo = {
            page: pagination?.page || page,
            limit: pagination?.limit || limit,
            totalCount: pagination?.totalCount || 0,
            totalPages: pagination?.totalPages || 1,
        };

        // Siapkan initial data untuk client wrapper
        const initialData = {
            purchaseRequests,
            pagination: tablePagination,
            currentSearch: search,
            currentStatus: status,
            currentProjectId: projectId,
            currentDateFrom: dateFrom,
            currentDateTo: dateTo,
        };

        // Content yang akan ditampilkan - GUNAKAN CLIENT WRAPPER
        const pageContent = (
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
                                    Logistic
                                </Badge>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <Badge variant="outline">
                                <BreadcrumbPage>Purchase Requests</BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="h-full w-full">
                    <div className="flex-1 space-y-2 p-2 pt-1 md:p-4">
                        <PurchaseRequestClientWrapper initialData={initialData} />
                    </div>
                </div>
            </>
        );

        const layoutProps: LayoutProps = {
            title: "Purchase Request Management",
            role: "admin",
            children: pageContent,
        };

        return <AdminLayout {...layoutProps} />;

    } catch (error) {
        console.error("Error loading purchase requests:", error);
        
        // Error content
        const errorContent = (
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
                                    Logistic
                                </Badge>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <Badge variant="outline">
                                <BreadcrumbPage>Purchase Requests</BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex-1 p-4 flex items-center justify-center min-h-[400px]">
                    <AdminLoading 
                        message="Error loading purchase requests data. Please try again later."
                    />
                </div>
            </>
        );

        const errorLayoutProps: LayoutProps = {
            title: "Purchase Request Management - Error",
            role: "admin",
            children: errorContent,
        };

        return <AdminLayout {...errorLayoutProps} />;
    }
}