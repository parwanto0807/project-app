// app/(dashboard)/admin-area/inventory/stock-opname/create/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    Warehouse as WarehouseIcon,
    Calendar,
    FileText,
    Users,
    Package,
    AlertCircle,
    Info,
    CheckCircle2
} from "lucide-react";
import { toast } from "sonner";


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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { fetchAllProducts } from "@/lib/action/master/product";
import { getWarehouses } from "@/lib/action/wh/whAction";
import { fetchAllKaryawan } from "@/lib/action/master/karyawan";

import { Warehouse } from "@/types/whType";
import { OpnameType } from "@/types/soType";
import { stockOpnameActions, StockOpnameFormData } from "@/lib/action/stockOpname/soAction";
import StockOpnameForm, { Product, User } from "@/components/stockOpname/InputStockOpname";
import { cn } from "@/lib/utils";

// const getTypeDescription = (type: OpnameType) => {
//     switch (type) {
//         case OpnameType.INITIAL: return "Inisialisasi saldo awal untuk pembukaan stok baru di sistem.";
//         case OpnameType.PERIODIC: return "Pemeriksaan stok rutin bulanan atau tahunan sesuai jadwal.";
//         case OpnameType.AD_HOC: return "Pengecekan stok mendadak untuk audit internal atau investigasi selisih.";
//         default: return "";
//     }
// };

// const getBadgeStyles = (type: OpnameType) => {
//     switch (type) {
//         case OpnameType.INITIAL: return "bg-purple-100 text-purple-700 border-purple-200";
//         case OpnameType.PERIODIC: return "bg-blue-100 text-blue-700 border-blue-200";
//         case OpnameType.AD_HOC: return "bg-amber-100 text-amber-700 border-amber-200";
//     }
// };

export default function CreateStockOpnamePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading: sessionLoading } = useSession();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedType, setSelectedType] = useState<OpnameType>(OpnameType.PERIODIC);

    // Get type from URL params
    useEffect(() => {
        const typeParam = searchParams.get('type');
        if (typeParam && Object.values(OpnameType).includes(typeParam as OpnameType)) {
            setSelectedType(typeParam as OpnameType);
        }
    }, [searchParams]);

    // 🔐 Guard role
    useEffect(() => {
        if (!sessionLoading && user?.role !== "admin" && user?.role !== "inventory_manager") {
            toast.error("Anda tidak memiliki akses ke halaman ini");
            router.push("/admin-area/inventory/stock-opname");
        }
    }, [user, sessionLoading, router]);

    // Load initial data
    useEffect(() => {
        if (user?.role === "admin" || user?.role === "inventory_manager") {
            loadAllData();
        }
    }, [user?.role]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            // Load data concurrently
            const [productsData, warehousesData, usersData] = await Promise.allSettled([
                fetchAllProducts({ page: 1, limit: 100, isActive: true }),
                getWarehouses(),
                fetchAllKaryawan()
            ]);

            // Handle products
            if (productsData.status === 'fulfilled' && productsData.value.success) {
                setProducts(productsData.value.data?.data || []);
            } else {
                toast.error("Gagal memuat data produk");
            }

            // Handle warehouses
            if (warehousesData.status === 'fulfilled' && warehousesData.value.success) {
                setWarehouses(warehousesData.value.data?.data || []);
            } else {
                toast.error("Gagal memuat data gudang");
            }

            // Handle users
            if (usersData.status === 'fulfilled' && usersData.value.karyawan) {
                setUsers(usersData.value.karyawan || []);
            } else {
                toast.error("Gagal memuat data petugas");
            }

        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Terjadi kesalahan saat memuat data");
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = () => {
        toast.success("Stock opname berhasil dibuat");
        router.push("/admin-area/inventory/stock-opname");
    };

    const handleCancel = () => {
        router.back();
    };

    const handleSubmit = async (data: StockOpnameFormData) => {
        try {
            // Transform data if needed to match StockOpnameFormData
            // The InputStockOpname form already produces compatible structure
            await stockOpnameActions.create(data);
            // Success handling is done via onSuccess callback which calls handleSuccess
        } catch (error: any) {
            console.error("Failed to create stock opname", error);
            throw error; // Re-throw to be caught by InputStockOpname loading state handler
        }
    };

    const getTypeDescription = (type: OpnameType): string => {
        switch (type) {
            case OpnameType.INITIAL:
                return "Stock opname awal untuk setup sistem baru";
            case OpnameType.PERIODIC:
                return "Stock opname rutin bulanan/periodik";
            case OpnameType.AD_HOC:
                return "Stock opname khusus untuk kebutuhan tertentu";
            default:
                return "";
        }
    };

    const getTypeBadge = (type: OpnameType) => {
        switch (type) {
            case OpnameType.INITIAL:
                return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">INITIAL</Badge>;
            case OpnameType.PERIODIC:
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">PERIODIC</Badge>;
            case OpnameType.AD_HOC:
                return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">AD-HOC</Badge>;
            default:
                return null;
        }
    };

    if (sessionLoading || loading) {
        return <AdminLoading />;
    }

    if (user?.role !== "admin" && user?.role !== "inventory_manager") {
        return null;
    }

    return (
        <AdminLayout
            title="Buat Stock Opname"
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
                                <BreadcrumbLink href="#">
                                    Inventory
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin-area/inventory/stock-opname">
                                    Stock Opname List
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Buat Baru</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Header */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-background p-6 border shadow-sm">
                        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-blue-500/10 p-2 dark:bg-blue-500/20">
                                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        Buat Stock Opname Baru
                                    </h1>
                                    <p className="text-sm md:text-base text-muted-foreground mt-1">
                                        Lakukan pengecekan stok fisik untuk akurasi inventaris
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancel}
                                className="text-[11px] md:text-sm"
                            >
                                <ArrowLeft className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                                Kembali
                            </Button>
                        </div>
                    </div>

                    <Card className="overflow-hidden border border-slate-200 shadow-sm bg-white">
                        {/* Header: Compact Stats Bar */}
                        <div className="flex flex-wrap items-center gap-6 px-5 py-4 bg-slate-50 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-blue-600" />
                                <span className="text-xs font-medium text-slate-500">Produk:</span>
                                <span className="text-sm font-bold text-slate-900">{products.length}</span>
                            </div>
                            <div className="w-px h-4 bg-slate-300 hidden md:block" />
                            <div className="flex items-center gap-2">
                                <WarehouseIcon className="h-4 w-4 text-emerald-600" />
                                <span className="text-xs font-medium text-slate-500">Gudang:</span>
                                <span className="text-sm font-bold text-slate-900">{warehouses.length}</span>
                            </div>
                            <div className="w-px h-4 bg-slate-300 hidden md:block" />
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-orange-600" />
                                <span className="text-xs font-medium text-slate-500">Petugas:</span>
                                <span className="text-sm font-bold text-slate-900">{users.length}</span>
                            </div>
                        </div>

                        {/* Body: Slim Type Selection */}
                        <div className="px-5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        Konfigurasi Operasi
                                    </h3>
                                    <p className="text-[11px] text-slate-500">Pilih jenis pemeriksaan stok untuk melanjutkan</p>
                                </div>

                                <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1">
                                    {Object.values(OpnameType).map((type) => {
                                        const isSelected = selectedType === type;
                                        const config = {
                                            [OpnameType.INITIAL]: { icon: FileText, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
                                            [OpnameType.PERIODIC]: { icon: Calendar, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
                                            [OpnameType.AD_HOC]: { icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
                                        }[type];

                                        const Icon = config.icon;

                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setSelectedType(type)}
                                                className={cn(
                                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200",
                                                    isSelected
                                                        ? `${config.bg} ${config.color} shadow-sm border ${config.border}`
                                                        : "text-slate-500 hover:bg-white hover:text-slate-700"
                                                )}
                                            >
                                                <Icon className={cn("h-3.5 w-3.5", isSelected ? config.color : "text-slate-400")} />
                                                {type}
                                                {isSelected && <CheckCircle2 className="h-3 w-3 ml-1 animate-in fade-in" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer Detail: Ultra Thin Guide */}
                            {selectedType && (
                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3 animate-in slide-in-from-top-1">
                                    <div className="flex-none p-1.5 bg-blue-50 rounded-lg">
                                        <Info className="h-3 w-3 text-blue-500" />
                                    </div>
                                    <p className="text-[11px] text-slate-600 leading-tight italic">
                                        <span className="font-bold text-blue-700 not-italic mr-1">Prosedur:</span>
                                        {getTypeDescription(selectedType)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Alert Info */}
                    <Alert className="bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription>
                            <div className="flex flex-col md:flex-row md:items-center gap-2">
                                <span className="font-medium">Informasi:</span>
                                <span className="text-sm">
                                    Pastikan semua data yang dimasukkan akurat. Stock opname akan dibuat dengan status DRAFT dan dapat diedit sebelum dilakukan adjustment.
                                </span>
                            </div>
                        </AlertDescription>
                    </Alert>

                    {/* Main Form */}
                    <Card className="shadow-lg">
                        <CardContent className="px-6">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Form Stock Opname
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Isi semua informasi yang diperlukan untuk membuat stock opname
                                </p>
                            </div>

                            <StockOpnameForm
                                initialType={selectedType}
                                products={products}
                                warehouses={warehouses}
                                users={users}
                                currentUserId={user?.id}
                                onSuccess={handleSuccess}
                                onCancel={handleCancel}
                                onTypeChange={setSelectedType}
                                submitAction={handleSubmit}
                            />
                        </CardContent>
                    </Card>

                    {/* Help Information */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-blue-600" />
                                    Panduan Pengisian
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                                                <div className="h-2 w-2 bg-blue-600 rounded-full" />
                                            </div>
                                            <span className="text-sm">
                                                <strong>Pilih Gudang:</strong> Pilih gudang yang akan dilakukan stock opname
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                                                <div className="h-2 w-2 bg-blue-600 rounded-full" />
                                            </div>
                                            <span className="text-sm">
                                                <strong>Tambahkan Produk:</strong> Minimal 1 produk harus ditambahkan
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                                                <div className="h-2 w-2 bg-blue-600 rounded-full" />
                                            </div>
                                            <span className="text-sm">
                                                <strong>Stok Fisik:</strong> Masukkan jumlah stok fisik yang terhitung
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                                                <div className="h-2 w-2 bg-blue-600 rounded-full" />
                                            </div>
                                            <span className="text-sm">
                                                <strong>Status DRAFT:</strong> Stock opname dapat diedit sebelum di-adjust
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* CSS untuk gradient pattern */}
            <style jsx global>{`
        .bg-grid-pattern {
          background-image: linear-gradient(to right, #8882 1px, transparent 1px),
            linear-gradient(to bottom, #8882 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        @media (max-width: 640px) {
          .bg-grid-pattern {
            background-size: 16px 16px;
          }
        }
        
        .dark .bg-grid-pattern {
          background-image: linear-gradient(to right, #fff2 1px, transparent 1px),
            linear-gradient(to bottom, #fff2 1px, transparent 1px);
        }

        .bg-gradient-to-br {
          background-size: 200% 200%;
          animation: gradientShift 8s ease infinite;
        }

        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
        </AdminLayout>
    );
}