import { Navbar } from "@/components/admin-panel/navbar";

interface ContentLayoutProps {
  title: string;
  role: "user";
  children: React.ReactNode;
}

export function UserLayout({ title, role, children }: ContentLayoutProps) {
  return (
    <div>
      <Navbar title={title} role={role} />
      <div className="max-h-screen pt-8 pb-8 px-2 sm:px-2">{children}</div>
    </div>
  );
}
