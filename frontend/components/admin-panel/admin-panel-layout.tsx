// admin-panel-layout.tsx
"use client";

import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/admin-panel/sidebar";
import { useStore } from "@/hooks/use-store";
import { useSidebarToggle } from "@/hooks/use-sidebar-toggle"; // 👈 penting!
import localFont from "next/font/local";

const fontSans = localFont({
  src: [
    {
      path: "../../public/fonts/Poppins-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Poppins-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Poppins-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/Poppins-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sans",
});

type Role = "super" | "admin" | "pic" | "user";

type AdminPanelLayoutProps = {
  children: React.ReactNode;
  role: Role;
};

export default function AdminPanelLayout({ children, role }: AdminPanelLayoutProps) {
  const sidebar = useStore(useSidebarToggle, (state) => state); // ambil state sidebar

  return (
    <div className="flex flex-col min-h-screen">
      <Sidebar role={role} />
      <div
        className={cn(
          "flex flex-col flex-grow transition-all duration-300",
          fontSans.variable,
          sidebar?.isOpen
            ? "ml-0 lg:ml-72"
            : "ml-0 lg:ml-[90px]"

        )}
      >
        <main className="flex-grow">{children}</main>
      </div>
    </div>
  );
}
