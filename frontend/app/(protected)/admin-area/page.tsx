// app/admin-area/page.tsx
'use client';

import { AdminLayout } from "@/components/admin-panel/admin-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/clientSessionProvider";
import { useEffect } from "react";
import { useAutoLogout } from "@/hooks/use-auto-logout";
import DashboardAwalSalesOrder from "@/components/dashboard/admin/dashboard";
import { Home, LayoutDashboard, UserCircle } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isLoading } = useSession();
  const router = useRouter();

  useAutoLogout(86400);

  // Logic Auth Redirect
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/auth/login");
    } else if (user.role !== "admin") {
      router.push("/unauthorized");
    }
  }, [user, isLoading, router]);

  // ✅ HAPUS FCM LOGIC DARI SINI - biar FCMSetup yang handle

  if (!user || user.role !== "admin") return null;
  
  return (
    <AdminLayout title="Dashboard Admin" role={user.role}>
      {/* Page Header */}
      <div className="space-y-3 sm:space-y-4 mb-2 sm:mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin-area" className="flex items-center gap-1.5 sm:gap-2 pl-2">
                  <Home className="h-4 w-4 text-gray-500 sm:h-4 sm:w-4" />
                  <span className="text-sm sm:text-base">Home</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1.5 sm:gap-2 font-semibold">
                <LayoutDashboard className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">Dashboard</span>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-start sm:items-center justify-between">
          <div>
            <p className="pl-2 text-xs sm:text-sm md:text-base text-muted-foreground mt-1 flex items-center gap-1.5 sm:gap-2">
              <UserCircle className="h-4 w-4 text-green-500 sm:h-5 sm:w-5" />
              Selamat datang kembali,&nbsp;
              <span className="shine-text font-bold">
                {user?.name}!
              </span>
              <span className="hidden xs:inline">(Role: {user?.role})</span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Main Dashboard Content */}
      <DashboardAwalSalesOrder />
    </AdminLayout>
  );
}