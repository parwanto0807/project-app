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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
// import { Button } from "@/components/ui/button";
// import { TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useState } from "react";
import { Trash2 } from "lucide-react";

type DeleteCustomerAlertProps = {
    id: string;
    onDelete: () => void;
};

export default function DeleteCustomerAlert({ id, onDelete }: DeleteCustomerAlertProps) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            if (!id) {
                toast("ID tidak valid");
                return;
            }
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/master/customer/deleteCustomer/${id}`,
                {
                    method: "DELETE",
                }
            );
            const data = await res.json();
            if (res.ok) {
                onDelete();
                toast(data.message || "Customer berhasil dihapus! ✅");
            } else {
                toast(data.error || "Gagal menghapus customer! ❌");
            }
        } catch (error) {
            console.error("Error deleting customer:", error);
            toast("Terjadi kesalahan saat menghapus customer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {/* <Button
                    variant="outline"
                    className="h-10 w-10 font-bold bg-white text-red-500 rounded-md border p-2 hover:bg-red-500 hover:text-white dark:bg-white dark:text-red-500 dark:hover:bg-red-500 dark:hover:text-white cursor-pointer"
                    disabled={loading}
                >
                    <span className="sr-only">Delete Customer</span>
                    <TrashIcon className="w-8" />
                </Button> */}
                <h3 className="flex items-center gap-2 pl-4 py-1 hover:bg-red-200 rounded cursor-pointer dark:hover:text-gray-800">
                    <Trash2 className="w-4 h-4 text-red-400" />
                    Delete
                </h3>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Anda yakin ingin menghapus customer ini?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tindakan ini tidak bisa dibatalkan dan akan menghapus data customer dari server secara permanen.
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
