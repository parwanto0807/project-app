// components/spk/SPKPDF.tsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image as PdfImage } from '@react-pdf/renderer';
import { SpkPdfValues } from '@/lib/validations/spk-mapper';

// Register a font to ensure it's embedded in the PDF
Font.register({
    family: "Oswald",
    src: "/fonts/Oswald-Regular.ttf",
});

type Karyawan = {
    id: string;
    nama: string;
    jabatan?: string | null;
    nik?: string;
};

type Team = {
    id: string;
    namaTeam: string;
};

type SalesOrder = {
    id: string;
    soNumber: string;
    customerName: string;
    projectName: string;
    project?: {
        id: string;
        name: string;
    }
};

type SalesOrderItem = {
    id: string;
    name: string;
    description?: string | null;
    qty: number;
    uom?: string | null;
};

export interface SPKDetail {
    id: string;
    karyawan?: Karyawan | null;
    salesOrderItem?: SalesOrderItem | null;
    lokasiUnit?: string | null;
}

export interface SPKPDFProps {
    data: {
        spkNumber: string;
        spkDate: Date;
        createdBy: Karyawan;
        salesOrder: SalesOrder;
        team?: Team | null;
        details: SPKDetail[];
        notes?: string | null;
    };
}

export interface SpkFormValuesPdfProps {
    spkNumber: string; // wajib
    spkDate: Date | string;
    salesOrderId: string;
    teamId: string;
    createdById: string;
    createdBy: {
        id: string;
        nama: string;
        jabatan?: string | null;
        nik?: string;
    };
    salesOrder: {
        id: string;
        soNumber: string;
        customerName: string;
        projectName: string;
        project: {
            id: string;
            name: string;
        }
    };
    team?: {
        id: string;
        nama: string;
    } | null;
    details: {
        id: string;
        karyawan?: {
            id: string;
            nama: string;
        };
        salesOrderItem?: {
            id: string;
            name: string;
            description?: string;
            qty: number;
            uom: string;
        };
        lokasiUnit?: string | null;
    }[];
    notes?: string | null;
}


const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 20,
        fontFamily: 'Helvetica'
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 15,
    },
    logo: {
        width: 100,
        height: 50,
        marginRight: -20,
    },
    headerTextContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    header: {
        fontSize: 18,
        textAlign: 'center',
        fontWeight: 'bold',
        textDecoration: 'underline',
        marginBottom: 2,
    },
    subHeader: {
        fontSize: 14,
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    mainContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    leftSection: {
        width: '60%',
    },
    rightSection: {
        width: '35%',
    },
    section: {
        marginBottom: 10,
    },
    fieldRow: {
        flexDirection: "row",
        marginBottom: 4,
        alignItems: 'flex-start',
    },
    fieldLabel: {
        width: "30%",
        fontSize: 10,
        fontWeight: "bold",
    },
    colon: {
        width: "3%",
        fontSize: 10,
        paddingTop: 1,
    },
    fieldValue: {
        flex: 1,
        fontSize: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: "#000000",
        minHeight: 12,
    },
    table: {
        display: 'flex',
        width: '100%',
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#000000',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        minHeight: 20,
    },
    tableHeader: {
        backgroundColor: '#F0F0F0',
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        fontWeight: 'bold',
    },
    tableCell: {
        padding: 2,
        fontSize: 9,
        borderRightWidth: 1,
        borderRightColor: '#000000',
    },
    colNo: {
        width: '8%',
        textAlign: 'center',
    },
    colPekerjaan: {
        width: '42%',
    },
    colLokasi: {
        width: '20%',
    },
    colJumlah: {
        width: '10%',
        textAlign: 'center',
    },
    colSatuan: {
        width: '10%',
        textAlign: 'center',
    },
    colPelaksana: {
        width: '20%',
        borderRightWidth: 0,
    },
    notesSection: {
        marginTop: 10,
        fontSize: 10,
    },
    notesLabel: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    notesValue: {
        borderBottomWidth: 0.5,
        borderBottomColor: "#000000",
        minHeight: 40,
    },
    signatureSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 40,
    },
    signatureBox: {
        alignItems: 'center',
        width: '45%',
    },
    signatureLine: {
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        marginBottom: 5,
        height: 30,
    },
    signatureLabel: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    pageNumber: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 10,
        color: 'grey',
    },
});

// Fungsi untuk mapping data form ke format PDF
export function mapToFormDataSpk(formData: SpkPdfValues): SpkFormValuesPdfProps {
    return {
        spkNumber: formData.spkNumber,
        spkDate: formData.spkDate.toDateString(),
        salesOrderId: formData.salesOrder?.id || "",
        teamId: formData.team?.id || "",
        createdById: formData.createdBy.id,
        createdBy: {
            id: formData.createdBy.id,
            nama: formData.createdBy.namaLengkap, // Map namaLengkap ke nama
            jabatan: formData.createdBy.jabatan || null,
            nik: formData.createdBy.nik || undefined // Tambahkan nik
        },
        salesOrder: {
            id: formData.salesOrder.id,
            soNumber: formData.salesOrder.soNumber,
            customerName: formData.salesOrder.customerName,
            projectName: formData.salesOrder.projectName,
            project: {
                id: formData.salesOrder.project?.id || "",
                name: formData.salesOrder.project?.name || "",
            }
        },
        team: formData.team ? {
            id: formData.team.id,
            nama: formData.team.namaTeam
        } : undefined,
        details: formData.details.map(detail => ({
            id: detail.id,
            karyawan: detail.karyawan
                ? {
                    id: detail.karyawan?.id,
                    nama: detail.karyawan?.namaLengkap // Map namaLengkap ke nama
                } : undefined,
            salesOrderItem: detail.salesOrderItem ? {
                id: detail.salesOrderItem.id,
                name: detail.salesOrderItem.name,
                description: detail.salesOrderItem.description ?? undefined,
                qty: detail.salesOrderItem.qty,
                uom: detail.salesOrderItem.uom ?? "",
            } : undefined,
            lokasiUnit: detail.lokasiUnit ?? null
        })) || [],
        notes: formData.notes
    };
}

export const SPKPDF: React.FC<SPKPDFProps> = ({ data }) => {
    const formatDate = (date: Date) => {
        const day = date.getDate();
        const month = date.toLocaleString('id-ID', { month: 'long' });
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    };

    // Fungsi untuk memecah details menjadi chunks (15 details per halaman)
    const chunkDetails = (details: SPKDetail[], chunkSize: number = 15) => {
        const chunks = [];
        for (let i = 0; i < details.length; i += chunkSize) {
            chunks.push(details.slice(i, i + chunkSize));
        }
        return chunks;
    };

    const detailChunks = chunkDetails(data.details);
    const totalPages = Math.max(detailChunks.length, 1);

    return (
        <Document>
            {detailChunks.map((chunk, pageIndex) => (
                <Page
                    key={pageIndex}
                    size="A4"
                    style={styles.page}
                >
                    {/* Header dengan Logo */}
                    <View style={styles.headerContainer}>
                        <PdfImage
                            style={styles.logo}
                            src="/Logo.png"
                        />
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.header}>SURAT PERINTAH KERJA (SPK)</Text>
                            <Text style={styles.subHeader}>PT. CONTOH PERUSAHAAN</Text>
                        </View>
                        <View style={{ width: 100 }}></View>
                    </View>

                    {/* Informasi SPK */}
                    <View style={styles.mainContainer}>
                        <View style={styles.leftSection}>
                            <View style={styles.section}>
                                <View style={styles.fieldRow}>
                                    <Text style={styles.fieldLabel}>NO. SPK</Text>
                                    <Text style={styles.colon}>:</Text>
                                    <Text style={styles.fieldValue}>{data.spkNumber}</Text>
                                </View>

                                <View style={styles.fieldRow}>
                                    <Text style={styles.fieldLabel}>TANGGAL</Text>
                                    <Text style={styles.colon}>:</Text>
                                    <Text style={styles.fieldValue}>{formatDate(data.spkDate)}</Text>
                                </View>

                                <View style={styles.fieldRow}>
                                    <Text style={styles.fieldLabel}>DIBUAT OLEH</Text>
                                    <Text style={styles.colon}>:</Text>
                                    <Text style={styles.fieldValue}>
                                        {data.createdBy.nama} {data.createdBy.jabatan && `(${data.createdBy.jabatan})`}
                                    </Text>
                                </View>

                                <View style={styles.fieldRow}>
                                    <Text style={styles.fieldLabel}>TIM PELAKSANA</Text>
                                    <Text style={styles.colon}>:</Text>
                                    <Text style={styles.fieldValue}>
                                        {data.team ? data.team.namaTeam : 'Individu'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.rightSection}>
                            <View style={styles.section}>
                                <View style={styles.fieldRow}>
                                    <Text style={styles.fieldLabel}>NO. SO</Text>
                                    <Text style={styles.colon}>:</Text>
                                    <Text style={styles.fieldValue}>{data.salesOrder.soNumber}</Text>
                                </View>

                                <View style={styles.fieldRow}>
                                    <Text style={styles.fieldLabel}>CUSTOMER</Text>
                                    <Text style={styles.colon}>:</Text>
                                    <Text style={styles.fieldValue}>{data.salesOrder.customerName}</Text>
                                </View>

                                <View style={styles.fieldRow}>
                                    <Text style={styles.fieldLabel}>PROJECT</Text>
                                    <Text style={styles.colon}>:</Text>
                                    <Text style={styles.fieldValue}>{data.salesOrder.projectName}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Tabel Detail Pekerjaan */}
                    <View style={styles.section}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}>
                            DETAIL PEKERJAAN {totalPages > 1 ? `(Halaman ${pageIndex + 1} dari ${totalPages})` : ''}
                        </Text>
                        <View style={styles.table}>
                            {/* Table Header */}
                            <View style={[styles.tableRow, styles.tableHeader]}>
                                <Text style={[styles.tableCell, styles.colNo]}>NO</Text>
                                <Text style={[styles.tableCell, styles.colPekerjaan]}>URAIAN PEKERJAAN</Text>
                                <Text style={[styles.tableCell, styles.colLokasi]}>LOKASI/UNIT</Text>
                                <Text style={[styles.tableCell, styles.colJumlah]}>JUMLAH</Text>
                                <Text style={[styles.tableCell, styles.colSatuan]}>SATUAN</Text>
                                <Text style={[styles.tableCell, styles.colPelaksana]}>PELAKSANA</Text>
                            </View>

                            {/* Table Rows untuk chunk ini */}
                            {chunk.map((detail, index) => {
                                const globalIndex = pageIndex * 15 + index;
                                const pekerjaan = detail.salesOrderItem?.name || 'Tugas Khusus';
                                const deskripsi = detail.salesOrderItem?.description || '';
                                const uraianPekerjaan = deskripsi ? `${pekerjaan} - ${deskripsi}` : pekerjaan;

                                return (
                                    <View key={detail.id} style={styles.tableRow}>
                                        <Text style={[styles.tableCell, styles.colNo]}>{globalIndex + 1}</Text>
                                        <Text style={[styles.tableCell, styles.colPekerjaan]}>{uraianPekerjaan}</Text>
                                        <Text style={[styles.tableCell, styles.colLokasi]}>{detail.lokasiUnit || '-'}</Text>
                                        <Text style={[styles.tableCell, styles.colJumlah]}>
                                            {detail.salesOrderItem?.qty || '-'}
                                        </Text>
                                        <Text style={[styles.tableCell, styles.colSatuan]}>
                                            {detail.salesOrderItem?.uom || '-'}
                                        </Text>
                                        <Text style={[styles.tableCell, styles.colPelaksana]}>
                                            {detail.karyawan?.nama || 'Tim'}
                                        </Text>
                                    </View>
                                );
                            })}

                            {/* Tambahkan row kosong jika chunk kurang dari 15 */}
                            {Array.from({ length: 15 - chunk.length }).map((_, emptyIndex) => (
                                <View key={`empty-${emptyIndex}`} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.colNo]}>{chunk.length + emptyIndex + 1}</Text>
                                    <Text style={[styles.tableCell, styles.colPekerjaan]}></Text>
                                    <Text style={[styles.tableCell, styles.colLokasi]}></Text>
                                    <Text style={[styles.tableCell, styles.colJumlah]}></Text>
                                    <Text style={[styles.tableCell, styles.colSatuan]}></Text>
                                    <Text style={[styles.tableCell, styles.colPelaksana]}></Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Catatan hanya ditampilkan di halaman terakhir */}
                    {pageIndex === detailChunks.length - 1 && data.notes && (
                        <View style={styles.notesSection}>
                            <Text style={styles.notesLabel}>CATATAN:</Text>
                            <View style={styles.notesValue}>
                                <Text>{data.notes}</Text>
                            </View>
                        </View>
                    )}

                    {/* Tanda tangan hanya ditampilkan di halaman terakhir */}
                    {pageIndex === detailChunks.length - 1 && (
                        <View style={styles.signatureSection}>
                            <View style={styles.signatureBox}>
                                <Text style={styles.signatureLabel}>Yang Memberi Perintah,</Text>
                                <View style={styles.signatureLine}></View>
                                <Text style={styles.signatureLabel}>{data.createdBy.nama}</Text>
                                <Text style={styles.signatureLabel}>{data.createdBy.jabatan}</Text>
                            </View>

                            <View style={styles.signatureBox}>
                                <Text style={styles.signatureLabel}>Yang Menerima Perintah,</Text>
                                <View style={styles.signatureLine}></View>
                                <Text style={styles.signatureLabel}>
                                    {data.team ? `Koordinator ${data.team.namaTeam}` : 'Pelaksana'}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Page Number */}
                    <Text style={styles.pageNumber}>
                        Halaman {pageIndex + 1} dari {totalPages}
                    </Text>
                </Page>
            ))}
        </Document>
    );
};