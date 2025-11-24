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
import { Card, CardContent } from "@/components/ui/card";
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
    MoreHorizontal,
    Eye,
    Download,
    BarChart2,
    MapPin,
    Building,
    ClipboardList,
    UserCircle2Icon,
    ChevronsDown,
    ChevronsUp,
    BookCheckIcon,
    Layers,
} from "lucide-react";
import React, { useState, Fragment } from "react";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useRouter, useSearchParams } from "next/navigation";
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
    spkStatusClose: boolean;
    spkStatus: boolean;
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
    }[] | null;
    spkFieldReport?: SPKFieldReport[] | null; // Ini harus array
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
};

interface SPKFieldReport {
    id: string;
    soDetailId?: string;
    progress?: number;
    status?: string;
    reportedAt?: Date;
    createdAt: Date;
}

type TabelDataSpkProps = {
    dataSpk?: SPK[];
    role?: string;
    isLoading: boolean;
    className?: string;
    onDeleteSpk?: (spkId: string) => void;
    isDeleting: boolean;
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
        spkDate: new Date(data.spkDate),
    };
}

function getTimeAgo(dateInput: Date | string): string {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

    if (isNaN(date.getTime())) {
        return 'Waktu tidak valid';
    }

    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
        return `${diffInSeconds} detik yang lalu`;
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes} menit yang lalu`;
    } else if (diffInHours < 24) {
        return `${diffInHours} jam yang lalu`;
    } else if (diffInDays < 7) {
        return `${diffInDays} hari yang lalu`;
    } else {
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
}

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

export default function TabelDataSpk({
    dataSpk = [], // Default ke array kosong
    role,
    isLoading,
    onDeleteSpk,
    isDeleting = false,
}: TabelDataSpkProps) {
    const rowRefs = React.useRef<{ [key: string]: HTMLTableRowElement | null }>({});
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const searchParams = useSearchParams();
    const page = Number(searchParams.get("page")) || 1;
    const highlightStatus = searchParams.get("status") || "";
    const pageSize = searchParams.get("pageSize") || "";
    const highlightId = searchParams.get("highlightId") || "";
    const searchUrl = searchParams.get("search") || "";
    const urlFilter = searchParams.get("filter") || "all";

    const basePath = getBasePath(role);
    const router = useRouter();
    const pdfActions = usePdfActions();
    const isMobile = useMediaQuery("(max-width: 768px)");

    // DEBUG: Log data yang diterima
    console.log("🔍 TabelDataSpk - Data received:", {
        dataCount: dataSpk?.length || 0,
        data: dataSpk?.map(item => ({
            id: item.id,
            spkNumber: item.spkNumber,
            progress: item.progress,
            status: item.spkStatusClose
        }))
    });

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

    // Highlight effect
    React.useEffect(() => {
        if (!highlightId) return;

        const highlightElement = rowRefs.current[highlightId];
        if (!highlightElement) return;

        const SCROLL_DELAY = 300;
        const HIGHLIGHT_DURATION = 5000;
        const ANIMATION_CLASSES = [
            "bg-yellow-200",
            "dark:bg-yellow-900",
            "animate-pulse",
            "ring-2",
            "ring-yellow-400",
            "ring-offset-2",
            "transition-all",
            "duration-500"
        ];

        // Delay kecil supaya DOM siap
        const scrollTimer = setTimeout(() => {
            highlightElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest"
            });
        }, SCROLL_DELAY);

        // Tambahkan highlight animasi
        highlightElement.classList.add(...ANIMATION_CLASSES);

        // Hapus highlight + bersihkan URL
        const cleanupTimer = setTimeout(() => {
            highlightElement.classList.remove(...ANIMATION_CLASSES);

            // Tambahkan sedikit smoothing setelah animasi
            highlightElement.classList.add("transition-colors", "duration-300");

            // Hapus highlightId dari URL tanpa reload
            const params = new URLSearchParams(window.location.search);
            params.delete("highlightId");
            const newUrl = params.toString()
                ? `${window.location.pathname}?${params.toString()}`
                : window.location.pathname;

            window.history.replaceState({}, "", newUrl);

        }, HIGHLIGHT_DURATION);

        return () => {
            clearTimeout(scrollTimer);
            clearTimeout(cleanupTimer);
            highlightElement.classList.remove(...ANIMATION_CLASSES);
        };
    }, [highlightId]);

    // Gunakan dataSpk langsung tanpa filtering
    const displayData = dataSpk || [];

    console.log("🔍 TabelDataSpk - Display data count:", displayData.length);

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

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
                    customer: {
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
                    items: spk.salesOrder.items?.map((item) => ({
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
            details: spk.details?.map((detail) => ({
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
        <div className="space-y-3 p-2">
            {displayData.map((spk, idx) => {
                const spkPdfData = mapSpkToPdfValues(spk);
                const isExpanded = expandedRows.has(spk.id);

                return (
                    <Card key={`spk-card-${spk.id}`} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all duration-200">
                        <CardContent className="px-2">
                            {/* Header Ringkas */}
                            <div className="flex justify-between items-start mb-0">
                                <div className="flex flex-col gap-2">
                                    {/* Bagian Atas */}
                                    <div className="flex flex-row gap-2 justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="font-medium bg-primary/10 text-primary text-xs">
                                                #{idx + 1}
                                            </Badge>

                                            {/* Bagian Bawah */}
                                            <div className="mt-2 text-xs font-semibold uppercase">
                                                <h3 className="font-bold text-xs text-gray-900 dark:text-white">{spk.spkNumber}</h3>
                                                {new Date(spk.spkDate).toLocaleDateString("id-ID", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </div>
                                        </div>
                                    </div>


                                </div>

                                {/* Toggle Button Sederhana */}
                                <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => toggleRow(spk.id)}
                                    className="h-8 w-8 p-0 rounded-2xl bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 hover:from-orange-500 hover:via-amber-600 hover:to-orange-700 active:scale-95 backdrop-blur-sm"
                                >
                                    {isExpanded ? (
                                        <ChevronsUp className="h-4 w-4 font-bold text-white drop-shadow-sm" />
                                    ) : (
                                        <ChevronsDown className="h-4 w-4 font-bold text-white drop-shadow-sm" />
                                    )}
                                </Button>
                            </div>

                            {/* Informasi Utama Ringkas */}
                            <div className="space-y-0 mt-2">
                                {/* Project */}
                                <div className="flex items-center text-xs">
                                    <FileText className="h-3 w-3 mr-1 text-blue-600 flex-shrink-0" />
                                    <span className="text-xs font-bold text-wrap uppercase">
                                        {spk.salesOrder?.project?.name || "-"}
                                    </span>
                                </div>

                                {/* Team/Karyawan Ringkas */}
                                <div className="flex items-center text-xs">
                                    <Users className="h-3 w-3 mr-1 text-green-600 flex-shrink-0" />
                                    <div className="flex flex-row gap-4">
                                        <span className="text-gray-600 dark:text-gray-400 truncate">
                                            {spk.team?.namaTeam ||
                                                (spk.details && spk.details.length > 0 ?
                                                    `${spk.details.length} orang` :
                                                    "-")}
                                        </span>
                                        <span className="text-xs font-bold">{spk.salesOrder?.customer.branch}</span>
                                    </div>
                                </div>

                                {/* Progress Bar Ringkas */}
                                <div className="space-y-0">
                                    <ProgressIndicator progress={spk.progress || 0} />
                                </div>
                            </div>

                            {/* Expanded Detail */}
                            {isExpanded && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="space-y-4">
                                        {/* Informasi Detail */}
                                        <div className="text-xs grid grid-cols-1 gap-3">
                                            <DetailCard
                                                className="text-xs border-l-3 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                                                icon={User}
                                                title="Dibuat Oleh"
                                            >
                                                <div className="space-y-1">
                                                    <p className="font-bold text-xs text-gray-900 dark:text-white">
                                                        {spk.createdBy?.namaLengkap || "-"}
                                                    </p>
                                                    {(spk.createdBy?.jabatan || spk.createdBy?.departemen) && (
                                                        <div className="flex flex-wrap items-center gap-1 text-gray-600 dark:text-gray-400">
                                                            {spk.createdBy?.jabatan && (
                                                                <span className="inline-flex items-center">
                                                                    {spk.createdBy.jabatan}
                                                                </span>
                                                            )}
                                                            {spk.createdBy?.jabatan && spk.createdBy?.departemen && (
                                                                <span className="text-gray-400">•</span>
                                                            )}
                                                            {spk.createdBy?.departemen && (
                                                                <span className="inline-flex items-center">
                                                                    {spk.createdBy.departemen}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </DetailCard>

                                            <div className="space-y-2">
                                                {spk.salesOrder?.items?.length > 0 ? (
                                                    spk.salesOrder.items.map((item, index) => {
                                                        const allFieldReports = spk.spkFieldReport || [];

                                                        const itemFieldReports = Array.isArray(allFieldReports)
                                                            ? allFieldReports.filter(report => report?.soDetailId === item.id)
                                                            : [];


                                                        // Urutkan dari yang terbaru
                                                        const sortedReports = itemFieldReports.sort((a, b) => {
                                                            const dateA = new Date(a.reportedAt || a.createdAt || 0);
                                                            const dateB = new Date(b.reportedAt || b.createdAt || 0);
                                                            return dateB.getTime() - dateA.getTime();
                                                        });

                                                        const latestReport = sortedReports[0];
                                                        const itemProgress = latestReport?.progress ?? spk.progress ?? 0;

                                                        return (
                                                            <div key={index} className="flex flex-row justify-between items-center gap-2 py-1 border-b border-gray-200 dark:border-gray-700 last:border-0">
                                                                <p className="font-bold text-xs text-gray-900 dark:text-white text-wrap flex-1">
                                                                    {item.name || "-"}
                                                                </p>
                                                                <div className="flex items-center gap-3">
                                                                    {/* Quantity */}
                                                                    {item.qty && (
                                                                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                                            <Layers className="w-3 h-3" />
                                                                            <span>{item.qty}</span>
                                                                            {item.uom && <span>{item.uom}</span>}
                                                                        </div>
                                                                    )}

                                                                    {/* Progress */}
                                                                    <div className="flex items-center gap-1 whitespace-nowrap">
                                                                        <div className="w-8 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                                                            <div
                                                                                className={`h-1.5 rounded-full transition-all duration-300 ${itemProgress >= 100 ? 'bg-green-500' :
                                                                                    itemProgress >= 70 ? 'bg-blue-500' :
                                                                                        itemProgress >= 30 ? 'bg-yellow-500' :
                                                                                            itemProgress > 0 ? 'bg-orange-500' : 'bg-gray-400'
                                                                                    }`}
                                                                                style={{ width: `${itemProgress}%` }}
                                                                            ></div>
                                                                        </div>
                                                                        <span className={`text-xs font-medium min-w-[30px] ${itemProgress > 0
                                                                            ? 'text-gray-700 dark:text-gray-300'
                                                                            : 'text-gray-500 dark:text-gray-400'
                                                                            }`}>
                                                                            {itemProgress}%
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Tampilkan jumlah laporan untuk item ini */}
                                                                <div className="text-xs text-gray-400">
                                                                    ({itemFieldReports.length})
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <p className="text-gray-500">No products</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Detail Karyawan/Tim */}
                                        {spk.details && spk.details.length > 0 && (
                                            <div>
                                                <div className="flex items-center mb-2">
                                                    <Users className="h-4 w-4 mr-2 text-blue-600" />
                                                    <h5 className="font-semibold text-sm text-gray-900 dark:text-white">Detail Team {spk.team?.namaTeam}</h5>
                                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({spk.details.length})</span>
                                                </div>

                                                <div className="space-y-1.5 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2">
                                                    {spk.details.map((detail) => (
                                                        detail.karyawan && (
                                                            <div
                                                                key={`task-${detail.id}`}
                                                                className="flex justify-between items-center py-1.5 px-2 bg-gray-50 dark:bg-gray-800 rounded text-xs"
                                                            >
                                                                <span className="font-medium text-gray-900 dark:text-white truncate flex-1">
                                                                    {detail.karyawan.namaLengkap}
                                                                </span>
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Notes */}
                                        {spk.notes && (
                                            <div>
                                                <div className="flex items-center mb-2">
                                                    <MessageSquare className="h-4 w-4 mr-2 text-amber-600" />
                                                    <h5 className="font-semibold text-sm text-gray-900 dark:text-white">Catatan</h5>
                                                </div>
                                                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                                                    <p className="text-amber-800 dark:text-amber-200 text-xs leading-relaxed">
                                                        {spk.notes}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="space-y-2 pt-2">
                                            {/* User Actions */}
                                            <div className="flex flex-col xs:flex-row gap-2 justify-end">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 w-full xs:w-32 border-blue-300 hover:bg-blue-50 dark:border-blue-600 dark:hover:bg-blue-900/20 cursor-pointer"
                                                    onClick={() => pdfActions.handlePreview(spkPdfData)}
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    <span className="text-xs">Preview</span>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 w-full xs:w-32 border-green-300 hover:bg-green-50 dark:border-green-600 dark:hover:bg-green-900/20 cursor-pointer"
                                                    onClick={() => router.push(`${basePath}/spkReportDetail/${spk.id}`)}
                                                >
                                                    <BarChart2 className="h-3 w-3 mr-1" />
                                                    <span className="text-xs">Monitoring</span>
                                                </Button>
                                            </div>

                                            {/* Admin Actions */}
                                            {role === "admin" && (
                                                <div className="flex flex-col xs:flex-row gap-2 border-t pt-2 dark:border-gray-700 justify-end">
                                                    <Link
                                                        href={`${basePath}/update/${spk.id}?highlightId=${spk.id}&page=${page}&pageSize=${pageSize}&status=${highlightStatus}&search=${searchUrl}&filter=${urlFilter}`}
                                                        className="w-full xs:w-auto"
                                                    >
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 w-full xs:w-32 border-amber-300 hover:bg-amber-50 dark:border-amber-600 dark:hover:bg-amber-900/20 cursor-pointer"
                                                        >
                                                            <Edit className="h-3 w-3 mr-1" />
                                                            <span className="text-xs">Edit</span>
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 w-full xs:w-32 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-300 cursor-pointer"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleDelete(spk.id);
                                                        }}
                                                        disabled={isDeleting}
                                                    >
                                                        <Trash2 className="h-3 w-3 mr-1" />
                                                        <span className="text-xs">Delete</span>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
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
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Nomor SPK & SO</TableHead>
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Tanggal SPK</TableHead>
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Customer</TableHead>
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Tim / Karyawan</TableHead>
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Pembuat</TableHead>
                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Project Name</TableHead>
                            <TableHead className="w-40 font-semibold text-gray-700 dark:text-gray-300">Progress</TableHead>
                            <TableHead className="w-10 font-semibold text-gray-700 dark:text-gray-300">Status</TableHead>
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
                        ) : displayData.length > 0 ? (
                            displayData.map((spk, idx) => {
                                const spkPdfData = mapSpkToPdfValues(spk);
                                const isExpanded = expandedRows.has(spk.id);

                                return (
                                    <Fragment key={`spk-${spk.id}`}>
                                        <TableRow
                                            ref={(el) => {
                                                const id = spk.id;
                                                if (id) rowRefs.current[id] = el;
                                            }}
                                            data-row-id={spk.id}
                                            className={cn(
                                                "cursor-pointer hover:bg-muted/30 transition-colors",
                                                highlightId === spk.id ? "bg-yellow-200 dark:bg-yellow-900" : ""
                                            )}>
                                            <TableCell className="text-center font-medium text-gray-600 dark:text-gray-400">
                                                {idx + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col space-y-1">
                                                    <Badge
                                                        variant="outline"
                                                        className="font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                                    >
                                                        {spk.spkNumber}
                                                    </Badge>
                                                    <Badge
                                                        variant="outline"
                                                        className="font-semibold bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800"
                                                    >
                                                        {spk.salesOrder.soNumber}
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
                                                {spk.salesOrder?.customer.branch ? (
                                                    <div className="flex items-center space-x-2">
                                                        <UserCircle2Icon className="h-4 w-4 text-red-600" />
                                                        <span className="font-bold text-blue-700 dark:text-blue-300 uppercase">
                                                            {spk.salesOrder.customer.branch}
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
                                            <TableCell className="font-medium text-gray-700 dark:text-gray-300 w-20">
                                                <div className="flex items-center space-x-2">
                                                    <User className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                                    <span className="truncate max-w-[100px] uppercase">{spk.createdBy?.namaLengkap || "Name..."}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {spk.salesOrder?.soNumber ? (
                                                    <div className="flex items-center space-x-2">
                                                        <FileText className="h-4 w-4 text-blue-600" />
                                                        <span className="font-bold text-blue-700 dark:text-blue-300 text-wrap uppercase">
                                                            {spk.salesOrder.project?.name}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-600">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col space-y-2">
                                                    {/* Progress Bar */}
                                                    <ProgressIndicator progress={spk.progress || 0} />

                                                    {/* Timestamp */}
                                                    {(spk.updatedAt || spk.createdAt) && (
                                                        <span className="text-[10px] md:text-xs text-muted-foreground">
                                                            {spk.updatedAt ? 'Diupdate' : 'Dibuat'} {getTimeAgo(spk.updatedAt || spk.createdAt!)}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-gray-700 dark:text-gray-300 w-36">
                                                <div className="flex items-center space-x-2">
                                                    <BookCheckIcon className="h-4 w-4 text-orange-500 flex-shrink-0" />

                                                    {/* STATUS BADGE */}
                                                    <span
                                                        className={cn(
                                                            "truncate max-w-[120px] uppercase font-semibold px-2 py-1 rounded-md text-xs",
                                                            spk.spkStatusClose
                                                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" // CLOSING
                                                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" // ON PROGRESS
                                                        )}
                                                    >
                                                        {spk.spkStatusClose ? "CLOSING" : "OPEN"}
                                                    </span>
                                                </div>
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
                                                                    className="h-9 px-4 rounded-lg flex items-center gap-2 border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 hover:shadow-md hover:shadow-blue-500/10 dark:hover:shadow-blue-400/5 transition-all duration-300 hover:scale-105 active:scale-95 group font-medium"
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
                                                                className="px-3 py-2 text-sm rounded-xl bg-gradient-to-br from-slate-800 to-blue-900 dark:from-slate-900 dark:to-blue-950 text-white dark:text-blue-100 border border-blue-700/30 dark:border-blue-600/30 shadow-2xl shadow-blue-500/20 backdrop-blur-sm"
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

                                                    {/* PDF Actions */}
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

                                                    {/* Dropdown Menu */}
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
                                                                        onClick={() =>
                                                                            router.push(
                                                                                `${basePath}/update/${spk.id}?highlightId=${spk.id}&page=${page}&pageSize=${pageSize}&status=${highlightStatus}&search=${searchUrl}&filter=${urlFilter}`
                                                                            )
                                                                        }
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

                                        {/* Expanded Row */}
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
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-4">
                                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                                        Progress: {spk.progress}%
                                                                    </Badge>

                                                                    {/* Timestamp progress update */}
                                                                    {spk.updatedAt && (
                                                                        <span className="text-xs text-muted-foreground">
                                                                            Created {getTimeAgo(spk.updatedAt)}
                                                                        </span>
                                                                    )}

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
                                                                                            {role === 'admin' || role === 'super'
                                                                                                ? `@ ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.unitPrice)}`
                                                                                                : '@ ***'
                                                                                            }
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
                                                Belum ada data SPK
                                            </p>
                                            <p className="text-sm">
                                                Mulai dengan membuat SPK baru
                                            </p>
                                        </div>
                                        <Link href={`${basePath}/create`}>
                                            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Buat SPK Pertama
                                            </Button>
                                        </Link>
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