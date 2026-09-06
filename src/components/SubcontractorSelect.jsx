import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search, UserCheck, User, Plus, Check, X, Loader2 } from 'lucide-react'

/**
 * Searchable subcontractor picker.
 *
 * Behaves like a dropdown/combobox:
 *   • "ME — <your name>" is always pinned to the top (self-assigned).
 *   • Your saved subcontractors are listed A→Z and filtered as you type.
 *   • Typing a new name reveals a "+ Add …" row that saves it to your list.
 *   • A "Leave unassigned" row clears the field for jobs with no sub yet.
 *
 * Value model (controlled): { name: string, isSelf: boolean }
 */
export default function SubcontractorSelect({
  value = '',
  isSelf = false,
  selfName = 'Me',
  subcontractors = [],
  onChange,
  onCreate,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    // Focus the search field when opening
    const t = setTimeout(() => inputRef.current?.focus(), 20)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
      clearTimeout(t)
    }
  }, [open])

  const q = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!q) return subcontractors
    return subcontractors.filter((s) => s.name.toLowerCase().includes(q))
  }, [subcontractors, q])

  const exactExists = useMemo(
    () => subcontractors.some((s) => s.name.trim().toLowerCase() === q),
    [subcontractors, q]
  )
  const canAdd = q.length > 0 && !exactExists

  function pickSelf() {
    onChange?.({ name: selfName, isSelf: true })
    setOpen(false)
    setQuery('')
  }

  function pickSub(name) {
    onChange?.({ name, isSelf: false })
    setOpen(false)
    setQuery('')
  }

  function clearSelection() {
    onChange?.({ name: '', isSelf: false })
    setOpen(false)
    setQuery('')
  }

  async function handleAdd() {
    const name = query.trim()
    if (!name || creating) return
    setCreating(true)
    try {
      const created = await onCreate?.(name)
      const finalName = created?.name || name
      pickSub(finalName)
    } catch {
      // Parent surfaces the error; keep the dropdown open so the user can retry.
    } finally {
      setCreating(false)
    }
  }

  // What the closed control displays
  const triggerLabel = isSelf ? (
    <span className="flex items-center gap-2 min-w-0">
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold shrink-0">
        <UserCheck size={11} /> ME
      </span>
      <span className="truncate text-slate-800 dark:text-slate-100">{selfName}</span>
    </span>
  ) : value ? (
    <span className="flex items-center gap-2 min-w-0">
      <User size={14} className="text-slate-400 shrink-0" />
      <span className="truncate text-slate-800 dark:text-slate-100">{value}</span>
    </span>
  ) : (
    <span className="text-slate-400">Select or add a subcontractor</span>
  )

  const rowBase =
    'flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors'

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full h-10 px-3 flex items-center justify-between gap-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
      >
        <span className="min-w-0 flex-1 text-left">{triggerLabel}</span>
        <ChevronDown
          size={16}
          className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-30 mt-1.5 w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden"
        >
          {/* Search */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-700">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (canAdd) handleAdd()
                    else if (filtered.length === 1) pickSub(filtered[0].name)
                  }
                }}
                placeholder="Search or type a new name…"
                className="w-full h-9 pl-8 pr-3 text-sm rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto overscroll-contain py-1">
            {/* ME — pinned self option */}
            <button type="button" onClick={pickSelf} className={`${rowBase} hover:bg-indigo-50 dark:hover:bg-indigo-900/20`}>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold shrink-0">
                <UserCheck size={11} /> ME
              </span>
              <span className="truncate flex-1 text-slate-800 dark:text-slate-100">{selfName}</span>
              <span className="text-[11px] text-slate-400 shrink-0">self · keep 100%</span>
              {isSelf && <Check size={15} className="text-indigo-500 shrink-0" />}
            </button>

            <div className="my-1 border-t border-slate-100 dark:border-slate-700/60" />

            {/* Saved subcontractors */}
            {filtered.length > 0 ? (
              filtered.map((s) => {
                const selected = !isSelf && value.trim().toLowerCase() === s.name.trim().toLowerCase()
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => pickSub(s.name)}
                    className={`${rowBase} hover:bg-slate-50 dark:hover:bg-slate-700/40`}
                  >
                    <User size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate flex-1 text-slate-700 dark:text-slate-200">{s.name}</span>
                    {selected && <Check size={15} className="text-indigo-500 shrink-0" />}
                  </button>
                )
              })
            ) : (
              !canAdd && (
                <p className="px-3 py-3 text-xs text-slate-400 text-center">
                  {subcontractors.length === 0
                    ? 'No saved subcontractors yet. Type a name to add one.'
                    : 'No matches.'}
                </p>
              )
            )}

            {/* Inline add */}
            {canAdd && (
              <button
                type="button"
                onClick={handleAdd}
                disabled={creating}
                className={`${rowBase} text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-medium disabled:opacity-60`}
              >
                {creating ? (
                  <Loader2 size={14} className="animate-spin shrink-0" />
                ) : (
                  <Plus size={14} className="shrink-0" />
                )}
                <span className="truncate">
                  Add “{query.trim()}” to my subcontractors
                </span>
              </button>
            )}
          </div>

          {/* Footer: clear */}
          <div className="border-t border-slate-100 dark:border-slate-700 p-1">
            <button
              type="button"
              onClick={clearSelection}
              className={`${rowBase} text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-lg`}
            >
              <X size={14} className="shrink-0" />
              Leave unassigned (no subcontractor yet)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
