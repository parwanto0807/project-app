import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useStore } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { Menu } from "@/components/admin-panel/menu";
import { useSidebarToggle } from "@/hooks/use-sidebar-toggle";
import { SidebarToggle } from "@/components/admin-panel/sidebar-toggle";
import { useTheme } from "next-themes";

type SidebarProps = {
  role: "super" | "admin" | "pic" | "user";
};

export function Sidebar({ role }: SidebarProps) {
  const sidebar = useStore(useSidebarToggle, (state) => state);
  const { theme } = useTheme();

  if (!sidebar) return null;

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-51 h-screen -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300",
        sidebar.isOpen ? "w-[280px]" : "w-[100px]",
        "bg-background border-r"
      )}
    >
      <SidebarToggle isOpen={sidebar.isOpen} setIsOpen={sidebar.setIsOpen} />

      <div className="relative h-full flex flex-col px-3 py-4 overflow-y-auto">
        {/* Logo Section */}
        <div className="flex-shrink-0 mb-6">
          <Button
            variant="ghost"
            asChild
            className={cn(
              "w-full p-2 hover:bg-accent transition-colors",
              "rounded-lg"
            )}
          >
            <Link href="#" className="flex items-center justify-center">
              <div
                className={cn(
                  "flex items-center justify-center transition-all duration-300",
                  sidebar.isOpen ? "w-full" : "w-10"
                )}
              >
                <Image
                  src={sidebar.isOpen ? "/LogoMd.png" : "/LogoSM.png"}
                  alt="Rylif Mikro Mandiri"
                  width={sidebar.isOpen ? 160 : 40}
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
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 px-1">
          <Menu
            isOpen={sidebar.isOpen}
            role={role}
            theme={theme === "dark" || theme === "light" ? theme : "light"}
          />
        </div>
      </div>
    </aside>
  );
}