"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelSalesOrder } from "@/lib/action/sales/salesOrder";
import { Button } from "@/components/ui/button";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  id: string;
  disabled?: boolean;
}

export function CancelSOButton({ id, disabled }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  console.log("ID, Disble", id, disabled)

  const handleCancel = async () => {
    try {
      setLoading(true);
      const result = await cancelSalesOrder(id);
      if (result.success) {
        toast.success(result.message);
        router.refresh(); // refresh tabel
      } else {
        toast.error(result.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="cursor-pointer"
          disabled={loading || disabled}
        >
          {loading ? "Cancelling..." : "Cancel Sales Order"}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Sales Order?</AlertDialogTitle>
          <AlertDialogDescription>
            Sales Order yang di-cancel tidak bisa diproses kembali.
            Apakah Anda yakin ingin melanjutkan?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={loading}
          >
            Ya, Cancel
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
