"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";
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
import { PicLayout } from "@/components/admin-panel/pic-layout";
import { AdminLoading } from "@/components/admin-loading";

type SalesOrder = z.infer<typeof fullSalesOrderSchema>;

interface CustomerForForm {
  id: string;
  name: string;
  address?: string;
}

interface RawCustomer {
  id: string; // ✅ sebelumnya hilang, harus ada
  name: string;
  address?: string;
  // Index signature jika API bisa punya field lain
  [key: string]: unknown;
}

export default function UpdateSalesOrderPageAdmin() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();

  const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(null);
  const [customers, setCustomers] = useState<CustomerForForm[]>([]);

  // 🔒 Redirect logic
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

  // 🔄 Fetch Sales Order Data
  useEffect(() => {
    if (!id) {
      return;
    }

    const fetchData = async () => {
      try {
        const salesOrderData = await fetchSalesOrderById(id);
        if (!salesOrderData) throw new Error("Sales order data not found.");

        const validation = fullSalesOrderSchema.safeParse(salesOrderData);
        if (!validation.success) {
          console.error("API data validation failed:", validation.error.flatten());
          throw new Error("Received invalid data format from the server.");
        }

        setSalesOrder(validation.data); // ✅ gunakan hasil validasi

      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        toast.error("Failed to load data", {
          description: errorMessage,
        });
      }
    };

    fetchData();
  }, [id]);

  // 🔄 Fetch Customer Data
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const response = await fetchAllCustomers();
        if (response?.customers) {
          const formattedCustomers = response.customers.map((customer: RawCustomer) => ({
            id: String(customer.id), // ✅ pastikan string
            name: customer.name,
            address: customer.address as string | undefined,
          }));
          setCustomers(formattedCustomers);
        }
      } catch (error) {
        console.error("Failed to fetch customer data:", error);
        toast.error("Failed to fetch customer list.");
      }
    };
    fetchCustomerData();
  }, []);

  // 🔄 Loading State
  if (userLoading || !user || user.role !== "pic") {
    return <AdminLoading message="Preparing Update SPK..." />;
  }

  const userProp = user ? { id: user.id } : undefined;

  return (
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

      <div className="mt-6">
        {salesOrder ? (
          <UpdateSalesOrderForm
            salesOrder={salesOrder}
            customers={customers}
            user={userProp}
            role={user?.role}
          />
        ) : (
          <AdminLoading message="Loading Sales Order Data..." />
        )}
      </div>

    </PicLayout>
  );
}
