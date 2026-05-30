export interface HealthAssessmentInput {
  gender: 'Male' | 'Female'
  ageYears: number
  ageMonths?: number
  heightCm: number
  weightKg: number
}

export interface PediatricHealthAssessment {
  mode: 'who-growth' | 'bmi-age-percentile'
  status: string
  summaryLabel: string
  summaryValue: string
  warning: string
  idealWeightText: string
  percentileText: string
  detailLines: string[]
}

export interface DashboardMacroProgress {
  label: string
  consumed: number
  target: number
  accent: 'blue' | 'amber' | 'rose'
}

export interface DashboardMealSummary {
  title: string
  name: string
  calories: number
}

export interface DashboardGoalProgress {
  goalLabel: string
  currentWeightKg: number
  targetWeightKg: number | null
  remainingKg: number
  daysOnPlan: number
  completionPercent: number
}

export interface DashboardChartPoint {
  label: string
  value: number | null
  target: number | null
}

export interface DashboardQuickCharts {
  weightTrend: DashboardChartPoint[]
  calories7Days: DashboardChartPoint[]
  calorieAdherencePercent: number
  proteinTargetPercent: number
  hasWeightHistory: boolean
}

export interface DashboardAlert {
  level: string
  title: string
  message: string
}

export interface DashboardSummary {
  greetingName: string
  summaryDateLabel: string
  caloriesConsumed: number
  caloriesTarget: number
  caloriesRemaining: number
  caloriesBalance: number
  isOverCalories: boolean
  bmiValue: number | null
  bmiLabel: string
  weightKg: number | null
  heightCm: number | null
  goalLabel: string
  waterConsumedMl: number
  waterGoalMl: number
  mealsLoggedCount: number
  exerciseMinutes: number | null
  hasSyncedActivity: boolean
  goalProgress: DashboardGoalProgress
  quickCharts: DashboardQuickCharts
  alerts: DashboardAlert[]
  macroProgress: DashboardMacroProgress[]
  meals: DashboardMealSummary[]
}
