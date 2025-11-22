"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";  // NEW
import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { fetchAllCustomers } from "@/lib/action/master/customer";
import { fetchSalesOrderById } from "@/lib/action/sales/salesOrder";
import { UpdateSalesOrderForm } from "@/components/sales/salesOrder/updateFormData";
import { fullSalesOrderSchema } from "@/schemas/index";
import { useSession } from "@/components/clientSessionProvider";
import { PicLayout } from "@/components/admin-panel/pic-layout";

type SalesOrder = z.infer<typeof fullSalesOrderSchema>;

interface CustomerForForm {
  id: string;
  name: string;
  address?: string;
  branch?: string;
}

interface RawCustomer {
  code: string;
  name: string;
  branch: string;
  [key: string]: unknown;
}

export default function UpdateSalesOrderPageAdmin() {
  const params = useParams();
  const id = params?.id as string | undefined;

  const router = useRouter();
  const searchParams = useSearchParams();   // NEW

  const { user, isLoading: userLoading } = useSession();

  const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(null);
  const [customers, setCustomers] = useState<CustomerForForm[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  // 🔥 NEW: Ambil data dari query
  const returnUrl = searchParams.get("returnUrl") || "";
  const page = searchParams.get("page") || "1";
  const highlightId = searchParams.get("highlightId") || "";
  const highlightStatus = searchParams.get("status") || "";
  const searchUrl = searchParams.get("search") || "";

  // Redirect logic
  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.role !== "pic") {
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
    }

    const fetchData = async () => {
      setLoadingData(true);
      try {
        const salesOrderData = await fetchSalesOrderById(id);
        if (!salesOrderData) throw new Error("Sales order data not found.");

        const validation = fullSalesOrderSchema.safeParse(salesOrderData);

        if (!validation.success) {
          console.error("Validation error:", validation.error.flatten());
          throw new Error("Received invalid data format.");
        }

        setSalesOrder(salesOrderData);
        setError("");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        toast.error("Failed to load data", { description: errorMessage });
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [id]);

  // Fetch Customers
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const response = await fetchAllCustomers();
        if (response?.customers) {
          const formatted = response.customers.map((customer: RawCustomer) => ({
            id: customer.id,
            name: customer.name,
            address: customer.address,
            branch: customer.branch,
          }));
          setCustomers(formatted);
        }
      } catch (error) {
        console.error("Failed to fetch customer data:", error);
        toast.error("Failed to fetch customer list.");
      }
    };
    fetchCustomerData();
  }, []);

  const isLoading = userLoading || loadingData;
  const userProp = user ? { id: user.id } : undefined;

  return (
    <div className="h-full flex flex-col min-h-0 px-4">
      <PicLayout title="Update Sales Order" role="pic">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/pic-area/">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/pic-area/sales/salesOrder">Sales Order List</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Update</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <div className="absolute inset-0 rounded-full border-4 border-primary/10 animate-pulse"></div>
            </div>
            <p className="mt-4 text-lg text-gray-600">Loading sales order...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <p className="text-red-500 text-lg font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-md"
            >
              Try Again
            </button>
          </div>
        ) : salesOrder ? (
          <UpdateSalesOrderForm
            salesOrder={salesOrder}
            customers={customers}
            user={userProp}
            role={user?.role}

            // 🔥 NEW: Kirim ke form
            returnUrl={returnUrl}
            page={page}
            highlightId={highlightId}
            highlightStatus={highlightStatus}
            searchUrl={searchUrl}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <p className="text-yellow-600 text-lg font-medium">
              Data not found {id ? `(ID: ${id})` : ""}
            </p>
            <button
              onClick={() => router.push("/pic-area/sales/salesOrder")}
              className="px-4 py-2 bg-primary text-white rounded-md"
            >
              Back to Sales Order List
            </button>
          </div>
        )}
      </PicLayout>
    </div>
  );
}
