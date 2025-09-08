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
import { PageLoading } from "@/components/ui/loading";

export default function CreateKaryawanPageAdmin() {
  const { user, loading } = useCurrentUser();
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "super">("admin");
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login");
      } else {
        const userRole = user.role as "admin" | "super";

        if (userRole !== "admin" && userRole !== "super") {
          router.push("/not-authorized");
        } else {
          setRole(userRole);
          setAuthorized(true);
        }
      }
    }
  }, [user, loading, router]);

  // Tampilkan loading halaman penuh selama proses autentikasi
  if (loading || !authorized) {
    return (
      <PageLoading 
        title="Memverifikasi akses" 
        description="Mohon tunggu sementara kami memeriksa otentikasi Anda" 
      />
    );
  }

  const getBasePath = () => {
    return role === "super" 
      ? "/super-admin-area/master/karyawan" 
      : "/admin-area/master/karyawan";
  };

  return (
    <AdminLayout title="Tambah Karyawan Baru" role={role}>
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link 
                  href={role === "super" ? "/super-admin-area" : "/admin-area"}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link 
                  href={getBasePath()}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Data Karyawan
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-sm font-semibold">
                Tambah Karyawan
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="bg-card rounded-lg border shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Tambah Karyawan Baru</h2>
          <p className="text-muted-foreground mt-1">
            Isi formulir berikut untuk menambahkan data karyawan baru ke sistem
          </p>
        </div>

        <CreateEmployeeForm role={role} />
      </div>
    </AdminLayout>
  );
}