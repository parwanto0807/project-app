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
        gap: 20,
        justifyContent: 'center',
    },

    infoItem: {
        minWidth: 180,
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
    warehouses?: { id: string; name: string; isMain: boolean }[];
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
            <Page size="A4" orientation="landscape" style={styles.page}>
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
                    <View style={styles.companyDetails}>
                        <Text style={styles.companyName}>PT. RYLIF MIKRO MANDIRI</Text>
                        <Text style={styles.companyAddress}>
                            Jln. Arjuna RT. 04/RW. 36, Kampung Pulo Resident 1 No. 6{'\n'}
                            Kampung Pulo Warung Asem, Sumber Jaya, Bekasi{'\n'}
                            Tel: 0852-1929-6841 / 1857-7441-8078 | rylifmikromandiri@gmail.com
                        </Text>
                    </View>

                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Gudang</Text>
                            <Text style={styles.infoValue}>{sortedWarehouseGroups.length > 1 ? 'Semua Gudang' : warehouseName}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Periode Laporan</Text>
                            <Text style={styles.infoValue}>{period}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Tanggal Cetak</Text>
                            <Text style={styles.infoValue}>
                                {new Date().toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Total Produk</Text>
                            <Text style={styles.infoValue}>{data?.length || 0} items</Text>
                        </View>
                    </View>
                </View>

                {/* METRICS BAR */}
                <View style={styles.metricsBar}>
                    <View style={styles.metricsGrid}>
                        <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>Stok Akhir</Text>
                            <Text style={styles.metricValue}>{formatNumber(totals.stockAkhir)}</Text>
                        </View>
                        <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>Stok Masuk</Text>
                            <Text style={styles.metricValue}>{formatNumber(totals.stockIn)}</Text>
                        </View>
                        <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>Stok Keluar</Text>
                            <Text style={styles.metricValue}>{formatNumber(totals.stockOut)}</Text>
                        </View>
                        <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>Nilai Inventori</Text>
                            <Text style={styles.metricValue}>{formatCurrency(totals.inventoryValue)}</Text>
                        </View>
                        <View style={[styles.metricItem, styles.metricItemLast]}>
                            <Text style={styles.metricLabel}>Stok Tersedia</Text>
                            <Text style={styles.metricValue}>{formatNumber(totals.availableStock)}</Text>
                        </View>
                    </View>
                </View>

                {/* WAREHOUSE TABLES */}
                {sortedWarehouseGroups.map((group) => (
                    <View key={group.id}>
                        <View style={[styles.tableContainer, { marginTop: 0, marginBottom: 15 }]}>
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
                    </View>
                ))}

                {/* MINIMAL SUMMARY TABLE */}
                <View style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}>RINGKASAN ANALISIS</Text>

                    <View style={styles.summaryTable}>
                        {/* Table Header */}
                        <View style={[styles.summaryTableRow, styles.summaryTableRowHeader]}>
                            <View style={[styles.summaryTableCol, styles.sumCol1]}>
                                <Text style={styles.summaryLabel}>METRIK</Text>
                            </View>
                            <View style={[styles.summaryTableCol, styles.sumCol2]}>
                                <Text style={styles.summaryLabel}>NILAI</Text>
                            </View>
                            <View style={[styles.summaryTableCol, styles.sumCol3]}>
                                <Text style={styles.summaryLabel}>PERSENTASE</Text>
                            </View>
                            <View style={[styles.summaryTableCol, styles.sumCol4]}>
                                <Text style={styles.summaryLabel}>KETERANGAN</Text>
                            </View>
                        </View>

                        {/* Pergerakan Stock */}
                        <View style={styles.summaryTableRow}>
                            <View style={[styles.summaryTableCol, styles.sumCol1]}>
                                <Text style={styles.summaryValue}>Pergerakan Stock</Text>
                            </View>
                            <View style={[styles.summaryTableCol, styles.sumCol2]}>
                                <Text style={styles.summaryValue}>{formatNumber(totals.stockIn + totals.stockOut)}</Text>
                            </View>
                            <View style={[styles.summaryTableCol, styles.sumCol3]}>
                                <Text style={styles.summaryValue}>
                                    {totals.stockAwal > 0 ?
                                        `${((totals.stockOut / totals.stockAwal) * 100).toFixed(1)}%` :
                                        '0%'
                                    }
                                </Text>
                            </View>
                            <View style={[styles.summaryTableCol, styles.sumCol4]}>
                                <Text style={styles.summaryValue}>
                                    Masuk: {formatNumber(totals.stockIn)}, Keluar: {formatNumber(totals.stockOut)}
                                </Text>
                            </View>
                        </View>

                        {/* Stock Tersedia */}
                        <View style={styles.summaryTableRow}>
                            <View style={[styles.summaryTableCol, styles.sumCol1]}>
                                <Text style={styles.summaryValue}>Stock Tersedia</Text>
                            </View>
                            <View style={[styles.summaryTableCol, styles.sumCol2]}>
                                <Text style={[styles.summaryValue, styles.summaryHighlight]}>{formatNumber(totals.availableStock)}</Text>
                            </View>
                            <View style={[styles.summaryTableCol, styles.sumCol3]}>
                                <Text style={styles.summaryValue}>
                                    {totals.stockAkhir > 0 ?
                                        `${((totals.availableStock / totals.stockAkhir) * 100).toFixed(1)}%` :
                                        '0%'
                                    }
                                </Text>
                            </View>
                            <View style={[styles.summaryTableCol, styles.sumCol4]}>
                                <Text style={styles.summaryValue}>
                                    {totals.availableStock <= 0 ? 'Stok kritis' :
                                        totals.availableStock < 50 ? 'Perlu restock' :
                                            'Stok aman'}
                                </Text>
                            </View>
                        </View>

                        {/* Stock Terbooking */}
                        <View style={styles.summaryTableRow}>
                            <View style={[styles.summaryTableCol, styles.sumCol1]}>
                                <Text style={styles.summaryValue}>Stock Terbooking</Text>
                            </View>
                            <View style={[styles.summaryTableCol, styles.sumCol2]}>
                                <Text style={styles.summaryValue}>{formatNumber(totals.bookedStock)}</Text>
                            </View>
                            <View style={[styles.summaryTableCol, styles.sumCol3]}>
                                <Text style={styles.summaryValue}>
                                    {totals.stockAkhir > 0 ?
                                        `${((totals.bookedStock / totals.stockAkhir) * 100).toFixed(1)}%` :
                                        '0%'
                                    }
                                </Text>
                            </View>
                            <View style={[styles.summaryTableCol, styles.sumCol4]}>
                                <Text style={styles.summaryValue}>Sudah approve PR/MR</Text>
                            </View>
                        </View>

                        {/* Permintaan Pending */}
                        <View style={styles.summaryTableRow}>
                            <View style={[styles.summaryTableCol, styles.sumCol1]}>
                                <Text style={styles.summaryValue}>Permintaan Pending</Text>
                            </View>
                            <View style={[styles.summaryTableCol, styles.sumCol2]}>
                                <Text style={styles.summaryValue}>{formatNumber(totals.onPR)}</Text>
                            </View>
                            <View style={[styles.summaryTableCol, styles.sumCol3]}>
                                <Text style={styles.summaryValue}>-</Text>
                            </View>
                            <View style={[styles.summaryTableCol, styles.sumCol4]}>
                                <Text style={styles.summaryValue}>Menunggu persetujuan</Text>
                            </View>
                        </View>

                        {/* Nilai Inventori */}
                        <View style={styles.summaryTableRow}>
                            <View style={[styles.summaryTableCol, styles.sumCol1]}>
                                <Text style={styles.summaryValue}>Nilai Inventori</Text>
                            </View>
                            <View style={[styles.summaryTableCol, styles.sumCol2]}>
                                <Text style={[styles.summaryValue, styles.summaryHighlight]}>{formatCurrency(totals.inventoryValue)}</Text>
                            </View>
                            <View style={[styles.summaryTableCol, styles.sumCol3]}>
                                <Text style={styles.summaryValue}>
                                    Rata: {formatCurrency(data?.length ? totals.inventoryValue / data.length : 0)}
                                </Text>
                            </View>
                            <View style={[styles.summaryTableCol, styles.sumCol4]}>
                                <Text style={styles.summaryValue}>Total nilai semua stock</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* FOOTER */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        {companyInfo.name} • {companyInfo.address} • {companyInfo.phone || ''}
                    </Text>
                    <Text style={styles.pageNumber}>Halaman 1/1</Text>
                </View>
            </Page>
        </Document>
    );
};

export default StockBalancePdf;