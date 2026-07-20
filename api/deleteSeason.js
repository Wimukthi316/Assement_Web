import { withAuth } from './lib/authMiddleware.js'
import { getAssignmentsCollection } from './lib/mongodb.js'

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const seasonId = req.query?.seasonId || req.body?.seasonId

    if (!seasonId) {
      return res.status(400).json({ error: 'Season ID is required' })
    }

    const collection = await getAssignmentsCollection()

    let filter
    if (seasonId === 'legacy') {
      filter = {
        userId: req.user.uid,
        isArchived: true,
        $or: [
          { seasonId: null },
          { seasonId: { $exists: false } },
          { seasonId: '' },
        ],
      }
    } else {
      filter = {
        userId: req.user.uid,
        seasonId,
        isArchived: true,
      }
    }

    const result = await collection.deleteMany(filter)

    return res.status(200).json({
      success: true,
      seasonId,
      deletedCount: result.deletedCount,
      message:
        result.deletedCount === 0
          ? 'No assignments found for this season'
          : `Permanently deleted ${result.deletedCount} assignment(s) from this season`,
    })
  } catch (error) {
    console.error('deleteSeason error:', error)
    return res.status(500).json({ error: 'Failed to delete season' })
  }
}

export default withAuth(handler)
