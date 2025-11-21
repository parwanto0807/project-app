"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useCustomers } from "@/hooks/use-customer";
import { useProducts } from "@/hooks/use-product";
import { useTaxes } from "@/hooks/use-tax";
import { usePaymentTerms } from "@/hooks/use-paymentTerm";
import { useSalesOrder } from "@/hooks/use-salesOrder";
import { useQuotation, useUpdateQuotation } from "@/hooks/use-quotation";
import { AdminLoading } from "@/components/admin-loading";
import { UpdateQuotationForm } from "@/components/sales/quotation/updateFormData";
import {
    Customer,
    Product,
    CreateQuotationRequest,
    Tax,
    PaymentTerm,
} from "@/types/quotation";
import { SalesOrder } from "@/schemas";
import Link from "next/link";
import { useSession } from "@/components/clientSessionProvider";
import { OrderStatus } from "@/types/salesOrder";

interface UpdateQuotationPageAdminProps {
    params: Promise<{
        id: string;
    }>;
}

export default function UpdateQuotationPageAdmin({
    params,
}: UpdateQuotationPageAdminProps) {
    const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(
        null
    );
    const { user, isLoading: userLoading } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    const pageSize = Number(searchParams.get("pageSize")) || 10;
    const searchTerm = searchParams.get("search") || "";
    const statusFilter = (searchParams.get("status") as OrderStatus) || "ALL";
    const refreshTrigger = 0; // untuk refetch manual

    // 🔥 NEW: Ambil data dari query
    const returnUrl = searchParams.get("returnUrl") || "";
    const page = Number(searchParams.get("page")) || 1;
    const highlightId = searchParams.get("highlightId") || "";
    const highlightStatus = searchParams.get("status") || "";
    const searchUrl = searchParams.get("search") || "";

    // Resolve params promise
    useEffect(() => {
        const resolveParams = async () => {
            const resolved = await params;
            setResolvedParams(resolved);
        };

        resolveParams();
    }, [params]);

    const quotationId = resolvedParams?.id;

    // Hook untuk mengambil data quotation yang existing
    const {
        data: quotationData,
        isLoading: isQuotationLoading,
        error: quotationError,
    } = useQuotation(quotationId || "");

    // Hook untuk update quotation
    const updateQuotationMutation = useUpdateQuotation();

    // Hook fetching data untuk dropdowns
    const { data: customersData, isLoading: isCustomersLoading } = useCustomers();
    const { data: salesOrderData, isLoading: isSalesOrdersLoading } =
        useSalesOrder(page, pageSize, searchTerm, statusFilter, refreshTrigger);
    const { data: productsData, isLoading: isProductsLoading } = useProducts();
    const { data: taxesData, isLoading: isTaxesLoading } = useTaxes();
    const { data: paymentTermsData, isLoading: isPaymentTermsLoading } =
        usePaymentTerms();

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
    const [taxes, setTaxes] = useState<Tax[]>([]);
    const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);




    // useEffect untuk otentikasi dan otorisasi
    useEffect(() => {
        if (userLoading) return;
        if (!user) {
            router.replace("/auth/login");
            return;
        }
        if (user.role !== "admin") {
            router.replace("/not-authorized");
            return;
        }
    }, [userLoading, user, router]);

    // Set data setelah fetch
    useEffect(() => {
        if (customersData?.customers) setCustomers(customersData.customers);
    }, [customersData]);

    useEffect(() => {
        if (productsData?.products) setProducts(productsData.products);
    }, [productsData]);

    useEffect(() => {
        if (salesOrderData?.data) setSalesOrders(salesOrderData.data);
    }, [salesOrderData]);

    useEffect(() => {
        if (taxesData) {
            const activeTaxes = Array.isArray(taxesData)
                ? taxesData.filter((tax: Tax) => tax.isActive)
                : [];
            setTaxes(activeTaxes);
        }
    }, [taxesData]);

    useEffect(() => {
        if (paymentTermsData) {
            const activePaymentTerms = Array.isArray(paymentTermsData)
                ? paymentTermsData.filter((term: PaymentTerm) => term.isActive)
                : [];
            setPaymentTerms(activePaymentTerms);
        }
    }, [paymentTermsData]);

    const handleSubmit = async (data: CreateQuotationRequest) => {
        if (!quotationId) return;

        try {
            // Jalankan update
            await updateQuotationMutation.mutateAsync({
                id: quotationId,
                ...data,
            });

            // -------------------------------------------------
            // 🔹 Redirect setelah update
            // -------------------------------------------------
            if (returnUrl && returnUrl !== "") {
                // Gunakan returnUrl jika tersedia
                router.push(returnUrl);
            } else {
                // Jika tidak ada returnUrl → kembali ke list + highlight
                const toList = `/admin-area/sales/quotation?page=${page ?? 1}&highlightId=${highlightId ?? quotationId}&status=${highlightStatus ?? "UPDATED"}&search=${searchUrl}`;

                router.push(toList);
            }

            router.refresh(); // refresh page setelah navigasi

        } catch (error) {
            console.error("Error updating quotation:", error);
            alert(
                error instanceof Error
                    ? error.message
                    : "Failed to update quotation. Please try again."
            );
        }
    };


    const isDataLoading =
        userLoading ||
        !resolvedParams ||
        isQuotationLoading ||
        isCustomersLoading ||
        isProductsLoading ||
        isSalesOrdersLoading ||
        isTaxesLoading ||
        isPaymentTermsLoading;

    const isDataReady =
        customers.length > 0 && products.length > 0 && quotationData !== undefined;

    if (quotationError) {
        return (
            <AdminLayout title="Update Quotation" role="admin">
                <p className="text-red-600">
                    {quotationError instanceof Error
                        ? quotationError.message
                        : "Failed to load quotation data"}
                </p>
            </AdminLayout>
        );
    }

    if (userLoading) return <AdminLoading message="Checking authentication..." />;
    if (!user || user.role !== "admin")
        return <AdminLoading message="Redirecting..." />;
    if (isDataLoading) return <AdminLoading message="Loading quotation data..." />;

    return (
        <AdminLayout title="Update Quotation" role="admin">
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
                            <Link href="/admin-area/sales/quotation">Quotation List</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Update</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="mt-6">
                {isDataReady && quotationData ? (
                    <UpdateQuotationForm
                        customers={customers}
                        products={products}
                        salesOrders={salesOrders}
                        taxes={taxes}
                        paymentTerms={paymentTerms}
                        onSubmit={handleSubmit}
                        isLoading={updateQuotationMutation.isPending}
                        initialData={quotationData}
                        isUpdate={true}
                    // returnUrl={returnUrl}
                    // page={page}
                    // highlightId={highlightId}
                    // highlightStatus={highlightStatus}
                    />
                ) : (
                    <AdminLoading message="Loading quotation data..." />
                )}
            </div>
        </AdminLayout>
    );
}
