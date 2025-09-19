'use client';

import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCallback, useEffect, useState } from "react";
import { useAutoLogout } from "@/hooks/use-auto-logout";
import { LoadingScreen } from "@/components/ui/loading-gears";
import { UserCircle } from "lucide-react"
import DashboardUserSPK from "@/components/dashboard/user/dashboard";
import { SPK } from "@/types/spkReport";
import { fetchAllSpk, getSpkByEmail } from "@/lib/action/master/spk/spk";
import { toast } from "sonner";
import { fetchKaryawanByEmail } from "@/lib/action/master/karyawan";

export default function DashboardPage() {
  const { user, loading } = useCurrentUser();
  const [dataSpk, setDataSpk] = useState<SPK[]>([]);
  const router = useRouter();
  const [dataKarywanByEmail, setDataKarywanByEmail] = useState<string>('');

  const email = user?.email || '';
  const role = user?.role || '';
  const userId = dataKarywanByEmail || '';
  useAutoLogout(86400);

  const fetchData = useCallback(async () => {
    if (!email) {
      console.warn("Email user tidak tersedia");
      toast.error("Email pengguna tidak ditemukan");
      return;
    }

    try {

      let result: SPK[] = [];
      if (role === "admin" || role === 'super') {
        result = await fetchAllSpk();   // ✅ ambil semua SPK untuk admin/super
      } else {
        result = await getSpkByEmail(email); // ✅ user biasa hanya SPK yang assigned
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
    } finally {
    }
  }, [email, role]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/auth/login");
    } else if (user.role !== "user") {
      router.push("/unauthorized");
    }
    if (email) {
      fetchData(); // ✅ Aman dipanggil
    } else {
      console.warn("Email tidak tersedia, tidak dapat memuat SPK");
    }
  }, [user, loading, router, fetchData, email]);

  if (loading) return <LoadingScreen />;

  if (!user || user.role !== "user") {
    return null;
  }

  return (
    <AdminLayout title="Dashboard User" role={user.role}>
      {/* Page Header */}
      <div className="space-y-3 sm:space-y-4 mb-2 sm:mb-4">
        <div className="flex items-start sm:items-center justify-between">
          <div>
            {/* <h1 className="pl-2 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              Dashboard Admin
            </h1> */}
            <p className="pl-1 text-sm sm:text-sm md:text-base text-muted-foreground my-1 flex items-center gap-1.5 sm:gap-2">
              <UserCircle className="h-6 w-6 text-green-500 sm:h-5 sm:w-5" />
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
      <DashboardUserSPK
        dataSpk={dataSpk}
        userEmail={email}
        role={role}
        userId={userId}
      />
    </AdminLayout>
  );
}