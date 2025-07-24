// types/layout.ts
export type LayoutProps = {
  title: string;
  role: "super" | "admin"; // Only the roles that can access these layouts
  children: React.ReactNode;
};