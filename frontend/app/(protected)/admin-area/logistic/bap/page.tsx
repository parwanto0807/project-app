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
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import { BAPDataTable } from "@/components/bap/tableData";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getAllBAP } from "@/lib/action/bap/bap";

export default function BapPageAdmin() {
  const [bapData, setBapData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: userLoading } = useCurrentUser();
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

    const fetchDataBAP = async () => {
      const result = await getAllBAP();
      if (result.success) {
        setBapData(result.data);
      } else {
        console.error("Failed to fetch BAPs:", result.error);
      }
      setIsLoading(false);
    };
    fetchDataBAP();
  }, [router, user, userLoading]);


  const layoutProps: LayoutProps = {
    title: "Logistic Management",
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
                  <BreadcrumbPage>Logistic Management</BreadcrumbPage>
                </Badge>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Badge variant="outline">
                <BreadcrumbPage>BAST List</BreadcrumbPage>
              </Badge>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="h-full w-full">
          <div className="flex-1 space-y-2 p-2 pt-1 md:p-4">
            <BAPDataTable
              bapData={bapData}
              isLoading={isLoading}
              // role={user?.role}
            />
          </div>
        </div>
      </>
    ),
  };

  return <AdminLayout {...layoutProps} />;
}
