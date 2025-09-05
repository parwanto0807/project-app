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
import { CustomersTable } from "@/components/master/customer/tabelData";
import { fetchAllCustomers } from "@/lib/action/master/customer";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import { useCurrentUser } from "@/hooks/use-current-user"; // ✅ pakai hook auth

export default function CustomerPageAdmin() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user, loading } = useCurrentUser(); // ✅ ambil user dari hook
  const token = localStorage.getItem("accessToken") || undefined;
  console.log("Token", token);

  useEffect(() => {
    if (loading) return; // tunggu user selesai di-load

    if (user?.role !== "admin") {
      router.push("/unauthorized");
      return;
    }

    const fetchData = async () => {
      const result = await fetchAllCustomers(token);
      setCustomers(result.customers);
      setIsLoading(result.isLoading);
    };

    fetchData();
  }, [token, router, user, loading]);

  const layoutProps: LayoutProps = {
    title: "Customer Management",
    role: (user?.role as "admin" | "super") || "admin", // ✅ type-safe fallback
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
                  <BreadcrumbPage>Master Data</BreadcrumbPage>
                </Badge>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Badge variant="outline">
                <BreadcrumbPage>Customer List</BreadcrumbPage>
              </Badge>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="h-full w-full">
          <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <CustomersTable customers={customers} isLoading={isLoading} role={user?.role ?? "guest"} />
          </div>
        </div>
      </>
    ),
  };

  return <AdminLayout {...layoutProps} />;
}
