"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SuperLayout } from "@/components/admin-panel/super-layout";
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
import { CreateSalesOrderForm } from "@/components/sales/salesOrder/createFormData";

import { fetchAllCustomers } from "@/lib/action/master/customer";

// 1. Definisikan tipe manual yang dibutuhkan oleh form
interface CustomerForForm {
  id: string;
  name: string;
  address?: string; // Tambahkan properti address jika diperlukan
}

// Tipe data untuk Project, bisa didefinisikan di sini jika belum ada global
interface Project {
  id: string;
  name: string;
}


interface RawCustomer {
  code: string;
  name: string;
  // Index signature untuk properti lain yang mungkin ada
  [key: string]: unknown;
}

// Data dummy untuk projects
const DUMMY_PROJECTS: Project[] = [
  { id: "99818779-1f51-4306-83a4-e3b7e438fc82", name: "Proyek IT Gedung Sentral" },
  { id: "a8ee3240-b12d-4130-9e14-104ae2129a4e", name: "Instalasi Jaringan Cabang Bekasi" },
];

export default function CreateSalesOrderPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const router = useRouter();

  // 3. Gunakan tipe baru tersebut untuk state Anda
  const [customers, setCustomers] = useState<CustomerForForm[]>([]);
  const projects = DUMMY_PROJECTS;
  const [isDataLoading, setIsDataLoading] = useState(true);

  // useEffect untuk otentikasi dan otorisasi (tidak berubah)
  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.role !== "super") {
      router.replace("/not-authorized");
      return;
    }
  }, [userLoading, user, router]);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const response = await fetchAllCustomers();

        if (response && response.customers) {
          // 2. Gunakan tipe 'RawCustomer' untuk menggantikan 'any'
          const formattedCustomers = response.customers.map((customer: RawCustomer) => ({
            ...customer,
            id: customer.id,
            name: customer.name,
          }));
          setCustomers(formattedCustomers);
        }
      } catch (error) {
        console.error("Gagal mengambil data customer:", error);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchCustomerData();
  }, []);

  // ... sisa komponen tidak berubah ...
  if (userLoading || !user || user.role !== "super") {
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
    <SuperLayout title="Create Sales Order" role="super">
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
              <Link href="/super-admin-area/sales/salesOrder">
                Sales Order List
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6">
        <CreateSalesOrderForm
          customers={customers}
          projects={projects}
          user={user}
          isLoading={isDataLoading}
        />
      </div>
    </SuperLayout>
  );
}