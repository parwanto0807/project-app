// components/sales-order/SalesOrderPDF.tsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register a font to ensure it's embedded in the PDF
// ✅ Daftarkan font lokal (letakkan di public/fonts/Oswald-Regular.ttf)
Font.register({
  family: "Oswald",
  src: "/fonts/Oswald-Regular.ttf",
});

// const styles = StyleSheet.create({
//   page: {
//     padding: 20,
//     fontSize: 12,
//   },
//   title: {
//     fontFamily: "Oswald", // ✅ pakai font yang sudah didaftarkan
//     fontSize: 20,
//     marginBottom: 10,
//   },
// });

// Define a type for your sales order data to resolve the 'any' errors
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
    soDate: Date | null;
    customerName: string;
    projectName: string;
    notes: string | null;
    items: SalesOrderItem[];
  };
}

// ✅ TAMBAHKAN interface SalesOrderFormData di sini
export interface SalesOrderFormData {
  soDate: Date | null;
  customerId: string;
  projectId: string;
  userId: string;
  type: "REGULAR" | "SUPPORT";
  status:
    | "DRAFT"
    | "SENT"
    | "CONFIRMED"
    | "IN_PROGRESS"
    | "FULFILLED"
    | "PARTIALLY_INVOICED"
    | "INVOICED"
    | "PARTIALLY_PAID"
    | "PAID"
    | "CANCELLED";
  currency: string;
  notes?: string | null;
  isTaxInclusive: boolean;
  items: SalesOrderFormItem[];
  documents?: { name: string; url: string }[];
  customer?: Customer;
  project?: Project;
}

// ✅ TAMBAHKAN interface untuk Customer dan Project
interface Customer {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

// ✅ TAMBAHKAN interface untuk SalesOrderFormItem
interface SalesOrderFormItem {
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

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Oswald'
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },

  table: {
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#000000',
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#F0F0F0',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  tableCell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    flexGrow: 1,
    fontSize: 10,
  },
  cellHeader: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  colIndex: { width: '10%' },
  colName: { width: '40%' },
  colQty: { width: '15%' },
  colPrice: { width: '15%' },
  colTotal: { width: '20%' },
});

export function mapFormToPdfData(formData: SalesOrderFormData): SalesOrderPDFProps["data"] {
  return {
    soDate: formData.soDate ?? null,
    customerName: formData.customer?.name ?? formData.customerId ?? "N/A",
    projectName: formData.project?.name ?? formData.projectId ?? "N/A",
    notes: formData.notes ?? null,
    items: formData.items?.map((item: SalesOrderFormItem) => ({
      itemType: item.itemType,
      productId: item.productId ?? null,
      name: item.name ?? "N/A",
      description: item.description ?? null,
      uom: item.uom ?? null,
      qty: item.qty ?? 0,
      unitPrice: item.unitPrice ?? 0,
      discount: item.discount ?? 0,
      taxRate: item.taxRate ?? 0,
    })) ?? []
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.header}>Sales Order</Text>
          <Text>SO Date: {data.soDate ? data.soDate.toLocaleDateString('id-ID') : 'N/A'}</Text>
          <Text>Customer: {data.customerName}</Text>
          <Text>Project: {data.projectName}</Text>
          <Text>Notes: {data.notes ?? 'N/A'}</Text>

          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 14, marginBottom: 10 }}>Items:</Text>

            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.cellHeader, styles.colIndex]}>#</Text>
              <Text style={[styles.tableCell, styles.cellHeader, styles.colName]}>Name</Text>
              <Text style={[styles.tableCell, styles.cellHeader, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableCell, styles.cellHeader, styles.colPrice]}>Unit Price</Text>
              <Text style={[styles.tableCell, styles.cellHeader, styles.colTotal]}>Total</Text>
            </View>

            {data.items?.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colIndex]}>{index + 1}</Text>
                <Text style={[styles.tableCell, styles.colName]}>{item.name}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{item.qty}</Text>
                <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.unitPrice)}</Text>
                <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(item.qty * item.unitPrice)}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
};