"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CreateSupplierForm } from "@/components/supplier/createFormSupplier";
import { Loader2 } from "lucide-react";
import { useSession } from "@/components/clientSessionProvider";
import { generateSupplierCode } from "@/lib/action/supplier/supplierAction";
import { fetchSupplierCategories } from "@/lib/action/supplier/categorySupplierAction";
import { fetchTermOfPayments } from "@/lib/action/supplier/termPaymentAction";
import { SupplierCategory, TermOfPayment } from "@/types/supplierType";

export default function CreateSupplierPageAdmin() {
    const { user, isLoading } = useSession();
    const router = useRouter();

    const [code, setCode] = useState("");
    const [categories, setCategories] = useState<SupplierCategory[]>([]);
    const [termOfPayments, setTermOfPayments] = useState<TermOfPayment[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        if (isLoading) return;

        const fetchData = async () => {
            setLoadingData(true);

            try {
                // 1. Fetch supplier code
                const newCode = await generateSupplierCode();
                setCode(newCode);

                // 2. Fetch categories - PARALLEL fetching
                const [categoriesResult, termPaymentsResult] = await Promise.allSettled([
                    fetchSupplierCategories(),
                    fetchTermOfPayments()
                ]);

                // Handle categories result
                if (categoriesResult.status === 'fulfilled') {
                    setCategories(categoriesResult.value || []);
                } else {
                    console.error("Failed to fetch categories:", categoriesResult.reason);
                    setCategories([]);
                }

                // Handle term of payments result
                if (termPaymentsResult.status === 'fulfilled') {
                    setTermOfPayments(termPaymentsResult.value || []);
                } else {
                    console.error("Failed to fetch term of payments:", termPaymentsResult.reason);
                    setTermOfPayments([]);
                }

                setError(null);

            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load necessary data.");
                setCategories([]);
                setTermOfPayments([]);
                setCode(`ERR-${Date.now().toString().slice(-6)}`);
            } finally {
                setLoadingData(false);
            }
        };

        // Validasi user
        if (!user) {
            router.replace("/auth/login");
            return;
        }

        if (user.role !== "admin") {
            router.replace("/not-authorized");
            return;
        }

        fetchData();
    }, [isLoading, user, router]);

    if (isLoading || !user || user.role !== "admin") {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading" />
                    <span>Memeriksa akses...</span>
                </div>
            </div>
        );
    }

    return (
        <AdminLayout title="Create Supplier" role="admin">
            {/* Breadcrumb */}
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/admin-area">Dashboard</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/admin-area/master/suppliers">Supplier List</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Create</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="mt-4">
                {loadingData ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                            <p className="text-muted-foreground">Loading supplier data...</p>
                            <p className="text-sm text-muted-foreground">
                                Please wait while we prepare form...
                            </p>
                        </div>
                    </div>
                ) : (
                    <CreateSupplierForm
                        role={user.role}
                        code={code}
                        error={error}
                        categories={categories}
                        termOfPayments={termOfPayments}
                    />
                )}
            </div>
        </AdminLayout>
    );
}