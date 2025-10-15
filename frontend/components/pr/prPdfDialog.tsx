// components/SimplePurchaseRequestPdfDialog.tsx
"use client";

import React from "react";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PurchaseRequestPdfPreview from "./previewPdf";
import { PurchaseRequest } from "@/types/pr";

interface SimplePurchaseRequestPdfDialogProps {
  purchaseRequest: PurchaseRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewDetail?: (purchaseRequest: PurchaseRequest) => void;
}

const SimplePurchaseRequestPdfDialog: React.FC<
  SimplePurchaseRequestPdfDialogProps
> = ({ purchaseRequest, open, onOpenChange }) => {
  if (!purchaseRequest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[90vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle className="text-center">
            Preview Purchase Request PDF
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 text-center">
            Preview dokumen Purchase Request. Pastikan semua data terlihat dengan
            benar sebelum dicetak.
          </DialogDescription>
        </DialogHeader>

        {/* PDF Viewer */}
        <div className="flex-1 h-[75vh]">
          <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
            <PurchaseRequestPdfPreview data={purchaseRequest} />
          </PDFViewer>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 px-4 pb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Tutup
          </Button>

          {/* Unduh PDF */}
          <PDFDownloadLink
            document={<PurchaseRequestPdfPreview data={purchaseRequest} />}
            fileName={`purchase-request-${purchaseRequest.id}.pdf`}
          >
            {({ loading }) => (
              <Button size="sm" variant="default" disabled={loading}>
                {loading ? "Menyiapkan..." : "Unduh PDF"}
              </Button>
            )}
          </PDFDownloadLink>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimplePurchaseRequestPdfDialog;
