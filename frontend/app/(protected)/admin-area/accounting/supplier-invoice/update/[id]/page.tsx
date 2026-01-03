
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
import { getSupplierInvoiceById } from "@/lib/actions/supplierInvoice";
import UpdateSupplierInvoiceForm from "@/components/supplierInvoice/UpdateSupplierInvoiceForm";
import { AdminLayout } from "@/components/admin-panel/admin-layout";

export default async function UpdateSupplierInvoicePage({
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
    const response = await getSupplierInvoiceById(id);

    if (!response.success || !response.data) {
        redirect("/admin-area/accounting/supplier-invoice");
    }

    return (
        <AdminLayout title="Update Supplier Invoice" role={user.role}>
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
                            <Link href="/admin-area/accounting/supplier-invoice">Supplier Invoice</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Update {response.data.invoiceNumber}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="mt-6">
                <UpdateSupplierInvoiceForm invoice={response.data} />
            </div>
        </AdminLayout>
    );
}
