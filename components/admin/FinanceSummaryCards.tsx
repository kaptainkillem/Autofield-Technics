import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

interface FinanceSummaryCardsProps {
  totalRevenue: number
  totalExpenses: number
}

export function FinanceSummaryCards({ totalRevenue, totalExpenses }: FinanceSummaryCardsProps) {
  const netProfit = totalRevenue - totalExpenses
  const isProfitable = netProfit >= 0

  const formatR = (n: number) => `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Revenue */}
      <div className="bg-white border border-grey-medium/10 rounded-base p-5 shadow-sm flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-success/10 text-success rounded-base">
            <TrendingUp size={16} />
          </div>
          <span className="text-xs font-bold text-grey uppercase tracking-wider">Gross Revenue</span>
        </div>
        <p className="text-2xl font-black text-grey-dark">{formatR(totalRevenue)}</p>
        <p className="text-[11px] text-grey">Total income from all completed jobs</p>
      </div>

      {/* Expenses */}
      <div className="bg-white border border-grey-medium/10 rounded-base p-5 shadow-sm flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-error/10 text-error rounded-base">
            <TrendingDown size={16} />
          </div>
          <span className="text-xs font-bold text-grey uppercase tracking-wider">Total Expenses</span>
        </div>
        <p className="text-2xl font-black text-grey-dark">{formatR(totalExpenses)}</p>
        <p className="text-[11px] text-grey">Parts, fuel, tools, and overheads</p>
      </div>

      {/* Net Profit */}
      <div className={`border rounded-base p-5 shadow-sm flex flex-col gap-2 ${isProfitable ? 'bg-success/5 border-success/20' : 'bg-error/5 border-error/20'}`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-base ${isProfitable ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
            <Wallet size={16} />
          </div>
          <span className={`text-xs font-bold uppercase tracking-wider ${isProfitable ? 'text-success' : 'text-error'}`}>
            Net Profit
          </span>
        </div>
        <p className={`text-2xl font-black ${isProfitable ? 'text-success' : 'text-error'}`}>
          {formatR(Math.abs(netProfit))}
        </p>
        <p className="text-[11px] text-grey">
          {isProfitable ? 'You are in the green' : 'You are running at a loss'}
        </p>
      </div>
    </div>
  )
}
