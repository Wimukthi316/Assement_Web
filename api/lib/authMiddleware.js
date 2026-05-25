import admin from './firebaseAdmin.js'

export async function verifyAuth(req, res) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' })
    return null
  }

  const token = authHeader.slice('Bearer '.length).trim()

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Missing token' })
    return null
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token)
    return {
      uid: decoded.uid,
      email: decoded.email || null,
    }
  } catch (error) {
    console.error('Token verification failed:', error.message)
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' })
    return null
  }
}

export function withAuth(handler) {
  return async (req, res) => {
    const user = await verifyAuth(req, res)
    if (!user) return

    req.user = user
    return handler(req, res)
  }
}
