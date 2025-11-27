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
import { useEffect, useState } from "react"; // ✅ ADD useState
import { LoadingScreen } from "@/components/ui/loading-gears";
import DashboardAwalSalesOrder from "@/components/dashboard/super-admin/dashboard";
import { Home, LayoutDashboard, UserCircle } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/components/clientSessionProvider";

export default function DashboardPage() {
  const { user, isLoading } = useSession();
  const router = useRouter();
  const [debug, setDebug] = useState("initial"); // ✅ ADD debug state

  console.log("🎯 DashboardPage RENDER - user:", user);
  console.log("🔍 DashboardPage DEBUG state:", debug);

  useEffect(() => {
    setDebug("useEffect started");
    console.log("🔄 DashboardPage useEffect TRIGGERED");

    if (isLoading) {
      setDebug("still loading");
      console.log("⏳ Still loading...");
      return;
    }

    if (!user) {
      setDebug("no user - redirect to login");
      console.log("❌ No user - redirecting to login");
      router.push("/auth/login");
      return;
    }

    if (user.role !== "super") {
      setDebug(`wrong role: ${user.role} - redirect to unauthorized`);
      console.log(`🚫 Wrong role: ${user.role} - redirecting to unauthorized`);
      router.push("/unauthorized");
      return;
    }

    setDebug("user authenticated and authorized");
    console.log("✅ User authenticated and authorized:", user);
  }, [user, isLoading, router]);

  // ✅ ADD more detailed loading states
  if (isLoading) {
    console.log("🔄 Rendering LoadingScreen");
    return <LoadingScreen />;
  }

  if (!user || user.role !== "super") {
    console.log("🚫 Rendering null - user:", user ? user.role : "no user");
    return null;
  }

  // ✅ FINALLY RENDER CONTENT
  console.log("🎉 FINALLY RENDERING SUPER ADMIN CONTENT");
  console.log("USER ON PAGE SUPER ADMIN", user);

  return (
    <SuperLayout title="Dashboard Super Admin" role={user.role}>
      {/* SECTION: Page Header yang lebih elegan */}
      <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="#" className="flex items-center gap-1.5 sm:gap-2 pl-2">
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

      {/* Debug info */}
      <div className="mb-4 p-4 bg-green-100 border border-green-400 rounded">
        <h3 className="font-bold text-green-800">✅ DEBUG INFO</h3>
        <p>Status: {debug}</p>
        <p>User: {user ? `${user.name} (${user.role})` : 'None'}</p>
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
      </div>

      {/* ✅ Konten utama dashboard */}
      <DashboardAwalSalesOrder />
    </SuperLayout>
  );
}