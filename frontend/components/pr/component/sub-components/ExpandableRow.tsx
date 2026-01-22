import { Fragment, forwardRef } from "react";
import Link from "next/link";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { PurchaseRequestWithRelations } from "@/types/pr";
import { formatCurrency, formatDate, cleanNumber } from "../utils";
import { STATUS_CONFIG, STATUS_APPROVE_CONFIG } from "../constants";
import { ActionButtons } from "./actionButtons";
import { ExpandedDetails } from "./expandedDetails";
import { PercentageBadge } from "./percentageBadge";
import {
    FileText,
    Building,
    User,
    Calendar,
    BanknoteArrowUp,
    FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const MotionTableRow = motion.create(TableRow);

interface ExpandableRowProps {
    pr: PurchaseRequestWithRelations;
    index: number;
    delay?: number;
    isExpanded: boolean;
    role: string;
    isDeleting: boolean;
    onToggle: () => void;
    onViewDetail: () => void;
    onViewPdf: () => void;
    onCreateLpp: () => void;
    onEdit: () => void;
    onDelete: () => void;
    highlightId: string;
}

// 🟢 Komponen dengan forwardRef - PERBAIKAN: forward ref ke TableRow
export const ExpandableRow = forwardRef<HTMLTableRowElement, ExpandableRowProps>(
    (
        {
            pr,
            index,
            delay = 0,
            isExpanded,
            role,
            isDeleting,
            onToggle,
            onViewDetail,
            onViewPdf,
            onCreateLpp,
            onEdit,
            onDelete,
            highlightId,
        },
        ref
    ) => {
        const totalAmount =
            pr.details?.reduce(
                (sum, detail) => sum + cleanNumber(detail.estimasiTotalHarga),
                0
            ) ?? 0;

        const totalDisbursed =
            pr.uangMuka?.reduce((sum, um) => sum + cleanNumber(um.jumlah), 0) ?? 0;

        const StatusIcon = STATUS_CONFIG[pr.status].icon;

        const rawStatus = pr.uangMuka?.[0]?.status;
        const approveStatus: keyof typeof STATUS_APPROVE_CONFIG =
            rawStatus && rawStatus in STATUS_APPROVE_CONFIG
                ? (rawStatus as keyof typeof STATUS_APPROVE_CONFIG)
                : "DEFAULT";
        return (
            <Fragment>
                {/* ROW UTAMA + REF - PERBAIKAN: ref di-forward ke TableRow */}
                <MotionTableRow
                    ref={ref} // 🟢 REF DI-FORWARD KE TABLE ROW
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, delay }}
                    data-highlight={highlightId === pr.spk?.id}
                    className={cn("transition-all duration-500")}
                    onClick={onToggle}
                >
                    {/* ... rest of your table cells ... */}
                    <TableCell className="text-center">
                        <div className="flex gap-1">
                            {/* <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </Button> */}
                            <div className="mt-0.5">{index}</div>
                        </div>
                    </TableCell>

                    <TableCell className="font-medium max-w-[300px]">
                        <div className="flex items-center gap-0.5 flex-wrap">
                            {/* Nomor PR */}
                            <Badge
                                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 text-xs px-1.5 py-0.5"
                            >
                                <FileText className="h-2.5 w-2.5 mr-1" />
                                {pr.nomorPr}
                            </Badge>

                            {/* Conditional: Show PO if spkId is null (PR UM), otherwise show SPK/SO (PR SPK) */}
                            {!pr.spkId ? (
                                // PR UM - Show Purchase Orders and Child PRs
                                <Fragment>
                                    {pr.purchaseOrders && pr.purchaseOrders.length > 0 ? (
                                        pr.purchaseOrders.map((po) => (
                                            <Link
                                                key={po.id}
                                                href={`${role === 'pic' ? '/pic-area' : role === 'super' ? '/super-admin-area' : '/admin-area'}/logistic/purchasing/${po.id}`}
                                                className="group"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-[12px] px-1 py-0.5 cursor-pointer transition-colors group-hover:underline underline-offset-2",
                                                        po.status === 'CANCELLED'
                                                            ? "bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-500 line-through decoration-gray-400"
                                                            : "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 decoration-orange-400"
                                                    )}
                                                >
                                                    <FileText className="h-2 w-2 mr-0.5" />
                                                    No PO : {po.poNumber}
                                                </Badge>
                                            </Link>
                                        ))
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 text-xs px-1 py-0.5"
                                        >
                                            <FileText className="h-2 w-2 mr-0.5" />
                                            No PO
                                        </Badge>
                                    )}

                                    {/* Child PR Badges - Show if childPrs exist (for Parent PR) */}
                                    {pr.childPrs && pr.childPrs.length > 0 && (
                                        pr.childPrs.map((child) => (
                                            <Link
                                                key={child.id}
                                                href={`${role === 'pic' ? '/pic-area' : role === 'super' ? '/super-admin-area' : '/admin-area'}/logistic/pr?search=${encodeURIComponent(child.nomorPr)}&page=1`}
                                                className="group"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Badge
                                                    variant="outline"
                                                    className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 text-[12px] px-1 py-0.5 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors group-hover:underline underline-offset-2 decoration-indigo-400"
                                                >
                                                    <FileText className="h-2 w-2 mr-0.5" />
                                                    PR SPK : {child.nomorPr}
                                                </Badge>
                                            </Link>
                                        ))
                                    )}
                                </Fragment>
                            ) : (
                                // PR SPK - Show SPK, SO, and Parent PR with clickable links
                                <Fragment>
                                    <Link
                                        href={`${role === 'pic' ? '/pic-area' : role === 'super' ? '/super-admin-area' : '/admin-area'}/logistic/spk?search=${encodeURIComponent(pr.spk?.spkNumber || pr.spkId || "")}&filter=all&page=1`}
                                        className="group"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Badge
                                            variant="outline"
                                            className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 text-xs px-1 py-0.5 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors group-hover:underline underline-offset-2 decoration-emerald-400"
                                        >
                                            <FileText className="h-2 w-2 mr-0.5" />
                                            No SPK : {pr.spk?.spkNumber || pr.spkId || "-"}
                                        </Badge>
                                    </Link>

                                    <Link
                                        href={`${role === 'pic' ? '/pic-area' : role === 'super' ? '/super-admin-area' : '/admin-area'}/sales/salesOrder?search=${encodeURIComponent(pr.spk?.salesOrder?.soNumber || "")}`}
                                        className="group"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Badge
                                            variant="outline"
                                            className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 text-xs px-1 py-0.5 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group-hover:underline underline-offset-2 decoration-purple-400"
                                        >
                                            <FileText className="h-2 w-2 mr-0.5" />
                                            No SO : {pr.spk?.salesOrder?.soNumber || "-"}
                                        </Badge>
                                    </Link>

                                    {/* Parent PR Badge - Show if parentPr exists */}
                                    {pr.parentPr && (
                                        <Link
                                            href={`${role === 'pic' ? '/pic-area' : role === 'super' ? '/super-admin-area' : '/admin-area'}/logistic/pr?search=${encodeURIComponent(pr.parentPr.nomorPr)}&page=1`}
                                            className="group"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Badge
                                                variant="outline"
                                                className="bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 text-[12px] px-1 py-0.5 cursor-pointer hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors group-hover:underline underline-offset-2 decoration-cyan-400"
                                            >
                                                <FileText className="h-2 w-2 mr-0.5" />
                                                PR UMUM : {pr.parentPr.nomorPr}
                                            </Badge>
                                        </Link>
                                    )}
                                </Fragment>
                            )}
                        </div>
                    </TableCell>

                    <TableCell className="min-w-[350px]">
                        <div className="group relative">
                            {/* ✅ Background berbeda berdasarkan status */}
                            <div className={`border rounded-xl p-4 hover:shadow-md transition-all duration-200 ${pr.projectId && pr.project?.name
                                ? 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50'
                                }`}>
                                <div className="flex items-center gap-3">
                                    {/* ✅ Icon dengan warna berbeda */}
                                    <div className={`p-2 rounded-lg ${pr.projectId && pr.project?.name
                                        ? 'bg-green-50 dark:bg-green-900/30'
                                        : 'bg-amber-100 dark:bg-amber-900/50'
                                        }`}>
                                        {pr.projectId && pr.project?.name ? (
                                            <Building className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="cursor-help">
                                                        {/* ✅ Text color berbeda berdasarkan status */}
                                                        <div className={`text-sm uppercase font-bold text-wrap ${pr.projectId && pr.project?.name
                                                            ? 'text-gray-900 dark:text-white'
                                                            : 'text-amber-800 dark:text-amber-300'
                                                            }`}>
                                                            {pr.projectId && pr.project?.name
                                                                ? pr.project.name
                                                                : (pr.keterangan || "No Project Assigned")
                                                            }
                                                        </div>

                                                        {/* ✅ Subtext untuk keterangan tambahan */}
                                                        {!pr.projectId && !pr.keterangan && (
                                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                                                PR tanpa referensi project
                                                            </p>
                                                        )}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-xs">
                                                    <div className="space-y-2">
                                                        <div>
                                                            <p className="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400">
                                                                {pr.projectId && pr.project?.name ? "PROJECT" : "KETERANGAN"}
                                                            </p>
                                                            <p className="text-sm font-medium text-wrap">
                                                                {pr.projectId && pr.project?.name
                                                                    ? pr.project.name
                                                                    : (pr.keterangan || "No Project Assigned")
                                                                }
                                                            </p>
                                                        </div>

                                                        {/* ✅ Info status di tooltip */}
                                                        {!pr.projectId && (
                                                            <div className={`p-2 rounded-md text-xs ${pr.keterangan
                                                                ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                                                : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                                                }`}>
                                                                {pr.keterangan
                                                                    ? "⚠️ PR dibuat tanpa referensi project"
                                                                    : "ℹ️ PR tanpa project dan keterangan"
                                                                }
                                                            </div>
                                                        )}

                                                        {/* SPK info */}
                                                        {pr.spk?.spkNumber && (
                                                            <div>
                                                                <p className="text-xs font-semibold mb-1">SPK</p>
                                                                <p className="text-xs">{pr.spk.spkNumber}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>

                                    {/* ✅ Badge dengan warna matching */}
                                    <div className="flex flex-col gap-1">
                                        {pr.projectId && pr.project?.name ? (
                                            <Badge variant="outline" className="text-[12px] px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                                <Building className="h-2.5 w-2.5 mr-1" />
                                                PR PROJECT
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive" className="text-[12px] px-2 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
                                                <FileText className="h-2.5 w-2.5 mr-1" />
                                                PR UMUM
                                            </Badge>
                                        )}

                                        {pr.spk?.spkNumber && (
                                            <Badge variant="outline" className="text-[12px] px-2 py-0.5">
                                                <FileCheck className="h-2.5 w-2.5 mr-1" />
                                                PR SPK
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TableCell>

                    <TableCell>
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-purple-500" />
                            <div>
                                <div className="text-xs text-muted-foreground">Admin:</div>
                                <div className="font-medium">{pr.karyawan?.namaLengkap || pr.karyawanId}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <User className="h-4 w-4 text-blue-500" />
                            <div>
                                <div className="text-xs text-muted-foreground">Request:</div>
                                <div className="font-medium text-orange-600 uppercase">{pr.requestedBy?.namaLengkap || "-"}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4 text-orange-500" />
                            {formatDate(pr.tanggalPr)}
                        </div>
                    </TableCell>

                    <TableCell className="text-right min-w-[220px]">
                        <div className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-400/60 dark:border-green-800/60 rounded-lg px-3 py-2">
                            <div className="flex flex-col gap-1.5 text-[12px] font-bold">
                                {(() => {
                                    const totalPO = pr.purchaseOrders?.reduce((sum, po) => po.status === 'CANCELLED' ? sum : sum + cleanNumber(po.totalAmount), 0) ?? 0;
                                    const totalPrSpk = pr.childPrs?.reduce((sum, child) => {
                                        const childTotal = child.details?.reduce((s, d) => s + cleanNumber(d.estimasiTotalHarga), 0) ?? 0;
                                        return sum + childTotal;
                                    }, 0) ?? 0;

                                    // 1. Summary from Child PRs (for PR-UM view -> breakdown of PR SPK)
                                    const childSourceProductSummaries = pr.childPrs?.reduce((acc, child) => {
                                        child.details?.forEach((detail) => {
                                            if (detail.sourceProduct) {
                                                acc[detail.sourceProduct] = (acc[detail.sourceProduct] || 0) + cleanNumber(detail.estimasiTotalHarga);
                                            }
                                        });
                                        return acc;
                                    }, {} as Record<string, number>);

                                    // 2. Summary from OWN details (for PR-SPK view -> breakdown of itself)
                                    const ownSourceProductSummaries = pr.details?.reduce((acc, detail) => {
                                        if (detail.sourceProduct) {
                                            acc[detail.sourceProduct] = (acc[detail.sourceProduct] || 0) + cleanNumber(detail.estimasiTotalHarga);
                                        }
                                        return acc;
                                    }, {} as Record<string, number>);

                                    const prLabel = !pr.spkId ? "PR-UM" : "PR-SPK";

                                    return (
                                        <>
                                            {/* PR Amount */}
                                            <div className="group flex justify-between items-center gap-4 transition-all cursor-default w-full">
                                                <span className="text-emerald-700 dark:text-emerald-400 font-bold shrink-0">{prLabel} </span>
                                                <span className="text-emerald-700 dark:text-emerald-400 font-bold text-right tabular-nums group-hover:underline underline-offset-4">
                                                    {formatCurrency(totalAmount)}
                                                </span>
                                            </div>

                                            {/* Breakdown for PR SPK (Own Details) - Only if it IS an SPK based PR */}
                                            {pr.spkId && ownSourceProductSummaries && Object.entries(ownSourceProductSummaries).map(([source, amount]) => (
                                                amount > 0 && (
                                                    <div
                                                        key={source}
                                                        className="group flex justify-between items-center gap-4 pt-1 border-dotted border-t border-emerald-200 dark:border-emerald-800/40 transition-all cursor-default w-full pl-2"
                                                    >
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 text-[10px] uppercase">
                                                            - {source.replace(/_/g, " ")}
                                                        </span>
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-right tabular-nums text-[11px]">
                                                            {formatCurrency(amount)}
                                                        </span>
                                                    </div>
                                                )
                                            ))}

                                            {/* PO Amount */}
                                            {totalPO > 0 && (
                                                <Link
                                                    href={`${role === 'pic' ? '/pic-area' : role === 'super' ? '/super-admin-area' : '/admin-area'}/logistic/purchasing?search=${encodeURIComponent(pr.nomorPr)}&page=1`}
                                                    className="group flex justify-between items-center gap-4 pt-1 border-t border-green-400/40 dark:border-green-800/40 transition-all cursor-pointer w-full"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <span className="text-orange-600 dark:text-orange-400 font-bold shrink-0">PO </span>
                                                    <span className="text-orange-600 dark:text-orange-400 font-bold text-right tabular-nums group-hover:underline underline-offset-4">
                                                        {formatCurrency(totalPO)}
                                                    </span>
                                                </Link>
                                            )}

                                            {/* Child PR Amount (PR SPK) */}
                                            {totalPrSpk > 0 && (
                                                <>
                                                    <Link
                                                        href={`${role === 'pic' ? '/pic-area' : role === 'super' ? '/super-admin-area' : '/admin-area'}/logistic/pr?search=${encodeURIComponent(pr.nomorPr)}&page=1`}
                                                        className="group flex justify-between items-center gap-4 pt-1 border-t border-green-400/40 dark:border-green-800/40 transition-all cursor-pointer w-full"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <span className="text-indigo-600 dark:text-indigo-400 font-bold shrink-0">PR SPK </span>
                                                        <span className="text-indigo-600 dark:text-indigo-400 font-bold text-right tabular-nums group-hover:underline underline-offset-4">
                                                            {formatCurrency(totalPrSpk)}
                                                        </span>
                                                    </Link>

                                                    {/* Source Product Breakdown for PR SPK children (when viewing PR-UM) */}
                                                    {!pr.spkId && childSourceProductSummaries && Object.entries(childSourceProductSummaries).map(([source, amount]) => (
                                                        amount > 0 && (
                                                            <div
                                                                key={source}
                                                                className="group flex justify-between items-center gap-4 pt-1 border-dotted border-t border-indigo-200 dark:border-indigo-800/40 transition-all cursor-default w-full pl-2"
                                                            >
                                                                <span className="text-indigo-600 dark:text-indigo-400 font-bold shrink-0 text-[10px] uppercase">
                                                                    - {source.replace(/_/g, " ")}
                                                                </span>
                                                                <span className="text-indigo-600 dark:text-indigo-400 font-bold text-right tabular-nums text-[11px]">
                                                                    {formatCurrency(amount)}
                                                                </span>
                                                            </div>
                                                        )
                                                    ))}
                                                </>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </TableCell>

                    <TableCell>
                        <Badge
                            variant="outline"
                            className={`${STATUS_CONFIG[pr.status].color} border font-medium text-xs`}
                        >
                            {STATUS_CONFIG[pr.status].label}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <BanknoteArrowUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(pr.uangMuka?.[0]?.jumlah ?? 0)}
                                </span>
                            </div>
                            <div className="text-xs text-blue-700 dark:text-blue-300 font-medium mt-0.5">ACC FINANCE</div>
                        </div>
                    </TableCell>



                    <TableCell className="text-right">
                        <PercentageBadge
                            totalAmount={totalAmount}
                            totalDisbursed={totalDisbursed}
                        />
                    </TableCell>

                    <TableCell>
                        <Badge
                            variant="outline"
                            className={`${STATUS_APPROVE_CONFIG[approveStatus].color} border font-medium text-xs flex items-center gap-1`}
                        >
                            <StatusIcon className="h-3 w-3" />
                            {STATUS_APPROVE_CONFIG[approveStatus].label}
                        </Badge>
                    </TableCell>

                    <TableCell className="font-semibold text-right max-w-[20px]">
                        {pr.uangMuka?.[0]?.pertanggungjawaban?.[0]?.details?.length ? (
                            <Badge variant="outline" className="ml-2">
                                {
                                    pr.uangMuka[0].pertanggungjawaban[0].details
                                        ?.length
                                }{" "}
                                rincian LPP
                            </Badge>
                        ) : null}
                    </TableCell>

                    <TableCell onClick={(e) => e.stopPropagation()}>
                        <ActionButtons
                            pr={pr}
                            role={role}
                            isDeleting={isDeleting}
                            onViewDetail={onViewDetail}
                            onViewPdf={onViewPdf}
                            onCreateLpp={onCreateLpp}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    </TableCell>
                </MotionTableRow>

                {
                    isExpanded && (
                        <TableRow>
                            <TableCell colSpan={11} className="bg-muted/30 p-4">
                                <ExpandedDetails details={pr.details} />
                            </TableCell>
                        </TableRow>
                    )
                }
            </Fragment >
        );
    }
);

ExpandableRow.displayName = "ExpandableRow";