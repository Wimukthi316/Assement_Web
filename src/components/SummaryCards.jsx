import { TrendingUp, Banknote, AlertCircle, Clock } from 'lucide-react'
import { formatCurrency } from '../utils/helpers.js'

function Card({ icon: Icon, label, value, sub, iconBg, iconColor, valueColor }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            {label}
          </p>
          <p className={`text-2xl font-bold leading-none ${valueColor}`}>
            {value}
          </p>
          {sub && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{sub}</p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={22} className={iconColor} />
        </div>
      </div>
    </div>
  )
}

export default function SummaryCards({ summary, totalAssignments }) {
  const { totalExpectedProfit, totalRealizedProfit, pendingClientPayments, pendingSubPayments } =
    summary

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        icon={TrendingUp}
        label="Total Expected Profit"
        value={formatCurrency(totalExpectedProfit)}
        sub={`Across ${totalAssignments} assignments`}
        iconBg="bg-indigo-50 dark:bg-indigo-900/30"
        iconColor="text-indigo-600 dark:text-indigo-400"
        valueColor="text-indigo-700 dark:text-indigo-300"
      />
      <Card
        icon={Banknote}
        label="Realized Profit"
        value={formatCurrency(totalRealizedProfit)}
        sub="From paid assignments"
        iconBg="bg-emerald-50 dark:bg-emerald-900/30"
        iconColor="text-emerald-600 dark:text-emerald-400"
        valueColor="text-emerald-700 dark:text-emerald-300"
      />
      <Card
        icon={AlertCircle}
        label="Client Owes You"
        value={formatCurrency(pendingClientPayments)}
        sub="Balance due after advances"
        iconBg="bg-amber-50 dark:bg-amber-900/30"
        iconColor="text-amber-600 dark:text-amber-400"
        valueColor="text-amber-700 dark:text-amber-300"
      />
      <Card
        icon={Clock}
        label="You Owe Subs"
        value={formatCurrency(pendingSubPayments)}
        sub="Pending sub payments"
        iconBg="bg-rose-50 dark:bg-rose-900/30"
        iconColor="text-rose-600 dark:text-rose-400"
        valueColor="text-rose-700 dark:text-rose-300"
      />
    </div>
  )
}
