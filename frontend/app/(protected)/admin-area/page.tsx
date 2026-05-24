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
      {/* Page Header with Enhanced Design */}
      <div className="space-y-4 sm:space-y-5 mb-4 sm:mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin-area" className="flex items-center gap-2 pl-2 hover:text-blue-600 transition-colors">
                  <Home className="h-4 w-4 text-gray-500 sm:h-4 sm:w-4" />
                  <span className="text-sm sm:text-base font-medium">Home</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-2 font-bold">
                <LayoutDashboard className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Dashboard</span>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-start sm:items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg shadow-green-500/30">
              <UserCircle className="h-6 w-6 text-white sm:h-7 sm:w-7" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                Selamat datang kembali,
              </p>
              <p className="text-lg sm:text-xl font-black bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
                {displayName}!
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Role: {displayRole}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <DashboardAwalSalesOrder />
    </AdminLayout>
  );
}