"use client";

import React, { useState, useCallback, useRef } from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image as PdfImage } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { getFullImageUrl } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// Definisikan tipe data yang sesuai dengan struktur laporan
interface ReportHistory {
    id: string;
    spkNumber: string;
    clientName: string;
    projectName: string;
    type: 'PROGRESS' | 'FINAL';
    note: string | null;
    photos: string[];
    reportedAt: Date;
    itemName: string;
    karyawanName: string;
    email: string;
    soDetailId: string;
    progress: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    itemGroup?: string;
}

interface PreviewPdfProps {
    reports: ReportHistory[];
    initialSpk?: string;
    initialItemGroup?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

// Styles untuk dokumen PDF landscape
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 20,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#333',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 15,
    },
    logo: {
        width: 110,
        height: 30,
    },
    companyInfo: {
        fontSize: 9,
        textAlign: 'right',
        maxWidth: '60%',
    },
    header: {
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#1a4f72',
        backgroundColor: '#f8f9fa',
        padding: 10,
        borderRadius: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
        color: '#1a4f72',
        textTransform: 'uppercase',
    },
    clientInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingHorizontal: 8,
    },
    infoItem: {
        flexDirection: 'column',
        marginBottom: 4,
        width: '30%',
    },
    infoLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#495057',
    },
    infoValue: {
        fontSize: 9,
        color: '#212529',
    },
    emailText: {
        color: "blue",
        textDecorationLine: "underline",
    },
    section: {
        marginBottom: 12,
        padding: 6,
        borderWidth: 1,
        borderColor: '#dee2e6',
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    itemTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1a4f72',
    },
    itemCount: {
        fontSize: 9,
        color: '#6c757d',
        backgroundColor: '#e9ecef',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1a4f72',
        color: '#fff',
        paddingVertical: 6,
        paddingHorizontal: 4,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#dee2e6',
        minHeight: 5,
        alignItems: 'center',
    },
    tableRowEven: {
        backgroundColor: '#f8f9fa',
    },
    tableCol: {
        padding: 6,
        flex: 1,
    },
    tableColSmall: {
        padding: 6,
        width: '12%',
    },
    tableColMedium: {
        padding: 6,
        width: '18%',
    },
    tableColPhoto: {
        padding: 6,
        width: '10%',
    },
    statusApproved: {
        color: '#28a745',
        fontWeight: 'bold',
    },
    statusPending: {
        color: '#ffc107',
        fontWeight: 'bold',
    },
    statusRejected: {
        color: '#dc3545',
        fontWeight: 'bold',
    },
    progressContainer: {
        flexDirection: 'column',
        marginTop: 2,
    },
    progressText: {
        fontSize: 8,
        marginBottom: 2,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#e9ecef',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: 6,
        backgroundColor: '#28a745',
        borderRadius: 3,
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        textAlign: 'center',
        fontSize: 8,
        color: '#6c757d',
        borderTopWidth: 1,
        borderTopColor: '#dee2e6',
        paddingTop: 8,
    },
    pageNumber: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 8,
        color: '#6c757d',
    },
    noteText: {
        fontStyle: 'italic',
        color: '#6c757d',
        marginTop: 3,
        fontSize: 8,
    },
    noData: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 12,
        color: '#6c757d',
    },
    photoSection: {
        marginTop: 8,
        padding: 6, // dikurangi dari 8
        backgroundColor: '#f8f9fa',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    photoSectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1a4f72',
        marginBottom: 2,
    },
    photosContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    photoItem: {
        width: 105,       // 5 kolom (misal ukuran page A4)
        marginRight: 6,
        marginBottom: 4,
        alignItems: 'center',
    },
    photo: {
        width: 100,
        height: 120,
        borderRadius: 2,
        borderWidth: 0.5,
        borderColor: '#dee2e6',
        marginBottom: 2,
    },
    photoCaption: {
        fontSize: 7,
        color: '#6c757d',
        textAlign: 'center',
        lineHeight: 1,
        marginBottom: 0,
        padding: 0,
        flexWrap: 'wrap',
        width: '100%',
        // Opsional: batasi max lines
        numberOfLines: 2, // atau 3
        ellipsizeMode: 'tail',
    },
    photoIndicator: {
        fontSize: 7,
        color: '#28a745',
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 0, // dikurangi dari 2
        lineHeight: 2,
    },
    noPhotosText: {
        fontSize: 8,
        color: '#6c757d',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 8, // dikurangi dari 10
    }
});

// Komponen untuk merender PDF
const PdfDocument = ({ reports, itemGroup }: { reports: ReportHistory[], itemGroup?: string }) => {
    const formatDate = useCallback((date: string | Date | null | undefined): string => {
        if (!date) return "-";
        try {
            const dateObj = typeof date === "string" ? new Date(date) : date;
            if (isNaN(dateObj.getTime())) return "Invalid Date";

            return dateObj.toLocaleString("id-ID", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            return "Invalid Date";
        }
    }, []);

    const getStatusStyle = useCallback((status: string) => {
        switch (status) {
            case 'APPROVED':
                return styles.statusApproved;
            case 'PENDING':
                return styles.statusPending;
            case 'REJECTED':
                return styles.statusRejected;
            default:
                return {};
        }
    }, []);

    const getStatusText = useCallback((status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'Disetujui';
            case 'PENDING':
                return 'Menunggu';
            case 'REJECTED':
                return 'Ditolak';
            default:
                return status;
        }
    }, []);

    // Gunakan langsung reports yang sudah difilter dari parent
    const filteredReports = reports;

    // Grouping berdasarkan itemName
    const groupedReports = React.useMemo(() => {
        // 1️⃣ Sort terlebih dahulu berdasarkan reportedAt ascending
        const sortedReports = [...filteredReports].sort(
            (a, b) => new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime()
        );

        // 2️⃣ Group berdasarkan itemName
        const grouped = sortedReports.reduce((acc, report) => {
            const key = report.itemName || 'Unknown Item';
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(report);
            return acc;
        }, {} as Record<string, ReportHistory[]>);

        return grouped;
    }, [filteredReports]);


    // Jika tidak ada laporan
    if (filteredReports.length === 0) {
        return (
            <Document>
                <Page size="A4" orientation="landscape" style={styles.page}>
                    <View style={styles.header}>
                        <Text style={styles.title}>LAPORAN MONITORING PROGRESS SPK</Text>
                    </View>
                    <View style={styles.noData}>
                        <Text>Tidak ada data laporan untuk ditampilkan</Text>
                        {itemGroup && (
                            <Text style={{ marginTop: 10 }}>
                                Filter: {itemGroup}
                            </Text>
                        )}
                    </View>
                </Page>
            </Document>
        );
    }

    const firstReport = filteredReports[0];

    return (
        <Document>
            <Page size="A4" orientation="portrait" style={styles.page}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <PdfImage style={styles.logo} src="/Logo.png" />
                    <View style={styles.companyInfo}>
                        <Text style={{ color: '#008000', fontWeight: 'bold', fontSize: 12 }}>PT. RYLIF MIKRO MANDIRI</Text>
                        <Text>Jln. Arjuna RT. 04/RW. 36, Kampung Pulo Resident 1 No. 6</Text>
                        <Text>Kampung Pulo Warung Asem, Sumber Jaya, Bekasi - 17510, Indonesia</Text>
                        <Text>Phone: 0857-7414-8874 | Email: rylifmikromandiri@gmail.com</Text>
                    </View>
                </View>

                <View style={styles.header}>
                    <Text style={styles.title}>LAPORAN MONITORING PROGRESS SPK</Text>

                    {/* Baris 1: SPK, Pelanggan, Proyek - lebih compact */}
                    <View style={[styles.clientInfo, { marginTop: 5 }]}>
                        <View style={styles.infoItem}>
                            <Text style={[styles.infoLabel, { fontSize: 8 }]}>NO. SPK</Text>
                            <Text style={[styles.infoValue, { fontSize: 8 }]}>{firstReport.spkNumber || '-'}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={[styles.infoLabel, { fontSize: 8 }]}>PELANGGAN</Text>
                            <Text style={[styles.infoValue, { fontSize: 8, flexWrap: 'wrap' }]}>{firstReport.clientName || '-'}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={[styles.infoLabel, { fontSize: 8 }]}>PROYEK</Text>
                            <Text style={[styles.infoValue, { fontSize: 8, flexWrap: 'wrap' }]}>{firstReport.projectName || '-'}</Text>
                        </View>
                    </View>
                </View>

                {/* Konten - Grouping berdasarkan item */}
                {Object.entries(groupedReports).map(([itemName, group], groupIndex) => (
                    <View key={groupIndex} style={styles.section} wrap={false}>
                        {/* Header Item Pekerjaan */}
                        <View style={styles.itemHeader}>
                            <Text style={styles.itemTitle}>{itemName}</Text>
                            <Text style={styles.itemCount}>{group.length} laporan</Text>
                        </View>

                        {/* Table Header */}
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableColMedium, { color: '#fff' }]}>Tanggal & Waktu</Text>
                            <Text style={[styles.tableCol, { color: '#fff' }]}>Keterangan</Text>
                            <Text style={[styles.tableColSmall, { color: '#fff' }]}>Progress</Text>
                            <Text style={[styles.tableColSmall, { color: '#fff' }]}>Status</Text>
                            <Text style={[styles.tableColPhoto, { color: '#fff' }]}>Foto</Text>
                        </View>

                        {/* Isi Tabel per laporan */}
                        {group.map((report, index) => (
                            <View
                                key={report.id}
                                style={[
                                    styles.tableRow,
                                    index % 2 === 0 ? styles.tableRowEven : {}
                                ]}
                            >
                                <Text style={styles.tableColMedium}>
                                    {formatDate(report.reportedAt)}
                                </Text>

                                <View style={styles.tableCol}>
                                    <Text>
                                        {report.note || report.type}
                                    </Text>
                                    {report.note && (
                                        <Text style={styles.noteText}>
                                            ({report.type})
                                        </Text>
                                    )}
                                </View>

                                <View style={styles.tableColSmall}>
                                    <View style={styles.progressContainer}>
                                        <Text style={styles.progressText}>
                                            {report.progress}%
                                        </Text>
                                        <View style={styles.progressBar}>
                                            <View
                                                style={[
                                                    styles.progressFill,
                                                    {
                                                        width: `${report.progress}%`,
                                                        backgroundColor:
                                                            report.progress < 30
                                                                ? "#dc3545"
                                                                : report.progress < 70
                                                                    ? "#ffc107"
                                                                    : "#28a745",
                                                    },
                                                ]}
                                            />
                                        </View>
                                    </View>
                                </View>

                                <Text style={[
                                    styles.tableColSmall,
                                    getStatusStyle(report.status)
                                ]}>
                                    {getStatusText(report.status)}
                                </Text>

                                {/* Kolom Foto Indicator */}
                                <View style={styles.tableColPhoto}>
                                    {report.photos && report.photos.length > 0 ? (
                                        <Text style={styles.photoIndicator}>
                                            {report.photos.length} -  foto
                                        </Text>
                                    ) : (
                                        <Text style={styles.noteText}>-</Text>
                                    )}
                                </View>
                            </View>
                        ))}

                        {/* Section Foto di bawah tabel */}
                        <View style={styles.photoSection}>
                            <Text style={styles.photoSectionTitle}>DOKUMENTASI FOTO - {itemName}</Text>

                            {group.some(report => report.photos && report.photos.length > 0) ? (
                                <View>
                                    <Text style={{ fontSize: 8, marginBottom: 2, color: '#6c757d' }}>
                                        Total {group.reduce((total, report) => total + (report.photos ? report.photos.length : 0), 0)} foto dokumentasi
                                    </Text>

                                    <View style={styles.photosContainer}>
                                        {group.map((report) => (
                                            report.photos && report.photos.map((photo, photoIndex) => (
                                                <View key={`${report.id}-${photoIndex}`} style={styles.photoItem}>
                                                    <PdfImage
                                                        style={styles.photo}
                                                        src={getFullImageUrl(photo)}
                                                    />
                                                    <Text style={styles.photoCaption}>
                                                        {formatDate(report.reportedAt)}
                                                    </Text>
                                                    <Text style={styles.photoCaption}>
                                                        {report.note ? report.note : report.type}
                                                    </Text>
                                                    {/* <Text style={styles.photoIndicator}>
                                                        Foto {photoIndex + 1}
                                                    </Text> */}
                                                </View>
                                            ))
                                        ))}
                                    </View>
                                </View>
                            ) : (
                                <Text style={styles.noPhotosText}>
                                    Tidak ada foto dokumentasi untuk item ini
                                </Text>
                            )}
                        </View>
                    </View>
                ))}

                {/* Footer */}
                <Text style={styles.footer}>
                    Dokumen ini dicetak secara otomatis dari Sistem Monitoring Progress SPK PT. Rylif Mikro Mandiri
                </Text>
                <Text
                    style={styles.pageNumber}
                    render={({ pageNumber, totalPages }) => (
                        `Halaman ${pageNumber} dari ${totalPages}`
                    )}
                    fixed
                />
            </Page>
        </Document>
    );
};

// Komponen PreviewPdf yang diperbaiki - FIXED INFINITE LOOP
const PreviewPdfDetail: React.FC<PreviewPdfProps> = ({
    reports,
    initialSpk,
    initialItemGroup,
    open,
    onOpenChange
}) => {
    const [selectedSpk, setSelectedSpk] = useState<string>(initialSpk || "");
    const [selectedItemGroup, setSelectedItemGroup] = useState<string>(initialItemGroup || "");
    const [isDialogOpen, setIsDialogOpen] = useState(open ?? false);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string>("");
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // console.log("DATA", reports);

    // Ref untuk track mounting status dan previous values
    const isMountedRef = useRef(true);
    const pdfBlobUrlRef = useRef(pdfBlobUrl);

    // Sync ref dengan state
    React.useEffect(() => {
        pdfBlobUrlRef.current = pdfBlobUrl;
    }, [pdfBlobUrl]);

    // Filter reports berdasarkan SPK dan Item Group
    const selectedReports = React.useMemo(() => {
        if (!reports || reports.length === 0) {
            // console.log("📭 No reports available");
            return [];
        }

        let filtered = [...reports];

        if (selectedSpk) {
            filtered = filtered.filter(r =>
                r.spkNumber?.trim() === selectedSpk?.trim()
            );
            // console.log(`🔎 After SPK filter (${selectedSpk}):`, filtered.length);
        }

        if (selectedItemGroup) {
            filtered = filtered.filter(r =>
                r.itemGroup === selectedItemGroup ||
                r.itemName === selectedItemGroup ||
                r.projectName === selectedItemGroup
            );
            // console.log(`🔎 After ItemGroup filter (${selectedItemGroup}):`, filtered.length);
        }

        // console.log("✅ Final selectedReports:", {
        //     count: filtered.length,
        //     items: filtered.map(r => ({
        //         id: r.id,
        //         spk: r.spkNumber,
        //         itemGroup: r.itemGroup,
        //         itemName: r.itemName,
        //         projectName: r.projectName
        //     }))
        // });

        return filtered;
    }, [reports, selectedSpk, selectedItemGroup]);

    // PERBAIKAN: Sinkronisasi prop → state tanpa infinite loop
    React.useEffect(() => {
        if (initialSpk !== undefined) {
            setSelectedSpk(initialSpk);
        }
        if (initialItemGroup !== undefined) {
            setSelectedItemGroup(initialItemGroup);
        }
    }, [initialSpk, initialItemGroup]);

    React.useEffect(() => {
        if (open !== undefined) {
            setIsDialogOpen(open);
        }
    }, [open]);

    // Generate PDF blob
    const createPdfBlobUrl = useCallback(async (reports: ReportHistory[], itemGroup?: string) => {
        if (!reports || reports.length === 0) {
            // console.log("📭 No reports to generate PDF");
            return "";
        }

        try {
            // console.log("📄 Generating PDF with:", {
            //     reportCount: reports.length,
            //     itemGroup,
            //     sampleReport: reports[0]
            // });

            const blob = await pdf(<PdfDocument reports={reports} itemGroup={itemGroup} />).toBlob();
            const url = URL.createObjectURL(blob);
            // console.log("✅ PDF Blob URL created successfully");
            return url;
        } catch (error) {
            console.error("❌ Error creating PDF:", error);
            return "";
        }
    }, []);

    // SOLUSI: Effect untuk generate PDF menggunakan ref untuk menghindari infinite loop
    React.useEffect(() => {
        isMountedRef.current = true;

        const generatePdf = async () => {
            if (selectedReports.length === 0) {
                if (isMountedRef.current) {
                    setPdfBlobUrl("");
                    setIsGeneratingPdf(false);
                }
                return;
            }

            setIsGeneratingPdf(true);

            // Revoke previous URL jika ada (menggunakan ref)
            if (pdfBlobUrlRef.current) {
                URL.revokeObjectURL(pdfBlobUrlRef.current);
            }

            const newBlobUrl = await createPdfBlobUrl(selectedReports, selectedItemGroup || undefined);

            if (isMountedRef.current && newBlobUrl) {
                setPdfBlobUrl(newBlobUrl);
            }

            if (isMountedRef.current) {
                setIsGeneratingPdf(false);
            }
        };

        generatePdf();

        return () => {
            isMountedRef.current = false;
        };
    }, [selectedReports, selectedItemGroup, createPdfBlobUrl]);
    // ✅ ESLint warning hilang karena kita menggunakan ref untuk pdfBlobUrl
    // ✅ Tidak ada infinite loop karena tidak ada dependency pada state yang di-set di dalam effect

    // Cleanup effect
    React.useEffect(() => {
        return () => {
            if (pdfBlobUrl) {
                URL.revokeObjectURL(pdfBlobUrl);
            }
        };
    }, [pdfBlobUrl]);

    const downloadPDF = async () => {
        if (selectedReports.length === 0) {
            // console.warn("⚠️ No reports to download");
            return;
        }

        try {
            const blob = await pdf(<PdfDocument reports={selectedReports} itemGroup={selectedItemGroup || undefined} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;

            // Generate nama file
            let fileName = `Laporan-${selectedReports[0].spkNumber}`;
            if (selectedItemGroup) {
                const cleanItemGroup = selectedItemGroup.replace(/[^a-zA-Z0-9\s]/g, '');
                fileName += `-${cleanItemGroup}`;
            }
            fileName += `.pdf`;

            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup setelah download
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (error) {
            console.error("❌ Error downloading PDF:", error);
        }
    };

    const printPDF = async () => {
        if (selectedReports.length === 0) {
            // console.warn("⚠️ No reports to print");
            return;
        }

        try {
            const blob = await pdf(<PdfDocument reports={selectedReports} itemGroup={selectedItemGroup || undefined} />).toBlob();
            const url = URL.createObjectURL(blob);
            const win = window.open(url, '_blank');

            if (win) {
                win.onload = () => {
                    win.print();
                    setTimeout(() => {
                        if (!win.closed) {
                            win.close();
                        }
                        URL.revokeObjectURL(url);
                    }, 1000);
                };
            } else {
                console.error("Popup window diblokir oleh browser");
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error("❌ Error printing PDF:", error);
        }
    };

    const handleOpenChange = (val: boolean) => {
        setIsDialogOpen(val);
        onOpenChange?.(val);

        // Cleanup URL ketika dialog ditutup
        if (!val && pdfBlobUrl) {
            URL.revokeObjectURL(pdfBlobUrl);
            setPdfBlobUrl("");
        }
    };

    return (
        <Dialog
            open={isDialogOpen}
            onOpenChange={handleOpenChange}
        >
            <DialogContent className="max-w-6xl h-5/6 flex flex-col">
                <DialogTitle asChild>
                    <VisuallyHidden>Preview Laporan SPK</VisuallyHidden>
                </DialogTitle>

                {/* Informasi Filter yang Aktif */}
                {(selectedSpk || selectedItemGroup) && (
                    <div className="bg-blue-50 p-3 rounded-md mb-4">
                        <div className="text-sm text-blue-800">
                            <strong>Filter Aktif:</strong>
                            {selectedSpk && ` SPK: ${selectedSpk}`}
                            {selectedItemGroup && ` | Item Group: ${selectedItemGroup}`}
                            <span className="ml-2 text-green-600">
                                ({selectedReports.length} laporan ditemukan)
                            </span>
                        </div>
                    </div>
                )}

                <div className="flex flex-col h-full">
                    <div className="flex-1 border rounded-md overflow-hidden bg-gray-50">
                        {isGeneratingPdf ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    <p className="text-muted-foreground text-sm">Membuat PDF...</p>
                                </div>
                            </div>
                        ) : pdfBlobUrl && selectedReports.length > 0 ? (
                            <iframe
                                key={pdfBlobUrl}
                                src={pdfBlobUrl}
                                className="w-full h-full"
                                loading="lazy"
                                title="PDF Preview"
                                onError={() => console.error("Failed to load PDF")}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-muted-foreground text-sm italic">
                                    {selectedReports.length === 0
                                        ? "Tidak ada laporan untuk filter yang dipilih"
                                        : "Gagal memuat PDF"}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={printPDF}
                            disabled={selectedReports.length === 0 || isGeneratingPdf}
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                        </Button>
                        <Button
                            onClick={downloadPDF}
                            disabled={selectedReports.length === 0 || isGeneratingPdf}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PreviewPdfDetail;