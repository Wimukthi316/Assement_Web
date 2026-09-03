/**
 * Settlement rules — shared by the API (api/archiveSettled.js) and the
 * dashboard UI (src/utils/helpers.js re-exports these).
 *
 * An assignment is "settled" when the job is done AND every rupee that was
 * ever going to move has moved. Only settled assignments may be archived by
 * the "Archive Settled" action.
 */

/**
 * Where the subcontractor side of an assignment stands.
 *   'self'    - no name and no price: the owner did the job themselves,
 *               so there is nothing to pay out.
 *   'noPrice' - a subcontractor is named but their price has not been set yet.
 *   'paid'    - subcontractor has been paid.
 *   'unpaid'  - money is owed to a subcontractor.
 */
export function getSubcontractorSettlement(a) {
  const price = parseFloat(a?.subcontractorPrice) || 0
  const hasName = Boolean((a?.subcontractorName || '').trim())

  if (!hasName && price <= 0) return 'self'
  if (hasName && price <= 0) return 'noPrice'
  return a?.subcontractorPaidStatus === true ? 'paid' : 'unpaid'
}

/** Human-readable reasons, keyed by blocker id. */
export const BLOCKER_LABELS = {
  notCompleted: 'not completed yet',
  clientUnpaid: 'client has not paid',
  noClientPrice: 'client price not set',
  subUnpaid: 'subcontractor not paid',
  noSubPrice: 'subcontractor price not set',
}

/**
 * Every reason this assignment cannot be archived as settled.
 * An empty array means it is settled.
 */
export function getSettlementBlockers(a) {
  const blockers = []

  if (a?.assignmentStatus !== 'Completed') blockers.push('notCompleted')
  if (!a?.clientPaidStatus) blockers.push('clientUnpaid')
  if ((parseFloat(a?.clientPrice) || 0) <= 0) blockers.push('noClientPrice')

  const sub = getSubcontractorSettlement(a)
  if (sub === 'unpaid') blockers.push('subUnpaid')
  if (sub === 'noPrice') blockers.push('noSubPrice')

  return blockers
}

export function isSettledAssignment(a) {
  return getSettlementBlockers(a).length === 0
}

/**
 * Split a list of current assignments into settled / blocked, with a tally of
 * why the blocked ones are held back (one assignment can appear under several
 * reasons).
 */
export function getSettlementStats(assignments = []) {
  const settled = []
  const blocked = []
  const blockerCounts = {}

  for (const a of assignments) {
    const blockers = getSettlementBlockers(a)
    if (blockers.length === 0) {
      settled.push(a)
      continue
    }
    blocked.push(a)
    for (const b of blockers) {
      blockerCounts[b] = (blockerCounts[b] || 0) + 1
    }
  }

  return { settled, blocked, blockerCounts }
}
