"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Printer,
    Download,
    ArrowLeft,
    FileText,
    Calendar,
    User,
    Building,
} from "lucide-react";
import { PageLoading } from "@/components/ui/loading";
import axios from "axios";
import { format } from "date-fns";

import { PDFDownloadLink } from "@react-pdf/renderer";
import DocumentPdfPreview from "./DocumentPdfPreview";
import { useSearchParams } from "next/navigation";

export default function DocumentView({ id }: { id: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const employeeName = searchParams.get("employeeName");
    const autoDownload = searchParams.get("autoDownload") === "true";
    const [docData, setDocData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/master/documents/${id}`,
                    { withCredentials: true }
                );
                setDocData(response.data);
            } catch (error) {
                console.error("Gagal mengambil data dokumen:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDocument();
    }, [id]);

    useEffect(() => {
        if (!isLoading && docData && autoDownload) {
            // Find the hidden download link and click it after a short delay
            // to allow @react-pdf/renderer to initialize
            setTimeout(() => {
                const downloadBtn = window.document.querySelector('[data-auto-download="true"]') as HTMLElement;
                if (downloadBtn) {
                    downloadBtn.click();
                }
            }, 1000);
        }
    }, [isLoading, docData, autoDownload]);

    if (isLoading) return <PageLoading />;
    if (!docData) return <div className="p-8 text-center">Dokumen tidak ditemukan</div>;

    const fileName = `${docData.title.replace(/\s+/g, "_")}_V${docData.version}.pdf`;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between no-print">
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft size={16} /> Kembali
                </Button>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => window.print()}
                        className="flex items-center gap-2"
                    >
                        <Printer size={16} /> Print
                    </Button>
                    <PDFDownloadLink
                        document={<DocumentPdfPreview data={docData} employeeName={employeeName} />}
                        fileName={fileName}
                    >
                        {({ loading }) => (
                            <Button
                                className="flex items-center gap-2"
                                variant="outline"
                                disabled={loading}
                                data-auto-download={autoDownload ? "true" : "false"}
                            >
                                <Download size={16} /> {loading ? "Menyiapkan..." : "Ekspor PDF"}
                            </Button>
                        )}
                    </PDFDownloadLink>
                </div>
            </div>

            <Card className="shadow-lg border-2 print:shadow-none print:border-none">
                <CardHeader className="border-b pb-8 bg-gray-50/50 print:bg-white">
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                            <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20">
                                {docData.type === "JOB_DESCRIPTION" ? "DESKRIPSI JABATAN" : "PROSEDUR OPERASI STANDAR"}
                            </Badge>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{docData.title}</h1>
                        </div>
                        <div className="text-right space-y-1">
                            <div className="text-sm font-semibold text-gray-500 uppercase">NO FORM DOKUMENT</div>
                            <div className="text-xl font-bold">{docData.version}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 text-sm">
                        <div className="flex flex-col items-center gap-2 text-gray-600 text-center">
                            <Building size={16} className="text-primary" />
                            <div className="flex flex-col items-center gap-1">
                                <span className="font-semibold">Departemen:</span>
                                <div className="flex flex-wrap justify-center gap-1">
                                    {docData.departments.map((d: any) => (
                                        <span key={d.department.code} className="bg-gray-100 px-2 py-0.5 rounded">{d.department.name}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-2 text-gray-600 text-center">
                            <User size={16} className="text-primary" />
                            <div className="flex flex-col items-center gap-1">
                                <span className="font-semibold">Karyawan:</span>
                                <div className="flex flex-wrap justify-center gap-1">
                                    {employeeName ? (
                                        <span className="bg-gray-100 px-2 py-0.5 rounded">{employeeName}</span>
                                    ) : docData.employees && docData.employees.length > 0 ? (
                                        docData.employees.map((e: any) => (
                                            <span key={e.karyawan.id} className="bg-gray-100 px-2 py-0.5 rounded">{e.karyawan.namaLengkap}</span>
                                        ))
                                    ) : (
                                        <span className="text-gray-400 italic text-xs">Semua Karyawan</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-2 text-gray-600 text-center">
                            <Calendar size={16} className="text-primary" />
                            <div className="flex flex-col items-center gap-1">
                                <span className="font-semibold">Dibuat:</span>
                                <span>{format(new Date(docData.createdAt), "dd MMMM yyyy")}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-2 text-gray-600 text-center">
                            <FileText size={16} className="text-primary" />
                            <div className="flex flex-col items-center gap-1">
                                <span className="font-semibold">Penulis:</span>
                                <span>System Admin</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="py-10 px-8 md:px-12 space-y-10">
                    {docData.content && (
                        <div className="prose max-w-none">
                            <p className="text-gray-700 italic border-l-4 border-primary/30 pl-4 py-2">
                                {docData.content}
                            </p>
                        </div>
                    )}

                    <div className="space-y-12">
                        {docData.sections.map((section: any, idx: number) => (
                            <div key={section.id} className="space-y-4">
                                <h2 className="text-xl font-bold border-b-2 border-primary/10 pb-2 flex items-center gap-3">
                                    <span className="bg-primary text-white w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold">
                                        {idx + 1}
                                    </span>
                                    {section.title}
                                </h2>

                                {section.content && (
                                    <p className="text-gray-700 whitespace-pre-wrap">{section.content}</p>
                                )}

                                <div className="space-y-3 pl-10">
                                    {section.items.map((item: any) => (
                                        <div key={item.id} className="flex gap-4">
                                            <span className="font-bold text-primary shrink-0 min-w-[1.5rem]">{item.itemNumber}</span>
                                            <p className="text-gray-800 leading-relaxed">{item.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 pt-8 border-t grid grid-cols-2 gap-8 text-center text-sm">
                        <div className="space-y-16">
                            <p className="font-semibold">Dibuat Oleh,</p>
                            <div className="border-b w-48 mx-auto"></div>
                            <p>Human Resources</p>
                        </div>
                        <div className="space-y-16">
                            <p className="font-semibold">Disetujui Oleh,</p>
                            <div className="border-b w-48 mx-auto"></div>
                            <p>General Manager</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: white !important;
            padding: 0 !important;
          }
          .main-content {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
        </div>
    );
}
