import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image as PdfImage,
} from '@react-pdf/renderer';

interface StockOpnameFormItem {
    productName: string;
    productCode: string;
    stockSistem: number;
    satuan: string;
}

interface StockOpnameFormGroup {
    warehouseId: string;
    warehouseName: string;
    items: StockOpnameFormItem[];
}

interface StockOpnamePdfProps {
    data: StockOpnameFormGroup[];
    period: string;
    reportNumber?: string;
    warehouses?: { id: string; name: string; isMain: boolean; isWip: boolean }[];
}

const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontFamily: 'Helvetica',
        fontSize: 8,
        backgroundColor: '#FFFFFF',
    },
    headerContainer: {
        paddingVertical: 10,
        paddingHorizontal: 22,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: '#7c3aed',
        borderBottomStyle: 'solid',
    },
    logo: {
        width: 110,
        height: 38,
        objectFit: 'contain',
    },
    documentInfo: {
        alignItems: 'flex-end',
    },
    documentTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#5b21b6',
        marginBottom: 6,
        letterSpacing: 0.8,
    },
    formLabel: {
        fontSize: 7,
        color: '#ef4444',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginTop: 2,
        textAlign: 'right',
        letterSpacing: 0.5,
    },
    reportNumberBox: {
        backgroundColor: '#7c3aed',
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 3,
    },
    reportNumberText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    infoBand: {
        paddingVertical: 8,
        paddingHorizontal: 22,
        backgroundColor: '#faf5ff',
        borderBottomWidth: 1,
        borderBottomColor: '#e9d5ff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoLabel: {
        fontSize: 8,
        color: '#7c3aed',
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    infoValue: {
        fontSize: 9,
        color: '#4c1d95',
        fontWeight: 'bold',
    },
    instructionBand: {
        marginHorizontal: 22,
        marginTop: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    instructionIcon: {
        width: 14,
        height: 14,
        backgroundColor: '#ef4444',
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
    },
    instructionIconText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: 'bold',
    },
    instructionText: {
        fontSize: 7.5,
        color: '#991b1b',
        fontWeight: 'bold',
    },
    warehouseTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: '#7c3aed',
        paddingVertical: 5,
        paddingHorizontal: 22,
        marginTop: 10,
        marginHorizontal: 22,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    tableContainer: {
        marginHorizontal: 22,
        borderWidth: 1,
        borderColor: '#e9d5ff',
        borderTopWidth: 0,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
    },
    tableHeaderCell: {
        paddingVertical: 8,
        paddingHorizontal: 6,
        color: '#f1f5f9',
        fontSize: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        borderRightWidth: 1,
        borderRightColor: '#334155',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e9d5ff',
        minHeight: 32,
        alignItems: 'center',
    },
    tableRowEven: {
        backgroundColor: '#faf5ff',
    },
    tableCell: {
        paddingVertical: 8,
        paddingHorizontal: 6,
        fontSize: 8,
        color: '#334155',
        borderRightWidth: 1,
        borderRightColor: '#e9d5ff',
    },
    cellNo: { width: '6%', textAlign: 'center' },
    cellProduct: { width: '32%' },
    cellStockSystem: { width: '16%', textAlign: 'center' },
    cellStockActual: { width: '16%', textAlign: 'center' },
    cellSatuan: { width: '12%', textAlign: 'center' },
    cellKeterangan: { width: '18%' },
    productName: {
        fontWeight: 'bold',
        color: '#1e293b',
        fontSize: 8.5,
    },
    productCode: {
        fontSize: 7,
        color: '#94a3b8',
        marginTop: 2,
    },
    stockSystemValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#4b5563',
    },
    stockActualInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderStyle: 'dashed',
        borderRadius: 3,
        minHeight: 24,
        paddingVertical: 3,
        paddingHorizontal: 6,
        backgroundColor: '#f9fafb',
    },
    stockActualInputText: {
        fontSize: 8,
        color: '#9ca3af',
        textAlign: 'center',
    },
    keteranganInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderStyle: 'dashed',
        borderRadius: 3,
        minHeight: 24,
        paddingVertical: 3,
        paddingHorizontal: 6,
        backgroundColor: '#f9fafb',
    },
    keteranganInputText: {
        fontSize: 8,
        color: '#9ca3af',
    },
    summaryBand: {
        marginHorizontal: 22,
        marginTop: 8,
        marginBottom: 12,
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryItemLabel: {
        fontSize: 7,
        color: '#64748b',
        marginBottom: 3,
        textTransform: 'uppercase',
    },
    summaryItemValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    signatureSection: {
        marginHorizontal: 22,
        marginTop: 14,
        marginBottom: 45,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: 150,
        alignItems: 'center',
    },
    signatureLabel: {
        fontSize: 7.5,
        color: '#64748b',
        marginBottom: 28,
        fontWeight: 'bold',
    },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: '#94a3b8',
        width: 130,
        marginBottom: 4,
    },
    signatureNameHint: {
        fontSize: 7,
        color: '#9ca3af',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingVertical: 10,
        paddingHorizontal: 22,
        backgroundColor: '#faf5ff',
        borderTopWidth: 1,
        borderTopColor: '#e9d5ff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 7.5,
        color: '#7c3aed',
    },
    pageNumber: {
        fontSize: 8.5,
        color: '#4c1d95',
        fontWeight: 'bold',
    },
});

const formatNumber = (num: number) =>
    new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);

const StockOpnamePdf: React.FC<StockOpnamePdfProps> = ({
    data,
    period,
    reportNumber = `SO-FORM-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    warehouses = [],
}) => {
    const logoPath = '/LogoMd.png';

    if (!data || data.length === 0) {
        return (
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={styles.headerContainer}>
                        <View><PdfImage style={styles.logo} src={logoPath} /></View>
                        <View style={styles.documentInfo}>
                            <Text style={styles.documentTitle}>FORM STOCK OPNAME</Text>
                            <View style={styles.reportNumberBox}>
                                <Text style={styles.reportNumberText}>{reportNumber}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, color: '#94a3b8' }}>Tidak ada data stok untuk gudang ini</Text>
                    </View>
                </Page>
            </Document>
        );
    }

    return (
        <Document>
            {data.map((group, groupIndex) => (
                <Page key={`${group.warehouseId}-${groupIndex}`} size="A4" style={styles.page}>
                    <View style={styles.headerContainer}>
                        <View><PdfImage style={styles.logo} src={logoPath} /></View>
                        <View style={styles.documentInfo}>
                            <Text style={styles.documentTitle}>FORM STOCK OPNAME</Text>
                            <Text style={styles.formLabel}>Form Pengecekan Fisik</Text>
                        </View>
                    </View>

                    <View style={styles.infoBand}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Gudang: </Text>
                            <Text style={styles.infoValue}>{group.warehouseName}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Periode: </Text>
                            <Text style={styles.infoValue}>{period}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Tgl Cetak: </Text>
                            <Text style={styles.infoValue}>
                                {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Jml Item: </Text>
                            <Text style={styles.infoValue}>{group.items.length} produk</Text>
                        </View>
                    </View>

                    <View style={styles.instructionBand}>
                        <View style={styles.instructionIcon}>
                            <Text style={styles.instructionIconText}>!</Text>
                        </View>
                        <View>
                            <Text style={styles.instructionText}>Isi kolom "STOK ACTUAL" dan "KETERANGAN" sesuai hasil pengecekan fisik di gudang</Text>
                        </View>
                    </View>

                    <Text style={styles.warehouseTitle}>Gudang: {group.warehouseName}</Text>

                    <View style={styles.tableContainer}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderCell, styles.cellNo]}>#</Text>
                            <Text style={[styles.tableHeaderCell, styles.cellProduct]}>PRODUK</Text>
                            <Text style={[styles.tableHeaderCell, styles.cellStockSystem]}>STOK SISTEM</Text>
                            <Text style={[styles.tableHeaderCell, styles.cellStockActual]}>STOK ACTUAL</Text>
                            <Text style={[styles.tableHeaderCell, styles.cellSatuan]}>SATUAN</Text>
                            <Text style={[styles.tableHeaderCell, styles.cellKeterangan]}>KETERANGAN</Text>
                        </View>

                        {group.items.map((item, idx) => (
                            <View key={idx} style={[styles.tableRow, idx % 2 === 0 ? styles.tableRowEven : {}]} wrap={false}>
                                <Text style={[styles.tableCell, styles.cellNo]}>{idx + 1}</Text>
                                <View style={[styles.tableCell, styles.cellProduct]}>
                                    <Text style={styles.productName}>{item.productName}</Text>
                                    {item.productCode && <Text style={styles.productCode}>{item.productCode}</Text>}
                                </View>
                                <View style={[styles.tableCell, styles.cellStockSystem]}>
                                    <Text style={styles.stockSystemValue}>{formatNumber(item.stockSistem)}</Text>
                                </View>
                                <View style={[styles.tableCell, styles.cellStockActual]}>
                                    <View style={styles.stockActualInput}>
                                        <Text style={styles.stockActualInputText}>...........</Text>
                                    </View>
                                </View>
                                <View style={[styles.tableCell, styles.cellSatuan]}>
                                    <Text style={{ fontSize: 8.5, color: '#6b7280', fontWeight: 'bold' }}>{item.satuan || '-'}</Text>
                                </View>
                                <View style={[styles.tableCell, styles.cellKeterangan]}>
                                    <View style={styles.keteranganInput}>
                                        <Text style={styles.keteranganInputText}>................................</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={styles.summaryBand}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryItemLabel}>Total Produk</Text>
                            <Text style={styles.summaryItemValue}>{group.items.length}</Text>
                        </View>
                        <View style={[styles.summaryItem, { flex: 1.5 }]}>
                            <Text style={styles.summaryItemLabel}>Total Stok Sistem</Text>
                            <Text style={[styles.summaryItemValue, { color: '#7c3aed' }]}>
                                {formatNumber(group.items.reduce((s, i) => s + i.stockSistem, 0))}
                            </Text>
                        </View>
                        <View style={[styles.summaryItem, { flex: 2 }]}>
                            <Text style={styles.summaryItemLabel}>Total Stok Actual (diisi manual)</Text>
                            <View style={{ borderBottomWidth: 1, borderBottomColor: '#cbd5e1', width: 120, marginTop: 4 }} />
                        </View>
                    </View>

                    <View style={styles.signatureSection}>
                        <View style={styles.signatureBox}>
                            <Text style={styles.signatureLabel}>Petugas Opname</Text>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureNameHint}>(Nama & Tgl)</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <Text style={styles.signatureLabel}>Mengetahui,</Text>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureNameHint}>(Supervisor/Gudang)</Text>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>PT. Rylif Mikro Mandiri | Form Stock Opname</Text>
                        <Text style={styles.pageNumber}>Hlm {groupIndex + 1}/{data.length}</Text>
                    </View>
                </Page>
            ))}
        </Document>
    );
};

export default StockOpnamePdf;
