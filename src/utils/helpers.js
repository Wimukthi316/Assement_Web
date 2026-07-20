// --- ID Generation ---
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// --- Date Helpers ---
export function isOverdue(dueDate, status) {
  if (!dueDate || status === 'Completed') return false
  return new Date(dueDate) < new Date(new Date().toDateString())
}

export function isDueToday(dueDate) {
  if (!dueDate) return false
  const today = new Date().toDateString()
  return new Date(dueDate).toDateString() === today
}

export function daysUntilDue(dueDate) {
  if (!dueDate) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.round((due - now) / (1000 * 60 * 60 * 24))
}

export function isDueWithinDays(dueDate, maxDays, status) {
  if (!dueDate || status === 'Completed') return false
  const days = daysUntilDue(dueDate)
  return days !== null && days <= maxDays
}

export function isUrgentWarning(dueDate, status) {
  return isDueWithinDays(dueDate, 2, status)
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// --- Currency Helpers ---
export function formatCurrency(value, { optional = false } = {}) {
  const num = parseFloat(value)
  if (optional && (value === '' || value === null || value === undefined || isNaN(num) || num === 0)) {
    return '—'
  }
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
  }).format(num || 0)
}

// --- Calculation Helpers ---
export function calcProfit(clientPrice, subcontractorPrice) {
  return (parseFloat(clientPrice) || 0) - (parseFloat(subcontractorPrice) || 0)
}

export function calcClientOwes(clientPrice, clientAdvance, clientPaidStatus) {
  if (clientPaidStatus) return 0
  const price = parseFloat(clientPrice) || 0
  const advance = parseFloat(clientAdvance) || 0
  return Math.max(0, price - advance)
}

export function calcSummary(assignments) {
  return assignments.reduce(
    (acc, a) => {
      const profit = calcProfit(a.clientPrice, a.subcontractorPrice)
      acc.totalExpectedProfit += profit
      if (a.clientPaidStatus) acc.totalRealizedProfit += profit
      if (!a.clientPaidStatus) {
        acc.pendingClientPayments += calcClientOwes(a.clientPrice, a.clientAdvance, a.clientPaidStatus)
      }
      if (!a.subcontractorPaidStatus) {
        acc.pendingSubPayments += parseFloat(a.subcontractorPrice) || 0
      }
      return acc
    },
    {
      totalExpectedProfit: 0,
      totalRealizedProfit: 0,
      pendingClientPayments: 0,
      pendingSubPayments: 0,
    }
  )
}

export function isArchivedAssignment(a) {
  return a?.isArchived === true
}

export function getCurrentAssignments(assignments) {
  return assignments.filter((a) => !isArchivedAssignment(a))
}

export function getHistoryAssignments(assignments) {
  return assignments.filter((a) => isArchivedAssignment(a))
}

/**
 * Group archived assignments into closed seasons.
 * Season 1 = earliest closed, Season 2 = next, etc.
 * Returns newest-first for the UI picker.
 */
export function getSeasonGroups(historyAssignments) {
  const map = new Map()

  for (const a of historyAssignments) {
    const id = a.seasonId || 'legacy'
    if (!map.has(id)) {
      map.set(id, {
        seasonId: id,
        archivedAt: a.archivedAt || a.updatedAt || null,
        assignments: [],
      })
    }
    const group = map.get(id)
    group.assignments.push(a)
    const stamp = a.archivedAt || a.updatedAt
    if (stamp && (!group.archivedAt || stamp > group.archivedAt)) {
      group.archivedAt = stamp
    }
  }

  const chronological = [...map.values()].sort(
    (a, b) => new Date(a.archivedAt || 0) - new Date(b.archivedAt || 0)
  )

  chronological.forEach((group, index) => {
    group.seasonNumber = index + 1
    group.label =
      group.seasonId === 'legacy' ? 'Legacy / Unlabeled' : `Season ${index + 1}`
    group.count = group.assignments.length
    group.summary = calcSummary(group.assignments)
  })

  // Newest closed seasons first in the picker
  return chronological.slice().reverse()
}

export function formatSeasonClosedDate(archivedAt) {
  if (!archivedAt) return 'Unknown date'
  return new Date(archivedAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// --- Tab Counts ---
export function getTabCounts(assignments) {
  const current = getCurrentAssignments(assignments)
  const history = getHistoryAssignments(assignments)

  return {
    active: current.filter(
      (a) => a.assignmentStatus === 'Pending' || a.assignmentStatus === 'In Progress'
    ).length,
    urgent: current.filter(
      (a) => a.assignmentStatus !== 'Completed' && isDueWithinDays(a.dueDate, 3, a.assignmentStatus)
    ).length,
    completed: current.filter((a) => a.assignmentStatus === 'Completed').length,
    history: history.length,
  }
}

// --- Export Helpers ---
export function exportJSON(assignments) {
  const json = JSON.stringify(assignments, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `assignments-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportCSV(assignments) {
  const headers = [
    'ID', 'Date Received', 'Client Name', 'Module Code', 'Due Date',
    'Client Price', 'Client Advance', 'Client Paid', 'Subcontractor Name', 'Sub Price',
    'Sub Paid', 'Status', 'Profit', 'Notes',
  ]
  const rows = assignments.map((a) => [
    a.id,
    a.dateReceived,
    `"${(a.clientName || '').replace(/"/g, '""')}"`,
    a.moduleCode,
    a.dueDate,
    a.clientPrice ?? 0,
    a.clientAdvance ?? 0,
    a.clientPaidStatus ? 'Yes' : 'No',
    `"${(a.subcontractorName || '').replace(/"/g, '""')}"`,
    a.subcontractorPrice ?? 0,
    a.subcontractorPaidStatus ? 'Yes' : 'No',
    a.assignmentStatus,
    calcProfit(a.clientPrice, a.subcontractorPrice).toFixed(2),
    `"${(a.notes || '').replace(/"/g, '""')}"`,
  ])
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `assignments-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// --- Filter & Sort ---
export function applyFilters(assignments, filters, sortConfig, activeTab = 'active', selectedSeasonId = null) {
  let result = [...assignments]

  if (activeTab === 'history') {
    result = result.filter((a) => isArchivedAssignment(a))
    if (selectedSeasonId && selectedSeasonId !== 'all') {
      if (selectedSeasonId === 'legacy') {
        result = result.filter((a) => !a.seasonId)
      } else {
        result = result.filter((a) => a.seasonId === selectedSeasonId)
      }
    }
  } else {
    result = result.filter((a) => !isArchivedAssignment(a))

    if (activeTab === 'active') {
      result = result.filter(
        (a) => a.assignmentStatus === 'Pending' || a.assignmentStatus === 'In Progress'
      )
    } else if (activeTab === 'urgent') {
      result = result.filter(
        (a) =>
          a.assignmentStatus !== 'Completed' &&
          isDueWithinDays(a.dueDate, 3, a.assignmentStatus)
      )
    } else if (activeTab === 'completed') {
      result = result.filter((a) => a.assignmentStatus === 'Completed')
    }
  }

  if (filters.status !== 'all') {
    result = result.filter((a) => a.assignmentStatus === filters.status)
  }

  if (filters.payment === 'clientUnpaid') {
    result = result.filter((a) => !a.clientPaidStatus)
  } else if (filters.payment === 'subUnpaid') {
    result = result.filter((a) => !a.subcontractorPaidStatus)
  } else if (filters.payment === 'anyUnpaid') {
    result = result.filter((a) => !a.clientPaidStatus || !a.subcontractorPaidStatus)
  }

  if (filters.assignment === 'unassigned') {
    result = result.filter((a) => !a.subcontractorName?.trim())
  }

  if (filters.date === 'overdue') {
    result = result.filter((a) => isOverdue(a.dueDate, a.assignmentStatus))
  } else if (filters.date === 'upcoming') {
    result = result.filter(
      (a) => !isOverdue(a.dueDate, a.assignmentStatus) && a.assignmentStatus !== 'Completed'
    )
  }

  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      (a) =>
        (a.clientName || '').toLowerCase().includes(q) ||
        (a.moduleCode || '').toLowerCase().includes(q) ||
        (a.subcontractorName || '').toLowerCase().includes(q) ||
        (a.notes || '').toLowerCase().includes(q)
    )
  }

  result.sort((a, b) => {
    let aVal, bVal
    switch (sortConfig.key) {
      case 'dueDate':
        aVal = new Date(a.dueDate || 0)
        bVal = new Date(b.dueDate || 0)
        break
      case 'dateReceived':
        aVal = new Date(a.dateReceived || 0)
        bVal = new Date(b.dateReceived || 0)
        break
      case 'profit':
        aVal = calcProfit(a.clientPrice, a.subcontractorPrice)
        bVal = calcProfit(b.clientPrice, b.subcontractorPrice)
        break
      case 'clientPrice':
        aVal = parseFloat(a.clientPrice) || 0
        bVal = parseFloat(b.clientPrice) || 0
        break
      case 'archivedAt':
        aVal = new Date(a.archivedAt || 0)
        bVal = new Date(b.archivedAt || 0)
        break
      default:
        aVal = new Date(a.dateReceived || 0)
        bVal = new Date(b.dateReceived || 0)
    }
    if (aVal < bVal) return sortConfig.dir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortConfig.dir === 'asc' ? 1 : -1
    return 0
  })

  return result
}
