"use client";
import * as React from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Package,
    User,
    FileText,
    ClipboardList,
    Wallet,
    CheckCircle2,
    Calendar,
    Hash,
    Building,
    CreditCard,
    Image as ImageIcon,
    X,
    Download,
    LucideIcon,
} from "lucide-react";
import { PurchaseRequestWithRelations } from "@/types/pr";
import { makeImageSrc } from "@/utils/makeImageSrc";
import Image from "next/image";

// Enum untuk Source Product Type
enum SourceProductType {
    PEMBELIAN_BARANG = "PEMBELIAN_BARANG", // Barang baru yang dibeli dari vendor
    PENGAMBILAN_STOK = "PENGAMBILAN_STOK", // Barang yang diambil dari gudang
    OPERATIONAL = "OPERATIONAL", // Operasional
    JASA_PEMBELIAN = "JASA_PEMBELIAN", // Jasa eksternal (dari vendor)
    JASA_INTERNAL = "JASA_INTERNAL" // Jasa internal (tanpa biaya tambahan)
}

interface PurchaseRequestDetailSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: PurchaseRequestWithRelations | null;
}

// --- Helper untuk mapping status ke variant Badge ---
const statusVariantMap: Record<string, React.ComponentProps<typeof Badge>["variant"]> = {
    Pending: "secondary",
    Approved: "default",
    Rejected: "destructive",
    Completed: "outline",
};

// --- Helper untuk format mata uang ---
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
};

// --- Helper untuk format tanggal ---
const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};

// --- Helper untuk mendapatkan label source product ---
const getSourceProductLabel = (source: SourceProductType): string => {
    const sourceLabels = {
        [SourceProductType.PEMBELIAN_BARANG]: "Pembelian Barang",
        [SourceProductType.PENGAMBILAN_STOK]: "Pengambilan Stok",
        [SourceProductType.OPERATIONAL]: "Operasional",
        [SourceProductType.JASA_PEMBELIAN]: "Jasa Pembelian",
        [SourceProductType.JASA_INTERNAL]: "Jasa Internal",
    };
    return sourceLabels[source] || source;
};

// --- Komponen Info Item ---
interface InfoItemProps {
    label: string;
    value: string;
    icon?: LucideIcon;
    className?: string;
}

const InfoItem = ({
    label,
    value,
    icon: Icon,
    className = ""
}: InfoItemProps) => (
    <div className={`flex items-center justify-between py-2 ${className}`}>
        <div className="flex items-center gap-2 text-muted-foreground">
            {Icon && <Icon className="h-4 w-4" />}
            <span className="text-sm">{label}</span>
        </div>
        <span className="font-medium text-sm text-right">{value || "-"}</span>
    </div>
);

// --- Komponen Image Gallery ---
interface ImageGalleryProps {
    images: Array<{ id: string; url: string | null }>;
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
    const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

    if (!images || images.length === 0) return null;

    return (
        <>
            <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((foto) =>
                    foto.url ? (
                        <button
                            key={foto.id}
                            onClick={() => setSelectedImage(makeImageSrc(foto.url!))}
                            className="flex-shrink-0 relative group"
                        >
                            <Image
                                src={makeImageSrc(foto.url)}
                                alt={`Bukti pertanggungjawaban`}
                                width={80}
                                height={80}
                                className="h-20 w-20 object-cover rounded-md border hover:border-primary transition-all group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-transparent bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-md" />
                        </button>
                    ) : (
                        <div key={foto.id} className="h-20 w-20 flex flex-col items-center justify-center border rounded-md bg-muted text-xs text-muted-foreground">
                            <ImageIcon className="h-4 w-4 mb-1" />
                            No Image
                        </div>
                    )
                )}
            </div>

            {/* Modal Image Preview */}
            {selectedImage && (
                <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
                    <div className="relative max-w-4xl max-h-full">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <Image
                            src={selectedImage}
                            alt="Preview"
                            width={800}
                            height={600}
                            className="max-w-full max-h-full object-contain rounded-lg"
                        />
                        <div className="absolute bottom-4 right-4">
                            <a
                                href={selectedImage}
                                download
                                className="bg-white text-black px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Download
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export function PurchaseRequestDetailSheet({
    open,
    onOpenChange,
    data,
}: PurchaseRequestDetailSheetProps) {
    if (!data) return null;

    // Perhitungan summary berdasarkan source product
    const calculateSummary = () => {
        let totalBiaya = 0; // Total pengajuan biaya (PEMBELIAN_BARANG, OPERATIONAL, JASA_PEMBELIAN)
        let totalHPP = 0;   // Total biaya tidak diajukan (PENGAMBILAN_STOK, JASA_INTERNAL)

        data.details.forEach((item) => {
            const subtotal = Number(item.estimasiTotalHarga || 0);

            switch (item.sourceProduct) {
                case SourceProductType.PEMBELIAN_BARANG:
                case SourceProductType.OPERATIONAL:
                case SourceProductType.JASA_PEMBELIAN:
                    totalBiaya += subtotal;
                    break;
                case SourceProductType.PENGAMBILAN_STOK:
                case SourceProductType.JASA_INTERNAL:
                    totalHPP += subtotal;
                    break;
                default:
                    // Default ke totalBiaya jika sourceProduct tidak dikenali
                    totalBiaya += subtotal;
            }
        });

        const grandTotal = totalBiaya + totalHPP;

        return {
            totalBiaya,
            totalHPP,
            grandTotal
        };
    };

    const { totalBiaya, totalHPP, grandTotal } = calculateSummary();
    const totalEstimasi = data.details.reduce(
        (sum, item) => sum + Number(item.estimasiTotalHarga || 0),
        0
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-4xl lg:max-w-5xl overflow-y-auto p-0">
                {/* === HEADER === */}
                <div className="sticky top-0 bg-background border-b z-10 p-6 pb-4">
                    <SheetHeader className="flex-row items-start justify-between space-y-0">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <SheetTitle className="text-2xl font-bold">
                                        Purchase Request Detail
                                    </SheetTitle>
                                    <SheetDescription className="text-base">
                                        {data.nomorPr}
                                    </SheetDescription>
                                </div>
                            </div>
                        </div>
                        <Badge
                            variant={statusVariantMap[data.status] || "secondary"}
                            className="text-sm px-3 py-1"
                        >
                            {data.status}
                        </Badge>
                    </SheetHeader>
                </div>

                <div className="p-6 space-y-6">
                    {/* === GRID INFORMASI UTAMA === */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* --- Informasi Umum --- */}
                        <Card className="lg:col-span-2">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <ClipboardList className="h-5 w-5 text-primary" />
                                    Informasi Umum
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <InfoItem
                                    label="Nomor PR"
                                    value={data.nomorPr}
                                    icon={Hash}
                                />
                                <Separator />
                                <InfoItem
                                    label="Tanggal PR"
                                    value={formatDate(data.tanggalPr)}
                                    icon={Calendar}
                                />
                                <Separator />
                                <div className="py-2">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                        <FileText className="h-4 w-4" />
                                        <span className="text-sm">Keterangan</span>
                                    </div>
                                    <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md">
                                        {data.keterangan || "Tidak ada keterangan"}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* --- Project & Karyawan --- */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <User className="h-5 w-5 text-primary" />
                                    Project & Pemohon
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <InfoItem
                                    label="Project"
                                    value={data.project?.name || "-"}
                                    icon={Building}
                                />
                                <Separator />
                                <InfoItem
                                    label="Nomor SPK"
                                    value={data.spk?.spkNumber || "-"}
                                    icon={Hash}
                                />
                                <Separator />
                                <InfoItem
                                    label="Pemohon"
                                    value={data.karyawan?.namaLengkap || "-"}
                                    icon={User}
                                />
                                <Separator />
                                <InfoItem
                                    label="Jabatan"
                                    value={data.karyawan?.jabatan || "-"}
                                    icon={User}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* === DETAIL ITEM === */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Package className="h-5 w-5 text-primary" />
                                Detail Item
                                <Badge variant="outline" className="ml-2">
                                    {data.details.length} items
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[30%]">Produk / Item</TableHead>
                                            <TableHead className="w-[15%]">Source</TableHead>
                                            <TableHead className="text-center w-[10%]">Kuantitas</TableHead>
                                            <TableHead className="text-right w-[15%]">Harga Satuan</TableHead>
                                            <TableHead className="text-right w-[15%]">Subtotal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.details.map((item, index) => (
                                            <TableRow key={item.id} className={index % 2 === 0 ? "bg-muted/30" : ""}>
                                                <TableCell>
                                                    <div className="font-medium">{item.product?.name || "N/A"}</div>
                                                    {item.catatanItem && (
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            {item.catatanItem}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            item.sourceProduct === SourceProductType.PEMBELIAN_BARANG ||
                                                                item.sourceProduct === SourceProductType.OPERATIONAL ||
                                                                item.sourceProduct === SourceProductType.JASA_PEMBELIAN
                                                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                                                : "bg-green-50 text-green-700 border-green-200"
                                                        }
                                                    >
                                                        {getSourceProductLabel(item.sourceProduct as SourceProductType)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center font-medium">
                                                    {`${item.jumlah} ${item.satuan}`}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(item.estimasiHargaSatuan)}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-primary">
                                                    {formatCurrency(item.estimasiTotalHarga)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Summary Section */}
                            <div className="mt-4 border-t pt-3 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="font-medium">💰 Total Pengajuan Biaya :</span>
                                    <span className="font-semibold">
                                        Rp. {formatCurrency(totalBiaya)}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="font-medium">🏭 Total Biaya tidak diajukan :</span>
                                    <span className="font-semibold">
                                        Rp. {formatCurrency(totalHPP)}
                                    </span>
                                </div>

                                <div className="flex justify-between border-t pt-2 text-base">
                                    <span className="font-bold">🧾 Grand Total HPP :</span>
                                    <span className="font-bold">
                                        Rp. {formatCurrency(grandTotal)}
                                    </span>
                                </div>
                            </div>

                            {/* Total Estimasi Legacy (untuk kompatibilitas) */}
                            <div className="mt-4 flex justify-end border-t pt-4">
                                <div className="text-right space-y-1">
                                    <p className="text-sm text-muted-foreground">Total Estimasi</p>
                                    <p className="text-2xl font-bold text-primary">
                                        {formatCurrency(totalEstimasi)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* === UANG MUKA === */}
                    {data.uangMuka && data.uangMuka.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Wallet className="h-5 w-5 text-primary" />
                                    Riwayat Laporan Pengeluaran Perjalanan (LPP)
                                    <Badge variant="outline" className="ml-2">
                                        {data.uangMuka.length} pengajuan
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {data.uangMuka.map((um) => (
                                    <div key={um.id} className="border rounded-lg p-5 space-y-4 bg-gradient-to-r from-muted/30 to-muted/10">
                                        {/* Header Uang Muka */}
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                                    <p className="font-semibold text-lg">{um.nomor}</p>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(um.tanggalPengajuan)}
                                                </div>
                                            </div>
                                            <div className="text-right space-y-2">
                                                <Badge variant={statusVariantMap[um.status] || "secondary"}>
                                                    {um.status}
                                                </Badge>
                                                <p className="text-xl font-bold text-primary">
                                                    {formatCurrency(um.jumlah)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Pertanggungjawaban */}
                                        {um.pertanggungjawaban && um.pertanggungjawaban.length > 0 && (
                                            <div className="space-y-4">
                                                <h4 className="font-semibold flex items-center gap-2 text-foreground border-l-4 border-green-500 pl-3 py-1">
                                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    Pertanggungjawaban
                                                </h4>

                                                {um.pertanggungjawaban.map((pj) => (
                                                    <div key={pj.id} className="border bg-background rounded-lg p-4 space-y-4">
                                                        {/* Header Pertanggungjawaban */}
                                                        <div className="flex justify-between items-start">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                                                    <p className="font-semibold">{pj.nomor}</p>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {formatDate(pj.tanggal)}
                                                                </div>
                                                            </div>
                                                            <Badge variant={statusVariantMap[pj.status] || "secondary"}>
                                                                {pj.status}
                                                            </Badge>
                                                        </div>

                                                        {/* Summary Pertanggungjawaban */}
                                                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 p-3 bg-muted/30 rounded-md">
                                                            <div className="flex flex-row justify-between uppercase font-bold">
                                                                {/* Total Biaya Realisasi */}
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <span className="text-muted-foreground">Total Biaya Realisasi</span>
                                                                    <Badge variant="success" className="font-bold text-lg">
                                                                        {formatCurrency(pj.totalBiaya)}
                                                                    </Badge>
                                                                </div>

                                                                {/* Sisa Uang Dikembalikan */}
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <span className="text-muted-foreground">Sisa Uang Dikembalikan</span>
                                                                    <Badge variant="destructive" className="font-bold text-lg">
                                                                        {formatCurrency(pj.sisaUangDikembalikan)}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Rincian Biaya */}
                                                        {pj.details && pj.details.length > 0 && (
                                                            <div>
                                                                <p className="font-medium mb-3 text-sm text-muted-foreground">
                                                                    RINCIAN BIAYA:
                                                                </p>
                                                                <div className="space-y-3">
                                                                    {pj.details.map((detail) => (
                                                                        <div key={detail.id} className="border rounded-md p-3">
                                                                            <div className="flex justify-between items-start mb-2">
                                                                                <div className="space-y-1 flex-1">
                                                                                    <p className="font-medium">{detail.product?.name}</p>

                                                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                                        <span className="flex items-center gap-1">
                                                                                            <Calendar className="h-3 w-3" />
                                                                                            {formatDate(detail.tanggalTransaksi)}
                                                                                        </span>
                                                                                        <span className="flex items-center gap-1">
                                                                                            <CreditCard className="h-3 w-3" />
                                                                                            {detail.jenisPembayaran}
                                                                                        </span>
                                                                                        <p className="font-medium">Keterangan : {detail.keterangan}</p>
                                                                                    </div>
                                                                                </div>
                                                                                <p className="font-semibold text-lg">
                                                                                    {formatCurrency(detail.jumlah)}
                                                                                </p>
                                                                            </div>

                                                                            {/* Foto Bukti */}
                                                                            {detail.fotoBukti && detail.fotoBukti.length > 0 && (
                                                                                <div className="mt-3 pt-3 border-t">
                                                                                    <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                                                                        <ImageIcon className="h-4 w-4" />
                                                                                        Bukti Dokumentasi
                                                                                    </p>
                                                                                    <ImageGallery images={detail.fotoBukti} />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* === FOOTER === */}
                <div className="sticky bottom-0 bg-background border-t p-4">
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="min-w-24"
                        >
                            Tutup
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}