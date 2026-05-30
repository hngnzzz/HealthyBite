import type { AuthUser } from '../types/auth'

const SESSION_USER_KEY = 'sessionUser'
const ACCESS_TOKEN_KEY = 'accessToken'
const ACTIVE_PROFILE_ID_KEY = 'activeProfileId'
const ONBOARDING_DRAFT_KEY = 'onboardingDraft'
const SELECTED_GOAL_KEY = 'selectedGoal'

export const sessionService = {
  getUser() {
    const raw = localStorage.getItem(SESSION_USER_KEY)

    if (!raw) {
      return null
    }

    try {
      return JSON.parse(raw) as AuthUser
    } catch {
      return null
    }
  },

  saveUser(user: AuthUser) {
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user))
  },

  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  saveAccessToken(accessToken: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  },

  clearUser() {
    localStorage.removeItem(SESSION_USER_KEY)
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  },

  logout() {
    sessionService.clearUser()
    sessionService.clearActiveProfileId()
    sessionService.clearOnboardingState()
    sessionService.clearBodyReviewState()
  },

  getActiveProfileId() {
    const raw = localStorage.getItem(ACTIVE_PROFILE_ID_KEY)
    if (!raw) return null

    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : null
  },

  setActiveProfileId(profileId: number) {
    localStorage.setItem(ACTIVE_PROFILE_ID_KEY, String(profileId))
  },

  clearActiveProfileId() {
    localStorage.removeItem(ACTIVE_PROFILE_ID_KEY)
  },

  clearOnboardingState() {
    localStorage.removeItem(ONBOARDING_DRAFT_KEY)
    localStorage.removeItem(SELECTED_GOAL_KEY)
  },

  clearBodyReviewState() {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('bodyReviewMeasurements:')) {
        localStorage.removeItem(key)
      }
    }
  },
}
