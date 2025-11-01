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
    Pagination,
    PaginationContent,
    PaginationItem,
} from "@/components/ui/pagination";
import {
    Plus,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    ChevronLeft,
    PackageOpen,
    Users,
    User,
    FileText,
    Calendar,
    MessageSquare,
    Edit,
    Trash2,
    MoreHorizontal,
    Eye,
    Download,
    SearchIcon,
    BarChart2,
    MapPin,
    Building,
    ClipboardList,
} from "lucide-react";
import React, { useState, useMemo, Fragment } from "react";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useRouter } from "next/navigation";
// import { SalesOrderDocument, SalesOrderItem } from "@/lib/validations/sales-order";

import { SPKPDF } from "@/components/spk/SPKPdf";
import SPKPdfPreview from "./spkPdfPreview";
import { pdf } from "@react-pdf/renderer";
import { mapFormValuesToPdfProps, SpkPdfValues } from "@/lib/validations/spk-mapper";
import { SpkFormValuesPdfProps } from "@/types/spk";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";


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
            name: string;      // diisi dari customer.name
            address: string;   // ✅ baru
            branch: string;    // ✅ baru
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
};

function getBasePath(role?: string) {
    const paths: Record<string, string> = {
        super: "/super-admin-area/logistic/spk",
        pic: "/pic-area/logistic/spk",
        admin: "/admin-area/logistic/spk",
    }
    return paths[role ?? "admin"] || "/admin-area/logistic/spk"
}

export function normalizePdfProps(data: SpkFormValuesPdfProps) {
    return {
        ...data,
        spkDate: new Date(data.spkDate), // pastikan Date
    };
}

// Hook untuk mengelola aksi PDF
function usePdfActions() {
    const [pdfDialogOpen, setPdfDialogOpen] = React.useState(false);
    const [selectedSpk, setSelectedSpk] = React.useState<SpkFormValuesPdfProps | null>(null);
    const handleDownloadPdf = async (spk: SpkPdfValues) => {
        try {
            const pdfData = mapFormValuesToPdfProps(spk);

            const normalized = normalizePdfProps(pdfData);
            const blob = await pdf(<SPKPDF data={normalized} />).toBlob();
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `SPK-${spk.spkNumber}.pdf`;
            a.click();

            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (error) {
            console.error("Error preparing PDF:", error);
        }
    };

    const handlePreview = (spk: SpkPdfValues) => {
        try {
            const pdfData = mapFormValuesToPdfProps(spk);
            const normalized = normalizePdfProps(pdfData);
            setSelectedSpk(normalized);
            setPdfDialogOpen(true);
        } catch (error) {
            console.error("Error previewing PDF:", error);
        }
    };

    return {
        pdfDialogOpen,
        selectedSpk,
        handleDownloadPdf,
        handlePreview,
        setPdfDialogOpen
    };
}

// Komponen Progress dengan indicator yang lebih informatif
const ProgressIndicator = ({ progress }: { progress: number }) => {
    const getProgressColor = (progress: number) => {
        if (progress >= 80) return "bg-emerald-500";
        if (progress >= 50) return "bg-sky-500";
        if (progress >= 20) return "bg-amber-500";
        return "bg-rose-500";
    };

    const getProgressBgColor = (progress: number) => {
        if (progress >= 80) return "bg-emerald-100 dark:bg-emerald-900/20";
        if (progress >= 50) return "bg-sky-100 dark:bg-sky-900/20";
        if (progress >= 20) return "bg-amber-100 dark:bg-amber-900/20";
        return "bg-rose-100 dark:bg-rose-900/20";
    };

    return (
        <div className="flex items-center gap-3">
            <div className="flex-1">
                <div className={`h-2 w-full rounded-full ${getProgressBgColor(progress)} transition-colors duration-300`}>
                    <div
                        className={`h-full rounded-full ${getProgressColor(progress)} transition-all duration-500 ease-out`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
            <span className={cn(
                "text-sm font-medium min-w-[3ch] text-right transition-colors duration-300",
                progress >= 80 ? "text-emerald-700 dark:text-emerald-300" :
                    progress >= 50 ? "text-sky-700 dark:text-sky-300" :
                        progress >= 20 ? "text-amber-700 dark:text-amber-300" :
                            "text-rose-700 dark:text-rose-300"
            )}>
                {progress}%
            </span>
        </div>
    );
};

// Komponen Detail Card yang lebih profesional
const DetailCard = ({ icon: Icon, title, children, className }: {
    icon: React.ElementType;
    title: string;
    children: React.ReactNode;
    className?: string;
}) => (
    <div className={cn("flex items-start space-x-3 p-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/30 rounded-lg border border-gray-100 dark:border-gray-700", className)}>
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">{title}</h4>
            <div className="text-gray-800 dark:text-gray-200">{children}</div>
        </div>
    </div>
);

// Komponen Karyawan Card yang lebih elegan
const KaryawanCard = ({ karyawan, lokasiUnit }: {
    karyawan: { namaLengkap: string; jabatan: string; departemen: string; nik: string };
    lokasiUnit?: string | null;
}) => (
    <div className="p-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
                    {karyawan.namaLengkap.charAt(0)}
                </div>
                <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{karyawan.namaLengkap}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{karyawan.jabatan}</p>
                    <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {karyawan.departemen}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-500">NIK: {karyawan.nik}</span>
                    </div>
                </div>
            </div>
        </div>
        {lokasiUnit && (
            <div className="mt-3 flex items-center text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4 mr-1 text-rose-500" />
                <span className="font-medium">Lokasi:</span>
                <span className="ml-1">{lokasiUnit}</span>
            </div>
        )}
    </div>
);

export default function TabelDataSpk({
    dataSpk = [],
    role,
    isLoading,
    onDeleteSpk,
}: TabelDataSpkProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterBy, setFilterBy] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const itemsPerPage = 10;
    const basePath = getBasePath(role);
    const router = useRouter();
    const pdfActions = usePdfActions();

    const isMobile = useMediaQuery("(max-width: 768px)");
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

    const filteredData = useMemo(() => {
        if (!Array.isArray(dataSpk)) return [];

        return dataSpk.filter((spk) => {
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
    }, [dataSpk, searchTerm, filterBy]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage]);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
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

    const getPageNumbers = () => {
        const totalPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(totalPagesToShow / 2));
        const endPage = Math.min(totalPages, startPage + totalPagesToShow - 1);
        if (endPage - startPage + 1 < totalPagesToShow && startPage > 1) {
            startPage = Math.max(1, endPage - totalPagesToShow + 1);
        }
        return Array.from(
            { length: endPage - startPage + 1 },
            (_, i) => startPage + i
        );
    };

    const pageNumbers = getPageNumbers();

    // Fungsi untuk memetakan data SPK ke format yang diharapkan oleh PDF
    const mapSpkToPdfValues = (spk: SPK): SpkPdfValues => {
        const spkDate = spk.spkDate instanceof Date ? spk.spkDate : new Date(spk.spkDate);

        return {
            id: spk.id,
            spkNumber: spk.spkNumber,
            spkDate: spkDate,
            salesOrderId: spk.salesOrderId,
            teamId: spk.teamId,
            createdById: spk.createdById,

            createdBy: {
                id: spk.createdBy?.id || "",
                namaLengkap: spk.createdBy?.namaLengkap || "",
                jabatan: spk.createdBy?.jabatan ?? null,
                nik: spk.createdBy?.nik ?? null,
                departemen: spk.createdBy?.departemen ?? null,
            },

            salesOrder: spk.salesOrder
                ? {
                    id: spk.salesOrder.id,
                    soNumber: spk.salesOrder.soNumber,
                    projectName: spk.salesOrder.project?.name || "",
                    customer:
                    {
                        name: spk.salesOrder.customer?.name || "",
                        address: spk.salesOrder.customer?.address || "",
                        branch: spk.salesOrder.customer?.branch || "",
                    },
                    project: spk.salesOrder.project
                        ? {
                            id: spk.salesOrder.project.id || "",
                            name: spk.salesOrder.project.name || "",
                        }
                        : undefined,
                    items:
                        spk.salesOrder.items?.map((item) => ({
                            id: item.id,
                            lineNo: item.lineNo,
                            itemType: item.itemType,
                            name: item.name ?? "",
                            description: item.description ?? "",
                            qty: Number(item.qty) || 0,
                            uom: item.uom ?? "",
                            unitPrice: Number(item.unitPrice) || 0,
                            discount: Number(item.discount) || 0,
                            taxRate: Number(item.taxRate) || 0,
                            lineTotal: Number(item.lineTotal) || 0,
                        })) || [],
                }
                : {
                    id: "",
                    soNumber: "",
                    projectName: "",
                    customer: { name: "", address: "", branch: "" },
                    project: undefined,
                    items: [],
                },

            team: spk.team
                ? {
                    id: spk.team.id,
                    namaTeam: spk.team.namaTeam,
                    teamKaryawan: spk.team.teamKaryawan
                        ? {
                            teamId: spk.team.teamKaryawan.teamId,
                            karyawan: spk.team.teamKaryawan.karyawan
                                ? {
                                    id: spk.team.teamKaryawan.karyawan.id,
                                    namaLengkap: spk.team.teamKaryawan.karyawan.namaLengkap,
                                    jabatan: spk.team.teamKaryawan.karyawan.jabatan,
                                    departemen: spk.team.teamKaryawan.karyawan.departemen,
                                }
                                : undefined,
                        }
                        : undefined,
                }
                : null,
            details:
                spk.details?.map((detail) => ({
                    id: detail.id,
                    karyawan: detail.karyawan
                        ? {
                            id: detail.karyawan?.id ?? "",
                            namaLengkap: detail.karyawan?.namaLengkap ?? "",
                            jabatan: detail.karyawan?.jabatan ?? "",
                            nik: detail.karyawan?.nik ?? "",
                            departemen: detail.karyawan?.departemen ?? "",
                        }
                        : undefined,
                    lokasiUnit: detail.lokasiUnit ?? null,
                    salesOrderItemSPK: detail.salesOrderItemSPK
                        ? {
                            id: detail.salesOrderItemSPK.id,
                            name: detail.salesOrderItemSPK.name ?? "",
                            description: detail.salesOrderItemSPK.description ?? "",
                            qty: Number(detail.salesOrderItemSPK.qty) || 0,
                            uom: detail.salesOrderItemSPK.uom ?? "",
                        }
                        : undefined,
                })) || [],

            notes: spk.notes ?? null,
            createdAt: new Date(spk.createdAt),
            updatedAt: new Date(spk.updatedAt),
        };
    };

    // 👇 RENDER MOBILE CARD VIEW YANG DIPERBAIKI
    const renderMobileView = () => (
        <div className="space-y-4 p-2">
            {paginatedData.map((spk, idx) => {
                const spkPdfData = mapSpkToPdfValues(spk);
                const isExpanded = expandedRows.has(spk.id);

                return (
                    <Card key={`spk-card-${spk.id}`} className="overflow-hidden border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-4">
                            {/* Header Card */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="secondary" className="font-medium bg-primary/10 text-primary">
                                            #{(currentPage - 1) * itemsPerPage + idx + 1}
                                        </Badge>
                                        <h3 className="font-bold text-xs md:text-lg text-gray-900 dark:text-white">{spk.spkNumber}</h3>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                        <Calendar className="h-4 w-4 mr-1" />
                                        {new Date(spk.spkDate).toLocaleDateString("id-ID", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Informasi Utama */}
                            <div className="space-y-3">
                                <div className="flex items-center text-sm">
                                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                                    <span className="font-medium">SO:</span>
                                    <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">{spk.salesOrder?.soNumber || "-"}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {spk.team ? (
                                        <>
                                            <Users className="h-4 w-4 text-blue-600" />
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                {spk.team.namaTeam}
                                            </Badge>
                                        </>
                                    ) : spk.details && spk.details.length > 0 ? (
                                        <>
                                            <User className="h-4 w-4 text-green-600" />
                                            <div className="flex flex-wrap gap-1">
                                                {spk.details.slice(0, 2).map((detail, i) => (
                                                    <Badge
                                                        key={`detail-${detail.id}-${i}`}
                                                        variant="outline"
                                                        className="text-xs px-2 py-0.5 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                    >
                                                        {detail.karyawan?.namaLengkap || "Tanpa Nama"}
                                                    </Badge>
                                                ))}
                                                {spk.details.length > 2 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{spk.details.length - 2}
                                                    </Badge>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </div>

                                <div className="flex items-center text-sm">
                                    <User className="h-4 w-4 mr-2 text-purple-600" />
                                    <span className="font-medium">Pemberi Tugas :</span>
                                    <span className="ml-1 text-gray-700 dark:text-gray-300">{spk.createdBy?.namaLengkap || "-"}</span>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Progress:</span>
                                        <span className="font-semibold">{spk.progress || 0}%</span>
                                    </div>
                                    <ProgressIndicator progress={spk.progress || 0} />
                                </div>

                                {/* Notes dengan tampilan yang lebih baik */}
                                {spk.notes && (
                                    <div className="flex items-start p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                        <MessageSquare className="h-4 w-4 mr-2 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-amber-800 dark:text-amber-200 line-clamp-2">{spk.notes}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-row-reverse gap-2 mt-4">
                                {/* Toggle Expand Button */}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => toggleRow(spk.id)}
                                    className="
      h-8 w-8 p-0 rounded-full
      border border-gray-300 dark:border-gray-600
      bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700
      text-gray-700 dark:text-gray-300
      transition-all duration-200
      shadow-sm hover:shadow-md
    "
                                >
                                    {isExpanded ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </Button>

                                {role === "admin" && (
                                    <>
                                        {/* Edit Button */}
                                        <Link href={`${basePath}/update/${spk.id}`}>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="
            h-8 w-8 p-0 rounded-full
            border border-blue-300 dark:border-blue-600
            bg-white hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-blue-900/20
            text-blue-600 dark:text-blue-400
            transition-all duration-200
            shadow-sm hover:shadow-md
          "
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>

                                        {/* Delete Button */}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="
          h-8 w-8 p-0 rounded-full
          border border-red-300 dark:border-red-600
          bg-white hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-900/20
          text-red-600 dark:text-red-400
          transition-all duration-200
          shadow-sm hover:shadow-md
        "
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDelete(spk.id);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* PDF Actions for Mobile - Tetap seperti semanya */}
                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="
      h-9 px-4 rounded-lg
      flex items-center gap-2
      border border-gray-300 dark:border-gray-600
      text-gray-700 dark:text-gray-300
      hover:bg-gray-50 dark:hover:bg-gray-800
      transition-all duration-200
      flex-1
    "
                                    onClick={() => pdfActions.handlePreview(spkPdfData)}
                                >
                                    <Eye className="h-4 w-4" />
                                    <span className="text-sm font-medium">
                                        Preview
                                    </span>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="
      h-9 px-4 rounded-lg
      flex items-center gap-2
      border border-blue-300 dark:border-blue-700
      text-blue-700 dark:text-blue-300
      hover:bg-blue-50 dark:hover:bg-blue-900/20
      transition-all duration-200
      flex-1
    "
                                    onClick={() => router.push(`${basePath}/spkReportDetail/${spk.id}`)}
                                >
                                    <BarChart2 className="h-4 w-4" />
                                    <span className="text-sm font-medium">
                                        Monitoring Progress
                                    </span>
                                </Button>
                            </div>
                        </CardContent>

                        {/* Expanded Detail dengan desain yang lebih baik */}
                        {isExpanded && (
                            <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center mb-4">
                                    <PackageOpen className="h-5 w-5 mr-2 text-primary" />
                                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">Detail SPK</h4>
                                </div>

                                {/* Grid Informasi Detail */}
                                <div className="grid grid-cols-1 gap-3 mb-4">
                                    <DetailCard icon={Calendar} title="Tanggal SPK">
                                        <p className="font-semibold">
                                            {new Date(spk.spkDate).toLocaleDateString("id-ID", {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </p>
                                    </DetailCard>

                                    <DetailCard icon={FileText} title="Sales Order">
                                        <div>
                                            <p className="font-semibold">{spk.salesOrder?.soNumber || "-"}</p>
                                            {spk.salesOrder?.projectName && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    {spk.salesOrder.projectName}
                                                </p>
                                            )}
                                        </div>
                                    </DetailCard>

                                    <DetailCard icon={User} title="Dibuat Oleh">
                                        <div>
                                            <p className="font-semibold">{spk.createdBy?.namaLengkap || "-"}</p>
                                            {spk.createdBy?.jabatan && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {spk.createdBy.jabatan}
                                                    {spk.createdBy?.departemen && ` • ${spk.createdBy.departemen}`}
                                                </p>
                                            )}
                                        </div>
                                    </DetailCard>

                                    {spk.salesOrder?.customer && (
                                        <DetailCard icon={Building} title="Customer">
                                            <div>
                                                <p className="font-semibold">{spk.salesOrder.customer.name}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    {spk.salesOrder.customer.branch}
                                                </p>
                                                {spk.salesOrder.customer.address && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">
                                                        {spk.salesOrder.customer.address}
                                                    </p>
                                                )}
                                            </div>
                                        </DetailCard>
                                    )}
                                </div>

                                {/* Detail Karyawan/Tim */}
                                {spk.details && spk.details.length > 0 && (
                                    <div className="mb-4">
                                        <div className="flex items-center mb-3">
                                            <Users className="h-5 w-5 mr-2 text-blue-600" />
                                            <h5 className="font-semibold text-gray-900 dark:text-white">Detail Tugas</h5>
                                        </div>
                                        <div className="space-y-3">
                                            {spk.details.map((detail) => (
                                                detail.karyawan ? (
                                                    <KaryawanCard
                                                        key={`task-${detail.id}`}
                                                        karyawan={detail.karyawan}
                                                        lokasiUnit={detail.lokasiUnit}
                                                    />
                                                ) : null
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Notes Detail */}
                                {spk.notes && (
                                    <div>
                                        <div className="flex items-center mb-3">
                                            <MessageSquare className="h-5 w-5 mr-2 text-amber-600" />
                                            <h5 className="font-semibold text-gray-900 dark:text-white">Catatan</h5>
                                        </div>
                                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                            <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
                                                {spk.notes}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                );
            })}
        </div>
    );

    // 👇 RENDER DESKTOP TABLE VIEW YANG DIPERBAIKI
    const renderDesktopView = () => (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="min-w-[1000px]">
                <Table>
                    <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                        <TableRow>
                            <TableHead className="w-12 text-center font-semibold text-gray-700 dark:text-gray-300">#</TableHead>
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Nomor SPK</TableHead>
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Tanggal</TableHead>
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Sales Order</TableHead>
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Tim / Karyawan</TableHead>
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Pembuat</TableHead>
                            <TableHead className="w-40 font-semibold text-gray-700 dark:text-gray-300">Progress</TableHead>
                            <TableHead className="w-32 font-semibold text-gray-700 dark:text-gray-300">Catatan</TableHead>
                            <TableHead className="text-center w-48 font-semibold text-gray-700 dark:text-gray-300">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, idx) => (
                                <TableRow key={`skeleton-${idx}`} className="hover:bg-transparent">
                                    <TableCell><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell>
                                        <div className="flex justify-center gap-1">
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            {role === "admin" && <Skeleton className="h-8 w-8 rounded-full" />}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : paginatedData.length > 0 ? (
                            paginatedData.map((spk, idx) => {
                                const spkPdfData = mapSpkToPdfValues(spk);
                                const isExpanded = expandedRows.has(spk.id);

                                return (
                                    <Fragment key={`spk-${spk.id}`}>
                                        <TableRow className={cn(
                                            "group transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/50",
                                            isExpanded && "bg-blue-50 dark:bg-blue-900/20"
                                        )}>
                                            <TableCell className="text-center font-medium text-gray-600 dark:text-gray-400">
                                                {(currentPage - 1) * itemsPerPage + idx + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Badge variant="outline" className="font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                                                        {spk.spkNumber}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-gray-700 dark:text-gray-300">
                                                {new Date(spk.spkDate).toLocaleDateString("id-ID", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                {spk.salesOrder?.soNumber ? (
                                                    <div className="flex items-center space-x-2">
                                                        <FileText className="h-4 w-4 text-blue-600" />
                                                        <span className="font-medium text-blue-700 dark:text-blue-300">
                                                            {spk.salesOrder.soNumber}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-600">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {spk.team ? (
                                                    <div className="flex items-center space-x-2">
                                                        <Users className="h-4 w-4 text-blue-600" />
                                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                            {spk.team.namaTeam}
                                                        </Badge>
                                                    </div>
                                                ) : spk.details && spk.details.length > 0 ? (
                                                    <div className="flex items-center space-x-2">
                                                        <User className="h-4 w-4 text-green-600" />
                                                        <div className="flex flex-wrap gap-1">
                                                            {spk.details.slice(0, 2).map((detail, i) => (
                                                                <Badge
                                                                    key={`detail-${detail.id}-${i}`}
                                                                    variant="outline"
                                                                    className="text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                                >
                                                                    {detail.karyawan?.namaLengkap || "Tanpa Nama"}
                                                                </Badge>
                                                            ))}
                                                            {spk.details.length > 2 && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    +{spk.details.length - 2}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-600">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium text-gray-700 dark:text-gray-300">
                                                <div className="flex items-center space-x-2">
                                                    <User className="h-4 w-4 text-purple-600" />
                                                    <span>{spk.createdBy?.namaLengkap || "-"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <ProgressIndicator progress={spk.progress || 0} />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {spk.notes ? (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="flex items-center justify-center cursor-pointer w-8 h-8 rounded-full bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 transition-colors mx-auto">
                                                                    <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-xs p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                                                                <div className="flex items-start space-x-2">
                                                                    <MessageSquare className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                                                    <p className="text-sm text-gray-700 dark:text-gray-300">{spk.notes}</p>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-600">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center space-x-1">
                                                    {/* Toggle Detail */}
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => toggleRow(spk.id)}
                                                                    className={cn(
                                                                        "h-8 w-8 rounded-full p-0 transition-all duration-300 border-gray-300 dark:border-gray-600",
                                                                        isExpanded
                                                                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/70"
                                                                            : "bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                                                                    )}
                                                                >
                                                                    {isExpanded ? (
                                                                        <ChevronUp className="h-4 w-4" />
                                                                    ) : (
                                                                        <ChevronDown className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{isExpanded ? "Sembunyikan Detail" : "Tampilkan Detail"}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    {/* Detail Progress */}
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="
                    h-9 px-4 rounded-lg
                    flex items-center gap-2
                    border border-blue-200 dark:border-blue-800
                    bg-gradient-to-r from-blue-50 to-indigo-50 
                    dark:from-blue-950/30 dark:to-indigo-950/30
                    hover:from-blue-100 hover:to-indigo-100
                    dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40
                    text-blue-700 dark:text-blue-300
                    hover:text-blue-800 dark:hover:text-blue-200
                    hover:shadow-md hover:shadow-blue-500/10
                    dark:hover:shadow-blue-400/5
                    transition-all duration-300
                    hover:scale-105 active:scale-95
                    group
                    font-medium
                "
                                                                    onClick={() => router.push(`${basePath}/spkReportDetail/${spk.id}`)}
                                                                >
                                                                    <div className="relative">
                                                                        <BarChart2 className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                                                                        <div className="absolute -inset-1 bg-blue-200/20 dark:bg-blue-400/10 rounded-full blur-sm group-hover:bg-blue-300/30 transition-all duration-300" />
                                                                    </div>
                                                                    <span className="hidden sm:inline text-sm font-semibold">Monitoring Progress</span>
                                                                </Button>
                                                            </TooltipTrigger>

                                                            <TooltipContent
                                                                side="top"
                                                                align="center"
                                                                className="
                px-3 py-2 text-sm rounded-xl
                bg-gradient-to-br from-slate-800 to-blue-900 
                dark:from-slate-900 dark:to-blue-950
                text-white dark:text-blue-100
                border border-blue-700/30 dark:border-blue-600/30
                shadow-2xl shadow-blue-500/20
                backdrop-blur-sm
                animate-in fade-in-0 zoom-in-95
                data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
            "
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <BarChart2 className="h-4 w-4 text-blue-300" />
                                                                    <span className="font-medium">Lihat Detail Progress SPK</span>
                                                                </div>
                                                                <p className="text-xs text-blue-200/80 mt-1 max-w-[200px]">
                                                                    Pantau perkembangan dan laporan pekerjaan untuk SPK ini
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>


                                                    {/* PDF Actions Dropdown */}
                                                    {/* PDF Actions - Dikeluarkan dari Dropdown */}
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-8 w-8 rounded-full border-gray-300 dark:border-gray-600 bg-white hover:bg-green-50 dark:bg-gray-800 dark:hover:bg-green-900/30 transition-all duration-300"
                                                                    onClick={() => pdfActions.handlePreview(spkPdfData)}
                                                                >
                                                                    <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Pratinjau PDF</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-8 w-8 rounded-full border-gray-300 dark:border-gray-600 bg-white hover:bg-purple-50 dark:bg-gray-800 dark:hover:bg-purple-900/30 transition-all duration-300"
                                                                    onClick={() => pdfActions.handleDownloadPdf(spkPdfData)}
                                                                >
                                                                    <Download className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Unduh PDF</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    {/* Dropdown Menu - Hanya berisi Edit dan Hapus */}
                                                    <DropdownMenu>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-8 w-8 rounded-full border-gray-300 dark:border-gray-600 bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                                                                        >
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Menu Lainnya</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl"
                                                        >
                                                            {role === "admin" && (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        className="flex items-center space-x-2 p-3 cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                                        onClick={() => router.push(`${basePath}/update/${spk.id}`)}
                                                                    >
                                                                        <Edit className="h-4 w-4 text-blue-600" />
                                                                        <span>Edit SPK</span>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="flex items-center space-x-2 p-3 cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            handleDelete(spk.id);
                                                                        }}
                                                                        disabled={spk.progress > 0}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                        <span>Hapus SPK</span>
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {/* Expanded Row dengan desain yang lebih baik */}
                                        {isExpanded && (
                                            <TableRow className="bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm">
                                                <TableCell colSpan={9} className="p-4">
                                                    <div className="space-y-4">
                                                        {/* Header Minimalis */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                                                                <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                                                                    Detail SPK: <span className="text-blue-600 dark:text-blue-400">{spk.spkNumber}</span>
                                                                </h4>
                                                            </div>
                                                            <div className="flex items-center space-x-4">
                                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                                    Progress: {spk.progress}%
                                                                </Badge>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => toggleRow(spk.id)}
                                                                    className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                                >
                                                                    <ChevronUp className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* Grid Informasi Utama - Lebih Kompak */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                                            <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                                <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                                                <div className="min-w-0">
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal</p>
                                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                        {new Date(spk.spkDate).toLocaleDateString("id-ID", {
                                                                            day: "2-digit",
                                                                            month: "short",
                                                                            year: "numeric",
                                                                        })}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                                <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                                <div className="min-w-0">
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Sales Order</p>
                                                                    <p className="text-sm font-medium text-green-700 dark:text-green-300 truncate">
                                                                        {spk.salesOrder?.soNumber || "-"}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                                <User className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                                                <div className="min-w-0">
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat Oleh</p>
                                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                        {spk.createdBy?.namaLengkap || "-"}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {spk.salesOrder?.customer && (
                                                                <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                                    <Building className="h-4 w-4 text-orange-600 flex-shrink-0" />
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Customer</p>
                                                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                            {spk.salesOrder.customer.name}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Detail Item dari Sales Order */}
                                                        {spk.salesOrder?.items && spk.salesOrder.items.length > 0 && (
                                                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                                <div className="flex items-center space-x-2 p-3 border-b border-gray-200 dark:border-gray-700">
                                                                    <ClipboardList className="h-4 w-4 text-blue-600" />
                                                                    <h5 className="font-semibold text-sm text-gray-900 dark:text-white">Detail Items</h5>
                                                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                                        {spk.salesOrder.items.length} items
                                                                    </Badge>
                                                                </div>
                                                                <div className="max-h-48 overflow-y-auto">
                                                                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                                                        {spk.salesOrder.items.map((item, index) => (
                                                                            <div key={item.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                                                <div className="flex justify-between items-start">
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <div className="flex items-center space-x-2 mb-1">
                                                                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                                                                #{index + 1}
                                                                                            </span>
                                                                                            <Badge variant="outline" className="text-xs">
                                                                                                {item.itemType}
                                                                                            </Badge>
                                                                                        </div>
                                                                                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                                                                            {item.name}
                                                                                        </p>
                                                                                        {item.description && (
                                                                                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                                                                                                {item.description}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="text-right space-y-1 ml-4">
                                                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                                            {item.qty} {item.uom || 'pcs'}
                                                                                        </p>
                                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                                            @ {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.unitPrice)}
                                                                                        </p>
                                                                                        {item.discount > 0 && (
                                                                                            <p className="text-xs text-red-600 dark:text-red-400">
                                                                                                Disc: {item.discount}%
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Detail Karyawan dan Notes dalam Layout Horizontal */}
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                            {/* Detail Karyawan */}
                                                            {spk.details && spk.details.length > 0 && (
                                                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                                    <div className="flex items-center space-x-2 p-3 border-b border-gray-200 dark:border-gray-700">
                                                                        <Users className="h-4 w-4 text-blue-600" />
                                                                        <h5 className="font-semibold text-sm text-gray-900 dark:text-white">Tim Pelaksana</h5>
                                                                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                                            {spk.details.length} orang
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="max-h-40 overflow-y-auto p-2">
                                                                        <div className="space-y-2">
                                                                            {spk.details.map((detail) => (
                                                                                detail.karyawan && (
                                                                                    <div
                                                                                        key={`task-${detail.id}`}
                                                                                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                                                                    >
                                                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold">
                                                                                            {detail.karyawan.namaLengkap.charAt(0)}
                                                                                        </div>
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                                                {detail.karyawan.namaLengkap}
                                                                                            </p>
                                                                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                                                {detail.karyawan.jabatan} • {detail.karyawan.departemen}
                                                                                            </p>
                                                                                        </div>
                                                                                        {detail.lokasiUnit && (
                                                                                            <TooltipProvider>
                                                                                                <Tooltip>
                                                                                                    <TooltipTrigger asChild>
                                                                                                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                                                                    </TooltipTrigger>
                                                                                                    <TooltipContent>
                                                                                                        <p>{detail.lokasiUnit}</p>
                                                                                                    </TooltipContent>
                                                                                                </Tooltip>
                                                                                            </TooltipProvider>
                                                                                        )}
                                                                                    </div>
                                                                                )
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Notes Section */}
                                                            {spk.notes && (
                                                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                                    <div className="flex items-center space-x-2 p-3 border-b border-gray-200 dark:border-gray-700">
                                                                        <MessageSquare className="h-4 w-4 text-amber-600" />
                                                                        <h5 className="font-semibold text-sm text-gray-900 dark:text-white">Catatan</h5>
                                                                    </div>
                                                                    <div className="p-3">
                                                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed text-wrap whitespace-pre-line">
                                                                            {spk.notes}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </Fragment>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-12">
                                    <div className="flex flex-col items-center space-y-4 text-gray-500 dark:text-gray-400">
                                        <PackageOpen className="h-16 w-16 opacity-50" />
                                        <div>
                                            <p className="text-lg font-semibold mb-2">
                                                {searchTerm || filterBy !== "all"
                                                    ? "Tidak ada data SPK yang sesuai pencarian"
                                                    : "Belum ada data SPK"}
                                            </p>
                                            <p className="text-sm">
                                                {searchTerm || filterBy !== "all"
                                                    ? "Coba ubah kata kunci pencarian atau filter yang diterapkan"
                                                    : "Mulai dengan membuat SPK baru"}
                                            </p>
                                        </div>
                                        {(searchTerm || filterBy !== "all") ? (
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setSearchTerm("");
                                                    setFilterBy("all");
                                                }}
                                            >
                                                Reset Pencarian
                                            </Button>
                                        ) : (
                                            <Link href={`${basePath}/create`}>
                                                <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Buat SPK Pertama
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );

    return (
        <Card className="border-none shadow-xl dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 overflow-hidden">
            {/* Header dengan gradient yang lebih modern */}
            <CardHeader className="rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 px-6 py-4 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                                <PackageOpen className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold">Surat Perintah Kerja</CardTitle>
                                <p className="text-cyan-100">Manage SPK logistic ke produksi</p>
                            </div>
                        </div>

                        {/* Toolbar Desktop */}
                        <div className="hidden sm:flex items-center space-x-3">
                            {/* Search */}
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-white/80" />
                                <Input
                                    placeholder="Cari SPK..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-64 pl-9 bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder-cyan-100 focus:bg-white/30 transition-colors"
                                />
                            </div>

                            {/* Filter */}
                            <Select value={filterBy} onValueChange={setFilterBy}>
                                <SelectTrigger className="w-48 bg-white/20 backdrop-blur-sm border-white/30 text-white focus:bg-white/30">
                                    <SelectValue placeholder="Filter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua SPK</SelectItem>
                                    <SelectItem value="with-team">Dengan Tim</SelectItem>
                                    <SelectItem value="without-team">Tanpa Tim</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Tambah Button */}
                            <Link href={`${basePath}/create`}>
                                <Button
                                    className="bg-white text-cyan-700 hover:bg-cyan-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 px-6 py-2 rounded-xl"
                                >
                                    <Plus size={18} />
                                    <span>Tambah SPK</span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </CardHeader>

            {/* Toolbar Mobile */}
            <div className="sm:hidden p-4 space-y-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <Input
                        placeholder="Cari SPK..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9"
                    />
                </div>
                <div className="flex space-x-3">
                    <Select value={filterBy} onValueChange={setFilterBy}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua SPK</SelectItem>
                            <SelectItem value="with-team">Dengan Tim</SelectItem>
                            <SelectItem value="without-team">Tanpa Tim</SelectItem>
                        </SelectContent>
                    </Select>
                    <Link href={`${basePath}/create`} className="flex-1">
                        <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium">
                            <Plus size={18} className="mr-2" />
                            Tambah
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Konten Utama */}
            <CardContent className="p-0 bg-gray-50/50 dark:bg-gray-800/50">
                {isLoading ? (
                    <div className="p-6 space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <>
                        {isMobile ? renderMobileView() : renderDesktopView()}

                        {/* Pagination */}
                        {filteredData.length > 0 && (
                            <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Menampilkan <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span>–
                                    <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> dari{" "}
                                    <span className="font-semibold">{filteredData.length}</span> SPK
                                </p>
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="h-9 w-9 rounded-lg border-gray-300 dark:border-gray-600"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                        </PaginationItem>
                                        {pageNumbers.map((page) => (
                                            <PaginationItem key={page}>
                                                <Button
                                                    variant={currentPage === page ? "default" : "outline"}
                                                    size="icon"
                                                    onClick={() => handlePageChange(page)}
                                                    className={cn(
                                                        "h-9 w-9 rounded-lg border-gray-300 dark:border-gray-600",
                                                        currentPage === page && "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                                                    )}
                                                >
                                                    {page}
                                                </Button>
                                            </PaginationItem>
                                        ))}
                                        <PaginationItem>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="h-9 w-9 rounded-lg border-gray-300 dark:border-gray-600"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </>
                )}
            </CardContent>

            {/* PDF Preview Modal */}
            {pdfActions.selectedSpk && (
                <SPKPdfPreview
                    open={pdfActions.pdfDialogOpen}
                    onOpenChange={pdfActions.setPdfDialogOpen}
                    data={pdfActions.selectedSpk}
                />
            )}
        </Card>
    );
}