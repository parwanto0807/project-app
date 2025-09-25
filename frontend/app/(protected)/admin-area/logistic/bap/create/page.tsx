"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { useCurrentUser } from "@/hooks/use-current-user";
import { CreateBAPForm } from "@/components/bap/createFormData";
import { fetchAllSalesOrder } from "@/lib/action/sales/salesOrder";
import { fetchAllKaryawan } from "@/lib/action/master/karyawan";
import { Karyawan } from "@/lib/validations/karyawan";
import { AdminLoading } from "@/components/admin-loading";

export interface Customer {
    id: string;
    code: string;
    name: string;
    email: string | null;
    phone: string | null;
    address?: string | null;
    branch?: string | null;
}

export interface Project {
    id: string;
    customerId: string;
    name: string;
    location: string | null;
    createdAt: string;
}

export interface SPK {
    spkNumber: string;
    id: string;
}

export interface User {
    id: string;
    email: string;
    password?: string | null;
    name: string;
    mfaSecret?: string | null;
}

export interface SalesOrderItem {
    id: string;
    salesOrderId: string;
    productId: string;
    qty: number;
    price: number;
    discount?: number;
    total: number;
}

export interface SalesOrder {
    id: string;
    soNumber: string;
    soDate: string;
    projectId: string;
    customerId: string;
    userId: string;
    type: "REGULAR" | "OTHER";
    status: "DRAFT" | "IN_PROGRESS_SPK" | "COMPLETED" | string;
    isTaxInclusive: boolean;
    subtotal: string;
    discountTotal: string;
    taxTotal: string;
    grandTotal: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;

    customer: Customer;
    project: Project;
    spk: SPK[];
    items: SalesOrderItem[];
    user: User;
}

export interface SpkFieldReport {
    id: string;
    spkId: string;
    userId: string;
    reportDate: string;
    description: string;
    location: string;
    photos: string[];
    createdAt: string;
    updatedAt: string;
}

export interface BAPPhoto {
    photoUrl: string;
    category: "BEFORE" | "PROCESS" | "AFTER";
    caption?: string;
}

export default function CreateBAPPage() {
    const { user, loading: userLoading } = useCurrentUser();
    const router = useRouter();

    const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
    const [users, setUsers] = useState<Karyawan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (userLoading) return;

        if (!user) {
            router.replace("/auth/login");
            return;
        }

        if (user.role !== "admin") {
            router.replace("/not-authorized");
            return;
        }

        const fetchData = async () => {
            try {
                const [salesOrderRes, usersRes] = await Promise.all([
                    fetchAllSalesOrder(),
                    fetchAllKaryawan(),
                ]);

                setSalesOrders(salesOrderRes.salesOrders || []);
                setUsers(usersRes.karyawan || []);
            } catch (err) {
                console.error("Failed to fetch initial data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router, user, userLoading]);

if (isLoading) {
    return <AdminLoading message="Preparing BAP creation form..." />;
}

    const layoutProps: LayoutProps = {
        title: "Create BAP",
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
                                    <Link href="/admin-area/logistic/bap">BAST List</Link>
                                </Badge>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <Badge variant="outline">
                                <BreadcrumbPage>Create BAST</BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="h-full w-full">
                    <div className="flex-1 space-y-2 p-2 pt-1 md:p-4">
                        <CreateBAPForm
                            currentUser={{
                                id: user!.id,
                                name: user!.name,
                            }}
                            salesOrders={salesOrders}
                            users={users}
                        />
                    </div>
                </div>
            </>
        ),
    };

    return <AdminLayout {...layoutProps} />;
}
