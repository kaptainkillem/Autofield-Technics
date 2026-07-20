import type { BusinessInfo } from './shared/BusinessHeader'
import type { BankingInfo } from './shared/Footer'
import type { PDFLineItem } from './shared/LineItemTable'

export interface PDFDocumentData {
  business: BusinessInfo
  banking: BankingInfo
  terms: string | null
  documentNumber: string
  documentType: 'Quote' | 'Invoice' | 'Receipt'
  createdAt: string
  customerName: string
  customerEmail: string | null
  customerPhone: string
  vehicleInfo: string | null
  serviceType: string | null
  description: string | null
  notes: string | null
  lineItems: PDFLineItem[]
  discountPercent: number
  subtotal: number
  total: number
  paymentMethod: string | null
  depositPercent: number
  depositAmount: number | null
  expiryDate: string | null
}
