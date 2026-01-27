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
      <div className="flex flex-col gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onViewDetail}
          className="flex items-center gap-1 text-red-600 hover:text-red-800 border px-2 py-1 cursor-pointer rounded-xl text-sm bg-slate-300 dark:bg-slate-300 hover:bg-white dark:hover:bg-white w-32 h-8 justify-start"
        >
          <Eye className="w-5 h-5" />
          Detail
        </Button>

        <Button
          onClick={onViewPdf}
          className="flex items-center gap-1 text-red-600 hover:text-red-800 border px-2 py-1 cursor-pointer rounded-xl text-sm bg-slate-300 hover:bg-white w-32 h-8 justify-start"
        >
          <PdfIcon className="w-5 h-5" />
          Preview Pdf
        </Button>

        {pr.spkId && (
          <Button
            onClick={onCreateLpp}
            disabled={pr.status !== "COMPLETED"}
            className="flex items-center gap-1 text-red-600 hover:text-red-800 border px-2 py-1 cursor-pointer rounded-xl text-sm bg-slate-300 hover:bg-white w-32 h-8 justify-start"
          >
            <DockIcon className="w-5 h-5" />
            Create LPP
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 w-24 h-8 justify-start px-2 cursor-pointer rounded-xl"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        )}

        {canDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed w-24 h-8 justify-start px-2 cursor-pointer rounded-xl"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}