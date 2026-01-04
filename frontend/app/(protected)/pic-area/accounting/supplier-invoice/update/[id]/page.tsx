
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
import { PicLayout } from '@/components/admin-panel/pic-layout';

export default async function UpdateSupplierInvoicePage({
    params,
}: {
    params: { id: string };
}) {
    const user = await getUserFromToken();

    if (!user) {
        redirect("/login");
    }

    if (user.role !== "pic" && user.role !== "admin" && user.role !== "super") {
        redirect("/unauthorized");
    }

    const { id } = params;
    const response = await getSupplierInvoiceById(id);

    if (!response.success || !response.data) {
        redirect("/pic-area/accounting/supplier-invoice");
    }

    return (
        <PicLayout title="Update Penerimaan Invoice" role="pic">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/pic-area">Dashboard</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/pic-area/accounting">Accounting</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/pic-area/accounting/supplier-invoice">Penerimaan Invoice</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Update {response.data.invoiceNumber}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="mt-6">
                <UpdateSupplierInvoiceForm invoice={response.data} role="pic" />
            </div>
        </PicLayout>
    );
}
