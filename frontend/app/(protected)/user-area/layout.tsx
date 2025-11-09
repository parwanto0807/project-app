"use client";

import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { BackToDashboardButton } from "@/components/backToDashboard";
import { useSession } from "@/components/clientSessionProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.role !== "user") {
      router.push("/unauthorized");
    }
  }, [user, isLoading, router]);

  if (isLoading || user?.role !== "user") return null;

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
