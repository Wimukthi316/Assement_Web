import admin from 'firebase-admin'

function getPrivateKey() {
  const key = process.env.FIREBASE_PRIVATE_KEY
  if (!key) return undefined
  return key.replace(/\\n/g, '\n')
}

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = getPrivateKey()

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      'Firebase Admin SDK is not fully configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
    )
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
  }
}

export default admin
