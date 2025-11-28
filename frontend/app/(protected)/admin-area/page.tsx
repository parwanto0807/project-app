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
import { useAuth } from "@/contexts/AuthContext"; // ← TAMBAHKIN INI
import { useEffect, useState } from "react";
import { useAutoLogout } from "@/hooks/use-auto-logout";
import DashboardAwalSalesOrder from "@/components/dashboard/admin/dashboard";
import { Home, LayoutDashboard, UserCircle } from "lucide-react";
import Link from "next/link";
import { LoadingScreen } from "@/components/ui/loading-gears";

export default function DashboardPage() {
  const { user, isLoading: sessionLoading } = useSession();
  const { isAuthenticated, loading: authLoading, role } = useAuth(); // ← GUNAKAN AUTH CONTEXT
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useAutoLogout(86400);

  // ✅ PERBAIKAN: Combined loading state
  const isLoading = sessionLoading || authLoading;

  // ✅ PERBAIKAN: Better auth redirect logic
  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {

      if (!user && !isAuthenticated) {
        router.push("/auth/login");
        return;
      }

      if (user && user.role !== "admin" && role !== "admin") {
        router.push("/unauthorized");
        return;
      }

      // ✅ Auth successful
      setIsChecking(false);
    }, 300); // Delay 300ms untuk pastikan state sync

    return () => clearTimeout(timer);
  }, [user, isAuthenticated, role, isLoading, router]);

  // ✅ PERBAIKAN: Show loading selama checking
  if (isLoading || isChecking) {
    return <LoadingScreen />;
  }

  // ✅ PERBAIKAN: Final auth check sebelum render
  if (!user || !isAuthenticated || (user.role !== "admin" && role !== "admin")) {
    return null; // Akan di-redirect oleh useEffect
  }

  // ✅ Get display name dari multiple sources
  const displayName = user?.name || user?.username || user?.email?.split('@')[0] || 'User';
  const displayRole = user?.role || role || 'user';

  return (
    <AdminLayout title="Dashboard Admin" role={displayRole}>
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
                {displayName}!
              </span>
              <span className="hidden xs:inline">(Role: {displayRole})</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <DashboardAwalSalesOrder />
    </AdminLayout>
  );
}