import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createTransferAction,
    updateTransferAction,
    getTransfersAction,
    getTransferByIdAction,
    updateTransferStatusAction,
    cancelTransferAction,
    deletePermanentTransferAction,
    createTransferGRAction
} from '@/lib/action/tf/tfAction';
import type {
    CreateTransferInput,
    UpdateTransferStatusInput,
    TransferFilter
} from '@/types/tfType';
import { toast } from 'sonner';

export function useTransfers(filters?: TransferFilter) {
    return useQuery({
        queryKey: ['transfers', filters],
        queryFn: async () => {
            console.log('🎣 useTransfers queryFn called');
            const result = await getTransfersAction(filters);
            console.log('🎣 useTransfers queryFn result:', result);
            return result;
        },
        retry: false
    });
}

export function useTransfer(id: string) {
    return useQuery({
        queryKey: ['transfer', id],
        queryFn: () => getTransferByIdAction(id),
        enabled: !!id,
    });
}

export function useCreateTransfer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateTransferInput) => createTransferAction(input),
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ['transfers'] });
                toast.success('Transfer berhasil dibuat');
            } else {
                toast.error(data.error || 'Gagal membuat transfer');
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Gagal membuat transfer');
        },
    });
}

export function useUpdateTransfer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: CreateTransferInput }) => updateTransferAction(id, input),
        onSuccess: (data, variables) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ['transfers'] });
                queryClient.invalidateQueries({ queryKey: ['transfer', variables.id] });
                toast.success('Transfer berhasil diupdate');
            } else {
                toast.error(data.error || 'Gagal mengupdate transfer');
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Gagal mengupdate transfer');
        },
    });
}

export function useUpdateTransferStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateTransferStatusInput }) =>
            updateTransferStatusAction(id, input),
        onSuccess: (data, variables) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ['transfers'] });
                queryClient.invalidateQueries({ queryKey: ['transfer', variables.id] });
                toast.success('Status transfer berhasil diubah');
            } else {
                toast.error(data.error || 'Gagal mengubah status transfer');
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Gagal mengubah status transfer');
        },
    });
}

export function useCancelTransfer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => cancelTransferAction(id),
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ['transfers'] });
                toast.success('Transfer berhasil dibatalkan');
            } else {
                toast.error(data.error || 'Gagal membatalkan transfer');
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Gagal membatalkan transfer');
        },
    });
}

export function useCreateTransferGR() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => createTransferGRAction(id),
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ['transfers'] });
                toast.success('Goods Receipt (Draft) berhasil dibuat');
            } else {
                toast.error(data.error || 'Gagal membuat Goods Receipt');
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Gagal membuat Goods Receipt');
        },
    });
}

export function useDeletePermanentTransfer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deletePermanentTransferAction(id),
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ['transfers'] });
                toast.success('Transfer berhasil dihapus permanen');
            } else {
                toast.error(data.error || 'Gagal menghapus transfer permanen');
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Gagal menghapus transfer permanen');
        },
    });
}