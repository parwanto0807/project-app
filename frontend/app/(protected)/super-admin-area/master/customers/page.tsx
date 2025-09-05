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
import { SuperLayout } from "@/components/admin-panel/super-layout";
import { LayoutProps } from "@/types/layout";

export default function CustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const userRole = "super"; // bisa ganti dari context / user state

  useEffect(() => {
    if (userRole !== "super") {
      router.push("/unauthorized");
      return;
    }

    const fetchData = async () => {
      const result = await fetchAllCustomers();
      setCustomers(result.customers);
      setIsLoading(result.isLoading);
    };

    fetchData();
  }, [router]);


  const layoutProps: LayoutProps = {
    title: "Customer Management",
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
            <CustomersTable customers={customers} isLoading={isLoading} role={userRole} />
          </div>
        </div>
      </>
    ),
  };

  return <SuperLayout {...layoutProps} />;
}
