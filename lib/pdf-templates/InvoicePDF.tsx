import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { BusinessHeader } from './shared/BusinessHeader'
import { LineItemTable } from './shared/LineItemTable'
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
    color: '#111827',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  docMeta: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#6b7280',
    marginBottom: 16,
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
    marginBottom: 2,
  },
  label: {
    width: 80,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
  },
  value: {
    flex: 1,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#111827',
  },
  description: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#374151',
    marginTop: 4,
    lineHeight: 1.4,
  },
  paymentBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  paymentBadgeText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#166534',
    textTransform: 'uppercase',
  },
  paidStamp: {
    position: 'absolute',
    top: 200,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 48,
    fontFamily: 'Helvetica-Bold',
    color: '#166534',
    textTransform: 'uppercase',
    transform: 'rotate(-30deg)',
    opacity: 0.6,
  },
  notes: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1 solid #f3f4f6',
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
})

export function InvoicePDF({ data }: { data: PDFDocumentData }) {
  const dateLabel = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <BusinessHeader info={data.business} />

        <Text style={styles.docTitle}>Invoice</Text>
        <Text style={styles.docMeta}>
          {data.documentNumber && `${data.documentNumber}  ·  `}{dateLabel}
        </Text>

        {data.paymentMethod && (
          <Text style={styles.paidStamp}>PAID</Text>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
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

        {data.description && (
          <Text style={styles.description}>{data.description}</Text>
        )}

        <LineItemTable
          items={data.lineItems}
          subtotal={data.subtotal}
          discountPercent={data.discountPercent}
          total={data.total}
        />

        {data.paymentMethod && (
          <View style={styles.paymentBadge}>
            <Text style={styles.paymentBadgeText}>Paid via: {data.paymentMethod}</Text>
          </View>
        )}

        {data.notes && (
          <Text style={styles.notes}>{data.notes}</Text>
        )}

        <PDFFooter banking={data.banking} terms={data.terms} />
      </Page>
    </Document>
  )
}
