import { randomUUID } from 'crypto'
import { getAssignmentsCollection, sanitizeAssignment } from './lib/mongodb.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body

    if (!body?.clientName?.trim()) {
      return res.status(400).json({ error: 'Client name is required' })
    }
    if (!body?.moduleCode?.trim()) {
      return res.status(400).json({ error: 'Module code is required' })
    }
    if (!body?.dueDate) {
      return res.status(400).json({ error: 'Due date is required' })
    }

    const now = new Date().toISOString()
    const record = {
      id: body.id || randomUUID(),
      dateReceived: body.dateReceived || '',
      clientName: body.clientName.trim(),
      moduleCode: body.moduleCode.trim(),
      dueDate: body.dueDate,
      clientPrice: parseFloat(body.clientPrice) || 0,
      clientPaidStatus: Boolean(body.clientPaidStatus),
      subcontractorName: body.subcontractorName || '',
      subcontractorPrice: parseFloat(body.subcontractorPrice) || 0,
      subcontractorPaidStatus: Boolean(body.subcontractorPaidStatus),
      assignmentStatus: body.assignmentStatus || 'Pending',
      notes: body.notes || '',
      createdAt: body.createdAt || now,
      updatedAt: now,
    }

    const collection = await getAssignmentsCollection()
    await collection.insertOne(record)

    return res.status(201).json(sanitizeAssignment(record))
  } catch (error) {
    console.error('createAssignment error:', error)
    return res.status(500).json({ error: 'Failed to create assignment' })
  }
}
