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
import { SuperLayout } from "@/components/admin-panel/super-layout";
import { LayoutProps } from "@/types/layout";
import { SalesOrderTable } from "@/components/sales/salesOrder/tabelData";
import { type SalesOrder } from "@/lib/validations/sales-order"
import { useSession } from "@/components/clientSessionProvider";
import { AdminLoading } from "@/components/admin-loading";

export default function SalesOrderPage() {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const router = useRouter();
  const { user, isLoading: userLoading } = useSession();
  const userRole = user?.role ?? null;

  useEffect(() => {
    if (userLoading) return;

    if (!userRole || userRole !== "super") {
      router.push("/unauthorized");
      return;
    }

    const fetchData = async () => {
      try {
        setIsDataLoading(true);
        setDataError(null);
        
        const result = await fetchAllSalesOrder();

        // Handle potential errors from fetchAllSalesOrder
        if (result.error) {
          throw new Error(result.error);
        }

        // Type-safe array check and setting
        const orders = Array.isArray(result.salesOrders) ? result.salesOrders : [];
        setSalesOrders(orders);
        
      } catch (error) {
        console.error("Failed to fetch sales orders:", error);
        setDataError(error instanceof Error ? error.message : "Failed to load sales orders");
        setSalesOrders([]);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchData();
  }, [router, userRole, userLoading]);

  // Show loading while checking authentication
  if (userLoading) {
    return <AdminLoading message="Checking authorization..." />;
  }

  // Show error state if data loading failed
  if (dataError) {
    return (
      <SuperLayout title="Sales Management" role="super">
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-red-800 font-medium">Error Loading Sales Orders</h3>
            <p className="text-red-700 text-sm mt-1">{dataError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </SuperLayout>
    );
  }

  const layoutProps: LayoutProps = {
    title: "Sales Management",
    role: "super",
    children: (
      <>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Badge variant="outline">
                  <Link href="/super-admin-area">Dashboard</Link>
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
          <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <SalesOrderTable 
              salesOrders={salesOrders} 
              isLoading={isDataLoading} 
              role={userRole || "super"} 
            />
          </div>
        </div>
      </>
    ),
  };

  return <SuperLayout {...layoutProps} />;
}