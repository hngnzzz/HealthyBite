import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { profileBootstrapService } from '../../services/profileBootstrapService'

interface PublicRouteProps {
  children?: ReactNode
  redirectTo?: string
}

function PublicRoute({ children, redirectTo = '/dashboard' }: PublicRouteProps) {
  const { isAuthenticated, setActiveProfileId } = useAuth()
  const redirectCheckKey = isAuthenticated ? redirectTo : 'public'
  const [redirectCheck, setRedirectCheck] = useState({ key: 'initial', redirectTo: '' })

  useEffect(() => {
    let cancelled = false

    if (!isAuthenticated) {
      return () => {
        cancelled = true
      }
    }

    profileBootstrapService
      .resolveExistingProfile()
      .then((profile) => {
        if (cancelled) {
          return
        }

        setActiveProfileId(profile?.id ?? null)
        setRedirectCheck({ key: redirectCheckKey, redirectTo: profile ? redirectTo : '/welcome' })
      })
      .catch(() => {
        if (cancelled) {
          return
        }

        setActiveProfileId(null)
        setRedirectCheck({ key: redirectCheckKey, redirectTo: '/welcome' })
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, redirectCheckKey, redirectTo, setActiveProfileId])

  if (isAuthenticated) {
    if (redirectCheck.key !== redirectCheckKey) {
      return <div className="app-loading">Loading...</div>
    }

    return <Navigate to={redirectCheck.redirectTo} replace />
  }

  return children ?? <Outlet />
}

export default PublicRoute
