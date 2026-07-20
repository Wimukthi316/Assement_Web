import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth'
import { auth } from '../lib/firebase.js'
import { setTokenGetter, setUnauthorizedHandler } from '../services/api.js'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors.js'
import {
  startSession,
  clearSessionMeta,
  touchActivity,
  markSessionExpired,
  isSessionValid,
  getSessionExpiryReason,
} from '../utils/session.js'

const AuthContext = createContext(null)

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove']
const GOOGLE_REDIRECT_FLAG = 'assigntrack-google-redirect'

function createGoogleProvider() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  provider.addScope('profile')
  provider.addScope('email')
  return provider
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const [sessionMessage, setSessionMessage] = useState(null)
  const endingSession = useRef(false)

  const endSession = useCallback(async (reason = 'idle') => {
    if (endingSession.current) return
    endingSession.current = true
    try {
      markSessionExpired()
      await signOut(auth)
      setUser(null)
      if (reason === 'idle') {
        setSessionMessage('Your session expired due to inactivity. Please sign in again.')
      } else if (reason === 'max') {
        setSessionMessage('Your session reached the maximum time limit. Please sign in again.')
      } else if (reason === 'missing') {
        setSessionMessage('Your previous session ended. Please sign in again.')
      } else {
        setSessionMessage('Your session has ended. Please sign in again.')
      }
    } catch {
      setUser(null)
    } finally {
      endingSession.current = false
    }
  }, [])

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => {})

    setTokenGetter(async () => {
      const currentUser = auth.currentUser
      if (!currentUser) return null
      if (!isSessionValid()) {
        await endSession(getSessionExpiryReason() || 'idle')
        return null
      }
      try {
        return await currentUser.getIdToken()
      } catch {
        return null
      }
    })

    setUnauthorizedHandler(async () => {
      try {
        clearSessionMeta()
        await signOut(auth)
      } catch {
        setUser(null)
      }
    })
  }, [endSession])

  // Handle Google redirect return BEFORE attaching auth listener
  useEffect(() => {
    let unsubscribed = false
    let unsubscribeAuth = () => {}

    async function initAuth() {
      try {
        const result = await getRedirectResult(auth)
        if (result?.user) {
          startSession()
          sessionStorage.removeItem(GOOGLE_REDIRECT_FLAG)
          setSessionMessage(null)
          setAuthError(null)
        } else if (sessionStorage.getItem(GOOGLE_REDIRECT_FLAG) === '1') {
          // Redirect started but no user returned (cancelled / failed)
          sessionStorage.removeItem(GOOGLE_REDIRECT_FLAG)
        }
      } catch (error) {
        sessionStorage.removeItem(GOOGLE_REDIRECT_FLAG)
        if (error.code !== 'auth/popup-closed-by-user') {
          setAuthError(getFirebaseErrorMessage(error))
        }
      }

      if (unsubscribed) return

      unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const reason = getSessionExpiryReason()
          if (reason === 'idle' || reason === 'max') {
            endSession(reason)
          } else if (reason === 'missing') {
            // Session meta missing (e.g. browser reopen) — require fresh login
            endSession('missing')
          } else {
            setUser(firebaseUser)
          }
        } else {
          clearSessionMeta()
          setUser(null)
        }
        setLoading(false)
      })
    }

    initAuth()

    return () => {
      unsubscribed = true
      unsubscribeAuth()
    }
  }, [endSession])

  // Track user activity + poll for expiry while logged in
  useEffect(() => {
    if (!user) return

    let activityThrottle = null
    function onActivity() {
      if (activityThrottle) return
      activityThrottle = setTimeout(() => {
        activityThrottle = null
      }, 1000)
      touchActivity()
    }

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, onActivity, { passive: true })
    })

    const interval = setInterval(() => {
      const reason = getSessionExpiryReason()
      if (reason) {
        endSession(reason)
      }
    }, 15_000)

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, onActivity)
      })
      clearInterval(interval)
      if (activityThrottle) clearTimeout(activityThrottle)
    }
  }, [user, endSession])

  const getIdToken = useCallback(async () => {
    if (!auth.currentUser) return null
    if (!isSessionValid()) {
      await endSession(getSessionExpiryReason() || 'idle')
      return null
    }
    return auth.currentUser.getIdToken()
  }, [endSession])

  const loginWithEmail = useCallback(async (email, password) => {
    setAuthError(null)
    setSessionMessage(null)
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      startSession()
      return result.user
    } catch (error) {
      setAuthError(getFirebaseErrorMessage(error))
      throw error
    }
  }, [])

  const signUpWithEmail = useCallback(async (email, password, fullName) => {
    setAuthError(null)
    setSessionMessage(null)
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName: fullName.trim() })
      startSession()
      return result.user
    } catch (error) {
      setAuthError(getFirebaseErrorMessage(error))
      throw error
    }
  }, [])

  const loginWithGoogle = useCallback(async () => {
    setAuthError(null)
    setSessionMessage(null)
    try {
      // Redirect flow avoids Cross-Origin-Opener-Policy blocking window.closed (popup)
      sessionStorage.setItem(GOOGLE_REDIRECT_FLAG, '1')
      await signInWithRedirect(auth, createGoogleProvider())
    } catch (error) {
      sessionStorage.removeItem(GOOGLE_REDIRECT_FLAG)
      setAuthError(getFirebaseErrorMessage(error))
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    setAuthError(null)
    setSessionMessage(null)
    clearSessionMeta()
    await signOut(auth)
  }, [])

  const clearSessionMessage = useCallback(() => {
    setSessionMessage(null)
  }, [])

  const value = {
    user,
    loading,
    authError,
    setAuthError,
    sessionMessage,
    clearSessionMessage,
    getIdToken,
    loginWithEmail,
    signUpWithEmail,
    loginWithGoogle,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
