import admin, { initFirebaseAdmin, isFirebaseAdminReady } from './firebaseAdmin.js'

function sendJson(res, status, body) {
  if (res.headersSent) return
  res.status(status).json(body)
}

export async function verifyAuth(req, res) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendJson(res, 401, { error: 'Unauthorized: Missing or invalid Authorization header' })
    return null
  }

  const token = authHeader.slice('Bearer '.length).trim()

  if (!token) {
    sendJson(res, 401, { error: 'Unauthorized: Missing token' })
    return null
  }

  if (!isFirebaseAdminReady() && !initFirebaseAdmin()) {
    console.error('Firebase Admin SDK is not configured')
    sendJson(res, 503, { error: 'Authentication service is not configured' })
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
    sendJson(res, 401, { error: 'Unauthorized: Invalid or expired token' })
    return null
  }
}

export function withAuth(handler) {
  return async (req, res) => {
    try {
      const user = await verifyAuth(req, res)
      if (!user) return

      req.user = user
      await handler(req, res)
    } catch (error) {
      console.error('Unhandled API error:', error)

      if (error.message === 'MONGODB_NOT_CONFIGURED') {
        sendJson(res, 503, { error: 'Database is not configured' })
        return
      }

      sendJson(res, 500, { error: 'Internal server error' })
    }
  }
}
