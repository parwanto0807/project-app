import { Fragment, forwardRef } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandableRowProps {
    pr: PurchaseRequestWithRelations;
    index: number;
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
                <TableRow
                    ref={ref} // 🟢 REF DI-FORWARD KE TABLE ROW
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

                    <TableCell className="font-medium max-w-[180px]">
                        <div className="flex items-center gap-0.5 flex-wrap">
                            {/* Nomor PR */}
                            <Badge
                                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 text-xs px-1.5 py-0.5"
                            >
                                <FileText className="h-2.5 w-2.5 mr-1" />
                                {pr.nomorPr}
                            </Badge>

                            {/* SPK */}
                            <Badge
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 text-xs px-1 py-0.5"
                            >
                                <FileText className="h-2 w-2 mr-0.5" />
                                {pr.spk?.spkNumber || pr.spkId || "-"}
                            </Badge>

                            {/* Sales Order */}
                            <Badge
                                variant="outline"
                                className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 text-xs px-1 py-0.5"
                            >
                                <FileText className="h-2 w-2 mr-0.5" />
                                {pr.spk?.salesOrder?.soNumber || "-"}
                            </Badge>
                        </div>
                    </TableCell>

                    <TableCell className="min-w-[400px]">
                        <div className="group relative">
                            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${pr.project?.name ? 'bg-green-50 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                        <Building className={`h-4 w-4 ${pr.project?.name ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="text-sm uppercase font-bold text-gray-900 dark:text-white text-wrap cursor-help">
                                                        {pr.project?.name || (
                                                            <span className="text-gray-400 dark:text-gray-500 italic font-normal">No Project Assigned</span>
                                                        )}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-xs">
                                                    <p className="text-xs text-wrap">
                                                        {pr.project?.name || pr.projectId || "No Project Assigned"}
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TableCell>

                    <TableCell>
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-purple-500" />
                            {pr.karyawan?.namaLengkap || pr.karyawanId}
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-orange-500" />
                            {formatDate(pr.tanggalPr)}
                        </div>
                    </TableCell>

                    <TableCell className="text-right">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <BanknoteArrowUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(totalAmount)}
                                </span>
                            </div>
                            <div className="text-xs text-green-700 dark:text-green-300 font-medium mt-0.5">TOTAL REQUEST</div>
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
                </TableRow>

                {isExpanded && (
                    <TableRow>
                        <TableCell colSpan={11} className="bg-muted/30 p-4">
                            <ExpandedDetails details={pr.details} />
                        </TableCell>
                    </TableRow>
                )}
            </Fragment>
        );
    }
);

ExpandableRow.displayName = "ExpandableRow";