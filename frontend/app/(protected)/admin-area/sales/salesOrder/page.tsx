"use client";

import { useEffect } from "react";
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
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import { SalesOrderTable } from "@/components/sales/salesOrder/tabelData";
import { useSalesOrder } from "@/hooks/use-salesOrder";
import { AdminLoading } from "@/components/admin-loading";
import { useSession } from "@/components/clientSessionProvider";

export default function SalesOrderPageAdmin() {
  const { user, isLoading: userLoading } = useSession();
  const router = useRouter();
  
  // Use the salesOrder hook
  const { 
    data: salesOrderData, 
    isLoading: isSalesOrderLoading, 
    error: salesOrderError 
  } = useSalesOrder();

  // Authentication and authorization effect
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

  // Show loading while checking authentication or fetching data
  if (userLoading || (user && user.role !== "admin")) {
    return <AdminLoading message="Checking authorization..." />;
  }

  // Show loading while fetching sales orders
  if (isSalesOrderLoading) {
    return <AdminLoading message="Loading sales orders..." />;
  }

  // Show error state if there's an error
  if (salesOrderError) {
    return (
      <AdminLayout title="Sales Order Management" role="admin">
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-red-800 font-medium">Error loading sales orders</h3>
            <p className="text-red-700 text-sm mt-1">
              {salesOrderError.message || "Failed to load sales orders"}
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const layoutProps: LayoutProps = {
    title: "Sales Order Management",
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
              salesOrders={salesOrderData?.salesOrders || []} 
              isLoading={isSalesOrderLoading} 
              role={user?.role || "admin"} 
            />
          </div>
        </div>
      </>
    ),
  };

  return <AdminLayout {...layoutProps} />;
}