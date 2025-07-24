"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SuperLayout } from "@/components/admin-panel/super-layout";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import UpdateCustomerForm from "@/components/master/customer/updateFormData"; // ganti dengan komponen update formmu
import { fetchCustomerById } from "@/lib/action/master/customer";
import { customerSchema } from "@/schemas";

export default function UpdateXxxPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  const [data, setData] = useState<customerSchema | null>(null);
  const [error, setError] = useState("");
  const [role, setRole] = useState<"super">("super");

  useEffect(() => {
    if (!loading && user) setRole(user.role as typeof role);
    if (!loading && !user) router.push("/auth/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const result = await fetchCustomerById(id);
        setData(result);
      } catch {
        setError("Data tidak ditemukan.");
        toast.error("Gagal memuat data.");
      }
    };
    fetchData();
  }, [id]);

  return (
    <SuperLayout title="Update Data" role={role}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Update</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : data ? (
        <UpdateCustomerForm customer={data} />
      ) : (
        <p className="text-center text-red-500">Data tidak ditemukan.</p>
      )}
    </SuperLayout>
  );
}
