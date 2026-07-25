type WhatsAppReplyArgs = {
  customerName: string
  customerPhone: string
  vehicleMake: string
  vehicleModel: string
  serviceType: string
}

export function generateWhatsAppReplyUrl({  customerName,
  customerPhone,
  vehicleMake,
  vehicleModel,
  serviceType,
}: WhatsAppReplyArgs): string {
  // 1. Sanitize the phone number pattern for international routing criteria
  // Cleans out spaces, dashes, parentheses, or a leading '+'
  let cleanPhone = customerPhone.replace(/[^\d]/g, '')

  // Handle local South African formatting fallbacks (e.g., convert 082... to 2782...)
  if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
    cleanPhone = '27' + cleanPhone.substring(1)
  }

  // 2. Draft the professional greeting template matrix layout string
  const messageBody = [
    `👋 *Hey ${customerName}!*`,
    ``,
    `This is *Prince* from *Fixxr*. I received your quote request on our platform for the *${vehicleMake} ${vehicleModel}* regarding the *${serviceType}*.`,
    ``,
    `I've looked over your vehicle details and put together an estimate breakdown for you. Let me know if you're ready for me to send it over! 🔧`,
  ].join('\n')

  // 3. Return the fully encoded address string endpoint
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageBody)}`
}