// admin-panel-layout.tsx
"use client";

import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/admin-panel/sidebar";
import { Inter as FontSans } from "next/font/google";
import { useStore } from "@/hooks/use-store";
import { useSidebarToggle } from "@/hooks/use-sidebar-toggle"; // 👈 penting!

const fontSans = FontSans({
  subsets: ["latin"],
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
