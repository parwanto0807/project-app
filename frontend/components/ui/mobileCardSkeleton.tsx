import { Card, CardContent } from "@/components/ui/card";

export function MobileCardSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={`skeleton-mobile-${index}`} className="animate-pulse">
          <CardContent className="p-3 space-y-2">
            <div className="h-3 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-3 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-16" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}