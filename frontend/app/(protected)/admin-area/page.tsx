'use client';

import { AdminLayout } from "@/components/admin-panel/admin-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/clientSessionProvider";
import { useEffect } from "react";
import { useAutoLogout } from "@/hooks/use-auto-logout";
import DashboardAwalSalesOrder from "@/components/dashboard/admin/dashboard";
import { Home, LayoutDashboard, UserCircle } from "lucide-react";
import Link from "next/link";

// ✅ 1. IMPORT FIREBASE
import { messaging } from "@/lib/firebase";
import { getToken } from "firebase/messaging";

export default function DashboardPage() {
  const { user, isLoading } = useSession();
  const router = useRouter();

  useAutoLogout(86400);

  // ✅ 2. LOGIC AUTH & REDIRECT (Bawaan Anda)
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/auth/login");
    } else if (user.role !== "admin") {
      router.push("/unauthorized");
    }
  }, [user, isLoading, router]);

  // ✅ 3. LOGIC REQUEST NOTIFIKASI & TOKEN
  useEffect(() => {
    // Hanya jalankan jika user sudah terautentikasi (bukan loading, dan user ada)
    if (isLoading || !user) return;

    const setupFCM = async () => {
      try {
        // Cek support browser & messaging
        if (typeof window === "undefined" || !messaging) return;

        // Minta Izin
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
          console.log("🔔 Izin notifikasi diberikan.");

          // Ambil Token
          const token = await getToken(messaging, {
            // 👇 GANTI DENGAN KEY DARI FIREBASE CONSOLE -> PROJECT SETTINGS -> CLOUD MESSAGING -> WEB CONFIG
            vapidKey: process.env.VAPID_KEY,
          });

          if (token) {
            console.log("🔑 FCM Token User:", token);
            // Kirim token ke backend
            saveTokenToBackend(token, user.id); // Asumsi user object punya id
          }
        } else {
          console.log("🔕 Izin notifikasi ditolak.");
        }
      } catch (error) {
        console.error("❌ Error setup FCM:", error);
      }
    };

    setupFCM();
  }, [user, isLoading]); // Jalankan ulang jika status user berubah

  // ✅ 4. FUNGSI SIMPAN KE BACKEND (Placeholder)
  const saveTokenToBackend = async (token: string, userId: string | number) => {
    try {
      // Contoh implementasi fetch ke Node.js Backend Anda:
      /*
      await fetch('http://localhost:5000/api/notifications/save-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}` // Jika perlu auth header
        },
        body: JSON.stringify({
          token: token,
          userId: userId
        })
      });
      */
      console.log("✅ Token siap dikirim ke backend untuk User ID:", userId);
    } catch (err) {
      console.error("Gagal save token ke DB:", err);
    }
  };


  // --- RENDER UI ---

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <AdminLayout title="Dashboard Admin" role={user.role}>
      {/* Page Header */}
      <div className="space-y-3 sm:space-y-4 mb-2 sm:mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin-area" className="flex items-center gap-1.5 sm:gap-2 pl-2">
                  <Home className="h-4 w-4 text-gray-500 sm:h-4 sm:w-4" />
                  <span className="text-sm sm:text-base">Home</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1.5 sm:gap-2 font-semibold">
                <LayoutDashboard className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">Dashboard</span>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-start sm:items-center justify-between">
          <div>
            <p className="pl-2 text-xs sm:text-sm md:text-base text-muted-foreground mt-1 flex items-center gap-1.5 sm:gap-2">
              <UserCircle className="h-4 w-4 text-green-500 sm:h-5 sm:w-5" />
              Selamat datang kembali,&nbsp;
              <span className="shine-text font-bold">
                {user?.name}!
              </span>
              <span className="hidden xs:inline">(Role: {user?.role})</span>
            </p>
          </div>
        </div>
      </div>
      {/* Main Dashboard Content */}
      <DashboardAwalSalesOrder />
    </AdminLayout>
  );
}