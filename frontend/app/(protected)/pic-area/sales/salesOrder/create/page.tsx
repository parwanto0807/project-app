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
import { CreateSalesOrderForm } from "@/components/sales/salesOrder/createFormData";
import { fetchAllCustomers } from "@/lib/action/master/customer";
import { AdminLoading } from "@/components/admin-loading";
import { PicLayout } from "@/components/admin-panel/pic-layout";
import { useSession } from "@/components/clientSessionProvider";

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

export default function CreateSalesOrderPageAdmin() {
  const { user, isLoading: userLoading } = useSession();
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
    if (user.role !== "pic") {
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

  if (userLoading || !user || user.role !== "pic") {
    return <AdminLoading message="Preparing Sales Order creation form..." />;
  }

  return (
    <PicLayout title="Create Sales Order" role="pic">
      <div className="h-full flex flex-col min-h-0">
        <div className="flex-shrink-0 p-4 pb-0">
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
                  <Link href="/pic-area/sales/salesOrder">
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
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6">
          <CreateSalesOrderForm
            customers={customers}
            projects={projects}
            user={user}
            role={user.role}
            isLoading={isDataLoading}
          />
        </div>
      </div>
    </PicLayout>
  );
}