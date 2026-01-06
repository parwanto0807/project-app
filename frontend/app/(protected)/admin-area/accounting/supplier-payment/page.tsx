
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
import SupplierPaymentTable from "@/components/supplierPayment/SupplierPaymentTable";
import { AdminLayout } from "@/components/admin-panel/admin-layout";

// Force dynamic rendering (uses cookies for auth)
export const dynamic = 'force-dynamic';

export default async function SupplierPaymentPage() {
    const user = await getUserFromToken();

    if (!user) {
        redirect("/login");
    }

    if (user.role === "user" || user.role === "pic") {
        redirect("/unauthorized");
    }

    return (
        <AdminLayout title="Supplier Payment" role={user.role}>
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/admin-area">Home</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/admin-area/accounting">Accounting</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Supplier Payment</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="mt-6">
                <SupplierPaymentTable role={user.role} />
            </div>
        </AdminLayout>
    );
}
