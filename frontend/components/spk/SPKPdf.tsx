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
    namaLengkap?: string;
    jabatan?: string | null;
    nik?: string | null | undefined;
    departemen?: string | null;
};

type TeamKaryawan = {
    teamId: string;
    karyawan?: Karyawan;
};

type Team = {
    id: string;
    namaTeam: string;
    teamKaryawan?: TeamKaryawan | null; // ← opsional, dan isinya objek tunggal
};

type SalesOrder = {
    id: string;
    soNumber: string;
    projectName: string;
    customer: {
        name: string;      // diisi dari customer.name
        address: string;   // ✅ baru
        branch: string;    // ✅ baru
    }
    project?: {
        id: string;
        name: string;
    }
    items: SalesOrderItem[];
};

type SalesOrderItem = {
    id: string;
    lineNo: number;
    itemType: string;
    name: string;
    description?: string | null;
    qty: number;
    uom?: string | null;
    unitPrice: number;
    discount: number;
    taxRate: number;
    lineTotal: number;
};

type SalesOrderItemSPK = {
    id: string;
    name: string;
    description?: string;
    qty: number;
    uom?: string | null;
} | null;


export interface SPKDetail {
    id: string;
    karyawan?: Karyawan | null;
    salesOrderItem?: SalesOrderItemSPK | null;
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
    id: string;
    spkNumber: string;
    spkDate: Date;
    salesOrderId: string;
    teamId: string;
    createdById: string;

    createdBy: {
        id: string;
        namaLengkap: string;
        jabatan?: string | null;
        nik?: string | null;
        departemen?: string | null;
    };

    salesOrder: {
        id: string;
        soNumber: string;
        projectName: string;
        customer: {
            name: string;      // diisi dari customer.name
            address: string;   // ✅ baru
            branch: string;    // ✅ baru
        }
        project?: {
            id: string;
            name: string;
        };
        items: {
            id: string;
            lineNo: number;
            itemType: string;
            name: string;
            description?: string | null;
            qty: number;
            uom?: string | null;
            unitPrice: number;
            discount: number;
            taxRate: number;
            lineTotal: number;
        }[];
    };

    team?: {
        id: string;
        namaTeam: string;
        teamKaryawan?: {
            teamId: string;
            karyawan?: {
                namaLengkap: string;
                jabatan: string;
                departemen: string;
            };
        };
    } | null;

    details: {
        id: string;
        karyawan?: {
            id: string;
            namaLengkap: string;
            jabatan: string;
            departemen: string;
            nik: string;
        };
        salesOrderItem?: {
            id: string;
            name: string;
            description?: string;
            qty: number;
            uom?: string | null;
        };
        lokasiUnit?: string | null;
    }[];

    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 20,
        fontFamily: 'Helvetica',
        fontSize: 10,
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
    titleContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    header: {
        fontSize: 16,
        textAlign: 'center',
        fontWeight: 'bold',
        textDecoration: 'underline',
        marginBottom: 5,
        fontFamily: 'Oswald', // ← TELAH DITAMBAHKAN!
    },
    mainContainer: {
        marginBottom: 10,
    },
    section: {
        marginBottom: 10,
    },
    fieldRow: {
        flexDirection: "row",
        marginBottom: 5,
        alignItems: 'flex-start',
    },
    fieldLabel: {
        width: "25%",
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
        paddingBottom: 2,
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
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
    },
    colNo: {
        width: '5%',
        textAlign: 'center',
    },
    colNama: {
        width: '65%',
    },
    colJabatan: {
        width: '30%',
        borderRightWidth: 0,
    },
    colPekerjaan: {
        width: '65%',
    },
    colLokasi: {
        width: '30%',
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
        justifyContent: 'flex-start',
        marginTop: 20,
    },
    signatureBox: {
        alignItems: 'center',
        width: '45%',
    },
    signatureLine: {
        width: '80%',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        marginBottom: 5,
        height: 50,
    },
    signatureLabel: {
        alignItems: 'center',
        fontSize: 10,
        fontWeight: 'bold',
    },
    lampiranSection: {
        marginTop: 10,
        fontSize: 10,
    },
    tembusanSection: {
        marginTop: 10,
        fontSize: 10,
    },
    dateLocation: {
        marginTop: 20,
        textAlign: 'right',
        fontSize: 10,
        marginBottom: 1,
    },
    footerContainer: {
        marginTop: 10,
    },
});

export function mapToFormDataSpk(
    formData: SpkPdfValues
): SpkFormValuesPdfProps {
    return {
        id: formData.id,
        spkNumber: formData.spkNumber,
        spkDate: formData.spkDate,
        salesOrderId: formData.salesOrder?.id || "",
        teamId: formData.team?.id || "",
        createdById: formData.createdBy.id,

        createdBy: {
            id: formData.createdBy.id,
            namaLengkap: formData.createdBy.namaLengkap,
            jabatan: formData.createdBy.jabatan ?? null,
            nik: formData.createdBy.nik ?? null,
            departemen: formData.createdBy.departemen ?? null,
        },

        salesOrder: {
            id: formData.salesOrder?.id || "",
            soNumber: formData.salesOrder?.soNumber || "",
            projectName: formData.salesOrder?.projectName || "",
            customer: {
                name: formData.salesOrder.customer.name,
                address: formData.salesOrder.customer.address,
                branch: formData.salesOrder.customer.branch,
            },
            project: formData.salesOrder?.project
                ? {
                    id: formData.salesOrder.project.id || "",
                    name: formData.salesOrder.project.name || "",
                }
                : undefined,
            items:
                formData.salesOrder?.items?.map((item) => ({
                    id: item.id,
                    lineNo: item.lineNo,
                    itemType: item.itemType,
                    name: item.name,
                    description: item.description ?? null,
                    qty: item.qty,
                    uom: item.uom ?? null,
                    unitPrice: item.unitPrice,
                    discount: item.discount,
                    taxRate: item.taxRate,
                    lineTotal: item.lineTotal,
                })) || [],
        },

        team: formData.team
            ? {
                id: formData.team.id,
                namaTeam: formData.team.namaTeam,
                teamKaryawan: formData.team.teamKaryawan
                    ? {
                        teamId: formData.team.teamKaryawan.teamId || "",
                        karyawan: formData.team.teamKaryawan.karyawan
                            ? {
                                namaLengkap:
                                    formData.team.teamKaryawan.karyawan.namaLengkap || "",
                                jabatan:
                                    formData.team.teamKaryawan.karyawan.jabatan || "",
                                departemen:
                                    formData.team.teamKaryawan.karyawan.departemen || "",
                            }
                            : undefined,
                    }
                    : undefined,
            }
            : undefined,

        details: formData.details.map((detail) => ({
            id: detail.id,
            karyawan: detail.karyawan
                ? {
                    id: detail.karyawan.id,
                    namaLengkap: detail.karyawan.namaLengkap,
                    jabatan: detail.karyawan.jabatan,
                    nik: detail.karyawan.nik,
                    departemen: detail.karyawan.departemen,
                }
                : undefined,
            salesOrderItem: detail.salesOrderItem
                ? {
                    id: detail.salesOrderItem.id,
                    name: detail.salesOrderItem.name,
                    description: detail.salesOrderItem.description ?? undefined,
                    qty: detail.salesOrderItem.qty,
                    uom: detail.salesOrderItem.uom ?? null,
                }
                : undefined,
            lokasiUnit: detail.lokasiUnit ?? null,
        })),

        notes: formData.notes ?? null,
        createdAt: formData.createdAt,
        updatedAt: formData.updatedAt,
    };
}

const getUniqueKaryawans = (details: SPKDetail[]): Karyawan[] => {
    const seen = new Set<string>();
    return details
        .filter(d => d.karyawan)
        .map(d => d.karyawan!)
        .filter(k => {
            if (seen.has(k.id)) return false;
            seen.add(k.id);
            return true;
        });
};

export const SPKPDF: React.FC<SPKPDFProps> = ({ data }) => {
    const formatDate = (date: Date) => {
        const day = date.getDate();
        const month = date.toLocaleString('id-ID', { month: 'long' });
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    };
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <PdfImage style={styles.logo} src="/Logo.png" />
                    <View style={styles.companyInfo}>
                        <Text style={{ color: '#008000', fontWeight: 'bold', fontSize: 12 }}>PT. RYLIF MIKRO MANDIRI</Text>
                        <Text>Office: Jl. Anyar RT. 01/RW. 01, Kampung Pulo, No. 5</Text>
                        <Text>Kemang Pratama, Bekasi Barat, Bekasi - 17144, Indonesia</Text>
                        <Text>Phone: 0857-7414-8874 | Email: rylifmikromandiri@gmail.com</Text>
                    </View>
                </View>

                {/* Judul */}
                <View style={styles.titleContainer}>
                    <Text style={styles.header}>SURAT PERINTAH KERJA (SPK)</Text>
                    <Text style={styles.colon}>:</Text>
                    <Text style={styles.fieldValue}>{data.spkNumber}</Text>
                </View>

                {/* Informasi Pemberi Perintah */}
                <View style={styles.section}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>
                        Yang Bertanda Tangan dibawah ini :
                    </Text>

                    <View style={styles.fieldRow}>
                        <Text style={styles.fieldLabel}>Nama</Text>
                        <Text style={styles.colon}>:</Text>
                        <Text style={styles.fieldValue}>{data.createdBy.namaLengkap}</Text>
                    </View>

                    <View style={styles.fieldRow}>
                        <Text style={styles.fieldLabel}>Jabatan</Text>
                        <Text style={styles.colon}>:</Text>
                        <Text style={styles.fieldValue}>{data.createdBy.jabatan || '-'}</Text>
                    </View>

                    <View style={styles.fieldRow}>
                        <Text style={styles.fieldLabel}>Divisi</Text> {/* ← Diperbaiki */}
                        <Text style={styles.colon}>:</Text>
                        <Text style={styles.fieldValue}>{data.createdBy.departemen}</Text> {/* ← Diperbaiki */}
                    </View>

                    <View style={styles.fieldRow}>
                        <Text style={styles.fieldLabel}>Tanggal</Text>
                        <Text style={styles.colon}>:</Text>
                        <Text style={styles.fieldValue}>{formatDate(data.spkDate)}</Text>
                    </View>

                    <View style={styles.fieldRow}>
                        <Text style={styles.fieldLabel}>No. SO</Text> {/* ← Diperbaiki */}
                        <Text style={styles.colon}>:</Text>
                        <Text style={styles.fieldValue}>{data.salesOrder.soNumber}</Text>
                    </View>
                </View>

                {/* Penerima Perintah */}
                <View style={styles.section}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>
                        Memberikan perintah kerja kepada :
                    </Text>

                    <View style={styles.table}>
                        {/* Header */}
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={[styles.tableCell, styles.colNo]}>No</Text>
                            <Text style={[styles.tableCell, styles.colNama]}>Nama</Text>
                            <Text style={[styles.tableCell, styles.colJabatan]}>Jabatan / Section</Text>
                        </View>

                        {/* Isi: Semua karyawan unik dari details */}
                        {getUniqueKaryawans(data.details).map((karyawan, index) => (
                            <View key={karyawan.id} style={styles.tableRow}>
                                <Text style={[styles.tableCell, styles.colNo]}>{index + 1}</Text>
                                <Text style={[styles.tableCell, styles.colNama]}>{karyawan.namaLengkap || '-'}</Text>
                                <Text style={[styles.tableCell, styles.colJabatan]}>{karyawan.jabatan || '-'} - {karyawan.departemen}</Text>
                            </View>
                        ))}

                        {/* Jika tidak ada karyawan di details, gunakan createdBy sebagai fallback */}
                        {getUniqueKaryawans(data.details).length === 0 && (
                            <View key="fallback-createdby" style={styles.tableRow}>
                                <Text style={[styles.tableCell, styles.colNo]}>1</Text>
                                <Text style={[styles.tableCell, styles.colNama]}>{data.createdBy.namaLengkap}</Text>
                                <Text style={[styles.tableCell, styles.colJabatan]}>{data.createdBy.jabatan || "Team Pelaksana"}</Text>
                            </View>
                        )}

                        {/* Isi sisa hingga 5 baris */}
                        {Array.from({
                            length: Math.max(0, 5 - getUniqueKaryawans(data.details).length),
                        }).map((_, index) => (
                            <View key={`empty-${index}`} style={styles.tableRow}>
                                <Text style={[styles.tableCell, styles.colNo]}>{getUniqueKaryawans(data.details).length + index + 1}</Text>
                                <Text style={[styles.tableCell, styles.colNama]}></Text>
                                <Text style={[styles.tableCell, styles.colJabatan]}></Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Daftar Pekerjaan */}
                <View style={styles.section}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>
                        Untuk melakukan pekerjaan :
                    </Text>

                    <View style={styles.table}>
                        {/* Header */}
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={[styles.tableCell, styles.colNo]}>No</Text>
                            <Text style={[styles.tableCell, styles.colPekerjaan]}>Nama Pekerjaan</Text>
                            <Text style={[styles.tableCell, styles.colLokasi]}>Jumlah  / Unit</Text>
                        </View>

                        {/* Isi dari salesOrder.items */}
                        {data.salesOrder.items && data.salesOrder.items.length > 0 ? (
                            data.salesOrder.items.map((item, index) => (
                                <View key={item.id} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.colNo]}>{index + 1}</Text>
                                    <Text style={[styles.tableCell, styles.colPekerjaan]}>
                                        {item.name || 'Tugas Khusus'}
                                        {/* {item.description ? ` - ${item.description}` : ''} */}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.colLokasi]}>
                                        {item.qty > 0 ? `${item.qty} ${item.uom || 'unit'}` : '-'}
                                    </Text>
                                </View>
                            ))
                        ) : (
                            // Jika tidak ada item, tampilkan satu baris kosong atau pesan
                            <View key="no-items" style={styles.tableRow}>
                                <Text style={[styles.tableCell, styles.colNo]}>1</Text>
                                <Text style={[styles.tableCell, styles.colPekerjaan]}>Tidak ada item pekerjaan</Text>
                                <Text style={[styles.tableCell, styles.colLokasi]}>-</Text>
                            </View>
                        )}

                        {/* Isi sisa hingga 5 baris jika perlu */}
                        {data.salesOrder.items && data.salesOrder.items.length > 0 && (
                            Array.from({
                                length: Math.max(0, 5 - data.salesOrder.items.length),
                            }).map((_, emptyIndex) => (
                                <View key={`empty-item-${emptyIndex}`} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.colNo]}>{data.salesOrder.items.length + emptyIndex + 1}</Text>
                                    <Text style={[styles.tableCell, styles.colPekerjaan]}></Text>
                                    <Text style={[styles.tableCell, styles.colLokasi]}></Text>
                                </View>
                            ))
                        )}

                        {/* Jika tidak ada items sama sekali, isi 5 baris kosong */}
                        {!data.salesOrder.items || data.salesOrder.items.length === 0 && (
                            Array.from({ length: 5 }).map((_, index) => (
                                <View key={`empty-all-${index}`} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.colNo]}>{index + 1}</Text>
                                    <Text style={[styles.tableCell, styles.colPekerjaan]}></Text>
                                    <Text style={[styles.tableCell, styles.colLokasi]}></Text>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                {/* Catatan */}
                <View style={styles.section}>
                    <Text style={{ fontSize: 10, fontStyle: 'italic' }}>
                        Demikian surat perintah ini dibuat, agar dapat dipergunakan dan dilaksanakan sebaik-baiknya dengan penuh tanggung jawab. Jika nantinya terdapat suatu kondisi diluar ketentuan surat perintah ini, maka dapat dibicarakan lebih lanjut.
                    </Text>
                </View>

                {/* Note */}
                {data.notes && (
                    <View style={styles.notesSection}>
                        <Text style={styles.notesLabel}>Note :</Text>
                        <Text style={styles.notesValue}>{data.notes}</Text>
                    </View>
                )}

                {/* Lampiran */}
                <View style={styles.lampiranSection}>
                    <Text style={styles.notesLabel}>Lampiran :</Text>
                    <Text>1. Laporan Progress Pekerjaan (LPP)</Text>
                </View>

                {/* Tembusan dan Footer dalam satu baris */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginRight: 30 }}>
                    {/* Tembusan di sebelah kiri */}
                    <View style={{ width: '45%' }}>
                        <Text style={styles.notesLabel}>Tembusan :</Text>
                        <Text>1. Direktur PT. RYLIF MIKRO MANDIRI</Text>
                        <Text>2. Logistic</Text>
                        <Text>3. Operasional Team</Text>
                    </View>

                    <View style={{ width: '45%', alignItems: 'center' }}>
                        <View style={{ marginBottom: 5 }}>
                            <Text>.........  /  ....................</Text>
                        </View>

                        <View style={{ alignItems: 'center' }}>
                            <Text style={styles.signatureLabel}>Diterima oleh,</Text>
                            <View style={styles.signatureLine}></View>
                            <Text style={styles.signatureLabel}>( _____________________ )</Text>
                        </View>
                    </View>

                    {/* Footer: Tanggal, Lokasi, dan Tanda Tangan di sebelah kanan */}
                    <View style={{ width: '45%', alignItems: 'flex-end' }}>
                        <View style={{ marginBottom: 5 }}>
                            <Text>Bekasi, {formatDate(data.spkDate)}</Text>
                        </View>

                        <View style={{ alignItems: 'center' }}>
                            <Text style={styles.signatureLabel}>Hormat Kami,</Text>
                            <View style={styles.signatureLine}></View>
                            <Text style={styles.signatureLabel}>({data.createdBy.namaLengkap})</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};