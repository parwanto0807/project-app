
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
import { PicLayout } from '@/components/admin-panel/pic-layout';
import HeaderCard from "@/components/ui/header-card";
import { FileText } from "lucide-react";

// Force dynamic rendering (uses cookies for auth)
export const dynamic = 'force-dynamic';

export default async function SupplierInvoicePage() {
    const user = await getUserFromToken();

    if (!user) {
        redirect("/login");
    }

    // Ensure only authorized roles can access (PIC is allowed here)
    if (user.role !== "pic" && user.role !== "admin" && user.role !== "super") {
        redirect("/unauthorized");
    }

    return (
        <PicLayout title="Penerimaan Invoice Supplier" role="pic">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/pic-area">Dashboard</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Accounting</BreadcrumbPage>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Penerimaan Invoice Supplier</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="my-6 md:px-6">
                <HeaderCard
                    title="Penerimaan Invoice Supplier"
                    description="Kelola invoice masuk dari supplier, verifikasi dokumen, dan status pembayaran."
                    icon={<FileText className="w-6 h-6" />}
                    gradientFrom="from-emerald-500"
                    gradientTo="to-green-600"
                />
            </div>

            <div className="mt-6">
                <SupplierInvoiceTable role="pic" />
            </div>
        </PicLayout>
    );
}
