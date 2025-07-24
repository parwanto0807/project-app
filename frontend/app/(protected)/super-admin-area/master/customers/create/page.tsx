"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SuperLayout } from "@/components/admin-panel/super-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useCurrentUser } from "@/hooks/use-current-user";
import CreateCustomerForm from "@/components/master/customer/createFormData";

export default function CreateCustomerPage() {
  const { user, loading } = useCurrentUser();
  const router = useRouter();
  const [role, setRole] = useState<"super" | "admin">("super");
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login");
      } else {
        const userRole = user.role as typeof role;

        if (userRole !== "super" && userRole !== "admin") {
          router.push("/not-authorized");
        } else {
          setRole(userRole);
          setAuthorized(true);
        }
      }
    }
  }, [user, loading, router]);

  if (loading || !authorized) {
    return <p className="text-center">🔄 Loading...</p>;
  }

  return (
    <SuperLayout title="Create Customer" role={role}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/super-admin-area">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/super-admin-area/master/customers">Customer List</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <CreateCustomerForm />
    </SuperLayout>
  );
}
