import { withAuth } from './lib/authMiddleware.js'
import { getAssignmentsCollection, sanitizeAssignment } from './lib/mongodb.js'
import { autoMigrateLegacyIfConfigured } from './lib/migrateLegacy.js'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await autoMigrateLegacyIfConfigured(req.user.uid)

    const collection = await getAssignmentsCollection()
    const assignments = await collection
      .find({ userId: req.user.uid })
      .sort({ createdAt: -1 })
      .toArray()

    return res.status(200).json(assignments.map(sanitizeAssignment))
  } catch (error) {
    console.error('getAssignments error:', error)
    return res.status(500).json({ error: 'Failed to fetch assignments' })
  }
}

export default withAuth(handler)
