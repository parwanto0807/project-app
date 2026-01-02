// components/pr/component/DesktopTableView.tsx
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell, // ✅ IMPORT TableCell
} from "@/components/ui/table";
import { PurchaseRequestWithRelations } from "@/types/pr";
import { DetailedTableSkeleton } from "@/components/ui/tableSkeleton";
import { EmptyState } from "@/components/ui/emptyState";
import { ExpandableRow } from "./ExpandableRow";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

interface DesktopTableViewProps {
  purchaseRequests: PurchaseRequestWithRelations[];
  isLoading: boolean;
  expandedRows: Set<string>;
  role: string;
  isDeleting: boolean;
  onToggleRowExpansion: (prId: string) => void;
  onViewDetail: (pr: PurchaseRequestWithRelations) => void;
  onViewPdf: (pr: PurchaseRequestWithRelations) => void;
  onCreateLpp: (id: string) => void;
  onEdit: (pr: PurchaseRequestWithRelations) => void;
  onDelete: (id: string) => void;
  getSerialNumber: (index: number) => number;
  showSkeleton?: boolean;
  skeletonRows?: number;
}

export function DesktopTableView({
  purchaseRequests,
  isLoading,
  expandedRows,
  role,
  isDeleting,
  onToggleRowExpansion,
  onViewDetail,
  onViewPdf,
  onCreateLpp,
  onEdit,
  onDelete,
  getSerialNumber,
  showSkeleton = false,
  skeletonRows = 10
}: DesktopTableViewProps) {

  const searchParams = useSearchParams();
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const highlightId = searchParams.get("highLightId") || "";

  useEffect(() => {
    if (!highlightId) return;

    const row = rowRefs.current[highlightId];
    if (!row) return;

    const SCROLL_DELAY = 300;
    const HIGHLIGHT_DURATION = 5000;

    const classes = [
      "bg-yellow-200",
      "dark:bg-yellow-900",
      "animate-pulse",
      "ring-2",
      "ring-yellow-400",
      "ring-offset-2",
      "transition-all",
      "duration-500",
    ];

    const scrollTimer = setTimeout(() => {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
    }, SCROLL_DELAY);

    row.classList.add(...classes);

    const cleanupTimer = setTimeout(() => {
      row.classList.remove(...classes);

      const params = new URLSearchParams(window.location.search);
      params.delete("highlightId");

      const finalUrl = params.toString()
        ? `?${params.toString()}`
        : window.location.pathname;

      window.history.replaceState({}, "", finalUrl);
    }, HIGHLIGHT_DURATION);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(cleanupTimer);
      row.classList.remove(...classes);
    };
  }, [highlightId]);

  // ✅ PERBAIKI: Gunakan showSkeleton untuk menentukan apakah tampilkan skeleton
  if (showSkeleton) {
    return (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead className="font-semibold">PR Number</TableHead>
              <TableHead className="w-20 font-semibold">Project</TableHead>
              <TableHead className="font-semibold">Requested By</TableHead>
              <TableHead className="font-semibold">Total Amount</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Acc Finance</TableHead>
              <TableHead className="font-semibold text-center"> % </TableHead>
              <TableHead className="font-semibold">Status Finance</TableHead>
              <TableHead className="font-semibold">Rincian LPP</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <DetailedTableSkeleton rows={skeletonRows} />
          </TableBody>
        </Table>
      </div>
    );
  }

  // ✅ PERBAIKI: Gunakan isLoading untuk loading state biasa (jika masih diperlukan)
  if (isLoading && !showSkeleton) {
    return (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead className="font-semibold">PR Number</TableHead>
              <TableHead className="w-20 font-semibold">Project</TableHead>
              <TableHead className="font-semibold">Requested By</TableHead>
              <TableHead className="font-semibold">Total Amount</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Acc Finance</TableHead>
              <TableHead className="font-semibold text-center"> % </TableHead>
              <TableHead className="font-semibold">Status Finance</TableHead>
              <TableHead className="font-semibold">Rincian LPP</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={11} className="h-24 text-center">
                <div className="flex justify-center items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">Loading data...</span>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  // Jika tidak ada data
  if (purchaseRequests.length === 0) {
    return (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead className="font-semibold">PR Number</TableHead>
              <TableHead className="w-20 font-semibold">Project</TableHead>
              <TableHead className="font-semibold">Requested By</TableHead>
              <TableHead className="font-semibold">Total Amount</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Acc Finance</TableHead>
              <TableHead className="font-semibold text-center"> % </TableHead>
              <TableHead className="font-semibold">Status Finance</TableHead>
              <TableHead className="font-semibold">Rincian LPP</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <EmptyState hasFilters={false} />
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead className="font-semibold">PR Number</TableHead>
            <TableHead className="w-20 font-semibold">Project</TableHead>
            <TableHead className="font-semibold">Admin & Request</TableHead>
            <TableHead className="font-semibold">Total Amount</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Acc Finance</TableHead>
            <TableHead className="font-semibold text-center"> % </TableHead>
            <TableHead className="font-semibold">Status Finance</TableHead>
            <TableHead className="font-semibold">Rincian LPP</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchaseRequests.map((pr, index) => (
            <ExpandableRow
              key={pr.id}
              ref={(el) => {
                rowRefs.current[pr.id] = el;
              }}
              pr={pr}
              index={getSerialNumber(index)}
              isExpanded={expandedRows.has(pr.id)}
              role={role}
              isDeleting={isDeleting}
              onToggle={() => onToggleRowExpansion(pr.id)}
              onViewDetail={() => onViewDetail(pr)}
              onViewPdf={() => onViewPdf(pr)}
              onCreateLpp={() => onCreateLpp(pr.id)}
              onEdit={() => onEdit(pr)}
              onDelete={() => onDelete(pr.id)}
              highlightId={highlightId}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}