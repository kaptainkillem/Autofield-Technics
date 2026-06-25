'use client'

interface FinancialFormProps {
  values: {
    vat_number: string
    registration_number: string
    bank_name: string
    account_holder: string
    account_number: string
    branch_code: string
    hourly_rate: string
  }
  onChange: (field: string, value: string) => void
}

export function FinancialForm({ values, onChange }: FinancialFormProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold text-grey-dark uppercase tracking-wide">Financial Details</h3>
        <p className="text-xs text-grey">Banking and tax information for professional invoicing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">VAT Number</label>
          <input
            type="text"
            value={values.vat_number}
            onChange={(e) => onChange('vat_number', e.target.value)}
            placeholder="e.g. 4120123456"
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark font-mono"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">Registration Number</label>
          <input
            type="text"
            value={values.registration_number}
            onChange={(e) => onChange('registration_number', e.target.value)}
            placeholder="e.g. 2012/123456/07"
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark font-mono"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-grey uppercase tracking-wide">Bank Name</label>
        <input
          type="text"
          value={values.bank_name}
          onChange={(e) => onChange('bank_name', e.target.value)}
          placeholder="e.g. FNB, ABSA, Standard Bank"
          className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">Account Holder Name</label>
          <input
            type="text"
            value={values.account_holder}
            onChange={(e) => onChange('account_holder', e.target.value)}
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">Account Number</label>
          <input
            type="text"
            value={values.account_number}
            onChange={(e) => onChange('account_number', e.target.value)}
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">Branch Code</label>
          <input
            type="text"
            value={values.branch_code}
            onChange={(e) => onChange('branch_code', e.target.value)}
            placeholder="e.g. 250655"
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark font-mono"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">Standard Hourly Rate (R)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.hourly_rate}
            onChange={(e) => onChange('hourly_rate', e.target.value)}
            placeholder="e.g. 650.00"
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark font-mono"
          />
        </div>
      </div>
    </div>
  )
}
