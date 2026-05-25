import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { calcSummary, applyFilters, getTabCounts } from './utils/helpers.js'
import {
  fetchAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  importAssignments,
} from './services/api.js'
import Header from './components/Header.jsx'
import SummaryCards from './components/SummaryCards.jsx'
import TabNavigation from './components/TabNavigation.jsx'
import FilterBar from './components/FilterBar.jsx'
import AssignmentTable from './components/AssignmentTable.jsx'
import AssignmentForm from './components/AssignmentForm.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'
import { LoadingState, ErrorBanner } from './components/StatusMessages.jsx'

const DEFAULT_FILTERS = {
  status: 'all',
  payment: 'all',
  assignment: 'all',
  date: 'all',
  search: '',
}
const DEFAULT_SORT = { key: 'dueDate', dir: 'asc' }

export default function App() {
  const [assignments, setAssignments] = useState([])
  const [darkMode, setDarkMode] = useLocalStorage('assigntrack-dark', false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [activeTab, setActiveTab] = useState('active')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [sortConfig, setSortConfig] = useState(DEFAULT_SORT)
  const [showForm, setShowForm] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const loadAssignments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAssignments()
      setAssignments(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAssignments()
  }, [loadAssignments])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const summary = useMemo(() => calcSummary(assignments), [assignments])
  const tabCounts = useMemo(() => getTabCounts(assignments), [assignments])

  const filteredAssignments = useMemo(
    () => applyFilters(assignments, filters, sortConfig, activeTab),
    [assignments, filters, sortConfig, activeTab]
  )

  async function handleSave(record) {
    setSaving(true)
    setError(null)
    try {
      const exists = assignments.some((a) => a.id === record.id)
      const saved = exists
        ? await updateAssignment(record)
        : await createAssignment(record)

      setAssignments((prev) => {
        if (exists) {
          return prev.map((a) => (a.id === saved.id ? saved : a))
        }
        return [saved, ...prev]
      })
      setShowForm(false)
      setEditingAssignment(null)
    } catch (err) {
      setError(err.message || 'Failed to save assignment')
      throw err
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(assignment) {
    setEditingAssignment(assignment)
    setShowForm(true)
  }

  function handleDeleteRequest(id) {
    setDeleteId(id)
  }

  async function handleDeleteConfirm() {
    setSaving(true)
    setError(null)
    try {
      await deleteAssignment(deleteId)
      setAssignments((prev) => prev.filter((a) => a.id !== deleteId))
      setDeleteId(null)
    } catch (err) {
      setError(err.message || 'Failed to delete assignment')
    } finally {
      setSaving(false)
    }
  }

  async function handleImport(data) {
    if (!window.confirm(`Import ${data.length} records? This will REPLACE all current data.`)) {
      return
    }

    setSaving(true)
    setError(null)
    try {
      const imported = await importAssignments(data)
      setAssignments(imported)
    } catch (err) {
      setError(err.message || 'Failed to import assignments')
    } finally {
      setSaving(false)
    }
  }

  function openAddForm() {
    setEditingAssignment(null)
    setShowForm(true)
  }

  function closeForm() {
    if (saving) return
    setShowForm(false)
    setEditingAssignment(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Header
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode((v) => !v)}
        assignments={assignments}
        onImport={handleImport}
        disabled={loading || saving}
      />

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {error && (
          <ErrorBanner
            message={error}
            onRetry={loadAssignments}
            onDismiss={() => setError(null)}
          />
        )}

        {loading ? (
          <LoadingState />
        ) : (
          <>
            <SummaryCards summary={summary} totalAssignments={assignments.length} />

            <TabNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              counts={tabCounts}
            />

            <FilterBar
              filters={filters}
              setFilters={setFilters}
              sortConfig={sortConfig}
              setSortConfig={setSortConfig}
              resultCount={filteredAssignments.length}
            />

            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Assignments</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Manage all your client & subcontractor records
                </p>
              </div>
              <button
                onClick={openAddForm}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors shadow-lg shadow-indigo-500/25"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Add Assignment</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>

            <AssignmentTable
              assignments={filteredAssignments}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
            />

            <p className="text-center text-xs text-slate-400 dark:text-slate-600 pb-4">
              Data is stored in MongoDB Atlas · Use Export/Import to back up your records
            </p>
          </>
        )}
      </main>

      {showForm && (
        <AssignmentForm
          assignment={editingAssignment}
          onSave={handleSave}
          onClose={closeForm}
          saving={saving}
        />
      )}

      {deleteId && (
        <ConfirmDialog
          message="Are you sure you want to delete this assignment? This action cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={() => !saving && setDeleteId(null)}
          loading={saving}
        />
      )}
    </div>
  )
}
