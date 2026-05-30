import type { OnboardingDraft } from '../types/onboarding'

const STORAGE_KEY = 'onboardingDraft'

const EMPTY_DRAFT: OnboardingDraft = {
  fullName: '',
  dateOfBirth: '',
  gender: 'male',
  currentWeight: '',
  targetWeight: '',
  heightCm: '',
}

export const onboardingService = {
  getDraft() {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return EMPTY_DRAFT
    }

    try {
      return { ...EMPTY_DRAFT, ...JSON.parse(raw) } as OnboardingDraft
    } catch {
      return EMPTY_DRAFT
    }
  },

  saveDraft(payload: OnboardingDraft) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  },

  clearDraft() {
    localStorage.removeItem(STORAGE_KEY)
  },
}
