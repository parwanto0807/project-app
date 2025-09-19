import { ModeToggle } from "../mode-toggle";
import { UserNav } from "@/components/admin-panel/user-nav";
import { SheetMenu } from "@/components/admin-panel/sheet-menu";
import type { User } from "@/hooks/use-current-user";

interface NavbarProps {
  title: string;
  role: User["role"];
}

export function Navbar({ title, role }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 md:z-10 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-secondary">
      <div className="mx-4 sm:mx-8 flex h-20 items-center">
        <div className="flex items-center space-x-4 lg:space-x-0">
          <SheetMenu role={role} />
          <h1 className="pl-1 pb-1 uppercase font-semibold text-xs md:text-lg md:pl-4 md:pb-3 sm:text-lg sm:pl-4 sm:pb-3">{title}</h1>
        </div>
        <div className="flex flex-1 items-center space-x-2 justify-end">
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
