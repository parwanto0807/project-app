"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { fetchAllSalesOrder } from "@/lib/action/sales/salesOrder";
import { LayoutProps } from "@/types/layout";
import { SalesOrderTable } from "@/components/sales/salesOrder/tabelData";
import { AdminLoading } from "@/components/admin-loading";
import { PicLayout } from "@/components/admin-panel/pic-layout";
import { type SalesOrder } from "@/lib/validations/sales-order"
import { useSession } from "@/components/clientSessionProvider";

export default function SalesOrderPageAdmin() {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const { user, isLoading: userLoading } = useSession();
  const router = useRouter();
  const userRole = user?.role ?? null;

  useEffect(() => {
    if (userLoading) return;

    if (!userRole) {
      router.push("/unauthorized");
      return;
    }

    if (userRole !== "pic") {
      router.push("/unauthorized");
      return;
    }

    const fetchData = async () => {
      try {
        setIsDataLoading(true);
        setDataError(null);

        const result = await fetchAllSalesOrder();

        // Handle different return types from fetchAllSalesOrder
        if (result.error) {
          throw new Error(result.error);
        }

        const allowedStatuses = ["DRAFT", "CONFIRMED", "IN_PROGRESS_SPK", "FULFILLED", "BAST"];

        const filteredOrders = Array.isArray(result.salesOrders)
          ? result.salesOrders.filter((order: SalesOrder) =>
            order.status && allowedStatuses.includes(order.status)
          )
          : [];

        setSalesOrders(filteredOrders);

      } catch (error) {
        console.error("Gagal fetch sales order:", error);
        setDataError(error instanceof Error ? error.message : "Failed to load sales orders");
        setSalesOrders([]);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchData();
  }, [router, userRole, userLoading]);

  // Show loading while checking user session
  if (userLoading) {
    return <AdminLoading message="Checking authorization..." />;
  }

  // Show error state
  if (dataError) {
    return (
      <PicLayout title="Sales Management" role={userRole || "guest"}>
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-red-800 font-medium">Error Loading Data</h3>
            <p className="text-red-700 text-sm mt-1">{dataError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </PicLayout>
    );
  }

  const layoutProps: LayoutProps = {
    title: "Sales Management",
    role: userRole || "guest",
    children: (
      <>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Badge variant="outline">
                  <Link href="/pic-area">Dashboard</Link>
                </Badge>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Badge variant="outline">
                  Sales Management
                </Badge>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Badge variant="outline">
                <BreadcrumbPage>Sales Order List</BreadcrumbPage>
              </Badge>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="h-full w-full">
          <div className="flex-1 space-y-2 p-2 pt-1 md:p-4">
            <SalesOrderTable
              salesOrders={salesOrders}
              isLoading={isDataLoading}
              role={userRole || "guest"}
            />
          </div>
        </div>
      </>
    ),
  };

  return <PicLayout {...layoutProps} />;
}