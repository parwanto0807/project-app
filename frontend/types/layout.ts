// types/layout.ts
import type { User } from "@/hooks/use-current-user";

export type LayoutProps = {
  title: string;
  role: User["role"] // Only the roles that can access these layouts
  children: React.ReactNode;
};