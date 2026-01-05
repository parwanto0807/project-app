"use client";

import { Warehouse } from "@/types/whType";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pencil,
  Trash2,
  Warehouse as WarehouseIcon,
  MapPin,
  CheckCircle,
  XCircle,
} from "lucide-react";
import clsx from "clsx";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteWarehouse } from "@/lib/action/wh/whAction";

interface WarehouseTableProps {
  data: Warehouse[];
  isLoading: boolean;
  highlightId?: string | null;
  onRefresh?: () => void;
}

export default function WarehouseTable({
  data,
  isLoading,
  highlightId,
  onRefresh,
}: WarehouseTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await deleteWarehouse(deleteId);
      if (res.success) {
        toast.success("Berhasil menghapus warehouse");
        if (onRefresh) {
          onRefresh();
        } else {
          router.refresh();
        }
      } else {
        toast.error(res.message || "Gagal menghapus warehouse");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus warehouse");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  /* =========================
     SKELETON
  ========================= */
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-16 w-full rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="text-center text-muted-foreground py-10">
        Tidak ada data warehouse
      </div>
    );
  }

  return (
    <>
      {/* =========================
          DESKTOP TABLE
      ========================= */}
      <div className="hidden lg:block rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((wh) => (
              <TableRow
                key={wh.id}
                className={clsx(
                  highlightId === wh.id &&
                  "bg-blue-50 dark:bg-blue-900/20"
                )}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <WarehouseIcon className="h-4 w-4 text-indigo-500" />
                    {wh.code}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2 font-bold">
                    {wh.name}
                    {wh.isMain && (
                      <Badge className="bg-green-600 text-white hover:bg-green-600 dark:bg-green-600 dark:text-white border-0">
                        Main Warehouse
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {wh.address || "-"}
                </TableCell>

                <TableCell>
                  {wh.isActive ? (
                    <Badge
                      variant="outline"
                      className="border-green-500 text-green-600 dark:text-green-400"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Aktif
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-red-500 text-red-600 dark:text-red-400"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Nonaktif
                    </Badge>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin-area/inventory/wh/update/${wh.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                      >
                        <Pencil className="h-4 w-4 text-blue-600" />
                      </Button>
                    </Link>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteId(wh.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* =========================
          MOBILE CARD VIEW
      ========================= */}
      <div className="grid gap-3 lg:hidden">
        {data.map((wh) => (
          <div
            key={wh.id}
            className={clsx(
              "rounded-xl border p-4 bg-background space-y-3",
              highlightId === wh.id &&
              "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WarehouseIcon className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    {wh.name}
                    {wh.isMain && (
                      <Badge className="bg-green-600 text-white hover:bg-green-600 dark:bg-green-600 dark:text-white border-0 text-[10px] px-1 py-0 h-5">
                        Main
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {wh.code}
                  </p>
                </div>
              </div>

              {wh.isActive ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>

            {wh.address && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 text-orange-500" />
                <span>{wh.address}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Link href={`/admin-area/inventory/wh/update/${wh.id}`}>
                <Button
                  size="sm"
                  variant="outline"
                >
                  <Pencil className="h-4 w-4 text-blue-600" />
                </Button>
              </Link>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleteId(wh.id)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the warehouse from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
