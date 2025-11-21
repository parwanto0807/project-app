// components/ui/tableSkeleton.tsx
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";

export function DetailedTableSkeleton({ rows = 5 }: { rows?: number }) {
  console.log('🦴 Rendering DetailedTableSkeleton with', rows, 'rows');
  
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <TableRow key={index} className="animate-pulse">
          <TableCell className="py-4">
            <div className="h-4 bg-gray-300 rounded w-6 mx-auto"></div>
          </TableCell>
          <TableCell className="py-4">
            <div className="h-4 bg-gray-300 rounded w-32"></div>
          </TableCell>
          <TableCell className="py-4">
            <div className="h-4 bg-gray-300 rounded w-20"></div>
          </TableCell>
          <TableCell className="py-4">
            <div className="h-4 bg-gray-300 rounded w-24"></div>
          </TableCell>
          <TableCell className="py-4">
            <div className="h-4 bg-gray-300 rounded w-20"></div>
          </TableCell>
          <TableCell className="py-4">
            <div className="h-6 bg-gray-300 rounded-full w-24"></div>
          </TableCell>
          <TableCell className="py-4">
            <div className="h-4 bg-gray-300 rounded w-20"></div>
          </TableCell>
          <TableCell className="py-4 text-center">
            <div className="h-4 bg-gray-300 rounded w-10 mx-auto"></div>
          </TableCell>
          <TableCell className="py-4">
            <div className="h-6 bg-gray-300 rounded w-28"></div>
          </TableCell>
          <TableCell className="py-4">
            <div className="h-4 bg-gray-300 rounded w-24"></div>
          </TableCell>
          <TableCell className="py-4 text-right">
            <div className="flex justify-end space-x-2">
              <div className="h-8 bg-gray-300 rounded w-8"></div>
              <div className="h-8 bg-gray-300 rounded w-8"></div>
              <div className="h-8 bg-gray-300 rounded w-8"></div>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// Simple version untuk test
export function SimpleTableSkeleton() {
  return (
    <TableRow>
      <TableCell colSpan={11} className="h-24 text-center">
        <div className="flex justify-center items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Loading data...</span>
        </div>
      </TableCell>
    </TableRow>
  );
}