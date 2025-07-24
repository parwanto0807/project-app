import type { Metadata } from "next";
import "./globals.css";
import ClientSessionProvider from "@/components/clientSessionProvider";
import { cookies } from "next/headers"; // Untuk mengambil cookie dari request server

export const metadata: Metadata = {
  title: "IPL Cluster",
  description: "Manage IPL payments with ease and security.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies(); // Ambil cookie dari request
  const accessToken = cookieStore.get("token")?.value || null; // Ambil access token dari cookie

  let user = null;
  if (accessToken) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/user-login/profile`, {
        method: "GET",
        headers: {
          Cookie: `token=${accessToken}`, // Kirim access token ke backend
        },
        credentials: "include",
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
        {/* Kirim data user ke ClientSessionProvider */}
        <ClientSessionProvider initialUser={user}>
          {/* Bungkus aplikasi dengan SocketProvider */}
          {children}
        </ClientSessionProvider>
      </body>
    </html>
  );
}