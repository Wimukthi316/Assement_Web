import { randomUUID } from 'crypto'
import { withAuth } from './_lib/authMiddleware.js'
import { getSubcontractorsCollection } from './_lib/mongodb.js'

function sanitize(doc) {
  if (!doc) return null
  const { _id, ...rest } = doc
  return rest
}

/**
 * One serverless function handling the whole subcontractor "address book" so we
 * stay under the Vercel Hobby 12-function limit:
 *   GET    -> list the signed-in user's saved subcontractors (A→Z)
 *   POST   -> add a subcontractor { name } (case-insensitive de-dupe per user)
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
    const name = (req.body?.name || '').trim()
    if (!name) {
      return res.status(400).json({ error: 'Subcontractor name is required' })
    }
    if (name.length > 80) {
      return res.status(400).json({ error: 'Name is too long (max 80 characters)' })
    }

    // Case-insensitive duplicate guard, scoped to this user.
    const existing = await collection.findOne({
      userId: req.user.uid,
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
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
    }
    await collection.insertOne(record)
    return res.status(201).json(sanitize(record))
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
