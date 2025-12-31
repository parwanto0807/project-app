import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image as PdfImage,
} from '@react-pdf/renderer';

interface StockBalanceData {
    id: string;
    productId: string;
    warehouseId: string;
    warehouseName?: string;
    stockAwal: number | string;
    stockIn: number | string;
    stockOut: number | string;
    stockAkhir: number | string;
    bookedStock: number | string;
    availableStock: number | string;
    onPR: number | string;
    inventoryValue: number | string;
    product?: {
        name: string;
        code?: string;
    };
}

interface StockBalancePdfProps {
    data: StockBalanceData[];
    warehouseName: string;
    period: string;
    companyInfo: {
        name: string;
        address: string;
        phone?: string;
        email?: string;
        logo?: string;
    };
    reportNumber?: string;
}

const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontFamily: 'Helvetica',
        fontSize: 9,
        backgroundColor: '#FFFFFF',
    },

    // ============ HEADER DESIGN ============
    headerContainer: {
        paddingVertical: 10,
        paddingHorizontal: 25,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#1a56db',
        borderBottomStyle: 'solid',
    },

    logoSection: {
        flex: 1,
    },

    logo: {
        width: 120,
        height: 40,
        objectFit: 'contain',
    },

    documentInfo: {
        flex: 2,
        alignItems: 'flex-end',
    },

    documentTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a237e',
        marginBottom: 8,
        letterSpacing: 0.8,
    },

    reportNumberBox: {
        backgroundColor: '#1a56db',
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 4,
    },

    reportNumberText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },

    // ============ COMPANY INFO ============
    companyInfoSection: {
        padding: 15,
        backgroundColor: '#f8fafc',
    },

    companyName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1a237e',
        marginBottom: 4,
    },

    companyDetails: {
        marginBottom: 10,
    },

    companyAddress: {
        fontSize: 9,
        color: '#64748b',
        lineHeight: 1.4,
    },

    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        marginLeft: 16,
        gap: 20,
        justifyContent: 'space-between',
    },

    infoItem: {
        minWidth: 180,
        justifyContent: 'center',
    },

    infoLabel: {
        fontSize: 8,
        color: '#64748b',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },

    infoValue: {
        fontSize: 11,
        fontWeight: 'semibold',
        color: '#1a237e',
    },

    // ============ METRICS BAR ============
    // ============ METRICS BAR ============
    metricsBar: {
        marginHorizontal: 25,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 4,
        overflow: 'hidden',
    },

    metricsGrid: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
    },

    metricItem: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 4,
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#e2e8f0',
    },

    metricItemLast: {
        borderRightWidth: 0,
    },

    metricValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 2,
    },

    metricLabel: {
        fontSize: 7,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // ============ TABLE STYLES ============
    tableContainer: {
        margin: 25,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },

    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        paddingVertical: 10,
    },

    tableHeaderCell: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        color: '#f1f5f9',
        fontSize: 9,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        borderRightWidth: 1,
        borderRightColor: '#334155',
    },

    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        minHeight: 28,
        alignItems: 'center',
    },

    tableRowEven: {
        backgroundColor: '#f8fafc',
    },

    tableCell: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 9,
        color: '#334155',
        borderRightWidth: 1,
        borderRightColor: '#e2e8f0',
    },

    cellText: {
        textAlign: 'left',
    },

    cellCenter: {
        textAlign: 'center',
    },

    cellRight: {
        textAlign: 'right',
    },

    productName: {
        fontWeight: 'semibold',
        color: '#1a237e',
    },

    productCode: {
        fontSize: 8,
        color: '#94a3b8',
        marginTop: 2,
    },

    // ============ STATUS INDICATORS ============
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        alignSelf: 'center',
    },

    statusSafe: {
        backgroundColor: '#d1fae5',
    },

    statusWarning: {
        backgroundColor: '#fef3c7',
    },

    statusCritical: {
        backgroundColor: '#fee2e2',
    },

    statusText: {
        fontSize: 8,
        fontWeight: 'bold',
    },

    statusTextSafe: {
        color: '#065f46',
    },

    statusTextWarning: {
        color: '#92400e',
    },

    statusTextCritical: {
        color: '#dc2626',
    },

    // ============ MINIMAL SUMMARY TABLE ============
    summaryContainer: {
        marginHorizontal: 25,
        marginBottom: 25,
    },

    summaryTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1a237e',
        marginBottom: 12,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
        borderBottomStyle: 'solid',
    },

    summaryTable: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 6,
        overflow: 'hidden',
    },

    summaryTableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        backgroundColor: '#ffffff',
    },

    summaryTableRowHeader: {
        backgroundColor: '#f8fafc',
    },

    summaryTableCol: {
        padding: 10,
        borderRightWidth: 1,
        borderRightColor: '#e2e8f0',
    },

    summaryLabel: {
        fontSize: 9,
        color: '#64748b',
        fontWeight: 'bold',
    },

    summaryValue: {
        fontSize: 10,
        color: '#1a237e',
        fontWeight: 'semibold',
    },

    summaryHighlight: {
        color: '#1a56db',
        fontWeight: 'bold',
    },

    // ============ FOOTER ============
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingVertical: 12,
        paddingHorizontal: 25,
        backgroundColor: '#f8fafc',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    footerText: {
        fontSize: 8,
        color: '#64748b',
    },

    pageNumber: {
        fontSize: 9,
        color: '#1a237e',
        fontWeight: 'bold',
    },

    // ============ COLUMN WIDTHS ============
    colNo: { width: '4%' },
    colProduct: { width: '20%' },
    colNumber: { width: '9%' },
    colStatus: { width: '11%' },
    colValue: { width: '12%' },

    // Summary column widths
    sumCol1: { width: '25%' },
    sumCol2: { width: '25%' },
    sumCol3: { width: '25%' },
    sumCol4: { width: '25%' },

    // ============ WAREHOUSE GROUP TITLE ============
    warehouseTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1a237e',
        marginBottom: 0,
        marginTop: 0,
        backgroundColor: '#e0e7ff',
        padding: 6,
    },
});

interface StockBalancePdfProps {
    data: StockBalanceData[];
    warehouseName: string;
    period: string;
    companyInfo: {
        name: string;
        address: string;
        phone?: string;
        email?: string;
        logo?: string;
    };
    reportNumber?: string;
    warehouses?: { id: string; name: string; isMain: boolean; isWip: boolean }[];
}

const StockBalancePdf: React.FC<StockBalancePdfProps> = ({
    data,
    warehouseName,
    period,
    companyInfo,
    reportNumber = `SB-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    warehouses = [],
}) => {
    const logoPath = '/LogoMd.png';
    const totals = {
        stockAwal: data?.reduce((sum: number, item: StockBalanceData) => sum + Number(item.stockAwal || 0), 0) || 0,
        stockIn: data?.reduce((sum: number, item: StockBalanceData) => sum + Number(item.stockIn || 0), 0) || 0,
        stockOut: data?.reduce((sum: number, item: StockBalanceData) => sum + Number(item.stockOut || 0), 0) || 0,
        stockAkhir: data?.reduce((sum: number, item: StockBalanceData) => sum + Number(item.stockAkhir || 0), 0) || 0,
        bookedStock: data?.reduce((sum: number, item: StockBalanceData) => sum + Number(item.bookedStock || 0), 0) || 0,
        availableStock: data?.reduce((sum: number, item: StockBalanceData) => sum + Number(item.availableStock || 0), 0) || 0,
        onPR: data?.reduce((sum: number, item: StockBalanceData) => sum + Number(item.onPR || 0), 0) || 0,
        inventoryValue: data?.reduce((sum: number, item: StockBalanceData) => sum + Number(item.inventoryValue || 0), 0) || 0,
    };

    const formatNumber = (num: number) =>
        new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

    const formatCurrency = (num: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

    const getStockStatus = (available: number) => {
        if (available <= 0) return { badge: styles.statusCritical, text: styles.statusTextCritical, label: 'HABIS' };
        if (available < 10) return { badge: styles.statusWarning, text: styles.statusTextWarning, label: 'RENDAH' };
        return { badge: styles.statusSafe, text: styles.statusTextSafe, label: 'AMAN' };
    };

    // Group data by warehouse
    // Group data by warehouse using a Map to preserve insertion order if needed, but we will sort it anyway.
    const rawGroups = data?.reduce((groups, item) => {
        const id = item.warehouseId;
        if (!groups[id]) {
            groups[id] = {
                id,
                name: item.warehouseName || `Warehouse ${id}`,
                items: []
            };
        }
        groups[id].items.push(item);
        return groups;
    }, {} as Record<string, { id: string, name: string, items: StockBalanceData[] }>) || {};

    // Sort groups: "Main" or "Utama" first, then alphabetically
    // Sort items: Alphabetically by Product Name
    const sortedWarehouseGroups = Object.values(rawGroups)
        .sort((a: { id: string, name: string }, b: { id: string, name: string }) => {
            const whA = warehouses?.find(w => w.id === a.id);
            const whB = warehouses?.find(w => w.id === b.id);

            const isAMain = whA?.isMain || /main|utama/i.test(a.name);
            const isBMain = whB?.isMain || /main|utama/i.test(b.name);

            if (isAMain && !isBMain) return -1;
            if (!isAMain && isBMain) return 1;
            return a.name.localeCompare(b.name);
        })
        .map((group: any) => ({
            ...group,
            items: group.items.sort((a: StockBalanceData, b: StockBalanceData) => {
                const nameA = a.product?.name || '';
                const nameB = b.product?.name || '';
                return nameA.localeCompare(nameB);
            })
        }));

    return (
        <Document>
            {sortedWarehouseGroups.map((group, groupIndex) => (
                <Page key={group.id} size="A4" orientation="landscape" style={styles.page}>
                    {/* HEADER */}
                    <View style={styles.headerContainer}>
                        <View style={styles.logoSection}>
                            <PdfImage style={styles.logo} src={logoPath} />
                        </View>
                        <View style={styles.documentInfo}>
                            <Text style={styles.documentTitle}>REPORT STOCK BALANCE</Text>
                            <View style={styles.reportNumberBox}>
                                <Text style={styles.reportNumberText}>{reportNumber}</Text>
                            </View>
                        </View>
                    </View>

                    {/* COMPANY INFO */}
                    <View style={styles.companyInfoSection}>
                        {/* <View style={styles.companyDetails}>
                            <Text style={styles.companyName}>PT. RYLIF MIKRO MANDIRI</Text>
                            <Text style={styles.companyAddress}>
                                Jln. Arjuna RT. 04/RW. 36, Kampung Pulo Resident 1 No. 6{'\n'}
                                Kampung Pulo Warung Asem, Sumber Jaya, Bekasi{'\n'}
                                Tel: 0852-1929-6841 / 1857-7441-8078 | rylifmikromandiri@gmail.com
                            </Text>
                        </View> */}

                        <View style={styles.infoGrid}>
                            {/* <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Gudang</Text>
                                <Text style={styles.infoValue}>{group.name}</Text>
                            </View> */}
                            <View style={styles.infoItem}>
                                <Text style={[styles.infoLabel, { textAlign: 'center' }]}>Periode Laporan</Text>
                                <Text style={[styles.infoValue, { textAlign: 'center' }]}>{period}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Text style={[styles.infoLabel, { textAlign: 'center' }]}>Tanggal Cetak</Text>
                                <Text style={[styles.infoValue, { textAlign: 'center' }]}>
                                    {new Date().toLocaleDateString('id-ID', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Text style={[styles.infoLabel, { textAlign: 'center' }]}>Total Produk</Text>
                                <Text style={[styles.infoValue, { textAlign: 'center' }]}>{group.items.length} items</Text>
                            </View>
                        </View>
                    </View>

                    {/* WAREHOUSE TABLE */}
                    <View style={[styles.tableContainer, { marginTop: 10, marginBottom: 15 }]}>
                        <View wrap={false}>
                            <Text style={styles.warehouseTitle}>Gudang: {group.name}</Text>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderCell, styles.colNo, styles.cellCenter]}>#</Text>
                                <Text style={[styles.tableHeaderCell, styles.colProduct]}>PRODUK</Text>
                                <Text style={[styles.tableHeaderCell, styles.colNumber, styles.cellRight]}>STOK AWAL</Text>
                                <Text style={[styles.tableHeaderCell, styles.colNumber, styles.cellRight]}>MASUK</Text>
                                <Text style={[styles.tableHeaderCell, styles.colNumber, styles.cellRight]}>KELUAR</Text>
                                <Text style={[styles.tableHeaderCell, styles.colNumber, styles.cellRight]}>ON PR</Text>
                                <Text style={[styles.tableHeaderCell, styles.colNumber, styles.cellRight]}>BOOKED</Text>
                                <Text style={[styles.tableHeaderCell, styles.colNumber, styles.cellRight]}>STOK AKHIR</Text>
                                <Text style={[styles.tableHeaderCell, styles.colNumber, styles.cellRight]}>STOCK READY</Text>
                                <Text style={[styles.tableHeaderCell, styles.colStatus, styles.cellCenter]}>STATUS</Text>
                                <Text style={[styles.tableHeaderCell, styles.colValue, styles.cellRight]}>NILAI</Text>
                            </View>
                        </View>

                        <View>
                            {group.items.length > 0 ? (
                                group.items.map((item: StockBalanceData, index: number) => {
                                    const availableStock = Number(item.availableStock || 0);
                                    const status = getStockStatus(availableStock);

                                    return (
                                        <View key={item.id} wrap={false} style={[styles.tableRow, ...(index % 2 === 0 ? [styles.tableRowEven] : [])]}>
                                            <Text style={[styles.tableCell, styles.colNo, styles.cellCenter]}>{index + 1}</Text>
                                            <View style={[styles.tableCell, styles.colProduct]}>
                                                <Text style={styles.productName}>{item.product?.name || `Product ${item.productId}`}</Text>
                                                {item.product?.code && <Text style={styles.productCode}>{item.product.code}</Text>}
                                            </View>
                                            <Text style={[styles.tableCell, styles.colNumber, styles.cellRight, Number(item.stockAwal) !== 0 && { fontWeight: 'bold', color: '#000000' } as any]}>{formatNumber(Number(item.stockAwal))}</Text>
                                            <Text style={[styles.tableCell, styles.colNumber, styles.cellRight, Number(item.stockIn) !== 0 && { fontWeight: 'bold', color: '#000000' } as any]}>{formatNumber(Number(item.stockIn))}</Text>
                                            <Text style={[styles.tableCell, styles.colNumber, styles.cellRight, Number(item.stockOut) !== 0 && { fontWeight: 'bold', color: '#000000' } as any]}>{formatNumber(Number(item.stockOut))}</Text>
                                            <Text style={[styles.tableCell, styles.colNumber, styles.cellRight, Number(item.onPR) !== 0 && { fontWeight: 'bold', color: '#000000' } as any]}>{formatNumber(Number(item.onPR))}</Text>
                                            <Text style={[styles.tableCell, styles.colNumber, styles.cellRight, Number(item.bookedStock) !== 0 && { fontWeight: 'bold', color: '#000000' } as any]}>{formatNumber(Number(item.bookedStock))}</Text>
                                            <Text style={[styles.tableCell, styles.colNumber, styles.cellRight, Number(item.stockAkhir) !== 0 && { fontWeight: 'bold', color: '#000000' } as any]}>{formatNumber(Number(item.stockAkhir))}</Text>
                                            <Text style={[styles.tableCell, styles.colNumber, styles.cellRight, Number(item.availableStock) !== 0 && { fontWeight: 'bold', color: '#10b981' } as any]}>{formatNumber(Number(item.availableStock))}</Text>
                                            <View style={[styles.tableCell, styles.colStatus, styles.cellCenter]}>
                                                <View style={[styles.statusBadge, status.badge]}>
                                                    <Text style={[styles.statusText, status.text]}>{status.label}</Text>
                                                </View>
                                            </View>
                                            <Text style={[styles.tableCell, styles.colValue, styles.cellRight]}>{formatCurrency(Number(item.inventoryValue))}</Text>
                                        </View>
                                    );
                                })
                            ) : (
                                <View style={styles.tableRow}>
                                    <Text style={[styles.tableCell, { width: '100%', textAlign: 'center', paddingVertical: 20 }]}>
                                        Tidak ada data untuk gudang ini
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* WAREHOUSE SUMMARY - COMPACT */}
                    <View style={{ marginHorizontal: 25, marginTop: 10, marginBottom: 5 }}>
                        <View style={{
                            flexDirection: 'row',
                            backgroundColor: '#f8fafc',
                            borderWidth: 1,
                            borderColor: '#e2e8f0',
                            borderRadius: 4,
                            paddingVertical: 6,
                            paddingHorizontal: 10
                        }}>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 7, color: '#64748b', marginBottom: 2 }}>PRODUK</Text>
                                <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#1e293b' }}>{group.items.length}</Text>
                            </View>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 7, color: '#64748b', marginBottom: 2 }}>STOK AKHIR</Text>
                                <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#1a56db' }}>
                                    {formatNumber(group.items.reduce((sum: number, item: any) => sum + Number(item.stockAkhir || 0), 0))}
                                </Text>
                            </View>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 7, color: '#64748b', marginBottom: 2 }}>MASUK</Text>
                                <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#10b981' }}>
                                    {formatNumber(group.items.reduce((sum: number, item: any) => sum + Number(item.stockIn || 0), 0))}
                                </Text>
                            </View>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 7, color: '#64748b', marginBottom: 2 }}>KELUAR</Text>
                                <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#ef4444' }}>
                                    {formatNumber(group.items.reduce((sum: number, item: any) => sum + Number(item.stockOut || 0), 0))}
                                </Text>
                            </View>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 7, color: '#64748b', marginBottom: 2 }}>BOOKED</Text>
                                <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#f59e0b' }}>
                                    {formatNumber(group.items.reduce((sum: number, item: any) => sum + Number(item.bookedStock || 0), 0))}
                                </Text>
                            </View>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 7, color: '#64748b', marginBottom: 2 }}>STOCK READY</Text>
                                <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#10b981' }}>
                                    {formatNumber(group.items.reduce((sum: number, item: any) => sum + Number(item.availableStock || 0), 0))}
                                </Text>
                            </View>
                            <View style={{ flex: 1.5, alignItems: 'center' }}>
                                <Text style={{ fontSize: 7, color: '#64748b', marginBottom: 2 }}>NILAI</Text>
                                <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#1a56db' }}>
                                    {formatCurrency(group.items.reduce((sum: number, item: any) => sum + Number(item.inventoryValue || 0), 0))}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* FOOTER */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            PT. Rylif Mikro Mandiri, Bekasi
                        </Text>
                        <Text style={styles.pageNumber}>Halaman {groupIndex + 1}/{sortedWarehouseGroups.length}</Text>
                    </View>
                </Page>
            ))}
        </Document>
    );
};

export default StockBalancePdf;
