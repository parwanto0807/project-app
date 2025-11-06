import type { Metadata } from "next";
import "./globals.css";
import ClientSessionProvider from "@/components/clientSessionProvider";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "ProyekID",
  description: "A Trusted Platform for Construction Project Orders.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TAMBAHKAN AWAIT di sini
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("token")?.value || null;

  let user = null;
  if (accessToken) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/user-login/profile`, {
        method: "GET",
        headers: {
          Cookie: `token=${accessToken}`,
        },
        credentials: "include",
        next: { revalidate: 60 }
      });

      if (res.ok) {
        user = await res.json();
      } else {
        console.warn("❌ Gagal mengambil data user:", res.status);
      }
    } catch (error) {
      console.error("❌ Error fetching profile:", error);
    }
  }

  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden">
        <ClientSessionProvider initialUser={user}>
          {children}
        </ClientSessionProvider>
      </body>
    </html>
  );
}