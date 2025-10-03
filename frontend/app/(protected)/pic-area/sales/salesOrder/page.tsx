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
import { useCurrentUser } from "@/hooks/use-current-user";
import { AdminLoading } from "@/components/admin-loading";
import { PicLayout } from "@/components/admin-panel/pic-layout";
import { SalesOrder } from "@/schemas";

export default function SalesOrderPageAdmin() {
  const [salesOrders, setSalesOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading } = useCurrentUser();
  const router = useRouter();
  const userRole = user?.role ?? null; // ambil role dari user

  useEffect(() => {
    if (loading) return; // tunggu user selesai diload

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
        const result = await fetchAllSalesOrder();

        const allowedStatuses = ["DRAFT", "CONFIRMED", "IN_PROGRESS_SPK", "FULFILLED", "BAST"];
        const filteredOrders =
          result.salesOrders?.filter((order: SalesOrder) => allowedStatuses.includes(order.status)) ?? [];

        setSalesOrders(filteredOrders);
        setIsLoading(result.isLoading ?? false);
      } catch (error) {
        console.error("Gagal fetch sales order:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router, userRole, loading]);


  if (loading) {
    return <AdminLoading message="Preparing Sales Order list..." />;
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
                  <BreadcrumbPage>Sales Management</BreadcrumbPage>
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
              isLoading={isLoading}
              role={userRole || "guest"}
            />
          </div>
        </div>
      </>
    ),
  };

  return <PicLayout {...layoutProps} />;
}
