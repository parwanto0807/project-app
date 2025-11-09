"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation"; // ✅ Added useParams
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
import { UpdateInvoiceForm } from "@/components/invoice/updateFormData";
import { fetchAllSalesOrder } from "@/lib/action/sales/salesOrder";
import { fetchAllKaryawan } from "@/lib/action/master/karyawan";
import { Karyawan } from "@/lib/validations/karyawan";
import { AdminLoading } from "@/components/admin-loading";
import { SalesOrder } from "@/schemas";
import { getBankAccounts } from "@/lib/action/master/bank/bank";
import { BankAccount } from "@/schemas/bank";
import { getInvoiceByID } from "@/lib/action/invoice/invoice"; // ✅ Already imported
import { Invoice } from "@/schemas/invoice";
import { useSession } from "@/components/clientSessionProvider";


// Define types (you can move these to a shared types file if reused)
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

export default function UpdateInvoicePage() {
  const { user, isLoading: userLoading } = useSession();
  const router = useRouter();
  const params = useParams(); // ✅ Get dynamic route params

  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [users, setUsers] = useState<Karyawan[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null); // ✅ Store fetched invoice
  const [isLoading, setIsLoading] = useState(true);

  // Extract ID from params (Next.js passes it as string or string[])
  const invoiceId = Array.isArray(params.id) ? params.id[0] : params.id;

  const currentUser = user ? {
    id: user.id,
    name: user.name || 'Unknown User'
  } : {
    id: 'unknown',
    name: 'Unknown User'
  }; // Fallback object, bukan undefined

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

    if (!invoiceId) {
      console.error("Invoice ID is missing");
      router.replace("/admin-area/finance/invoice");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch invoice first to ensure it exists
        const invoiceRes = await getInvoiceByID(invoiceId);

        // Perbaikan: Akses properti data dari response
        if (!invoiceRes.success || !invoiceRes.data) {
          throw new Error(invoiceRes.message || "Invoice not found");
        }
        setInvoice(invoiceRes.data); // ✅ Sekarang ini adalah Invoice, bukan response object

        // Fetch supporting data in parallel
        const [salesOrderRes, usersRes, banksRes] = await Promise.all([
          fetchAllSalesOrder(),
          fetchAllKaryawan(),
          getBankAccounts(),
        ]);

        setSalesOrders(salesOrderRes.salesOrders || []);
        setUsers(usersRes.karyawan || []);
        setBanks(banksRes || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        // Optionally show toast or redirect
        router.replace("/admin-area/finance/invoice");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router, user, userLoading, invoiceId]);

  if (isLoading) {
    return <AdminLoading message="Loading invoice data..." />;
  }

  // Safety check: should not happen due to redirect above, but good to have
  if (!invoice) {
    return <div>Invoice not found.</div>;
  }

  const layoutProps: LayoutProps = {
    title: "Update Invoice",
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
                  <Link href="/admin-area/finance/invoice">Invoice List</Link>
                </Badge>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Badge variant="outline">
                <BreadcrumbPage>Update Invoice</BreadcrumbPage>
              </Badge>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="h-full w-full">
          <div className="flex-1 space-y-2 p-2 pt-1 md:p-4">
            <UpdateInvoiceForm
              currentUser={currentUser}
              salesOrders={salesOrders}
              users={users}
              banks={banks}
              initialData={invoice} // ✅ Pass the invoice data to the form
            />
          </div>
        </div>
      </>
    ),
  };

  return <AdminLayout {...layoutProps} />;
}