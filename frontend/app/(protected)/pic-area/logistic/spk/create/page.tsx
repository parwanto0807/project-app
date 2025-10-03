"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useCurrentUser } from "@/hooks/use-current-user";
import CreateFormSPK from "@/components/spk/createFormData";
import { fetchAllSalesOrder } from "@/lib/action/sales/salesOrder";
import { getAllTeam } from "@/lib/action/master/team/getAllTeam";
import { fetchAllKaryawan } from "@/lib/action/master/karyawan";
import { AdminLoading } from "@/components/admin-loading";
import { PicLayout } from "@/components/admin-panel/pic-layout";

interface Karyawan {
  id: string;
  namaLengkap: string;
}

export default function CreateSpkPagePic() {
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
    if (user.role !== "pic") {
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
  if (userLoading || !user || user.role !== "pic") {
    return (
      <div>
        <AdminLoading message="Preparing SPK creation form..." />;
      </div>
    );
  }

  return (
    <PicLayout title="Create SPK" role="pic">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/pic-area">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/pic-area/logistic/spk">SPK List</Link>
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
    </PicLayout>
  );
}
