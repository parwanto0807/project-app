import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PurchaseRequestWithRelations } from "@/types/pr";
import { MobileCardSkeleton } from "@/components/ui/mobileCardSkeleton";
import { MobileEmptyState } from "@/components/ui/mobileEmptyState";
import { STATUS_CONFIG } from "../constants";
import { formatCurrency, formatDate } from "../utils";
import {
  FileText,
  Building,
  User,
  Calendar,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
} from "lucide-react";

interface MobileCardViewProps {
  purchaseRequests: PurchaseRequestWithRelations[];
  isLoading: boolean;
  expandedRows: Set<string>;
  role: string;
  isDeleting: boolean;
  hasActiveFilters: boolean;
  onToggleRowExpansion: (prId: string) => void;
  onViewPdf: (pr: PurchaseRequestWithRelations) => void;
  onEdit: (pr: PurchaseRequestWithRelations) => void;
  onDelete: (id: string) => void;
}

export function MobileCardView({
  purchaseRequests,
  isLoading,
  expandedRows,
  role,
  isDeleting,
  hasActiveFilters,
  onToggleRowExpansion,
  onViewPdf,
  onEdit,
  onDelete,
}: MobileCardViewProps) {
  if (isLoading) {
    return <MobileCardSkeleton />;
  }

  if (purchaseRequests.length === 0) {
    return <MobileEmptyState hasFilters={hasActiveFilters} />;
  }

  return (
    <>
      {purchaseRequests.map((pr) => {
        const isExpanded = expandedRows.has(pr.id);
        const totalAmount = pr.details?.reduce(
          (sum, detail) => sum + Number(detail.estimasiTotalHarga || 0),
          0
        ) || 0;

        return (
          <Card key={pr.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 space-y-2">
              {/* Header */}
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 flex-shrink-0"
                    onClick={() => onToggleRowExpansion(pr.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <FileText className="h-3 w-3 text-blue-500 flex-shrink-0" />
                    <span className="font-semibold text-sm truncate">
                      {pr.nomorPr}
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`${STATUS_CONFIG[pr.status].color} border font-medium text-xs px-1 py-0 uppercase`}
                >
                  {STATUS_CONFIG[pr.status].label}
                </Badge>
              </div>

              {/* Project and SPK - Compact */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <p className="font-medium text-muted-foreground">Project</p>
                  <div className="flex items-center gap-1">
                    <Building className="h-3 w-3 text-green-500 flex-shrink-0" />
                    <span className="text-wrap text-xs">
                      {pr.project?.name || pr.projectId}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-muted-foreground">SPK</p>
                  <div className="text-xs truncate">
                    {pr.spk?.spkNumber || pr.spkId}
                  </div>
                </div>
              </div>

              {/* Requester and Date - Compact */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <p className="font-medium text-muted-foreground">Requested By</p>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-purple-500 flex-shrink-0" />
                    <span className="truncate text-xs">
                      {pr.karyawan?.namaLengkap || pr.karyawanId}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-muted-foreground">Date</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-orange-500 flex-shrink-0" />
                    <span className="text-xs">{formatDate(pr.tanggalPr)}</span>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="text-xs">
                <p className="font-medium text-muted-foreground">Total Amount</p>
                <p className="font-semibold text-sm">
                  {formatCurrency(totalAmount)}
                </p>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t pt-2 space-y-2">
                  <div>
                    <h4 className="font-semibold mb-1 text-xs">Description</h4>
                    <p className="text-xs">{pr.nomorPr || '-'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-xs">Items ({pr.details?.length || 0})</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {pr.details?.map((detail, index) => (
                        <div key={detail.id} className="flex justify-between text-xs border-b pb-1">
                          <div className="flex-1 min-w-0 pr-2">
                            <span className="font-medium truncate block">
                              {index + 1}. {detail.catatanItem}
                            </span>
                            <div className="text-muted-foreground text-xs">
                              Qty: {detail.jumlah} {detail.satuan}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs">{formatCurrency(detail.estimasiHargaSatuan)}</div>
                            <div className="text-muted-foreground text-xs">
                              Total: {formatCurrency(detail.estimasiTotalHarga)}
                            </div>
                          </div>
                        </div>
                      )) || <div className="text-xs text-muted-foreground">No items</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions - Compact */}
              <div className="flex justify-end gap-1 pt-2 border-t">
                <Button
                  onClick={() => onViewPdf(pr)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-800 border px-2 py-1 rounded text-xs h-7"
                >
                  <PdfIcon className="w-3 h-3" />
                  PDF
                </Button>
                {role === "admin" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(pr)}
                    disabled={!(pr.status === "DRAFT" || pr.status === "REVISION_NEEDED")}
                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}

                {role === "admin" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(pr.id)}
                    disabled={isDeleting || !(pr.status === "DRAFT" || pr.status === "REVISION_NEEDED")}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}

// PDF Icon component for mobile
const PdfIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
    {...props}
  >
    <path d="M6 2a2 2 0 0 0-2 2v16c0 1.103.897 2 2 2h12a2 2 0 0 0 2-2V8l-6-6H6z" />
    <path fill="#fff" d="M14 2v6h6" />
    <text
      x="7"
      y="18"
      fill="red"
      fontSize="6"
      fontWeight="bold"
      fontFamily="Arial, sans-serif"
    >
      PDF
    </text>
  </svg>
);