import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image as PdfImage } from '@react-pdf/renderer';

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
    status?: string;
    hpp?: HppSummary | null;
  };
}

/* ===== HPP dari data PR (via SPK) ===== */

export interface HppSourceDetail {
  estimasiTotalHarga?: number | null;
  sourceProduct?: string | null;
  jumlah?: number | null;
  satuan?: string | null;
  productName?: string | null;
}

export interface HppSourcePr {
  id?: string;
  nomorPr?: string;
  status?: string;
  details?: HppSourceDetail[] | null;
}

export interface HppSourceSpk {
  id?: string;
  spkNumber?: string;
  purchaseRequest?: HppSourcePr[] | null;
}

export interface PrBreakdownDetail {
  productName: string;
  sourceLabel: string;
  qtyLabel: string;
  amount: number;
  isStockInternal: boolean;
}

export interface PrBreakdownRow {
  nomorPr: string;
  status: string;
  itemCount: number;
  pembelianOps: number;
  stokInternal: number;
  total: number;
  details: PrBreakdownDetail[];
}

export interface HppSummary {
  rows: PrBreakdownRow[];
  totalPembelianOps: number;
  totalStokInternal: number;
  grandTotalHpp: number;
}

// Klasifikasi mengikuti logika PR existing:
// PEMBELIAN_BARANG / OPERATIONAL / JASA_PEMBELIAN -> biaya pembelian & operasional
// PENGAMBILAN_STOK / JASA_INTERNAL (dan lainnya)   -> HPP stok & jasa internal
const STOCK_INTERNAL_TYPES = ["PENGAMBILAN_STOK", "JASA_INTERNAL"];

const SOURCE_LABELS: Record<string, string> = {
  PEMBELIAN_BARANG: "Pembelian Barang",
  PENGAMBILAN_STOK: "Pengambilan Stok",
  OPERATIONAL: "Operasional",
  JASA_PEMBELIAN: "Jasa Pembelian",
  JASA_INTERNAL: "Jasa Internal",
};

export function buildHppSummary(spk?: HppSourceSpk[] | null): HppSummary | null {
  const prs = (spk ?? []).flatMap((s) => s.purchaseRequest ?? []);
  if (prs.length === 0) return null;

  const rows: PrBreakdownRow[] = [];
  let totalPembelianOps = 0;
  let totalStokInternal = 0;

  for (const pr of prs) {
    let pembelianOps = 0;
    let stokInternal = 0;
    const details: PrBreakdownDetail[] = [];

    for (const detail of pr.details ?? []) {
      const amount = Number(detail.estimasiTotalHarga || 0);
      const source = (detail.sourceProduct || "").toUpperCase();
      const isStockInternal = STOCK_INTERNAL_TYPES.includes(source);
      if (isStockInternal) {
        stokInternal += amount;
      } else {
        pembelianOps += amount;
      }
      details.push({
        productName: detail.productName || "-",
        sourceLabel: SOURCE_LABELS[source] || detail.sourceProduct || "-",
        qtyLabel: [detail.jumlah ?? "", detail.satuan ?? ""].join(" ").trim() || "-",
        amount,
        isStockInternal,
      });
    }

    rows.push({
      nomorPr: pr.nomorPr || "-",
      status: pr.status || "-",
      itemCount: pr.details?.length ?? 0,
      pembelianOps,
      stokInternal,
      total: pembelianOps + stokInternal,
      details,
    });
    totalPembelianOps += pembelianOps;
    totalStokInternal += stokInternal;
  }

  return {
    rows,
    totalPembelianOps,
    totalStokInternal,
    grandTotalHpp: totalPembelianOps + totalStokInternal,
  };
}

export interface SalesOrderFormData {
  soNumber?: string;
  soDate: Date | null;
  poNumber?: string;
  customerId: string;
  customerName?: string;
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
  spk?: HppSourceSpk[];
}

const GREEN = '#008000';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.35,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    paddingBottom: 12,
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
    lineHeight: 1.3,
  },
  companyName: {
    color: GREEN,
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  documentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GREEN,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 3,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  column: {
    width: '48%',
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: GREEN,
    backgroundColor: '#f5f5f5',
    padding: 4,
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    fontWeight: 'bold',
    width: '38%',
    color: '#374151',
  },
  value: {
    flex: 1,
  },
  table: {
    width: '100%',
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: GREEN,
    color: '#FFFFFF',
    padding: 7,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
    fontSize: 9,
  },
  colNo: { width: '6%', textAlign: 'center' },
  colDesc: { width: '36%', paddingRight: 6 },
  colQty: { width: '7%', textAlign: 'right' },
  colUom: { width: '8%', textAlign: 'center' },
  colUnitPrice: { width: '14%', textAlign: 'right' },
  colDiscount: { width: '9%', textAlign: 'right' },
  colTax: { width: '8%', textAlign: 'right' },
  colTotal: { width: '12%', textAlign: 'right' },
  itemName: {
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  notesContainer: {
    width: '55%',
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  notesLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: GREEN,
    fontSize: 9,
  },
  notesText: {
    fontSize: 9,
    lineHeight: 1.4,
  },
  summaryTable: {
    width: '40%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 5,
  },
  summaryLabel: {
    fontWeight: 'bold',
  },
  grandTotal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: GREEN,
    borderTopWidth: 1,
    borderTopColor: GREEN,
    paddingTop: 5,
  },
  approvalSection: {
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  approvalBox: {
    width: '40%',
    textAlign: 'center',
    fontSize: 9,
  },
  approvalLine: {
    marginTop: 45,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 5,
  },
  internalNote: {
    fontSize: 8,
    color: '#b45309',
    letterSpacing: 1,
    marginTop: 2,
  },
  hppSection: {
    marginTop: 5,
    marginBottom: 15,
  },
  hppSectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: GREEN,
    backgroundColor: '#f5f5f5',
    padding: 4,
    marginBottom: 5,
  },
  hppColPr: { width: '22%', paddingRight: 4 },
  hppColStatus: { width: '16%', fontSize: 8, paddingRight: 4 },
  hppColItem: { width: '8%', textAlign: 'center' },
  hppColAmount: { width: '16%', textAlign: 'right' },
  prHeaderRow: {
    backgroundColor: '#e8f5e9',
    fontWeight: 'bold',
  },
  prDetailRow: {
    fontSize: 8,
    color: '#374151',
    paddingVertical: 3,
    borderBottomWidth: 0.3,
    borderBottomColor: '#f0f0f0',
  },
  hppTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 6,
    fontWeight: 'bold',
    fontSize: 9,
    borderTopWidth: 1,
    borderTopColor: GREEN,
  },
  hppTotalLabel: {
    width: '52%',
    textAlign: 'right',
    paddingRight: 6,
  },
  hppTotalValue: {
    width: '16%',
    textAlign: 'right',
  },
  profitBox: {
    width: '55%',
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: GREEN,
    borderRadius: 4,
    padding: 10,
    marginTop: 10,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    fontSize: 9,
  },
  profitLabel: {
    fontWeight: 'bold',
    color: '#374151',
  },
  profitGrandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: GREEN,
    marginTop: 4,
    paddingTop: 5,
    fontSize: 10,
  },
  noDataText: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#6b7280',
  },
  footer: {
    marginTop: 25,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
    fontSize: 8,
    color: '#666666',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
  },
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date | string | null) => {
  if (!date) return '-';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const getStatusBadgeStyle = (status?: string) => {
  const s = (status || '').toUpperCase();
  if (['CANCELLED', 'REJECTED'].includes(s)) return { backgroundColor: '#dc2626' };
  if (['DRAFT', 'PENDING'].includes(s)) return { backgroundColor: '#6b7280' };
  if (['PAID', 'COMPLETED', 'CLOSED'].includes(s)) return { backgroundColor: GREEN };
  return { backgroundColor: '#1d4ed8' };
};

export function mapFormToPdfData(formData: SalesOrderFormData): SalesOrderPDFProps["data"] {
  return {
    soNumber: formData.soNumber ?? "-",
    soDate: formData.soDate ?? null,
    poNumber: formData.documents?.[0]?.name,
    customerName: formData.customer?.name ?? formData.customerName ?? formData.customerId ?? "N/A",
    branch: formData.branch ?? formData.customer?.branch ?? "",
    location: formData.location ?? "",
    projectName: formData.project?.name ?? formData.projectId ?? "N/A",
    customerPIC: formData.customerPIC ?? formData.customer?.customerPIC ?? "",
    notes: formData.notes ?? null,
    type: formData.type,
    createdBy: formData.createdBy ?? formData.userId,
    status: formData.status,
    hpp: buildHppSummary(formData.spk),
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

const LineItem = ({ item, index }: { item: SalesOrderItem; index: number }) => (
  <View style={styles.tableRow} wrap={false}>
    <Text style={styles.colNo}>{index + 1}</Text>
    <View style={styles.colDesc}>
      <Text style={styles.itemName}>{item.name}</Text>
      {item.description ? <Text style={styles.itemDescription}>{item.description}</Text> : null}
    </View>
    <Text style={styles.colQty}>{item.qty}</Text>
    <Text style={styles.colUom}>{item.uom || '-'}</Text>
    <Text style={styles.colUnitPrice}>{formatCurrency(item.unitPrice)}</Text>
    <Text style={styles.colDiscount}>{item.discount > 0 ? `${item.discount}%` : '-'}</Text>
    <Text style={styles.colTax}>{item.taxRate > 0 ? `${item.taxRate}%` : '-'}</Text>
    <Text style={styles.colTotal}>
      {formatCurrency(
        item.qty * item.unitPrice *
        (1 - item.discount / 100) *
        (1 + item.taxRate / 100)
      )}
    </Text>
  </View>
);

export const SalesOrderPDF: React.FC<SalesOrderPDFProps> = ({ data }) => {
  const logoPath = '/LogoMd.png';

  const totals = data.items.reduce(
    (acc, item) => {
      const subtotal = item.qty * item.unitPrice;
      const discountAmount = subtotal * (item.discount / 100);
      const taxable = subtotal - discountAmount;
      const taxAmount = taxable * (item.taxRate / 100);
      acc.subtotal += subtotal;
      acc.discount += discountAmount;
      acc.tax += taxAmount;
      acc.grandTotal += taxable + taxAmount;
      return acc;
    },
    { subtotal: 0, discount: 0, tax: 0, grandTotal: 0 }
  );

  // Analisa profit: pendapatan SO vs total HPP dari PR
  const estimatedProfit = totals.grandTotal - (data.hpp?.grandTotalHpp ?? 0);
  const profitColor = estimatedProfit >= 0 ? GREEN : '#dc2626';
  const marginLabel =
    totals.grandTotal > 0
      ? `${((estimatedProfit / totals.grandTotal) * 100).toFixed(1)}%`
      : '-';

  return (
    <Document
      title={`Sales Order ${data.soNumber || ''}`}
      author="PT. RYLIF MIKRO MANDIRI"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer} fixed>
          <PdfImage style={styles.logo} src={logoPath} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>PT. RYLIF MIKRO MANDIRI</Text>
            <Text>Jln. Arjuna RT. 04/RW. 36, Kampung Pulo Resident 1 No. 6</Text>
            <Text>Kampung Pulo Warung Asem, Sumber Jaya, Bekasi - 17510, Indonesia</Text>
            <Text>Phone: 0857-7414-8874 | Email: rylifmikromandiri@gmail.com</Text>
          </View>
        </View>

        {/* Title & Status */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.documentTitle}>SALES ORDER</Text>
            <Text style={styles.internalNote}>DOKUMEN INTERNAL</Text>
          </View>
          {data.status ? (
            <Text style={[styles.statusBadge, getStatusBadgeStyle(data.status)]}>
              {(data.status || '').replace(/_/g, ' ')}
            </Text>
          ) : null}
        </View>

        {/* Info Sections */}
        <View style={styles.infoContainer}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>DETAIL SALES ORDER</Text>
            <View style={styles.row}>
              <Text style={styles.label}>No. SO</Text>
              <Text style={[styles.value, { fontWeight: 'bold' }]}>{data.soNumber || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tanggal</Text>
              <Text style={styles.value}>{formatDate(data.soDate)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tipe</Text>
              <Text style={styles.value}>{data.type || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Nama Project</Text>
              <Text style={styles.value}>{data.projectName || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Dibuat Oleh</Text>
              <Text style={styles.value}>{data.createdBy || '-'}</Text>
            </View>
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionTitle}>CUSTOMER</Text>
            <Text style={{ fontWeight: 'bold', marginBottom: 3 }}>{data.customerName || '-'}</Text>
            {data.branch ? <Text>Cabang: {data.branch}</Text> : null}
            {data.location ? <Text>Lokasi/Unit: {data.location}</Text> : null}
            {data.customerPIC ? <Text>PIC: {data.customerPIC}</Text> : null}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={styles.colNo}>No</Text>
            <Text style={styles.colDesc}>Deskripsi</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colUom}>UoM</Text>
            <Text style={styles.colUnitPrice}>Harga Satuan</Text>
            <Text style={styles.colDiscount}>Diskon</Text>
            <Text style={styles.colTax}>PPN</Text>
            <Text style={styles.colTotal}>Jumlah</Text>
          </View>
          {data.items.map((item, index) => (
            <LineItem key={`${item.productId ?? 'item'}-${index}`} item={item} index={index} />
          ))}
        </View>

        {/* Notes & Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Catatan:</Text>
            <Text style={styles.notesText}>{data.notes || 'Tidak ada catatan'}</Text>
          </View>

          <View style={styles.summaryTable}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text>{formatCurrency(totals.subtotal)}</Text>
            </View>
            {totals.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Diskon:</Text>
                <Text>- {formatCurrency(totals.discount)}</Text>
              </View>
            )}
            {totals.tax > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>PPN:</Text>
                <Text>{formatCurrency(totals.tax)}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, { borderTopWidth: 0.5, borderTopColor: '#e0e0e0', marginTop: 4 }]}>
              <Text style={[styles.summaryLabel, styles.grandTotal]}>Grand Total:</Text>
              <Text style={styles.grandTotal}>{formatCurrency(totals.grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Breakdown HPP dari PR */}
        {data.hpp && (
          <View style={styles.hppSection}>
            <Text style={styles.hppSectionTitle}>BREAKDOWN HPP – DATA PURCHASE REQUEST</Text>

            {data.hpp.rows.length > 0 ? (
              <>
                <View style={styles.table}>
                  <View style={styles.tableHeader} fixed>
                    <Text style={styles.colNo}>No</Text>
                    <Text style={styles.hppColPr}>No. PR</Text>
                    <Text style={styles.hppColStatus}>Status</Text>
                    <Text style={styles.hppColItem}>Item</Text>
                    <Text style={styles.hppColAmount}>Beli & Operasional</Text>
                    <Text style={styles.hppColAmount}>Stok & Jasa Internal</Text>
                    <Text style={styles.hppColAmount}>Total</Text>
                  </View>
                  {data.hpp.rows.map((row, index) => (
                    <React.Fragment key={`${row.nomorPr}-${index}`}>
                      <View style={[styles.tableRow, styles.prHeaderRow]} wrap={false}>
                        <Text style={styles.colNo}>{index + 1}</Text>
                        <Text style={styles.hppColPr}>{row.nomorPr}</Text>
                        <Text style={styles.hppColStatus}>{row.status.replace(/_/g, ' ')}</Text>
                        <Text style={styles.hppColItem}>{row.itemCount}</Text>
                        <Text style={styles.hppColAmount}>{formatCurrency(row.pembelianOps)}</Text>
                        <Text style={styles.hppColAmount}>{formatCurrency(row.stokInternal)}</Text>
                        <Text style={styles.hppColAmount}>{formatCurrency(row.total)}</Text>
                      </View>
                      {row.details.map((detail, detailIndex) => (
                        <View key={`${row.nomorPr}-detail-${detailIndex}`} style={[styles.tableRow, styles.prDetailRow]} wrap={false}>
                          <Text style={styles.colNo}></Text>
                          <View style={styles.hppColPr}>
                            <Text style={{ paddingLeft: 10 }}>{detail.productName}</Text>
                          </View>
                          <Text style={styles.hppColStatus}>{detail.sourceLabel}</Text>
                          <Text style={styles.hppColItem}>{detail.qtyLabel}</Text>
                          <Text style={styles.hppColAmount}>
                            {detail.isStockInternal ? '-' : formatCurrency(detail.amount)}
                          </Text>
                          <Text style={styles.hppColAmount}>
                            {detail.isStockInternal ? formatCurrency(detail.amount) : '-'}
                          </Text>
                          <Text style={styles.hppColAmount}>{formatCurrency(detail.amount)}</Text>
                        </View>
                      ))}
                    </React.Fragment>
                  ))}
                  <View style={styles.hppTotalRow}>
                    <Text style={styles.hppTotalLabel}>TOTAL HPP</Text>
                    <Text style={styles.hppTotalValue}>{formatCurrency(data.hpp.totalPembelianOps)}</Text>
                    <Text style={styles.hppTotalValue}>{formatCurrency(data.hpp.totalStokInternal)}</Text>
                    <Text style={styles.hppTotalValue}>{formatCurrency(data.hpp.grandTotalHpp)}</Text>
                  </View>
                </View>

                {/* Analisa Profit */}
                <View style={styles.profitBox}>
                  <View style={styles.profitRow}>
                    <Text style={styles.profitLabel}>Pendapatan (Sales Order)</Text>
                    <Text>{formatCurrency(totals.grandTotal)}</Text>
                  </View>
                  <View style={styles.profitRow}>
                    <Text style={styles.profitLabel}>Total HPP (Purchase Request)</Text>
                    <Text>- {formatCurrency(data.hpp.grandTotalHpp)}</Text>
                  </View>
                  <View style={styles.profitGrandRow}>
                    <Text style={[styles.summaryLabel, { color: profitColor }]}>Estimasi Laba:</Text>
                    <Text style={{ fontWeight: 'bold', color: profitColor }}>
                      {formatCurrency(estimatedProfit)}
                    </Text>
                  </View>
                  <View style={styles.profitRow}>
                    <Text style={styles.profitLabel}>Margin Laba</Text>
                    <Text style={{ fontWeight: 'bold', color: profitColor }}>{marginLabel}</Text>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.noDataText}>
                Belum ada detail Purchase Request untuk Sales Order ini.
              </Text>
            )}
          </View>
        )}

        {/* Approval & Footer (wrap=false agar tidak terpotong antar halaman) */}
        <View wrap={false}>
          <View style={styles.approvalSection}>
            <View style={styles.approvalBox}>
              <Text>Dibuat Oleh,</Text>
              <View style={styles.approvalLine} />
              <Text>Sales / Engineering</Text>
              <Text>PT. RYLIF MIKRO MANDIRI</Text>
            </View>
            <View style={styles.approvalBox}>
              <Text>Disetujui Oleh,</Text>
              <View style={styles.approvalLine} />
              <Text>Management</Text>
              <Text>PT. RYLIF MIKRO MANDIRI</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text>Dicetak pada: {formatDate(new Date())}</Text>
            <Text>Dokumen ini dihasilkan secara otomatis oleh sistem.</Text>
          </View>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
};
