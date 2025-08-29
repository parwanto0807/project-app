// components/sales-order/SalesOrderPDF.tsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image as PdfImage } from '@react-pdf/renderer';

// Register a font to ensure it's embedded in the PDF
Font.register({
  family: "Oswald",
  src: "/fonts/Oswald-Regular.ttf",
});

type Customer = {
  id: string
  name: string
  address?: string
  branch?: string | null
  location?: string | null
  customerPIC?: string | null
}

type Project = {
  id: string
  name: string
}

export interface SalesOrderFormItem {
  itemType: "PRODUCT" | "SERVICE" | "CUSTOM";
  productId?: string | null;
  name: string;
  description: string | null;
  uom: string | null;
  qty: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}
// Define a type for your sales order data
export interface SalesOrderItem {
  itemType: "PRODUCT" | "SERVICE" | "CUSTOM";
  productId: string | null;
  name: string;
  description?: string | null;
  uom?: string | null;
  qty: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

export interface SalesOrderPDFProps {
  data: {
    soNumber?: string;
    soDate: Date | null;
    poNumber?: string;
    customerName: string;
    branch?: string;
    location?: string;
    projectName: string;
    customerPIC?: string;
    notes: string | null;
    items: SalesOrderItem[];
    type?: "REGULAR" | "SUPPORT";
    createdBy?: string;
  };
}


export interface SalesOrderFormData {
  soNumber?: string;
  soDate: Date | null;
  poNumber?: string;
  customerId: string;
  projectId: string;
  userId: string;
  type: "REGULAR" | "SUPPORT";
  status: string;
  currency: string;
  notes?: string | null;
  isTaxInclusive: boolean;
  items: SalesOrderFormItem[];
  documents?: { name: string; url: string }[];
  customer?: Customer;
  project?: Project;
  branch?: string;
  location?: string;
  customerPIC?: string;
  createdBy?: string;
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
    alignItems: 'flex-end',
    marginTop: 20,
    marginRight: -75,
  },
  header: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginBottom: 2,
  },
  // MODIFIKASI: Container utama
  mainContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftSection: {
    width: '65%', // Lebar untuk informasi utama
  },
  rightSection: {
    width: '30%', // Lebar untuk box kanan
    alignItems: 'flex-end',
  },
  section: {
    marginBottom: 10,
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: 'flex-start', // Pastikan konten sejajar di atas
  },
  // MODIFIKASI: Perbaikan lebar field
  fieldLabel: {
    width: "20%", // Diperlebar untuk label yang lebih panjang
    fontSize: 10,
    fontWeight: "bold",
  },
  colon: {
    width: "3%",
    fontSize: 10,
    paddingTop: 1, // Untuk alignment yang lebih baik
  },
  // MODIFIKASI PERBAIKAN: Gunakan width yang fixed atau flex
  fieldValue: {
    flex: 1, // Gunakan flex untuk mengisi sisa space
    fontSize: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#000000",
    minHeight: 12, // Pastikan ada tinggi minimum
  },
  spacer: {
    width: '10%',
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
  colDesc: {
    width: '52%',
  },
  colQty: {
    width: '10%',
    textAlign: 'center',
  },
  colPrice: {
    width: '15%',
    textAlign: 'right',
  },
  colTotal: {
    width: '15%',
    textAlign: 'right',
    borderRightWidth: 0,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  soType: {
    flexDirection: 'row',
    marginTop: 10,
  },
  soTypeOption: {
    marginRight: 20,
    fontSize: 10,
  },
  signature: {
    marginTop: 40,
    fontSize: 10,
  },
  grandTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    marginBottom: 5,
  },
  grandTotalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 10,
  },
  grandTotalValue: {
    fontSize: 10,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    width: 100,
    textAlign: 'right',
  },

  // MODIFIKASI: Style untuk status dokumen
  documentStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    fontSize: 9,
    flexWrap: 'nowrap',
    width: '100%',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 0,
  },

  // MODIFIKASI: Style untuk footer note
  footerNote: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
  },
  // MODIFIKASI: Menambahkan container untuk informasi utama dan box kanan
  // mainContainer: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  // },
  // leftSection: {
  //   width: '60%', // Lebar untuk informasi utama
  // },
  // rightSection: {
  //   width: '35%', // Lebar untuk box kanan
  //   alignItems: 'flex-end',
  //   marginRight: -2,
  // },
  rightBox: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 8,
    alignItems: "center",
    justifyContent: "flex-start",
    height: 120, // Tinggi yang sesuai dengan gambar
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: "#000",
    marginHorizontal: 4,
  },
  checkboxLabel: {
    fontSize: 10,
    marginRight: 10,
  },
  madeBy: {
    fontSize: 10,
    marginBottom: 10,
  },
  signatureSpace: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 30,
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

export function mapFormToPdfData(formData: SalesOrderFormData): SalesOrderPDFProps["data"] {
  return {
    soNumber: formData.soNumber ?? "........", // atau generate nomor
    soDate: formData.soDate ?? null,
    poNumber: formData.documents?.[0]?.name ?? "........", // kalau ada
    customerName: formData.customer?.name ?? formData.customerId ?? "N/A",
    branch: formData.customer?.branch ?? "........", // jika ada
    location: formData.location ?? "........", // jika ada
    projectName: formData.project?.name ?? formData.projectId ?? "N/A",
    customerPIC: formData.customer?.customerPIC ?? "........", // jika ada
    notes: formData.notes ?? null,
    type: formData.type,
    createdBy: formData.userId, // tampilkan user yang buat SO
    items: formData.items?.map((item): SalesOrderItem => ({
      itemType: item.itemType,
      productId: item.productId ?? null,
      name: item.name ?? "N/A",
      description: item.description ?? null,
      uom: item.uom ?? null,
      qty: item.qty ?? 0,
      unitPrice: item.unitPrice ?? 0,
      discount: item.discount ?? 0,
      taxRate: item.taxRate ?? 0,
    })) ?? [],
  };
}



export const SalesOrderPDF: React.FC<SalesOrderPDFProps> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Hitung grand total
  const calculateGrandTotal = () => {
    return data.items.reduce((total, item) => {
      const itemTotal = item.qty * item.unitPrice;
      const discountAmount = itemTotal * (item.discount / 100);
      const taxAmount = (itemTotal - discountAmount) * (item.taxRate / 100);
      return total + (itemTotal - discountAmount + taxAmount);
    }, 0);
  };
  const formatDate = (date: Date | null) => {
    if (!date) return '';

    const day = date.getDate();
    const month = date.toLocaleString('id-ID', { month: 'long' });
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  };

  // Fungsi untuk membuat checkbox
  const Checkbox = ({ checked }: { checked: boolean }) => (
    <View style={styles.checkbox}>
      {checked && <Text>✓</Text>}
    </View>
  );

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header dengan Logo */}
        <View style={styles.headerContainer}>
          <PdfImage
            style={styles.logo}
            src="/Logo.png"
          />
          <View style={{ flex: 2 }}></View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.header}>SALES ORDER</Text>
          </View>
          <View style={{ width: 100 }}></View>
        </View>

        {/* Container utama dengan dua kolom */}
        <View style={styles.mainContainer}>
          {/* Kolom kiri untuk informasi utama */}
          <View style={styles.leftSection}>
            <View style={styles.section}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>NO SO</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.fieldValue}>{data.soNumber || "........"}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>DATE</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.fieldValue}>{formatDate(data.soDate) || "........"}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>CUSTOMER</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.fieldValue}>{data.customerName || "........"}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>CABANG</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.fieldValue}>{data.branch || "........"}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>LOKASI/UNIT</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.fieldValue}>{data.location || "........"}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>NAMA PROJECT</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.fieldValue}>{data.projectName || "........"}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>PIC CUSTOMER</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.fieldValue}>{data.customerPIC || "........"}</Text>
              </View>
            </View>
          </View>


          {/* Kolom kanan untuk box REGULAR/SUPPORT dan tanda tangan */}
          <View style={styles.rightSection}>
            <View style={styles.rightBox}>
              <View style={styles.checkboxRow}>
                <View style={styles.checkbox} />
                <Text style={styles.checkboxLabel}>REGULAR</Text>
                <View style={styles.checkbox} />
                <Text style={styles.checkboxLabel}>SUPPORT</Text>
              </View>

              <Text style={styles.madeBy}>Dibuat Oleh:</Text>
              <Text style={styles.signatureSpace}>( ............................ )</Text>
            </View>
          </View>
        </View>


        {/* Tabel Item Pekerjaan */}
        <View style={styles.section}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 2, marginTop: 10 }}>ITEM PEKERJAAN</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.colNo]}>NO</Text>
              <Text style={[styles.tableCell, styles.colDesc]}>DISKRIPSI PEKERJAAN</Text>
              <Text style={[styles.tableCell, styles.colQty]}>JUMLAH</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>HARGA JUAL</Text>
              <Text style={[styles.tableCell, styles.colTotal]}>TOTAL HARGA JUAL</Text>
            </View>

            {/* Table Rows */}
            {Array.from({ length: 10 }).map((_, index) => {
              const item = data.items[index] || null;
              return (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colNo]}>{index + 1}</Text>
                  <Text style={[styles.tableCell, styles.colDesc]}>{item ? item.name : ""}</Text>
                  <Text style={[styles.tableCell, styles.colQty]}>{item ? item.qty : ""}</Text>
                  <Text style={[styles.tableCell, styles.colPrice]}>{item ? formatCurrency(item.unitPrice) : ""}</Text>
                  <Text style={[styles.tableCell, styles.colTotal]}>
                    {item ? formatCurrency(item.qty * item.unitPrice) : ""}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        <View style={styles.grandTotalContainer}>
          <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
          <Text style={styles.grandTotalValue}>{formatCurrency(calculateGrandTotal())}</Text>
        </View>

        {/* Footer Section */}
        {/* Status Dokumen */}
        <View style={styles.documentStatus}>
          <View style={styles.statusItem}>
            <Checkbox checked={false} />
            <Text>PENAWARAN HARGA</Text>
          </View>
          <View style={styles.statusItem}>
            <Checkbox checked={false} />
            <Text>PURCHASE ORDER</Text>
          </View>
          <View style={styles.statusItem}>
            <Checkbox checked={false} />
            <Text>BAP</Text>
          </View>
          <View style={styles.statusItem}>
            <Checkbox checked={false} />
            <Text>INVOICE</Text>
          </View>
          <View style={styles.statusItem}>
            <Checkbox checked={false} />
            <Text>STATUS PEMBAYARAN</Text>
          </View>
        </View>

        {/* Footer Note */}
        <Text style={styles.footerNote}>
          LEMBAR 1: FINANCE, LEMBAR 2: LOGISTIC, LEMBAR 3: SALES/ENGINEERING
        </Text>
      </Page>
    </Document>
  );
};