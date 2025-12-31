"use client";

import { useEffect, useState } from "react";
import {
    X, Camera, Plus, Send, Box, Receipt
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ReceiptFile {
    id?: string; // ID for existing receipts
    file?: File; // For NEW receipts
    preview?: string;
    receiptNumber: string;
    storeName: string;
    receiptDate: string;
    totalAmount: number;
    paymentMethod: 'CASH' | 'TRANSFER' | 'CREDIT_CARD';
    notes?: string;

    // Material Photos
    materialPhotos: File[];
    materialPreviews: string[];

    // Existing Data Display
    existingReceiptPhotoUrl?: string; // URL from backend
    existingMaterialPhotos?: string[]; // URLs from backend (We might not support per-receipt existing material deletion easily yet in this UI, but let's try)
}

interface EditPurchaseExecutionFormProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: any; // The full execution object from backend
    onSuccess: () => void;
    poLineId: string; // Needed for context if creating new receipts
}

export default function EditPurchaseExecutionForm({ isOpen, onClose, initialData, onSuccess, poLineId }: EditPurchaseExecutionFormProps) {
    const [reportNotes, setReportNotes] = useState('');
    const [receipts, setReceipts] = useState<ReceiptFile[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([]); // Track deleted receipt/material photos

    // Initialize Form Data
    useEffect(() => {
        if (isOpen && initialData) {
            setReportNotes(initialData.notes || '');

            // Map existing receipts
            // Check if backend structure matches what we expect (from getPOExecutionDetail)
            // initialData should be the 'execution' object

            if (initialData.receipts) {
                const mappedReceipts = initialData.receipts.map((r: any) => ({
                    id: r.id,
                    receiptNumber: r.receiptNumber || '',
                    storeName: r.storeName || '',
                    receiptDate: r.receiptDate ? new Date(r.receiptDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    totalAmount: Number(r.totalAmount),
                    paymentMethod: r.paymentMethod,
                    notes: '', // Notes are on execution level mostly, but if receipt has notes? Schema doesn't have receipt notes in Detail view usually

                    // Existing Photos
                    existingReceiptPhotoUrl: r.receiptPhotoUrl,
                    // Existing Material Photos?
                    // The backend sends `materialPhotos` as a flat array in `execution.materialPhotos`.
                    // But `getPOExecutionDetail` also can fetch `receiptItems` -> `receipt` -> `photos`.
                    // To simplify: We will show existing material photos in a read-only list or global list if per-receipt mapping is lost.
                    // However, our new backend stores them linked to receipt items.
                    // Let's assume for Edit, we just start with empty NEW photos. 
                    // Handling editing of existing material photos (delete specific one) requires knowing their IDs. 
                    // The current `getPOExecutionDetail` returns `materialPhotos` as URLs array. 
                    // This limits our ability to delete specific generic material photos unless we fetch IDs. 

                    // Workaround: For now, only allow ADDING new photos and Edit Texts. 
                    // Deleting existing photos: Not implemented fully in UI due to data fetching limitation (need photo IDs).
                    // If we want to implement delete, we need photo IDs.

                    materialPhotos: [],
                    materialPreviews: []
                }));
                setReceipts(mappedReceipts);
            }
        }
    }, [isOpen, initialData]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'nota' | 'material') => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);

            if (type === 'nota') {
                const newReceipts: ReceiptFile[] = newFiles.map(file => ({
                    file,
                    preview: URL.createObjectURL(file), // For new files
                    receiptNumber: '',
                    storeName: '',
                    receiptDate: new Date().toISOString().split('T')[0],
                    totalAmount: 0,
                    paymentMethod: 'CASH',
                    notes: '',
                    materialPhotos: [],
                    materialPreviews: []
                }));
                setReceipts(prev => [...prev, ...newReceipts]);
            }
        }
    };

    const handleMaterialFileChange = (e: React.ChangeEvent<HTMLInputElement>, receiptIndex: number) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));

            setReceipts(prev => prev.map((receipt, idx) => {
                if (idx === receiptIndex) {
                    return {
                        ...receipt,
                        materialPhotos: [...receipt.materialPhotos, ...newFiles],
                        materialPreviews: [...receipt.materialPreviews, ...newPreviews]
                    };
                }
                return receipt;
            }));
        }
    };

    const removeFile = (index: number, type: 'nota' | 'material', materialIndex?: number) => {
        if (type === 'nota') {
            setReceipts(prev => {
                const receipt = prev[index];
                if (receipt.preview) URL.revokeObjectURL(receipt.preview);

                // If it's an existing receipt (has ID), we might want to "mark as deleted" sent to backend?
                // But generally users might just want to remove the entry from the list.
                // Our backend logic: `receiptsToDelete = currentReceiptIds - incomingReceiptIds`.
                // So simply removing from state is enough to trigger deletion on backend!

                return prev.filter((_, i) => i !== index);
            });
        } else if (type === 'material' && typeof materialIndex === 'number') {
            setReceipts(prev => prev.map((receipt, idx) => {
                if (idx === index) {
                    const newMaterialPhotos = [...receipt.materialPhotos];
                    const newMaterialPreviews = [...receipt.materialPreviews];

                    URL.revokeObjectURL(newMaterialPreviews[materialIndex]);

                    newMaterialPhotos.splice(materialIndex, 1);
                    newMaterialPreviews.splice(materialIndex, 1);

                    return {
                        ...receipt,
                        materialPhotos: newMaterialPhotos,
                        materialPreviews: newMaterialPreviews
                    };
                }
                return receipt;
            }));
        }
    };

    const updateReceipt = (index: number, field: keyof ReceiptFile, value: any) => {
        setReceipts(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ));
    };

    // Function to get image URL (helper)
    const getImageUrl = (url?: string) => {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('blob:')) return url;
        return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
    };

    const handleSubmit = async () => {
        if (receipts.length === 0) {
            toast.error('Minimal harus ada 1 nota/kwitansi');
            return;
        }

        const invalidReceipt = receipts.find(r => !r.totalAmount || r.totalAmount <= 0);
        if (invalidReceipt) {
            toast.error('Semua nota harus memiliki total biaya yang valid');
            return;
        }

        try {
            setIsSubmitting(true);
            const formData = new FormData();
            formData.append('notes', reportNotes);
            formData.append('poLineId', poLineId); // Add this line
            if (deletedPhotoIds.length > 0) {
                formData.append('deletedPhotoIds', JSON.stringify(deletedPhotoIds));
            }

            // Prepare receipts JSON
            const receiptsData = receipts.map((r, i) => ({
                id: r.id, // Include ID if existing
                receiptNumber: r.receiptNumber,
                storeName: r.storeName,
                receiptDate: r.receiptDate,
                totalAmount: r.totalAmount,
                paymentMethod: r.paymentMethod,
                index: i // To map files
            }));
            formData.append('receipts', JSON.stringify(receiptsData));

            // Append Files
            receipts.forEach((receipt, index) => {
                // New Receipt Photos (if added via "Add Receipt" which is effectively new receipt)
                if (receipt.file) {
                    formData.append('newReceiptPhotos', receipt.file);
                    // Map this photo to the current receipt index
                    formData.append('receipt_photo_map', index.toString());
                }


                // Material Photos
                receipt.materialPhotos.forEach(file => {
                    formData.append('newMaterialPhotos', file);
                    formData.append('material_photo_map', index.toString());
                });
            });

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/po/execution/${initialData.id}`, {
                method: 'PUT',
                credentials: 'include',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Laporan berhasil diperbarui');
                onSuccess();
                onClose();
            } else {
                toast.error(data.error || 'Gagal memperbarui laporan');
            }
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Terjadi kesalahan');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="bg-amber-500 p-4 flex justify-between items-center text-white shrink-0">
                            <h2 className="font-bold text-lg flex items-center gap-2">
                                <Receipt className="w-5 h-5" />
                                Edit Laporan Pembelian
                            </h2>
                            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 overflow-y-auto flex-1 space-y-6">
                            {/* Receipts List */}
                            <div className="space-y-4">
                                {receipts.map((receipt, idx) => (
                                    <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4">
                                        {/* Image Preview (Existing or New) */}
                                        <div className="relative w-full md:w-32 aspect-square shrink-0 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                                            {receipt.preview ? (
                                                <>
                                                    <img src={receipt.preview} className="w-full h-full object-cover" />
                                                    <div className="absolute bottom-0 inset-x-0 bg-green-500 text-white text-[10px] text-center font-bold">NEW</div>
                                                </>
                                            ) : receipt.existingReceiptPhotoUrl ? (
                                                <img src={getImageUrl(receipt.existingReceiptPhotoUrl)} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">No Image</div>
                                            )}
                                        </div>

                                        {/* Form Fields - Compact */}
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <input
                                                value={receipt.receiptNumber} onChange={(e) => updateReceipt(idx, 'receiptNumber', e.target.value)}
                                                placeholder="No. Nota" className="input-field px-3 py-2 rounded-lg border text-xs"
                                            />
                                            <input
                                                value={receipt.storeName} onChange={(e) => updateReceipt(idx, 'storeName', e.target.value)}
                                                placeholder="Nama Toko" className="input-field px-3 py-2 rounded-lg border text-xs"
                                            />
                                            <input
                                                type="date" value={receipt.receiptDate} onChange={(e) => updateReceipt(idx, 'receiptDate', e.target.value)}
                                                className="input-field px-3 py-2 rounded-lg border text-xs"
                                            />
                                            <select
                                                value={receipt.paymentMethod} onChange={(e) => updateReceipt(idx, 'paymentMethod', e.target.value)}
                                                className="input-field px-3 py-2 rounded-lg border text-xs"
                                            >
                                                <option value="CASH">Tunai (Cash)</option>
                                                <option value="TRANSFER">Transfer</option>
                                            </select>

                                            <div className="sm:col-span-2">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase">Total Biaya</label>
                                                <input
                                                    type="number" value={receipt.totalAmount} onChange={(e) => updateReceipt(idx, 'totalAmount', Number(e.target.value))}
                                                    className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 font-bold text-sm"
                                                />
                                            </div>

                                            {/* Material Photos - Add Only */}
                                            <div className="sm:col-span-2 pt-2 border-t border-dashed mt-1">
                                                <div className="flex flex-wrap gap-2">
                                                    {/* New Previews */}
                                                    {receipt.materialPreviews.map((p, i) => (
                                                        <div key={i} className="w-12 h-12 rounded overflow-hidden border relative">
                                                            <img src={p} className="w-full h-full object-cover" />
                                                            <button onClick={() => removeFile(idx, 'material', i)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl">
                                                                <X className="w-2 h-2" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <label className="w-12 h-12 border-2 border-dashed border-blue-400 rounded flex items-center justify-center cursor-pointer hover:bg-blue-50">
                                                        <Plus className="w-4 h-4 text-blue-500" />
                                                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleMaterialFileChange(e, idx)} />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Remove Receipt Button */}
                                        <button onClick={() => removeFile(idx, 'nota')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg h-fit">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}

                                {/* Add Receipt (For now text only or reuse logic if backend supported) */}
                                {/* Simplified: For edit mode, we discourage adding completely new receipts without photos, 
                                    and focusing on editing existing. But user can upload new receipt via main form?
                                    Let's keep it simple: "Tambah Nota" allows adding new local receipt state with FILE upload.
                                */}
                                <label className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 text-gray-500 font-bold text-xs uppercase">
                                    <Plus className="w-4 h-4" /> Tambah Nota Baru
                                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileChange(e, 'nota')} />
                                </label>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="font-bold text-xs text-gray-500 uppercase">Catatan</label>
                                <textarea
                                    value={reportNotes} onChange={(e) => setReportNotes(e.target.value)}
                                    className="w-full p-3 rounded-lg border bg-gray-50 h-24 text-sm mt-1"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t bg-gray-50 dark:bg-gray-800 flex justify-end gap-3 shrink-0">
                            <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200">Batal</button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-6 py-2.5 rounded-xl font-bold bg-amber-500 text-white hover:bg-amber-600 flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Menyimpan...' : <><Send className="w-4 h-4" /> Simpan Perubahan</>}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
