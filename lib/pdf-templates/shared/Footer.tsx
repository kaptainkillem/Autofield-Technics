import { View, Text, StyleSheet } from '@react-pdf/renderer'

export interface BankingInfo {
  bankName: string | null
  accountHolder: string | null
  accountNumber: string | null
  branchCode: string | null
}

const styles = StyleSheet.create({
  footer: {
    marginTop: 24,
    paddingTop: 16,
    borderTop: '1 solid #d1d5db',
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  bankingRow: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#6b7280',
    marginBottom: 2,
  },
  terms: {
    marginTop: 12,
    fontSize: 7,
    fontFamily: 'Helvetica',
    color: '#9ca3af',
    lineHeight: 1.4,
  },
  thanks: {
    marginTop: 20,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    textAlign: 'center',
  },
})

export function PDFFooter({
  banking,
  terms,
}: {
  banking: BankingInfo
  terms: string | null
}) {
  const hasBanking = banking.bankName || banking.accountHolder || banking.accountNumber || banking.branchCode

  return (
    <View style={styles.footer}>
      {hasBanking && (
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>Banking Details</Text>
          {banking.bankName && (
            <Text style={styles.bankingRow}>Bank: {banking.bankName}</Text>
          )}
          {banking.accountHolder && (
            <Text style={styles.bankingRow}>Account Holder: {banking.accountHolder}</Text>
          )}
          {banking.accountNumber && (
            <Text style={styles.bankingRow}>Account: {banking.accountNumber}</Text>
          )}
          {banking.branchCode && (
            <Text style={styles.bankingRow}>Branch Code: {banking.branchCode}</Text>
          )}
        </View>
      )}

      {terms && (
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <Text style={styles.terms}>{terms}</Text>
        </View>
      )}

      <Text style={styles.thanks}>Thank you for your business</Text>
    </View>
  )
}
