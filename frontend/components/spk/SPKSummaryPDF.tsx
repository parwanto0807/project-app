import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
    Font,
} from '@react-pdf/renderer';

// Register fonts if needed, or use default Helvetica
const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        padding: 30,
        fontSize: 9,
        color: '#1e293b',
    },
    headerContainer: {
        flexDirection: 'row',
        marginBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: '#0891b2',
        paddingBottom: 10,
        alignItems: 'center',
    },
    logo: {
        width: 80,
        height: 40,
        marginRight: 15,
        objectFit: 'contain',
    },
    companyInfo: {
        flex: 1,
    },
    companyName: {
        color: '#0891b2',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 2,
    },
    companyDetail: {
        fontSize: 8,
        color: '#64748b',
        lineHeight: 1.2,
    },
    titleContainer: {
        marginBottom: 20,
        textAlign: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 10,
        color: '#64748b',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 10,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#f8fafc',
        padding: 10,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 8,
        color: '#64748b',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tableRow: {
        flexDirection: 'row',
    },
    tableHeader: {
        backgroundColor: '#f1f5f9',
        fontWeight: 'bold',
    },
    tableCell: {
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 5,
    },
    headerCellText: {
        fontWeight: 'bold',
        fontSize: 9,
        color: '#334155',
    },
    cellText: {
        fontSize: 8,
    },
    // Column Widths
    colNo: { width: '4%' },
    colSpk: { width: '12%' },
    colDate: { width: '10%' },
    colSo: { width: '12%' },
    colCustomer: { width: '15%' },
    colProject: { width: '15%' },
    colTeam: { width: '12%' },
    colProgress: { width: '10%', textAlign: 'center' },
    colStatus: { width: '10%', textAlign: 'center' },
    
    // Status Styles
    statusOpen: { color: '#0284c7', fontWeight: 'bold' },
    statusClosed: { color: '#059669', fontWeight: 'bold' },
    
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 7,
        color: '#94a3b8',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 10,
    }
});

interface SPKSummaryPDFProps {
    data: any[];
    title?: string;
    period?: string;
    teamName?: string;
    statusFilter?: string;
}

const SPKSummaryPDF = ({ 
    data, 
    title = "SPK SUMMARY REPORT", 
    period = "", 
    teamName = "All Teams", 
    statusFilter = "All Status" 
}: SPKSummaryPDFProps) => {
    const totalSPK = data.length;
    const closedSPK = data.filter(s => s.spkStatusClose).length;
    const openSPK = totalSPK - closedSPK;
    const avgProgress = totalSPK > 0 
        ? (data.reduce((acc, curr) => acc + (curr.progress || 0), 0) / totalSPK).toFixed(1) 
        : "0";

    const formatDate = (date: any) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <Document title={title}>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <Image style={styles.logo} src="/Logo.png" />
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>PT. RYLIF MIKRO MANDIRI</Text>
                        <Text style={styles.companyDetail}>Jln. Arjuna RT. 04/RW. 36, Kampung Pulo Resident 1 No. 6</Text>
                        <Text style={styles.companyDetail}>Bekasi - 17510, Indonesia | Phone: 0857-7414-8874</Text>
                    </View>
                    <View style={{ textAlign: 'right' }}>
                        <Text style={{ fontSize: 8, color: '#64748b' }}>Generated on:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{new Date().toLocaleString('id-ID')}</Text>
                    </View>
                </View>

                {/* Title Section */}
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>Team: {teamName} | Status: {statusFilter}</Text>
                </View>

                {/* Statistics */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total SPK</Text>
                        <Text style={styles.statValue}>{totalSPK}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Open</Text>
                        <Text style={[styles.statValue, { color: '#0284c7' }]}>{openSPK}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Closed</Text>
                        <Text style={[styles.statValue, { color: '#059669' }]}>{closedSPK}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Avg. Progress</Text>
                        <Text style={[styles.statValue, { color: '#0891b2' }]}>{avgProgress}%</Text>
                    </View>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    {/* Header */}
                    <View style={[styles.tableRow, styles.tableHeader]} fixed>
                        <View style={[styles.tableCell, styles.colNo]}><Text style={styles.headerCellText}>No</Text></View>
                        <View style={[styles.tableCell, styles.colSpk]}><Text style={styles.headerCellText}>SPK Number</Text></View>
                        <View style={[styles.tableCell, styles.colDate]}><Text style={styles.headerCellText}>Date</Text></View>
                        <View style={[styles.tableCell, styles.colSo]}><Text style={styles.headerCellText}>SO Number</Text></View>
                        <View style={[styles.tableCell, styles.colCustomer]}><Text style={styles.headerCellText}>Customer</Text></View>
                        <View style={[styles.tableCell, styles.colProject]}><Text style={styles.headerCellText}>Project</Text></View>
                        <View style={[styles.tableCell, styles.colTeam]}><Text style={styles.headerCellText}>Team</Text></View>
                        <View style={[styles.tableCell, styles.colProgress]}><Text style={styles.headerCellText}>Prog.</Text></View>
                        <View style={[styles.tableCell, styles.colStatus]}><Text style={styles.headerCellText}>Status</Text></View>
                    </View>

                    {/* Body */}
                    {data.map((item, index) => (
                        <View key={item.id} style={styles.tableRow} wrap={false}>
                            <View style={[styles.tableCell, styles.colNo]}><Text style={styles.cellText}>{index + 1}</Text></View>
                            <View style={[styles.tableCell, styles.colSpk]}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>{item.spkNumber}</Text></View>
                            <View style={[styles.tableCell, styles.colDate]}><Text style={styles.cellText}>{formatDate(item.spkDate)}</Text></View>
                            <View style={[styles.tableCell, styles.colSo]}><Text style={styles.cellText}>{item.salesOrder?.soNumber || '-'}</Text></View>
                            <View style={[styles.tableCell, styles.colCustomer]}><Text style={styles.cellText}>{item.salesOrder?.customer?.name || '-'}</Text></View>
                            <View style={[styles.tableCell, styles.colProject]}><Text style={styles.cellText}>{item.salesOrder?.project?.name || '-'}</Text></View>
                            <View style={[styles.tableCell, styles.colTeam]}><Text style={styles.cellText}>{item.team?.namaTeam || 'No Team'}</Text></View>
                            <View style={[styles.tableCell, styles.colProgress]}><Text style={[styles.cellText, { fontWeight: 'bold', color: item.progress === 100 ? '#059669' : '#0f172a' }]}>{item.progress || 0}%</Text></View>
                            <View style={[styles.tableCell, styles.colStatus]}>
                                <Text style={[styles.cellText, item.spkStatusClose ? styles.statusClosed : styles.statusOpen]}>
                                    {item.spkStatusClose ? 'CLOSED' : 'OPEN'}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Footer */}
                <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                    `Page ${pageNumber} of ${totalPages} | Generated by RYLIF ERP System`
                )} fixed />
            </Page>
        </Document>
    );
};

export default SPKSummaryPDF;
