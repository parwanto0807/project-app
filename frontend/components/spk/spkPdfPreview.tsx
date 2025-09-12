import { PDFViewer, pdf } from "@react-pdf/renderer";
import { Button } from "../ui/button";
import { SPKPDF, SPKPDFProps } from "./SPKPdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Download, Printer, X } from "lucide-react";

export interface SpkFormData {
  id: string;
  spkNumber: string;
  spkDate: Date | string;
  salesOrderId: string;
  teamId: string;
  createdById: string;
  createdBy: {
    id: string;
    nama: string;
    jabatan?: string | null;
    nik?: string;
  };
  salesOrder: {
    id: string;
    soNumber: string;
    customerName: string;
    projectName: string;
    project: {
      id: string;
      name: string;
    };
  };
  team?: {
    id: string;
    namaTeam: string;
  } | null;
  details: {
    id: string;
    karyawan?: {
      id: string;
      nama: string;
    };
    salesOrderItem?: {
      id: string;
      name: string;
      description?: string;
      qty: number;
      uom: string;
    };
    lokasiUnit?: string | null;
  }[];
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SPKPdfPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: SpkFormData;
  // onDownload prop dihapus karena tidak digunakan
}

const SPKPdfPreview: React.FC<SPKPdfPreviewProps> = ({
  open,
  onOpenChange,
  data,
  // onDownload dihapus dari parameter
}) => {
  const pdfData = mapToFormDataSpk(data);

  const handlePrint = async () => {
    try {
      const blob = await pdf(<SPKPDF data={pdfData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error("Error printing PDF:", error);
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await pdf(<SPKPDF data={pdfData} />).toBlob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `SPK_${data.spkNumber || new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Preview SPK - {data.spkNumber}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <PDFViewer width="100%" height="100%" className="border rounded-md">
            <SPKPDF data={pdfData} />
          </PDFViewer>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Tutup
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Fungsi mapping yang konsisten dengan tipe SPKPDFProps
export function mapToFormDataSpk(formData: SpkFormData): SPKPDFProps["data"] {
  return {
    spkNumber: formData.spkNumber || "",
    spkDate: formData.spkDate instanceof Date ? formData.spkDate : new Date(formData.spkDate),
    createdBy: formData.createdBy
      ? {
          id: formData.createdBy.id || "",
          nama: formData.createdBy.nama || "",
          jabatan: formData.createdBy.jabatan || undefined,
          nik: formData.createdBy.nik || undefined,
        }
      : {
          id: "",
          nama: "Unknown",
          jabatan: undefined,
          nik: undefined,
        },
    salesOrder: formData.salesOrder
      ? {
          id: formData.salesOrder.id || "",
          soNumber: formData.salesOrder.soNumber || "",
          customerName: formData.salesOrder.customerName || "",
          projectName: formData.salesOrder.projectName || "",
          project: formData.salesOrder.project
            ? {
                id: formData.salesOrder.project.id || "",
                name: formData.salesOrder.project.name || "",
              }
            : undefined,
        }
      : {
          id: "",
          soNumber: "",
          customerName: "",
          projectName: "",
          project: undefined,
        },
    team: formData.team
      ? {
          id: formData.team.id || "",
          namaTeam: formData.team.namaTeam || "",
        }
      : undefined,
    details:
      formData.details?.map((detail) => ({
        id: detail.id || "",
        karyawan: detail.karyawan
          ? {
              id: detail.karyawan.id || "",
              nama: detail.karyawan.nama || "",
            }
          : undefined,
        salesOrderItem: detail.salesOrderItem
          ? {
              id: detail.salesOrderItem.id || "",
              name: detail.salesOrderItem.name || "",
              description: detail.salesOrderItem.description || undefined,
              qty: detail.salesOrderItem.qty || 0,
              uom: detail.salesOrderItem.uom || "",
            }
          : undefined,
        lokasiUnit: detail.lokasiUnit || undefined,
      })) || [],
    notes: formData.notes || undefined,
  };
}

export default SPKPdfPreview;