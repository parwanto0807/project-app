import React, { useState, useEffect } from 'react';
import { Page, Text, View, Document, StyleSheet, Image as PdfImage, PDFDownloadLink } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { getFullImageUrl } from '@/lib/utils';

// --- 1. INTERFACES (TETAP SAMA) ---
export interface BAPData {
    id: string;
    bapNumber: string;
    bapDate: string;
    salesOrderId: string;
    projectId: string;
    createdById: string;
    userId: string;
    workDescription: string;
    location: string;
    status: "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "APPROVED";
    isApproved: boolean;
    approvedAt: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    salesOrder: {
        id: string;
        soNumber: string;
        customer: { id: string; name: string; branch: string, contactPerson: string; address: string };
        project?: {
            name: string;
            location: string | null;
        };
        spk: {
            spkNumber: string;
            spkDate: string;
        }[],
        items?: {
            id: string;
            name: string;
            description: string;
            productId: string;
            qty: number;
            price: number;
            discount?: number;
            total: number;
            uom: string;
        }[];
    };
    createdBy: { id: string; name: string; };
    user: { id: string; namaLengkap: string; };
    photos?: BAPPhoto[];
}

export interface BAPPhoto {
    id?: string;
    bapId: string;
    photoUrl: string;
    caption?: string;
    category: "BEFORE" | "PROCESS" | "AFTER";
    createdAt?: string;
}

// --- 2. STYLES (100% SESUAI KODE ASLI ANDA) ---
const styles = StyleSheet.create({
    page: { padding: 20, fontFamily: 'Helvetica', fontSize: 10, lineHeight: 1.3, backgroundColor: '#FFFFFF' },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#000000', borderBottomStyle: 'solid', paddingBottom: 15 },
    logo: { width: 90, height: 40, marginRight: 15 },
    companyInfo: { flex: 1, textAlign: 'right', fontSize: 8, lineHeight: 1.2 },
    header: { textAlign: 'center', marginBottom: 10, marginTop: 5 },
    mainTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase' },
    subTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
    dateSection: { marginBottom: 10, marginTop: 10, textAlign: 'left' },
    dateText: { fontSize: 10, marginBottom: 5 },
    partySection: { marginBottom: 18 },
    partyHeader: { fontSize: 11, fontWeight: 'bold', marginBottom: 5, textDecoration: 'underline' },
    partyTable: { width: '100%', marginBottom: 10 },
    partyRow: { flexDirection: 'row', marginBottom: 5 },
    partyLabel: { width: 100, fontSize: 9, fontWeight: 'bold' },
    partyValue: { flex: 1, fontSize: 9, borderBottomWidth: 1, borderBottomColor: '#000000', borderBottomStyle: 'solid', paddingBottom: 2 },
    partyDesignation: { fontSize: 9, fontStyle: 'italic', marginTop: 5, textAlign: 'justify' },
    projectSection: { marginBottom: 5 },
    sectionTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 5, paddingBottom: 2, textDecoration: 'underline' },
    projectTable: { width: '100%' },
    projectRow: { flexDirection: 'row', marginBottom: 8 },
    projectLabel: { width: 120, fontSize: 9, fontWeight: 'bold' },
    projectValueHeader: { flex: 1, fontSize: 12, fontWeight: 'bold', paddingBottom: 2 },
    projectValue: { flex: 1, fontSize: 9, paddingBottom: 2, borderBottomWidth: 1, borderBottomColor: '#000000', borderBottomStyle: 'dotted' },
    workScopeSection: { marginBottom: 20 },
    workScopeList: { paddingLeft: 15 },
    workScopeItem: { flexDirection: 'row', marginBottom: 5 },
    workScopeNumber: { width: 15, fontSize: 9 },
    workScopeText: { flex: 1, fontSize: 9, textAlign: 'justify' },
    agreementSection: { marginBottom: 25, textAlign: 'justify' },
    agreementText: { fontSize: 9, marginBottom: 8, lineHeight: 1.4 },
    signatureSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    signatureBox: { width: '45%', textAlign: 'center' },
    signatureTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 20, textTransform: 'uppercase' },
    signatureLine: { height: 1, backgroundColor: '#000000', marginBottom: 5 },
    signatureInfo: { fontSize: 8, marginTop: 3 },
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 7, color: '#666666', borderTopWidth: 1, borderTopColor: '#CCCCCC', paddingTop: 5 },
    photoSection: { marginBottom: 10 },
    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 4, marginTop: 5 },
    photoItem: { width: '24%', marginBottom: 6, alignItems: 'center' },
    photoImageContainer: { width: '100%', height: 180, overflow: 'hidden', borderWidth: 0.5, borderColor: '#CCCCCC', backgroundColor: '#F5F5F5' },
    photoImage: { width: '100%', height: '100%', objectFit: 'cover' },
    photoCaption: { fontSize: 5, textAlign: 'center', marginTop: 1, fontStyle: 'italic', lineHeight: 1.2 },
    photoPage: { padding: 20, fontFamily: 'Helvetica', fontSize: 10, lineHeight: 1.3, backgroundColor: '#FFFFFF' },
    tableContainer: { marginBottom: 20 },
    table: { width: '100%', borderWidth: 1, borderColor: '#000000', marginTop: 10 },
    tableHeader: { backgroundColor: '#2E86AB', color: '#FFFFFF', fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000000' },
    tableCell: { padding: 8, fontSize: 9, borderRightWidth: 1, borderRightColor: '#000000' },
    tableCellNo: { width: '8%', textAlign: 'center', fontWeight: 'bold' },
    tableCellItem: { width: '52%', textAlign: 'left', paddingLeft: 5 },
    tableCellQty: { width: '15%', textAlign: 'center' },
    tableCellUom: { width: '15%', textAlign: 'center' },
    tableCellPrice: { width: '20%', textAlign: 'right', paddingRight: 5 },
    tableFooter: { backgroundColor: '#F8F9FA', fontWeight: 'bold' },
    tableSummary: { padding: 8, fontSize: 9, textAlign: 'right', borderTopWidth: 2, borderTopColor: '#000000' },
    workScopeTableSection: { marginBottom: 25 },
    workScopeTable: { width: '100%', borderWidth: 1, borderColor: '#000000', marginTop: 10 },
    workScopeHeader: { backgroundColor: '#28A745', color: '#FFFFFF', fontWeight: 'bold' },
    workScopeRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#CCCCCC' },
    workScopeCellNo: { width: '5%', padding: 2, fontSize: 9, borderRightWidth: 1, borderRightColor: '#000000', textAlign: 'center', fontWeight: 'bold' },
    workScopeCellDesc: { width: '95%', padding: 2, fontSize: 9, textAlign: 'left' },
});

// --- 3. HELPER FUNCTIONS ---
const formatIndonesianDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const getCategoryLabel = (category: string) => {
    const map: Record<string, string> = { BEFORE: 'Sebelum Pekerjaan', PROCESS: 'Proses Pekerjaan', AFTER: 'Sesudah Pekerjaan' };
    return map[category] || category;
};

const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const chunkPhotos = (photos: BAPPhoto[], photosPerPage: number = 20) => {
    const chunks = [];
    for (let i = 0; i < photos.length; i += photosPerPage) {
        chunks.push(photos.slice(i, i + photosPerPage));
    }
    return chunks;
};

// --- FUNGSI FIX UNTUK GAMBAR PDF (WEBP -> PNG BASE64) ---
// Ini yang memperbaiki masalah gambar kosong
const convertImageToBase64 = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url, { mode: 'cors' });
        const blob = await response.blob();
        
        // Buat elemen image untuk digambar di canvas
        const img = new Image();
        const objectUrl = URL.createObjectURL(blob);
        img.src = objectUrl;
        
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });

        // Gambar ke canvas dan export sebagai PNG
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context failed');
        
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL('image/png'); // Penting: Export ke PNG
        
        URL.revokeObjectURL(objectUrl);
        return base64;
    } catch (error) {
        console.error("Gagal convert gambar:", error);
        return ""; // Return string kosong agar tidak error
    }
};

// --- 4. DOKUMEN PDF (LAYOUT SESUAI PERMINTAAN) ---
export function BAPPdfDocument({ bap }: { bap: BAPData }) {
    // Gunakan URL langsung dari folder public (jangan path.resolve di client side)
    const logoSrc = '/LogoMd.png'; 
    
    // Siapkan data items
    const workItems = bap.salesOrder.items && bap.salesOrder.items.length > 0
        ? bap.salesOrder.items
        : [{ id: '1', name: 'Pekerjaan Utama', description: bap.workDescription || 'Pekerjaan sesuai dengan spesifikasi yang telah disepakati', productId: 'def', qty: 1, price: 0, total: 0, uom: 'Paket' }];

    // Siapkan foto
    const photoChunks = bap.photos ? chunkPhotos(bap.photos, 12) : []; // 12 foto per halaman
    const totalPages = 2 + photoChunks.length;

    return (
        <Document>
            {/* Page 1 - Main Content */}
            <Page size="A4" style={styles.page}>
                {/* Header Container */}
                <View style={styles.headerContainer}>
                    <PdfImage style={styles.logo} src={logoSrc} />
                    <View style={styles.companyInfo}>
                        <Text style={{ color: '#008000', fontWeight: 'bold', fontSize: 12, marginBottom: 5 }}>PT. RYLIF MIKRO MANDIRI</Text>
                        <Text>Office: Jl. Anyar RT. 01/RW. 01, Kampung Pulo, No. 5</Text>
                        <Text>Kemang Pratama, Bekasi Barat, Bekasi - 17144, Indonesia</Text>
                        <Text>Phone: 0857-7414-8874 | Email: rylifmikromandiri@gmail.com</Text>
                    </View>
                </View>

                {/* Header Title */}
                <View style={styles.header}>
                    <Text style={styles.mainTitle}>BERITA ACARA SERAH TERIMA PEKERJAAN</Text>
                    <Text style={styles.projectValueHeader}>{bap.bapNumber}</Text>
                </View>

                {/* Date */}
                <View style={styles.dateSection}>
                    <Text style={styles.dateText}>Pada hari ini, {formatIndonesianDate(bap.bapDate)}, yang bertanda tangan di bawah ini:</Text>
                </View>

                {/* First Party (FULL) */}
                <View style={styles.partySection}>
                    <Text style={styles.partyHeader}>PIHAK PERTAMA</Text>
                    <View style={styles.partyTable}>
                        <View style={styles.partyRow}>
                            <Text style={styles.partyLabel}>Nama</Text>
                            <Text style={styles.partyValue}>{bap.user.namaLengkap}</Text>
                        </View>
                        <View style={styles.partyRow}>
                            <Text style={styles.partyLabel}>Jabatan</Text>
                            <Text style={styles.partyValue}>Pemborong / Pelaksana Pekerjaan</Text>
                        </View>
                        <View style={styles.partyRow}>
                            <Text style={styles.partyLabel}>Alamat</Text>
                            <Text style={styles.partyValue}>Office: Jl. Anyar RT. 01/RW. 01, Kampung Pulo, No. 5 Kemang Pratama, Bekasi Barat, Bekasi - 17144, Indonesia</Text>
                        </View>
                    </View>
                    <Text style={styles.partyDesignation}>Dalam hal ini bertindak untuk dan atas nama Pelaksana Pekerjaan, selanjutnya disebut PIHAK PERTAMA.</Text>
                </View>

                {/* Second Party (FULL) */}
                <View style={styles.partySection}>
                    <Text style={styles.partyHeader}>PIHAK KEDUA</Text>
                    <View style={styles.partyTable}>
                        <View style={styles.partyRow}>
                            <Text style={styles.partyLabel}>Nama</Text>
                            <Text style={styles.partyValue}>{bap.salesOrder.customer.contactPerson}</Text>
                        </View>
                        <View style={styles.partyRow}>
                            <Text style={styles.partyLabel}>Jabatan</Text>
                            <Text style={styles.partyValue}>Perwakilan Pelanggan</Text>
                        </View>
                        <View style={styles.partyRow}>
                            <Text style={styles.partyLabel}>Alamat</Text>
                            <Text style={styles.partyValue}>{bap.salesOrder.customer?.address || '-'} - {bap.salesOrder.customer.branch}</Text>
                        </View>
                    </View>
                    <Text style={styles.partyDesignation}>Dalam hal ini bertindak untuk dan atas nama Pemberi Tugas, selanjutnya disebut PIHAK KEDUA.</Text>
                </View>

                {/* Project Info (SPK Logic) */}
                <View style={styles.projectSection}>
                    <Text style={styles.sectionTitle}>Kedua belah pihak sepakat untuk mengadakan serah terima pekerjaan:</Text>
                    <View style={styles.projectTable}>
                        <View style={styles.projectRow}>
                            <Text style={styles.projectLabel}>Nama Proyek</Text>
                            <Text style={styles.projectValue}>{bap.salesOrder.project?.name}</Text>
                        </View>
                        <View style={styles.projectRow}>
                            <Text style={styles.projectLabel}>Tanggal Pengerjaan</Text>
                            <Text style={styles.projectValue}>
                                {bap.salesOrder.spk && bap.salesOrder.spk.length > 0 ? (
                                    <>{formatIndonesianDate(bap.salesOrder.spk[0].spkDate)} - {bap.salesOrder.spk[0].spkNumber}</>
                                ) : "Tidak ada SPK"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Agreement */}
                <View style={styles.agreementSection}>
                    <Text style={styles.agreementText}>Setelah diadakan pemeriksaan bersama, kedua belah Pihak sepakat bahwa pekerjaan tersebut di atas telah dilaksanakan dan diselesaikan dengan baik oleh Pihak Pertama.</Text>
                    <Text style={styles.agreementText}>Demikianlah Berita Acara Serah Terima Pekerjaan ini dibuat 2 (dua) rangkap asli yang masing-masing memiliki kekuatan hukum yang sama setelah ditandatangani oleh Para Pihak, serta merupakan satu kesatuan yang tidak terpisahkan dengan Perjanjian.</Text>
                </View>

                {/* Signatures */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureTitle}>PIHAK PERTAMA</Text>
                        <View style={{ height: 60, marginVertical: 10 }}></View>
                        <View style={styles.signatureLine}></View>
                        <Text style={styles.signatureInfo}>{bap.user.namaLengkap}</Text>
                        <Text style={styles.signatureInfo}>Pelaksana Pekerjaan</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureTitle}>PIHAK KEDUA</Text>
                        <View style={{ height: 60, marginVertical: 10 }}></View>
                        <View style={styles.signatureLine}></View>
                        <Text style={styles.signatureInfo}>{bap.salesOrder.customer.contactPerson}</Text>
                        <Text style={styles.signatureInfo}>Perwakilan Pelanggan</Text>
                    </View>
                </View>

                {/* Footer Page 1 */}
                <Text style={styles.footer} fixed>Dokumen ini dicetak secara elektronik pada {format(new Date(), "dd MMMM yyyy 'pukul' HH:mm")} • BAST No: {bap.bapNumber} • Halaman 1 dari {totalPages}</Text>
            </Page>

            {/* Page 2 - Rincian Pekerjaan */}
            <Page size="A4" style={styles.page}>
                {/* Header Page 2 */}
                <View style={styles.headerContainer}>
                    <PdfImage style={styles.logo} src={logoSrc} />
                    <View style={styles.companyInfo}>
                        <Text style={{ color: '#008000', fontWeight: 'bold', fontSize: 12, marginBottom: 5 }}>PT. RYLIF MIKRO MANDIRI</Text>
                        <Text>Office: Jl. Anyar RT. 01/RW. 01, Kampung Pulo, No. 5</Text>
                        <Text>Kemang Pratama, Bekasi Barat, Bekasi - 17144, Indonesia</Text>
                    </View>
                </View>

                <View style={styles.header}>
                    <Text style={styles.mainTitle}>LAMPIRAN DOKUMENTASI DAN RINCIAN PEKERJAAN</Text>
                    <Text style={styles.dateText}>Berita Acara Serah Terima No: {bap.bapNumber}</Text>
                </View>

                <View style={styles.workScopeTableSection}>
                    <Text style={styles.sectionTitle}>RINCIAN CAKUPAN PEKERJAAN</Text>
                    <View style={styles.workScopeTable}>
                        {/* Table Header */}
                        <View style={[styles.workScopeRow, styles.workScopeHeader]}>
                            <Text style={styles.workScopeCellNo}>NO</Text>
                            <Text style={styles.workScopeCellDesc}>URAIAN PEKERJAAN</Text>
                        </View>
                        {/* Table Items */}
                        {workItems.map((item, index) => (
                            <View key={item.id} style={styles.workScopeRow}>
                                <Text style={styles.workScopeCellNo}>{index + 1}</Text>
                                <Text style={styles.workScopeCellDesc}>
                                    <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
                                    {item.description && ` - ${item.description}`}
                                    {item.qty > 0 && ` | Qty: ${item.qty} ${item.uom}`}
                                    {item.price > 0 && ` | Harga: ${formatCurrency(item.price)}`}
                                </Text>
                            </View>
                        ))}
                    </View>
                    {/* Note */}
                    <View style={{ marginTop: 15, padding: 10, backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#CCCCCC' }}>
                        <Text style={{ fontSize: 9, fontStyle: 'italic', textAlign: 'justify' }}>
                            <Text style={{ fontWeight: 'bold' }}>Catatan: </Text>
                            Semua item pekerjaan di atas telah diselesaikan sesuai dengan spesifikasi dan standar kualitas yang disepakati oleh kedua belah pihak.
                        </Text>
                    </View>
                </View>

                {/* Footer Page 2 */}
                <Text style={styles.footer} fixed>Lampiran Berita Acara Serah Terima No: {bap.bapNumber} • Halaman 2 dari {totalPages}</Text>
            </Page>

            {/* Page 3+ - Photos (REVISI: MENGGUNAKAN BASE64) */}
            {photoChunks.map((photoChunk, pageIndex) => (
                <Page key={`photo-page-${pageIndex}`} size="A4" style={styles.photoPage}>
                    {/* Header Photo Page */}
                    <View style={styles.headerContainer}>
                        <PdfImage style={styles.logo} src={logoSrc} />
                        <View style={styles.companyInfo}>
                            <Text style={{ color: '#008000', fontWeight: 'bold', fontSize: 12, marginBottom: 5 }}>PT. RYLIF MIKRO MANDIRI</Text>
                            <Text>Office: Jl. Anyar RT. 01/RW. 01, Kampung Pulo, No. 5</Text>
                            <Text>Kemang Pratama, Bekasi Barat, Bekasi - 17144, Indonesia</Text>
                        </View>
                    </View>

                    <View style={styles.header}>
                        <Text style={styles.mainTitle}>DOKUMENTASI FOTO</Text>
                        <Text style={styles.dateText}>Berita Acara Serah Terima No: {bap.bapNumber}</Text>
                        <Text style={{ fontSize: 9, marginTop: 5 }}>Halaman Foto {pageIndex + 1} dari {photoChunks.length} • Total {bap.photos?.length} foto</Text>
                    </View>

                    <View style={styles.photoSection}>
                        <Text style={styles.sectionTitle}>Dokumentasi Foto ({pageIndex + 1}/{photoChunks.length})</Text>
                        <View style={styles.photoGrid}>
                            {photoChunk.map((photo, index) => (
                                <View key={photo.id || `${pageIndex}-${index}`} style={styles.photoItem}>
                                    <View style={styles.photoImageContainer}>
                                        {/* GANTI: src menggunakan photoUrl yang sudah di-convert (Base64) */}
                                        <PdfImage style={styles.photoImage} src={photo.photoUrl} />
                                    </View>
                                    <Text style={styles.photoCaption}>{getCategoryLabel(photo.category)}</Text>
                                    <Text style={styles.photoCaption}>Foto {(pageIndex * 12) + index + 1}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <Text style={styles.footer} fixed>Dokumentasi Foto • Halaman {3 + pageIndex} dari {totalPages}</Text>
                </Page>
            ))}
        </Document>
    );
}

// --- 5. KOMPONEN TOMBOL DOWNLOAD (GUNAKAN INI DI PAGE.TSX) ---
export function BAPDownloadButton({ bap }: { bap: BAPData }) {
    const [isPreparing, setIsPreparing] = useState(false);
    const [readyBap, setReadyBap] = useState<BAPData | null>(null);

    const preparePdf = async () => {
        setIsPreparing(true);
        try {
            const newBap = JSON.parse(JSON.stringify(bap)); // Deep Clone data BAP
            
            if (newBap.photos && newBap.photos.length > 0) {
                // Loop semua foto dan convert WebP/JPG -> Base64 PNG
                const processedPhotos = await Promise.all(
                    newBap.photos.map(async (photo: BAPPhoto) => {
                        const originalUrl = getFullImageUrl(photo.photoUrl);
                        const base64 = await convertImageToBase64(originalUrl);
                        return { 
                            ...photo, 
                            photoUrl: base64 || '/placeholder.png' // Fallback image jika gagal
                        };
                    })
                );
                newBap.photos = processedPhotos;
            }
            
            setReadyBap(newBap);
        } catch (error) {
            console.error("Error preparing PDF:", error);
            alert("Gagal memproses gambar untuk PDF. Silakan coba lagi.");
        } finally {
            setIsPreparing(false);
        }
    };

    // Reset readyBap jika data bap berubah (misal pindah halaman)
    useEffect(() => {
        setReadyBap(null);
    }, [bap]);

    if (!readyBap) {
        return (
            <button 
                onClick={preparePdf} 
                disabled={isPreparing}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 shadow-sm transition-all text-sm font-medium"
            >
                {isPreparing ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Memproses Gambar...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span>Download PDF</span>
                    </>
                )}
            </button>
        );
    }

    return (
        <PDFDownloadLink
            document={<BAPPdfDocument bap={readyBap} />}
            fileName={`BAST-${bap.bapNumber}.pdf`}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 shadow-sm transition-all text-sm font-medium"
        >
            {({ loading }) => (loading ? (
                <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading PDF...</span>
                </>
            ) : (
                <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>Download Sekarang</span>
                </>
            ))}
        </PDFDownloadLink>
    );
}