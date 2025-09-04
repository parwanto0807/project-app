"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useCurrentUser } from "@/hooks/use-current-user";
import CreateEmployeeForm from "@/components/master/karyawan/createFormData";

export default function CreateKaryawanPageAdmin() {
  const { user, loading } = useCurrentUser();
  const router = useRouter();
  const [role, setRole] = useState<"admin">("admin");
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login");
      } else {
        const userRole = user.role as typeof role;

        if (userRole !== "admin") {
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
    <AdminLayout title="Create Customer" role={role}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin-area">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin-area/master/customers">Employee List</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <CreateEmployeeForm role={role} />
    </AdminLayout>
  );
}
