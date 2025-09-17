import { Navbar } from "@/components/admin-panel/navbar";
import type { User } from "@/hooks/use-current-user";

interface ContentLayoutProps {
  title: string;
  role: User["role"];
  children: React.ReactNode;
}

export function AdminLayout({ title, role, children }: ContentLayoutProps) {
  return (
    <div>
      <Navbar title={title} role={role} />
      <div className="max-h-screen pt-4 pb-4 px-2 md:px-4 sm:px-2">{children}</div>
    </div>
  );
}
