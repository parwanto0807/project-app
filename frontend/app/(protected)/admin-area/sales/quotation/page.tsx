"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import { QuotationTable } from "@/components/sales/quotation/tableData";
import { useDeleteQuotation, useQuotations } from "@/hooks/use-quotation";
import { useEffect } from "react";
import { AdminLoading } from "@/components/admin-loading";

export default function QuotationPageAdmin() {
  const { mutate: deleteQuotation, isPending } = useDeleteQuotation();
  const router = useRouter();

  // Role auth dummy → ganti sesuai auth system kamu
  const userRole = "admin";

  // ✅ Panggil hook → langsung dapat data, loading, error
  const {
    data: quotationsResponse,
    isLoading,
    isError,
    error
  } = useQuotations();

  // Redirect jika bukan admin
  useEffect(() => {
    if (userRole !== "admin") {
      router.push("/unauthorized");
    }
  }, [userRole, router]);

  // Handle loading state
  if (isLoading) {
    return <AdminLoading message="Loading Quotation data..." />;
  }

  // Handle error state
  if (isError) {
    return (
      <AdminLayout
        title="Quotation Management"
        role="admin"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">
            Error loading quotations: {error?.message}
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Extract data dari response
  const quotations = quotationsResponse?.data || [];
  const pagination = quotationsResponse?.pagination;

  const layoutProps: LayoutProps = {
    title: "Quotation Management",
    role: "admin",
    children: (
      <>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Badge variant="outline">
                  <Link href="/admin-area">Dashboard</Link>
                </Badge>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Badge variant="outline">
                  <BreadcrumbPage>Sales Management</BreadcrumbPage>
                </Badge>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Badge variant="outline">
                <BreadcrumbPage>Quotation List</BreadcrumbPage>
              </Badge>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="h-full w-full">
          <div className="flex-1 space-y-2 p-2 pt-1 md:p-4">
            {/* ✅ lempar data ke komponen tabel */}
            <QuotationTable
              quotations={quotations}
              isLoading={isLoading}
              isError={isError}
              role={userRole}
              pagination={pagination}
              onDelete={(id, options) =>
                deleteQuotation(id, {
                  onSuccess: () => {
                    options?.onSuccess?.();
                  },
                })
              }
              isDeleting={isPending}
            />
          </div>
        </div>
      </>
    ),
  };

  return <AdminLayout {...layoutProps} />;
}