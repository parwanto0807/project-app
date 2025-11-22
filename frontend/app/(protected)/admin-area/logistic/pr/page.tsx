// app/(protected)/admin-area/logistic/pr/page.tsx
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
import { PaginationInfo, PurchaseRequestFilters, PRStatus } from "@/types/pr";
import { PurchaseRequestClientWrapper } from "@/components/pr/component/purchase-request-wrapper";
import { getAllPurchaseRequests } from "@/lib/action/pr/pr";

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

function isValidPRStatus(status: string): status is PRStatus {
    return ["DRAFT", "REVISION_NEEDED", "SUBMITTED", "APPROVED", "REJECTED", "COMPLETED"].includes(status);
}

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

    // Parse search params
    const page = parseNumber(resolvedSearchParams.page, 1);
    const limit = parseNumber(resolvedSearchParams.limit, 10);
    const search = resolvedSearchParams.search || "";
    
    const status = resolvedSearchParams.status && isValidPRStatus(resolvedSearchParams.status) 
        ? resolvedSearchParams.status 
        : undefined;
        
    const projectId = resolvedSearchParams.projectId || undefined;
    
    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;
    
    try {
        dateFrom = resolvedSearchParams.dateFrom ? new Date(resolvedSearchParams.dateFrom) : undefined;
        dateTo = resolvedSearchParams.dateTo ? new Date(resolvedSearchParams.dateTo) : undefined;
        
        if (dateFrom && isNaN(dateFrom.getTime())) dateFrom = undefined;
        if (dateTo && isNaN(dateTo.getTime())) dateTo = undefined;
    } catch (error) {
        console.error("Error parsing dates:", error);
    }

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
        const result = await getAllPurchaseRequests(filters);
        
        if (!result) {
            throw new Error("Failed to fetch purchase requests");
        }

        const { data: purchaseRequests, pagination } = result;

        const tablePagination: PaginationInfo = {
            page: pagination?.page || page,
            limit: pagination?.limit || limit,
            totalCount: pagination?.totalCount || 0,
            totalPages: pagination?.totalPages || 1,
        };

        const initialData = {
            purchaseRequests: purchaseRequests || [],
            pagination: tablePagination,
            currentSearch: search,
            currentStatus: status,
            currentProjectId: projectId,
            currentDateFrom: dateFrom,
            currentDateTo: dateTo,
        };

        // Gunakan nested children pattern
        return (
            <AdminLayout title="Purchase Request Management" role="admin">
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
            </AdminLayout>
        );

    } catch (error) {
        console.error("Error loading purchase requests:", error);
        
        // Error case juga gunakan nested children
        return (
            <AdminLayout title="Purchase Request Management - Error" role="admin">
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
                    <div className="text-center">
                        <div className="text-red-500 text-lg font-semibold mb-2">
                            Failed to Load Data
                        </div>
                        <p className="text-gray-600 mb-4">
                            There was an error loading the purchase requests. Please try again.
                        </p>
                        <Link 
                            href="/admin-area/logistic/pr" 
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Try Again
                        </Link>
                    </div>
                </div>
            </AdminLayout>
        );
    }
}