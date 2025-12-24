import { Navbar } from "@/components/admin-panel/navbar";
import { User } from "@/hooks/use-current-user";

interface ContentLayoutProps {
  title: string;
  subtitle?: string;
  showBreadcrumb?: boolean;
  role: User["role"];
  children: React.ReactNode;
}

export function PicLayout({ title, subtitle, role, children }: ContentLayoutProps) {
  return (
    <div>
      <Navbar title={title} subtitle={subtitle} role={role} />
      <div className="max-h-screen pt-8 pb-8 px-2 sm:px-2">{children}</div>
    </div>
  );
}
