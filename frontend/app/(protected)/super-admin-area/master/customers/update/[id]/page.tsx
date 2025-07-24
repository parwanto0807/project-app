"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SuperLayout } from "@/components/admin-panel/super-layout";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import UpdateCustomerForm from "@/components/master/customer/updateFormData";
import { fetchCustomerById } from "@/lib/action/master/customer";
import { customerUpdateSchema } from "@/schemas";
import { z } from "zod";
import Link from "next/link";

type Customer = z.infer<typeof customerUpdateSchema>;

export default function UpdateCustomerPage() {
    const params = useParams();
    const id = params?.id as string | undefined;
    const router = useRouter();
    const { user, loading } = useCurrentUser();

    const [data, setData] = useState<Customer | null>(null);
    const [error, setError] = useState("");
    const [role, setRole] = useState<"super">("super");
    const [loadingData, setLoadingData] = useState(false);

    // Redirect if not logged in
    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/login");
        } else if (!loading && user) {
            setRole(user.role as typeof role);
        }
    }, [loading, user, router]);

    useEffect(() => {
        if (!id) return;
        setLoadingData(true);
        const fetchData = async () => {
            try {
                const result = await fetchCustomerById(id);
                if (!result) throw new Error("Data tidak ditemukan.");
                setData(result.customer);
                setError("");
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                    toast("Gagal memuat data.", { description: err.message });
                } else {
                    setError("Data tidak ditemukan.");
                    toast("Gagal memuat data.", { description: "Silakan coba lagi." });
                }
                setData(null);
            }
            finally {
                setLoadingData(false);
            }
        };
        fetchData();
    }, [id]);

    return (
        <SuperLayout title="Update Data" role={role}>
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/super-admin-area/master/customers">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/super-admin-area/master/customers">Customer List</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Update</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {loading || loadingData ? (
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
