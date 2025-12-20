"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    ArrowLeft,
    FileText,
    AlertCircle,
    Info,
    Package,
    Warehouse as WarehouseIcon,
    Users
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { useSession } from "@/components/clientSessionProvider";
import { AdminLoading } from "@/components/admin-loading";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { fetchAllProducts } from "@/lib/action/master/product";
import { getWarehouses } from "@/lib/action/wh/whAction";
import { fetchAllKaryawan } from "@/lib/action/master/karyawan";
import { stockOpnameActions } from "@/lib/action/stockOpname/soAction";

import { Warehouse } from "@/types/whType";
import { StockOpname, OpnameStatus } from "@/types/soType";
import StockOpnameForm from "@/components/stockOpname/InputStockOpname";
import { CreateStockOpnameInput } from "@/schemas/stockOpname/soSchema";

export default function EditStockOpnamePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { user, isLoading: sessionLoading } = useSession();

    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [initialData, setInitialData] = useState<StockOpname | null>(null);
    const [formDefaultValues, setFormDefaultValues] = useState<Partial<CreateStockOpnameInput> | null>(null);

    // 🔐 Guard role & status
    useEffect(() => {
        if (!sessionLoading && user?.role !== "admin" && user?.role !== "inventory_manager") {
            toast.error("Anda tidak memiliki akses ke halaman ini");
            router.push("/admin-area/inventory/stock-opname");
        }
    }, [user, sessionLoading, router]);

    // Load all required data
    useEffect(() => {
        if (id && (user?.role === "admin" || user?.role === "inventory_manager")) {
            loadAllData();
        }
    }, [id, user?.role]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            // Load detail first to check status
            const detailRes = await stockOpnameActions.getById(id);

            if (!detailRes.success || !detailRes.data) {
                toast.error("Gagal memuat data stock opname");
                router.push("/admin-area/inventory/stock-opname");
                return;
            }

            const data = detailRes.data;

            if (data.status !== OpnameStatus.DRAFT) {
                toast.error("Hanya stock opname dengan status DRAFT yang dapat diedit");
                router.push(`/admin-area/inventory/stock-opname/${id}`);
                return;
            }

            setInitialData(data);

            // Fetch other master data
            const [productsData, warehousesData, usersData] = await Promise.allSettled([
                fetchAllProducts({ page: 1, limit: 100, isActive: true }),
                getWarehouses(),
                fetchAllKaryawan()
            ]);

            // Handle products
            if (productsData.status === 'fulfilled' && productsData.value.success) {
                setProducts(productsData.value.data?.data || []);
            }

            // Handle warehouses
            if (warehousesData.status === 'fulfilled' && warehousesData.value.success) {
                setWarehouses(warehousesData.value.data?.data || []);
            }

            // Handle users
            if (usersData.status === 'fulfilled' && usersData.value.karyawan) {
                setUsers(usersData.value.karyawan || []);
            }

            // Map detail to form structure
            setFormDefaultValues({
                tanggalOpname: format(new Date(data.tanggalOpname), "yyyy-MM-dd"),
                type: data.type,
                warehouseId: data.warehouseId,
                keterangan: data.keterangan || "",
                items: data.items.map(item => ({
                    productId: item.productId,
                    stokFisik: Number(item.stokFisik),
                    stokSistem: Number(item.stokSistem),
                    hargaSatuan: Number(item.hargaSatuan),
                    catatanItem: item.catatanItem || ""
                }))
            });

        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Terjadi kesalahan saat memuat data");
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = () => {
        toast.success("Stock opname berhasil diperbarui");
        router.push(`/admin-area/inventory/stock-opname/${id}`);
    };

    const handleCancel = () => {
        router.back();
    };

    const handleSubmit = async (data: any) => {
        try {
            await stockOpnameActions.update(id, data);
        } catch (error: any) {
            console.error("Failed to update stock opname", error);
            throw error;
        }
    };

    if (sessionLoading || loading || !formDefaultValues) {
        return <AdminLoading />;
    }

    return (
        <AdminLayout
            title={`Edit Stock Opname - ${initialData?.nomorOpname}`}
            role={user?.role || "guest"}
        >
            <div className="h-full w-full">
                <div className="flex-1 space-y-6 py-4 md:p-8">
                    {/* Breadcrumb */}
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin-area">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">Inventory</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin-area/inventory/stock-opname">Stock Opname List</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Edit {initialData?.nomorOpname}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Header */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-background p-6 border shadow-sm">
                        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-indigo-500/10 p-2">
                                    <FileText className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                                        Edit Stock Opname
                                    </h1>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Memperbarui data pemeriksaan stok fisik untun {initialData?.nomorOpname}
                                    </p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleCancel}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali
                            </Button>
                        </div>
                    </div>

                    <Card className="overflow-hidden border border-slate-200 shadow-sm bg-white">
                        <div className="flex flex-wrap items-center gap-6 px-5 py-4 bg-slate-50 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-blue-600" />
                                <span className="text-xs font-medium text-slate-500">Status:</span>
                                <span className="text-sm font-bold text-slate-900">{initialData?.status}</span>
                            </div>
                            <div className="w-px h-4 bg-slate-200" />
                            <div className="flex items-center gap-2">
                                <WarehouseIcon className="h-4 w-4 text-emerald-600" />
                                <span className="text-xs font-medium text-slate-500">Gudang:</span>
                                <span className="text-sm font-bold text-slate-900">{initialData?.warehouse?.name}</span>
                            </div>
                        </div>
                    </Card>

                    <Alert className="bg-amber-50 border-amber-200 text-amber-900">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-sm font-medium">
                            Anda sedang mengedit stock opname yang sudah tersimpan. Pastikan untuk menekan tombol "Simpan Perubahan" untuk memperbarui data di server.
                        </AlertDescription>
                    </Alert>

                    <Card className="shadow-lg">
                        <CardContent className="px-6 py-8">
                            <StockOpnameForm
                                initialType={initialData?.type}
                                products={products}
                                warehouses={warehouses}
                                users={users}
                                currentUserId={user?.id}
                                onSuccess={handleSuccess}
                                onCancel={handleCancel}
                                submitAction={handleSubmit}
                                defaultValues={formDefaultValues}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
