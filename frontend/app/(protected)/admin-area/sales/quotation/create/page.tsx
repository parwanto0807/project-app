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
import { useCustomers } from "@/hooks/use-customer";
import { useProducts } from "@/hooks/use-product";
import { useTaxes } from "@/hooks/use-tax";
import { usePaymentTerms } from "@/hooks/use-paymentTerm";
import { useSalesOrder } from "@/hooks/use-salesOrder";
import { useCreateQuotation } from "@/hooks/use-quotation"; // Import the mutation hook
import { AdminLoading } from "@/components/admin-loading";
import { CreateQuotationForm } from "@/components/sales/quotation/createFormData";
import { Customer, Product, CreateQuotationRequest, Tax, PaymentTerm } from "@/types/quotation";
import { SalesOrder } from "@/schemas";
import { useSession } from "@/components/clientSessionProvider";

export default function CreateQuotationPageAdmin() {
  const { user, isLoading: userLoading } = useSession();
  const router = useRouter();

  // Use the mutation hook instead of manual fetch
  const createQuotationMutation = useCreateQuotation();

  // Hook fetching data
  const { data: customersData, isLoading: isCustomersLoading } = useCustomers();
  const { data: salesOrderData, isLoading: isSalesOrdersLoading } = useSalesOrder();
  const { data: productsData, isLoading: isProductsLoading } = useProducts();
  const { data: taxesData, isLoading: isTaxesLoading } = useTaxes();
  const { data: paymentTermsData, isLoading: isPaymentTermsLoading } = usePaymentTerms();

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

  // Set data customer & product setelah fetch selesai
  useEffect(() => {
    if (customersData?.customers) setCustomers(customersData.customers);
  }, [customersData]);

  useEffect(() => {
    if (productsData?.products) setProducts(productsData.products);
  }, [productsData]);

  useEffect(() => {
    if (salesOrderData?.salesOrders) setSalesOrders(salesOrderData.salesOrders);
  }, [salesOrderData]);

  useEffect(() => {
    if (taxesData) {
      // Filter hanya taxes yang aktif
      const activeTaxes = Array.isArray(taxesData)
        ? taxesData.filter((tax: Tax) => tax.isActive)
        : [];
      setTaxes(activeTaxes);
    }
  }, [taxesData]);

  useEffect(() => {
    if (paymentTermsData) {
      // Filter hanya payment terms yang aktif
      const activePaymentTerms = Array.isArray(paymentTermsData)
        ? paymentTermsData.filter((term: PaymentTerm) => term.isActive)
        : [];
      setPaymentTerms(activePaymentTerms);
    }
  }, [paymentTermsData]);

  const handleSubmit = async (data: CreateQuotationRequest) => {
    try {
      // Use the mutation instead of direct fetch
      await createQuotationMutation.mutateAsync(data);
      
      // Redirect ke halaman list quotation setelah berhasil
      router.push('/admin-area/sales/quotation');
      router.refresh();

    } catch (error) {
      // Error is automatically handled by the mutation
      console.error('Error creating quotation:', error);
      // You can show a toast notification here instead of alert
      alert(error instanceof Error ? error.message : 'Failed to create quotation. Please try again.');
    }
  };

  // Loading gabungan: user + semua data dependencies
  const isDataLoading = userLoading ||
    isCustomersLoading ||
    isProductsLoading ||
    isSalesOrdersLoading ||
    isTaxesLoading ||
    isPaymentTermsLoading;

  // Filter data yang sudah tersedia
  const isDataReady = customers.length > 0 && products.length > 0;

  // Authentication and authorization check
  if (userLoading) {
    return <AdminLoading message="Checking authentication..." />;
  }

  if (!user || user.role !== "admin") {
    return <AdminLoading message="Redirecting..." />;
  }

  if (isDataLoading) {
    return <AdminLoading message="Preparing Quotation creation form..." />;
  }

  return (
    <AdminLayout title="Create Quotation" role="admin">
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
            <BreadcrumbPage>Create</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6">
        {isDataReady ? (
          <CreateQuotationForm
            customers={customers}
            products={products}
            salesOrders={salesOrders}
            taxes={taxes}
            paymentTerms={paymentTerms}
            onSubmit={handleSubmit}
            isLoading={createQuotationMutation.isPending}
          />
        ) : (
          <AdminLoading message="Loading form data..." />
        )}
      </div>
    </AdminLayout>
  );
}