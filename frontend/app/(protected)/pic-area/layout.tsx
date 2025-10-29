"use client";

import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { BackToDashboardButton } from "@/components/backToDashboard";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function PicLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCurrentUser();
  const router = useRouter();
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
      },
    },
  }));

  useEffect(() => {
    if (!loading && user?.role !== "pic") {
      router.push("/unauthorized");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user?.role !== "pic") {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AdminPanelLayout role={user?.role}>
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
    </QueryClientProvider>
  );
}