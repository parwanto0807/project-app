"use client";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Calendar,
    DollarSign,
    MapPin,
    Clock,
    Tag,
    Activity,
    Info,
    Wrench,
    Calculator
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface FixedAssetDetailsSheetProps {
    asset: any;
    isOpen: boolean;
    onClose: () => void;
}

export function FixedAssetDetailsSheet({ asset, isOpen, onClose }: FixedAssetDetailsSheetProps) {
    if (!asset) return null;

    const acquisitionCost = parseFloat(asset.acquisitionCost || "0");
    const bookValue = parseFloat(asset.bookValue || "0");
    const totalDepreciation = parseFloat(asset.totalDepreciation || "0");

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-[600px] overflow-y-auto bg-slate-50/50 backdrop-blur-xl border-l border-slate-200">
                <SheetHeader className="pb-6 border-b border-slate-100 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Activity className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <SheetTitle className="text-xl font-bold text-slate-800">{asset.name}</SheetTitle>
                                <SheetDescription className="text-slate-500 font-mono text-xs">
                                    {asset.assetCode}
                                </SheetDescription>
                            </div>
                        </div>
                        <Badge className={
                            asset.status === 'ACTIVE'
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                : "bg-slate-100 text-slate-600"
                        }>
                            {asset.status}
                        </Badge>
                    </div>
                </SheetHeader>

                <div className="grid grid-cols-3 gap-4 mb-8">
                    <Card className="border-none shadow-sm bg-blue-600 text-white">
                        <CardHeader className="p-3 pb-0">
                            <CardTitle className="text-[10px] uppercase opacity-80 font-bold tracking-wider">Book Value</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-1">
                            <p className="text-sm font-bold">Rp{bookValue.toLocaleString('id-ID')}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white border border-slate-100">
                        <CardHeader className="p-3 pb-0">
                            <CardTitle className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Cost</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-1">
                            <p className="text-sm font-bold text-slate-700">Rp{acquisitionCost.toLocaleString('id-ID')}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white border border-slate-100">
                        <CardHeader className="p-3 pb-0">
                            <CardTitle className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Acc. Deprec</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-1">
                            <p className="text-sm font-bold text-rose-600">Rp{totalDepreciation.toLocaleString('id-ID')}</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <section>
                        <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                            <Info className="h-3.5 w-3.5" /> General Information
                        </h4>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div className="space-y-1">
                                <Label text="Category" icon={<Tag className="h-3 w-3" />} />
                                <p className="text-sm font-semibold text-slate-700">{asset.category?.name || "-"}</p>
                            </div>
                            <div className="space-y-1">
                                <Label text="Location" icon={<MapPin className="h-3 w-3" />} />
                                <p className="text-sm font-semibold text-slate-700">{asset.location || "Internal Store"}</p>
                            </div>
                            <div className="space-y-1">
                                <Label text="Acquisition Date" icon={<Calendar className="h-3 w-3" />} />
                                <p className="text-sm font-semibold text-slate-700">
                                    {asset.acquisitionDate ? format(new Date(asset.acquisitionDate), "dd MMMM yyyy", { locale: id }) : "-"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Label text="Useful Life" icon={<Clock className="h-3 w-3" />} />
                                <p className="text-sm font-semibold text-slate-700">{asset.usefulLife || asset.category?.usefulLife} Years</p>
                            </div>
                        </div>
                    </section>

                    <Tabs defaultValue="maintenance" className="w-full">
                        <TabsList className="w-full flex bg-slate-100/50 p-1 rounded-lg">
                            <TabsTrigger value="maintenance" className="flex-1 text-xs font-bold gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600">
                                <Wrench className="h-3.5 w-3.5" /> Maintenance
                            </TabsTrigger>
                            <TabsTrigger value="depreciation" className="flex-1 text-xs font-bold gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-600">
                                <Calculator className="h-3.5 w-3.5" /> Depreciation
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="maintenance" className="mt-4">
                            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="text-[10px] h-9">Date & Vendor</TableHead>
                                            <TableHead className="text-[10px] h-9">Description</TableHead>
                                            <TableHead className="text-[10px] h-9 text-right">Cost</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(asset.maintenances || []).length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-slate-400 italic text-xs">
                                                    No maintenance recorded
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            asset.maintenances.map((m: any) => (
                                                <TableRow key={m.id} className="text-[11px]">
                                                    <TableCell>
                                                        <p className="font-bold">{format(new Date(m.maintenanceDate), "dd/MM/yy")}</p>
                                                        <p className="text-[10px] text-slate-500">{m.supplier?.name || m.performedBy || "-"}</p>
                                                    </TableCell>
                                                    <TableCell className="max-w-[150px] truncate">{m.description}</TableCell>
                                                    <TableCell className="text-right font-bold text-rose-600">
                                                        Rp{parseFloat(m.cost).toLocaleString('id-ID')}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        <TabsContent value="depreciation" className="mt-4">
                            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="text-[10px] h-9">Date</TableHead>
                                            <TableHead className="text-[10px] h-9">Period</TableHead>
                                            <TableHead className="text-[10px] h-9 text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(asset.depreciations || []).length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-slate-400 italic text-xs">
                                                    No depreciation logs found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            asset.depreciations.map((d: any) => (
                                                <TableRow key={d.id} className="text-[11px]">
                                                    <TableCell className="font-semibold">{format(new Date(d.depreciationDate), "dd/MM/yyyy")}</TableCell>
                                                    <TableCell>{d.periodId}</TableCell>
                                                    <TableCell className="text-right font-bold text-emerald-600">
                                                        Rp{parseFloat(d.amount).toLocaleString('id-ID')}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function Label({ text, icon }: { text: string; icon: React.ReactNode }) {
    return (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {icon}
            {text}
        </div>
    );
}
