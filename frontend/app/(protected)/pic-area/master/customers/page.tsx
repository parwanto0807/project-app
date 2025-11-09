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
import { LayoutProps } from "@/types/layout";
import { PicLayout } from "@/components/admin-panel/pic-layout";
import { useSession } from "@/components/clientSessionProvider";

export default function CustomerPageAdmin() {
  const [customers, setCustomers] = useState([]);
  const router = useRouter();
  const { user, isLoading } = useSession(); // ✅ ambil user dari hook

  useEffect(() => {
    if (isLoading) return; // tunggu user selesai di-load

    if (user?.role !== "pic") {
      router.push("/unauthorized");
      return;
    }

    const fetchData = async () => {
      const result = await fetchAllCustomers();
      setCustomers(result.customers);
    };

    fetchData();
  }, [router, user, isLoading]);

  const layoutProps: LayoutProps = {
    title: "Customer Management",
    role: (user?.role as "pic") || "admin", // ✅ type-safe fallback
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

  return <PicLayout {...layoutProps} />;
}
