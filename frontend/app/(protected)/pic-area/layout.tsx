"use client";

import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useSession } from "@/components/clientSessionProvider"; // ✅ GUNAKAN useSession
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession(); // ✅ GUNAKAN useSession
  const router = useRouter();

  // Buat instance QueryClient hanya sekali
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    if (!isLoading && user?.role !== "pic") {
      router.push("/unauthorized");
    }
  }, [user, isLoading, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Check role setelah loading selesai
  if (user?.role !== "pic") {
    return null; // Router akan redirect ke /unauthorized
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AdminPanelLayout role={user.role}>
          <Toaster />
          {children}
        </AdminPanelLayout>
        {/* Devtools opsional, bisa dihapus di production */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}