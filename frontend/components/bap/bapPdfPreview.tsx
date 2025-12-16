import { Page, Text, View, Document, StyleSheet, Image as PdfImage } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { getFullImageUrl } from '@/lib/utils';
import path from 'path';

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
    createdBy: {
        id: string;
        name: string;
    };
    user: {
        id: string;
        namaLengkap: string;
    };
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

const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontFamily: 'Helvetica',
        fontSize: 10,
        lineHeight: 1.3,
        backgroundColor: '#FFFFFF',
    },

    // Header Container dengan Logo dan Company Info
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#000000',
        borderBottomStyle: 'solid',
        paddingBottom: 15,
    },
    logo: {
        width: 90,
        height: 40,
        marginRight: 15,
    },
    companyInfo: {
        flex: 1,
        textAlign: 'right',
        fontSize: 8,
        lineHeight: 1.2,
    },

    // Header Styles
    header: {
        textAlign: 'center',
        marginBottom: 10,
        marginTop: 5,
    },
    mainTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    subTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
    },

    // Date Section
    dateSection: {
        marginBottom: 10,
        marginTop: 10,
        textAlign: 'left',
    },
    dateText: {
        fontSize: 10,
        marginBottom: 5,
    },

    // Party Information
    partySection: {
        marginBottom: 18,
    },
    partyHeader: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 5,
        textDecoration: 'underline',
    },
    partyTable: {
        width: '100%',
        marginBottom: 10,
    },
    partyRow: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    partyLabel: {
        width: 100,
        fontSize: 9,
        fontWeight: 'bold',
    },
    partyValue: {
        flex: 1,
        fontSize: 9,
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        borderBottomStyle: 'solid',
        paddingBottom: 2,
    },
    partyDesignation: {
        fontSize: 9,
        fontStyle: 'italic',
        marginTop: 5,
        textAlign: 'justify',
    },

    // Project Information
    projectSection: {
        marginBottom: 5,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 5,
        paddingBottom: 2,
        textDecoration: 'underline',
    },
    projectTable: {
        width: '100%',
    },
    projectRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    projectLabel: {
        width: 120,
        fontSize: 9,
        fontWeight: 'bold',
    },
    projectValueHeader: {
        flex: 1,
        fontSize: 12,
        fontWeight: 'bold',
        paddingBottom: 2,
    },
    projectValue: {
        flex: 1,
        fontSize: 9,
        paddingBottom: 2,
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        borderBottomStyle: 'dotted',
    },

    // Work Scope
    workScopeSection: {
        marginBottom: 20,
    },
    workScopeList: {
        paddingLeft: 15,
    },
    workScopeItem: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    workScopeNumber: {
        width: 15,
        fontSize: 9,
    },
    workScopeText: {
        flex: 1,
        fontSize: 9,
        textAlign: 'justify',
    },

    // Agreement Section
    agreementSection: {
        marginBottom: 25,
        textAlign: 'justify',
    },
    agreementText: {
        fontSize: 9,
        marginBottom: 8,
        lineHeight: 1.4,
    },

    // Signature Section
    signatureSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    signatureBox: {
        width: '45%',
        textAlign: 'center',
    },
    signatureTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 20,
        textTransform: 'uppercase',
    },
    signatureLine: {
        height: 1,
        backgroundColor: '#000000',
        marginBottom: 5,
    },
    signatureInfo: {
        fontSize: 8,
        marginTop: 3,
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 7,
        color: '#666666',
        borderTopWidth: 1,
        borderTopColor: '#CCCCCC',
        paddingTop: 5,
    },

    // Photo Section - Modified for dynamic pagination
    photoSection: {
        marginBottom: 10,
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 4,
        marginTop: 5,
    },
    photoItem: {
        width: '24%',
        marginBottom: 6,
        alignItems: 'center',
    },
    photoImageContainer: {
        width: '100%',
        height: 180, // Reduced height to fit more photos per page
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: '#CCCCCC',
        backgroundColor: '#F5F5F5',
    },
    photoImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    photoCaption: {
        fontSize: 5,
        textAlign: 'center',
        marginTop: 1,
        fontStyle: 'italic',
        lineHeight: 1.2,
    },

    // New style for photo-only pages
    photoPage: {
        padding: 20,
        fontFamily: 'Helvetica',
        fontSize: 10,
        lineHeight: 1.3,
        backgroundColor: '#FFFFFF',
    },

    // Professional Table Styles
    tableContainer: {
        marginBottom: 20,
    },
    table: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#000000',
        marginTop: 10,
    },
    tableHeader: {
        backgroundColor: '#2E86AB',
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
    },
    tableCell: {
        padding: 8,
        fontSize: 9,
        borderRightWidth: 1,
        borderRightColor: '#000000',
    },
    tableCellNo: {
        width: '8%',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    tableCellItem: {
        width: '52%',
        textAlign: 'left',
        paddingLeft: 5,
    },
    tableCellQty: {
        width: '15%',
        textAlign: 'center',
    },
    tableCellUom: {
        width: '15%',
        textAlign: 'center',
    },
    tableCellPrice: {
        width: '20%',
        textAlign: 'right',
        paddingRight: 5,
    },
    tableFooter: {
        backgroundColor: '#F8F9FA',
        fontWeight: 'bold',
    },
    tableSummary: {
        padding: 8,
        fontSize: 9,
        textAlign: 'right',
        borderTopWidth: 2,
        borderTopColor: '#000000',
    },

    // Work Scope Table (Professional Version)
    workScopeTableSection: {
        marginBottom: 25,
    },
    workScopeTable: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#000000',
        marginTop: 10,
    },
    workScopeHeader: {
        backgroundColor: '#28A745',
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    workScopeRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#CCCCCC',
    },
    workScopeCellNo: {
        width: '5%',
        padding: 2,
        fontSize: 9,
        borderRightWidth: 1,
        borderRightColor: '#000000',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    workScopeCellDesc: {
        width: '95%',
        padding: 2,
        fontSize: 9,
        textAlign: 'left',
    },
});

// Helper functions
const formatIndonesianDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName}, ${day} ${month} ${year}`;
};

const getCategoryLabel = (category: string) => {
    const map: Record<string, string> = {
        BEFORE: 'Sebelum Pekerjaan',
        PROCESS: 'Proses Pekerjaan',
        AFTER: 'Sesudah Pekerjaan',
    };
    return map[category] || category;
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// Helper function untuk menghitung tinggi yang dibutuhkan untuk foto
// const calculatePhotosHeight = (photoCount: number, photosPerPage: number = 20) => {
//     const rows = Math.ceil(photoCount / 4); // 4 photos per row
//     return rows * 75; // Approximate height per row
// };

// Helper function untuk memisahkan foto per halaman
const chunkPhotos = (photos: BAPPhoto[], photosPerPage: number = 20) => {
    const chunks = [];
    for (let i = 0; i < photos.length; i += photosPerPage) {
        chunks.push(photos.slice(i, i + photosPerPage));
    }
    return chunks;
};

export function BAPPdfDocument({ bap }: { bap: BAPData }) {
    // Prepare work items data
    const logoPath = path.resolve('/LogoMd.png');
    const workItems = bap.salesOrder.items && bap.salesOrder.items.length > 0
        ? bap.salesOrder.items
        : [{
            id: '1',
            name: 'Pekerjaan Utama',
            description: bap.workDescription || 'Pekerjaan sesuai dengan spesifikasi yang telah disepakati',
            productId: 'default',
            qty: 1,
            price: 0,
            total: 0,
            uom: 'Paket'
        }];

    // Split photos into chunks for multiple pages
    const photoChunks = bap.photos ? chunkPhotos(bap.photos, 12) : []; // 20 photos per page
    const totalPhotoPages = photoChunks.length;

    // Calculate total pages
    const totalPages = 2 + totalPhotoPages; // Main pages + photo pages

    return (
        <Document>
            {/* Page 1 - Main Content */}
            <Page size="A4" style={styles.page}>
                {/* Header Container dengan Logo dan Company Info */}
                <View style={styles.headerContainer}>
                    <PdfImage style={styles.logo} src={logoPath} />
                    <View style={styles.companyInfo}>
                        <Text style={{ color: '#008000', fontWeight: 'bold', fontSize: 12, marginBottom: 5 }}>
                            PT. RYLIF MIKRO MANDIRI
                        </Text>
                        <Text>Office: Jl. Anyar RT. 01/RW. 01, Kampung Pulo, No. 5</Text>
                        <Text>Kemang Pratama, Bekasi Barat, Bekasi - 17144, Indonesia</Text>
                        <Text>Phone: 0857-7414-8874 | Email: rylifmikromandiri@gmail.com</Text>
                    </View>
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.mainTitle}>BERITA ACARA SERAH TERIMA PEKERJAAN</Text>
                    <Text style={styles.projectValueHeader}>{bap.bapNumber}</Text>
                </View>
                {/* Date Section */}
                <View style={styles.dateSection}>
                    <Text style={styles.dateText}>
                        Pada hari ini, {formatIndonesianDate(bap.bapDate)}, yang bertanda tangan di bawah ini:
                    </Text>
                </View>

                {/* First Party */}
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

                    <Text style={styles.partyDesignation}>
                        Dalam hal ini bertindak untuk dan atas nama Pelaksana Pekerjaan, selanjutnya disebut PIHAK PERTAMA.
                    </Text>
                </View>

                {/* Second Party */}
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

                    <Text style={styles.partyDesignation}>
                        Dalam hal ini bertindak untuk dan atas nama Pemberi Tugas, selanjutnya disebut PIHAK KEDUA.
                    </Text>
                </View>

                {/* Project Information */}
                <View style={styles.projectSection}>
                    <Text style={styles.sectionTitle}>
                        Kedua belah pihak sepakat untuk mengadakan serah terima pekerjaan:
                    </Text>

                    <View style={styles.projectTable}>
                        <View style={styles.projectRow}>
                            <Text style={styles.projectLabel}>Nama Proyek</Text>
                            <Text style={styles.projectValue}>{bap.salesOrder.project?.name}</Text>
                        </View>
                        <View style={styles.projectRow}>
                            <Text style={styles.projectLabel}>Tanggal Pengerjaan</Text>
                            <Text style={styles.projectValue}>
                                {bap.salesOrder.spk && bap.salesOrder.spk.length > 0 ? (
                                    <>
                                        {formatIndonesianDate(bap.salesOrder.spk[0].spkDate)} - {bap.salesOrder.spk[0].spkNumber}
                                    </>
                                ) : (
                                    "Tidak ada SPK"
                                )}
                            </Text>
                        </View>

                        {/* 
                        <View style={styles.projectRow}>
                            <Text style={styles.projectLabel}>Lokasi</Text>
                            <Text style={styles.projectValue}>Area Unit Kerja : {bap.salesOrder.project?.location}</Text>
                        </View> */}
                    </View>
                </View>

                {/* Agreement Text */}
                <View style={styles.agreementSection}>
                    <Text style={styles.agreementText}>
                        Setelah diadakan pemeriksaan bersama, kedua belah Pihak sepakat bahwa pekerjaan tersebut
                        di atas telah dilaksanakan dan diselesaikan dengan baik oleh Pihak Pertama.
                    </Text>
                    <Text style={styles.agreementText}>
                        Demikianlah Berita Acara Serah Terima Pekerjaan ini dibuat 2 (dua) rangkap asli
                        yang masing-masing memiliki kekuatan hukum yang sama setelah ditandatangani oleh
                        Para Pihak, serta merupakan satu kesatuan yang tidak terpisahkan dengan Perjanjian.
                    </Text>
                </View>

                {/* Signatures */}
                <View style={styles.signatureSection}>
                    {/* First Party Signature */}
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureTitle}>PIHAK PERTAMA</Text>

                        <View style={{ height: 60, marginVertical: 10 }}>
                            {/* Space for signature */}
                        </View>

                        <View style={styles.signatureLine}></View>
                        <Text style={styles.signatureInfo}>{bap.user.namaLengkap}</Text>
                        <Text style={styles.signatureInfo}>Pelaksana Pekerjaan</Text>
                    </View>

                    {/* Second Party Signature */}
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureTitle}>PIHAK KEDUA</Text>

                        <View style={{ height: 60, marginVertical: 10 }}>
                            {/* Space for signature */}
                        </View>

                        <View style={styles.signatureLine}></View>
                        <Text style={styles.signatureInfo}>{bap.salesOrder.customer.contactPerson}</Text>
                        <Text style={styles.signatureInfo}>Perwakilan Pelanggan</Text>
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footer} fixed>
                    Dokumen ini dicetak secara elektronik pada {format(new Date(), "dd MMMM yyyy 'pukul' HH:mm")} •
                    BAST No: {bap.bapNumber} • Halaman 1 dari {totalPages}
                </Text>
            </Page>

            {/* Second Page for Photos and Work Scope Table */}
            <Page size="A4" style={styles.page}>
                {/* Header Container untuk Halaman Kedua */}
                <View style={styles.headerContainer}>
                    <PdfImage style={styles.logo} src={logoPath} />
                    <View style={styles.companyInfo}>
                        <Text style={{ color: '#008000', fontWeight: 'bold', fontSize: 12, marginBottom: 5 }}>
                            PT. RYLIF MIKRO MANDIRI
                        </Text>
                        <Text>Office: Jl. Anyar RT. 01/RW. 01, Kampung Pulo, No. 5</Text>
                        <Text>Kemang Pratama, Bekasi Barat, Bekasi - 17144, Indonesia</Text>
                        <Text>Phone: 0857-7414-8874 | Email: rylifmikromandiri@gmail.com</Text>
                    </View>
                </View>

                {/* Header for Second Page */}
                <View style={styles.header}>
                    <Text style={styles.mainTitle}>LAMPIRAN DOKUMENTASI DAN RINCIAN PEKERJAAN</Text>
                    <Text style={styles.dateText}>Berita Acara Serah Terima No: {bap.bapNumber}</Text>
                </View>

                {/* Professional Work Scope Table */}
                <View style={styles.workScopeTableSection}>
                    <Text style={styles.sectionTitle}>RINCIAN CAKUPAN PEKERJAAN</Text>

                    <View style={styles.workScopeTable}>
                        {/* Table Header */}
                        <View style={[styles.workScopeRow, styles.workScopeHeader]}>
                            <Text style={styles.workScopeCellNo}>NO</Text>
                            <Text style={styles.workScopeCellDesc}>URAIAN PEKERJAAN</Text>
                        </View>

                        {/* Work Items */}
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

                    {/* Work Completion Note */}
                    <View style={{ marginTop: 15, padding: 10, backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#CCCCCC' }}>
                        <Text style={{ fontSize: 9, fontStyle: 'italic', textAlign: 'justify' }}>
                            <Text style={{ fontWeight: 'bold' }}>Catatan: </Text>
                            Semua item pekerjaan di atas telah diselesaikan sesuai dengan spesifikasi dan standar kualitas yang disepakati
                            oleh kedua belah pihak. Pekerjaan telah diperiksa dan dinyatakan memenuhi persyaratan teknis serta
                            keselamatan kerja yang berlaku.
                        </Text>
                    </View>
                </View>

                {/* Footer for Second Page */}
                <Text style={styles.footer} fixed>
                    Lampiran Berita Acara Serah Terima No: {bap.bapNumber} • Halaman 2 dari {totalPages}
                </Text>
            </Page>

            {/* Additional Pages for Photos Only */}
            {photoChunks.map((photoChunk, pageIndex) => (
                <Page key={`photo-page-${pageIndex}`} size="A4" style={styles.photoPage}>
                    {/* Header untuk Halaman Foto */}
                    <View style={styles.headerContainer}>
                        <PdfImage style={styles.logo} src={logoPath} />
                        <View style={styles.companyInfo}>
                            <Text style={{ color: '#008000', fontWeight: 'bold', fontSize: 12, marginBottom: 5 }}>
                                PT. RYLIF MIKRO MANDIRI
                            </Text>
                            <Text>Office: Jl. Anyar RT. 01/RW. 01, Kampung Pulo, No. 5</Text>
                            <Text>Kemang Pratama, Bekasi Barat, Bekasi - 17144, Indonesia</Text>
                            <Text>Phone: 0857-7414-8874 | Email: rylifmikromandiri@gmail.com</Text>
                        </View>
                    </View>

                    {/* Header for Photo Pages */}
                    <View style={styles.header}>
                        <Text style={styles.mainTitle}>DOKUMENTASI FOTO</Text>
                        <Text style={styles.dateText}>Berita Acara Serah Terima No: {bap.bapNumber}</Text>
                        <Text style={{ fontSize: 9, marginTop: 5 }}>
                            Halaman Foto {pageIndex + 1} dari {totalPhotoPages} • Total {bap.photos?.length} foto
                        </Text>
                    </View>

                    {/* Photos Section */}
                    <View style={styles.photoSection}>
                        <Text style={styles.sectionTitle}>
                            Dokumentasi Foto ({pageIndex + 1}/{totalPhotoPages})
                        </Text>

                        <View style={styles.photoGrid}>
                            {photoChunk.map((photo, index) => (
                                <View key={photo.id || `${pageIndex}-${index}`} style={styles.photoItem}>
                                    <View style={styles.photoImageContainer}>
                                        <PdfImage
                                            style={styles.photoImage}
                                            src={getFullImageUrl(photo.photoUrl)}
                                        />
                                    </View>
                                    <Text style={styles.photoCaption}>
                                        {getCategoryLabel(photo.category)}
                                    </Text>
                                    <Text style={styles.photoCaption}>
                                        Foto {(pageIndex * 20) + index + 1}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Footer for Photo Pages */}
                    <Text style={styles.footer} fixed>
                        Dokumentasi Foto Berita Acara Serah Terima No: {bap.bapNumber} •
                        Halaman {3 + pageIndex} dari {totalPages} •
                        Foto {pageIndex + 1}/{totalPhotoPages}
                    </Text>
                </Page>
            ))}
        </Document>
    );
}