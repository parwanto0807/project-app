
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { getUserFromToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import SupplierInvoiceTable from "@/components/supplierInvoice/SupplierInvoiceTable";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import HeaderCard from "@/components/ui/header-card";
import { FileText } from "lucide-react";

export default async function SupplierInvoicePage() {
    const user = await getUserFromToken();

    if (!user) {
        redirect("/login");
    }

    if (user.role === "user" || user.role === "pic") {
        redirect("/unauthorized");
    }

    return (
        <AdminLayout title="Supplier Invoice" role={user.role}>
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/admin-area">Dashboard</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Accounting</BreadcrumbPage>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Supplier Invoice</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="space-y-4 p-2 pt-1 md:p-4">
                <HeaderCard
                    title={
                        <span>
                            <span className="lg:hidden">Supplier Invoice</span>
                            <span className="hidden lg:inline">Supplier Invoice Management</span>
                        </span>
                    }
                    description={
                        <span>
                            <span className="lg:hidden">Kelola invoice</span>
                            <span className="hidden lg:inline">Kelola invoice masuk dari supplier, status pembayaran, dan riwayat transaksi.</span>
                        </span>
                    }
                    icon={<FileText className="h-5 w-5 lg:h-7 lg:w-7" />}
                    gradientFrom="from-emerald-500"
                    gradientTo="to-green-600"
                />
                <SupplierInvoiceTable role={user.role} />
            </div>
        </AdminLayout>
    );
}
