import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface MobileEmptyStateProps {
  hasFilters: boolean;
}

export function MobileEmptyState({ hasFilters }: MobileEmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <FileText className="h-8 w-8 sm:h-12 sm:w-12 mb-3 text-gray-300" />
          <p className="text-base sm:text-lg font-medium">No purchase requests found</p>
          <p className="text-xs sm:text-sm mt-1">
            {hasFilters
              ? "Try adjusting your search or filters"
              : "Get started by creating a new purchase request"
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}