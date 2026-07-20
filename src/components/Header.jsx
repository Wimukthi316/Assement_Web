import { Download, Upload, FileJson, FileText, BookOpen, LogOut, User } from 'lucide-react'
import { exportJSON, exportCSV } from '../utils/helpers.js'
import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import ThemeToggle from './ThemeToggle.jsx'

export default function Header({ assignments, onImport, disabled = false }) {
  const { user, logout } = useAuth()
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
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

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2 sm:py-0 sm:h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 shrink-0">
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

        <div className="scroll-x flex items-center gap-2 min-w-0 pb-0.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            title="Import JSON"
          >
            <Upload size={15} />
            <span className="hidden sm:inline">Import</span>
          </button>

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

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-w-[200px]">
            <User size={14} className="text-slate-400 shrink-0" />
            <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
              {user?.displayName || user?.email || 'Signed in'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-rose-200 dark:border-rose-800 disabled:opacity-60 transition-colors"
            title="Sign out"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">{loggingOut ? 'Signing out...' : 'Logout'}</span>
          </button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
