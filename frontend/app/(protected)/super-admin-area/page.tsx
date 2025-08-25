'use client';

import { SuperLayout } from "@/components/admin-panel/super-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useEffect } from "react";
import { useAutoLogout } from "@/hooks/use-auto-logout";
import { LoadingScreen } from "@/components/ui/loading-gears";
import DashboardAwalSalesOrder from "@/components/dashboard/super-admin/dashboard";
import { Home, LayoutDashboard, UserCircle } from "lucide-react"; // ✨ Import ikon
import Link from "next/link";

export default function DashboardPage() {
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  useAutoLogout(86400);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/auth/login");
    } else if (user.role !== "super") {
      router.push("/unauthorized");
    }
  }, [user, loading, router]);

  if (loading) return <LoadingScreen />;

  if (!user || user.role !== "super") {
    return null; // Tetap null agar tidak ada flash konten sebelum redirect
  }

  return (
    <SuperLayout title="Dashboard Super Admin" role={user.role}>
      {/* SECTION: Page Header yang lebih elegan */}
      <div className="space-y-4 mb-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="#" className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-gray-500" />
                  Home
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-2 font-semibold">
                <LayoutDashboard className="h-4 w-4 text-blue-600" />
                Dashboard
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Dashboard Super Admin
                </h1>
                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-green-500" />
                    Selamat datang kembali,{' '}
                    <span className="font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                      {user?.name}!
                    </span>
                    (Role: {user?.role})
                </p>
            </div>
        </div>
      </div>
      {/* END SECTION */}

      {/* ✅ Konten utama dashboard */}
      <DashboardAwalSalesOrder />

    </SuperLayout>
  );
}