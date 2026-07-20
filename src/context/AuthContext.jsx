import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const reason = getSessionExpiryReason()
        // No tracked session (browser closed) OR idle/max expired → force re-login
        if (reason) {
          endSession(reason === 'missing' ? 'missing' : reason)
        } else {
          setUser(firebaseUser)
        }
      } else {
        clearSessionMeta()
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
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
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const result = await signInWithPopup(auth, provider)
      startSession()
      return result.user
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user') {
        setAuthError(getFirebaseErrorMessage(error))
      }
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
