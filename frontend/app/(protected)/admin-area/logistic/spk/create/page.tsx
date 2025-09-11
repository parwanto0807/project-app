"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { useCurrentUser } from "@/hooks/use-current-user";
import { Loader2 } from "lucide-react";
import CreateFormSPK from "@/components/spk/createFormData";

import { fetchAllSalesOrder } from "@/lib/action/sales/salesOrder";
import { getAllTeam } from "@/lib/action/master/team/getAllTeam";
import { fetchAllKaryawan } from "@/lib/action/master/karyawan";

interface Karyawan {
  id: string;
  namaLengkap: string;
}

export default function CreateSpkPageAdmin() {
  const { user, loading: userLoading } = useCurrentUser();
  const router = useRouter();
  const [salesOrders, setSalesOrders] = useState([]);
  const [teams, setTeams] = useState([]);
  const [userCreated, setUserCreated] = useState<Karyawan[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Cek otorisasi
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

    const fetchDataSalesOrder = async () => {
      const resultSO = await fetchAllSalesOrder();
      setSalesOrders(resultSO.salesOrders);
      setIsDataLoading(resultSO.isLoading);
    };

    fetchDataSalesOrder();

    const fetchDataTeam = async () => {
      const resultTeam = await getAllTeam();
      setTeams(resultTeam.data);
    };
    fetchDataTeam();

    const fetchDataUser = async () => {
      const resultUserCreated = await fetchAllKaryawan();
      setUserCreated(resultUserCreated.karyawan);
    }
    fetchDataUser()

  }, [userLoading, user, router]);

  // Ambil data SO + Tim


  // Loading akses
  if (userLoading || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading" />
          <span>Memeriksa akses...</span>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Create SPK" role="admin">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/super-admin-area">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/super-admin-area/spk">SPK List</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6">
        <CreateFormSPK
          salesOrders={salesOrders}
          teamData={teams}
          role={user.role}
          user={userCreated}
          isLoading={isDataLoading}
        />
      </div>
    </AdminLayout>
  );
}
