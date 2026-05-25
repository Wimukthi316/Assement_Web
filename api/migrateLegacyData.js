import { withAuth } from './lib/authMiddleware.js'
import { migrateLegacyRecordsToUser } from './lib/migrateLegacy.js'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const result = await migrateLegacyRecordsToUser(req.user.uid)
    return res.status(200).json(result)
  } catch (error) {
    console.error('migrateLegacyData error:', error)
    return res.status(500).json({ error: 'Failed to migrate legacy data' })
  }
}

export default withAuth(handler)
