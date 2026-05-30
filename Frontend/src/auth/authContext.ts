import { createContext } from 'react'
import type { AuthSession, AuthUser } from '../types/auth'

export interface AuthContextValue {
  user: AuthUser | null
  activeProfileId: number | null
  isAuthenticated: boolean
  signIn: (session: AuthSession) => void
  signOut: () => void
  setActiveProfileId: (profileId: number | null) => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
