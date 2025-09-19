"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, ZoomIn } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ReportHistory } from "@/types/spkReport";

export default function ReportPhotos({ selectedReport }: { selectedReport: ReportHistory }) {
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    const getPhotoUrl = (path: string) => {
        if (path.startsWith("http")) return path;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const normalizedPath = path.startsWith("/") ? path : `/${path}`;
        return `${baseUrl}${normalizedPath}`;
    };

    return (
        <>
            {selectedReport.photos.length > 0 && (
                <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Camera className="h-4 w-4 text-emerald-500" />
                            Foto Bukti ({selectedReport.photos.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {selectedReport.photos.map((photo: string, idx: number) => {
                                const photoUrl = getPhotoUrl(photo);

                                return (
                                    <Dialog key={idx}>
                                        <DialogTrigger asChild>
                                            <div
                                                className="group relative aspect-square rounded-xl overflow-hidden border border-border/40 bg-muted/30 hover:scale-105 transition-all duration-300 cursor-pointer"
                                                onClick={() => setSelectedPhoto(photoUrl)}
                                            >
                                                <Image
                                                    src={photoUrl}
                                                    alt={`bukti-${idx + 1}`}
                                                    fill
                                                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                                                    sizes="(max-width: 768px) 50vw, 25vw"
                                                    onError={(e) => {
                                                        e.currentTarget.src = "/images/placeholder-image.svg";
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <ZoomIn className="h-6 w-6 text-white drop-shadow" />
                                                </div>
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-3xl p-0">
                                            {selectedPhoto && (
                                                <div className="relative w-full h-[80vh]">
                                                    <Image
                                                        src={selectedPhoto}
                                                        alt="Preview"
                                                        fill
                                                        className="object-contain"
                                                    />
                                                </div>
                                            )}
                                        </DialogContent>
                                    </Dialog>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </>
    );
}
