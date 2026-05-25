import { Sun, Moon, Download, Upload, FileJson, FileText, BookOpen } from 'lucide-react'
import { exportJSON, exportCSV } from '../utils/helpers.js'
import { useState, useRef } from 'react'

export default function Header({ darkMode, toggleDarkMode, assignments, onImport }) {
  const [showExportMenu, setShowExportMenu] = useState(false)
  const fileInputRef = useRef(null)

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (Array.isArray(data)) {
          onImport(data)
        } else {
          alert('Invalid file format. Expected a JSON array.')
        }
      } catch {
        alert('Failed to parse JSON file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
            <BookOpen size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-none truncate">
              AssignTrack
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-none mt-0.5">
              {assignments.length} record{assignments.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Import JSON"
          >
            <Upload size={15} />
            <span className="hidden sm:inline">Import</span>
          </button>

          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Export</span>
            </button>
            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 z-20 w-44 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                  <button
                    onClick={() => { exportJSON(assignments); setShowExportMenu(false) }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <FileJson size={15} className="text-indigo-500" />
                    Export as JSON
                  </button>
                  <button
                    onClick={() => { exportCSV(assignments); setShowExportMenu(false) }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <FileText size={15} className="text-emerald-500" />
                    Export as CSV
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>
    </header>
  )
}
