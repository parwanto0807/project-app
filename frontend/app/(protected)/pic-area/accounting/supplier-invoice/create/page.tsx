
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
import { PicLayout } from '@/components/admin-panel/pic-layout';

export default async function CreateSupplierInvoicePage() {
    const user = await getUserFromToken();

    if (!user) {
        redirect("/login");
    }

    if (user.role !== "pic" && user.role !== "admin" && user.role !== "super") {
        redirect("/unauthorized");
    }

    return (
        <PicLayout title="Create Penerimaan Invoice" role="pic">
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
                        <BreadcrumbPage>Create</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="mt-6">
                <CreateSupplierInvoiceForm role="pic" />
            </div>
        </PicLayout>
    );
}
