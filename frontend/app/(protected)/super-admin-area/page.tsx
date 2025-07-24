'use client';

import { SuperLayout } from "@/components/admin-panel/super-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useEffect } from "react";
import { useAutoLogout } from "@/hooks/use-auto-logout";
import { LoadingScreen } from "@/components/ui/loading-gears";

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
    return null;
  }

  return (
    <SuperLayout title="Dashboard Super Admin"  role={user.role}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
        </BreadcrumbList>
      </Breadcrumb>
      <p>Selamat datang, {user?.name}! (Role: {user?.role})</p>
    </SuperLayout>
  );
}
