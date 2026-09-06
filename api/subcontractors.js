import { randomUUID } from 'crypto'
import { withAuth } from './_lib/authMiddleware.js'
import {
  getSubcontractorsCollection,
  getAssignmentsCollection,
} from './_lib/mongodb.js'

function sanitize(doc) {
  if (!doc) return null
  const { _id, ...rest } = doc
  return rest
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function validateName(name) {
  const trimmed = (name || '').trim()
  if (!trimmed) return { error: 'Subcontractor name is required' }
  if (trimmed.length > 80) return { error: 'Name is too long (max 80 characters)' }
  return { name: trimmed }
}

/**
 * One serverless function handling the whole subcontractor "address book" so we
 * stay under the Vercel Hobby 12-function limit:
 *   GET    -> list the signed-in user's saved subcontractors (A→Z)
 *   POST   -> add a subcontractor { name } (case-insensitive de-dupe per user)
 *   PUT    -> rename { id, name } and sync matching assignment names
 *   DELETE -> remove one by ?id=
 */
async function handler(req, res) {
  const collection = await getSubcontractorsCollection()

  if (req.method === 'GET') {
    const list = await collection
      .find({ userId: req.user.uid })
      .sort({ name: 1 })
      .toArray()
    return res.status(200).json(list.map(sanitize))
  }

  if (req.method === 'POST') {
    const { name, error } = validateName(req.body?.name)
    if (error) return res.status(400).json({ error })

    // Case-insensitive duplicate guard, scoped to this user.
    const existing = await collection.findOne({
      userId: req.user.uid,
      name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' },
    })
    if (existing) {
      return res.status(200).json(sanitize(existing))
    }

    const now = new Date().toISOString()
    const record = {
      id: randomUUID(),
      userId: req.user.uid,
      name,
      createdAt: now,
      updatedAt: now,
    }
    await collection.insertOne(record)
    return res.status(201).json(sanitize(record))
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const id = req.body?.id || req.query?.id
    if (!id) {
      return res.status(400).json({ error: 'Subcontractor ID is required' })
    }

    const { name, error } = validateName(req.body?.name)
    if (error) return res.status(400).json({ error })

    const current = await collection.findOne({ id, userId: req.user.uid })
    if (!current) {
      return res.status(404).json({ error: 'Subcontractor not found' })
    }

    const oldName = current.name
    const sameName = oldName.trim().toLowerCase() === name.toLowerCase()

    if (!sameName) {
      const duplicate = await collection.findOne({
        userId: req.user.uid,
        id: { $ne: id },
        name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' },
      })
      if (duplicate) {
        return res.status(409).json({
          error: `"${duplicate.name}" is already in your list`,
        })
      }
    }

    const now = new Date().toISOString()
    const result = await collection.findOneAndUpdate(
      { id, userId: req.user.uid },
      { $set: { name, updatedAt: now } },
      { returnDocument: 'after' }
    )

    // Keep existing assignments in sync when the saved name changes.
    let assignmentsUpdated = 0
    if (!sameName) {
      const assignments = await getAssignmentsCollection()
      const updateResult = await assignments.updateMany(
        {
          userId: req.user.uid,
          subcontractorIsSelf: { $ne: true },
          subcontractorName: {
            $regex: `^${escapeRegex(oldName)}$`,
            $options: 'i',
          },
        },
        {
          $set: {
            subcontractorName: name,
            updatedAt: now,
          },
        }
      )
      assignmentsUpdated = updateResult.modifiedCount || 0
    }

    return res.status(200).json({
      ...sanitize(result),
      assignmentsUpdated,
    })
  }

  if (req.method === 'DELETE') {
    const id = req.query?.id || req.body?.id
    if (!id) {
      return res.status(400).json({ error: 'Subcontractor ID is required' })
    }
    const result = await collection.deleteOne({ id, userId: req.user.uid })
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Subcontractor not found' })
    }
    return res.status(200).json({ success: true, id })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withAuth(handler)
