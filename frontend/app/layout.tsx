// app/layout.tsx - UPDATED WITH PWA SUPPORT
import type { Metadata } from "next";
import "./globals.css";
import ClientSessionProvider from "@/components/clientSessionProvider";
import { NotificationProvider } from '@/contexts/NotificationContext';
import FCMInitializer from '@/components/FCMInitializer';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

export const metadata: Metadata = {
  title: "ProyekID",
  description: "A Trusted Platform for Construction Project Orders.",
  manifest: "/manifest.json", // ✅ IMPORTANT: Link to manifest
  themeColor: "#000000", // ✅ Sesuai dengan manifest
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ProyekID",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
        <meta name="googlebot" content="notranslate" />
        
        {/* ✅ PWA ESSENTIAL META TAGS */}
        <meta name="application-name" content="ProyekID" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ProyekID" />
        <meta name="description" content="A Trusted Platform for Construction Project Orders." />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#000000" />
        
        {/* ✅ APPLE TOUCH ICONS */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png" />
        
        {/* ✅ FAVICON & ICONS */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* ✅ MS APPLICATION */}
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        
        {/* ✅ MANIFEST (sudah di metadata, tapi double untuk safety) */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen overflow-x-hidden" suppressHydrationWarning>
        <ClientSessionProvider>
          <NotificationProvider>
            <FCMInitializer />
            {children}
            {/* ✅ PWA INSTALL PROMPT */}
            <PWAInstallPrompt />
          </NotificationProvider>
        </ClientSessionProvider>
      </body>
    </html>
  );
}