"use client";

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
import { toast } from "sonner";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type DeleteProductAlertProps = {
    id: string;
    onDelete: () => void;
};

export default function DeleteProductAlert({ id, onDelete }: DeleteProductAlertProps) {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            if (!id) {
                toast("ID tidak valid");
                return;
            }
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/master/product/deleteProduct/${id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );
            const data = await res.json();
            if (res.ok) {
                onDelete();
                toast(data.message || "Product berhasil dihapus! ✅");
            } else {
                toast(data.error || "Gagal menghapus Product! ❌");
            }
        } catch (error) {
            console.error("Error deleting Product:", error);
            toast("Terjadi kesalahan saat menghapus Product.");
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <Button
                variant="ghost"
                className="w-full justify-start p-0 h-auto font-normal hover:text-red-600 dark:hover:text-red-400"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen(true);
                }}
            >
                <div className="flex items-center gap-2 pl-2 py-1">
                    <Trash2 className="w-4 h-4 text-red-400"/>
                    Delete
                </div>
            </Button>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Anda yakin ingin menghapus Product ini?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tindakan ini tidak bisa dibatalkan dan akan menghapus data Product dari server secara permanen.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={loading}>
                        {loading ? "Menghapus..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}