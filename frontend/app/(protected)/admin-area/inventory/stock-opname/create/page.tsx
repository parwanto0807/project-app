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

import { fetchAllProductsOpname } from "@/lib/action/master/product";
import { getWarehouses } from "@/lib/action/wh/whAction";
import { fetchAllKaryawan } from "@/lib/action/master/karyawan";

import { Warehouse } from "@/types/whType";
import { OpnameType } from "@/types/soType";
import { stockOpnameActions, StockOpnameFormData } from "@/lib/action/stockOpname/soAction";
import StockOpnameForm, { Product, User } from "@/components/stockOpname/InputStockOpname";
import { cn } from "@/lib/utils";

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
                fetchAllProductsOpname({ page: 1, limit: 100, isActive: true }),
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
                return <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 border dark:border-purple-700">INITIAL</Badge>;
            case OpnameType.PERIODIC:
                return <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 border dark:border-blue-700">PERIODIC</Badge>;
            case OpnameType.AD_HOC:
                return <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 border dark:border-orange-700">AD-HOC</Badge>;
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


                    {/* Header - Premium Gradient Design */}
                    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 dark:from-slate-800 dark:via-blue-900 dark:to-indigo-800 p-8 text-white shadow-2xl">
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-blue-300 dark:text-blue-200 border-blue-400 dark:border-blue-300 bg-blue-400/10 dark:bg-blue-300/10 backdrop-blur-md">
                                        v2.0 Inventory System
                                    </Badge>
                                    <Badge variant="secondary" className="bg-emerald-500/20 dark:bg-emerald-400/20 text-emerald-300 dark:text-emerald-200 border-none">
                                        Create Mode
                                    </Badge>
                                </div>
                                <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-slate-400 dark:from-slate-50 dark:via-slate-200 dark:to-slate-500">
                                    Stock Opname Entry
                                </h1>
                                <p className="text-slate-400 dark:text-slate-300 mt-1 max-w-md">
                                    Lakukan pengecekan stok fisik untuk akurasi inventaris
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancel}
                                className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali
                            </Button>
                        </div>
                        {/* Abstract Background Element */}
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                    </header>

                    <Card className="overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900/50">
                        {/* Header: Compact Stats Bar */}
                        <div className="flex flex-wrap justify-between bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex flex-wrap items-center gap-6 px-5 py-4">
                                <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Produk:</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{products.length}</span>
                                </div>
                                <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 hidden md:block" />
                                <div className="flex items-center gap-2">
                                    <WarehouseIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Gudang:</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{warehouses.length}</span>
                                </div>
                                <div className="w-px h-4 bg-slate-300 hidden md:block" />
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Petugas:</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{users.length}</span>
                                </div>
                            </div>
                            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
                                {Object.values(OpnameType).map((type) => {
                                    const isSelected = selectedType === type;
                                    const config = {
                                        [OpnameType.INITIAL]: { icon: FileText, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", glow: "#9333ea60" },
                                        [OpnameType.PERIODIC]: { icon: Calendar, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", glow: "#2563eb60" },
                                        [OpnameType.AD_HOC]: { icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", glow: "#d9770660" },
                                    }[type];

                                    const Icon = config.icon;

                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setSelectedType(type)}
                                            style={isSelected ? { "--glow-color": config.glow } as any : undefined}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200",
                                                isSelected
                                                    ? `${config.bg} ${config.color} shadow-sm border ${config.border} animate-glow-effect`
                                                    : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200"
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

                        {/* Body: Slim Type Selection */}
                        <div className="px-5">
                            {/* Footer Detail: Ultra Thin Guide */}
                            {selectedType && (
                                <div className="mt-0 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3 animate-in slide-in-from-top-1">
                                    <div className="flex-none p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                        <Info className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight italic">
                                        <span className="font-bold text-blue-700 dark:text-blue-400 not-italic mr-1">Prosedur:</span>
                                        {getTypeDescription(selectedType)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Alert Info */}
                    <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertDescription>
                            <div className="flex flex-col md:flex-row md:items-center gap-2">
                                <span className="font-medium dark:text-blue-300">Informasi:</span>
                                <span className="text-sm dark:text-blue-400">
                                    Pastikan semua data yang dimasukkan akurat. Stock opname akan dibuat dengan status DRAFT dan dapat diedit sebelum dilakukan adjustment.
                                </span>
                            </div>
                        </AlertDescription>
                    </Alert>

                    {/* Main Form */}
                    <Card className="shadow-lg dark:bg-slate-900/50 dark:border-slate-700">
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
                    <Card className="dark:bg-slate-900/50 dark:border-slate-700">
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2 dark:text-slate-200">
                                    <AlertCircle className="h-5 w-5 text-blue-600" />
                                    Panduan Pengisian
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1 mt-0.5">
                                                <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
                                            </div>
                                            <span className="text-sm">
                                                <strong>Pilih Gudang:</strong> Pilih gudang yang akan dilakukan stock opname
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1 mt-0.5">
                                                <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
                                            </div>
                                            <span className="text-sm">
                                                <strong>Tambahkan Produk:</strong> Minimal 1 produk harus ditambahkan
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1 mt-0.5">
                                                <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
                                            </div>
                                            <span className="text-sm">
                                                <strong>Stok Fisik:</strong> Masukkan jumlah stok fisik yang terhitung
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1 mt-0.5">
                                                <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
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
        .animate-glow-effect {
          animation: glow-effect 2s ease-in-out infinite;
        }

        @keyframes glow-effect {
          0%, 100% {
            box-shadow: 0 0 0 0 transparent;
          }
          50% {
            box-shadow: 0 0 12px 2px var(--glow-color);
          }
        }

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