import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { LoadingState } from './StatusMessages.jsx'

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <LoadingState message="Checking authentication..." />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return children
}
