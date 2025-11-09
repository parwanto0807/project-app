"use client";

import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { useSession } from "@/components/clientSessionProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SuperLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.role !== "super") {
      router.push("/unauthorized");
    }
  }, [user, isLoading, router]);

  if (isLoading || user?.role !== "super") return null;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AdminPanelLayout role={user?.role}>
        <Toaster />
        {children}
      </AdminPanelLayout>
    </ThemeProvider>
  );
}
