'use client'

interface QuoteSettingsFormProps {
  values: {
    callout_fee: string
    diagnostic_fee: string
    default_deposit_percent: string
    terms_conditions: string
  }
  onChange: (field: string, value: string) => void
}

export function QuoteSettingsForm({ values, onChange }: QuoteSettingsFormProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold text-grey-dark uppercase tracking-wide">Quote Configuration</h3>
        <p className="text-xs text-grey">Default values for your repair quotes and estimates</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">Call-out Fee (R)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.callout_fee}
            onChange={(e) => onChange('callout_fee', e.target.value)}
            placeholder="e.g. 350.00"
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark font-mono"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">Diagnostic Fee (R)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.diagnostic_fee}
            onChange={(e) => onChange('diagnostic_fee', e.target.value)}
            placeholder="e.g. 450.00"
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark font-mono"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">Default Deposit (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={values.default_deposit_percent}
            onChange={(e) => onChange('default_deposit_percent', e.target.value)}
            placeholder="e.g. 50"
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark font-mono"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-grey uppercase tracking-wide">Standard Terms & Conditions</label>
        <textarea
          rows={8}
          value={values.terms_conditions}
          onChange={(e) => onChange('terms_conditions', e.target.value)}
          placeholder="Enter your standard terms and conditions for repair quotes..."
          className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark resize-none"
        />
        <p className="text-[10px] text-grey-medium">This text will appear on your quote PDFs and invoices</p>
      </div>
    </div>
  )
}
