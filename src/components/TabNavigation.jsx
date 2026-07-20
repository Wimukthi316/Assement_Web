import { useEffect, useRef } from 'react'
import { ListTodo, Flame, CheckCircle2, History } from 'lucide-react'

const TABS = [
  { id: 'active', label: 'Active Tasks', shortLabel: 'Active', icon: ListTodo },
  { id: 'urgent', label: 'Urgent (Due in 3 Days)', shortLabel: 'Urgent', icon: Flame },
  { id: 'completed', label: 'Completed', shortLabel: 'Done', icon: CheckCircle2 },
  { id: 'history', label: 'History', shortLabel: 'History', icon: History },
]

export default function TabNavigation({ activeTab, onTabChange, counts }) {
  const scrollerRef = useRef(null)
  const tabRefs = useRef({})

  // Keep the active tab visible when switching (esp. on mobile)
  useEffect(() => {
    const el = tabRefs.current[activeTab]
    if (el?.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [activeTab])

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div
        ref={scrollerRef}
        role="tablist"
        aria-label="Assignment views"
        className="scroll-x flex flex-nowrap gap-1 p-1.5"
      >
        {TABS.map(({ id, label, shortLabel, icon: Icon }) => {
          const isActive = activeTab === id
          const count = counts[id] ?? 0
          return (
            <button
              key={id}
              ref={(node) => {
                tabRefs.current[id] = node
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(id)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-all ${
                isActive
                  ? id === 'history'
                    ? 'bg-slate-700 dark:bg-slate-600 text-white shadow-md'
                    : 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span className="sm:hidden">{shortLabel}</span>
              <span className="hidden sm:inline">{label}</span>
              <span
                className={`ml-0.5 min-w-[1.25rem] px-1.5 py-0.5 rounded-full text-xs font-bold tabular-nums ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { TABS }
