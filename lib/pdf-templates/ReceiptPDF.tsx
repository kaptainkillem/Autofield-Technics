import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { BusinessHeader } from './shared/BusinessHeader'
import { PDFFooter } from './shared/Footer'
import type { PDFDocumentData } from './types'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111827',
  },
  docTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#166534',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  docMeta: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#6b7280',
    marginBottom: 16,
  },
  paidBanner: {
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 4,
    marginBottom: 20,
    alignItems: 'center',
  },
  paidBannerText: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#166534',
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottom: '1 solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 100,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
  },
  value: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#111827',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1 solid #e5e7eb',
    flexDirection: 'row',
  },
  totalLabel: {
    width: 100,
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  totalValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
})

function formatCurrency(value: number) {
  return `R${value.toFixed(2)}`
}

export function ReceiptPDF({ data }: { data: PDFDocumentData }) {
  const dateLabel = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <BusinessHeader info={data.business} />

        <View style={styles.paidBanner}>
          <Text style={styles.paidBannerText}>PAID — RECEIPT</Text>
        </View>

        <Text style={styles.docTitle}>Receipt</Text>
        <Text style={styles.docMeta}>
          {data.documentNumber && `${data.documentNumber}  ·  `}{dateLabel}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{data.customerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{data.customerPhone}</Text>
          </View>
          {data.customerEmail && (
            <View style={styles.row}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{data.customerEmail}</Text>
            </View>
          )}
          {data.vehicleInfo && (
            <View style={styles.row}>
              <Text style={styles.label}>Vehicle</Text>
              <Text style={styles.value}>{data.vehicleInfo}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          {data.paymentMethod && (
            <View style={styles.row}>
              <Text style={styles.label}>Method</Text>
              <Text style={styles.value}>{data.paymentMethod}</Text>
            </View>
          )}
          {data.description && (
            <View style={styles.row}>
              <Text style={styles.label}>Job</Text>
              <Text style={styles.value}>{data.description}</Text>
            </View>
          )}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Amount Paid</Text>
          <Text style={styles.totalValue}>{formatCurrency(data.total)}</Text>
        </View>

        <PDFFooter banking={data.banking} terms={data.terms} />
      </Page>
    </Document>
  )
}
