"use client";

import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { useSession } from "@/components/clientSessionProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
// import { useRouter } from "next/navigation";
// import { useEffect } from "react";

export default function SuperLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession();
  // const router = useRouter();

  // useEffect(() => {
  //   if (!isLoading) {
  //     if (!user || user.role !== "super") {
  //       // router.push("/unauthorized");
  //     }
  //   }
  // }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Type guard untuk memastikan role valid
  if (!user || user.role !== "super") {
    return null;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {/* Type assertion atau pastikan role adalah 'super' */}
      <AdminPanelLayout role="super">
        <Toaster />
        {children}
      </AdminPanelLayout>
    </ThemeProvider>
  );
}