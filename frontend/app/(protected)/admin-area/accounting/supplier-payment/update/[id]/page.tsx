
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
import { getSupplierPaymentById } from "@/lib/actions/supplierPayment";
import UpdateSupplierPaymentForm from "@/components/supplierPayment/UpdateSupplierPaymentForm";
import { AdminLayout } from "@/components/admin-panel/admin-layout";

export default async function UpdateSupplierPaymentPage({
    params,
}: {
    params: { id: string };
}) {
    const user = await getUserFromToken();

    if (!user) {
        redirect("/login");
    }

    if (user.role === "user" || user.role === "pic") {
        redirect("/unauthorized");
    }

    const { id } = params;
    const response = await getSupplierPaymentById(id);

    if (!response.success || !response.data) {
        redirect("/admin-area/accounting/supplier-payment");
    }

    return (
        <AdminLayout title="Update Supplier Payment" role={user.role}>
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
                        <BreadcrumbLink asChild>
                            <Link href="/admin-area/accounting/supplier-payment">Supplier Payment</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Update {response.data.paymentNumber}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="mt-6">
                <UpdateSupplierPaymentForm payment={response.data} />
            </div>
        </AdminLayout>
    );
}
