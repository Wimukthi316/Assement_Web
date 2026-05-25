import { useState, useEffect } from 'react'
import { X, Save, Plus, Calculator } from 'lucide-react'
import { generateId, calcProfit, formatCurrency } from '../utils/helpers.js'

const EMPTY_FORM = {
  dateReceived: '',
  clientName: '',
  moduleCode: '',
  dueDate: '',
  clientPrice: '',
  clientPaidStatus: false,
  subcontractorName: '',
  subcontractorPrice: '',
  subcontractorPaidStatus: false,
  assignmentStatus: 'Pending',
  notes: '',
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

const inputClass =
  'w-full h-10 px-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500'

export default function AssignmentForm({ assignment, onSave, onClose }) {
  const isEdit = !!assignment
  const [form, setForm] = useState(isEdit ? { ...assignment } : { ...EMPTY_FORM })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
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
    if (form.clientPrice === '' || isNaN(Number(form.clientPrice)))
      errs.clientPrice = 'Must be a number'
    if (form.subcontractorPrice === '' || isNaN(Number(form.subcontractorPrice)))
      errs.subcontractorPrice = 'Must be a number'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    const record = {
      ...form,
      id: isEdit ? form.id : generateId(),
      clientPrice: parseFloat(form.clientPrice) || 0,
      subcontractorPrice: parseFloat(form.subcontractorPrice) || 0,
      createdAt: isEdit ? form.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    onSave(record)
  }

  const profit = calcProfit(form.clientPrice, form.subcontractorPrice)
  const profitColor =
    profit > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : profit < 0
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-slate-500 dark:text-slate-400'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl mb-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            {isEdit ? (
              <Save size={18} className="text-indigo-500" />
            ) : (
              <Plus size={18} className="text-indigo-500" />
            )}
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isEdit ? 'Edit Assignment' : 'New Assignment'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Section: Assignment Info */}
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
            Assignment Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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

          {/* Section: Client */}
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
            Client Payment
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Field label="Client Price (USD)" required>
              <input
                type="number"
                min="0"
                step="0.01"
                className={`${inputClass} ${errors.clientPrice ? 'border-rose-400 focus:ring-rose-500/50' : ''}`}
                placeholder="0.00"
                value={form.clientPrice}
                onChange={(e) => set('clientPrice', e.target.value)}
              />
              {errors.clientPrice && (
                <p className="text-xs text-rose-500 mt-1">{errors.clientPrice}</p>
              )}
            </Field>

            <Field label="Client Payment Status">
              <label className="flex items-center gap-3 h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.clientPaidStatus}
                  onChange={(e) => set('clientPaidStatus', e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <span
                  className={`text-sm font-medium ${
                    form.clientPaidStatus
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {form.clientPaidStatus ? '✓ Paid' : '⏳ Unpaid'}
                </span>
              </label>
            </Field>
          </div>

          {/* Section: Subcontractor */}
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
            Subcontractor
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Field label="Subcontractor Name">
              <input
                className={inputClass}
                placeholder="Jane Doe"
                value={form.subcontractorName}
                onChange={(e) => set('subcontractorName', e.target.value)}
              />
            </Field>

            <Field label="Subcontractor Price (USD)" required>
              <input
                type="number"
                min="0"
                step="0.01"
                className={`${inputClass} ${errors.subcontractorPrice ? 'border-rose-400 focus:ring-rose-500/50' : ''}`}
                placeholder="0.00"
                value={form.subcontractorPrice}
                onChange={(e) => set('subcontractorPrice', e.target.value)}
              />
              {errors.subcontractorPrice && (
                <p className="text-xs text-rose-500 mt-1">{errors.subcontractorPrice}</p>
              )}
            </Field>

            <Field label="Sub Payment Status">
              <label className="flex items-center gap-3 h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.subcontractorPaidStatus}
                  onChange={(e) => set('subcontractorPaidStatus', e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <span
                  className={`text-sm font-medium ${
                    form.subcontractorPaidStatus
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {form.subcontractorPaidStatus ? '✓ Paid' : '⏳ Unpaid'}
                </span>
              </label>
            </Field>
          </div>

          {/* Profit Preview */}
          <div className="mb-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600">
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
              {formatCurrency(form.clientPrice || 0)} (client) − {formatCurrency(form.subcontractorPrice || 0)} (sub)
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

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
            >
              {isEdit ? <Save size={16} /> : <Plus size={16} />}
              {isEdit ? 'Save Changes' : 'Add Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
