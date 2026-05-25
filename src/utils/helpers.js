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

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function daysUntilDue(dueDate) {
  if (!dueDate) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.round((due - now) / (1000 * 60 * 60 * 24))
}

// --- Currency Helpers ---
export function formatCurrency(value) {
  const num = parseFloat(value) || 0
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num)
}

// --- Calculation Helpers ---
export function calcProfit(clientPrice, subcontractorPrice) {
  return (parseFloat(clientPrice) || 0) - (parseFloat(subcontractorPrice) || 0)
}

export function calcSummary(assignments) {
  return assignments.reduce(
    (acc, a) => {
      const profit = calcProfit(a.clientPrice, a.subcontractorPrice)
      acc.totalExpectedProfit += profit
      if (a.clientPaidStatus) acc.totalRealizedProfit += profit
      if (!a.clientPaidStatus) acc.pendingClientPayments += parseFloat(a.clientPrice) || 0
      if (!a.subcontractorPaidStatus)
        acc.pendingSubPayments += parseFloat(a.subcontractorPrice) || 0
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
    'Client Price', 'Client Paid', 'Subcontractor Name', 'Sub Price',
    'Sub Paid', 'Status', 'Profit', 'Notes',
  ]
  const rows = assignments.map((a) => [
    a.id,
    a.dateReceived,
    `"${(a.clientName || '').replace(/"/g, '""')}"`,
    a.moduleCode,
    a.dueDate,
    a.clientPrice,
    a.clientPaidStatus ? 'Yes' : 'No',
    `"${(a.subcontractorName || '').replace(/"/g, '""')}"`,
    a.subcontractorPrice,
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
export function applyFilters(assignments, filters, sortConfig) {
  let result = [...assignments]

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
