"use client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Plus,
    ChevronDown,
    ChevronUp,
    PackageOpen,
    Users,
    User,
    FileText,
    Calendar,
    MessageSquare,
    Edit,
    Trash2,
    Eye,
    SearchIcon
} from "lucide-react";
import React, { useState, useMemo, Fragment } from "react";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type SPK = {
    id: string;
    spkNumber: string;
    spkDate: Date;
    salesOrderId: string;
    teamId: string;
    createdById: string;
    progress: number;
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
            name: string;
            address: string;
            branch: string;
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
                id: string;
                namaLengkap: string;
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
            departemen: string;
            nik: string;
        };
        salesOrderItemSPK?: {
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
};

type TabelDataSpkProps = {
    dataSpk?: SPK[];
    role?: string;
    isLoading: boolean;
    className?: string;
    onDeleteSpk?: (spkId: string) => void;
    isDashboard?: boolean;
};

function getBasePath(role?: string) {
    return role === "super"
        ? "/super-admin-area/logistic/spk"
        : "/admin-area/logistic/spk";
}

export default function DashboardSpkTable({
    dataSpk = [],
    role,
    isLoading,
    onDeleteSpk,
    isDashboard = false,
}: TabelDataSpkProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterBy, setFilterBy] = useState("all");
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const isMobile = useMediaQuery("(max-width: 768px)");
    const basePath = getBasePath(role);

    const handleDelete = async (spkId: string) => {
        const confirmDelete = window.confirm(
            "Apakah Anda yakin ingin menghapus SPK ini? Tindakan ini tidak dapat dibatalkan."
        );
        if (confirmDelete) {
            try {
                await onDeleteSpk?.(spkId);
            } catch (error) {
                console.error("Gagal menghapus SPK:", error);
            }
        }
    };

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const filteredData = useMemo(() => {
        if (!Array.isArray(dataSpk)) return [];

        let processed = [...dataSpk];

        if (isDashboard) {
            processed = processed
                .sort((a, b) => new Date(b.spkDate).getTime() - new Date(a.spkDate).getTime())
                .slice(0, 10);
        }

        return processed.filter((spk) => {
            const matchesSearch =
                spk.spkNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                spk.salesOrder?.soNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                spk.team?.namaTeam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                spk.createdBy?.namaLengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                spk.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                spk.details?.some((detail) =>
                    detail.karyawan?.namaLengkap?.toLowerCase().includes(searchTerm.toLowerCase())
                );

            if (filterBy === "all") return matchesSearch;
            if (filterBy === "with-team" && spk.team) return matchesSearch;
            if (filterBy === "without-team" && !spk.team) return matchesSearch;
            return matchesSearch;
        });
    }, [dataSpk, searchTerm, filterBy, isDashboard]);

    const renderMobileView = () => (
        <div className="space-y-2 p-2">
            {filteredData.map((spk, idx) => {
                const isExpanded = expandedRows.has(spk.id);
                return (
                    <div key={`spk-card-${spk.id}`} className="border border-gray-700 rounded-lg dark:bg-gray-950">
                        {/* Baris utama yang sederhana */}
                        <div className="p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-sm font-medium text-gray-500 w-6">#{idx + 1}</span>
                                    <div className="min-w-0 flex-1">
                                        <Badge
                                            variant="outline"
                                            className="font-medium text-xs bg-blue-50 text-blue-700 border-blue-200 mb-1"
                                        >
                                            {spk.spkNumber} - {spk.team?.namaTeam}
                                        </Badge>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground">
                                                {spk.salesOrder.project?.name}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Progress</p>
                                            <div className="flex items-center gap-2">
                                                <Progress
                                                    value={spk.progress}
                                                    className={cn(
                                                        "h-2 flex-1",
                                                        spk.progress >= 80
                                                            ? "bg-emerald-100 [&>div]:bg-emerald-500"
                                                            : spk.progress >= 50
                                                                ? "bg-sky-100 [&>div]:bg-sky-500"
                                                                : spk.progress >= 20
                                                                    ? "bg-amber-100 [&>div]:bg-amber-500"
                                                                    : "bg-rose-100 [&>div]:bg-rose-500"
                                                    )}
                                                />
                                                <span className="text-xs font-bold w-8">
                                                    {spk.progress}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => toggleRow(spk.id)}
                                        className="h-8 w-8 p-0 bg-cyan-200 hover:bg-cyan-100 dark:hover:bg-cyan-100"
                                    >
                                        {isExpanded ? (
                                            <ChevronUp className="h-4 w-4 text-gray-700" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-gray-700" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Detail yang expandable */}
                        {isExpanded && (
                            <div className="border-t border-gray-200 p-3 space-y-3 dark:bg-gray-950">
                                {/* Informasi dasar */}
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <p className="text-xs text-gray-500">Tanggal SPK</p>
                                        <p className="font-medium">
                                            {new Date(spk.spkDate).toLocaleDateString("id-ID")}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium truncate">
                                            SO : {spk.salesOrder?.soNumber || "-"}
                                        </p>
                                    </div>
                                </div>

                                {/* Tim/Karyawan */}
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Tim/Karyawan</p>
                                    {spk.team ? (
                                        <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-700">
                                            {spk.team.namaTeam}
                                        </Badge>
                                    ) : spk.details && spk.details.length > 0 ? (
                                        <div className="space-y-1">
                                            {spk.details.slice(0, 3).map((detail) => (
                                                <div key={detail.id} className="flex items-center text-sm">
                                                    <User className="h-3 w-3 mr-1 text-emerald-600" />
                                                    <span>{detail.karyawan?.namaLengkap}</span>
                                                </div>
                                            ))}
                                            {spk.details.length > 3 && (
                                                <p className="text-xs text-gray-500">
                                                    +{spk.details.length - 3} lainnya
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-500">-</span>
                                    )}
                                </div>

                                {/* Dibuat Oleh */}
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Dibuat Oleh</p>
                                    <p className="text-sm font-medium">{spk.createdBy?.namaLengkap}</p>
                                </div>
                                <div className="space-y-2">
                                    {spk.details.map((detail, index) => (
                                        <div
                                            key={`task-${detail.id}`}
                                            className="flex flex-col px-3 bg-gray-50 dark:bg-slate-900"
                                        >
                                            <div className="flex items-center mb-1">
                                                <User className="h-4 w-4 mr-2 text-emerald-600 flex-shrink-0 ml-6" />
                                                <p className="font-semibold text-sm truncate">
                                                    {index + 1}🔸{detail.karyawan?.namaLengkap || "Karyawan tidak ditentukan"}
                                                </p>
                                                <p className="text-xs text-gray-600 pl-4">
                                                    {detail.karyawan?.jabatan} • {detail.karyawan?.departemen}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Items Sales Order */}
                                {spk.salesOrder.items && spk.salesOrder.items.length > 0 && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Items</p>
                                        <div className="space-y-1 max-h-52 overflow-y-auto">
                                            {spk.salesOrder.items.map((detail, index) => (
                                                <div
                                                    key={`task-${detail.id}`}
                                                    className="flex flex-col px-3 bg-gray-50 dark:bg-slate-900"
                                                >
                                                    <div className="flex items-center mb-1">
                                                        <PackageOpen className="h-4 w-4 mr-2 text-emerald-600 flex-shrink-0 ml-6" />
                                                        <p className="font-semibold text-sm truncate">
                                                            {index + 1}🔸{detail.name || "Item tidak ditentukan"}
                                                        </p>
                                                        <p className="text-xs fornt bold  pl-4">
                                                            {detail.qty} • {detail.uom}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Catatan */}
                                {spk.notes && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Catatan</p>
                                        <p className="text-sm p-2 rounded border border-amber-200">
                                            {spk.notes}
                                        </p>
                                    </div>
                                )}

                                {/* Actions */}
                                {!isDashboard && (
                                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                                        <Link href={`${basePath}/view/${spk.id}`} className="flex-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full text-xs h-8"
                                            >
                                                <Eye className="h-3 w-3 mr-1" />
                                                Lihat
                                            </Button>
                                        </Link>
                                        {role === "admin" && (
                                            <>
                                                <Link href={`${basePath}/update/${spk.id}`} className="flex-1">
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        className="w-full text-xs h-8"
                                                    >
                                                        <Edit className="h-3 w-3 mr-1" />
                                                        Edit
                                                    </Button>
                                                </Link>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="flex-1 text-xs h-8"
                                                    onClick={() => handleDelete(spk.id)}
                                                >
                                                    <Trash2 className="h-3 w-3 mr-1" />
                                                    Hapus
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const renderDesktopView = () => (
        <div className="rounded-md border">
            <div className="min-w-[800px]">
                <Table>
                    <TableHeader className={cn(
                        "bg-cyan-50 dark:bg-gray-800",
                        isDashboard && "h-8"
                    )}>
                        <TableRow>
                            <TableHead className={cn("w-12", isDashboard && "py-3")}>#</TableHead>
                            <TableHead className={isDashboard ? "py-1" : ""}>Nomor SPK</TableHead>
                            <TableHead className={isDashboard ? "py-1" : ""}>Tanggal</TableHead>
                            <TableHead className={isDashboard ? "py-1" : ""}>Tim / Karyawan</TableHead>
                            <TableHead className={isDashboard ? "py-1" : ""}>Pembuat</TableHead>
                            <TableHead className={cn("w-1/12", isDashboard ? "py-1" : "")}>Progress</TableHead>
                            <TableHead className={isDashboard ? "py-1" : ""}>Notes</TableHead>
                            {!isDashboard && <TableHead className={isDashboard ? "py-1" : ""}>Aksi</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: isDashboard ? 5 : 5 }).map((_, idx) => (
                                <TableRow key={`skeleton-${idx}`} className={isDashboard ? "h-8" : ""}>
                                    <TableCell><Skeleton className={cn("w-6", isDashboard ? "h-3" : "h-4")} /></TableCell>
                                    <TableCell><Skeleton className={cn(isDashboard ? "h-3 w-20" : "h-5 w-24")} /></TableCell>
                                    <TableCell><Skeleton className={cn(isDashboard ? "h-3 w-16" : "h-5 w-20")} /></TableCell>
                                    <TableCell><Skeleton className={cn(isDashboard ? "h-3 w-28" : "h-5 w-32")} /></TableCell>
                                    <TableCell><Skeleton className={cn(isDashboard ? "h-3 w-24" : "h-5 w-28")} /></TableCell>
                                    <TableCell><Skeleton className={cn(isDashboard ? "h-3 w-20" : "h-5 w-28")} /></TableCell>
                                    <TableCell><Skeleton className={cn(isDashboard ? "h-3 w-20" : "h-5 w-28")} /></TableCell>
                                    {!isDashboard && (
                                        <TableCell className="flex gap-1">
                                            <Skeleton className={isDashboard ? "h-6 w-6" : "h-8 w-8"} />
                                            {role === "admin" && (
                                                <>
                                                    <Skeleton className={isDashboard ? "h-6 w-6" : "h-8 w-8"} />
                                                    <Skeleton className={isDashboard ? "h-6 w-6" : "h-8 w-8"} />
                                                </>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        ) : filteredData.length > 0 ? (
                            filteredData.map((spk, idx) => {
                                const isExpanded = expandedRows.has(spk.id);
                                return (
                                    <Fragment key={`spk-${spk.id}`}>
                                        {/* Baris Utama */}
                                        <TableRow
                                            className={cn(
                                                "hover:bg-muted/50 transition-colors cursor-pointer",
                                                isDashboard && "h-12"
                                            )}
                                            onClick={() => toggleRow(spk.id)}
                                        >
                                            <TableCell className={isDashboard ? "py-1" : ""}>
                                                <div className="flex items-center gap-2">
                                                    {idx + 1}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 w-6 p-0 hover:bg-transparent"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleRow(spk.id);
                                                        }}
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronUp className="h-4 w-4 text-gray-700" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 text-gray-700" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className={isDashboard ? "py-1" : ""}>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "font-medium bg-blue-50 text-blue-700 border-blue-200",
                                                        isDashboard && "text-xs px-1.5"
                                                    )}
                                                >
                                                    {spk.spkNumber}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={cn("font-medium", isDashboard ? "py-1 text-xs" : "")}>
                                                <div className="flex items-center">
                                                    <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                                                    {new Date(spk.spkDate).toLocaleDateString("id-ID", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                    })}
                                                </div>
                                            </TableCell>
                                            <TableCell className={isDashboard ? "py-1" : ""}>
                                                {spk.team ? (
                                                    <div className="flex items-center">
                                                        <Users
                                                            className={cn("mr-2 text-indigo-600", isDashboard ? "h-3 w-3" : "h-4 w-4")}
                                                        />
                                                        <Badge
                                                            variant="secondary"
                                                            className={cn(
                                                                "bg-indigo-50 text-indigo-700 border-indigo-200",
                                                                isDashboard && "text-xs px-1.5"
                                                            )}
                                                        >
                                                            {spk.team.namaTeam}
                                                        </Badge>
                                                    </div>
                                                ) : spk.details && spk.details.length > 0 ? (
                                                    <div className="flex items-center">
                                                        <User
                                                            className={cn("text-emerald-600 mr-2", isDashboard ? "h-3 w-3" : "h-4 w-4")}
                                                        />
                                                        <div className="flex flex-wrap gap-0.5">
                                                            {spk.details.slice(0, 2).map((detail, i) => (
                                                                <Badge
                                                                    key={`detail-${detail.id}-${i}`}
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "bg-emerald-50 text-emerald-700 border-emerald-200",
                                                                        isDashboard ? "text-xs px-1 py-0" : "text-xs px-2 py-0.5"
                                                                    )}
                                                                >
                                                                    {detail.karyawan?.namaLengkap || "Tanpa Nama"}
                                                                </Badge>
                                                            ))}
                                                            {spk.details.length > 2 && (
                                                                <Badge variant="outline" className={isDashboard ? "text-xs px-1 py-0" : "text-xs"}>
                                                                    +{spk.details.length - 2}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center">
                                                        <User className={cn("text-gray-400 mr-2", isDashboard ? "h-3 w-3" : "h-4 w-4")} />
                                                        <span className="text-muted-foreground">-</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className={cn("font-medium", isDashboard ? "py-1 text-xs" : "")}>
                                                <div className="flex items-center">
                                                    <User
                                                        className={cn("text-amber-600 mr-2", isDashboard ? "h-3 w-3" : "h-4 w-4")}
                                                    />
                                                    {spk.createdBy?.namaLengkap || <span className="text-muted-foreground">-</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className={isDashboard ? "py-1" : ""}>
                                                <div className="flex items-center gap-2">
                                                    <Progress
                                                        value={spk.progress}
                                                        className={cn(
                                                            "transition-colors duration-300",
                                                            isDashboard ? "h-1.5" : "h-2",
                                                            spk.progress >= 80
                                                                ? "bg-emerald-100 [&>div]:bg-emerald-500"
                                                                : spk.progress >= 50
                                                                    ? "bg-sky-100 [&>div]:bg-sky-500"
                                                                    : spk.progress >= 20
                                                                        ? "bg-amber-100 [&>div]:bg-amber-500"
                                                                        : "bg-rose-100 [&>div]:bg-rose-500"
                                                        )}
                                                    />
                                                    <span
                                                        className={cn(
                                                            "text-muted-foreground min-w-[3ch] text-right font-medium",
                                                            isDashboard ? "text-xs" : "text-xs"
                                                        )}
                                                    >
                                                        {spk.progress}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className={isDashboard ? "py-1" : ""}>
                                                {spk.notes ? (
                                                    <div className="flex items-center">
                                                        <MessageSquare
                                                            className={cn("mr-2 text-amber-600", isDashboard ? "h-3 w-3" : "h-4 w-4")}
                                                        />
                                                        <span className={cn("line-clamp-1", isDashboard && "text-xs")}>
                                                            {spk.notes}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            {!isDashboard && (
                                                <TableCell>
                                                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                        <Link href={`${basePath}/view/${spk.id}`}>
                                                            <Button
                                                                size={isDashboard ? "sm" : "default"}
                                                                variant="outline"
                                                                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                                            >
                                                                <Eye className={isDashboard ? "h-3 w-3" : "h-4 w-4"} />
                                                            </Button>
                                                        </Link>
                                                        {role === "admin" && (
                                                            <>
                                                                <Link href={`${basePath}/update/${spk.id}`}>
                                                                    <Button
                                                                        size={isDashboard ? "sm" : "default"}
                                                                        variant="secondary"
                                                                        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                                                    >
                                                                        <Edit className={isDashboard ? "h-3 w-3" : "h-4 w-4"} />
                                                                    </Button>
                                                                </Link>
                                                                <Button
                                                                    size={isDashboard ? "sm" : "default"}
                                                                    variant="destructive"
                                                                    className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(spk.id);
                                                                    }}
                                                                >
                                                                    <Trash2 className={isDashboard ? "h-3 w-3" : "h-4 w-4"} />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>

                                        {/* Baris Detail (Expandable) */}
                                        {isExpanded && (
                                            <TableRow>
                                                <TableCell colSpan={isDashboard ? 7 : 8} className="p-0">
                                                    <div className="p-4 border-t border-blue-200 bg-gray-50 dark:bg-slate-950 text-sm">
                                                        <h4 className="font-bold mb-3 text-sm flex items-center text-blue-800">
                                                            <PackageOpen className="h-4 w-4 mr-2 text-blue-600" />
                                                            Detail SPK: {spk.spkNumber}
                                                        </h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                                                            <div className="flex items-start p-2 bg-gray-50 dark:bg-slate-900 rounded-lg border">
                                                                <Calendar className="h-4 w-4 mr-2 text-purple-600 mt-0.5 flex-shrink-0" />
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Tanggal SPK</p>
                                                                    <p className="font-medium text-sm">
                                                                        {new Date(spk.spkDate).toLocaleDateString("id-ID", {
                                                                            day: "2-digit",
                                                                            month: "long",
                                                                            year: "numeric",
                                                                        })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-start p-2 bg-gray-50 dark:bg-slate-900 rounded-lg border">
                                                                <FileText className="h-4 w-4 mr-2 text-blue-600 mt-0.5 flex-shrink-0" />
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Sales Order</p>
                                                                    <p className="font-medium text-sm">{spk.salesOrder?.soNumber || "-"}</p>
                                                                    <p className="text-xs text-gray-600 mt-1">{spk.salesOrder?.project?.name || "-"}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-start p-2 bg-gray-50 dark:bg-slate-900 rounded-lg border">
                                                                <User className="h-4 w-4 mr-2 text-amber-600 mt-0.5 flex-shrink-0" />
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Dibuat Oleh</p>
                                                                    <p className="font-medium text-sm">{spk.createdBy?.namaLengkap || "-"}</p>
                                                                    <p className="text-xs text-gray-600 mt-1">{spk.createdBy?.jabatan || "-"}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2">
                                                            <div className="col-span-1">
                                                                {spk.details && spk.details.length > 0 && (
                                                                    <div className="mt-3">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Users className="h-4 w-4 text-indigo-600" />
                                                                            <span className="font-semibold text-sm text-gray-700 bg-purple-100 px-2 py-1 rounded">
                                                                                Detail Tugas:
                                                                            </span>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            {spk.details.map((detail, index) => (
                                                                                <div
                                                                                    key={`task-${detail.id}`}
                                                                                    className="flex flex-col px-3 bg-gray-50 dark:bg-slate-900"
                                                                                >
                                                                                    <div className="flex items-center mb-1">
                                                                                        <User className="h-4 w-4 mr-2 text-emerald-600 flex-shrink-0 ml-6" />
                                                                                        <p className="font-semibold text-sm truncate">
                                                                                            {index + 1}🔸{detail.karyawan?.namaLengkap || "Karyawan tidak ditentukan"}
                                                                                        </p>
                                                                                        <p className="text-xs text-gray-600 pl-4">
                                                                                            {detail.karyawan?.jabatan} • {detail.karyawan?.departemen}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="col-span-1">
                                                                {spk.salesOrder.items && spk.salesOrder.items.length > 0 && (
                                                                    <div className="mt-3">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Users className="h-4 w-4 text-indigo-600" />
                                                                            <span className="font-semibold text-sm text-gray-700 bg-purple-100 px-2 py-1 rounded">
                                                                                Detail Item:
                                                                            </span>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            {spk.salesOrder.items.map((detail, index) => (
                                                                                <div
                                                                                    key={`task-${detail.id}`}
                                                                                    className="flex flex-col px-3 bg-gray-50 dark:bg-slate-900"
                                                                                >
                                                                                    <div className="flex items-center mb-1">
                                                                                        <PackageOpen className="h-4 w-4 mr-2 text-emerald-600 flex-shrink-0 ml-6" />
                                                                                        <p className="font-semibold text-sm truncate">
                                                                                            {index + 1}🔸{detail.name || "Item tidak ditentukan"}
                                                                                        </p>
                                                                                        <p className="text-xs fornt bold  pl-4">
                                                                                            {detail.qty} • {detail.uom}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {spk.notes && (
                                                            <div className="mt-3">
                                                                <h5 className="font-semibold mb-2 text-sm flex items-center text-amber-700">
                                                                    <MessageSquare className="h-4 w-4 mr-2 text-amber-600" />
                                                                    Catatan Khusus:
                                                                </h5>
                                                                <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-lg border border-amber-200">
                                                                    <p className="text-sm text-amber-800">{spk.notes}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </Fragment>
                                );
                            })
                        ) : (
                            <TableRow className={isDashboard ? "h-8" : ""}>
                                <TableCell colSpan={isDashboard ? 7 : 8} className="text-center py-8">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <PackageOpen className="h-12 w-12 mb-2 text-gray-300" />
                                        <p className="text-sm font-medium">
                                            {searchTerm || filterBy !== "all"
                                                ? "Tidak ada data SPK yang sesuai pencarian"
                                                : "Tidak ada data SPK"}
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <Card className="border shadow-sm ">
                <CardHeader className="flex items-center justify-between pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <PackageOpen className="h-5 w-5 text-blue-600" />
                        10 Recent SPK
                    </CardTitle>
                    <Link href={`${basePath}`} passHref>
                        <Button variant="outline" size="sm" className="text-xs h-8" hidden>
                            View All
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent className="p-0">
                    {renderMobileView()}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <PackageOpen className="h-5 w-5" />
                        5 Recent SPK
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <SearchIcon className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 transform text-muted-foreground" />
                            <Input
                                placeholder="Search orders..."
                                className="w-48 pl-7 h-8 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Link href={`${basePath}`} passHref>
                            <Button variant="outline" size="sm" className="h-8" hidden>
                                View All
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardHeader>

            <div className="sm:hidden p-4 space-y-3 border-b border-border bg-white dark:bg-gray-950">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <Input
                        placeholder="Cari SPK..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9"
                    />
                </div>

                <div className="flex gap-2">
                    <Select value={filterBy} onValueChange={setFilterBy}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua</SelectItem>
                            <SelectItem value="with-team">Dengan Tim</SelectItem>
                            <SelectItem value="without-team">Tanpa Tim</SelectItem>
                        </SelectContent>
                    </Select>

                    <Link href="/admin-area/logistic/spk/create" className="flex-1">
                        <Button
                            variant="default"
                            className="w-full bg-cyan-600 text-white hover:bg-cyan-700 px-4 py-2 flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            Tambah SPK
                        </Button>
                    </Link>
                </div>
            </div>

            <CardContent className="p-0 bg-white dark:bg-gray-950">
                {isLoading ? (
                    <div className="p-4 space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full rounded" />
                        ))}
                    </div>
                ) : (
                    <>
                        {isMobile ? renderMobileView() : renderDesktopView()}
                    </>
                )}
            </CardContent>
        </Card>
    );
}