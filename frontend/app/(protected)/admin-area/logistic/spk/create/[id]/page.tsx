"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { fetchAllSalesOrderSPK } from "@/lib/action/sales/salesOrder";
import { getAllTeam } from "@/lib/action/master/team/getAllTeam";
import { fetchAllKaryawan } from "@/lib/action/master/karyawan";
import { AdminLoading } from "@/components/admin-loading";
import { SalesOrder } from "@/schemas";
import CreateFormSPKByIdSO from "@/components/spk/createFormDataSO";
import { useSession } from "@/components/clientSessionProvider";

interface Karyawan {
  id: string;
  namaLengkap: string;
}

export default function CreateSpkPageAdminSO() {
  const params = useParams()
  const { id } = params as { id: string }

  const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrder | null>(null)
  const { user, isLoading: userLoading } = useSession();
  const router = useRouter();
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [teams, setTeams] = useState([]);
  const [userCreated, setUserCreated] = useState<Karyawan[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);

  // Fetch semua data
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

    const fetchAllData = async () => {
      try {
        setIsDataLoading(true);

        // Fetch data secara parallel
        const [resultSO, resultTeam, resultUser] = await Promise.all([
          fetchAllSalesOrderSPK(),
          getAllTeam(),
          fetchAllKaryawan()
        ]);

        setSalesOrders(resultSO.data || []);
        setTeams(resultTeam.data || []);
        setUserCreated(resultUser.karyawan || []);
        setDataFetched(true);

      } catch (error) {
        console.error("Error fetching data:", error);
        setSalesOrders([]);
        setTeams([]);
        setUserCreated([]);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchAllData();
  }, [userLoading, user, router]);

  // Set data sales order yang dipilih setelah data selesai di-fetch
  useEffect(() => {
    if (dataFetched && salesOrders.length > 0 && id) {
      console.log("Searching for SO with ID:", id);
      console.log("Available SOs:", salesOrders.map(so => ({ id: so.id, soNumber: so.soNumber })));

      const foundOrder = salesOrders.find((so: SalesOrder) => so.id === id);
      console.log("Found order:", foundOrder);

      setSelectedSalesOrder(foundOrder || null);
    }
  }, [dataFetched, salesOrders, id]);

  // Loading akses
  if (userLoading || !user) {
    return (
      <div>
        <AdminLoading message="Checking authorization..." />
      </div>
    );
  }

  if (user.role !== "admin") {
    router.replace("/not-authorized");
    return null;
  }

  // Loading data
  if (isDataLoading) {
    return (
      <AdminLayout title="Create SPK from SO" role="admin">
        <div className="container mx-auto py-6">
          <AdminLoading message="Loading SPK creation form..." />
        </div>
      </AdminLayout>
    );
  }

  // Cek jika sales order tidak ditemukan
  if (dataFetched && (!selectedSalesOrder || !selectedSalesOrder.id)) {
    return (
      <AdminLayout title="Create SPK from SO" role="admin">
        <div className="container mx-auto py-6">
          <Breadcrumb className="mb-6">
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
                <BreadcrumbPage>Create</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <h2 className="text-2xl font-semibold text-red-600 mb-4">Sales Order Tidak Ditemukan</h2>
            <p className="text-muted-foreground mb-6">
              Sales Order dengan ID <strong>{id}</strong> tidak ditemukan atau mungkin telah dihapus.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/admin-area/sales/sales-order')}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Kembali ke Sales Orders
              </button>
              <button
                onClick={() => router.push('/admin-area/logistic/spk')}
                className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Kembali ke SPK List
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Create SPK from SO" role="admin">
      <div className="container mx-auto py-6">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin-area">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin-area/sales/salesOrder">Sales Order List</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Create from SO</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-6">
          <CreateFormSPKByIdSO
            salesOrders={salesOrders}
            teamData={teams}
            role={user.role}
            user={userCreated}
            isLoading={isDataLoading}
            preSelectedSalesOrderId={id}
          />
        </div>
      </div>
    </AdminLayout>
  );
}