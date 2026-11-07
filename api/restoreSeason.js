import { withAuth } from './_lib/authMiddleware.js'
import { getAssignmentsCollection } from './_lib/mongodb.js'

function archivedSeasonFilter(userId, seasonId) {
  if (seasonId === 'legacy') {
    return {
      userId,
      isArchived: true,
      $or: [{ seasonId: null }, { seasonId: { $exists: false } }, { seasonId: '' }],
    }
  }
  return {
    userId,
    seasonId,
    isArchived: true,
  }
}

/**
 * Inverse of Close Season / Reset (and of Archive Settled for that season):
 * unarchive every assignment in one History season back onto the current
 * dashboard. Status, prices, and paid/unpaid flags are left untouched.
 * Existing current-season rows are never deleted — restored rows merge in.
 */
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const seasonId = req.body?.seasonId || req.query?.seasonId
    if (!seasonId) {
      return res.status(400).json({ error: 'Season ID is required' })
    }

    const collection = await getAssignmentsCollection()
    const filter = archivedSeasonFilter(req.user.uid, seasonId)

    const toRestore = await collection.find(filter).toArray()
    if (toRestore.length === 0) {
      return res.status(404).json({ error: 'No archived assignments found for this season' })
    }

    const currentCount = await collection.countDocuments({
      userId: req.user.uid,
      $or: [{ isArchived: { $ne: true } }, { isArchived: { $exists: false } }],
    })

    const now = new Date().toISOString()
    const result = await collection.updateMany(filter, {
      $set: {
        isArchived: false,
        archivedAt: null,
        seasonId: null,
        updatedAt: now,
      },
    })

    return res.status(200).json({
      success: true,
      seasonId,
      restoredCount: result.modifiedCount,
      currentCount,
      merged: currentCount > 0,
      message:
        currentCount > 0
          ? `Restored ${result.modifiedCount} assignment(s) into the current season. Your existing ${currentCount} current assignment(s) were kept.`
          : `Restored ${result.modifiedCount} assignment(s) to the current season. Nothing was deleted.`,
    })
  } catch (error) {
    console.error('restoreSeason error:', error)
    return res.status(500).json({ error: 'Failed to restore season' })
  }
}

export default withAuth(handler)
