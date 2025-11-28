"use client";

import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { BackToDashboardButton } from "@/components/backToDashboard";
import { useSession } from "@/components/clientSessionProvider";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingScreen } from "@/components/ui/loading-gears";

// ✅ Tambahkan type Role jika belum ada
type Role = "user" | "admin" | "super";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: sessionLoading } = useSession();
  const { isAuthenticated, loading: authLoading, role: authRole } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  const isLoading = sessionLoading || authLoading;

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (!user && !isAuthenticated) {
        router.push("/auth/login");
        return;
      }

      if (user && user.role !== "user" && authRole !== "user") {
        router.push("/unauthorized");
        return;
      }

      setIsChecking(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [user, isAuthenticated, authRole, isLoading, router]);

  if (isLoading || isChecking) {
    return <LoadingScreen />;
  }

  if (!user || !isAuthenticated || (user.role !== "user" && authRole !== "user")) {
    return null;
  }

  // ✅ PERBAIKAN: Type casting yang aman untuk role
  const displayRole: Role = (user?.role as Role) || (authRole as Role) || "user";

  return (
    <AdminPanelLayout role={displayRole}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Toaster />
        {children}
        <BackToDashboardButton />
      </ThemeProvider>
    </AdminPanelLayout>
  );
}