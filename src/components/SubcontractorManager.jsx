import { useEffect, useRef, useState } from 'react'
import { X, Plus, Trash2, Users, UserCheck, Loader2, Search } from 'lucide-react'

/**
 * Dedicated place to manage the saved subcontractor "address book".
 * Add new names, see them all, and remove ones you no longer use.
 * "ME" is shown pinned at the top (it comes from your account and can't be removed).
 */
export default function SubcontractorManager({
  subcontractors = [],
  selfName = 'Me',
  onCreate,
  onDelete,
  onClose,
}) {
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => inputRef.current?.focus(), 30)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      clearTimeout(t)
    }
  }, [onClose])

  const q = query.trim().toLowerCase()
  const filtered = q
    ? subcontractors.filter((s) => s.name.toLowerCase().includes(q))
    : subcontractors

  async function handleAdd(e) {
    e?.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || adding) return
    setAdding(true)
    setError(null)
    try {
      await onCreate?.(trimmed)
      setName('')
      inputRef.current?.focus()
    } catch (err) {
      setError(err?.message || 'Could not add subcontractor')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id) {
    setDeletingId(id)
    setError(null)
    try {
      await onDelete?.(id)
    } catch (err) {
      setError(err?.message || 'Could not remove subcontractor')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sub-manager-title"
        className="relative z-10 flex flex-col w-full max-w-lg max-h-[min(90vh,760px)] rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <Users size={18} className="text-indigo-500" />
            <div>
              <h2 id="sub-manager-title" className="text-base font-bold text-slate-900 dark:text-white">
                Subcontractors
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {subcontractors.length} saved · used in the Add Assignment dropdown
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Add form */}
        <div className="px-5 sm:px-6 pt-4 pb-3 shrink-0">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Add a subcontractor name…"
              maxLength={80}
              className="flex-1 h-10 px-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!name.trim() || adding}
              className="flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors shrink-0"
            >
              {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Add
            </button>
          </form>
          {error && <p className="text-xs text-rose-500 mt-2">{error}</p>}
        </div>

        {/* Search (only when the list is long enough to warrant it) */}
        {subcontractors.length > 6 && (
          <div className="px-5 sm:px-6 pb-2 shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full h-9 pl-8 pr-3 text-sm rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 pb-5">
          {/* Pinned ME */}
          <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-700/60">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold shrink-0">
              <UserCheck size={11} /> ME
            </span>
            <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 truncate">{selfName}</span>
            <span className="text-[11px] text-slate-400">from your account</span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-10 text-center">
              <Users size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {subcontractors.length === 0
                  ? 'No subcontractors yet. Add your first one above.'
                  : 'No matches for your search.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filtered.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">
                    {s.name.charAt(0)}
                  </span>
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 truncate">{s.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id)}
                    disabled={deletingId === s.id}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 transition-colors disabled:opacity-50"
                    title="Remove"
                  >
                    {deletingId === s.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 px-5 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
          <p className="text-[11px] text-slate-400">
            Removing a name here won’t change assignments that already use it.
          </p>
        </div>
      </div>
    </div>
  )
}
