"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { stockOpnameActions } from "@/lib/action/stockOpname/soAction";
import { StockOpname } from "@/types/soType";
import DetailStockOpname from "@/components/stockOpname/DetailStockOpname";
import { PicLayout } from "@/components/admin-panel/pic-layout";
import { useSession } from "@/components/clientSessionProvider";
import { AdminLoading } from "@/components/admin-loading";
import { toast } from "sonner";
import { FileText } from "lucide-react";

export default function StockOpnameDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const { user, isLoading: sessionLoading } = useSession();
    const [data, setData] = useState<StockOpname | null>(null);
    const [loading, setLoading] = useState(true);

    // Guard Logic
    useEffect(() => {
        if (!sessionLoading && user?.role !== "pic" && user?.role !== "admin" && user?.role !== "inventory_manager") {
            toast.error("Akses ditolak: Anda tidak memiliki izin untuk mengakses halaman ini.");
            router.push("/unauthorized");
        }
    }, [user, sessionLoading, router]);

    // Fetch Data
    useEffect(() => {
        if (id && (user?.role === "pic" || user?.role === "admin" || user?.role === "inventory_manager")) {
            fetchData(id);
        }
    }, [id, user]);

    const fetchData = async (soId: string) => {
        try {
            setLoading(true);
            const response = await stockOpnameActions.getById(soId);
            if (response.success && response.data) {
                setData(response.data);
            } else {
                toast.error(response.message || "Gagal memuat detail stock opname");
                router.push("/pic-area/inventory/stock-opname");
            }
        } catch (error) {
            console.error("Error fetching detail:", error);
            toast.error("Terjadi kesalahan saat memuat data");
        } finally {
            setLoading(false);
        }
    };

    if (sessionLoading || loading) {
        return <AdminLoading />;
    }

    if (!data) return null;

    return (
        <PicLayout
            title={`Stock Opname - ${data.nomorOpname}`}
            role="pic"
        >
            <div className="flex-1 min-h-0 overflow-auto p-4">
                <DetailStockOpname
                    data={data}
                    onBack={() => router.push("/pic-area/inventory/stock-opname")}
                    onEdit={(id) => router.push(`/pic-area/inventory/stock-opname/${id}/edit`)}
                />
            </div>
        </PicLayout>
    );
}
