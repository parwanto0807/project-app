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
      <div className="space-y-3 sm:space-y-4 mb-2 sm:mb-4">
        <div className="flex items-start sm:items-center justify-between">
          <div>
            <p className="pl-1 text-sm sm:text-sm md:text-base text-muted-foreground my-1 flex items-center gap-1.5 sm:gap-2">
              <UserCircle className="h-6 w-6 text-green-500 sm:h-5 sm:w-5" />
              Selamat datang kembali,&nbsp;
              <span className="shine-text font-bold">
                {displayName}!
              </span>
              <span className="hidden xs:inline">(Role: {displayRole})</span>
            </p>
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