import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'

export function LoadingState({ message = 'Loading assignments...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Loader2 size={36} className="text-indigo-500 animate-spin mb-4" />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{message}</p>
    </div>
  )
}

export function ErrorBanner({ message, onRetry, onDismiss }) {
  return (
    <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 px-4 py-3 flex items-start gap-3">
      <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">Something went wrong</p>
        <p className="text-sm text-rose-700 dark:text-rose-300 mt-0.5">{message}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-xs font-medium rounded-lg text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}
