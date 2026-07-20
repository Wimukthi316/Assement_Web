import { randomUUID } from 'crypto'
import { withAuth } from './lib/authMiddleware.js'
import { getAssignmentsCollection } from './lib/mongodb.js'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const now = new Date().toISOString()
    const seasonId = randomUUID()
    const collection = await getAssignmentsCollection()

    const result = await collection.updateMany(
      {
        userId: req.user.uid,
        $or: [{ isArchived: { $ne: true } }, { isArchived: { $exists: false } }],
      },
      {
        $set: {
          isArchived: true,
          archivedAt: now,
          seasonId,
          updatedAt: now,
        },
      }
    )

    return res.status(200).json({
      success: true,
      archivedCount: result.modifiedCount,
      seasonId,
      archivedAt: now,
      message:
        result.modifiedCount === 0
          ? 'No current assignments to archive'
          : `Moved ${result.modifiedCount} assignment(s) to History. Totals reset to zero.`,
    })
  } catch (error) {
    console.error('resetSeason error:', error)
    return res.status(500).json({ error: 'Failed to reset season' })
  }
}

export default withAuth(handler)
