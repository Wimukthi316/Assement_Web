import { useState } from 'react'
import { BookOpen, Mail, Lock, Loader2, AlertCircle, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

const inputClass =
  'w-full h-11 pl-10 pr-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors'

const labelClass =
  'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5'

export default function LoginPage() {
  const {
    loginWithEmail,
    signUpWithEmail,
    loginWithGoogle,
    authError,
    setAuthError,
    sessionExpired,
    clearSessionExpired,
  } = useAuth()
  const [mode, setMode] = useState('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState('')

  function switchMode(nextMode) {
    setMode(nextMode)
    setLocalError('')
    setAuthError(null)
    clearSessionExpired()
    if (nextMode === 'login') {
      setFullName('')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLocalError('')
    setAuthError(null)
    clearSessionExpired()

    if (mode === 'signup' && !fullName.trim()) {
      setLocalError('Please enter your full name')
      return
    }

    if (!email.trim() || !password) {
      setLocalError('Please enter both email and password')
      return
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'login') {
        await loginWithEmail(email.trim(), password)
      } else {
        await signUpWithEmail(email.trim(), password, fullName.trim())
      }
    } catch {
      // Error surfaced via authError
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    setLocalError('')
    setAuthError(null)
    clearSessionExpired()
    setSubmitting(true)
    try {
      await loginWithGoogle()
    } catch {
      // Error surfaced via authError
    } finally {
      setSubmitting(false)
    }
  }

  const displayError = localError || authError

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-200/40 dark:bg-indigo-900/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-violet-200/30 dark:bg-violet-900/10 blur-3xl" />
      </div>

      {/* Theme toggle — top right */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 dark:bg-indigo-500 shadow-xl shadow-indigo-500/30 mb-4">
            <BookOpen size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AssignTrack</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Secure assignment & subcontractor management
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <button
              type="button"
              onClick={() => switchMode('login')}
              disabled={submitting}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                mode === 'login'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-white dark:bg-slate-800'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              disabled={submitting}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                mode === 'signup'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-white dark:bg-slate-800'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="p-6 space-y-5">
            {sessionExpired && !displayError && (
              <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3.5 py-3">
                <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Your session expired after 30 minutes of inactivity. Please sign in again.
                </p>
              </div>
            )}

            {displayError && (
              <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-3.5 py-3">
                <AlertCircle size={16} className="text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                <p className="text-sm text-rose-700 dark:text-rose-300">{displayError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className={labelClass}>
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Smith"
                      disabled={submitting}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className={labelClass}>Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={submitting}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={submitting}
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  mode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                  or continue with
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting}
              className="w-full h-11 rounded-xl text-sm font-semibold bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-3 shadow-sm"
            >
              <GoogleIcon />
              Sign in with Google
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          Protected by Firebase Authentication
        </p>
      </div>
    </div>
  )
}
