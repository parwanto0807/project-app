"use client";

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { TopValueItem } from '@/lib/action/inventory/inventoryAction';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fMZhrib2Bg-4.ttf', fontWeight: 700 }
  ]
});

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Inter', fontSize: 10, color: '#1e293b' },
  header: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingBottom: 10 },
  companyName: { fontSize: 16, fontWeight: 700, color: '#0f172a' },
  title: { fontSize: 14, fontWeight: 700, marginTop: 10, color: '#0f172a' },
  subtitle: { fontSize: 10, color: '#64748b', marginTop: 4 },
  table: { display: 'flex', width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { flexDirection: 'row' },
  tableHeader: { backgroundColor: '#f1f5f9', fontWeight: 700 },
  tableColHeader: { borderStyle: 'solid', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#e2e8f0', padding: 5, textAlign: 'center' },
  tableColHeaderLeft: { borderStyle: 'solid', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#e2e8f0', padding: 5, textAlign: 'left' },
  tableCol: { borderStyle: 'solid', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#e2e8f0', padding: 5, textAlign: 'center' },
  tableColLeft: { borderStyle: 'solid', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#e2e8f0', padding: 5, textAlign: 'left' },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', color: '#94a3b8', fontSize: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 }
});

interface TopValuePdfProps {
  data: TopValueItem[];
  period: string;
  warehouseName: string;
}

const TopValuePdf: React.FC<TopValuePdfProps> = ({ data, period, warehouseName }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape">
        <View style={styles.header}>
          <Text style={styles.companyName}>Laporan Nilai Stok</Text>
          <Text style={styles.title}>Top 20 Barang dengan Nilai Bersih Tertinggi</Text>
          <Text style={styles.subtitle}>Periode: {period} | Gudang: {warehouseName}</Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={{ ...styles.tableColHeader, width: '5%' }}><Text>No</Text></View>
            <View style={{ ...styles.tableColHeaderLeft, width: '35%' }}><Text>Nama Barang</Text></View>
            <View style={{ ...styles.tableColHeader, width: '15%' }}><Text>Kode</Text></View>
            <View style={{ ...styles.tableColHeaderLeft, width: '20%' }}><Text>Gudang</Text></View>
            <View style={{ ...styles.tableColHeader, width: '10%' }}><Text>Stok</Text></View>
            <View style={{ ...styles.tableColHeader, width: '15%' }}><Text>Nilai Bersih (Rp)</Text></View>
          </View>
          {data.map((item, index) => (
            <View style={styles.tableRow} key={index} wrap={false}>
              <View style={{ ...styles.tableCol, width: '5%' }}><Text>{index + 1}</Text></View>
              <View style={{ ...styles.tableColLeft, width: '35%' }}><Text>{item.productName}</Text></View>
              <View style={{ ...styles.tableCol, width: '15%' }}><Text>{item.productCode}</Text></View>
              <View style={{ ...styles.tableColLeft, width: '20%' }}><Text>{item.warehouseName}</Text></View>
              <View style={{ ...styles.tableCol, width: '10%' }}><Text>{new Intl.NumberFormat('id-ID').format(item.stockAkhir)} {item.unit}</Text></View>
              <View style={{ ...styles.tableCol, width: '15%' }}><Text>{new Intl.NumberFormat('id-ID').format(item.inventoryValue)}</Text></View>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>Dicetak pada {format(new Date(), 'dd MMMM yyyy HH:mm', { locale: idLocale })}</Text>
      </Page>
    </Document>
  );
};

export default TopValuePdf;
