import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { calcSummary, applyFilters } from './utils/helpers.js'
import Header from './components/Header.jsx'
import SummaryCards from './components/SummaryCards.jsx'
import FilterBar from './components/FilterBar.jsx'
import AssignmentTable from './components/AssignmentTable.jsx'
import AssignmentForm from './components/AssignmentForm.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'

const DEFAULT_FILTERS = { status: 'all', payment: 'all', date: 'all', search: '' }
const DEFAULT_SORT = { key: 'dueDate', dir: 'asc' }

export default function App() {
  const [assignments, setAssignments] = useLocalStorage('assigntrack-data', [])
  const [darkMode, setDarkMode] = useLocalStorage('assigntrack-dark', false)

  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [sortConfig, setSortConfig] = useState(DEFAULT_SORT)
  const [showForm, setShowForm] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  // Apply dark mode class to <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const summary = useMemo(() => calcSummary(assignments), [assignments])

  const filteredAssignments = useMemo(
    () => applyFilters(assignments, filters, sortConfig),
    [assignments, filters, sortConfig]
  )

  // --- CRUD ---
  function handleSave(record) {
    setAssignments((prev) => {
      const exists = prev.find((a) => a.id === record.id)
      if (exists) {
        return prev.map((a) => (a.id === record.id ? record : a))
      }
      return [record, ...prev]
    })
    setShowForm(false)
    setEditingAssignment(null)
  }

  function handleEdit(assignment) {
    setEditingAssignment(assignment)
    setShowForm(true)
  }

  function handleDeleteRequest(id) {
    setDeleteId(id)
  }

  function handleDeleteConfirm() {
    setAssignments((prev) => prev.filter((a) => a.id !== deleteId))
    setDeleteId(null)
  }

  function handleImport(data) {
    if (window.confirm(`Import ${data.length} records? This will REPLACE all current data.`)) {
      setAssignments(data)
    }
  }

  function openAddForm() {
    setEditingAssignment(null)
    setShowForm(true)
  }

  function closeForm() {
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
      />

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Summary Cards */}
        <SummaryCards summary={summary} totalAssignments={assignments.length} />

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
          resultCount={filteredAssignments.length}
        />

        {/* Table heading row */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Assignments</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage all your client & subcontractor records
            </p>
          </div>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-lg shadow-indigo-500/25"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Assignment</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Table */}
        <AssignmentTable
          assignments={filteredAssignments}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
        />

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-600 pb-4">
          All data is stored locally in your browser · Use Export/Import to back up your data
        </p>
      </main>

      {/* Form Modal */}
      {showForm && (
        <AssignmentForm
          assignment={editingAssignment}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <ConfirmDialog
          message="Are you sure you want to delete this assignment? This action cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
