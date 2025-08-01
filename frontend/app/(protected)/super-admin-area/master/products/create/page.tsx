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
import { CreateProductForm } from "@/components/master/product/createFormData";

export default function CreateProductPage() {
  const { user, loading } = useCurrentUser();
  const router = useRouter();
  const [role, setRole] = useState<"super">("super");
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login");
      } else {
        const userRole = user.role as typeof role;

        if (userRole !== "super") {
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
              <Link href="/super-admin-area/master/customers">Product List</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <CreateProductForm />
    </SuperLayout>
  );
}
