import { useState, useEffect } from 'react'
import { X, Save, Plus, Calculator } from 'lucide-react'
import { generateId, calcProfit, formatCurrency } from '../utils/helpers.js'

const EMPTY_FORM = {
  dateReceived: '',
  clientName: '',
  moduleCode: '',
  dueDate: '',
  clientPrice: '',
  clientAdvance: '',
  clientPaidStatus: false,
  subcontractorName: '',
  subcontractorPrice: '',
  subcontractorPaidStatus: false,
  assignmentStatus: 'Pending',
  notes: '',
}

function toFormValues(assignment) {
  return {
    ...assignment,
    clientPrice: assignment.clientPrice ? String(assignment.clientPrice) : '',
    clientAdvance: assignment.clientAdvance ? String(assignment.clientAdvance) : '',
    subcontractorPrice: assignment.subcontractorPrice ? String(assignment.subcontractorPrice) : '',
  }
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  )
}

/**
 * Mutually exclusive Paid / Unpaid control.
 * Segmented buttons are clearer than a single checkbox that swaps labels.
 */
function PaymentStatusControl({ value, onChange, paidTone = 'emerald' }) {
  const paidActive =
    paidTone === 'emerald'
      ? 'bg-emerald-600 text-white shadow-sm'
      : 'bg-emerald-600 text-white shadow-sm'
  const unpaidActive = 'bg-amber-500 text-white shadow-sm'

  return (
    <div
      role="radiogroup"
      aria-label="Payment status"
      className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600"
    >
      <button
        type="button"
        role="radio"
        aria-checked={!value}
        onClick={() => onChange(false)}
        className={`h-9 rounded-lg text-sm font-semibold transition-colors ${
          !value
            ? unpaidActive
            : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-600/50'
        }`}
      >
        Unpaid
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value}
        onClick={() => onChange(true)}
        className={`h-9 rounded-lg text-sm font-semibold transition-colors ${
          value
            ? paidActive
            : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-600/50'
        }`}
      >
        Paid
      </button>
    </div>
  )
}

const inputClass =
  'w-full h-10 px-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500'

export default function AssignmentForm({ assignment, onSave, onClose, saving = false }) {
  const isEdit = !!assignment
  const [form, setForm] = useState(isEdit ? toFormValues(assignment) : { ...EMPTY_FORM })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate() {
    const errs = {}
    if (!form.clientName.trim()) errs.clientName = 'Required'
    if (!form.moduleCode.trim()) errs.moduleCode = 'Required'
    if (!form.dueDate) errs.dueDate = 'Required'
    if (form.clientPrice !== '' && isNaN(Number(form.clientPrice))) {
      errs.clientPrice = 'Must be a number'
    }
    if (form.clientAdvance !== '' && isNaN(Number(form.clientAdvance))) {
      errs.clientAdvance = 'Must be a number'
    }
    if (form.subcontractorPrice !== '' && isNaN(Number(form.subcontractorPrice))) {
      errs.subcontractorPrice = 'Must be a number'
    }
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    const record = {
      ...form,
      id: isEdit ? form.id : generateId(),
      clientPrice: form.clientPrice === '' ? 0 : parseFloat(form.clientPrice) || 0,
      clientAdvance: form.clientAdvance === '' ? 0 : parseFloat(form.clientAdvance) || 0,
      subcontractorPrice: form.subcontractorPrice === '' ? 0 : parseFloat(form.subcontractorPrice) || 0,
      subcontractorName: form.subcontractorName?.trim() || '',
      createdAt: isEdit ? form.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setSubmitting(true)
    try {
      await onSave(record)
    } catch {
      // Error is surfaced by App error banner
    } finally {
      setSubmitting(false)
    }
  }

  const isBusy = saving || submitting

  const profit = calcProfit(form.clientPrice, form.subcontractorPrice)
  const profitColor =
    profit > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : profit < 0
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-slate-500 dark:text-slate-400'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal shell — capped height so inner form can scroll */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assignment-form-title"
        className="relative z-10 flex flex-col w-full max-w-2xl max-h-[min(92vh,880px)] rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-2.5">
            {isEdit ? (
              <Save size={18} className="text-indigo-500" />
            ) : (
              <Plus size={18} className="text-indigo-500" />
            )}
            <h2 id="assignment-form-title" className="text-base font-bold text-slate-900 dark:text-white">
              {isEdit ? 'Edit Assignment' : 'New Assignment'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-5 space-y-6">
            {/* Section: Assignment Info */}
            <section>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                Assignment Details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Client Name" required>
                  <input
                    className={`${inputClass} ${errors.clientName ? 'border-rose-400 focus:ring-rose-500/50' : ''}`}
                    placeholder="John Smith"
                    value={form.clientName}
                    onChange={(e) => set('clientName', e.target.value)}
                  />
                  {errors.clientName && (
                    <p className="text-xs text-rose-500 mt-1">{errors.clientName}</p>
                  )}
                </Field>

                <Field label="Module Code" required>
                  <input
                    className={`${inputClass} ${errors.moduleCode ? 'border-rose-400 focus:ring-rose-500/50' : ''}`}
                    placeholder="CS101"
                    value={form.moduleCode}
                    onChange={(e) => set('moduleCode', e.target.value)}
                  />
                  {errors.moduleCode && (
                    <p className="text-xs text-rose-500 mt-1">{errors.moduleCode}</p>
                  )}
                </Field>

                <Field label="Date Received">
                  <input
                    type="date"
                    className={inputClass}
                    value={form.dateReceived}
                    onChange={(e) => set('dateReceived', e.target.value)}
                  />
                </Field>

                <Field label="Due Date" required>
                  <input
                    type="date"
                    className={`${inputClass} ${errors.dueDate ? 'border-rose-400 focus:ring-rose-500/50' : ''}`}
                    value={form.dueDate}
                    onChange={(e) => set('dueDate', e.target.value)}
                  />
                  {errors.dueDate && (
                    <p className="text-xs text-rose-500 mt-1">{errors.dueDate}</p>
                  )}
                </Field>

                <Field label="Assignment Status">
                  <select
                    className={inputClass}
                    value={form.assignmentStatus}
                    onChange={(e) => set('assignmentStatus', e.target.value)}
                  >
                    <option>Pending</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                </Field>
              </div>
            </section>

            {/* Section: Client */}
            <section>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                Client Payment
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Client Price (LKR)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`${inputClass} ${errors.clientPrice ? 'border-rose-400 focus:ring-rose-500/50' : ''}`}
                    placeholder="Leave blank if TBD"
                    value={form.clientPrice}
                    onChange={(e) => set('clientPrice', e.target.value)}
                  />
                  {errors.clientPrice && (
                    <p className="text-xs text-rose-500 mt-1">{errors.clientPrice}</p>
                  )}
                </Field>

                <Field label="Client Advance (LKR)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`${inputClass} ${errors.clientAdvance ? 'border-rose-400 focus:ring-rose-500/50' : ''}`}
                    placeholder="Advance received"
                    value={form.clientAdvance}
                    onChange={(e) => set('clientAdvance', e.target.value)}
                  />
                  {errors.clientAdvance && (
                    <p className="text-xs text-rose-500 mt-1">{errors.clientAdvance}</p>
                  )}
                </Field>

                <Field label="Client Payment Status">
                  <PaymentStatusControl
                    value={form.clientPaidStatus}
                    onChange={(paid) => set('clientPaidStatus', paid)}
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Default is Unpaid. Tap Paid only after the client has paid.
                  </p>
                </Field>
              </div>
            </section>

            {/* Section: Subcontractor */}
            <section>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                Subcontractor
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Subcontractor Name">
                  <input
                    className={inputClass}
                    placeholder="Leave blank if self-assigned"
                    value={form.subcontractorName}
                    onChange={(e) => set('subcontractorName', e.target.value)}
                  />
                </Field>

                <Field label="Subcontractor Price (LKR)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`${inputClass} ${errors.subcontractorPrice ? 'border-rose-400 focus:ring-rose-500/50' : ''}`}
                    placeholder="Leave blank if TBD"
                    value={form.subcontractorPrice}
                    onChange={(e) => set('subcontractorPrice', e.target.value)}
                  />
                  {errors.subcontractorPrice && (
                    <p className="text-xs text-rose-500 mt-1">{errors.subcontractorPrice}</p>
                  )}
                </Field>

                <Field label="Sub Payment Status">
                  <PaymentStatusControl
                    value={form.subcontractorPaidStatus}
                    onChange={(paid) => set('subcontractorPaidStatus', paid)}
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Default is Unpaid. Tap Paid after you pay the subcontractor.
                  </p>
                </Field>
              </div>
            </section>

            {/* Profit Preview */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2">
                <Calculator size={15} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Profit Preview
                </span>
              </div>
              <p className={`text-xl font-bold mt-1 ${profitColor}`}>
                {formatCurrency(profit)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {formatCurrency(form.clientPrice || 0, { optional: true })} (client) −{' '}
                {formatCurrency(form.subcontractorPrice || 0, { optional: true })} (sub)
              </p>
            </div>

            {/* Notes */}
            <Field label="Notes">
              <textarea
                className={`${inputClass} h-24 py-2.5 resize-none`}
                placeholder="Any additional details..."
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </Field>
          </div>

          {/* Sticky footer actions — always visible */}
          <div className="shrink-0 flex gap-3 px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="flex-1 h-11 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="flex-1 h-11 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
            >
              {isEdit ? <Save size={16} /> : <Plus size={16} />}
              {isBusy ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
