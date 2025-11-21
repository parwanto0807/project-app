import { Fragment, forwardRef } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
    ChevronDown,
    ChevronRight,
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
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </Button>
                            <div className="mt-0.5">{index}</div>
                        </div>
                    </TableCell>

                    <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            {pr.nomorPr}
                        </div>
                        <div className="text-xs ml-6 text-muted-foreground">
                            SPK : {pr.spk?.spkNumber || pr.spkId}
                        </div>
                        <div className="text-xs ml-6 text-muted-foreground">
                            SO : {pr.spk?.salesOrder?.soNumber || "-"}
                        </div>
                    </TableCell>

                    <TableCell className="min-w-[350px]">
                        <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-green-500 shrink-0" />
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="text-sm font-bold uppercase cursor-help text-wrap block w-full">
                                            {pr.project?.name || pr.projectId}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                        <p className="text-xs text-wrap">
                                            {pr.project?.name || pr.projectId}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
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

                    <TableCell className="font-bold text-lg">
                        {formatCurrency(totalAmount)}
                    </TableCell>

                    <TableCell>
                        <Badge
                            variant="outline"
                            className={`${STATUS_CONFIG[pr.status].color} border font-medium text-xs`}
                        >
                            {STATUS_CONFIG[pr.status].label}
                        </Badge>
                    </TableCell>

                    <TableCell className="font-bold text-right text-lg">
                        {formatCurrency(pr.uangMuka?.[0]?.jumlah ?? 0)}
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