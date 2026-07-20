import { CalendarRange, Layers } from 'lucide-react'
import { formatCurrency, formatSeasonClosedDate } from '../utils/helpers.js'

export default function SeasonPicker({ seasons, selectedSeasonId, onSelect }) {
  if (!seasons.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-8 text-center">
        <Layers size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No closed seasons yet</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Use “Close Season / Reset” to archive a season into History
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Select a season
        </p>
        <button
          type="button"
          onClick={() => onSelect('all')}
          className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
            selectedSeasonId === 'all'
              ? 'bg-slate-800 dark:bg-slate-600 text-white'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          All seasons
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {seasons.map((season) => {
          const isSelected = selectedSeasonId === season.seasonId
          return (
            <button
              key={season.seasonId}
              type="button"
              onClick={() => onSelect(season.seasonId)}
              className={`text-left rounded-2xl border p-4 transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400 shadow-sm ring-1 ring-indigo-500/30'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className={`text-sm font-bold ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-100'}`}>
                    {season.label}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                    <CalendarRange size={11} />
                    Closed {formatSeasonClosedDate(season.archivedAt)}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                  }`}
                >
                  {season.count}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Profit</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(season.summary.totalRealizedProfit)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Expected</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {formatCurrency(season.summary.totalExpectedProfit)}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
