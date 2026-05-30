import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { profileBootstrapService } from '../../services/profileBootstrapService'

interface ProtectedRouteProps {
  children?: ReactNode
  redirectTo?: string
  requireActiveProfile?: boolean
  redirectIfActiveProfile?: boolean
}

function ProtectedRoute({
  children,
  redirectTo = '/login',
  requireActiveProfile = false,
  redirectIfActiveProfile = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, setActiveProfileId } = useAuth()
  const location = useLocation()
  const shouldCheckProfile = isAuthenticated && (requireActiveProfile || redirectIfActiveProfile)
  const profileCheckKey = shouldCheckProfile
    ? `${location.pathname}${location.search}${location.hash}:${requireActiveProfile}:${redirectIfActiveProfile}`
    : 'skip'
  const [profileCheck, setProfileCheck] = useState({ key: 'initial', hasActiveProfile: false })

  useEffect(() => {
    let cancelled = false

    if (!shouldCheckProfile) {
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
        setProfileCheck({ key: profileCheckKey, hasActiveProfile: profile != null })
      })
      .catch(() => {
        if (cancelled) {
          return
        }

        setActiveProfileId(null)
        setProfileCheck({ key: profileCheckKey, hasActiveProfile: false })
      })

    return () => {
      cancelled = true
    }
  }, [profileCheckKey, setActiveProfileId, shouldCheckProfile])

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />
  }

  if (requireActiveProfile || redirectIfActiveProfile) {
    if (profileCheck.key !== profileCheckKey) {
      return <div className="app-loading">Loading...</div>
    }

    if (requireActiveProfile && !profileCheck.hasActiveProfile) {
      return (
        <Navigate
          to="/welcome"
          replace
          state={{ redirectTo: `${location.pathname}${location.search}${location.hash}` }}
        />
      )
    }

    if (redirectIfActiveProfile && profileCheck.hasActiveProfile) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children ?? <Outlet />
}

export default ProtectedRoute
