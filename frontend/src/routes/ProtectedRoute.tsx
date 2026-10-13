import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type UserRole = 'admin' | 'staff' | 'customer'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />

          <p className="mt-4 text-sm text-slate-600">
            Loading your RetailIQ account...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  const role = user.role?.toLowerCase() as UserRole

  if (
    allowedRoles &&
    !allowedRoles.includes(role)
  ) {
    const defaultRoute =
      role === 'customer'
        ? '/products'
        : '/dashboard'

    return <Navigate to={defaultRoute} replace />
  }

  return <>{children}</>
}