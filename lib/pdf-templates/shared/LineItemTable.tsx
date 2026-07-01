import { View, Text, StyleSheet } from '@react-pdf/renderer'

export interface PDFLineItem {
  id: string
  name: string
  qty: number
  unitPrice: number
}

const styles = StyleSheet.create({
  table: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottom: '1 solid #d1d5db',
  },
  headerItem: {
    flex: 3,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    textTransform: 'uppercase',
  },
  headerQty: {
    flex: 1,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  headerPrice: {
    flex: 1,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  headerTotal: {
    flex: 1,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottom: '1 solid #e5e7eb',
  },
  itemName: {
    flex: 3,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#111827',
  },
  itemQty: {
    flex: 1,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#374151',
    textAlign: 'center',
  },
  itemPrice: {
    flex: 1,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#374151',
    textAlign: 'right',
  },
  itemTotal: {
    flex: 1,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    textAlign: 'right',
  },
  totals: {
    marginTop: 12,
    paddingHorizontal: 8,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  subtotalLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#6b7280',
    marginRight: 16,
  },
  subtotalValue: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#374151',
    width: 80,
    textAlign: 'right',
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  discountLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#ef4444',
    marginRight: 16,
  },
  discountValue: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#ef4444',
    width: 80,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1 solid #111827',
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginRight: 16,
  },
  totalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    width: 80,
    textAlign: 'right',
  },
})

function formatCurrency(value: number) {
  return `R${value.toFixed(2)}`
}

export function LineItemTable({
  items,
  subtotal,
  discountPercent,
  total,
}: {
  items: PDFLineItem[]
  subtotal: number
  discountPercent: number
  total: number
}) {
  const discountAmount = subtotal * (discountPercent / 100)

  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        <Text style={styles.headerItem}>Description</Text>
        <Text style={styles.headerQty}>Qty</Text>
        <Text style={styles.headerPrice}>Unit Price</Text>
        <Text style={styles.headerTotal}>Total</Text>
      </View>

      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemQty}>{item.qty}</Text>
          <Text style={styles.itemPrice}>{formatCurrency(item.unitPrice)}</Text>
          <Text style={styles.itemTotal}>{formatCurrency(item.qty * item.unitPrice)}</Text>
        </View>
      ))}

      <View style={styles.totals}>
        <View style={styles.subtotalRow}>
          <Text style={styles.subtotalLabel}>Subtotal</Text>
          <Text style={styles.subtotalValue}>{formatCurrency(subtotal)}</Text>
        </View>
        {discountAmount > 0 && (
          <View style={styles.discountRow}>
            <Text style={styles.discountLabel}>Discount ({discountPercent}%)</Text>
            <Text style={styles.discountValue}>-{formatCurrency(discountAmount)}</Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>
      </View>
    </View>
  )
}
