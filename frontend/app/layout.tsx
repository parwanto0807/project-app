// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import ClientSessionProvider from "@/components/clientSessionProvider";

export const metadata: Metadata = {
  title: "ProyekID",
  description: "A Trusted Platform for Construction Project Orders.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden">
        <ClientSessionProvider>
          {children}
        </ClientSessionProvider>
      </body>
    </html>
  );
}