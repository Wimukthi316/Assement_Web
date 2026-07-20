import { useEffect, useRef, useCallback } from 'react'

const IDLE_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const ACTIVITY_STORAGE_KEY = 'assigntrack-last-activity'
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'visibilitychange']

function getLastActivity() {
  try {
    const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY)
    return raw ? Number(raw) : Date.now()
  } catch {
    return Date.now()
  }
}

function setLastActivity(timestamp = Date.now()) {
  try {
    localStorage.setItem(ACTIVITY_STORAGE_KEY, String(timestamp))
  } catch {
    // ignore storage errors
  }
}

function clearLastActivity() {
  try {
    localStorage.removeItem(ACTIVITY_STORAGE_KEY)
  } catch {
    // ignore storage errors
  }
}

/**
 * Auto-logout after IDLE_TIMEOUT_MS of inactivity while the user is signed in.
 * Also logs out immediately if the stored last-activity is already older than the timeout
 * (e.g. user closed the tab and returned later).
 */
export function useSessionTimeout(user, logout) {
  const timerRef = useRef(null)
  const logoutRef = useRef(logout)

  useEffect(() => {
    logoutRef.current = logout
  }, [logout])

  const performLogout = useCallback(async () => {
    clearLastActivity()
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    try {
      await logoutRef.current()
    } catch {
      // AuthContext will still clear user on next auth state change
    }
  }, [])

  const scheduleLogout = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    const last = getLastActivity()
    const remaining = IDLE_TIMEOUT_MS - (Date.now() - last)

    if (remaining <= 0) {
      performLogout()
      return
    }

    timerRef.current = setTimeout(() => {
      performLogout()
    }, remaining)
  }, [performLogout])

  const bumpActivity = useCallback(() => {
    if (document.visibilityState === 'hidden') return
    setLastActivity(Date.now())
    scheduleLogout()
  }, [scheduleLogout])

  useEffect(() => {
    if (!user) {
      clearLastActivity()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    // On login / remount: if already idle past timeout, logout immediately
    const last = getLastActivity()
    if (Date.now() - last >= IDLE_TIMEOUT_MS) {
      performLogout()
      return
    }

    setLastActivity(Date.now())
    scheduleLogout()

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, bumpActivity, { passive: true })
    })

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, bumpActivity)
      })
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [user, bumpActivity, scheduleLogout, performLogout])
}

export { IDLE_TIMEOUT_MS }
