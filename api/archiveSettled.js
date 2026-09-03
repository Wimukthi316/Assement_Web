import { randomUUID } from 'crypto'
import { withAuth } from './lib/authMiddleware.js'
import { getAssignmentsCollection } from './lib/mongodb.js'
import { isSettledAssignment } from '../shared/settlement.js'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const collection = await getAssignmentsCollection()

    const current = await collection
      .find({
        userId: req.user.uid,
        $or: [{ isArchived: { $ne: true } }, { isArchived: { $exists: false } }],
      })
      .toArray()

    const settledIds = current.filter(isSettledAssignment).map((a) => a.id)
    const remainingCount = current.length - settledIds.length

    if (settledIds.length === 0) {
      return res.status(200).json({
        success: true,
        archivedCount: 0,
        remainingCount,
        seasonId: null,
        archivedAt: null,
        message:
          'No settled assignments to archive. An assignment must be Completed, paid by the client, priced, and settled with the subcontractor.',
      })
    }

    const now = new Date().toISOString()
    const seasonId = randomUUID()

    const result = await collection.updateMany(
      { userId: req.user.uid, id: { $in: settledIds } },
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
      remainingCount,
      seasonId,
      archivedAt: now,
      message: `Moved ${result.modifiedCount} settled assignment(s) to History.${
        remainingCount > 0
          ? ` ${remainingCount} assignment(s) stay open in the current season.`
          : ' The current season is now empty.'
      }`,
    })
  } catch (error) {
    console.error('archiveSettled error:', error)
    return res.status(500).json({ error: 'Failed to archive settled assignments' })
  }
}

export default withAuth(handler)
