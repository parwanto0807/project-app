"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Loader2 } from "lucide-react";
import FormUpdateSpk from "@/components/spk/updateFormData";

// Import fungsi fetch
import { fetchSpkById } from "@/lib/action/master/spk/spk"; // 👈 Anda harus buat ini
import { fetchAllSalesOrder } from "@/lib/action/sales/salesOrder";
import { getAllTeam } from "@/lib/action/master/team/getAllTeam";
import { fetchAllKaryawan } from "@/lib/action/master/karyawan";
import { SalesOrder } from "@/schemas";
import { useSession } from "@/components/clientSessionProvider";

interface Karyawan {
  id: string;
  namaLengkap: string;
}

interface SPK {
  id: string;
  spkNumber: string;
  spkDate: Date;
  salesOrderId: string | null;
  teamId: string | null;
  notes: string | null;
  details: SpkDetail[];
  createdById: string;
  progress: number;
}

interface SpkDetail {
  id: string;
  karyawanId: string | null;
  salesOrderItemId: string | null;
  lokasiUnit: string | null;
}

export default function UpdateSpkPage() {
  const { user, isLoading: userLoading } = useSession();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const spkId = params?.id;

  const [spk, setSpk] = useState<SPK | null>(null);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [teams, setTeams] = useState<[]>([]);
  const [karyawans, setKaryawans] = useState<Karyawan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cek otorisasi & fetch data
  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/not-authorized");
      return;
    }

    if (!spkId) {
      router.replace("/admin-area/logistic/spk");
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch SPK by ID
        const spkResult = await fetchSpkById(spkId);
        // if (!spkResult || !spkResult) {
        //   return;
        // }
        setSpk(spkResult);
        const soResult = await fetchAllSalesOrder();
        setSalesOrders(soResult.salesOrders || []);
        const teamResult = await getAllTeam();
        setTeams(teamResult.data || []);
        const karyawanResult = await fetchAllKaryawan();
        setKaryawans(karyawanResult.karyawan);

      } catch (error) {
        console.error("Error fetching data:", error);
        router.replace("/admin-area/logistic/spk");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userLoading, user, router, spkId]);

  // Loading akses atau data
  if (userLoading || !user || user.role !== "admin" || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading" />
          <span>{isLoading ? "Memuat data SPK..." : "Memeriksa akses..."}</span>
        </div>
      </div>
    );
  }

  if (!spk) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-destructive">SPK tidak ditemukan</div>
      </div>
    );
  }

  return (
    <AdminLayout title={`Edit SPK: ${spk.spkNumber}`} role="admin">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin-area">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin-area/logistic/spk">SPK List</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6">
        <FormUpdateSpk
          user={karyawans}
          spk={spk}
          salesOrders={salesOrders}
          teams={teams}
          isLoading={isLoading}
          role={user.role}
        />
      </div>
    </AdminLayout>
  );
}