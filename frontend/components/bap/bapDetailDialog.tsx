// components/bap/BAPDetailDrawer.tsx
"use client";

import { BAPData } from "./tableData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FileText, X } from "lucide-react";
import { getImageUrl } from "@/lib/getImageUrl";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

interface BAPDetailDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bap: BAPData | null;
}

interface BAPPhoto {
    id?: string;
    photoUrl: string;
    category: "BEFORE" | "PROCESS" | "AFTER";
    caption?: string;
}

export function BAPDetailDrawer({ open, onOpenChange, bap }: BAPDetailDrawerProps) {
    if (!bap) return null;

    const statusVariantMap: Record<string, "default" | "destructive" | "outline" | "secondary" | "success"> = {
        APPROVED: "success",
        COMPLETED: "default",
        IN_PROGRESS: "secondary",
        DRAFT: "outline",
    };

    const variant = statusVariantMap[bap.status] || "outline";

    return (
        <Drawer open={open} onOpenChange={onOpenChange} direction="right">
            <DrawerContent className="h-full w-full sm:w-[800px] ml-auto" aria-describedby={undefined}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <DrawerHeader className="flex-shrink-0 border-b p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="h-6 w-6 text-cyan-600" />
                                <DrawerTitle className="text-sm font-bold">
                                    BAP: {bap.bapNumber}
                                </DrawerTitle>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onOpenChange(false)}
                                className="h-8 w-8"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-4 mt-0 text-sm text-muted-foreground">
                            <span>{format(new Date(bap.bapDate), "dd MMMM yyyy")}</span>
                            <Badge variant={variant} className="capitalize text-xs">
                                {bap.status.toLowerCase().replace("_", " ")}
                            </Badge>
                        </div>
                    </DrawerHeader>

                    {/* Content */}
                    <ScrollArea className="flex-1 p-4 sm:px-6 overflow-y-auto">
                        <div className="space-y-2">
                            {/* Informasi Utama */}
                            <Section title="Informasi Utama">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InfoField label="Dibuat Oleh" value={bap.createdBy.name} />
                                    <InfoField label="Menyetujui" value={bap.user.namaLengkap} />
                                    <InfoField label="Nomor SO" value={bap.salesOrder.soNumber} />
                                </div>
                            </Section>

                            <Separator />

                            {/* Informasi Pelanggan */}
                            <Section title="Informasi Pelanggan">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InfoField label="Nama Pelanggan" value={bap.salesOrder.customer.name} />
                                    <InfoField label="Cabang" value={bap.salesOrder.customer.branch} />
                                    <InfoField label="Kontak" value={bap.salesOrder.customer.contactPerson} />
                                    <InfoField label="Alamat" value={bap.salesOrder.customer.address} span="full" />
                                </div>
                            </Section>

                            <Separator />

                            {/* Detail Pekerjaan */}
                            <Section title="Detail Pekerjaan">
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Lokasi</label>
                                        <p className="text-sm mt-1 p-3 bg-muted/20 rounded-lg">
                                            {bap.location || "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Deskripsi Pekerjaan</label>
                                        <p className="text-sm mt-1 p-3 bg-muted/20 rounded-lg whitespace-pre-wrap">
                                            {bap.workDescription || "-"}
                                        </p>
                                    </div>
                                </div>
                            </Section>

                            {/* Catatan */}
                            {bap.notes && (
                                <>
                                    <Separator />
                                    <Section title="Catatan Tambahan">
                                        <div className="p-3 bg-muted/20 rounded-lg">
                                            <p className="text-sm">{bap.notes}</p>
                                        </div>
                                    </Section>
                                </>
                            )}

                            {/* Foto Dokumentasi */}
                            {bap.photos && bap.photos.length > 0 && (
                                <>
                                    <Separator />
                                    <Section title={`Dokumentasi Foto (${bap.photos.length})`}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {bap.photos.map((photo, idx) => {
                                                const imageUrl = getImageUrl(photo.photoUrl);
                                                return <PhotoCard key={photo.id || idx} photo={photo} imageUrl={imageUrl} />;
                                            })}
                                        </div>
                                    </Section>
                                </>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Footer */}
                    <div className="flex-shrink-0 border-t p-4">
                        <Button
                            onClick={() => onOpenChange(false)}
                            className="w-full"
                            size="sm"
                        >
                            Tutup
                        </Button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

// Komponen Section
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
        <h3 className="text-base font-semibold mb-3 text-foreground">{title}</h3>
        {children}
    </div>
);

// Komponen InfoField
const InfoField = ({ label, value, span = "default" }: { label: string; value: string; span?: "default" | "full" }) => (
    <div className={cn("space-y-1", span === "full" && "sm:col-span-2")}>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <p className="text-sm font-medium">{value}</p>
    </div>
);

// Komponen PhotoCard
const PhotoCard = ({ photo, imageUrl }: { photo: BAPPhoto; imageUrl: string }) => {
    const categoryLabel = photo.category === "BEFORE" ? "Sebelum" : photo.category === "PROCESS" ? "Proses" : "Setelah";

    return (
        <div className="border rounded-lg overflow-hidden bg-card flex flex-col">
            {/* Header kategori */}
            <div className="bg-muted/50 p-2 text-center">
                <span className="text-xs font-medium flex items-center justify-center gap-1">
                    <span
                        className={cn(
                            "w-2 h-2 rounded-full",
                            photo.category === "BEFORE" && "bg-blue-500",
                            photo.category === "PROCESS" && "bg-yellow-500",
                            photo.category === "AFTER" && "bg-green-500"
                        )}
                    />
                    {categoryLabel}
                    {photo.caption && `: ${photo.caption}`}
                </span>
            </div>
            <div className="aspect-video relative bg-white">
                <Image
                    src={imageUrl}
                    alt={`Foto ${photo.category}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                    onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/images/placeholder.png";
                    }}
                />
            </div>
        </div>
    );
};