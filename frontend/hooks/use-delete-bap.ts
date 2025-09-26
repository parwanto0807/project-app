import { useState } from "react";
import { deleteBAP } from "@/lib/action/bap/bap";

interface UseDeleteBAPProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useDeleteBAP({ onSuccess, onError }: UseDeleteBAPProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const openDialog = (id: string) => {
    setSelectedId(id);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedId(null);
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    setIsLoading(true);
    try {
      const result = await deleteBAP(selectedId);

      if (result.success) {
        onSuccess?.();
        // Beri delay untuk melihat feedback sukses
        setTimeout(() => {
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        }, 1000);
      } else {
        onError?.(result.error || "Gagal menghapus data BAP");
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
      closeDialog();
    }
  };

  return {
    isDialogOpen,
    isLoading,
    openDialog,
    closeDialog,
    handleDelete,
    selectedId,
  };
}
