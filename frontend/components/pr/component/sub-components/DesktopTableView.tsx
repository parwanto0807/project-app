// components/pr/component/DesktopTableView.tsx
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
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
}: DesktopTableViewProps) {

  const searchParams = useSearchParams();
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const highlightId = searchParams.get("highLightId") || "";

  useEffect(() => {
    if (!highlightId) return;

    // Cek elemen row
    const row = rowRefs.current[highlightId];
    if (!row) return;

    const SCROLL_DELAY = 300;
    const HIGHLIGHT_DURATION = 5000;

    // Class highlight
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

    // Scroll ke row
    const scrollTimer = setTimeout(() => {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
    }, SCROLL_DELAY);

    // Tambah highlight
    row.classList.add(...classes);

    // Hapus highlight + bersihkan URL
    const cleanupTimer = setTimeout(() => {
      row.classList.remove(...classes);

      const params = new URLSearchParams(window.location.search);
      params.delete("highlightId");

      const finalUrl = params.toString()
        ? `?${params.toString()}`
        : window.location.pathname;

      window.history.replaceState({}, "", finalUrl);
    }, HIGHLIGHT_DURATION);

    // Cleanup
    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(cleanupTimer);
      row.classList.remove(...classes);
    };
  }, [highlightId]);


  // JIKA LOADING, TAMPILKAN SKELETON - PAKAI LOGIC INI
  if (isLoading) {
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
            <DetailedTableSkeleton rows={5} />
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