"use client";

import React, { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image as PdfImage } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { getFullImageUrl } from '@/lib/utils'; // Pastikan import ini ada

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
    subtitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 6,
        color: '#2c6b9e',
        paddingVertical: 2,
        paddingHorizontal: 8,
        backgroundColor: '#e9ecef',
        borderRadius: 3,
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
        marginBottom: 4,
        padding: 2,
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
        paddingBottom: 2,
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
    tableContainer: {
        width: '100%',
        marginTop: 0,
        borderWidth: 1,
        borderColor: '#dee2e6',
        borderRadius: 3,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1a4f72',
        color: '#fff',
        paddingVertical: 1,
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
        width: '50%',
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
    photoSection: {
        marginTop: 1,
        padding: 8,
        backgroundColor: '#f8f9fa',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    photoSectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1a4f72',
        marginBottom: 6,
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
        resizeMode: 'cover',
        flexWrap: 'wrap',
        width: '100%',
        // Opsional: batasi max lines
        numberOfLines: 2, // atau 3
        ellipsizeMode: 'tail',
    },
    photoIndicator: {
        fontSize: 8,
        color: '#28a745',
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 2,
    },
    noPhotosText: {
        fontSize: 9,
        color: '#6c757d',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 10,
    }
});

interface PreviewPdfProps {
    reports: ReportHistory[];
    initialSpk?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

// Komponen untuk merender PDF
const PdfDocument = ({ reports }: { reports: ReportHistory[] }) => {
    function formatDate(date: string | Date | null | undefined): string {
        if (!date) return "-";
        const dateObj = typeof date === "string" ? new Date(date) : date;
        return isNaN(dateObj.getTime())
            ? "Invalid Date"
            : dateObj.toLocaleString("id-ID", {
                year: "numeric", month: "short", day: "numeric",
                hour: "2-digit", minute: "2-digit"
            });
    }

    // Fungsi untuk mendapatkan style status berdasarkan kondisi
    // const getStatusStyle = (status: string) => {
    //     switch (status) {
    //         case 'APPROVED':
    //             return styles.statusApproved;
    //         case 'PENDING':
    //             return styles.statusPending;
    //         case 'REJECTED':
    //             return styles.statusRejected;
    //         default:
    //             return {};
    //     }
    // };

    // Grouping berdasarkan itemName
    const sortedReports = [...reports].sort(
        (a, b) => new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime()
    );

    const groupedReports = sortedReports.reduce((acc, report) => {
        const key = report.itemName || 'Unknown Item';
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(report);
        return acc;
    }, {} as Record<string, ReportHistory[]>);

    return (
        <Document>
            <Page size="A4" orientation="portrait" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>LAPORAN MONITORING PROGRESS SPK</Text>

                    <View style={styles.clientInfo}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>NO. SPK</Text>
                            <Text style={styles.infoValue}>{reports[0].spkNumber || '-'}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>PELANGGAN</Text>
                            <Text style={styles.infoValue}>{reports[0]?.clientName || '-'}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>PROYEK</Text>
                            <Text style={styles.infoValue}>{reports[0]?.projectName || '-'}</Text>
                        </View>
                    </View>

                    <View style={styles.clientInfo}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>TANGGAL CETAK</Text>
                            <Text style={styles.infoValue}>{new Date().toLocaleDateString('id-ID', {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                            })}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>JUMLAH LAPORAN</Text>
                            <Text style={styles.infoValue}>{reports.length} laporan</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>ITEM PEKERJAAN</Text>
                            <Text style={styles.infoValue}>{Object.keys(groupedReports).length} item</Text>
                        </View>
                    </View>
                    <View style={styles.clientInfo}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>DILAPORKAN OLEH</Text>
                            <Text style={styles.infoValue}>{reports[0]?.karyawanName || '-'}</Text>
                            <Text style={[styles.infoValue, styles.emailText]}>{reports[0]?.email}</Text>
                        </View>
                    </View>
                </View>

                {/* Header Tabel */}
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableColMedium, { color: '#fff' }]}>LIST DOKUMENTASI FOTO</Text>
                    {/* <Text style={[styles.tableCol, { color: '#fff' }]}>Keterangan</Text>
                    <Text style={[styles.tableColSmall, { color: '#fff' }]}>Progress</Text>
                    <Text style={[styles.tableColSmall, { color: '#fff' }]}>Status Approve Admin</Text>
                    <Text style={[styles.tableColPhoto, { color: '#fff' }]}>Foto</Text> */}
                </View>

                {/* Loop per itemName */}
                {Object.entries(groupedReports).map(([itemName, group], idx) => (
                    <View key={idx} style={styles.section} wrap={false}>
                        {/* Header Item Pekerjaan */}
                        {/* <View style={styles.itemHeader}>
                            <Text style={styles.itemTitle}>{itemName}</Text>
                            <Text style={styles.itemCount}>{group.length} laporan</Text>
                        </View> */}

                        {/* Isi Tabel per laporan */}
                        {/* {group.map((report, index) => (
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

                                <Text style={styles.tableCol}>
                                    {report.note || report.type}
                                    {report.note && (
                                        <Text style={styles.noteText}>
                                            {"\n"}({report.type})
                                        </Text>
                                    )}
                                </Text>

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
                                                                ? "red"
                                                                : report.progress < 70
                                                                    ? "orange"
                                                                    : "green",
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
                                    {report.status === 'APPROVED' ? 'Disetujui' :
                                        report.status === 'PENDING' ? 'Menunggu' : 'Ditolak'}
                                </Text>

                                <View style={styles.tableColPhoto}>
                                    {report.photos && report.photos.length > 0 ? (
                                        <Text style={styles.photoIndicator}>
                                            {report.photos.length} foto
                                        </Text>
                                    ) : (
                                        <Text style={styles.noteText}>-</Text>
                                    )}
                                </View>
                            </View>
                        ))} */}

                        {/* Section Foto di bawah setiap item group */}
                        <View style={styles.photoSection}>
                            <Text style={styles.photoSectionTitle}>DOKUMENTASI FOTO - {itemName}</Text>

                            {group.some(report => report.photos && report.photos.length > 0) ? (
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
                                            </View>
                                        ))
                                    ))}
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

// Komponen PreviewPdf
const PreviewPdf: React.FC<PreviewPdfProps> = ({ reports, initialSpk, open, onOpenChange }) => {
    const [selectedSpk, setSelectedSpk] = useState<string>(initialSpk || "");
    const [isDialogOpen, setIsDialogOpen] = useState(open ?? false);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string>("");

    // Daftar SPK unik
    const selectedReports = React.useMemo(() => {
        return reports.filter((report) => report.spkNumber === selectedSpk);
    }, [reports, selectedSpk]);

    // Sinkronisasi prop → state
    React.useEffect(() => {
        if (initialSpk && initialSpk !== selectedSpk) {
            setSelectedSpk(initialSpk);
            setIsDialogOpen(true);
        }
    }, [initialSpk, selectedSpk]);

    React.useEffect(() => {
        setIsDialogOpen(open ?? false);
    }, [open]);

    // Generate PDF blob
    const createPdfBlobUrl = async (reports: ReportHistory[]) => {
        const blob = await pdf(<PdfDocument reports={reports} />).toBlob();
        return URL.createObjectURL(blob);
    };

    React.useEffect(() => {
        if (selectedReports.length > 0) {
            createPdfBlobUrl(selectedReports).then((url) => {
                setPdfBlobUrl(url);
            });
        } else {
            setPdfBlobUrl("");
        }
    }, [selectedReports]);

    React.useEffect(() => {
        return () => {
            if (pdfBlobUrl) {
                URL.revokeObjectURL(pdfBlobUrl);
            }
        };
    }, [pdfBlobUrl]);

    const downloadPDF = async () => {
        if (selectedReports.length === 0) return;
        const blob = await pdf(<PdfDocument reports={selectedReports} />).toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Laporan-${selectedReports[0].spkNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    const printPDF = async () => {
        if (selectedReports.length === 0) return;
        const blob = await pdf(<PdfDocument reports={selectedReports} />).toBlob();
        const url = URL.createObjectURL(blob);
        const win = window.open(url);
        win?.addEventListener("load", () => {
            win.print();
        });
    };

    return (
        <Dialog
            open={isDialogOpen}
            onOpenChange={(val) => {
                setIsDialogOpen(val);
                onOpenChange?.(val);
            }}
        >
            <DialogContent className="max-w-6xl h-5/6 flex flex-col">
                <DialogTitle asChild>
                    <VisuallyHidden>Preview Laporan SPK</VisuallyHidden>
                </DialogTitle>

                <div className="flex flex-col h-full">
                    <div className="flex-1 border rounded-md overflow-hidden">
                        {pdfBlobUrl ? (
                            <iframe src={pdfBlobUrl} className="w-full h-full" title="PDF Preview" />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-muted-foreground">Tidak ada laporan untuk SPK ini</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" onClick={printPDF} disabled={selectedReports.length === 0}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                        </Button>
                        <Button onClick={downloadPDF} disabled={selectedReports.length === 0}>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PreviewPdf;