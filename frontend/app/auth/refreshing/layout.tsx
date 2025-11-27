import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Memperbarui Sesi - ProyekID",
  description: "Memperbarui sesi keamanan pengguna",
};

export default function RefreshingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}