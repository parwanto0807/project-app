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
import { fetchAllSpk } from "@/lib/action/master/spk/spk";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import TabelDataSpk from "@/components/spk/tabelData";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function SpkPageAdmin() {
  const [dataSpk, setDataSpk] = useState([]);
  const { user, loading: userLoading } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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

    const fetchData = async () => {
      const result = await fetchAllSpk();
      setDataSpk(result);
      setIsLoading(false);
    };

    fetchData();
  }, [router, user, userLoading]);


  const layoutProps: LayoutProps = {
    title: "Sales Management",
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
                  <BreadcrumbPage>SPK Management</BreadcrumbPage>
                </Badge>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Badge variant="outline">
                <BreadcrumbPage>SPK List</BreadcrumbPage>
              </Badge>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="h-full w-full">
          <div className="flex-1 space-y-4 p-4 pt-6 md:p-4">
            <TabelDataSpk dataSpk={dataSpk} isLoading={isLoading} role={user?.role} />
          </div>
        </div>
      </>
    ),
  };

  return <AdminLayout {...layoutProps} />;
}
