"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { AdminLayout } from "@/components/admin-panel/admin-layout";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useCurrentUser } from "@/hooks/use-current-user";
import { fetchAllCustomers } from "@/lib/action/master/customer";
import { fetchSalesOrderById } from "@/lib/action/sales/salesOrder";
import { UpdateSalesOrderForm } from "@/components/sales/salesOrder/updateFormData";
import { fullSalesOrderSchema } from "@/schemas/index";


type SalesOrder = z.infer<typeof fullSalesOrderSchema>;

interface CustomerForForm {
  id: string;
  name: string;
  address?: string;
}

interface RawCustomer {
  code: string;
  name: string;
  // Index signature untuk properti lain yang mungkin ada
  [key: string]: unknown;
}

export default function UpdateSalesOrderPageAdmin() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();

  const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(null);
  const [customers, setCustomers] = useState<CustomerForForm[]>([]);

  const [loadingData, setLoadingData] = useState(true); // Set initial loading to true
  const [error, setError] = useState("");

  // Redirect logic (sudah benar, tidak ada perubahan)
  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/unauthorized");
      return;
    }
  }, [userLoading, user, router]);

  // Fetch Sales Order Data
  useEffect(() => {
    if (!id) {
      setLoadingData(false);
      setError("Sales Order ID is not provided.");
      return;
    };

    const fetchData = async () => {
      setLoadingData(true);
      try {
        const salesOrderData = await fetchSalesOrderById(id);
        if (!salesOrderData) throw new Error("Sales order data not found.");

        // VALIDATE the data using the schema
        const validation = fullSalesOrderSchema.safeParse(salesOrderData);

        if (!validation.success) {
          // Log the detailed error for debugging
          console.error("API data validation failed:", validation.error.flatten());
          throw new Error("Received invalid data format from the server.");
        }

        // FIX: Menggunakan setSalesOrder, bukan setData
        setSalesOrder(salesOrderData);
        setError("");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        toast.error("Failed to load data", {
          description: errorMessage,
        });
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [id]);

  // Fetch Customer Data
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const response = await fetchAllCustomers();
        if (response && response.customers) {
          const formattedCustomers = response.customers.map((customer: RawCustomer) => ({
            id: customer.id,
            name: customer.name,
            address: customer.address,
          }));
          setCustomers(formattedCustomers);
        }
      } catch (error) {
        console.error("Failed to fetch customer data:", error);
        toast.error("Failed to fetch customer list.");
      }
    };
    fetchCustomerData();
  }, []); // FIX: Dependency array dikosongkan agar hanya berjalan sekali

  const isLoading = userLoading || loadingData;
  const userProp: { id: string } | undefined =
  user ? { id: user.id} : undefined;

  return (
    // FIX: Menggunakan user?.role untuk prop role
    <AdminLayout title="Update Sales Order" role="admin">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            {/* FIX: Link breadcrumb disesuaikan */}
            <BreadcrumbLink href="/admin-area/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              {/* FIX: Link dan teks disesuaikan untuk Sales Order */}
              <Link href="/admin-area/sales/salesOrder">Sales Order List</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Update</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* --- Loading State --- */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <div className="absolute inset-0 rounded-full border-4 border-primary/10 animate-pulse"></div>
          </div>
          {/* FIX: Teks loading disesuaikan */}
          <p className="mt-4 text-lg font-medium text-gray-600">
            Loading sales order data...
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please wait while we prepare the details
          </p>
        </div>
      ) : error ? (
        /* --- Error State --- */
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="bg-red-100 p-4 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-center text-red-500 text-lg font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
            Try Again
          </button>
        </div>
      ) : salesOrder ? (
        /* --- Success State (Data Loaded) --- */
        <UpdateSalesOrderForm
          // FIX: Melewatkan data salesOrder ke form
          salesOrder={salesOrder}
          customers={customers}
          user={userProp}
          role={user?.role}
        />
      ) : (
        /* --- Not Found State --- */
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="bg-yellow-100 p-4 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-center text-yellow-600 text-lg font-medium">
            Data not found. {id ? `(ID: ${id})` : ''}
          </p>
          {/* FIX: Link tombol disesuaikan */}
          <button onClick={() => router.push("/admin-area/sales/sales-orders")} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
            Back to Sales Order List
          </button>
        </div>
      )}
    </AdminLayout>
  );
}