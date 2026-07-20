import { randomUUID } from 'crypto'
import { withAuth } from './lib/authMiddleware.js'
import { getAssignmentsCollection, sanitizeAssignment } from './lib/mongodb.js'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { assignments } = req.body

    if (!Array.isArray(assignments)) {
      return res.status(400).json({ error: 'Expected an array of assignments' })
    }

    const now = new Date().toISOString()
    const records = assignments.map((item) => ({
      id: item.id || randomUUID(),
      userId: req.user.uid,
      dateReceived: item.dateReceived || '',
      clientName: item.clientName || '',
      moduleCode: item.moduleCode || '',
      dueDate: item.dueDate || '',
      clientPrice: parseFloat(item.clientPrice) || 0,
      clientAdvance: parseFloat(item.clientAdvance) || 0,
      clientPaidStatus: Boolean(item.clientPaidStatus),
      subcontractorName: item.subcontractorName || '',
      subcontractorPrice: parseFloat(item.subcontractorPrice) || 0,
      subcontractorPaidStatus: Boolean(item.subcontractorPaidStatus),
      assignmentStatus: item.assignmentStatus || 'Pending',
      notes: item.notes || '',
      isArchived: Boolean(item.isArchived),
      archivedAt: item.archivedAt || null,
      seasonId: item.seasonId || null,
      createdAt: item.createdAt || now,
      updatedAt: now,
    }))

    const collection = await getAssignmentsCollection()
    await collection.deleteMany({ userId: req.user.uid })
    if (records.length > 0) {
      await collection.insertMany(records)
    }

    return res.status(200).json(records.map(sanitizeAssignment))
  } catch (error) {
    console.error('importAssignments error:', error)
    return res.status(500).json({ error: 'Failed to import assignments' })
  }
}

export default withAuth(handler)
