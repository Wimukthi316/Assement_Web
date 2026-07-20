import { ListTodo, Flame, CheckCircle2, History } from 'lucide-react'

const TABS = [
  { id: 'active', label: 'Active Tasks', icon: ListTodo },
  { id: 'urgent', label: 'Urgent (Due in 3 Days)', icon: Flame },
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
  { id: 'history', label: 'History', icon: History },
]

export default function TabNavigation({ activeTab, onTabChange, counts }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 shadow-sm">
      <div className="flex flex-wrap gap-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id
          const count = counts[id] ?? 0
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? id === 'history'
                    ? 'bg-slate-700 dark:bg-slate-600 text-white shadow-md'
                    : 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{label}</span>
              <span
                className={`ml-0.5 min-w-[1.25rem] px-1.5 py-0.5 rounded-full text-xs font-bold ${
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
