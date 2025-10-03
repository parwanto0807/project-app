"use client";

import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { BackToDashboardButton } from "@/components/backToDashboard";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role !== "user") {
      router.push("/unauthorized");
    }
  }, [user, loading, router]);

  if (loading || user?.role !== "user") return null;

  return (
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
  );
}
