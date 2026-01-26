"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import HeaderCard from "@/components/ui/header-card";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Plus,
    RefreshCw,
    Layers,
    Calculator,
    TrendingDown,
    Search,
    Filter,
    Download,
    FileText
} from "lucide-react";
import { getAssets, getAssetCategories } from "@/lib/action/accounting/asset";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { FixedAssetList } from "@/components/accounting/fixed-asset/FixedAssetList";
import { FixedAssetForm } from "@/components/accounting/fixed-asset/FixedAssetForm";
import { AssetCategoryForm } from "@/components/accounting/fixed-asset/AssetCategoryForm";
import { AssetRegisterReport } from "@/components/accounting/fixed-asset/AssetRegisterReport";
import { BulkUploadDialog } from "@/components/accounting/fixed-asset/BulkUploadDialog";

export default function FixedAssetPage() {
    const [assets, setAssets] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [assetsRes, categoriesRes] = await Promise.all([
                getAssets(`?search=${searchTerm}`),
                getAssetCategories()
            ]);
            setAssets(assetsRes.data);
            setCategories(categoriesRes.data);
        } catch (error: any) {
            toast.error(error.message || "Gagal memuat data aset");
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchData]);

    const handleRefresh = () => {
        fetchData();
        toast.success("Data diperbarui");
    };

    const totalAcquisition = assets.reduce((sum, a) => sum + parseFloat(a.acquisitionCost), 0);
    const totalBookValue = assets.reduce((sum, a) => sum + parseFloat(a.bookValue), 0);
    const totalDepreciation = totalAcquisition - totalBookValue;

    return (
        <AdminLayout title="Fixed Asset Management" role="admin">
            <div className="space-y-4 px-2 md:px-4 lg:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <Breadcrumb>
                        <BreadcrumbList className="text-[10px] sm:text-sm">
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin-area" className="text-slate-500 hover:text-blue-600 transition-colors text-[10px] sm:text-xs">
                                    Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <span className="text-slate-500 text-[10px] sm:text-xs">Accounting</span>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage className="font-semibold text-slate-900 text-[10px] sm:text-xs">Fixed Assets</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Management
                    </Badge>
                </div>

                <HeaderCard
                    title="Fixed Asset Management"
                    description="Kelola aset tetap, lacak nilai buku, dan proses penyusutan berkala secara otomatis."
                    icon={<Layers className="text-white" />}
                    gradientFrom="from-indigo-600"
                    gradientTo="to-blue-700"
                    showActionArea={true}
                    actionArea={
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsCategoryModalOpen(true)}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white text-xs"
                            >
                                <Plus className="h-3.5 w-3.5 mr-1.5" />
                                Category
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => setIsAssetModalOpen(true)}
                                className="bg-white text-indigo-700 hover:bg-slate-100 text-xs shadow-sm border-none"
                            >
                                <Plus className="h-3.5 w-3.5 mr-1.5" />
                                Add Asset
                            </Button>
                        </div>
                    }
                />

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Card className="border-none shadow-sm bg-blue-50/50">
                        <CardContent className="p-4">
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none">Total Assets</p>
                            <div className="mt-2 flex items-baseline gap-1">
                                <p className="text-xl font-black text-slate-900 leading-none">{assets.length}</p>
                            </div>
                            <p className="text-[9px] text-slate-400 font-medium italic mt-1">Item Aktif</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-indigo-50/50">
                        <CardContent className="p-4">
                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none">Total Acquisition</p>
                            <div className="mt-2 flex items-baseline gap-1">
                                <p className="text-xl font-black text-slate-900 leading-none">
                                    Rp{totalAcquisition.toLocaleString('id-ID')}
                                </p>
                            </div>
                            <p className="text-[9px] text-slate-400 font-medium italic mt-1">Biaya Perolehan</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-rose-50/50">
                        <CardContent className="p-4">
                            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest leading-none">Total Accum. Depreciation</p>
                            <div className="mt-2 flex items-baseline gap-1">
                                <p className="text-xl font-black text-rose-700 leading-none">
                                    -Rp{totalDepreciation.toLocaleString('id-ID')}
                                </p>
                            </div>
                            <p className="text-[9px] text-slate-400 font-medium italic mt-1">Akumulasi Penyusutan</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-emerald-50/50">
                        <CardContent className="p-4">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none">Net Book Value</p>
                            <div className="mt-2 flex items-baseline gap-1">
                                <p className="text-xl font-black text-emerald-700 leading-none">
                                    Rp{totalBookValue.toLocaleString('id-ID')}
                                </p>
                            </div>
                            <p className="text-[9px] text-slate-400 font-medium italic mt-1">Nilai Buku Saat Ini</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-none shadow-lg overflow-hidden rounded-xl">
                    <CardHeader className="border-b bg-slate-50/50 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <Input
                                        placeholder="Search asset name or code..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 h-9 text-xs sm:text-sm border-slate-200 focus:ring-2 focus:ring-blue-500 max-w-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="h-9 px-3 text-xs border-slate-200">
                                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                                    Filter
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsReportOpen(true)}
                                    className="h-9 px-3 text-xs border-slate-200"
                                >
                                    <Download className="h-3.5 w-3.5 mr-1.5" />
                                    Report
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsBulkModalOpen(true)}
                                    className="h-9 px-3 text-xs border-slate-200"
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                                    Bulk Upload
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <FixedAssetList assets={assets} isLoading={isLoading} onRefresh={fetchData} />
                    </CardContent>
                </Card>

                {/* Modals */}
                <FixedAssetForm
                    isOpen={isAssetModalOpen}
                    onClose={() => setIsAssetModalOpen(false)}
                    onSuccess={fetchData}
                />
                <AssetCategoryForm
                    isOpen={isCategoryModalOpen}
                    onClose={() => setIsCategoryModalOpen(false)}
                    onSuccess={fetchData}
                />
                <AssetRegisterReport
                    assets={assets}
                    isOpen={isReportOpen}
                    onClose={() => setIsReportOpen(false)}
                />
                <BulkUploadDialog
                    categories={categories}
                    isOpen={isBulkModalOpen}
                    onClose={() => setIsBulkModalOpen(false)}
                    onSuccess={fetchData}
                />
            </div>
        </AdminLayout>
    );
}
