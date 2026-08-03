'use client';

import { useRouter } from "next/navigation";
import { useSession } from "@/components/clientSessionProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { useAutoLogout } from "@/hooks/use-auto-logout";
import { LoadingScreen } from "@/components/ui/loading-gears";
import { UserCircle } from "lucide-react"
import DashboardUserSPK from "@/components/dashboard/user/dashboard";
import { SPK } from "@/types/spkReport";
import { fetchAllSpk, getSpkByEmail } from "@/lib/action/master/spk/spk";
import { toast } from "sonner";
import { fetchKaryawanByEmail } from "@/lib/action/master/karyawan";
import { UserLayout } from "@/components/admin-panel/user-layout";

export default function DashboardPage() {
  const { user, isLoading: sessionLoading } = useSession();
  const { isAuthenticated, loading: authLoading, role: authRole } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [dataSpk, setDataSpk] = useState<SPK[]>([]);
  const [dataKarywanByEmail, setDataKarywanByEmail] = useState<string>('');

  useAutoLogout(86400);

  // ✅ PERBAIKAN: Combined loading state
  const isLoading = sessionLoading || authLoading;

  const email = user?.email || '';
  const role = user?.role || authRole || '';
  const userId = dataKarywanByEmail || '';

  const fetchData = useCallback(async () => {
    if (!email) {
      console.warn("Email user tidak tersedia");
      toast.error("Email pengguna tidak ditemukan");
      return;
    }

    try {
      let result: SPK[] = [];
      if (role === "admin" || role === 'super') {
        result = await fetchAllSpk();
      } else {
        result = await getSpkByEmail(email);
      }

      setDataSpk(result);

      const karyawan = await fetchKaryawanByEmail(email);
      if (karyawan) {
        setDataKarywanByEmail(karyawan.user.id);
      } else {
        setDataKarywanByEmail("");
        console.warn("⚠️ Karyawan dengan email", email, "tidak ditemukan di database");
      }

    } catch (error) {
      console.error("Error fetching SPK:", error);
      toast.error("Gagal memuat data SPK");
    }
  }, [email, role]);

  // ✅ PERBAIKAN: Better auth redirect logic
  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (!user && !isAuthenticated) {
        router.push("/auth/login");
        return;
      }

      if (user && user.role !== "user" && role !== "user") {
        router.push("/unauthorized");
        return;
      }

      // ✅ Auth successful
      setIsChecking(false);

      // Fetch data setelah auth berhasil
      if (email) {
        fetchData();
      } else {
        console.warn("Email tidak tersedia, tidak dapat memuat SPK");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [user, isAuthenticated, role, isLoading, router, email, fetchData]);

  // ✅ PERBAIKAN: Show loading selama checking
  if (isLoading || isChecking) {
    return <LoadingScreen />;
  }

  // ✅ PERBAIKAN: Final auth check sebelum render
  if (!user || !isAuthenticated || (user.role !== "user" && role !== "user")) {
    return null;
  }

  // ✅ Get display name dari multiple sources
  const displayName = user?.name || user?.username || user?.email?.split('@')[0] || 'User';
  const displayRole = user?.role || authRole || 'user';

  return (
    <UserLayout title="Dashboard User" role={displayRole}>
      {/* Page Header */}
      <div className="mt-1 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
            <UserCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">Selamat datang kembali,</p>
            <p className="text-base font-bold text-foreground leading-tight">{displayName}</p>
          </div>
        </div>
      </div>
      {/* Main Dashboard Content */}
      <DashboardUserSPK
        dataSpk={dataSpk}
        role={displayRole}
        userId={userId}
      />
    </UserLayout>
  );
}