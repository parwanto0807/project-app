"use client";

import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  // Buat instance QueryClient hanya sekali
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    if (!loading && user?.role !== "admin") {
      router.push("/unauthorized");
    }
  }, [user, loading, router]);

  if (loading || user?.role !== "admin") return null;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AdminPanelLayout role={user?.role}>
          <Toaster />
          {children}
        </AdminPanelLayout>
        {/* Devtools opsional, bisa dihapus di production */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
