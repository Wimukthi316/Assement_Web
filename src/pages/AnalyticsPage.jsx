import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  TrendingUp,
  Banknote,
  Wallet,
  Users,
  UserCheck,
  CalendarRange,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader,
} from 'lucide-react'
import { fetchAssignments } from '../services/api.js'
import { getAnalytics, formatCurrency } from '../utils/helpers.js'
import { useAuth } from '../context/AuthContext.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { LoadingState, ErrorBanner } from '../components/StatusMessages.jsx'

function toInput(d) {
  if (!d) return ''
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d - tz).toISOString().slice(0, 10)
}

function startOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function startOfYear() {
  return new Date(new Date().getFullYear(), 0, 1)
}
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

const PRESETS = [
  { id: 'thisMonth', label: 'This month', range: () => ({ from: toInput(startOfMonth()), to: toInput(new Date()) }) },
  { id: 'last30', label: 'Last 30 days', range: () => ({ from: toInput(daysAgo(29)), to: toInput(new Date()) }) },
  { id: 'last90', label: 'Last 90 days', range: () => ({ from: toInput(daysAgo(89)), to: toInput(new Date()) }) },
  { id: 'thisYear', label: 'This year', range: () => ({ from: toInput(startOfYear()), to: toInput(new Date()) }) },
  { id: 'all', label: 'All time', range: () => ({ from: '', to: '' }) },
]

function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor, valueColor }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            {label}
          </p>
          <p className={`text-2xl font-bold leading-none ${valueColor}`}>{value}</p>
          {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={22} className={iconColor} />
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const selfName = user?.displayName || user?.email?.split('@')[0] || 'Me'

  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [preset, setPreset] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [basis, setBasis] = useState('dateReceived')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAssignments()
      setAssignments(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) load()
  }, [user, load])

  function applyPreset(id) {
    setPreset(id)
    const p = PRESETS.find((x) => x.id === id)
    if (p) {
      const { from: f, to: t } = p.range()
      setFrom(f)
      setTo(t)
    }
  }

  const { totals, perSubcontractor, selfWork } = useMemo(
    () => getAnalytics(assignments, { from: from || null, to: to || null, basis }),
    [assignments, from, to, basis]
  )

  const subProfitTotal = useMemo(
    () => perSubcontractor.reduce((n, s) => n + s.profitGenerated, 0),
    [perSubcontractor]
  )
  const profitToYouTotal = subProfitTotal + (selfWork?.profitGenerated || 0)

  const maxSubValue = useMemo(
    () =>
      Math.max(
        1,
        ...perSubcontractor.map((s) => s.paid + s.owed),
        selfWork?.profitGenerated || 0
      ),
    [perSubcontractor, selfWork]
  )

  const rangeLabel =
    from || to
      ? `${from || '…'} → ${to || 'today'}`
      : 'All time'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
                <BarChart3 size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-slate-900 dark:text-white leading-none truncate">
                  Analytics
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-none mt-0.5 truncate">
                  {rangeLabel}
                </p>
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {error && <ErrorBanner message={error} onRetry={load} onDismiss={() => setError(null)} />}

        {loading ? (
          <LoadingState />
        ) : (
          <>
            {/* Date range controls */}
            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <CalendarRange size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Date Range</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      preset === p.id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                        : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    From
                  </label>
                  <input
                    type="date"
                    value={from}
                    max={to || undefined}
                    onChange={(e) => {
                      setFrom(e.target.value)
                      setPreset('custom')
                    }}
                    className="h-10 px-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    To
                  </label>
                  <input
                    type="date"
                    value={to}
                    min={from || undefined}
                    onChange={(e) => {
                      setTo(e.target.value)
                      setPreset('custom')
                    }}
                    className="h-10 px-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Date basis
                  </label>
                  <select
                    value={basis}
                    onChange={(e) => setBasis(e.target.value)}
                    className="h-10 px-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="dateReceived">Date received</option>
                    <option value="dueDate">Due date</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={CalendarRange}
                label="Assignments"
                value={totals.count}
                sub={`${totals.completed} completed · ${totals.selfCount} by you`}
                iconBg="bg-slate-100 dark:bg-slate-700/50"
                iconColor="text-slate-600 dark:text-slate-300"
                valueColor="text-slate-800 dark:text-white"
              />
              <StatCard
                icon={TrendingUp}
                label="Expected Profit"
                value={formatCurrency(totals.expectedProfit)}
                sub={`On ${formatCurrency(totals.clientRevenue)} revenue`}
                iconBg="bg-indigo-50 dark:bg-indigo-900/30"
                iconColor="text-indigo-600 dark:text-indigo-400"
                valueColor="text-indigo-700 dark:text-indigo-300"
              />
              <StatCard
                icon={Banknote}
                label="Realized Profit"
                value={formatCurrency(totals.realizedProfit)}
                sub="From client-paid jobs"
                iconBg="bg-emerald-50 dark:bg-emerald-900/30"
                iconColor="text-emerald-600 dark:text-emerald-400"
                valueColor="text-emerald-700 dark:text-emerald-300"
              />
              <StatCard
                icon={Wallet}
                label="Paid to Subs"
                value={formatCurrency(totals.paidToSubs)}
                sub={`${formatCurrency(totals.owedToSubs)} still owed`}
                iconBg="bg-rose-50 dark:bg-rose-900/30"
                iconColor="text-rose-600 dark:text-rose-400"
                valueColor="text-rose-700 dark:text-rose-300"
              />
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={AlertCircle}
                label="Client Owes You"
                value={formatCurrency(totals.clientPending)}
                sub="Balance after advances"
                iconBg="bg-amber-50 dark:bg-amber-900/30"
                iconColor="text-amber-600 dark:text-amber-400"
                valueColor="text-amber-700 dark:text-amber-300"
              />
              <StatCard
                icon={CheckCircle2}
                label="Completed"
                value={totals.completed}
                sub="In range"
                iconBg="bg-emerald-50 dark:bg-emerald-900/30"
                iconColor="text-emerald-600 dark:text-emerald-400"
                valueColor="text-emerald-700 dark:text-emerald-300"
              />
              <StatCard
                icon={Loader}
                label="In Progress"
                value={totals.inProgress}
                sub="In range"
                iconBg="bg-blue-50 dark:bg-blue-900/30"
                iconColor="text-blue-600 dark:text-blue-400"
                valueColor="text-blue-700 dark:text-blue-300"
              />
              <StatCard
                icon={Clock}
                label="Pending"
                value={totals.pending}
                sub="In range"
                iconBg="bg-slate-100 dark:bg-slate-700/50"
                iconColor="text-slate-500 dark:text-slate-300"
                valueColor="text-slate-700 dark:text-slate-200"
              />
            </div>

            {/* Profit breakdown: your work + subcontractors */}
            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Users size={17} className="text-indigo-500" />
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                      Profit by who did the work
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Includes your ME jobs and money paid to subcontractors
                    </p>
                  </div>
                </div>
              </div>

              {perSubcontractor.length === 0 && !(selfWork?.count > 0) ? (
                <div className="py-14 text-center">
                  <Users size={34} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No assignments in this range yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <th className="px-5 py-3 text-left">Who</th>
                        <th className="px-4 py-3 text-right">Jobs</th>
                        <th className="px-4 py-3 text-right">Paid to them</th>
                        <th className="px-4 py-3 text-right">Still owed</th>
                        <th className="px-4 py-3 text-right">Profit generated to you</th>
                        <th className="px-5 py-3 text-left w-40">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selfWork?.count > 0 && (
                        <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-indigo-50/40 dark:bg-indigo-900/10">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold shrink-0">
                                <UserCheck size={11} /> ME
                              </span>
                              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {selfName}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-300 tabular-nums">
                            {selfWork.count}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-slate-400 tabular-nums">
                            —
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-slate-400 tabular-nums">
                            —
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                            {formatCurrency(selfWork.profitGenerated)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-indigo-500"
                                style={{
                                  width: `${(selfWork.profitGenerated / maxSubValue) * 100}%`,
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                      {perSubcontractor.map((s) => (
                        <tr
                          key={s.name}
                          className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">
                                {s.name.charAt(0)}
                              </span>
                              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {s.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-300 tabular-nums">
                            {s.count}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {formatCurrency(s.paid)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                            {s.owed > 0 ? formatCurrency(s.owed) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                            {formatCurrency(s.profitGenerated)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-indigo-500"
                                style={{ width: `${((s.paid + s.owed) / maxSubValue) * 100}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 dark:bg-slate-700/40 font-bold text-slate-700 dark:text-slate-200">
                        <td className="px-5 py-3 text-sm">Total</td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums">
                          {(selfWork?.count || 0) +
                            perSubcontractor.reduce((n, s) => n + s.count, 0)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(totals.paidToSubs)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums text-amber-600 dark:text-amber-400">
                          {formatCurrency(totals.owedToSubs)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(profitToYouTotal)}
                        </td>
                        <td className="px-5 py-3" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
