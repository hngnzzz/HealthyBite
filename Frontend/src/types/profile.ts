export interface Profile {
  id: number
  userId: number
  name: string
  nickname: string
  age: number
  birthDate: string | null
  gender: string
  heightCm: number
  weightKg: number
  targetWeightKg: number | null
  goal: string
  activityLevel: string
  dietPlan: string
  targetCalories: number | null
  targetProtein: number | null
  targetCarbs: number | null
  targetFat: number | null
  waterGoalMl: number | null
  healthStatus: string
  favoriteFoods: string
  nutritionConstraints: string
  measurementUnit: string
  // Legacy fields — may still be present in API responses from older data.
  // Not rendered or collected by the UI; retained here to avoid excess-property errors.
  foodAllergies?: string
  dislikedFoods?: string
  eatingHabits?: string
  workoutSchedule?: string
  sleepTime?: string
  wakeTime?: string
}

export interface CreateProfilePayload {
  userId: number
  name: string
  nickname: string
  age: number
  birthDate?: string | null
  gender: string
  heightCm: number
  weightKg: number
  targetWeightKg: number
  goal: string
  activityLevel: string
  dietPlan: string
  targetCalories: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
  waterGoalMl: number
  healthStatus: string
  favoriteFoods: string
  nutritionConstraints: string
  measurementUnit: string
}

export interface UpdateProfilePayload {
  name: string
  nickname: string
  age: number
  birthDate?: string | null
  gender: string
  heightCm: number
  weightKg: number
  targetWeightKg: number
  goal: string
  activityLevel: string
  dietPlan: string
  targetCalories: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
  waterGoalMl: number
  healthStatus: string
  favoriteFoods: string
  nutritionConstraints: string
  measurementUnit: string
}
