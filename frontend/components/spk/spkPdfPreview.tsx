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

// ====== TIPE INPUT FORM (SUDAH LENGKAP DAN BENAR) ======
export interface SpkFormData {
  id: string;
  spkNumber: string;
  spkDate: Date;
  salesOrderId: string;
  teamId: string;
  createdById: string;

  createdBy: {
    id: string;
    namaLengkap: string;
    jabatan?: string | null;
    nik?: string | null;
    departemen?: string | null;
  };

  salesOrder: {
    id: string;
    soNumber: string;
    projectName: string;
    customer: {
      name: string;
      address: string;
      branch: string;
    }
    project?: {
      id: string;
      name: string;
    };
    items: {
      id: string;
      lineNo: number;
      itemType: string;
      name: string;
      description?: string | null;
      qty: number;
      uom?: string | null;
      unitPrice: number;
      discount: number;
      taxRate: number;
      lineTotal: number;
    }[];
  };

  team?: {
    id: string;
    namaTeam: string;
    teamKaryawan?: {
      teamId: string;
      karyawan?: {
        id: string;
        namaLengkap: string;
        jabatan: string;
        departemen: string;
      };
    };
  } | null;

  details: {
    id: string;
    karyawan?: {
      id: string;
      namaLengkap: string;
      jabatan: string;
      departemen: string;
      nik: string;
    };
    salesOrderItemSPK?: {
      id: string;
      name: string;
      description?: string;
      qty: number;
      uom?: string | null;
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
}

const SPKPdfPreview: React.FC<SPKPdfPreviewProps> = ({
  open,
  onOpenChange,
  data,
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

// ====== MAPPING FUNGSI — SUDAH SESUAI DENGAN SpkFormData ======
export function mapToFormDataSpk(formData: SpkFormData): SPKPDFProps["data"] {
  return {
    spkNumber: formData.spkNumber || "",
    spkDate:
      formData.spkDate instanceof Date
        ? formData.spkDate
        : new Date(formData.spkDate),

    createdBy: {
      id: formData.createdBy?.id || "",
      namaLengkap: formData.createdBy?.namaLengkap || "",
      jabatan: formData.createdBy?.jabatan ?? null,
      nik: formData.createdBy?.nik ?? null,
      departemen: formData.createdBy?.departemen ?? null,
    },

    salesOrder: formData.salesOrder
      ? {
        id: formData.salesOrder.id || "",
        soNumber: formData.salesOrder.soNumber || "",
        projectName: formData.salesOrder.projectName || "",
        customer: {
          name: formData.salesOrder.customer.name,
          address: formData.salesOrder.customer.address,
          branch: formData.salesOrder.customer.branch,
        },
        project: formData.salesOrder.project
          ? {
            id: formData.salesOrder.project.id || "",
            name: formData.salesOrder.project.name || "",
          }
          : undefined,
        items:
          formData.salesOrder.items?.map((item) => ({
            id: item.id || "",
            lineNo: item.lineNo,
            itemType: item.itemType,
            name: item.name || "",
            description: item.description ?? null,
            qty: item.qty,
            uom: item.uom ?? null,
            unitPrice: item.unitPrice,
            discount: item.discount,
            taxRate: item.taxRate,
            lineTotal: item.lineTotal,
          })) || [],
      }
      : {
        id: "",
        soNumber: "",
        customer: { name: "", branch: "", address: "" },
        projectName: "",
        project: undefined,
        items: [],
      },

    team: formData.team
      ? {
        id: formData.team.id || "",
        namaTeam: formData.team.namaTeam || "",
        teamKaryawan: formData.team.teamKaryawan
          ? {
            teamId: formData.team.teamKaryawan.teamId || "",
            karyawan: formData.team.teamKaryawan.karyawan
              ? {
                id: formData.team.teamKaryawan.karyawan.id || "",
                namaLengkap:
                  formData.team.teamKaryawan.karyawan.namaLengkap || "",
                jabatan:
                  formData.team.teamKaryawan.karyawan.jabatan || "",
                departemen:
                  formData.team.teamKaryawan.karyawan.departemen || "",
              }
              : undefined,
          }
          : undefined,
      }
      : undefined,

    details:
      formData.details?.map((detail) => ({
        id: detail.id || "",
        karyawan: detail.karyawan
          ? {
            id: detail.karyawan?.id ?? "",
            namaLengkap: detail.karyawan?.namaLengkap ?? "",
            jabatan: detail.karyawan?.jabatan ?? "",
            nik: detail.karyawan?.nik ?? "",
            departemen: detail.karyawan?.departemen ?? "",
          }
          : undefined,
        salesOrderItemSPK: detail.salesOrderItemSPK
          ? {
            id: detail.salesOrderItemSPK.id,
            name: detail.salesOrderItemSPK.name,
            description: detail.salesOrderItemSPK.description ?? null,
            qty: detail.salesOrderItemSPK.qty,
            uom: detail.salesOrderItemSPK.uom ?? null,
          }
          : undefined,
        lokasiUnit: detail.lokasiUnit ?? null,
      })) || [],


    notes: formData.notes ?? null,
  };
}


export default SPKPdfPreview;