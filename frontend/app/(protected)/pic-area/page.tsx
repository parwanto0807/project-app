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
import { useEffect } from "react";
import { useAutoLogout } from "@/hooks/use-auto-logout";
import { Home, LayoutDashboard, UserCircle } from "lucide-react";
import Link from "next/link";
import PICDashboard from "@/components/dashboard/pic/dashboard";
import { AdminLoading } from "@/components/admin-loading";
import { useSession } from "@/components/clientSessionProvider";

export default function PicPage() {
  const { user, isLoading } = useSession();
  const router = useRouter();

  useAutoLogout(86400);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/auth/login");
    } else if (user.role !== "pic") {
      router.push("/unauthorized");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <AdminLoading message="Preparing Dashboard Overview..." />;
  }
  if (!user || user.role !== "pic") {
    return null;
  }

  return (
    <PicLayout title="Dashboard PIC" role={user.role} >
      <div className="space-y-3 sm:space-y-4 mb-2 sm:mb-4 ml-3">
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
            {/* <h1 className="pl-2 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              Dashboard Admin
            </h1> */}
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
      <PICDashboard role={user.role} />
    </PicLayout >
  );
}
