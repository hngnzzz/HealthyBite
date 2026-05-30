import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { authService } from '../services/authService'
import { sessionService } from '../services/sessionService'
import type { AuthSession, AuthUser } from '../types/auth'
import { AuthContext, type AuthContextValue } from './authContext'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => sessionService.getUser())
  const [activeProfileId, setActiveProfileIdState] = useState<number | null>(() =>
    sessionService.getActiveProfileId(),
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      activeProfileId,
      isAuthenticated: user != null,
      signIn(nextSession: AuthSession) {
        const { accessToken, accessTokenExpiresAt, ...nextUser } = nextSession
        sessionService.saveUser({ ...nextUser, accessTokenExpiresAt })
        if (accessToken) {
          sessionService.saveAccessToken(accessToken)
        }
        setUser({ ...nextUser, accessTokenExpiresAt })
      },
      signOut() {
        sessionService.logout()
        sessionService.clearOnboardingState()
        sessionService.clearBodyReviewState()
        void authService.logout()
        setUser(null)
        setActiveProfileIdState(null)
      },
      setActiveProfileId(profileId) {
        if (profileId == null) {
          sessionService.clearActiveProfileId()
          setActiveProfileIdState(null)
          return
        }

        sessionService.setActiveProfileId(profileId)
        setActiveProfileIdState(profileId)
      },
    }),
    [activeProfileId, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
