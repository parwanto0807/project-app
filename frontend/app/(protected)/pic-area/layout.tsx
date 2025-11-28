"use client";

import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useSession } from "@/components/clientSessionProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { LoadingScreen } from "@/components/ui/loading-gears";

// ✅ Import type Role dari file yang sesuai
type Role = "user" | "admin" | "super";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: sessionLoading } = useSession();
  const { isAuthenticated, loading: authLoading, role: authRole } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  const isLoading = sessionLoading || authLoading;

  // Buat instance QueryClient hanya sekali
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {

      if (!user && !isAuthenticated) {
        router.push("/auth/login");
        return;
      }

      if (user && user.role !== "pic" && authRole !== "pic") {
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

  if (!user || !isAuthenticated || (user.role !== "pic" && authRole !== "pic")) {
    return null;
  }

  // ✅ PERBAIKAN: Type casting yang aman untuk Role
  const displayRole: Role = (user?.role as Role) || (authRole as Role) || "pic";

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AdminPanelLayout role={displayRole}>
          <Toaster />
          {children}
        </AdminPanelLayout>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}