"use client";

import { PicLayout } from "@/components/admin-panel/pic-layout";
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
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useAutoLogout } from "@/hooks/use-auto-logout";
import { Home, LayoutDashboard, UserCircle } from "lucide-react";
import Link from "next/link";
import PICDashboard from "@/components/dashboard/pic/dashboard";
import { AdminLoading } from "@/components/admin-loading";

export default function PicPage() {
  const { user, isLoading: sessionLoading } = useSession();
  const { isAuthenticated, loading: authLoading, role: authRole } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useAutoLogout(86400);

  // ✅ PERBAIKAN: Combined loading state
  const isLoading = sessionLoading || authLoading;

  // ✅ PERBAIKAN: Better auth redirect logic
  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      console.log("🔍 Auth check for PIC:", {
        user: !!user,
        isAuthenticated,
        role: authRole,
        path: window.location.pathname
      });

      if (!user && !isAuthenticated) {
        router.push("/auth/login");
        return;
      }

      if (user && user.role !== "pic" && authRole !== "pic") {
        router.push("/unauthorized");
        return;
      }

      // ✅ Auth successful
      setIsChecking(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [user, isAuthenticated, authRole, isLoading, router]);

  // ✅ PERBAIKAN: Show loading selama checking
  if (isLoading || isChecking) {
    return <AdminLoading message="Preparing Dashboard Overview..." />;
  }

  // ✅ PERBAIKAN: Final auth check sebelum render
  if (!user || !isAuthenticated || (user.role !== "pic" && authRole !== "pic")) {
    return null;
  }

  // ✅ Get display name dan role dari multiple sources
  const displayName = user?.name || user?.username || user?.email?.split('@')[0] || 'User';
  const displayRole = user?.role || authRole || 'pic';

  return (
    <PicLayout title="Dashboard PIC" role={displayRole}>
      <div className="space-y-3 sm:space-y-4 mb-2 sm:mb-4 ml-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/pic-area" className="flex items-center gap-1.5 sm:gap-2 pl-2">
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
      <PICDashboard role={displayRole} />
    </PicLayout>
  );
}