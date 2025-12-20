// app/admin-area/master/suppliers/update/[id]/page.tsx
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
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { useSession } from "@/components/clientSessionProvider";
import { fetchSupplierById } from "@/lib/action/supplier/supplierAction";
import { fetchSupplierCategories } from "@/lib/action/supplier/categorySupplierAction";
import { fetchTermOfPayments } from "@/lib/action/supplier/termPaymentAction";
import { Supplier, SupplierCategory, TermOfPayment } from "@/types/supplierType";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { UpdateSupplierForm } from "@/components/supplier/updateFormSupplier";
import { Card, CardContent } from "@/components/ui/card";

interface UpdateSupplierPageProps {
    params: Promise<{ id: string }>;
}

export default function UpdateSupplierPageAdmin({ params }: UpdateSupplierPageProps) {
    const { user, isLoading: sessionLoading } = useSession();
    const router = useRouter();

    const [supplierId, setSupplierId] = useState<string>("");
    const [supplierData, setSupplierData] = useState<Supplier | null>(null);
    const [categories, setCategories] = useState<SupplierCategory[]>([]);
    const [termOfPayments, setTermOfPayments] = useState<TermOfPayment[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (sessionLoading) return;

        // Parse params async
        const getParams = async () => {
            try {
                const resolvedParams = await params;
                setSupplierId(resolvedParams.id);
            } catch (err) {
                console.error("Error parsing params:", err);
                setError("Invalid supplier ID");
                setLoadingData(false);
            }
        };

        getParams();
    }, [sessionLoading, params]);

    useEffect(() => {
        if (sessionLoading || !supplierId) return;

        const fetchData = async () => {
            setLoadingData(true);
            setError(null);
            setNotFound(false);

            try {
                // Validasi user
                if (!user) {
                    router.replace("/auth/login");
                    return;
                }

                if (user.role !== "admin" && user.role !== "super") {
                    router.replace("/not-authorized");
                    return;
                }

                // Fetch data PARALLEL dengan timeout
                const fetchPromise = Promise.allSettled([
                    fetchSupplierById(supplierId),
                    fetchSupplierCategories(),
                    fetchTermOfPayments()
                ]);

                // Timeout handling
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Request timeout")), 10000)
                );

                const [supplierResult, categoriesResult, termPaymentsResult] = await Promise.race([
                    fetchPromise,
                    timeoutPromise.then(() => { throw new Error("Request timeout"); })
                ]) as PromiseSettledResult<any>[];

                // Handle supplier result
                if (supplierResult.status === 'fulfilled') {
                    if (supplierResult.value && supplierResult.value.data) {
                        setSupplierData(supplierResult.value.data);
                    } else {
                        setNotFound(true);
                        setError("Supplier not found");
                    }
                } else {
                    console.error("Failed to fetch supplier:", supplierResult.reason);
                    setNotFound(true);
                    setError("Failed to load supplier data. Please try again.");
                }

                // Handle categories result
                if (categoriesResult.status === 'fulfilled') {
                    setCategories(Array.isArray(categoriesResult.value) ? categoriesResult.value : []);
                } else {
                    console.error("Failed to fetch categories:", categoriesResult.reason);
                    setCategories([]);
                }

                // Handle term of payments result
                if (termPaymentsResult.status === 'fulfilled') {
                    setTermOfPayments(Array.isArray(termPaymentsResult.value) ? termPaymentsResult.value : []);
                } else {
                    console.error("Failed to fetch term of payments:", termPaymentsResult.reason);
                    setTermOfPayments([]);
                }

            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err instanceof Error ? err.message : "Failed to load necessary data.");
                setNotFound(true);
            } finally {
                setLoadingData(false);
            }
        };

        fetchData();
    }, [sessionLoading, user, router, supplierId]);

    // Loading state untuk session
    if (sessionLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading" />
                    <p className="text-muted-foreground">Loading session...</p>
                </div>
            </div>
        );
    }

    // Redirect jika belum login
    if (!user) {
        router.replace("/auth/login");
        return null;
    }

    // Authorization check
    if (user.role !== "admin" && user.role !== "super") {
        return (
            <AdminLayout title="Not Authorized" role={user.role}>
                <div className="flex min-h-[60vh] flex-col items-center justify-center">
                    <Card className="max-w-md w-full">
                        <CardContent className="pt-6 text-center">
                            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                            <p className="text-muted-foreground mb-6">
                                You don't have permission to access this page.
                            </p>
                            <Button
                                onClick={() => router.push("/admin-area")}
                                className="w-full"
                            >
                                Back to Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            title={supplierData ? `Update ${supplierData.name}` : "Update Supplier"}
            role={user.role}
        >
            {/* Breadcrumb */}
            <div className="mb-6">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/admin-area" className="flex items-center gap-1">
                                    <ArrowLeft className="h-3 w-3" />
                                    Dashboard
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/admin-area/master/supplier">
                                    Suppliers
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>
                                {supplierData ? supplierData.name : "Loading..."}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            {/* Main Content */}
            <div className="mt-6">
                {loadingData ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                        <p className="text-lg font-medium mb-2">Loading supplier data...</p>
                        <p className="text-sm text-muted-foreground">
                            Please wait while we fetch the supplier information.
                        </p>
                    </div>
                ) : notFound ? (
                    <Card className="border-destructive/20">
                        <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center">
                            <div className="rounded-full bg-destructive/10 p-4 mb-4">
                                <AlertCircle className="h-12 w-12 text-destructive" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Supplier Not Found</h2>
                            <p className="text-muted-foreground mb-6 max-w-md">
                                The supplier you're trying to edit doesn't exist or may have been deleted.
                            </p>
                            {error && (
                                <Alert className="mb-6 max-w-md">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => router.back()}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Go Back
                                </Button>
                                <Button
                                    onClick={() => router.push("/admin-area/master/supplier")}
                                    className="gap-2"
                                >
                                    View All Suppliers
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : error ? (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="font-medium">{error}</AlertDescription>
                        <div className="mt-3 flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.location.reload()}
                            >
                                Retry
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => router.push("/admin-area/master/supplier")}
                            >
                                Back to List
                            </Button>
                        </div>
                    </Alert>
                ) : (
                    supplierData && (
                        <UpdateSupplierForm
                            supplier={supplierData}
                            categories={categories}
                            termOfPayments={termOfPayments}
                            role={user.role}
                            onSuccess={() => {
                                // ✅ Redirect ke list setelah update sukses
                                router.push("/admin-area/master/supplier");
                                // Optional: Show toast/success message
                            }}
                            onCancel={() => {
                                router.back();
                            }}
                        />
                    )
                )}
            </div>

            {/* Debug info (hanya di development) */}
            {process.env.NODE_ENV === 'development' && supplierData && (
                <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
                    <p className="text-xs font-mono text-muted-foreground">
                        Debug: Supplier ID: {supplierId} |
                        Categories: {categories.length} |
                        Terms: {termOfPayments.length}
                    </p>
                </div>
            )}
        </AdminLayout>
    );
}