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
import { fetchAllSpk, getSpkByEmail } from "@/lib/action/master/spk/spk";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import { useCurrentUser } from "@/hooks/use-current-user";
import { fetchKaryawanByEmail } from "@/lib/action/master/karyawan";
import { toast } from "sonner";
import ModalDetailLaporan from "@/components/spkReport/tableDataDetail";

interface SPK {
    id: string;
    spkNumber: string;
    spkDate: Date;
    salesOrderId: string;
    teamId: string;
    createdById: string;

    createdBy: {
        id: string;
        namaLengkap: string;
        jabatan?: string | null;
        nik?: string | null;
        departemen?: string | null;
    };

    salesOrder: {
        id: string;
        soNumber: string;
        projectName: string;
        customer: {
            name: string;      // diisi dari customer.name
            address: string;   // ✅ baru
            branch: string;    // ✅ baru
        }
        project?: {
            id: string;
            name: string;
        };
        items: {
            id: string;
            lineNo: number;
            itemType: string;
            name: string;
            description?: string | null;
            qty: number;
            uom?: string | null;
            unitPrice: number;
            discount: number;
            taxRate: number;
            lineTotal: number;
        }[];
    };

    team?: {
        id: string;
        namaTeam: string;
        teamKaryawan?: {
            teamId: string;
            karyawan?: {
                namaLengkap: string;
                email: string;
                jabatan: string;
                departemen: string;
            };
        };
    } | null;

    details: {
        id: string;
        karyawan?: {
            id: string;
            namaLengkap: string;
            jabatan: string;
            email: string;
            departemen: string;
            nik: string;
        };
        salesOrderItem?: {
            id: string;
            name: string;
            description?: string;
            qty: number;
            uom?: string | null;
        };
        lokasiUnit?: string | null;
    }[];

    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export default function SpkReportDetailPageAdmin() {
    const { user, loading: userLoading } = useCurrentUser();
    const [dataSpk, setDataSpk] = useState<SPK[]>([]);
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

            let result: SPK[] = [];
            if (role === "admin" || role === 'super') {
                result = await fetchAllSpk();   // ✅ ambil semua SPK untuk admin/super
            } else {
                result = await getSpkByEmail(email); // ✅ user biasa hanya SPK yang assigned
            }

            setDataSpk(result);

            const karyawan = await fetchKaryawanByEmail(email);
            if (karyawan) {
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
        if (user.role !== "user") {
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
        role: "user",
        children: (
            <>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Badge variant="outline">
                                    <Link href="/user-area">Dashboard</Link>
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
                        <ModalDetailLaporan
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