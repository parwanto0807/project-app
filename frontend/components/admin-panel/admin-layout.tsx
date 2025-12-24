import { Navbar } from "@/components/admin-panel/navbar";
import type { User } from "@/hooks/use-current-user";

interface ContentLayoutProps {
  title: string;
  subtitle?: string;
  showBreadcrumb?: boolean;
  role: User["role"];
  children: React.ReactNode;
}

export function AdminLayout({ title, subtitle, role, children }: ContentLayoutProps) {
  return (
    <div>
      <Navbar title={title} subtitle={subtitle} role={role} />
      <div className="max-h-screen pt-4 pb-4 px-2 md:px-4 sm:px-2">{children}</div>
    </div>
  );
}
