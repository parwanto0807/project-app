"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Eye,
    Edit2,
    Trash2,
    Calculator,
    MoreVertical,
    LayoutList,
    Wrench
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { DepreciateAssetDialog } from "./DepreciateAssetDialog";
import { DisposeAssetDialog } from "./DisposeAssetDialog";
import { AssetMaintenanceDialog } from "./AssetMaintenanceDialog";
import { FixedAssetDetailsSheet } from "./FixedAssetDetailsSheet";
import { getAssetById } from "@/lib/action/accounting/asset";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface FixedAssetListProps {
    assets: any[];
    isLoading: boolean;
    onRefresh: () => void;
}

export function FixedAssetList({ assets, isLoading, onRefresh }: FixedAssetListProps) {
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [isDepreciateDialogOpen, setIsDepreciateDialogOpen] = useState(false);
    const [isDisposeDialogOpen, setIsDisposeDialogOpen] = useState(false);
    const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
    const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
    const [fullAssetDetails, setFullAssetDetails] = useState<any>(null);

    const handleViewDetails = async (assetId: string) => {
        try {
            const res = await getAssetById(assetId);
            setFullAssetDetails(res.data);
            setIsDetailsSheetOpen(true);
        } catch (error) {
            console.error("Failed to fetch asset details");
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        );
    }

    if (assets.length === 0) {
        return (
            <div className="p-12 text-center">
                <p className="text-slate-500 text-sm">Tidak ada aset ditemukan.</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader className="bg-slate-50">
                <TableRow>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 w-[120px]">Asset Code</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Asset Name</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Category</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Acquisition Cost</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Book Value</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center w-[100px]">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {assets.map((asset) => (
                    <TableRow key={asset.id} className="hover:bg-blue-50/30 transition-colors group">
                        <TableCell className="font-mono text-[11px] text-blue-600 font-semibold">{asset.assetCode}</TableCell>
                        <TableCell>
                            <div>
                                <p className="text-sm font-bold text-slate-800 leading-none">{asset.name}</p>
                                <p className="text-[10px] text-slate-400 mt-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                                    {asset.description || "No description"}
                                </p>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0">
                                {asset.category?.name}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-slate-700">
                            Rp{parseFloat(asset.acquisitionCost).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right text-sm font-bold text-emerald-600">
                            Rp{parseFloat(asset.bookValue).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell>
                            <Badge className={cn(
                                "text-[9px] font-black uppercase tracking-wider px-1.5 h-4",
                                asset.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                            )}>
                                {asset.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                                <TooltipProvider delayDuration={300}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200"
                                                onClick={() => handleViewDetails(asset.id)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-slate-800 text-[10px] text-white font-bold border-none">
                                            VIEW DETAILS
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 transition-all duration-200"
                                                onClick={() => {
                                                    setSelectedAsset(asset);
                                                    setIsMaintenanceDialogOpen(true);
                                                }}
                                            >
                                                <Wrench className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-slate-800 text-[10px] text-white font-bold border-none">
                                            MAINTENANCE
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-all duration-200"
                                                onClick={() => {
                                                    setSelectedAsset(asset);
                                                    setIsDepreciateDialogOpen(true);
                                                }}
                                            >
                                                <Calculator className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-slate-800 text-[10px] text-white font-bold border-none">
                                            DEPRECIATE
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-200"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-slate-800 text-[10px] text-white font-bold border-none">
                                            EDIT ASSET
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-all duration-200"
                                                onClick={() => {
                                                    setSelectedAsset(asset);
                                                    setIsDisposeDialogOpen(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-slate-800 text-[10px] text-white font-bold border-none">
                                            DISPOSE
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            {selectedAsset && (
                <DepreciateAssetDialog
                    asset={selectedAsset}
                    isOpen={isDepreciateDialogOpen}
                    onClose={() => {
                        setIsDepreciateDialogOpen(false);
                        setSelectedAsset(null);
                    }}
                    onSuccess={onRefresh}
                />
            )}
            {selectedAsset && (
                <DisposeAssetDialog
                    asset={selectedAsset}
                    isOpen={isDisposeDialogOpen}
                    onClose={() => {
                        setIsDisposeDialogOpen(false);
                        setSelectedAsset(null);
                    }}
                    onSuccess={onRefresh}
                />
            )}
            {selectedAsset && (
                <AssetMaintenanceDialog
                    asset={selectedAsset}
                    isOpen={isMaintenanceDialogOpen}
                    onClose={() => {
                        setIsMaintenanceDialogOpen(false);
                        setSelectedAsset(null);
                    }}
                />
            )}
            <FixedAssetDetailsSheet
                asset={fullAssetDetails}
                isOpen={isDetailsSheetOpen}
                onClose={() => {
                    setIsDetailsSheetOpen(false);
                    setFullAssetDetails(null);
                }}
            />
        </Table>
    );
}

// Helper function for cn (if not imported correctly)
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
