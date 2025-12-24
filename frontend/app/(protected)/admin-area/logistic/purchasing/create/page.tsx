"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    ArrowLeft,
    FileText,
    ShoppingCart,
    Home,
    Package,
    Truck,
    Building,
    User,
    Calendar,
    AlertCircle,
    Lightbulb,
    Shield,
    FileCheck,
    Layers,
    WarehouseIcon,
    ChevronRight,
    ChevronDown
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import CreateFormPO from "@/components/purchasing/createFormPo";
import { fetchSuppliers } from "@/lib/action/supplier/supplierAction";
import { getWarehouses } from "@/lib/action/wh/whAction";
import { fetchAllProjects } from "@/lib/action/master/project";
import { Supplier } from "@/types/supplierType";
import { Warehouse } from "@/types/whType";
import { Project } from "@/types/salesOrder";
import { Product } from "@/types/quotation";
import { SPKDataApi } from "@/types/spk";
import { fetchAllProducts } from "@/lib/action/master/product";
import { fetchAllSpkPr } from "@/lib/action/master/spk/spk";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function CreatePurchaseOrderPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("form");

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [spkList, setSpkList] = useState<SPKDataApi[]>([]);
    const [poNumber, setPoNumber] = useState("");
    const [isTipsOpen, setIsTipsOpen] = useState(true);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            const [
                suppliersData,
                warehousesData,
                projectsData,
                productsData,
                spkData,
            ] = await Promise.all([
                fetchSuppliers(),
                getWarehouses(),
                fetchAllProjects(),
                fetchAllProducts(),
                fetchAllSpkPr(),
            ]);

            setSuppliers(suppliersData.data || []);
            setWarehouses(warehousesData.data?.data || []);
            setProjects(projectsData.data || []);
            setProducts(productsData.products || []);
            setSpkList(spkData || []);
            setPoNumber("");
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Gagal memuat data");
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-close tips after 1 minute
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsTipsOpen(false);
        }, 60000); // 60 seconds = 1 minute

        return () => clearTimeout(timer);
    }, []);

    const handleSuccess = (poId: string) => {
        toast.success("Purchase Order berhasil dibuat!");
        router.push(`/admin-area/logistic/purchasing/${poId}`);
    };

    const handleCancel = () => {
        router.push("/admin-area/logistic/purchasing");
    };

    if (isLoading) {
        return (
            <AdminLayout title="Purchase Order Management" role="admin">
                <div className="container mx-auto p-4 md:p-6 space-y-6">
                    {/* Breadcrumb Skeleton */}
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-4" />
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-4" />
                                <Skeleton className="h-4 w-40" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Header Skeleton */}
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                        <CardContent className="p-6">
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-64" />
                                <Skeleton className="h-4 w-96" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Form Skeleton */}
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-96" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="space-y-3">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Purchase Order Management" role="admin">
            {/* Main Container */}
            <div className="container mx-auto p-4 md:p-6 space-y-6">
                {/* Breadcrumb Card */}
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink
                                href="/admin-area"
                                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                            >
                                <Home className="h-4 w-4" />
                                Dashboard
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink
                                href="/admin-area/logistic/purchasing"
                                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                            >
                                <FileText className="h-4 w-4" />
                                Purchase Orders
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="flex items-center gap-2 font-semibold text-primary">
                                <ShoppingCart className="h-4 w-4" />
                                Buat PO Baru
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* Information & Tips Card - Collapsible */}
                <Collapsible open={isTipsOpen} onOpenChange={setIsTipsOpen}>
                    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                        <CollapsibleTrigger asChild>
                            <div className="w-full cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                                                <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">Tips Membuat PO</h3>
                                        </div>
                                        <ChevronDown className={cn(
                                            "h-4 w-4 text-blue-600 dark:text-blue-400 transition-transform duration-200",
                                            isTipsOpen ? "transform rotate-180" : ""
                                        )} />
                                    </div>
                                </CardContent>
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <CardContent className="px-4 pb-2 pt-0">
                                <div className="flex flex-col md:flex-row md:items-start gap-4">
                                    <div className="flex-1">
                                        <ul className="space-y-1.5">
                                            <li className="flex items-start gap-2 text-xs">
                                                <div className="h-1 w-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                                <span className="text-blue-800 dark:text-blue-200">Pastikan supplier dan gudang telah dipilih</span>
                                            </li>
                                            <li className="flex items-start gap-2 text-xs">
                                                <div className="h-1 w-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                                <span className="text-blue-800 dark:text-blue-200">Minimal 1 item produk untuk melanjutkan</span>
                                            </li>
                                            <li className="flex items-start gap-2 text-xs">
                                                <div className="h-1 w-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                                <span className="text-blue-800 dark:text-blue-200">Periksa harga dan total sebelum submit</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="flex md:flex-col gap-2">
                                        <div className="flex items-center gap-2 px-3 py-2 bg-white/50 dark:bg-black/20 rounded-lg">
                                            <Shield className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                            <div className="text-xs font-medium">Data Aman</div>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-2 bg-white/50 dark:bg-black/20 rounded-lg">
                                            <FileCheck className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                            <div className="text-xs font-medium">Auto-Save</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </CollapsibleContent>
                    </Card>
                </Collapsible>

                {/* Main Form Card */}
                <Card className="bg-card border-border shadow-lg">
                    <CardHeader className="pb-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <ShoppingCart className="h-5 w-5 text-primary" />
                                    </div>
                                    Formulir Purchase Order
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Semua field dengan tanda <span className="text-red-500 font-semibold">*</span> wajib diisi
                                </CardDescription>
                            </div>
                            <Badge variant="secondary" className="px-3 py-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                                    Draft Mode
                                </div>
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-6">
                        <CreateFormPO
                            suppliers={suppliers}
                            warehouses={warehouses}
                            projects={projects}
                            products={products}
                            spkList={spkList}
                            poNumber={poNumber}
                            onSuccess={handleSuccess}
                            onCancel={handleCancel}
                        />
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Shield className="h-4 w-4" />
                                Data Anda aman dan terenkripsi
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleCancel}
                                    className="border-border hover:bg-accent"
                                >
                                    Batal
                                </Button>
                                <Button
                                    variant="outline"
                                    className="border-border hover:bg-accent"
                                    onClick={() => {
                                        // Save as draft functionality
                                        toast.info("Draft berhasil disimpan");
                                    }}
                                >
                                    Simpan Draft
                                </Button>
                                <Button type="submit" form="create-po-form">
                                    Buat Purchase Order
                                </Button>
                            </div>
                        </div>
                    </CardFooter>
                </Card>

                {/* Quick Stats & Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-card to-green-50 dark:to-green-950/20 border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow cursor-pointer group"
                        onClick={() => router.push("/admin-area/master/supplier")}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <User className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-semibold">Kelola Supplier</h4>
                                    <p className="text-sm text-muted-foreground">Total: {suppliers.length} supplier</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-card to-orange-50 dark:to-orange-950/20 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-shadow cursor-pointer group"
                        onClick={() => router.push("/admin-area/master/product")}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-semibold">Kelola Produk</h4>
                                    <p className="text-sm text-muted-foreground">Total: {products.length} produk</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-card to-purple-50 dark:to-purple-950/20 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow cursor-pointer group"
                        onClick={() => router.push("/admin-area/logistic/purchasing")}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <WarehouseIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-semibold">Lihat Semua PO</h4>
                                    <p className="text-sm text-muted-foreground">Akses daftar purchase orders</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
                            </div>
                        </CardContent>
                    </Card>
                </div>


                {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Warehouse Info Card */}
                {/* <Card className="bg-card border-border shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="h-5 w-5" />
                                Informasi Gudang Tersedia
                            </CardTitle>
                            <CardDescription>
                                Pilih gudang tujuan untuk pengiriman barang
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {warehouses.slice(0, 3).map((warehouse) => (
                                    <div key={warehouse.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                                        <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                            <WarehouseIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">{warehouse.name}</div>
                                            <div className="text-sm text-muted-foreground">{warehouse.address}</div>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            Aktif
                                        </Badge>
                                    </div>
                                ))}
                                {warehouses.length > 3 && (
                                    <div className="text-center pt-2">
                                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                                            + {warehouses.length - 3} gudang lainnya
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card> */}

                {/* Project Info Card */}
                {/* <Card className="bg-card border-border shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Layers className="h-5 w-5" />
                                Proyek Tersedia
                            </CardTitle>
                            <CardDescription>
                                Tautkan PO dengan proyek tertentu (opsional)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {projects.slice(0, 3).map((project) => (
                                    <div key={project.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                                        <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                                            <Layers className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">{project.name}</div>
                                            <div className="text-sm text-muted-foreground">ID: {project.description}</div>
                                        </div>
                                    </div>
                                ))}
                                {projects.length > 3 && (
                                    <div className="text-center pt-2">
                                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                                            + {projects.length - 3} proyek lainnya
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card> 
            </div> */}

                {/* Footer Note */}
                {/* <Card className="bg-muted/30 border-border/50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                                <span>Need help? Contact support at support@company.com</span>
                            </div>
                            <div className="text-xs">
                                v2.0.1 • Last updated: {new Date().toLocaleDateString('id-ID')}
                            </div>
                        </div>
                    </CardContent>
                </Card> */}
            </div>
        </AdminLayout >
    );
}