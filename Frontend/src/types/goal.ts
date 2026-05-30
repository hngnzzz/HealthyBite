export type GoalManagementType =
  | 'lose-weight'
  | 'gain-weight'
  | 'maintain-weight'
  | 'body-recomposition'

export type GoalDietPlanKey =
  | 'balanced'
  | 'mediterranean'
  | 'keto'
  | 'high-protein'
  | 'clean-bulk'
  | 'high-protein-maintenance'
  | 'body-recomposition'
  | 'macro-tracking'
  | 'flexible-dieting'
  | 'mediterranean-high-protein'
  | 'low-carb-high-protein'
  | 'custom'

export interface GoalMacroSplit {
  proteinPercent: number
  carbPercent: number
  fatPercent: number
}

export type GoalStrictness = 'Flexible' | 'Balanced' | 'Strict'

export interface GoalDailyTargets {
  calories: number
  proteinGrams: number
  carbGrams: number
  fatGrams: number
  waterMl: number
  stepsTarget: number | null
  mealsPerDay: number
  dietPlanKey: GoalDietPlanKey
  dietPlanLabel: string
  macroSplit: GoalMacroSplit
}

export interface GoalProgressSnapshot {
  startDate: string
  startWeightKg: number
  currentWeightKg: number
  targetWeightKg: number
  elapsedDays: number
  actualProgressKg: number
  plannedProgressKg: number
  varianceKg: number
  completionPercent: number
  onTrackLikelihood: string
}

export interface GoalSafetyAlert {
  level: 'info' | 'warning' | 'danger'
  title: string
  message: string
}

export interface GoalHistoryEntry {
  id: string
  changedAt: string
  type: GoalManagementType
  targetWeightKg: number
  targetDate: string
  plannedRateKgPerWeek: number
  strictness: GoalStrictness
}

export interface GoalPlan {
  id: string
  type: GoalManagementType
  dietPlanKey: GoalDietPlanKey
  customMacroSplit: GoalMacroSplit | null
  targetWeightKg: number
  targetDate: string
  plannedRateKgPerWeek: number
  strictness: GoalStrictness
  startDate: string
  status: 'active' | 'completed' | 'cancelled'
  startWeightKg: number
  dailyTargets: GoalDailyTargets
  progress: GoalProgressSnapshot
  safetyAlerts: GoalSafetyAlert[]
  history: GoalHistoryEntry[]
}
