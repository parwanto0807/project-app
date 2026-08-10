import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image as PdfImage } from '@react-pdf/renderer';
import { format } from 'date-fns';

// ===== SHARED STYLES =====
const shared = StyleSheet.create({
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
    },
});

// ===== JOB DESCRIPTION STYLES (existing look) =====
const jdStyles = StyleSheet.create({
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
});

// ===== SOP STYLES (distinct professional SOP format) =====
const sopStyles = StyleSheet.create({
    banner: {
        backgroundColor: '#1e40af',
        paddingVertical: 18,
        paddingHorizontal: 20,
        marginBottom: 16,
        borderLeftWidth: 6,
        borderLeftColor: '#f59e0b',
    },
    bannerLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#93c5fd',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 4,
    },
    bannerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textTransform: 'uppercase',
    },
    controlTable: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 4,
        marginBottom: 20,
        overflow: 'hidden',
    },
    controlCell: {
        width: '50%',
        padding: 6,
        borderBottomWidth: 0.5,
        borderRightWidth: 0.5,
        borderColor: '#e2e8f0',
    },
    controlCellWide: {
        width: '50%',
        padding: 6,
        borderBottomWidth: 0.5,
        borderColor: '#e2e8f0',
    },
    controlLabel: {
        fontSize: 7,
        color: '#64748b',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    controlValue: {
        fontSize: 9,
        color: '#0f172a',
        fontWeight: 'bold',
        marginTop: 1,
    },
    intro: {
        fontSize: 10,
        color: '#334155',
        marginBottom: 22,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#f1f5f9',
        borderRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: '#1e40af',
    },
    section: {
        marginBottom: 22,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: '#eff6ff',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#2563eb',
    },
    sectionNumber: {
        backgroundColor: '#2563eb',
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 3,
        marginRight: 8,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1e3a8a',
        textTransform: 'uppercase',
    },
    sectionContent: {
        fontSize: 10,
        color: '#334155',
        marginBottom: 8,
        paddingHorizontal: 18,
    },
    itemList: {
        paddingLeft: 18,
    },
    itemRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    itemStep: {
        width: 26,
        fontSize: 10,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    itemText: {
        flex: 1,
        fontSize: 10,
        color: '#334155',
        lineHeight: 1.4,
    },
    approvalTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1e3a8a',
        textAlign: 'center',
        marginBottom: 14,
        textTransform: 'uppercase',
    },
});

const logoPath = '/LogoMd.png';

interface DocumentPdfPreviewProps {
    data: any;
    employeeName?: string | null;
}

const DocumentPdfPreview = ({ data, employeeName }: DocumentPdfPreviewProps) => {
    const company = (
        <View style={shared.companyInfo}>
            <Text style={{ color: '#008000', fontWeight: 'bold', fontSize: 12, marginBottom: 5 }}>
                PT. RYLIF MIKRO MANDIRI
            </Text>
            <Text>Jln. Arjuna RT. 04/RW. 36, Kampung Pulo Resident 1 No. 6</Text>
            <Text>Kampung Pulo Warung Asem, Sumber Jaya, Bekasi - 17510, Indonesia</Text>
            <Text>Phone: 0857-7414-8874 | Email: rylifmikromandiri@gmail.com</Text>
        </View>
    );

    const departmentNames = (data.departments || [])
        .map((d: any) => d.department?.name || d.department?.code || '')
        .filter(Boolean)
        .join(', ') || '-';

    const employeeNames = employeeName ||
        (data.employees && data.employees.length > 0
            ? data.employees.map((e: any) => e.karyawan.namaLengkap).join(', ')
            : null);

    const approvalFooter = (
        <View style={shared.footerContainer} wrap={false}>
            <View style={shared.approvalBox}>
                <Text>Dibuat Oleh,</Text>
                <View style={shared.signatureSpace} />
                <View style={shared.signatureLine}>
                    <Text style={shared.signerName}>Human Resources</Text>
                    <Text style={shared.signerTitle}>Personnel Dept.</Text>
                </View>
            </View>
            <View style={shared.approvalBox}>
                <Text>Disetujui Oleh,</Text>
                <View style={shared.signatureSpace} />
                <View style={shared.signatureLine}>
                    <Text style={shared.signerName}>General Manager</Text>
                    <Text style={shared.signerTitle}>Authorized Signature</Text>
                </View>
            </View>
        </View>
    );

    const pageFooter = (
        <View style={shared.pageFooter} fixed>
            <Text>
                Properti Rahasia PT. RYLIF MIKRO MANDIRI. Dilarang menggandakan tanpa izin.
            </Text>
            <Text render={({ pageNumber, totalPages }) => (
                `Halaman ${pageNumber} dari ${totalPages}`
            )} />
        </View>
    );

    const isSop = data.type === 'SOP';

    return (
        <Document>
            {isSop ? (
                // ============ SOP LAYOUT ============
                <Page size="A4" style={shared.page}>
                    {/* Header Section */}
                    <View style={shared.headerContainer}>
                        <PdfImage style={shared.logo} src={logoPath} />
                        {company}
                    </View>

                    {/* SOP Banner */}
                    <View style={sopStyles.banner}>
                        <Text style={sopStyles.bannerLabel}>Prosedur Operasi Standar</Text>
                        <Text style={sopStyles.bannerTitle}>{data.title}</Text>
                    </View>

                    {/* Document Control Table */}
                    <View style={sopStyles.controlTable}>
                        <View style={sopStyles.controlCell}>
                            <Text style={sopStyles.controlLabel}>No. Dokumen</Text>
                            <Text style={sopStyles.controlValue}>{data.version || '-'}</Text>
                        </View>
                        <View style={sopStyles.controlCell}>
                            <Text style={sopStyles.controlLabel}>Departemen</Text>
                            <Text style={sopStyles.controlValue}>{departmentNames}</Text>
                        </View>
                        <View style={sopStyles.controlCell}>
                            <Text style={sopStyles.controlLabel}>Tanggal Berlaku</Text>
                            <Text style={sopStyles.controlValue}>
                                {format(new Date(data.createdAt), 'dd MMM yyyy')}
                            </Text>
                        </View>
                        {employeeNames && (
                            <View style={sopStyles.controlCell}>
                                <Text style={sopStyles.controlLabel}>Karyawan Terkait</Text>
                                <Text style={sopStyles.controlValue}>{employeeNames}</Text>
                            </View>
                        )}
                    </View>

                    {/* Introduction Content */}
                    {data.content && (
                        <View style={sopStyles.intro}>
                            <Text>{data.content}</Text>
                        </View>
                    )}

                    {/* Document Sections */}
                    {data.sections.map((section: any, index: number) => (
                        <View key={section.id} style={sopStyles.section} wrap={false}>
                            <View style={sopStyles.sectionHeader}>
                                <Text style={sopStyles.sectionNumber}>{index + 1}</Text>
                                <Text style={sopStyles.sectionTitle}>{section.title}</Text>
                            </View>

                            {section.content && (
                                <Text style={sopStyles.sectionContent}>{section.content}</Text>
                            )}

                            <View style={sopStyles.itemList}>
                                {section.items.map((item: any) => (
                                    <View key={item.id} style={sopStyles.itemRow}>
                                        <Text style={sopStyles.itemStep}>{item.itemNumber}</Text>
                                        <Text style={sopStyles.itemText}>{item.content}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}

                    {/* Approval Section */}
                    <Text style={sopStyles.approvalTitle}>Persetujuan Dokumen</Text>
                    {approvalFooter}

                    {pageFooter}
                </Page>
            ) : (
                // ============ JOB DESCRIPTION LAYOUT ============
                <Page size="A4" style={shared.page}>
                    {/* Header Section */}
                    <View style={shared.headerContainer}>
                        <PdfImage style={shared.logo} src={logoPath} />
                        {company}
                    </View>

                    {/* Title Section */}
                    <View style={jdStyles.docTitleSection}>
                        <Text style={jdStyles.docTypeBadge}>
                            Deskripsi Jabatan
                        </Text>
                        <Text style={jdStyles.docTitle}>{data.title}</Text>
                    </View>

                    {/* Metadata Grid */}
                    <View style={jdStyles.metaGrid}>
                        <View style={jdStyles.metaItem}>
                            <Text style={jdStyles.metaLabel}>Departemen</Text>
                            <Text style={jdStyles.metaValue}>{departmentNames}</Text>
                        </View>
                        {employeeNames && (
                            <View style={jdStyles.metaItem}>
                                <Text style={jdStyles.metaLabel}>Karyawan Terkait</Text>
                                <Text style={jdStyles.metaValue}>{employeeNames}</Text>
                            </View>
                        )}
                        <View style={jdStyles.metaItem}>
                            <Text style={jdStyles.metaLabel}>NO FORM DOKUMENT</Text>
                            <Text style={jdStyles.metaValue}>{data.version}</Text>
                        </View>
                        <View style={jdStyles.metaItem}>
                            <Text style={jdStyles.metaLabel}>Tanggal Berlaku</Text>
                            <Text style={jdStyles.metaValue}>
                                {format(new Date(data.createdAt), 'dd MMM yyyy')}
                            </Text>
                        </View>
                    </View>

                    {/* Introduction Content */}
                    {data.content && (
                        <View style={jdStyles.introContent}>
                            <Text>{data.content}</Text>
                        </View>
                    )}

                    {/* Document Sections */}
                    {data.sections.map((section: any, index: number) => (
                        <View key={section.id} style={jdStyles.section} wrap={false}>
                            <View style={jdStyles.sectionHeader}>
                                <Text style={jdStyles.sectionNumber}>{index + 1}</Text>
                                <Text style={jdStyles.sectionTitle}>{section.title}</Text>
                            </View>

                            {section.content && (
                                <Text style={jdStyles.sectionContent}>{section.content}</Text>
                            )}

                            <View style={jdStyles.itemList}>
                                {section.items.map((item: any) => (
                                    <View key={item.id} style={jdStyles.itemRow}>
                                        <Text style={jdStyles.itemBullet}>{item.itemNumber}</Text>
                                        <Text style={jdStyles.itemText}>{item.content}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}

                    {/* Footer / Approval Section */}
                    {approvalFooter}

                    {pageFooter}
                </Page>
            )}
        </Document>
    );
};

export default DocumentPdfPreview;
