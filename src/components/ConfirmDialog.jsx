import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmDialog({
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}) {
  const confirmStyles =
    confirmVariant === 'primary'
      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25'
      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/25'

  const iconStyles =
    confirmVariant === 'primary'
      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
      : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={loading ? undefined : onCancel}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl p-6">
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center text-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconStyles}`}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              {title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {message}
            </p>
          </div>
          <div className="flex gap-3 w-full mt-1">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 h-10 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 h-10 rounded-xl text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors shadow-lg ${confirmStyles}`}
            >
              {loading ? 'Please wait...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
