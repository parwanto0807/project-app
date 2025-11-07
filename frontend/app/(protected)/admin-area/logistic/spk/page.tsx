"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { fetchAllSpk, deleteSpk } from "@/lib/action/master/spk/spk";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import TabelDataSpk from "@/components/spk/tabelData";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import ioClient from "socket.io-client";



// Import tipe SPK dari file yang sesuai atau definisikan ulang
// Berdasarkan error, SPK memiliki properti: spkNumber, spkDate, salesOrderId, teamId, dan 6 properti lainnya
interface SPK {
  id: string;
  spkNumber: string;
  spkDate: Date;
  salesOrderId: string;
  teamId: string;
  createdById: string;
  progress: number;
  createdBy: {
    id: string;
    namaLengkap: string;
    jabatan?: string | null;
    nik?: string | null;
    departemen?: string | null;
  };

  salesOrder: {
    id: string;
    soNumber: string;
    projectName: string;
    customer: {
      name: string;      // diisi dari customer.name
      address: string;   // ✅ baru
      branch: string;    // ✅ baru
    }
    project?: {
      id: string;
      name: string;
    };
    items: {
      id: string;
      lineNo: number;
      itemType: string;
      name: string;
      description?: string | null;
      qty: number;
      uom?: string | null;
      unitPrice: number;
      discount: number;
      taxRate: number;
      lineTotal: number;
    }[];
  };

  team?: {
    id: string;
    namaTeam: string;
    teamKaryawan?: {
      teamId: string;
      karyawan?: {
        id: string;
        namaLengkap: string;
        jabatan: string;
        departemen: string;
      };
    };
  } | null;

  details: {
    id: string;
    karyawan?: {
      id: string;
      namaLengkap: string;
      jabatan: string;
      departemen: string;
      nik: string;
    };
    salesOrderItemSPK?: {
      id: string;
      name: string;
      description?: string;
      qty: number;
      uom?: string | null;
    };
    lokasiUnit?: string | null;
  }[];

  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const io = ioClient;
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
  transports: ["websocket"],
  autoConnect: true,
});

export default function SpkPageAdmin() {
  const [dataSpk, setDataSpk] = useState<SPK[]>([]);
  const { user, loading: userLoading } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await fetchAllSpk();
      setDataSpk(result);
    } catch (error) {
      console.error("Error fetching SPK data:", error);
      toast.error("Gagal memuat data SPK");
    } finally {
      setIsLoading(false);
    }
  }, []);

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

    fetchData();
  }, [user, userLoading, fetchData, router]);

  // ✅ Realtime Update
  useEffect(() => {
    // Log ketika socket berhasil tersambung
    socket.on("connect", () => {
      console.log("✅ Socket connected to server");
    });

    const handler = () => {
      console.log("Realtime: SPK updated → refresh data");
      fetchData();
    };

    socket.on("spk_updated", handler);

    return () => {
      socket.off("spk_updated", handler);
    };
  }, [fetchData]);


  const handleDeleteSpk = async (spkId: string) => {
    try {
      // const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus SPK ini?");
      // if (!confirmDelete) return;

      // Simpan data sebelumnya untuk fallback jika gagal
      const previousData = dataSpk;

      // Optimistic update: langsung hapus dari UI
      setDataSpk(prevData => prevData.filter(spk => spk.id !== spkId));

      const result = await deleteSpk(spkId);

      if (!result.success) {
        // Jika gagal, kembalikan data sebelumnya
        setDataSpk(previousData);
        toast.error(result.message || "Gagal menghapus SPK");
        return;
      }

      toast.success(result.message || "SPK berhasil dihapus");

    } catch (error) {
      console.error("Error deleting SPK:", error);
      toast.error("Terjadi kesalahan saat menghapus SPK");
    }
  };
  const layoutProps: LayoutProps = {
    title: "Logistic Management",
    role: "admin",
    children: (
      <>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Badge variant="outline">
                  <Link href="/admin-area">Dashboard</Link>
                </Badge>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Badge variant="outline">
                  <BreadcrumbPage>SPK Management</BreadcrumbPage>
                </Badge>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Badge variant="outline">
                <BreadcrumbPage>SPK List</BreadcrumbPage>
              </Badge>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="h-full w-full">
          <div className="flex-1 space-y-2 p-1 pt-4 md:p-2">
            <TabelDataSpk
              dataSpk={dataSpk}
              isLoading={isLoading}
              role={user?.role}
              onDeleteSpk={handleDeleteSpk}
            />
          </div>
        </div>
      </>
    ),
  };

  return <AdminLayout {...layoutProps} />;
}