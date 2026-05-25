import { Pencil, Trash2, ChevronDown, ChevronUp, AlertTriangle, Clock, CheckCircle, Loader, FileX } from 'lucide-react'
import {
  formatDate,
  formatCurrency,
  calcProfit,
  isOverdue,
  isDueToday,
  isUrgentWarning,
  daysUntilDue,
} from '../utils/helpers.js'
import { useState } from 'react'

function StatusBadge({ status }) {
  const map = {
    Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  }
  const icons = {
    Pending: Clock,
    'In Progress': Loader,
    Completed: CheckCircle,
  }
  const Icon = icons[status] || Clock
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || ''}`}>
      <Icon size={11} />
      {status}
    </span>
  )
}

function PaidBadge({ paid, label }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
        paid
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
      }`}
    >
      {paid ? '✓' : '✗'} {label}
    </span>
  )
}

function DueDateCell({ dueDate, status, urgent }) {
  const overdue = isOverdue(dueDate, status)
  const today = isDueToday(dueDate)
  const days = daysUntilDue(dueDate)

  if (!dueDate) return <span className="text-slate-400">—</span>

  return (
    <div>
      <div className="flex items-center gap-1.5">
        {urgent && (
          <AlertTriangle size={14} className="text-orange-500 dark:text-orange-400 shrink-0" />
        )}
        <span
          className={`text-sm font-medium ${
            overdue
              ? 'text-rose-600 dark:text-rose-400'
              : urgent
              ? 'text-orange-600 dark:text-orange-400'
              : today
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-slate-700 dark:text-slate-200'
          }`}
        >
          {formatDate(dueDate)}
        </span>
      </div>
      {status !== 'Completed' && days !== null && (
        <p
          className={`text-xs mt-0.5 ${
            overdue
              ? 'text-rose-500'
              : urgent
              ? 'text-orange-500 dark:text-orange-400 font-medium'
              : today
              ? 'text-amber-500'
              : 'text-slate-400'
          }`}
        >
          {overdue
            ? `${Math.abs(days)}d overdue`
            : today
            ? 'Due today!'
            : urgent
            ? `${days}d left — urgent`
            : `${days}d left`}
        </p>
      )}
    </div>
  )
}

function RowExpandedDetails({ a }) {
  const profit = calcProfit(a.clientPrice, a.subcontractorPrice)
  return (
    <tr>
      <td colSpan={99} className="px-6 pb-4 pt-0">
        <div className="ml-0 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 text-sm grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">Date Received</p>
            <p className="text-slate-700 dark:text-slate-200">{formatDate(a.dateReceived) || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">Subcontractor</p>
            <p className="text-slate-700 dark:text-slate-200">
              {a.subcontractorName?.trim() || 'Self-assigned'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">Client Advance</p>
            <p className="text-slate-700 dark:text-slate-200">
              {formatCurrency(a.clientAdvance, { optional: true })}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">Profit</p>
            <p className={`font-semibold ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(profit)}
            </p>
          </div>
          {a.notes && (
            <div className="col-span-full">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">Notes</p>
              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{a.notes}</p>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

function TableRow({ a, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const overdue = isOverdue(a.dueDate, a.assignmentStatus)
  const completed = a.assignmentStatus === 'Completed'
  const urgent = isUrgentWarning(a.dueDate, a.assignmentStatus)
  const profit = calcProfit(a.clientPrice, a.subcontractorPrice)

  const rowBase = completed
    ? 'bg-emerald-50/40 dark:bg-emerald-900/10'
    : overdue
    ? 'bg-rose-50/50 dark:bg-rose-900/15'
    : urgent
    ? 'bg-orange-50/60 dark:bg-orange-900/15 ring-1 ring-inset ring-orange-200/60 dark:ring-orange-800/40'
    : 'bg-white dark:bg-slate-800'

  return (
    <>
      <tr
        className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer ${rowBase}`}
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="w-1 p-0">
          <div
            className={`w-1 h-full min-h-[52px] rounded-l ${
              completed
                ? 'bg-emerald-400 dark:bg-emerald-500'
                : overdue
                ? 'bg-rose-400 dark:bg-rose-500'
                : urgent
                ? 'bg-orange-400 dark:bg-orange-500'
                : isDueToday(a.dueDate)
                ? 'bg-amber-400 dark:bg-amber-500'
                : 'bg-transparent'
            }`}
          />
        </td>

        <td className="px-4 py-3 min-w-[150px]">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{a.clientName || '—'}</p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-medium">{a.moduleCode || '—'}</p>
          {!a.subcontractorName?.trim() && (
            <p className="text-xs text-slate-400 mt-0.5 italic">Unassigned</p>
          )}
        </td>

        <td className="px-4 py-3 min-w-[120px]">
          <DueDateCell dueDate={a.dueDate} status={a.assignmentStatus} urgent={urgent} />
        </td>

        <td className="px-4 py-3">
          <StatusBadge status={a.assignmentStatus} />
          {overdue && (
            <div className="mt-1">
              <AlertTriangle size={11} className="inline text-rose-500 mr-0.5" />
              <span className="text-xs text-rose-500 font-medium">Overdue</span>
            </div>
          )}
          {urgent && !overdue && (
            <div className="mt-1">
              <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold">Due soon</span>
            </div>
          )}
        </td>

        <td className="px-4 py-3 min-w-[130px]">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {formatCurrency(a.clientPrice, { optional: true })}
          </p>
          {(parseFloat(a.clientAdvance) || 0) > 0 && (
            <p className="text-xs text-slate-400 mt-0.5">
              Adv: {formatCurrency(a.clientAdvance)}
            </p>
          )}
          <PaidBadge paid={a.clientPaidStatus} label={a.clientPaidStatus ? 'Paid' : 'Unpaid'} />
        </td>

        <td className="px-4 py-3 min-w-[130px]">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {formatCurrency(a.subcontractorPrice, { optional: true })}
          </p>
          <PaidBadge paid={a.subcontractorPaidStatus} label={a.subcontractorPaidStatus ? 'Paid' : 'Unpaid'} />
        </td>

        <td className="px-4 py-3 min-w-[100px]">
          <span
            className={`text-sm font-bold ${
              profit > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : profit < 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-500'
            }`}
          >
            {formatCurrency(profit)}
          </span>
        </td>

        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(a)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(a.id)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={expanded ? 'Collapse' : 'Expand details'}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </td>
      </tr>
      {expanded && <RowExpandedDetails a={a} />}
    </>
  )
}

export default function AssignmentTable({ assignments, onEdit, onDelete }) {
  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <FileX size={40} className="text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">No assignments found</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
          Try adjusting your filters or add a new assignment
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <th className="w-1 p-0" />
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Client / Module
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Client Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Sub Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Profit
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <TableRow key={a.id} a={a} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700/50 flex flex-wrap gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> Overdue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-orange-400" /> Due ≤ 2 days
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Due Today
        </span>
        <span className="flex items-center gap-1.5 ml-auto text-slate-300 dark:text-slate-600">
          Click row to expand details
        </span>
      </div>
    </div>
  )
}
