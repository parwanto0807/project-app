// app/layout.tsx - UPDATED WITH PWA SUPPORT
import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientSessionProvider from "@/components/clientSessionProvider";
import { NotificationProvider } from '@/contexts/NotificationContext';
import FCMInitializer from '@/components/FCMInitializer';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "ProyekID",
  description: "A Trusted Platform for Construction Project Orders.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ProyekID",
  },
  // ✅ Move application-name and format-detection here
  applicationName: "ProyekID",
  formatDetection: {
    telephone: false,
  },
  // ✅ Additional metadata for better PWA support
  keywords: ["construction", "projects", "platform"],
  authors: [{ name: "ProyekID Team" }],
  // ✅ Open Graph for social sharing
  openGraph: {
    type: "website",
    title: "ProyekID",
    description: "A Trusted Platform for Construction Project Orders.",
    siteName: "ProyekID",
  },
};

// ✅ Properly typed viewport export
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
  // ✅ Additional viewport properties for PWA
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <meta name="google" content="notranslate" />
        <meta name="googlebot" content="notranslate" />

        {/* ✅ OPTIMIZED PWA META TAGS */}
        {/* theme-color is now handled by viewport export */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ProyekID" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* ✅ APPLE TOUCH ICONS - Improved sizes */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167x167.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/icon-120x120.png" />

        {/* ✅ FAVICON & ICONS - Complete set */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon.ico" />

        {/* ✅ MS APPLICATION ICONS */}
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* ✅ SPLASH SCREENS for iOS */}
        <link rel="apple-touch-startup-image" href="/splash/iphone5_splash.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone6_splash.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/iphoneplus_splash.png" media="(device-width: 621px) and (device-height: 1104px) and (-webkit-device-pixel-ratio: 3)" />

        {/* ✅ MANIFEST */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className="min-h-screen overflow-x-hidden"
        suppressHydrationWarning
        // ✅ Add CSS to prevent scroll issues
        style={{ scrollBehavior: 'auto' }}
      >
        <AuthProvider>
          {/* Session provider mungkin butuh info auth */}
          <ClientSessionProvider>
            {/* Notification mungkin butuh auth untuk FCM */}
            <NotificationProvider>
              <FCMInitializer />
              {children}
              <PWAInstallPrompt />
            </NotificationProvider>
          </ClientSessionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}