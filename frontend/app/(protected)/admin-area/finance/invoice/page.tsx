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
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import { InvoiceDataTable } from "@/components/invoice/tableData";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getInvoices } from "@/lib/action/invoice/invoice";
import { Invoice } from "@/schemas/invoice";
import { getBankAccounts } from "@/lib/action/master/bank/bank";
import { BankAccount } from "@/schemas/bank";

export default function InvoicePageAdmin() {
    const [invoiceData, setInvoiceData] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user, loading: userLoading } = useCurrentUser();
    const [banks, setBanks] = useState<BankAccount[]>([]);
    const router = useRouter();

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

        const fetchDataInvoice = async () => {
            try {
                const result = await getInvoices();
                const resultBank = await getBankAccounts();

                // cek success
                if (result.success) {
                    setInvoiceData(result.data); // ambil data invoices
                    setBanks(resultBank || []);
                } else {
                    console.error("Failed to fetch Invoice:", result.success);
                }


            } catch (error) {
                console.error("Error fetching Invoice:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDataInvoice();
    }, [router, user, userLoading]);



    const layoutProps: LayoutProps = {
        title: "Finance Management",
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
                                    <BreadcrumbPage>Finance Management</BreadcrumbPage>
                                </Badge>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <Badge variant="outline">
                                <BreadcrumbPage>Invoice List</BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="h-full w-full">
                    <div className="flex-1 space-y-2 p-2 pt-1 md:p-4">
                        <InvoiceDataTable
                            invoiceData={invoiceData}
                            isLoading={isLoading}
                            role={user?.role}
                            banks={banks}
                            currentUser={user ? { id: user.id, name: user.name } : undefined}
                        />
                    </div>
                </div>
            </>
        ),
    };

    return <AdminLayout {...layoutProps} />;
}
