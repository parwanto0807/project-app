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
import { useEffect, useState } from "react";
import { LoadingScreen } from "@/components/ui/loading-gears";
import DashboardAwalSalesOrder from "@/components/dashboard/super-admin/dashboard";
import { Home, LayoutDashboard, UserCircle } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/components/clientSessionProvider";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const { user, isLoading: sessionLoading } = useSession();
  const { isAuthenticated, loading: authLoading, role: authRole } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // ✅ PERBAIKAN: Combined loading state
  const isLoading = sessionLoading || authLoading;

  // ✅ PERBAIKAN: Better auth redirect logic
  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      console.log("🔍 Auth check for Super Admin:", {
        user: !!user,
        isAuthenticated,
        role: authRole,
        path: window.location.pathname
      });

      if (!user && !isAuthenticated) {
        console.log("🚫 No user & not authenticated - redirect to login");
        router.push("/auth/login");
        return;
      }

      if (user && user.role !== "super" && authRole !== "super") {
        console.log("🚫 Not Super Admin - redirect to unauthorized");
        router.push("/unauthorized");
        return;
      }

      // ✅ Auth successful
      console.log("✅ Auth successful for Super Admin - showing dashboard");
      setIsChecking(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [user, isAuthenticated, authRole, isLoading, router]);

  // ✅ PERBAIKAN: Show loading selama checking
  if (isLoading || isChecking) {
    return <LoadingScreen />;
  }

  // ✅ PERBAIKAN: Final auth check sebelum render
  if (!user || !isAuthenticated || (user.role !== "super" && authRole !== "super")) {
    return null;
  }

  // ✅ Get display name dan role dari multiple sources
  const displayName = user?.name || user?.username || user?.email?.split('@')[0] || 'Super Admin';
  const displayRole = user?.role || authRole || 'super';

  return (
    <SuperLayout title="Dashboard Super Admin" role={displayRole}>
      {/* SECTION: Page Header */}
      <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/super-admin-area" className="flex items-center gap-1.5 sm:gap-2 pl-2">
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

      {/* ✅ Konten utama dashboard */}
      <DashboardAwalSalesOrder />
    </SuperLayout>
  );
}