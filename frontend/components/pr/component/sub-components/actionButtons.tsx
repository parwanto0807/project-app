import { Button } from "@/components/ui/button";
import { PurchaseRequestWithRelations } from "@/types/pr";
import { Edit, Trash2, Eye, DockIcon } from "lucide-react";
import { PdfIcon } from "./pdfIcon";

interface ActionButtonsProps {
  pr: PurchaseRequestWithRelations;
  role: string;
  isDeleting: boolean;
  onViewDetail: () => void;
  onViewPdf: () => void;
  onCreateLpp: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ActionButtons({
  pr,
  role,
  isDeleting,
  onViewDetail,
  onViewPdf,
  onCreateLpp,
  onEdit,
  onDelete,
}: ActionButtonsProps) {

  const canEdit = (role === "admin" || role === "pic") &&
    (pr.status === "DRAFT" || pr.status === "REVISION_NEEDED");
  const canDelete = (role === "admin" || role === "pic") &&
    (pr.status === "DRAFT" || pr.status === "REVISION_NEEDED");

  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onViewDetail}
        className="flex items-center gap-1 text-red-600 hover:text-red-800 border px-2 py-1 cursor-pointer rounded text-sm bg-slate-300 dark:bg-slate-300 hover:bg-white dark:hover:bg-white"
      >
        <Eye className="w-5 h-5" />
        Detail
      </Button>

      <Button
        onClick={onViewPdf}
        className="flex items-center gap-1 text-red-600 hover:text-red-800 border px-2 py-1 cursor-pointer rounded text-sm bg-slate-300 hover:bg-white"
      >
        <PdfIcon className="w-5 h-5" />
        Preview Pdf
      </Button>

      {pr.spkId && (
        <Button
          onClick={onCreateLpp}
          disabled={pr.status !== "COMPLETED"}
          className="flex items-center gap-1 text-red-600 hover:text-red-800 border px-2 py-1 cursor-pointer rounded text-sm bg-slate-300 hover:bg-white"
        >
          <DockIcon className="w-5 h-5" />
          Create LPP
        </Button>
      )}

      {canEdit && (
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}

      {canDelete && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          disabled={isDeleting}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}