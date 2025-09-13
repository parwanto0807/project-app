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
    Search,
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
    Download
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


type SPK = {
    id: string;
    spkNumber: string;
    spkDate: Date;
    salesOrderId: string;
    teamId: string;
    createdById: string;

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
    return role === "super"
        ? "/super-admin-area/logistic/spk"
        : "/admin-area/logistic/spk";
}

export function normalizePdfProps(data: SpkFormValuesPdfProps) {
    return {
        ...data,
        spkDate: new Date(data.spkDate), // pastikan Date
    };
}

// Hook untuk mengelola aksi PDF
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


export default function TabelDataSpk({
    dataSpk = [],
    role,
    isLoading,
    className = "",
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
        // pastikan spkDate berbentuk Date
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
                                    id: spk.team.teamKaryawan.karyawan.id, // ✅ WAJIB ada
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

    // 👇 RENDER MOBILE CARD VIEW
    const renderMobileView = () => (
        <div className="space-y-4">
            {paginatedData.map((spk, idx) => {
                const spkPdfData = mapSpkToPdfValues(spk);

                return (
                    <Card key={`spk-card-${spk.id}`} className="overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <Badge variant="outline" className="font-medium">
                                        #{(currentPage - 1) * itemsPerPage + idx + 1}
                                    </Badge>
                                    <h3 className="font-semibold mt-1">{spk.spkNumber}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(spk.spkDate).toLocaleDateString("id-ID", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => toggleRow(spk.id)}
                                        className="h-8 w-8 p-0"
                                    >
                                        {expandedRows.has(spk.id) ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                    </Button>
                                    {role === "admin" && (
                                        <>
                                            <Link href={`${basePath}/update/${spk.id}`}>
                                                <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button size="sm" variant="destructive" className="h-8 w-8 p-0">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center">
                                    <FileText className="h-4 w-4 mr-2 text-primary" />
                                    <span>{spk.salesOrder?.soNumber || "-"}</span>
                                </div>
                                <div className="flex items-center">
                                    {spk.team ? (
                                        <>
                                            <Users className="h-4 w-4 mr-2 text-blue-600" />
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                {spk.team.namaTeam}
                                            </Badge>
                                        </>
                                    ) : spk.details && spk.details.length > 0 ? (
                                        <>
                                            <User className="h-4 w-4 text-green-600 mr-2" />
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
                                <div className="flex items-center">
                                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>{spk.createdBy?.namaLengkap || "-"}</span>
                                </div>
                                {spk.notes && (
                                    <div className="flex items-start text-wrap">
                                        <MessageSquare className="h-4 w-4 mr-2 text-amber-600 mt-0.5" />
                                        <span className="line-clamp-2">{spk.notes}</span>
                                    </div>
                                )}
                            </div>
                            {/* PDF Actions for Mobile */}
                            <div className="flex gap-2 mt-3 pt-3 border-t">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => pdfActions.handlePreview(spkPdfData)} // Gunakan pdfActions.handlePreview
                                >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Preview
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => pdfActions.handleDownloadPdf(spkPdfData)} // Gunakan pdfActions.handleDownloadPdf
                                >
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                </Button>
                            </div>
                        </CardContent>
                        {/* Expanded Detail */}
                        {expandedRows.has(spk.id) && (
                            <div className="bg-muted/30 p-4 border-t">
                                <h4 className="font-semibold mb-3 text-lg flex items-center">
                                    <PackageOpen className="h-5 w-5 mr-2 text-primary" />
                                    Detail SPK: {spk.spkNumber}
                                </h4>
                                <div className="grid grid-cols-1 gap-4 mb-4">
                                    <div className="flex items-start">
                                        <Calendar className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="text-sm text-muted-foreground">Tanggal</span>
                                            <p className="font-medium">
                                                {new Date(spk.spkDate).toLocaleDateString("id-ID", {
                                                    weekday: "long",
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <FileText className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="text-sm text-muted-foreground">Sales Order</span>
                                            <p className="font-medium">{spk.salesOrder?.soNumber || "-"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <User className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="text-sm text-muted-foreground">Dibuat Oleh</span>
                                            <p className="font-medium">{spk.createdBy?.namaLengkap || "-"}</p>
                                        </div>
                                    </div>
                                </div>
                                {spk.details && spk.details.length > 0 && (
                                    <div className="mt-4">
                                        <h5 className="font-medium mb-2 flex items-center">
                                            <Users className="h-5 w-5 mr-2 text-blue-600" />
                                            Detail Tugas:
                                        </h5>
                                        <div className="space-y-2">
                                            {spk.details.map((detail) => (
                                                <div
                                                    key={`task-${detail.id}`}
                                                    className="flex flex-col p-3 bg-background rounded-md border"
                                                >
                                                    <div className="flex items-center mb-1">
                                                        <User className="h-4 w-4 mr-2 text-green-600" />
                                                        <p className="font-medium">
                                                            {detail.karyawan?.namaLengkap || "Karyawan tidak ditentukan"}
                                                        </p>
                                                    </div>
                                                    {detail.lokasiUnit && (
                                                        <p className="text-sm text-muted-foreground pl-6">
                                                            {detail.lokasiUnit}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {spk.notes && (
                                    <div className="mt-4">
                                        <h5 className="font-medium mb-2 flex items-center text-wrap">
                                            <MessageSquare className="h-5 w-5 mr-2 text-amber-600" />
                                            Catatan:
                                        </h5>
                                        <p className="bg-background p-3 rounded-md border">{spk.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                )
            })}
        </div>
    );

    // 👇 RENDER DESKTOP TABLE VIEW - DIPERBAIKI untuk menghilangkan whitespace
    const renderDesktopView = () => (
        <div className="rounded-md border overflow-x-auto">
            <div className="min-w-[800px]">
                <Table>
                    <TableHeader>
                        <TableRow>{/* PERBAIKAN: Tidak ada whitespace di dalam TableRow */}
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Nomor SPK</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Sales Order</TableHead>
                            <TableHead>Tim / Karyawan</TableHead>
                            <TableHead>Pembuat</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="w-48">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, idx) => (
                                <TableRow key={`skeleton-${idx}`}>{/* PERBAIKAN: Tidak ada whitespace */}
                                    <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                    <TableCell className="flex gap-2">
                                        <Skeleton className="h-8 w-8" />
                                        {role === "admin" && (
                                            <>
                                                <Skeleton className="h-8 w-8" />
                                                <Skeleton className="h-8 w-8" />
                                                <Skeleton className="h-8 w-8" />
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : paginatedData.length > 0 ? (
                            paginatedData.map((spk, idx) => {
                                const spkPdfData = mapSpkToPdfValues(spk);

                                return (
                                    <Fragment key={`spk-${spk.id}`}>
                                        <TableRow className="hover:bg-muted/50 transition-colors">{/* PERBAIKAN: Tidak ada whitespace */}
                                            <TableCell>{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-medium">
                                                    {spk.spkNumber}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {new Date(spk.spkDate).toLocaleDateString("id-ID", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                {spk.salesOrder?.soNumber ? (
                                                    <div className="flex items-center">
                                                        <FileText className="h-4 w-4 mr-1 text-primary" />
                                                        <span className="text-primary font-medium">
                                                            {spk.salesOrder.soNumber}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {spk.team ? (
                                                    <div className="flex items-center">
                                                        <Users className="h-4 w-4 mr-1 text-blue-600" />
                                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                            {spk.team.namaTeam}
                                                        </Badge>
                                                    </div>
                                                ) : spk.details && spk.details.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        <User className="h-4 w-4 text-green-600" />
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
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {spk.createdBy?.namaLengkap || <span className="text-muted-foreground">-</span>}
                                            </TableCell>
                                            <TableCell>
                                                {spk.notes ? (
                                                    <div className="flex items-center text-wrap">
                                                        <MessageSquare className="h-4 w-4 mr-1 text-amber-600" />
                                                        <span className="line-clamp-1">{spk.notes}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1 flex-wrap">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => toggleRow(spk.id)}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        {expandedRows.has(spk.id) ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => pdfActions.handlePreview(spkPdfData)} // Gunakan pdfActions
                                                        title="Preview PDF"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => pdfActions.handleDownloadPdf(spkPdfData)} // Gunakan pdfActions
                                                        title="Download PDF"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 cursor-pointer hover:bg-muted"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                }}
                                                            >
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            {role === "admin" && (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        className="cursor-pointer gap-2 text-sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            router.push(`${basePath}/update/${spk.id}`);
                                                                        }}
                                                                    >
                                                                        <Edit className="h-4 w-4 text-muted-foreground" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="cursor-pointer gap-2 text-sm text-destructive focus:text-destructive"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            handleDelete(spk.id);
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                        <span>Delete</span>
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {expandedRows.has(spk.id) && (
                                            <TableRow className="bg-muted/30">{/* PERBAIKAN: Tidak ada whitespace */}
                                                <TableCell colSpan={8} className="p-0">
                                                    <div className="p-4">
                                                        <h4 className="font-semibold mb-3 text-lg flex items-center">
                                                            <PackageOpen className="h-5 w-5 mr-2 text-primary" />
                                                            Detail SPK: {spk.spkNumber}
                                                        </h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                                            <div className="flex items-start">
                                                                <Calendar className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                                                                <div>
                                                                    <span className="text-sm text-muted-foreground">Tanggal</span>
                                                                    <p className="font-medium">
                                                                        {new Date(spk.spkDate).toLocaleDateString("id-ID", {
                                                                            weekday: "long",
                                                                            year: "numeric",
                                                                            month: "long",
                                                                            day: "numeric",
                                                                        })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-start">
                                                                <FileText className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                                                                <div>
                                                                    <span className="text-sm text-muted-foreground">Sales Order</span>
                                                                    <p className="font-medium">{spk.salesOrder?.soNumber || "-"}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-start">
                                                                <User className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                                                                <div>
                                                                    <span className="text-sm text-muted-foreground">Dibuat Oleh</span>
                                                                    <p className="font-medium">{spk.createdBy?.namaLengkap || "-"}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {spk.details && spk.details.length > 0 && (
                                                            <div className="mt-4">
                                                                <h5 className="font-medium mb-2 flex items-center">
                                                                    <Users className="h-5 w-5 mr-2 text-blue-600" />
                                                                    Detail Tugas:
                                                                </h5>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                    {spk.details.map((detail) => (
                                                                        <div
                                                                            key={`task-${detail.id}`}
                                                                            className="flex flex-col p-3 bg-background rounded-md border"
                                                                        >
                                                                            <div className="flex items-center mb-1">
                                                                                <User className="h-4 w-4 mr-2 text-green-600" />
                                                                                <p className="font-medium">
                                                                                    {detail.karyawan?.namaLengkap || "Karyawan tidak ditentukan"}
                                                                                </p>
                                                                            </div>
                                                                            {detail.lokasiUnit && (
                                                                                <p className="text-sm text-muted-foreground pl-6">
                                                                                    {detail.lokasiUnit}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {spk.notes && (
                                                            <div className="mt-4">
                                                                <h5 className="font-medium mb-2 flex items-center">
                                                                    <MessageSquare className="h-5 w-5 mr-2 text-amber-600" />
                                                                    Catatan:
                                                                </h5>
                                                                <p className="bg-background p-3 rounded-md border">{spk.notes}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </Fragment>
                                )
                            })
                        ) : (
                            <TableRow>{/* PERBAIKAN: Tidak ada whitespace */}
                                <TableCell colSpan={8} className="text-center py-8">
                                    <div className="text-muted-foreground">
                                        {searchTerm || filterBy !== "all"
                                            ? "Tidak ada data SPK yang sesuai pencarian"
                                            : "Tidak ada data SPK"}
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
        <Card className={`w-full ${className}`}>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-primary/5 to-blue-100 dark:from-slate-800 dark:to-slate-900 gap-4">
                <CardTitle className="flex items-center space-x-3">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary">
                        <PackageOpen className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex flex-col p-2">
                        <span className="text-xl">Surat Perintah Kerja</span>
                        <span className="text-sm text-muted-foreground font-normal">
                            Manage surat perintah kerja logistic ke produksi
                        </span>
                    </div>
                </CardTitle>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari SPK..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={filterBy} onValueChange={setFilterBy}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua</SelectItem>
                            <SelectItem value="with-team">Dengan Tim</SelectItem>
                            <SelectItem value="without-team">Tanpa Tim</SelectItem>
                        </SelectContent>
                    </Select>
                    <Link href="/admin-area/logistic/spk/create">
                        <Button className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Tambah SPK</span>
                            <span className="sm:hidden">Tambah</span>
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full" />
                        ))}
                    </div>
                ) : (
                    <>
                        {isMobile ? renderMobileView() : renderDesktopView()}
                        {/* Pagination */}
                        {filteredData.length > 0 && (
                            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                                <p className="text-sm text-muted-foreground">
                                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
                                    {Math.min(currentPage * itemsPerPage, filteredData.length)} dari{" "}
                                    {filteredData.length} data
                                </p>
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="h-8 w-8 p-0"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                        </PaginationItem>
                                        {pageNumbers.map((page) => (
                                            <PaginationItem key={page}>
                                                <Button
                                                    variant={currentPage === page ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handlePageChange(page)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    {page}
                                                </Button>
                                            </PaginationItem>
                                        ))}
                                        <PaginationItem>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="h-8 w-8 p-0"
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