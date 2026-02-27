import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image as PdfImage } from '@react-pdf/renderer';
import path from 'path';
import { format } from 'date-fns';

// Create styles mimicking the professional invoice style
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        lineHeight: 1.5,
        backgroundColor: '#FFFFFF',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#000000',
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
    docTitleSection: {
        marginBottom: 25,
        textAlign: 'center',
    },
    docTypeBadge: {
        fontSize: 9,
        color: '#008000',
        fontWeight: 'bold',
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    docTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        textTransform: 'uppercase',
    },
    metaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#f9fafb',
        padding: 12,
        borderRadius: 4,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    metaItem: {
        width: '25%',
        padding: 4,
        textAlign: 'center',
    },
    metaLabel: {
        fontSize: 8,
        color: '#6b7280',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    metaValue: {
        fontSize: 9,
        color: '#111827',
        fontWeight: 'bold',
    },
    introContent: {
        fontSize: 10,
        fontStyle: 'italic',
        color: '#4b5563',
        marginBottom: 30,
        paddingLeft: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#008000',
    },
    section: {
        marginBottom: 25,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingBottom: 5,
    },
    sectionNumber: {
        backgroundColor: '#008000',
        color: '#FFFFFF',
        width: 18,
        height: 18,
        borderRadius: 9,
        textAlign: 'center',
        fontSize: 9,
        fontWeight: 'bold',
        marginRight: 10,
        paddingTop: 2,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#111827',
    },
    sectionContent: {
        fontSize: 10,
        color: '#374151',
        marginBottom: 10,
        paddingLeft: 28,
    },
    itemList: {
        paddingLeft: 28,
    },
    itemRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    itemBullet: {
        width: 25,
        fontSize: 10,
        fontWeight: 'bold',
        color: '#008000',
    },
    itemText: {
        flex: 1,
        fontSize: 10,
        color: '#374151',
        lineHeight: 1.4,
    },
    footerContainer: {
        marginTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    approvalBox: {
        width: '40%',
        textAlign: 'center',
    },
    signatureSpace: {
        height: 60,
    },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: '#000000',
        marginTop: 10,
        paddingTop: 5,
    },
    signerName: {
        fontWeight: 'bold',
        fontSize: 10,
    },
    signerTitle: {
        fontSize: 9,
        color: '#6b7280',
    },
    pageFooter: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 10,
        fontSize: 8,
        color: '#9ca3af',
        textAlign: 'center',
    }
});

interface DocumentPdfPreviewProps {
    data: any;
    employeeName?: string | null;
}

const DocumentPdfPreview = ({ data, employeeName }: DocumentPdfPreviewProps) => {
    const logoPath = '/LogoMd.png'; // Assuming same logo as invoice

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header Section */}
                <View style={styles.headerContainer}>
                    <PdfImage style={styles.logo} src={logoPath} />
                    <View style={styles.companyInfo}>
                        <Text style={{ color: '#008000', fontWeight: 'bold', fontSize: 12, marginBottom: 5 }}>
                            PT. RYLIF MIKRO MANDIRI
                        </Text>
                        <Text>Jln. Arjuna RT. 04/RW. 36, Kampung Pulo Resident 1 No. 6</Text>
                        <Text>Kampung Pulo Warung Asem, Sumber Jaya, Bekasi - 17510, Indonesia</Text>
                        <Text>Phone: 0857-7414-8874 | Email: rylifmikromandiri@gmail.com</Text>
                    </View>
                </View>

                {/* Title Section */}
                <View style={styles.docTitleSection}>
                    <Text style={styles.docTypeBadge}>
                        {data.type === 'JOB_DESCRIPTION' ? 'Deskripsi Jabatan' : 'Prosedur Operasi Standar'}
                    </Text>
                    <Text style={styles.docTitle}>{data.title}</Text>
                </View>

                {/* Metadata Grid */}
                <View style={styles.metaGrid}>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Departemen</Text>
                        <Text style={styles.metaValue}>
                            {data.departments.map((d: any) => d.department.name).join(', ')}
                        </Text>
                    </View>
                    {(employeeName || (data.employees && data.employees.length > 0)) && (
                        <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>Karyawan Terkait</Text>
                            <Text style={styles.metaValue}>
                                {employeeName || data.employees.map((e: any) => e.karyawan.namaLengkap).join(', ')}
                            </Text>
                        </View>
                    )}
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>NO FORM DOKUMENT</Text>
                        <Text style={styles.metaValue}>{data.version}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Tanggal Berlaku</Text>
                        <Text style={styles.metaValue}>
                            {format(new Date(data.createdAt), 'dd MMM yyyy')}
                        </Text>
                    </View>
                </View>

                {/* Introduction Content */}
                {data.content && (
                    <View style={styles.introContent}>
                        <Text>{data.content}</Text>
                    </View>
                )}

                {/* Document Sections */}
                {data.sections.map((section: any, index: number) => (
                    <View key={section.id} style={styles.section} wrap={false}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionNumber}>{index + 1}</Text>
                            <Text style={styles.sectionTitle}>{section.title}</Text>
                        </View>

                        {section.content && (
                            <Text style={styles.sectionContent}>{section.content}</Text>
                        )}

                        <View style={styles.itemList}>
                            {section.items.map((item: any) => (
                                <View key={item.id} style={styles.itemRow}>
                                    <Text style={styles.itemBullet}>{item.itemNumber}</Text>
                                    <Text style={styles.itemText}>{item.content}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Footer / Approval Section */}
                <View style={styles.footerContainer} wrap={false}>
                    <View style={styles.approvalBox}>
                        <Text>Dibuat Oleh,</Text>
                        <View style={styles.signatureSpace} />
                        <View style={styles.signatureLine}>
                            <Text style={styles.signerName}>Human Resources</Text>
                            <Text style={styles.signerTitle}>Personnel Dept.</Text>
                        </View>
                    </View>
                    <View style={styles.approvalBox}>
                        <Text>Disetujui Oleh,</Text>
                        <View style={styles.signatureSpace} />
                        <View style={styles.signatureLine}>
                            <Text style={styles.signerName}>General Manager</Text>
                            <Text style={styles.signerTitle}>Authorized Signature</Text>
                        </View>
                    </View>
                </View>

                {/* Page Footer */}
                <View style={styles.pageFooter} fixed>
                    <Text>
                        Properti Rahasia PT. RYLIF MIKRO MANDIRI. Dilarang menggandakan tanpa izin.
                    </Text>
                    <Text render={({ pageNumber, totalPages }) => (
                        `Halaman ${pageNumber} dari ${totalPages}`
                    )} />
                </View>
            </Page>
        </Document>
    );
};

export default DocumentPdfPreview;
