/** Idle timeout: logout after this much inactivity */
export const SESSION_IDLE_MS = 30 * 60 * 1000 // 30 minutes

/** Absolute max session length from login, even if active */
export const SESSION_MAX_MS = 8 * 60 * 60 * 1000 // 8 hours

const SESSION_START_KEY = 'assigntrack-session-start'
const LAST_ACTIVITY_KEY = 'assigntrack-last-activity'
const EXPIRED_FLAG_KEY = 'assigntrack-session-expired'

export function startSession() {
  const now = String(Date.now())
  sessionStorage.setItem(SESSION_START_KEY, now)
  sessionStorage.setItem(LAST_ACTIVITY_KEY, now)
  sessionStorage.removeItem(EXPIRED_FLAG_KEY)
}

export function clearSessionMeta() {
  sessionStorage.removeItem(SESSION_START_KEY)
  sessionStorage.removeItem(LAST_ACTIVITY_KEY)
}

export function touchActivity() {
  if (!sessionStorage.getItem(SESSION_START_KEY)) return
  sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))
}

export function markSessionExpired() {
  sessionStorage.setItem(EXPIRED_FLAG_KEY, '1')
  clearSessionMeta()
}

export function consumeSessionExpiredFlag() {
  const expired = sessionStorage.getItem(EXPIRED_FLAG_KEY) === '1'
  if (expired) sessionStorage.removeItem(EXPIRED_FLAG_KEY)
  return expired
}

export function getSessionExpiryReason() {
  const start = Number(sessionStorage.getItem(SESSION_START_KEY) || 0)
  const lastActivity = Number(sessionStorage.getItem(LAST_ACTIVITY_KEY) || 0)
  const now = Date.now()

  // No session metadata (e.g. browser was closed / new tab with stale Firebase auth)
  if (!start || !lastActivity) {
    return 'missing'
  }

  if (now - start >= SESSION_MAX_MS) {
    return 'max'
  }

  if (now - lastActivity >= SESSION_IDLE_MS) {
    return 'idle'
  }

  return null
}

export function isSessionValid() {
  return getSessionExpiryReason() === null
}

export function getRemainingIdleMs() {
  const lastActivity = Number(sessionStorage.getItem(LAST_ACTIVITY_KEY) || 0)
  if (!lastActivity) return 0
  return Math.max(0, SESSION_IDLE_MS - (Date.now() - lastActivity))
}
