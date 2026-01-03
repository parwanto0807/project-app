
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
import CreateSupplierInvoiceForm from "@/components/supplierInvoice/CreateSupplierInvoiceForm";
import { AdminLayout } from "@/components/admin-panel/admin-layout";

export default async function CreateSupplierInvoicePage() {
    const user = await getUserFromToken();

    if (!user) {
        redirect("/login");
    }

    if (user.role === "user" || user.role === "pic") {
        redirect("/unauthorized");
    }

    return (
        <AdminLayout title="Create Supplier Invoice" role={user.role}>
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
                        <BreadcrumbPage>Create</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="mt-6">
                <CreateSupplierInvoiceForm />
            </div>
        </AdminLayout>
    );
}
