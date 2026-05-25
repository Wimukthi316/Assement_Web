import { getAssignmentsCollection, sanitizeAssignment } from './lib/mongodb.js'

export default async function handler(req, res) {
  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body

    if (!body?.id) {
      return res.status(400).json({ error: 'Assignment ID is required' })
    }

    const { id, _id, ...updates } = body
    updates.updatedAt = new Date().toISOString()

    if (updates.clientPrice !== undefined) {
      updates.clientPrice = parseFloat(updates.clientPrice) || 0
    }
    if (updates.clientAdvance !== undefined) {
      updates.clientAdvance = parseFloat(updates.clientAdvance) || 0
    }
    if (updates.subcontractorPrice !== undefined) {
      updates.subcontractorPrice = parseFloat(updates.subcontractorPrice) || 0
    }
    if (updates.clientPaidStatus !== undefined) {
      updates.clientPaidStatus = Boolean(updates.clientPaidStatus)
    }
    if (updates.subcontractorPaidStatus !== undefined) {
      updates.subcontractorPaidStatus = Boolean(updates.subcontractorPaidStatus)
    }

    const collection = await getAssignmentsCollection()
    const result = await collection.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after' }
    )

    if (!result) {
      return res.status(404).json({ error: 'Assignment not found' })
    }

    return res.status(200).json(sanitizeAssignment(result))
  } catch (error) {
    console.error('updateAssignment error:', error)
    return res.status(500).json({ error: 'Failed to update assignment' })
  }
}
