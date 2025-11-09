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
import { PageLoading } from "@/components/ui/loading";
import CreateTeamForm from "@/components/master/team/createFormData";
import { useSession } from "@/components/clientSessionProvider";

export default function CreateTeamPageAdmin() {
  const { user, isLoading } = useSession();
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "super">("admin");
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
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
  }, [user, isLoading, router]);

  // Tampilkan loading halaman penuh selama proses autentikasi
  if (isLoading || !authorized) {
    return (
      <PageLoading 
        title="Memverifikasi akses" 
        description="Mohon tunggu sementara kami memeriksa otentikasi Anda" 
      />
    );
  }

  const getBasePath = () => {
    return role === "super" 
      ? "/super-admin-area/master/team" 
      : "/admin-area/master/team";
  };

  return (
    <AdminLayout title="Tambah Team Baru" role={role}>
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
                  Team List
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-sm font-semibold">
                Create Team
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="bg-card rounded-lg max-w-4xl mx-auto border shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Tambah Team Baru</h2>
          <p className="text-muted-foreground mt-1">
            Isi formulir berikut untuk menambahkan data Team baru ke sistem
          </p>
        </div>

        <CreateTeamForm role={role} />
      </div>
    </AdminLayout>
  );
}