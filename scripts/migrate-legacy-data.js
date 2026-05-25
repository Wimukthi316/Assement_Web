/**
 * One-time CLI script to assign legacy records (missing userId) to a Firebase user.
 *
 * Usage:
 *   LEGACY_MIGRATION_TARGET_UID=your-firebase-uid node scripts/migrate-legacy-data.js
 *
 * Requires MONGODB_URI in .env or environment.
 */
import { MongoClient } from 'mongodb'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

function loadEnvFile() {
  const envPath = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) return

  const content = readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

loadEnvFile()

const uri = process.env.MONGODB_URI
const targetUid = process.env.LEGACY_MIGRATION_TARGET_UID

if (!uri) {
  console.error('Error: MONGODB_URI is required')
  process.exit(1)
}

if (!targetUid) {
  console.error('Error: LEGACY_MIGRATION_TARGET_UID is required')
  console.error('Find your UID in Firebase Console → Authentication → Users')
  process.exit(1)
}

const legacyFilter = {
  $or: [{ userId: { $exists: false } }, { userId: null }, { userId: '' }],
}

const client = new MongoClient(uri)

try {
  await client.connect()
  const collection = client.db('assigntrack').collection('assignments')

  const legacyCount = await collection.countDocuments(legacyFilter)
  console.log(`Found ${legacyCount} legacy record(s) without userId`)

  if (legacyCount === 0) {
    console.log('Nothing to migrate.')
    process.exit(0)
  }

  const result = await collection.updateMany(legacyFilter, {
    $set: { userId: targetUid },
  })

  console.log(`Successfully migrated ${result.modifiedCount} record(s) to user: ${targetUid}`)
} catch (error) {
  console.error('Migration failed:', error.message)
  process.exit(1)
} finally {
  await client.close()
}
