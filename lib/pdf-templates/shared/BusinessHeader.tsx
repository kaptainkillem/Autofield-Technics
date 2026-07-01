import { View, Text, Image, StyleSheet } from '@react-pdf/renderer'

export interface BusinessInfo {
  companyName: string
  address: string | null
  phone: string | null
  email: string | null
  vatNumber: string | null
  registrationNumber: string | null
  logoBase64: string | null
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '1 solid #d1d5db',
  },
  left: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  detail: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
    fontFamily: 'Helvetica',
  },
  right: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: 'contain',
  },
})

export function BusinessHeader({ info }: { info: BusinessInfo }) {
  const details: string[] = []
  if (info.address) details.push(info.address)
  if (info.phone) details.push(`Phone: ${info.phone}`)
  if (info.email) details.push(`Email: ${info.email}`)
  if (info.vatNumber) details.push(`VAT: ${info.vatNumber}`)
  if (info.registrationNumber) details.push(`Reg: ${info.registrationNumber}`)

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <Text style={styles.companyName}>{info.companyName || 'Autofield Technics'}</Text>
        {details.map((d, i) => (
          <Text key={i} style={styles.detail}>{d}</Text>
        ))}
      </View>
      {info.logoBase64 && (
        <View style={styles.right}>
          <Image src={info.logoBase64} style={styles.logo} />
        </View>
      )}
    </View>
  )
}
