import React, { useState, useEffect } from 'react';
import { Page, Text, View, Document, StyleSheet, Image as PdfImage, PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { format } from 'date-fns'; // Digunakan di Footer
import { getFullImageUrl } from '@/lib/utils';
import axios from 'axios';

// --- 1. INTERFACES ---
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
        project?: { name: string; location: string | null; };
        spk: { spkNumber: string; spkDate: string; }[],
        items?: {
            id: string; name: string; description: string; productId: string;
            qty: number; price: number; discount?: number; total: number; uom: string;
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

// --- 2. STYLES ---
const styles = StyleSheet.create({
    page: { padding: 20, fontFamily: 'Helvetica', fontSize: 10, lineHeight: 1.3, backgroundColor: '#FFFFFF' },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#000000', borderBottomStyle: 'solid', paddingBottom: 15 },
    logo: { width: 90, height: 40, marginRight: 15 },
    companyInfo: { flex: 1, textAlign: 'right', fontSize: 8, lineHeight: 1.2 },
    header: { textAlign: 'center', marginBottom: 10, marginTop: 5 },
    mainTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase' },
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

// FIX: Pastikan fungsi ini digunakan di dalam render (misalnya di tabel rincian)
const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const chunkPhotos = (photos: BAPPhoto[], photosPerPage: number = 12) => {
    const chunks = [];
    for (let i = 0; i < photos.length; i += photosPerPage) {
        chunks.push(photos.slice(i, i + photosPerPage));
    }
    return chunks;
};

// --- FUNGSI KRUSIAL: DOWNLOAD & CONVERT GAMBAR ---
const convertImageToBase64 = async (url: string): Promise<string> => {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const contentType = response.headers['content-type'] || 'image/jpeg';
        const base64String = Buffer.from(response.data, 'binary').toString('base64');
        return `data:${contentType};base64,${base64String}`;
    } catch (error) {
        // FIX: Menggunakan error agar tidak linting error 'e defined but never used'
        console.error(`Gagal convert foto (${url}):`, error);
        return "/placeholder.png"; 
    }
};

// --- 4. DOKUMEN PDF UTAMA ---
export function BAPPdfDocument({ bap }: { bap: BAPData }) {
    const logoSrc = '/LogoMd.png'; 
    
    const workItems = bap.salesOrder.items && bap.salesOrder.items.length > 0
        ? bap.salesOrder.items
        : [{ id: '1', name: 'Pekerjaan Utama', description: bap.workDescription || '-', productId: 'def', qty: 1, price: 0, total: 0, uom: 'Paket' }];

    const photoChunks = bap.photos ? chunkPhotos(bap.photos, 12) : [];
    const totalPages = 2 + photoChunks.length;

    return (
        <Document>
            {/* --- HALAMAN 1 --- */}
            <Page size="A4" style={styles.page}>
                <View style={styles.headerContainer}>
                    <PdfImage style={styles.logo} src={logoSrc} />
                    <View style={styles.companyInfo}>
                        <Text style={{ color: '#008000', fontWeight: 'bold', fontSize: 12, marginBottom: 5 }}>PT. RYLIF MIKRO MANDIRI</Text>
                        <Text>Office: Jl. Anyar RT. 01/RW. 01, Kampung Pulo, No. 5</Text>
                        <Text>Kemang Pratama, Bekasi Barat, Bekasi - 17144</Text>
                        <Text>Phone: 0857-7414-8874 | Email: rylifmikromandiri@gmail.com</Text>
                    </View>
                </View>

                <View style={styles.header}>
                    <Text style={styles.mainTitle}>BERITA ACARA SERAH TERIMA PEKERJAAN</Text>
                    <Text style={styles.projectValueHeader}>{bap.bapNumber}</Text>
                </View>

                <View style={styles.dateSection}>
                    <Text style={styles.dateText}>Pada hari ini, {formatIndonesianDate(bap.bapDate)}, yang bertanda tangan di bawah ini:</Text>
                </View>

                <View style={styles.partySection}>
                    <Text style={styles.partyHeader}>PIHAK PERTAMA</Text>
                    <View style={styles.partyTable}>
                        <View style={styles.partyRow}><Text style={styles.partyLabel}>Nama</Text><Text style={styles.partyValue}>{bap.user.namaLengkap}</Text></View>
                        <View style={styles.partyRow}><Text style={styles.partyLabel}>Jabatan</Text><Text style={styles.partyValue}>Pelaksana Pekerjaan</Text></View>
                        <View style={styles.partyRow}><Text style={styles.partyLabel}>Alamat</Text><Text style={styles.partyValue}>Office: Jl. Anyar RT. 01/RW. 01, Kampung Pulo, No. 5 Kemang Pratama, Bekasi Barat</Text></View>
                    </View>
                    <Text style={styles.partyDesignation}>Dalam hal ini bertindak untuk dan atas nama Pelaksana Pekerjaan, selanjutnya disebut PIHAK PERTAMA.</Text>
                </View>

                <View style={styles.partySection}>
                    <Text style={styles.partyHeader}>PIHAK KEDUA</Text>
                    <View style={styles.partyTable}>
                        <View style={styles.partyRow}><Text style={styles.partyLabel}>Nama</Text><Text style={styles.partyValue}>{bap.salesOrder.customer.contactPerson}</Text></View>
                        <View style={styles.partyRow}><Text style={styles.partyLabel}>Jabatan</Text><Text style={styles.partyValue}>Perwakilan Pelanggan</Text></View>
                        <View style={styles.partyRow}><Text style={styles.partyLabel}>Alamat</Text><Text style={styles.partyValue}>{bap.salesOrder.customer?.address || '-'} - {bap.salesOrder.customer.branch}</Text></View>
                    </View>
                    <Text style={styles.partyDesignation}>Dalam hal ini bertindak untuk dan atas nama Pemberi Tugas, selanjutnya disebut PIHAK KEDUA.</Text>
                </View>

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

                <View style={styles.agreementSection}>
                    <Text style={styles.agreementText}>Setelah diadakan pemeriksaan bersama, kedua belah Pihak sepakat bahwa pekerjaan tersebut di atas telah dilaksanakan dan diselesaikan dengan baik oleh Pihak Pertama.</Text>
                    <Text style={styles.agreementText}>Demikianlah Berita Acara Serah Terima Pekerjaan ini dibuat 2 (dua) rangkap asli yang masing-masing memiliki kekuatan hukum yang sama setelah ditandatangani oleh Para Pihak.</Text>
                </View>

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
                
                {/* FIX: Menggunakan format() agar tidak error linting 'format declared but never read' */}
                <Text style={styles.footer} fixed>
                    Dokumen ini dicetak secara elektronik pada {format(new Date(), "dd MMMM yyyy 'pukul' HH:mm")} • BAST No: {bap.bapNumber} • Halaman 1 dari {totalPages}
                </Text>
            </Page>

            {/* --- HALAMAN 2 (RINCIAN) --- */}
            <Page size="A4" style={styles.page}>
                <View style={styles.header}><Text style={styles.mainTitle}>LAMPIRAN RINCIAN</Text></View>
                <View style={styles.workScopeTableSection}>
                    <View style={[styles.workScopeRow, styles.workScopeHeader]}>
                        <Text style={styles.workScopeCellNo}>NO</Text>
                        <Text style={styles.workScopeCellDesc}>URAIAN PEKERJAAN</Text>
                    </View>
                    {workItems.map((item, idx) => (
                        <View key={idx} style={styles.workScopeRow}>
                            <Text style={styles.workScopeCellNo}>{idx + 1}</Text>
                            <Text style={styles.workScopeCellDesc}>
                                <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
                                {item.description && ` - ${item.description}`}
                                {item.qty > 0 && ` | Qty: ${item.qty} ${item.uom}`}
                                {/* FIX: Menggunakan formatCurrency agar tidak error linting */}
                                {item.price > 0 && ` | Harga: ${formatCurrency(item.price)}`}
                            </Text>
                        </View>
                    ))}
                </View>
                <View style={{ marginTop: 15, padding: 10, backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#CCCCCC' }}>
                    <Text style={{ fontSize: 9, fontStyle: 'italic' }}>Catatan: Pekerjaan telah selesai sesuai spesifikasi.</Text>
                </View>
                <Text style={styles.footer} fixed>Halaman 2 dari {totalPages}</Text>
            </Page>

            {/* --- HALAMAN 3+ (FOTO) --- */}
            {photoChunks.map((chunk, pageIndex) => (
                <Page key={`photo-${pageIndex}`} size="A4" style={styles.photoPage}>
                    <View style={styles.headerContainer}>
                        <PdfImage style={styles.logo} src={logoSrc} />
                        <View style={styles.companyInfo}>
                            <Text style={{ color: '#008000', fontWeight: 'bold', fontSize: 12 }}>PT. RYLIF MIKRO MANDIRI</Text>
                            <Text>Office: Jl. Anyar RT. 01/RW. 01, Kampung Pulo, No. 5</Text>
                        </View>
                    </View>

                    <View style={styles.header}>
                        <Text style={styles.mainTitle}>DOKUMENTASI FOTO</Text>
                        <Text style={{ fontSize: 9 }}>Halaman Foto {pageIndex + 1} dari {photoChunks.length}</Text>
                    </View>

                    <View style={styles.photoSection}>
                        <View style={styles.photoGrid}>
                            {chunk.map((photo, idx) => {
                                const imageSource = photo.photoUrl.startsWith('data:') 
                                    ? photo.photoUrl 
                                    : getFullImageUrl(photo.photoUrl);

                                return (
                                    <View key={idx} style={styles.photoItem}>
                                        <View style={styles.photoImageContainer}>
                                            <PdfImage style={styles.photoImage} src={imageSource} />
                                        </View>
                                        <Text style={styles.photoCaption}>{getCategoryLabel(photo.category)}</Text>
                                        <Text style={styles.photoCaption}>Foto {(pageIndex * 12) + idx + 1}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                    <Text style={styles.footer} fixed>Halaman {3 + pageIndex} dari {totalPages}</Text>
                </Page>
            ))}
        </Document>
    );
}

// --- 5. KOMPONEN PREVIEW ---
export function BAPPreview({ bap }: { bap: BAPData }) {
    const [readyBap, setReadyBap] = useState<BAPData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        
        const process = async () => {
            try {
                const newBap = JSON.parse(JSON.stringify(bap));
                
                if (newBap.photos && newBap.photos.length > 0) {
                    const processed = await Promise.all(
                        newBap.photos.map(async (photo: BAPPhoto) => {
                            const url = getFullImageUrl(photo.photoUrl);
                            const base64 = await convertImageToBase64(url);
                            return { ...photo, photoUrl: base64 };
                        })
                    );
                    newBap.photos = processed;
                }
                
                if (mounted) setReadyBap(newBap);
            } catch (err: unknown) { // FIX: Menggunakan unknown dan casting atau logging
                console.error(err);
                if (mounted) setError("Gagal memuat gambar preview.");
            }
        };

        process();
        return () => { mounted = false; };
    }, [bap]);

    if (error) return <div className="p-4 text-red-500 text-center">{error}</div>;
    if (!readyBap) return <div className="p-10 text-center text-gray-500">Sedang memproses gambar... Mohon tunggu.</div>;

    return (
        <PDFViewer width="100%" height="100%" className="min-h-[500px] border rounded-lg">
            <BAPPdfDocument bap={readyBap} />
        </PDFViewer>
    );
}

// --- 6. KOMPONEN DOWNLOAD BUTTON ---
export function BAPDownloadButton({ bap }: { bap: BAPData }) {
    const [readyBap, setReadyBap] = useState<BAPData | null>(null);
    const [loading, setLoading] = useState(false);

    const handlePrepare = async () => {
        setLoading(true);
        try {
            const newBap = JSON.parse(JSON.stringify(bap));
            if (newBap.photos) {
                newBap.photos = await Promise.all(newBap.photos.map(async (p: BAPPhoto) => ({
                    ...p,
                    photoUrl: await convertImageToBase64(getFullImageUrl(p.photoUrl))
                })));
            }
            setReadyBap(newBap);
        } catch (error) { // FIX: Rename e -> error dan gunakan
            console.error("Gagal saat prepare download:", error);
            alert("Gagal memproses gambar.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => setReadyBap(null), [bap]);

    if (!readyBap) {
        return (
            <button onClick={handlePrepare} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
                {loading ? "Memproses..." : "Siapkan PDF"}
            </button>
        );
    }

    return (
        <PDFDownloadLink document={<BAPPdfDocument bap={readyBap} />} fileName={`BAST-${bap.bapNumber}.pdf`} className="bg-green-600 text-white px-4 py-2 rounded">
            {({ loading }) => (loading ? "Loading..." : "Download PDF")}
        </PDFDownloadLink>
    );
}