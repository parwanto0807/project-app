"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import { UpdateBAPForm } from "@/components/bap/updateFormData";
import { fetchAllSalesOrderInvoice } from "@/lib/action/sales/salesOrder";
import { fetchAllKaryawan } from "@/lib/action/master/karyawan";
import { getBAPById } from "@/lib/action/bap/bap";
import { Karyawan } from "@/lib/validations/karyawan";
import { AdminLoading } from "@/components/admin-loading";
import { useSession } from "@/components/clientSessionProvider";

export interface Customer {
  id: string;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  address?: string | null;
  branch?: string | null;
}

export interface Project {
  id: string;
  customerId: string;
  name: string;
  location: string | null;
  createdAt: string;
}

export interface SPK {
  spkNumber: string;
  id: string;
}

export interface User {
  id: string;
  email: string;
  password?: string | null;
  name: string;
  mfaSecret?: string | null;
}

export interface SalesOrderItem {
  id: string;
  salesOrderId: string;
  productId: string;
  qty: number;
  price: number;
  discount?: number;
  total: number;
}

export interface SalesOrder {
  id: string;
  soNumber: string;
  soDate: string;
  projectId: string;
  customerId: string;
  userId: string;
  type: "REGULAR" | "OTHER";
  status: "DRAFT" | "IN_PROGRESS_SPK" | "COMPLETED" | string;
  isTaxInclusive: boolean;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  grandTotal: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  customer: Customer;
  project: Project;
  spk: SPK[];
  items: SalesOrderItem[];
  user: User;
}

export interface SpkFieldReport {
  id: string;
  spkId: string;
  userId: string;
  reportDate: string;
  description: string;
  location: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BAPPhoto {
  photoUrl: string;
  category: "BEFORE" | "PROCESS" | "AFTER";
  caption?: string;
}

export default function CreateBAPPage() {
  const { user, isLoading: userLoading } = useSession();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const bapId = params?.id;

  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [users, setUsers] = useState<Karyawan[]>([]);
  const [isLoading, setIsLoading] = useState(true);


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
        setIsLoading(true);
        const [salesOrderRes, usersRes, bapRes] = await Promise.all([
          fetchAllSalesOrderInvoice(),
          fetchAllKaryawan(),
          bapId ? getBAPById(bapId) : Promise.resolve({ success: false, data: null })
        ]);

        if (bapId && (!bapRes.success || !bapRes.data)) {
          throw new Error("BAP not found");
        }

        setSalesOrders(salesOrderRes.salesOrders || []);
        setUsers(usersRes.karyawan || []);
        // setBapData(bapRes.data); // Uncomment jika perlu

      } catch (err) {
        console.error("Failed to fetch data:", err);
        router.replace("/admin-area/logistic/bap");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [router, user, userLoading, bapId]);

  if (userLoading || isLoading) {
    return <AdminLoading message={userLoading ? "Checking authentication..." : "Loading BAP data..."} />;
  }

  const layoutProps: LayoutProps = {
    title: "Create BAP",
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
                  <Link href="/admin-area/logistic/bap">BAST List</Link>
                </Badge>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Badge variant="outline">
                <BreadcrumbPage>Update BAST</BreadcrumbPage>
              </Badge>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="h-full w-full">
          <div className="flex-1 space-y-2 p-2 pt-1 md:p-4">
            <UpdateBAPForm
              currentUser={{
                id: user?.id || "",
                name: user?.name || "Unknown User",
              }}
              bapDataById={bapId}
              salesOrders={salesOrders}
              users={users}
            />
          </div>
        </div>
      </>
    ),
  };

  return <AdminLayout {...layoutProps} />;
}
