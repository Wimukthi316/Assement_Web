import { getAssignmentsCollection } from './mongodb.js'

const LEGACY_FILTER = {
  $or: [
    { userId: { $exists: false } },
    { userId: null },
    { userId: '' },
  ],
}

export async function migrateLegacyRecordsToUser(userId) {
  const collection = await getAssignmentsCollection()

  const legacyCount = await collection.countDocuments(LEGACY_FILTER)
  if (legacyCount === 0) {
    return { migrated: 0, message: 'No legacy records found' }
  }

  const targetUid = process.env.LEGACY_MIGRATION_TARGET_UID
  const autoMigrate = process.env.AUTO_MIGRATE_LEGACY === 'true'

  if (targetUid && targetUid !== userId) {
    return {
      migrated: 0,
      legacyCount,
      message: 'Legacy migration is restricted to the designated account owner',
    }
  }

  if (!targetUid && !autoMigrate) {
    return {
      migrated: 0,
      legacyCount,
      message: 'Set LEGACY_MIGRATION_TARGET_UID or enable AUTO_MIGRATE_LEGACY',
    }
  }

  const result = await collection.updateMany(LEGACY_FILTER, {
    $set: { userId },
  })

  return {
    migrated: result.modifiedCount,
    legacyCount,
    message: `Migrated ${result.modifiedCount} legacy record(s) to user ${userId}`,
  }
}

export async function autoMigrateLegacyIfConfigured(userId) {
  if (process.env.AUTO_MIGRATE_LEGACY !== 'true') {
    return { migrated: 0 }
  }

  return migrateLegacyRecordsToUser(userId)
}
