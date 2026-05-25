import { withAuth } from './lib/authMiddleware.js'
import { getAssignmentsCollection } from './lib/mongodb.js'

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const id = req.query?.id || req.body?.id

    if (!id) {
      return res.status(400).json({ error: 'Assignment ID is required' })
    }

    const collection = await getAssignmentsCollection()
    const result = await collection.deleteOne({ id, userId: req.user.uid })

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Assignment not found' })
    }

    return res.status(200).json({ success: true, id })
  } catch (error) {
    console.error('deleteAssignment error:', error)
    return res.status(500).json({ error: 'Failed to delete assignment' })
  }
}

export default withAuth(handler)
