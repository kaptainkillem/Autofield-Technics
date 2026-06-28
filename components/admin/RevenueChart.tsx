'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface MonthlyData {
  month: string
  revenue: number
  jobs: number
}

interface RevenueChartProps {
  data: MonthlyData[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-grey-medium text-sm">
        No revenue data available
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-grey-dark uppercase tracking-wide">Monthly Revenue</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#767676' }}
            axisLine={{ stroke: '#E8E8E8' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#767676' }}
            axisLine={{ stroke: '#E8E8E8' }}
            tickFormatter={(value: number) => `R${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
          />
          <Tooltip
            formatter={(value: any) => [`R ${Number(value).toLocaleString('en-ZA')}`, 'Revenue']}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E8E8E8',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="revenue" fill="#5B9BD5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
