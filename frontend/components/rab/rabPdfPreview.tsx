import React from 'react';
import { Page, Text, View, StyleSheet, Image as PdfImage } from '@react-pdf/renderer';
import { CostType, RAB } from '@/types/rab';
import { CategoryRAB, categoryOrder } from "@/utils/categoryRAB";


const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 25,
        fontSize: 10,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
        borderBottomWidth: 3,
        borderBottomColor: '#1e4a5f',
        borderBottomStyle: 'solid',
        paddingBottom: 10,
    },
    logo: {
        width: 120,
        height: 35,
    },
    companyInfo: {
        flex: 1,
        textAlign: 'right',
        fontSize: 9,
        lineHeight: 1.3,
    },
    titleSection: {
        marginBottom: 5,
        textAlign: 'center',
        padding: 8,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        // borderLeftWidth: 4,
        // borderLeftColor: '#1e4a5f',
    },
    mainTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e4a5f',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    subTitle: {
        fontSize: 12,
        fontWeight: 'semibold',
        color: '#2e8555',
        marginBottom: 4,
        textTransform: 'uppercase',
    },

    projectInfo: {
        flexDirection: 'column',
        marginBottom: 5,
        padding: 15,
        backgroundColor: '#f1f8ff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1e7ff',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    infoLabel: {
        width: '30%',
        fontWeight: 'bold',
        color: '#1e4a5f',
        fontSize: 9,
    },
    infoValue: {
        width: '70%',
        fontSize: 9,
        color: '#374151',
        flexDirection: 'row',   // penting biar badge/teks bisa inline
        alignItems: 'center',
    },
    statusBadge: {
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 4,
        fontSize: 8,
    },
    categorySection: {
        marginBottom: 2,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 6,
        overflow: 'hidden',
    },
    categoryHeader: {
        flexDirection: 'row',
        backgroundColor: '#e0f2f1', // teal muda, soft
        paddingVertical: 8,
        paddingHorizontal: 12,
    },

    categoryTitle: {
        fontWeight: 'bold',
        fontSize: 11,
        textTransform: 'uppercase',
    },
    table: {
        marginTop: 1,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#374151',
        color: '#FFFFFF',
        paddingVertical: 6,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#4b5563',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        paddingVertical: 6,
        paddingHorizontal: 4,
        minHeight: 20,
    },
    tableRowEven: {
        backgroundColor: '#fafafa',
    },
    categoryFooter: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    colNo: {
        width: '5%',
        textAlign: 'center',
        paddingHorizontal: 2,
    },
    colDescription: {
        width: '30%',
        paddingHorizontal: 3,
    },
    colCategory: {
        width: '10%',
        paddingHorizontal: 2,
    },
    colQty: {
        width: '7%',
        textAlign: 'center',
        paddingHorizontal: 2,
    },
    colUnit: {
        width: '7%',
        textAlign: 'center',
        paddingHorizontal: 2,
    },
    colPrice: {
        width: '15%',
        textAlign: 'right',
        paddingHorizontal: 3,
    },
    colSubtotal: {
        width: '20%',
        textAlign: 'right',
        paddingHorizontal: 3,
    },
    colCostType: {
        width: '15%',
        textAlign: 'left',
        paddingHorizontal: 2,
    },
    headerText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 9,
    },
    cellText: {
        fontSize: 8,
        color: '#374151',
        lineHeight: 1,
    },
    categoryTotalText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1e4a5f',
    },
    summarySection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
        marginBottom: 10,
    },
    costTypeBreakdown: {
        width: '48%',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 6,
        padding: 8,
        backgroundColor: '#fafafa',
    },
    categoryBreakdown: {
        width: '48%',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 6,
        padding: 8,
        backgroundColor: '#fafafa',
    },
    breakdownTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1e4a5f',
        textAlign: 'center',
        marginBottom: 8,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    breakdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
        paddingVertical: 3,
    },
    breakdownLabel: {
        fontSize: 9,
        color: '#4b5563',
        fontWeight: 'medium',
    },
    breakdownValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1e4a5f',
    },
    grandTotalSection: {
        marginTop: 15,
        padding: 15,
        backgroundColor: '#1e4a5f',
        borderRadius: 6,
        alignItems: 'center',
    },
    grandTotalLabel: {
        fontSize: 11,
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginBottom: 5,
    },
    grandTotalValue: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: 'extrabold',
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        textAlign: 'center',
        fontSize: 8,
        color: '#6b7280',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 8,
    },
    notesSection: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#fffbf0',
        borderWidth: 1,
        borderColor: '#fef3c7',
        borderRadius: 4,
    },
    notesText: {
        fontSize: 8,
        color: '#92400e',
        fontStyle: 'italic',
    }
});

// Helper functions
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
};

const getCostTypeLabel = (costType: CostType): string => {
    const labels: Record<CostType, string> = {
        MATERIAL: 'Material',
        LABOR: 'Tenaga Kerja / Jasa',
        EQUIPMENT: 'Peralatan',
        SUBCON: 'Subkontraktor',
        TRANSPORT: 'Transportasi',
        OVERHEAD: 'Overhead',
        OTHER: 'Lain-lain',
    };
    return labels[costType];
};

const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
        PRELIMINARY: "Pekerjaan Pendahuluan",
        SITEPREP: "Pekerjaan Persiapan",
        STRUCTURE: "Pekerjaan Struktur",
        ARCHITECTURE: "Pekerjaan Arsitektur",
        MEP: "Mechanical, Electrical, Plumbing",
        FINISHING: "Pekerjaan Finishing",
        LANDSCAPE: "Pekerjaan Landscaping",
        EQUIPMENT: "Peralatan dan Perlengkapan",
        OVERHEAD: "Biaya Overhead & Profit",
        OTHER: "Lain-lain"
    };
    return labels[category] || category;
};


const getStatusStyle = (status: string) => {
    switch (status) {
        case 'APPROVED':
            return { backgroundColor: '#d1fae5', color: '#065f46' };
        case 'REJECTED':
            return { backgroundColor: '#fee2e2', color: '#dc2626' };
        default:
            return { backgroundColor: '#fef3c7', color: '#d97706' };
    }
};

interface RABPdfPreviewProps {
    rab: RAB;
}

// Extended RAB type to include optional notes
interface ExtendedRAB extends RAB {
    notes?: string;
}

const RABPdfPreview: React.FC<RABPdfPreviewProps> = ({ rab }) => {
    const extendedRab = rab as ExtendedRAB;

    // Group details by category
    const detailsByCategory = rab.rabDetails.reduce((acc, detail) => {
        const category = detail.categoryRab;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(detail);
        return acc;
    }, {} as Record<CategoryRAB, typeof rab.rabDetails>);

    // Calculate category totals
    const categoryTotals = rab.rabDetails.reduce((acc, detail) => {
        const category = detail.categoryRab;
        const price = Number(detail.price) || 0;
        const qty = Number(detail.qty) || 0;
        const subtotal = detail.subtotal != null ? Number(detail.subtotal) : qty * price;

        if (!acc[category]) {
            acc[category] = 0;
        }
        acc[category] += subtotal;
        return acc;
    }, {} as Record<CategoryRAB, number>);

    // Calculate cost type totals
    const costTypeTotals = rab.rabDetails.reduce((acc, detail) => {
        const costType = detail.costType;
        const price = Number(detail.price) || 0;
        const qty = Number(detail.qty) || 0;
        const subtotal = detail.subtotal != null ? Number(detail.subtotal) : qty * price;

        if (!acc[costType]) {
            acc[costType] = 0;
        }

        acc[costType] += subtotal;
        return acc;
    }, {} as Record<CostType, number>);


    // Calculate overall total
    const overallTotal = Object.values(categoryTotals).reduce((sum, total) => sum + total, 0);

    return (
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <PdfImage style={styles.logo} src="/Logo.png" />
                <View style={styles.companyInfo}>
                    <Text style={{ color: '#1e4a5f', fontWeight: 'bold', fontSize: 13, marginBottom: 2 }}>
                        PT. RYLIF MIKRO MANDIRI
                    </Text>
                    <Text>Office: Jl. Anyar RT. 01/RW. 01, Kampung Pulo, No. 5</Text>
                    <Text>Kemang Pratama, Bekasi Barat, Bekasi - 17144, Indonesia</Text>
                    <Text>Phone: 0857-7414-8874 | Email: rylifmikromandiri@gmail.com</Text>
                </View>
            </View>

            {/* Title Section */}
            <View style={styles.titleSection}>
                <Text style={styles.mainTitle}>RENCANA ANGGARAN BIAYA (RAB)</Text>
                {rab.description && (
                    <Text style={{ fontSize: 10, color: '#6b7280', fontStyle: 'italic' }}>
                        {rab.description}
                    </Text>
                )}
                <Text style={styles.subTitle}>BREAKDOWN RINCIAN BIAYA {rab.name} </Text>
            </View>

            {/* Project Information */}
            <View style={styles.projectInfo}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>PROJECT</Text>
                    <Text style={styles.infoValue}>: {rab.project?.name || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>CLIENT</Text>
                    <Text style={styles.infoValue}>
                        : {rab.project?.customer?.name || 'N/A'}
                    </Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>TANGGAL DIBUAT</Text>
                    <Text style={styles.infoValue}>: {formatDate(rab.createdAt)}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>DIBUAT OLEH</Text>
                    <Text style={styles.infoValue}>: {rab.createdBy?.name || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>STATUS RAB</Text>
                    <View style={styles.infoValue}>
                        <View style={[styles.statusBadge, getStatusStyle(rab.status)]}>
                            <Text>{rab.status}</Text>
                        </View>
                    </View>
                </View>
            </View>


            {/* Summary Section */}
            <View style={styles.summarySection}>
                {/* Cost Type Breakdown */}
                <View style={styles.costTypeBreakdown}>
                    <Text style={styles.breakdownTitle}>BREAKDOWN JENIS BIAYA</Text>
                    {Object.entries(costTypeTotals)
                        .sort(([, a], [, b]) => b - a)
                        .map(([costType, total]) => (
                            <View key={costType} style={styles.breakdownItem}>
                                <Text style={styles.breakdownLabel}>
                                    {getCostTypeLabel(costType as CostType)}
                                </Text>
                                <Text style={styles.breakdownValue}>
                                    {formatCurrency(total)}
                                </Text>
                            </View>
                        ))}
                </View>

                {/* Category Breakdown */}
                <View style={styles.categoryBreakdown}>
                    <Text style={styles.breakdownTitle}>BREAKDOWN KATEGORI</Text>
                    {Object.entries(categoryTotals)
                        .sort(
                            ([categoryA], [categoryB]) =>
                                categoryOrder[categoryA as CategoryRAB] -
                                categoryOrder[categoryB as CategoryRAB]
                        )
                        .map(([category, total]) => (
                            <View key={category} style={styles.breakdownItem}>
                                <Text style={styles.breakdownLabel}>
                                    {getCategoryLabel(category as CategoryRAB)}
                                </Text>
                                <Text style={styles.breakdownValue}>
                                    {formatCurrency(total)}
                                </Text>
                            </View>
                        ))}

                </View>
            </View>


            {/* Table Header */}
            <View style={styles.tableHeader}>
                <Text style={[styles.headerText, styles.colNo]}>No</Text>
                <Text style={[styles.headerText, styles.colDescription]}>Deskripsi Item</Text>
                <Text style={[styles.headerText, styles.colCostType]}>Jenis Biaya</Text>
                <Text style={[styles.headerText, styles.colQty]}>Qty</Text>
                <Text style={[styles.headerText, styles.colUnit]}>Unit</Text>
                <Text style={[styles.headerText, styles.colPrice]}>Harga Satuan</Text>
                <Text style={[styles.headerText, styles.colSubtotal]}>Subtotal</Text>

            </View>

            {/* RAB Details Grouped by Category */}
            {Object.values(CategoryRAB)
                .sort((a, b) => categoryOrder[a] - categoryOrder[b]) // urut sesuai order enum
                .map((category) => {
                    const details = detailsByCategory[category] || [];
                    if (details.length === 0) return null; // skip kategori kosong

                    return (

                        <View key={category} style={styles.categorySection}>
                            {/* Category Header */}
                            <View style={styles.categoryHeader}>
                                <Text style={styles.categoryTitle}>
                                    {getCategoryLabel(category)} ({details.length} items)
                                </Text>
                            </View>
                            {/* Table Rows */}
                            {details.map((detail, index) => {
                                const rowStyle =
                                    index % 2 === 0
                                        ? [styles.tableRow, styles.tableRowEven]
                                        : styles.tableRow;

                                return (
                                    <View
                                        key={detail.id || `${category}-${index}`}
                                        style={rowStyle}
                                    >
                                        <Text style={[styles.cellText, styles.colNo]}>{index + 1}</Text>
                                        <Text style={[styles.cellText, styles.colDescription]}>
                                            {detail.product?.name || detail.description}
                                        </Text>
                                        <Text style={[styles.cellText, styles.colCostType]}>
                                            {getCostTypeLabel(detail.costType)}
                                        </Text>
                                        <Text style={[styles.cellText, styles.colQty]}>{detail.qty}</Text>
                                        <Text style={[styles.cellText, styles.colUnit]}>{detail.unit}</Text>
                                        <Text style={[styles.cellText, styles.colPrice]}>
                                            {formatCurrency(detail.price)}
                                        </Text>
                                        <Text style={[styles.cellText, styles.colSubtotal]}>
                                            {formatCurrency(detail.subtotal || detail.qty * detail.price)}
                                        </Text>
                                    </View>
                                );
                            })}

                            {/* Category Footer */}
                            <View style={styles.categoryFooter}>
                                <Text
                                    style={[
                                        styles.categoryTotalText,
                                        { width: "98%", textAlign: "right", paddingRight: 8 },
                                    ]}
                                >
                                    TOTAL :
                                </Text>
                                <Text
                                    style={[styles.categoryTotalText, styles.colSubtotal]}
                                >
                                    {formatCurrency(categoryTotals[category])}
                                </Text>
                                <View style={{ width: "1%" }} />
                            </View>
                        </View>
                    );
                })}

            {/* Grand Total */}
            <View style={styles.grandTotalSection}>
                <Text style={styles.grandTotalLabel}>TOTAL RENCANA ANGGARAN BIAYA</Text>
                <Text style={styles.grandTotalValue}>
                    {formatCurrency(overallTotal)}
                </Text>
            </View>

            {/* Notes Section */}
            {extendedRab.notes && (
                <View style={styles.notesSection}>
                    <Text style={[styles.breakdownLabel, { marginBottom: 3 }]}>Catatan:</Text>
                    <Text style={styles.notesText}>{extendedRab.notes}</Text>
                </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
                <Text>
                    Dokumen ini dibuat secara otomatis pada {new Date().toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })} - PT. RYLIF MIKRO MANDIRI © {new Date().getFullYear()}
                </Text>
            </View>
        </Page>
    );
};

export default RABPdfPreview;