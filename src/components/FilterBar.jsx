import { Search, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
]

const PAYMENT_OPTIONS = [
  { value: 'all', label: 'All Payments' },
  { value: 'clientUnpaid', label: 'Client Unpaid' },
  { value: 'subUnpaid', label: 'Sub Unpaid' },
  { value: 'anyUnpaid', label: 'Any Unpaid' },
]

const ASSIGNMENT_OPTIONS = [
  { value: 'all', label: 'All Assignments' },
  { value: 'unassigned', label: 'Unassigned' },
]

const DATE_OPTIONS = [
  { value: 'all', label: 'All Dates' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'upcoming', label: 'Upcoming' },
]

const SORT_OPTIONS = [
  { value: 'dueDate', label: 'Due Date' },
  { value: 'dateReceived', label: 'Date Received' },
  { value: 'clientPrice', label: 'Client Price' },
  { value: 'profit', label: 'Profit' },
]

function Select({ value, onChange, options, className = '' }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-9 pl-3 pr-8 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 cursor-pointer shrink-0 ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export default function FilterBar({ filters, setFilters, sortConfig, setSortConfig, resultCount }) {
  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.payment !== 'all' ||
    filters.assignment !== 'all' ||
    filters.date !== 'all' ||
    filters.search !== ''

  function clearFilters() {
    setFilters({ status: 'all', payment: 'all', assignment: 'all', date: 'all', search: '' })
  }

  function toggleSortDir() {
    setSortConfig((s) => ({ ...s, dir: s.dir === 'asc' ? 'desc' : 'asc' }))
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 shadow-sm overflow-hidden">
      <div className="flex flex-col gap-3">
        <div className="relative w-full">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search client, module, sub..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="w-full h-9 pl-9 pr-3 text-sm rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
          />
        </div>

        <div className="scroll-x flex items-center gap-2 pb-1">
          <SlidersHorizontal size={15} className="text-slate-400 shrink-0" />

          <Select
            value={filters.status}
            onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
            options={STATUS_OPTIONS}
          />
          <Select
            value={filters.payment}
            onChange={(v) => setFilters((f) => ({ ...f, payment: v }))}
            options={PAYMENT_OPTIONS}
          />
          <Select
            value={filters.assignment}
            onChange={(v) => setFilters((f) => ({ ...f, assignment: v }))}
            options={ASSIGNMENT_OPTIONS}
          />
          <Select
            value={filters.date}
            onChange={(v) => setFilters((f) => ({ ...f, date: v }))}
            options={DATE_OPTIONS}
          />

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 shrink-0 mx-0.5" />

          <Select
            value={sortConfig.key}
            onChange={(v) => setSortConfig((s) => ({ ...s, key: v }))}
            options={SORT_OPTIONS}
          />
          <button
            type="button"
            onClick={toggleSortDir}
            title={`Sort ${sortConfig.dir === 'asc' ? 'ascending' : 'descending'}`}
            className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowUpDown size={15} className={sortConfig.dir === 'asc' ? '' : 'rotate-180'} />
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-9 shrink-0 flex items-center gap-1.5 px-3 text-sm font-medium rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 transition-colors"
            >
              <X size={13} />
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="mt-2.5 text-xs text-slate-400 dark:text-slate-500">
        Showing <span className="font-semibold text-slate-600 dark:text-slate-300">{resultCount}</span> assignment{resultCount !== 1 ? 's' : ''}
        {hasActiveFilters && ' (filtered)'}
      </div>
    </div>
  )
}
