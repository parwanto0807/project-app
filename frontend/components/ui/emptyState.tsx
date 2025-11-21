import { TableRow, TableCell } from "@/components/ui/table";
import { FileText } from "lucide-react";

interface EmptyStateProps {
  hasFilters: boolean;
}

export function EmptyState({ hasFilters }: EmptyStateProps) {
  return (
    <TableRow>
      <TableCell colSpan={12} className="text-center py-8">
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <FileText className="h-12 w-12 mb-4 text-gray-300" />
          <p className="text-lg font-medium">No purchase requests found</p>
          <p className="text-sm mt-1">
            {hasFilters
              ? "Try adjusting your search or filters"
              : "Get started by creating a new purchase request"
            }
          </p>
        </div>
      </TableCell>
    </TableRow>
  );
}