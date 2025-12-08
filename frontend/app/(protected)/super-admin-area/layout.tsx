"use client";

import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { useSession } from "@/components/clientSessionProvider";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingScreen } from "@/components/ui/loading-gears";
import { SocketProvider } from "@/contexts/SocketContext";

// ✅ Import type Role dari file yang sesuai
type Role = "user" | "admin" | "super";

export default function SuperLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: sessionLoading } = useSession();
  const { isAuthenticated, loading: authLoading, role: authRole } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  const isLoading = sessionLoading || authLoading;

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      // Cek apakah user login
      if (!user && !isAuthenticated) {
        router.replace("/auth/login");
        return;
      }

      // Cek apakah role sesuai (Super Admin)
      if (user && user.role !== "super" && authRole !== "super") {
        router.replace("/unauthorized");
        return;
      }

      setIsChecking(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [user, isAuthenticated, authRole, isLoading, router]);

  if (isLoading || isChecking) {
    return <LoadingScreen />;
  }

  // Double check sebelum render untuk keamanan
  if (!user || !isAuthenticated || (user.role !== "super" && authRole !== "super")) {
    return null;
  }

  // ✅ PERBAIKAN: Type casting yang aman untuk Role
  const displayRole: Role = (user?.role as Role) || (authRole as Role) || "super";

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {/* 🔥 SocketProvider diletakkan di SINI (membungkus AdminPanelLayout).
          Ini memastikan socket hanya aktif jika user berhasil masuk ke layout ini (Authenticated & Role Super).
      */}
      <SocketProvider>
        <AdminPanelLayout role={displayRole}>
          <Toaster />
          {children}
        </AdminPanelLayout>
      </SocketProvider>
    </ThemeProvider>
  );
}