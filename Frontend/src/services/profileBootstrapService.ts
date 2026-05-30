import type { CreateProfilePayload, Profile } from '../types/profile'
import { onboardingService } from './onboardingService'
import { profileService } from './profileService'
import { sessionService } from './sessionService'

const SELECTED_GOAL_KEY = 'selectedGoal'
type SelectedGoal = 'lose-weight' | 'gain-muscle' | 'maintain-health' | null

function calculateAge(dateOfBirth: string) {
  if (!dateOfBirth) {
    return 0
  }

  const birthDate = new Date(dateOfBirth)
  if (Number.isNaN(birthDate.getTime())) {
    return 0
  }

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const hasNotHadBirthdayYet =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())

  if (hasNotHadBirthdayYet) {
    age -= 1
  }

  return Math.max(0, age)
}

function mapGoal(selectedGoal: string | null) {
  switch (selectedGoal) {
    case 'lose-weight':
      return 'lose_weight'
    case 'gain-muscle':
      return 'build_muscle'
    case 'maintain-health':
    default:
      return 'maintain'
  }
}

function mapDietPlan(selectedGoal: string | null) {
  switch (selectedGoal) {
    case 'lose-weight':
      return 'high-protein-cut'
    case 'gain-muscle':
      return 'lean-bulk'
    case 'maintain-health':
    default:
      return 'balanced-maintain'
  }
}

function getSelectedGoal(): SelectedGoal {
  const goal = localStorage.getItem(SELECTED_GOAL_KEY)
  if (goal === 'lose-weight' || goal === 'gain-muscle' || goal === 'maintain-health') {
    return goal
  }

  return null
}

function buildProfilePayload(userFullName: string): CreateProfilePayload | null {
  const draft = onboardingService.getDraft()
  const selectedGoal = getSelectedGoal()
  const weightKg = Number(draft.currentWeight)
  const heightCm = Number(draft.heightCm)
  const age = calculateAge(draft.dateOfBirth)
  const name = draft.fullName.trim() || userFullName.trim()

  if (!name || weightKg <= 0 || heightCm <= 0 || age <= 0) {
    return null
  }

  return {
    userId: 0,
    name,
    nickname: '',
    age,
    birthDate: draft.dateOfBirth || null,
    gender: draft.gender,
    heightCm,
    weightKg,
    targetWeightKg: Number(draft.targetWeight) > 0 ? Number(draft.targetWeight) : weightKg,
    goal: mapGoal(selectedGoal),
    activityLevel: 'moderate',
    dietPlan: mapDietPlan(selectedGoal),
    targetCalories: 0,
    targetProtein: 0,
    targetCarbs: 0,
    targetFat: 0,
    waterGoalMl: 2000,
    healthStatus: '',
    favoriteFoods: '',
    nutritionConstraints: '',
    measurementUnit: 'metric',
  }
}

export const profileBootstrapService = {
  buildPrefillDraft(userFullName: string) {
    const draft = onboardingService.getDraft()
    const selectedGoal = getSelectedGoal()

    return {
      profileName: draft.fullName.trim() || userFullName.trim(),
      gender: draft.gender === 'female' ? ('Female' as const) : ('Male' as const),
      age: draft.dateOfBirth ? String(calculateAge(draft.dateOfBirth)) : '',
      ageMonths: '',
      heightCm: draft.heightCm || '',
      weightKg: draft.currentWeight || '',
      targetWeightKg: draft.targetWeight || draft.currentWeight || '',
      activityLevel: 'Moderately active' as const,
      goal:
        selectedGoal === 'lose-weight'
          ? ('Lose weight' as const)
          : selectedGoal === 'gain-muscle'
            ? ('Build muscle' as const)
            : ('Maintain' as const),
      goalSpeed: 'Normal' as const,
      dietPlan:
        selectedGoal === 'lose-weight'
          ? ('high-protein-cut' as const)
          : selectedGoal === 'gain-muscle'
            ? ('lean-bulk' as const)
            : ('balanced-maintain' as const),
      healthStatus: '',
      nutritionConstraints: '',
      measurementUnit: 'metric' as const,
    }
  },

  async ensurePrimaryProfile() {
    const user = sessionService.getUser()
    if (!user) {
      return null
    }

    const profilesResponse = await profileService.getMyProfiles()
    const existingProfiles = profilesResponse.data.data

    if (existingProfiles.length > 0) {
      const activeProfile =
        existingProfiles.find((profile) => profile.id === sessionService.getActiveProfileId()) ??
        existingProfiles[0]

      sessionService.setActiveProfileId(activeProfile.id)
      return activeProfile
    }

    const payload = buildProfilePayload(user.fullName)
    if (!payload) {
      return null
    }

    const createdResponse = await profileService.createProfile({
      ...payload,
      userId: 0,
    })

    const createdProfile: Profile = createdResponse.data.data
    sessionService.setActiveProfileId(createdProfile.id)
    return createdProfile
  },

  async resolveExistingProfile() {
    const user = sessionService.getUser()
    if (!user) {
      sessionService.clearActiveProfileId()
      return null
    }

    const profilesResponse = await profileService.getMyProfiles()
    const existingProfiles = profilesResponse.data.data

    if (existingProfiles.length === 0) {
      sessionService.clearActiveProfileId()
      return null
    }

    const activeProfile =
      existingProfiles.find((profile) => profile.id === sessionService.getActiveProfileId()) ??
      existingProfiles[0]

    sessionService.setActiveProfileId(activeProfile.id)
    return activeProfile
  },
}
