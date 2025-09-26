import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useStore } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { Menu } from "@/components/admin-panel/menu";
import { useSidebarToggle } from "@/hooks/use-sidebar-toggle";
import { SidebarToggle } from "@/components/admin-panel/sidebar-toggle";
import { useTheme } from "next-themes";
import { useEffect } from "react";

type SidebarProps = {
  role: "super" | "admin" | "pic" | "user";
};

export function Sidebar({ role }: SidebarProps) {
  const sidebar = useStore(useSidebarToggle, (state) => state);
  const { theme } = useTheme();

  useEffect(() => {
    // console.log("Current theme:", theme);
  }, [theme]);

  if (!sidebar) return null;

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-20 h-screen -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300",
        sidebar.isOpen ? "w-[280px]" : "w-[100px]"
      )}
    >
      <SidebarToggle isOpen={sidebar.isOpen} setIsOpen={sidebar.setIsOpen} />
      <div className="relative h-full flex flex-col px-2 py-4 overflow-y-auto shadow-md dark:shadow-zinc-800">

        {/* Logo */}
        <Button variant="link" asChild className="p-0 m-0">
          <Link href="#" className="w-full flex justify-center">
            <div
              className={cn(
                "mb-4 flex items-center justify-center w-full",
                "bg-white dark:bg-slate-300 rounded-2xl",
                "py-1 transition-all duration-300 mt-4",
                sidebar.isOpen ? "px-4" : "px-2"
              )}
            >
              <Image
                src={sidebar.isOpen ? "/LogoMd.png" : "/LogoSM.png"}
                alt="Rylif Mikro Mandiri"
                width={160}
                height={40}
                priority
                className={cn(
                  "object-contain transition-all duration-300",
                  sidebar.isOpen ? "w-full h-auto" : "w-10 h-auto"
                )}
              />
            </div>
          </Link>
        </Button>

        {/* Menu */}
        <div className="mt-6 px-1">
          <Menu
            isOpen={sidebar.isOpen}
            role={role}
            theme={theme === "dark" || theme === "light" ? theme : undefined}
          />
        </div>
      </div>
    </aside>
  );
}