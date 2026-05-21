"use client";

import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useSession } from "@/components/clientSessionProvider";
import { useAuth } from "@/contexts/AuthContext"; // ← TAMBAHKAN INI
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BackToDashboardButton } from "@/components/backToDashboard";
import { LoadingScreen } from "@/components/ui/loading-gears"; // ← GUNAKAN LOADING CONSISTENT

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: sessionLoading } = useSession();
  const { isAuthenticated, loading: authLoading, role } = useAuth(); // ← KOMBINASI DENGAN AUTH CONTEXT
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // Buat instance QueryClient hanya sekali
  const [queryClient] = useState(() => new QueryClient());

  // ✅ PERBAIKAN: Combined loading state
  const isLoading = sessionLoading || authLoading;

  // ✅ PERBAIKAN: Better auth check dengan delay
  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      // (() => {})("🔍 AdminLayout Auth Check:", {
      //   hasUser: !!user,
      //   isAuthenticated,
      //   userRole: user?.role,
      //   authRole: role,
      //   path: window.location.pathname
      // });

      // ✅ Check multiple conditions dengan priority
      if (!user && !isAuthenticated) {
        // (() => {})("🚫 No authentication - redirect to login");
        router.push("/auth/login");
        return;
      }

      // ✅ Check role dari multiple sources
      const userRole = user?.role || role;
      if (userRole !== "admin") {
        (() => {})(`🚫 Not admin (role: ${userRole}) - redirect to unauthorized`);
        router.push("/unauthorized");
        return;
      }

      // ✅ Auth successful
      // (() => {})("");
      setIsChecking(false);
    }, 500); // ↑↑↑ INCREASE DELAY ↑↑↑

    return () => clearTimeout(timer);
  }, [user, isAuthenticated, role, isLoading, router]);

  // ✅ PERBAIKAN: Show consistent loading screen
  if (isLoading || isChecking) {
    return <LoadingScreen />;
  }

  // ✅ PERBAIKAN: Final guard sebelum render
  const userRole = user?.role || role;
  if (!user || !isAuthenticated || userRole !== "admin") {
    return null; // Will be redirected by useEffect
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AdminPanelLayout role={userRole}>
          <Toaster />
          {children}
          <div className="container mx-auto p-4 mt-6">
          </div>
          <BackToDashboardButton />
        </AdminPanelLayout>
        {/* Devtools opsional, bisa dihapus di production */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}