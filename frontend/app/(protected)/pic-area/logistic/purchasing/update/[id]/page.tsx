"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    ChevronDown,
    Save,
    RotateCcw,
    Eye,
    History,
    Loader2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSuppliers } from "@/lib/action/supplier/supplierAction";
import { getWarehouses } from "@/lib/action/wh/whAction";
import { fetchAllProjects } from "@/lib/action/master/project";
import { Supplier } from "@/types/supplierType";
import { Warehouse } from "@/types/whType";
import { Project } from "@/types/salesOrder";
import { Product } from "@/types/quotation";
import { fetchAllProducts } from "@/lib/action/master/product";
import { PicLayout } from "@/components/admin-panel/pic-layout";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { PurchaseOrder, PurchaseOrderStatus } from "@/types/poType";
import { getPurchaseOrderById } from "@/lib/action/po/po";
import UpdateFormPO from "@/components/purchasing/updateFormPo";
import { SPKDataApi } from "@/types/spk";
import { fetchAllSpkPr } from "@/lib/action/master/spk/spk";

export default function UpdatePurchaseOrderPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingPO, setIsLoadingPO] = useState(true);
    const [isMasterDataLoaded, setIsMasterDataLoaded] = useState(false);
    const [isTipsOpen, setIsTipsOpen] = useState(true);

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [spkList, setSpkList] = useState<SPKDataApi[]>([]);
    const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
    const [poNumber, setPoNumber] = useState("");

    useEffect(() => {
        if (id) {
            loadInitialData();
            loadPurchaseOrderData();
        }
    }, [id]);

    const loadInitialData = async () => {
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
            // fetchAllSpkPr returns array directly, not wrapped in { data: [] }
            setSpkList(Array.isArray(spkData) ? spkData : (spkData.data || []));
            setIsMasterDataLoaded(true);
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Gagal memuat data master");
            setIsMasterDataLoaded(true); // Still set to true to allow form to show
        }
    };

    const loadPurchaseOrderData = async () => {
        setIsLoadingPO(true);
        try {
            const response = await getPurchaseOrderById(id);
            if (response) {
                setPurchaseOrder(response);
                setPoNumber(response.poNumber || "");
            } else {
                toast.error("Purchase Order tidak ditemukan");
                router.push("/pic-area/logistic/purchasing");
            }
        } catch (error) {
            console.error("Error loading purchase order:", error);
            toast.error("Gagal memuat data purchase order");
            router.push("/admin-area/logistic/purchasing");
        } finally {
            setIsLoadingPO(false);
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
        toast.success("Purchase Order berhasil diperbarui!");
        router.push(`/pic-area/logistic/purchasing/${poId}`);
    };

    const handleCancel = () => {
        if (purchaseOrder) {
            router.push(`/pic-area/logistic/purchasing/${purchaseOrder.id}`);
        } else {
            router.push("/pic-area/logistic/purchasing");
        }
    };

    const handleViewDetails = () => {
        if (purchaseOrder) {
            router.push(`/pic-area/logistic/purchasing/${purchaseOrder.id}`);
        }
    };

    const handleResetToOriginal = () => {
        if (purchaseOrder) {
            loadPurchaseOrderData();
            toast.info("Data telah direset ke nilai asli");
        }
    };

    if (isLoading || isLoadingPO || !isMasterDataLoaded) {
        return (
            <PicLayout title="Update Purchase Order" role="pic">
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
                                <Skeleton className="h-4 w-4" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Header Skeleton */}
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                        <CardContent className="p-6">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <Skeleton className="h-8 w-72" />
                                        <Skeleton className="h-4 w-96" />
                                    </div>
                                    <Skeleton className="h-10 w-32" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Form Skeleton */}
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                        <CardHeader>
                            <Skeleton className="h-6 w-56" />
                            <Skeleton className="h-4 w-96" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="space-y-3">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </PicLayout>
        );
    }

    if (!purchaseOrder) {
        return (
            <PicLayout title="Update Purchase Order" role="pic">
                <div className="container mx-auto p-4 md:p-6 space-y-6">
                    <Card className="bg-card border-border">
                        <CardContent className="p-8 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <AlertCircle className="h-16 w-16 text-muted-foreground" />
                                <h3 className="text-xl font-semibold">Purchase Order Tidak Ditemukan</h3>
                                <p className="text-muted-foreground">
                                    Purchase Order yang Anda cari tidak ditemukan atau telah dihapus.
                                </p>
                                <Button
                                    onClick={() => router.push("/pic-area/logistic/purchasing")}
                                    className="mt-4"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Kembali ke Daftar PO
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </PicLayout>
        );
    }

    return (
        <PicLayout title="Update Purchase Order" role="pic">
            <div className="h-full flex flex-col min-h-0">
                {/* Breadcrumb Area */}
                <div className="flex-shrink-0 p-4 pb-0">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink
                                    href="/pic-area"
                                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <Home className="h-4 w-4" />
                                    Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink
                                    href="/pic-area/logistic/purchasing"
                                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <FileText className="h-4 w-4" />
                                    Purchase Orders
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink
                                    href={`/pic-area/logistic/purchasing/${purchaseOrder.id}`}
                                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {purchaseOrder.poNumber || "PO Detail"}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage className="flex items-center gap-2 font-semibold text-primary">
                                    <Save className="h-4 w-4" />
                                    Update PO
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                {/* Main Scrollable Content */}
                <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 space-y-6">
                    {/* Information & Tips Card - Collapsible */}
                    <Collapsible open={isTipsOpen} onOpenChange={setIsTipsOpen}>
                        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
                            <CollapsibleTrigger asChild>
                                <div className="w-full cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                                                    <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-100">Tips Update PO</h3>
                                                    <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                                                        PO Number: {purchaseOrder.poNumber || "N/A"}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronDown className={cn(
                                                "h-4 w-4 text-amber-600 dark:text-amber-400 transition-transform duration-200",
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
                                                    <div className="h-1 w-1 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                                                    <span className="text-amber-800 dark:text-amber-200">Pastikan semua perubahan sudah benar sebelum menyimpan</span>
                                                </li>
                                                <li className="flex items-start gap-2 text-xs">
                                                    <div className="h-1 w-1 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                                                    <span className="text-amber-800 dark:text-amber-200">Status PO tidak dapat diubah jika sudah approved/delivered</span>
                                                </li>
                                                <li className="flex items-start gap-2 text-xs">
                                                    <div className="h-1 w-1 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                                                    <span className="text-amber-800 dark:text-amber-200">Catatan perubahan akan tersimpan dalam history</span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="flex md:flex-col gap-2">
                                            <div className="flex items-center gap-2 px-3 py-2 bg-white/50 dark:bg-black/20 rounded-lg">
                                                <History className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                                <div className="text-xs font-medium">Update Mode</div>
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
                                            <Save className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            Update Purchase Order
                                            <div className="text-sm font-normal text-muted-foreground mt-1">
                                                ID: {purchaseOrder.id} • Terakhir diubah: {new Date(purchaseOrder.updatedAt || purchaseOrder.createdAt).toLocaleDateString('id-ID')}
                                            </div>
                                        </div>
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        Semua field dengan tanda <span className="text-red-500 font-semibold">*</span> wajib diisi
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="secondary" className="px-3 py-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "h-2 w-2 rounded-full",
                                                purchaseOrder.status === PurchaseOrderStatus.APPROVED ? "bg-green-500" :
                                                    purchaseOrder.status === PurchaseOrderStatus.PENDING_APPROVAL ? "bg-yellow-500" :
                                                        purchaseOrder.status === PurchaseOrderStatus.REJECTED ? "bg-red-500" :
                                                            "bg-blue-500"
                                            )} />
                                            {purchaseOrder.status || "draft"}
                                        </div>
                                    </Badge>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleViewDetails}
                                        className="flex items-center gap-2"
                                    >
                                        <Eye className="h-4 w-4" />
                                        Lihat Detail
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <UpdateFormPO
                                purchaseOrderId={id}
                                initialData={purchaseOrder}
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
                                    Data perubahan akan tersimpan dalam history
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
                                        onClick={handleResetToOriginal}
                                        className="border-border hover:bg-accent flex items-center gap-2"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        Reset
                                    </Button>
                                    <Button
                                        type="submit"
                                        form="update-po-form"
                                        disabled={isSubmitting}
                                        className="min-w-[140px]"
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Menyimpan...
                                            </div>
                                        ) : (
                                            "Simpan Perubahan"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardFooter>
                    </Card>

                    {/* Quick Stats & Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card className="bg-gradient-to-br from-card to-green-50 dark:to-green-950/20 border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow cursor-pointer group"
                            onClick={() => router.push("/pic-area/master/supplier")}>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <User className="h-6 w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-semibold">Supplier: {purchaseOrder.supplier?.name || "N/A"}</h4>
                                        <p className="text-sm text-muted-foreground">Total: {suppliers.length} supplier</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-card to-orange-50 dark:to-orange-950/20 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-shadow cursor-pointer group"
                            onClick={() => router.push("/pic-area/master/products")}>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-semibold">Total Item: {purchaseOrder.lines?.length || 0}</h4>
                                        <p className="text-sm text-muted-foreground">Total: {products.length} produk</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-card to-purple-50 dark:to-purple-950/20 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow cursor-pointer group"
                            onClick={() => router.push(`/pic-area/logistic/purchasing/${purchaseOrder.id}`)}>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-semibold">Lihat Detail PO</h4>
                                        <p className="text-sm text-muted-foreground">Kembali ke halaman detail</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Current PO Status Card */}
                    <Card className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <ShoppingCart className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">Status Saat Ini</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {purchaseOrder.poNumber} • {purchaseOrder.supplier?.name}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold">
                                        Rp {purchaseOrder.totalAmount?.toLocaleString('id-ID') || "0"}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {purchaseOrder.lines?.length || 0} item
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PicLayout>
    );
}