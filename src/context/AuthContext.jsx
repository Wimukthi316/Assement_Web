import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth'
import { auth } from '../lib/firebase.js'
import { setTokenGetter } from '../services/api.js'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    setTokenGetter(async () => {
      const currentUser = auth.currentUser
      if (!currentUser) return null
      return currentUser.getIdToken()
    })
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const getIdToken = useCallback(async () => {
    if (!auth.currentUser) return null
    return auth.currentUser.getIdToken()
  }, [])

  const loginWithEmail = useCallback(async (email, password) => {
    setAuthError(null)
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      return result.user
    } catch (error) {
      setAuthError(getFirebaseErrorMessage(error))
      throw error
    }
  }, [])

  const signUpWithEmail = useCallback(async (email, password, fullName) => {
    setAuthError(null)
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName: fullName.trim() })
      return result.user
    } catch (error) {
      setAuthError(getFirebaseErrorMessage(error))
      throw error
    }
  }, [])

  const loginWithGoogle = useCallback(async () => {
    setAuthError(null)
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const result = await signInWithPopup(auth, provider)
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
    await signOut(auth)
  }, [])

  const value = {
    user,
    loading,
    authError,
    setAuthError,
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
