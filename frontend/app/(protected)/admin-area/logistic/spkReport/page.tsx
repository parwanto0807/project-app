"use client";

import { useEffect, useState, useCallback } from "react";
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
import { fetchAllSpkReport, getSpkByEmail } from "@/lib/action/master/spk/spk";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import { fetchKaryawanByEmail } from "@/lib/action/master/karyawan";
import { toast } from "sonner";
import FormMonitoringProgressSpk, { type SPKDataApi } from "@/components/spkReport/tableData";
import { useSession } from "@/components/clientSessionProvider";

export default function SpkReportPageAdmin() {
    const { user, isLoading: userLoading } = useSession();
    const [dataSpk, setDataSpk] = useState<SPKDataApi[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const [dataKarywanByEmail, setDataKarywanByEmail] = useState<string>('');

    const email = user?.email || '';
    const role = user?.role || '';
    const userId = dataKarywanByEmail || '';

    // ✅ BUNGKUS fetchFunction DENGAN useCallback
    const fetchData = useCallback(async () => {
        if (!email) {
            console.warn("Email user tidak tersedia");
            toast.error("Email pengguna tidak ditemukan");
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            // Jalankan kedua request secara paralel — tidak saling bergantung.
            const [result, karyawan] = await Promise.all([
                role === "admin" || role === "super"
                    ? fetchAllSpkReport()   // ✅ payload ringan, khusus halaman ini
                    : getSpkByEmail(email), // ✅ user biasa hanya SPK yang assigned
                fetchKaryawanByEmail(email).catch((error) => {
                    console.warn("⚠️ Gagal mengambil karyawan:", error);
                    return null;
                }),
            ]);

            setDataSpk(result ?? []);

            if (karyawan?.user?.id) {
                setDataKarywanByEmail(karyawan.user.id);
            } else {
                setDataKarywanByEmail("");
                console.warn("⚠️ Karyawan dengan email", email, "tidak ditemukan di database");
            }

        } catch (error) {
            console.error("Error fetching SPK:", error);
            toast.error("Gagal memuat data SPK");
        } finally {
            setIsLoading(false);
        }
    }, [email, role]); // ✅ Hanya tergantung pada email

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

        if (email) {
            fetchData(); // ✅ Aman dipanggil
        } else {
            console.warn("Email tidak tersedia, tidak dapat memuat SPK");
        }
    }, [router, user, userLoading, email, fetchData]); // ✅ Semua dependency termasuk fetchData!

    const layoutProps: LayoutProps = {
        title: "Production Management",
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
                                    <BreadcrumbPage>SPK Report</BreadcrumbPage>
                                </Badge>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <Badge variant="outline">
                                <BreadcrumbPage>Monitoring Progress</BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="h-full w-full">
                    <div className="flex-1 space-y-4 p-0 pt-6 md:p-4">
                        <FormMonitoringProgressSpk
                            dataSpk={dataSpk}
                            isLoading={isLoading}
                            userEmail={email}
                            role={role}
                            userId={userId}
                        />
                    </div>
                </div>
            </>
        ),
    };

    return <AdminLayout {...layoutProps} />;
}