import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Plus, RotateCcw } from 'lucide-react'
import {
  calcSummary,
  applyFilters,
  getTabCounts,
  getCurrentAssignments,
  getHistoryAssignments,
  getSeasonGroups,
  formatCurrency,
} from '../utils/helpers.js'
import {
  fetchAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  importAssignments,
  migrateLegacyData,
  resetSeason,
  deleteSeason,
} from '../services/api.js'
import Header from '../components/Header.jsx'
import SummaryCards from '../components/SummaryCards.jsx'
import TabNavigation from '../components/TabNavigation.jsx'
import SeasonPicker from '../components/SeasonPicker.jsx'
import FilterBar from '../components/FilterBar.jsx'
import AssignmentTable from '../components/AssignmentTable.jsx'
import AssignmentForm from '../components/AssignmentForm.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { LoadingState, ErrorBanner } from '../components/StatusMessages.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const DEFAULT_FILTERS = {
  status: 'all',
  payment: 'all',
  assignment: 'all',
  date: 'all',
  search: '',
}
const DEFAULT_SORT = { key: 'dueDate', dir: 'asc' }

export default function DashboardPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const [activeTab, setActiveTab] = useState('active')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [sortConfig, setSortConfig] = useState(DEFAULT_SORT)
  const [showForm, setShowForm] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [seasonToDelete, setSeasonToDelete] = useState(null)
  const [selectedSeasonId, setSelectedSeasonId] = useState(null)

  const migrationAttempted = useRef(false)
  const isHistoryTab = activeTab === 'history'

  const loadAssignments = useCallback(async () => {
    if (!user) return

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
  }, [user])

  useEffect(() => {
    if (!user) return
    loadAssignments()
  }, [user, loadAssignments])

  useEffect(() => {
    if (!user) return
    if (migrationAttempted.current) return
    migrationAttempted.current = true

    migrateLegacyData()
      .then((result) => {
        if (result?.migrated > 0) {
          loadAssignments()
        }
      })
      .catch(() => {
        // Migration is optional; ignore failures silently
      })
  }, [user, loadAssignments])

  const currentAssignments = useMemo(() => getCurrentAssignments(assignments), [assignments])
  const historyAssignments = useMemo(() => getHistoryAssignments(assignments), [assignments])
  const seasonGroups = useMemo(() => getSeasonGroups(historyAssignments), [historyAssignments])

  // When entering History, default to newest season (or keep selection if still valid)
  useEffect(() => {
    if (!isHistoryTab) return
    if (!seasonGroups.length) {
      setSelectedSeasonId(null)
      return
    }
    const stillValid =
      selectedSeasonId === 'all' ||
      seasonGroups.some((s) => s.seasonId === selectedSeasonId)
    if (!stillValid) {
      setSelectedSeasonId(seasonGroups[0].seasonId)
    }
  }, [isHistoryTab, seasonGroups, selectedSeasonId])

  const selectedSeason = useMemo(() => {
    if (!isHistoryTab || !selectedSeasonId || selectedSeasonId === 'all') return null
    return seasonGroups.find((s) => s.seasonId === selectedSeasonId) || null
  }, [isHistoryTab, selectedSeasonId, seasonGroups])

  const summaryScope = useMemo(() => {
    if (!isHistoryTab) return currentAssignments
    if (selectedSeasonId === 'all' || !selectedSeasonId) return historyAssignments
    if (selectedSeason) return selectedSeason.assignments
    return historyAssignments
  }, [
    isHistoryTab,
    currentAssignments,
    historyAssignments,
    selectedSeasonId,
    selectedSeason,
  ])

  const summary = useMemo(() => calcSummary(summaryScope), [summaryScope])
  const tabCounts = useMemo(() => getTabCounts(assignments), [assignments])

  const filteredAssignments = useMemo(
    () => applyFilters(assignments, filters, sortConfig, activeTab, selectedSeasonId),
    [assignments, filters, sortConfig, activeTab, selectedSeasonId]
  )

  async function handleSave(record) {
    setSaving(true)
    setError(null)
    try {
      const exists = assignments.some((a) => a.id === record.id)
      const payload = exists
        ? record
        : { ...record, isArchived: false, archivedAt: null, seasonId: null }
      const saved = exists
        ? await updateAssignment(payload)
        : await createAssignment(payload)

      setAssignments((prev) => {
        if (exists) {
          return prev.map((a) => (a.id === saved.id ? saved : a))
        }
        return [saved, ...prev]
      })
      setShowForm(false)
      setEditingAssignment(null)
      if (!exists && isHistoryTab) {
        setActiveTab('active')
      }
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

  async function handleDeleteSeasonConfirm() {
    if (!seasonToDelete) return
    setSaving(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const result = await deleteSeason(seasonToDelete.seasonId)
      setAssignments((prev) =>
        prev.filter((a) => {
          if (!a.isArchived) return true
          if (seasonToDelete.seasonId === 'legacy') {
            return Boolean(a.seasonId)
          }
          return a.seasonId !== seasonToDelete.seasonId
        })
      )
      if (selectedSeasonId === seasonToDelete.seasonId) {
        setSelectedSeasonId('all')
      }
      setSeasonToDelete(null)
      setSuccessMessage(
        result.message ||
          `Deleted ${result.deletedCount} assignment(s) from ${seasonToDelete.label}`
      )
    } catch (err) {
      setError(err.message || 'Failed to delete season')
    } finally {
      setSaving(false)
    }
  }

  async function handleResetSeason() {
    setSaving(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const result = await resetSeason()
      await loadAssignments()
      setShowResetConfirm(false)
      setActiveTab('history')
      if (result.seasonId) {
        setSelectedSeasonId(result.seasonId)
      }
      setSuccessMessage(
        result.message ||
          `Moved ${result.archivedCount} assignment(s) to History. Current totals are now zero.`
      )
    } catch (err) {
      setError(err.message || 'Failed to reset season')
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

  const currentProfitPreview = calcSummary(currentAssignments).totalExpectedProfit

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Header
        assignments={currentAssignments}
        onImport={handleImport}
        disabled={loading || saving}
      />

      <main className="max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5 overflow-x-hidden">
        {error && (
          <ErrorBanner
            message={error}
            onRetry={loadAssignments}
            onDismiss={() => setError(null)}
          />
        )}

        {successMessage && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 flex items-start justify-between gap-3">
            <p className="text-sm text-emerald-800 dark:text-emerald-200">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <LoadingState />
        ) : (
          <>
            <SummaryCards
              summary={summary}
              totalAssignments={summaryScope.length}
              scopeLabel={
                isHistoryTab
                  ? selectedSeason
                    ? `${selectedSeason.label} · closed ${selectedSeason.archivedAt ? new Date(selectedSeason.archivedAt).toLocaleDateString('en-GB') : ''}`
                    : selectedSeasonId === 'all'
                    ? `All history · ${historyAssignments.length} archived`
                    : `History · ${historyAssignments.length} archived`
                  : `Current season · ${currentAssignments.length} open`
              }
            />

            <TabNavigation
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab)
              }}
              counts={tabCounts}
            />

            {isHistoryTab && (
              <SeasonPicker
                seasons={seasonGroups}
                selectedSeasonId={selectedSeasonId || 'all'}
                onSelect={setSelectedSeasonId}
                onDeleteSeason={setSeasonToDelete}
                deleting={saving}
              />
            )}

            <FilterBar
              filters={filters}
              setFilters={setFilters}
              sortConfig={sortConfig}
              setSortConfig={setSortConfig}
              resultCount={filteredAssignments.length}
            />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {isHistoryTab
                    ? selectedSeason
                      ? selectedSeason.label
                      : 'All Season History'
                    : 'Assignments'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isHistoryTab
                    ? selectedSeason
                      ? `Viewing one closed season · delete a single row with the trash icon, or delete the whole season from the card above`
                      : 'Select a season card above · trash icon on a card deletes that whole season'
                    : 'Manage your current season · Close season to zero totals and archive'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!isHistoryTab && (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    disabled={saving || currentAssignments.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Archive current season and reset dashboard totals to zero"
                  >
                    <RotateCcw size={16} />
                    <span className="hidden sm:inline">Close Season / Reset</span>
                    <span className="sm:hidden">Reset</span>
                  </button>
                )}
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
            </div>

            <AssignmentTable
              assignments={filteredAssignments}
              activeTab={activeTab}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
            />

            <p className="text-center text-xs text-slate-400 dark:text-slate-600 pb-4">
              Current season expected profit: {formatCurrency(currentProfitPreview)}
              {historyAssignments.length > 0 &&
                ` · ${historyAssignments.length} in History`}
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
          title="Delete Assignment"
          message="Are you sure you want to permanently delete this one assignment? This cannot be undone."
          confirmLabel="Delete Record"
          confirmVariant="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => !saving && setDeleteId(null)}
          loading={saving}
        />
      )}

      {seasonToDelete && (
        <ConfirmDialog
          title={`Delete ${seasonToDelete.label}?`}
          message={`This will permanently delete all ${seasonToDelete.count} assignment(s) in ${seasonToDelete.label}. This cannot be undone.`}
          confirmLabel="Delete Season"
          confirmVariant="danger"
          onConfirm={handleDeleteSeasonConfirm}
          onCancel={() => !saving && setSeasonToDelete(null)}
          loading={saving}
        />
      )}

      {showResetConfirm && (
        <ConfirmDialog
          title="Close Season & Reset Totals"
          message={`This will move all ${currentAssignments.length} current assignment(s) into History and reset profit / pending totals to zero for a new season. History stays available in the History tab. Continue?`}
          confirmLabel="Close Season"
          confirmVariant="primary"
          onConfirm={handleResetSeason}
          onCancel={() => !saving && setShowResetConfirm(false)}
          loading={saving}
        />
      )}
    </div>
  )
}
