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
import CreateFormSPK from "@/components/spk/createFormData";
import { fetchAllSalesOrder } from "@/lib/action/sales/salesOrder";
import { getAllTeam } from "@/lib/action/master/team/getAllTeam";
import { fetchAllKaryawan } from "@/lib/action/master/karyawan";
import { AdminLoading } from "@/components/admin-loading";
import { PicLayout } from "@/components/admin-panel/pic-layout";
import { useSession } from "@/components/clientSessionProvider";

interface SalesOrder {
  id: string;
  soNumber: string;
  customer: { id: string, name: string, branch: string }
  project: { id: string, name: string }
  items: {
    id: string;
    product: { name: string };
    qty: number;
    uom: string;
  }[];
  status: "DRAFT" |
  "CONFIRMED" |
  "IN_PROGRESS_SPK" |
  "FULFILLED" |
  "PARTIALLY_INVOICED" |
  "INVOICED" |
  "PARTIALLY_PAID" |
  "PAID" |
  "CANCELLED";
}

interface Karyawan {
  id: string;
  namaLengkap: string;
}

export default function CreateSpkPagePic() {
  const { user, isLoading: userLoading } = useSession();
  const router = useRouter();
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
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
      try {
        // Set loading state sebelum fetch
        setIsDataLoading(true);

        const resultSO = await fetchAllSalesOrder();

        // Set data dari response
        setSalesOrders(resultSO.data || []);

        // Hapus baris ini karena resultSO tidak memiliki isLoading
        // setIsDataLoading(resultSO.isLoading);

      } catch (error) {
        console.error("Error fetching sales orders:", error);
        setSalesOrders([]); // Set empty array jika error
      } finally {
        // Set loading state menjadi false setelah selesai
        setIsDataLoading(false);
      }
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
    <div className="h-full flex flex-col min-h-0">
      <PicLayout title="Create SPK" role="pic">
        <div className="flex-shrink-0 px-4 pt-4">
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
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          <div className="space-y-4 p-2 md:p-4">
            <CreateFormSPK
              salesOrders={salesOrders}
              teamData={teams}
              role={user.role}
              user={userCreated}
              isLoading={isDataLoading}
            />
          </div>
        </div>
      </PicLayout>
    </div>
  );
}
