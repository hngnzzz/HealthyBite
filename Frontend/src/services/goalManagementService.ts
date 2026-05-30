import type { Profile } from '../types/profile'
import type {
  GoalDailyTargets,
  GoalDietPlanKey,
  GoalHistoryEntry,
  GoalMacroSplit,
  GoalManagementType,
  GoalPlan,
  GoalProgressSnapshot,
  GoalSafetyAlert,
  GoalStrictness,
} from '../types/goal'
import { toLocalDateInputValue } from '../utils/date'

const STORAGE_PREFIX = 'goalManagementPlan'

export interface GoalPlanInput {
  type: GoalManagementType
  dietPlanKey: GoalDietPlanKey
  customMacroSplit: GoalMacroSplit | null
  startDate: string
  targetWeightKg: number
  targetDate: string
  plannedRateKgPerWeek: number
  strictness: GoalStrictness
}

interface BuildPlanOptions {
  recordHistory?: boolean
}

function getStorageKey(userId: number, profileId: number) {
  return `${STORAGE_PREFIX}:${userId}:${profileId}`
}

function parseDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function getActivityFactor(activityLevel: string) {
  switch (activityLevel.trim().toLowerCase()) {
    case 'sedentary':
      return 1.2
    case 'light':
    case 'lightly active':
      return 1.375
    case 'active':
    case 'very active':
      return 1.725
    case 'very_active':
    case 'extra active':
      return 1.9
    default:
      return 1.55
  }
}

function isWeightChangeGoal(type: GoalManagementType) {
  return type === 'lose-weight' || type === 'gain-weight' || type === 'body-recomposition'
}

function getDailyCalorieDeltaFromWeeklyRate(rateKgPerWeek: number) {
  return Math.round((Math.max(0, rateKgPerWeek) * 7700) / 7)
}

function hasPlanConfigChanged(current: GoalPlan, input: GoalPlanInput) {
  return current.type !== input.type
    || current.dietPlanKey !== input.dietPlanKey
    || current.customMacroSplit?.proteinPercent !== input.customMacroSplit?.proteinPercent
    || current.customMacroSplit?.carbPercent !== input.customMacroSplit?.carbPercent
    || current.customMacroSplit?.fatPercent !== input.customMacroSplit?.fatPercent
    || current.startDate !== input.startDate
    || current.targetWeightKg !== input.targetWeightKg
    || current.targetDate !== input.targetDate
    || current.plannedRateKgPerWeek !== input.plannedRateKgPerWeek
    || current.strictness !== input.strictness
}

function getDietPlanLabel(dietPlanKey: GoalDietPlanKey) {
  switch (dietPlanKey) {
    case 'balanced':
      return 'Balanced'
    case 'mediterranean':
      return 'Mediterranean'
    case 'keto':
      return 'Keto'
    case 'high-protein':
      return 'High-protein'
    case 'clean-bulk':
      return 'Clean bulk'
    case 'high-protein-maintenance':
      return 'High Protein Maintenance Diet'
    case 'body-recomposition':
      return 'Body Recomposition Diet'
    case 'macro-tracking':
      return 'Macro Tracking Diet'
    case 'flexible-dieting':
      return 'Flexible Dieting'
    case 'mediterranean-high-protein':
      return 'Mediterranean High Protein'
    case 'low-carb-high-protein':
      return 'Low Carb High Protein'
    case 'custom':
      return 'Custom'
    default:
      return 'Balanced'
  }
}

function getGoalAdjustment(type: GoalManagementType) {
  switch (type) {
    default:
      return 0
  }
}

function calculateBmr(profile: Profile) {
  if (profile.age <= 0 || profile.heightCm <= 0 || profile.weightKg <= 0) {
    return 0
  }

  return profile.gender.trim().toLowerCase() === 'female'
    ? 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age - 161
    : 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + 5
}

function getMacroSplit(input: GoalPlanInput): GoalMacroSplit {
  switch (input.dietPlanKey) {
    case 'balanced':
      return { proteinPercent: 25, carbPercent: 45, fatPercent: 30 }
    case 'mediterranean':
      return { proteinPercent: 25, carbPercent: 40, fatPercent: 35 }
    case 'keto':
      return { proteinPercent: 25, carbPercent: 10, fatPercent: 65 }
    case 'high-protein':
      return { proteinPercent: 35, carbPercent: 30, fatPercent: 35 }
    case 'clean-bulk':
      return { proteinPercent: 25, carbPercent: 50, fatPercent: 25 }
    case 'high-protein-maintenance':
      return { proteinPercent: 35, carbPercent: 35, fatPercent: 30 }
    case 'body-recomposition':
      return { proteinPercent: 35, carbPercent: 30, fatPercent: 35 }
    case 'macro-tracking':
      return { proteinPercent: 30, carbPercent: 40, fatPercent: 30 }
    case 'flexible-dieting':
      return { proteinPercent: 30, carbPercent: 40, fatPercent: 30 }
    case 'mediterranean-high-protein':
      return { proteinPercent: 30, carbPercent: 35, fatPercent: 35 }
    case 'low-carb-high-protein':
      return { proteinPercent: 35, carbPercent: 20, fatPercent: 45 }
    case 'custom':
      return input.customMacroSplit ?? { proteinPercent: 30, carbPercent: 40, fatPercent: 30 }
    default:
      return { proteinPercent: 25, carbPercent: 45, fatPercent: 30 }
  }
}

function calculateDailyTargets(profile: Profile, input: GoalPlanInput): GoalDailyTargets {
  const bmr = calculateBmr(profile)
  const tdee = Math.round(bmr * getActivityFactor(profile.activityLevel))
  const strictnessMultiplier = input.strictness === 'Flexible' ? 0.9 : input.strictness === 'Strict' ? 1.1 : 1
  const weightRateDelta = getDailyCalorieDeltaFromWeeklyRate(input.plannedRateKgPerWeek)
  const weightGoalAdjustment =
    input.type === 'lose-weight'
      ? -Math.round(weightRateDelta * strictnessMultiplier)
      : input.type === 'gain-weight'
        ? Math.round(weightRateDelta * strictnessMultiplier)
        : input.type === 'body-recomposition'
          ? -Math.round(weightRateDelta * 0.4 * strictnessMultiplier)
          : 0
  const calories = Math.max(900, Math.round(tdee + weightGoalAdjustment + getGoalAdjustment(input.type)))
  const macroSplit = getMacroSplit(input)
  const proteinRatio = macroSplit.proteinPercent / 100
  const carbRatio = macroSplit.carbPercent / 100
  const fatRatio = macroSplit.fatPercent / 100

  return {
    calories,
    proteinGrams: Math.round((calories * proteinRatio) / 4),
    carbGrams: Math.round((calories * carbRatio) / 4),
    fatGrams: Math.round((calories * fatRatio) / 9),
    waterMl: Math.max(1800, Math.round(profile.weightKg * 35)),
    mealsPerDay: input.strictness === 'Strict' ? 4 : input.type === 'body-recomposition' ? 4 : 3,
    dietPlanKey: input.dietPlanKey,
    dietPlanLabel: getDietPlanLabel(input.dietPlanKey),
    macroSplit,
    stepsTarget:
      input.type === 'lose-weight'
        ? 10000
        : input.type === 'maintain-weight' || input.type === 'body-recomposition'
          ? 8000
          : null,
  }
}

function calculateProgress(profile: Profile, input: GoalPlanInput, startDate: string, startWeightKg: number): GoalProgressSnapshot {
  const today = new Date()
  const startedAt = parseDate(startDate) ?? today
  const targetDate = parseDate(input.targetDate) ?? today
  const elapsedDays = Math.max(0, Math.floor((today.getTime() - startedAt.getTime()) / 86400000))
  const remainingDays = Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / 86400000))

  if (input.type === 'maintain-weight') {
    const driftKg = Math.abs(profile.weightKg - startWeightKg)
    const completionPercent = Math.max(0, Math.min(100, Math.round(Math.max(0, 100 - driftKg * 40))))

    return {
      startDate,
      startWeightKg,
      currentWeightKg: profile.weightKg,
      targetWeightKg: startWeightKg,
      elapsedDays,
      actualProgressKg: Number(driftKg.toFixed(1)),
      plannedProgressKg: 0,
      varianceKg: Number(driftKg.toFixed(1)),
      completionPercent,
      onTrackLikelihood: driftKg <= 1 ? 'Stable' : driftKg <= 2 ? 'Slight drift' : 'Needs adjustment',
    }
  }

  const elapsedWeeks = elapsedDays / 7
  const actualProgressKg = Math.abs(profile.weightKg - startWeightKg)
  const plannedProgressKg = Math.max(0, Number((input.plannedRateKgPerWeek * elapsedWeeks).toFixed(1)))
  const varianceKg = Number((actualProgressKg - plannedProgressKg).toFixed(1))
  const totalNeededKg = Math.max(0.1, Math.abs(startWeightKg - input.targetWeightKg))
  const completionPercent = Math.max(0, Math.min(100, Math.round((actualProgressKg / totalNeededKg) * 100)))
  const remainingKg = Math.abs(profile.weightKg - input.targetWeightKg)
  const requiredWeeklyRate = remainingDays > 0 ? (remainingKg / remainingDays) * 7 : remainingKg

  let onTrackLikelihood = 'On track'
  if (remainingDays === 0 && remainingKg > 0.5) {
    onTrackLikelihood = 'Deadline at risk'
  } else if (requiredWeeklyRate > input.plannedRateKgPerWeek * 1.15) {
    onTrackLikelihood = 'Needs adjustment'
  } else if (requiredWeeklyRate < input.plannedRateKgPerWeek * 0.75) {
    onTrackLikelihood = 'Ahead of schedule'
  }

  return {
    startDate,
    startWeightKg,
    currentWeightKg: profile.weightKg,
    targetWeightKg: input.targetWeightKg,
    elapsedDays,
    actualProgressKg: Number(actualProgressKg.toFixed(1)),
    plannedProgressKg,
    varianceKg,
    completionPercent,
    onTrackLikelihood,
  }
}

function buildSafetyAlerts(profile: Profile, input: GoalPlanInput, dailyTargets: GoalDailyTargets) {
  const alerts: GoalSafetyAlert[] = []
  const bmi = profile.heightCm > 0 ? profile.weightKg / ((profile.heightCm / 100) ** 2) : 0
  const tdee = Math.round(calculateBmr(profile) * getActivityFactor(profile.activityLevel))
  const calorieDeficit = Math.max(0, tdee - dailyTargets.calories)

  if (input.type === 'lose-weight' && input.plannedRateKgPerWeek > 1) {
    alerts.push({
      level: 'danger',
      title: 'Weight loss target is too fast',
      message: 'A planned loss above 1.0 kg/week is usually too aggressive.',
    })
  }

  if ((input.type === 'lose-weight' || input.type === 'body-recomposition') && calorieDeficit > 1000) {
    alerts.push({
      level: 'danger',
      title: 'Calorie deficit is too deep',
      message: `This plan cuts about ${Math.round(calorieDeficit)} kcal/day, which is deeper than the recommended 1000 kcal/day ceiling.`,
    })
  }

  if ((input.type === 'lose-weight' || input.type === 'body-recomposition') && dailyTargets.calories < 1000) {
    alerts.push({
      level: 'danger',
      title: 'Daily calories dropped below 1000',
      message: 'This target is too low for a cutting phase and should be reduced more gradually.',
    })
  }

  if (dailyTargets.calories < 1200 || (profile.gender.toLowerCase() === 'male' && dailyTargets.calories < 1500)) {
    alerts.push({
      level: 'warning',
      title: 'Daily calories may be too low',
      message: `The calculated target of ${dailyTargets.calories} kcal/day may be too restrictive.`,
    })
  }

  if ((bmi < 18.5 && input.type === 'lose-weight') || (bmi > 30 && input.type === 'gain-weight')) {
    alerts.push({
      level: 'warning',
      title: 'Goal may not match current body status',
      message: 'This goal may not be suitable for the current BMI and should be reviewed.',
    })
  }

  if (isWeightChangeGoal(input.type) && Math.abs(profile.weightKg - input.targetWeightKg) > profile.weightKg * 0.3) {
    alerts.push({
      level: 'info',
      title: 'Large body-weight change requested',
      message: 'The target is far from the current weight. Consider a phased plan.',
    })
  }

  return alerts
}

function buildHistoryEntry(plan: GoalPlan): GoalHistoryEntry {
  return {
    id: `${plan.id}-${Date.now()}`,
    changedAt: new Date().toISOString(),
    type: plan.type,
    targetWeightKg: plan.targetWeightKg,
    targetDate: plan.targetDate,
    plannedRateKgPerWeek: plan.plannedRateKgPerWeek,
    strictness: plan.strictness,
  }
}

export const goalManagementService = {
  getPlan(userId: number, profileId: number) {
    const raw = localStorage.getItem(getStorageKey(userId, profileId))
    if (!raw) {
      return null
    }

    try {
      return JSON.parse(raw) as GoalPlan
    } catch {
      return null
    }
  },

  buildPlan(profile: Profile, input: GoalPlanInput, current?: GoalPlan | null, options?: BuildPlanOptions) {
    const startDate = input.startDate || current?.startDate || toLocalDateInputValue(new Date())
    const startWeightKg = current?.startWeightKg ?? profile.weightKg
    const dailyTargets = calculateDailyTargets(profile, input)
    const progress = calculateProgress(profile, input, startDate, startWeightKg)
    const safetyAlerts = buildSafetyAlerts(profile, input, dailyTargets)
    const shouldRecordHistory = Boolean(options?.recordHistory && current && hasPlanConfigChanged(current, input))
    const history = shouldRecordHistory ? [buildHistoryEntry(current!), ...current!.history].slice(0, 12) : (current?.history ?? [])
    const status =
      current?.status === 'cancelled'
        ? 'cancelled'
        : progress.completionPercent >= 100
          ? 'completed'
          : 'active'

    const plan: GoalPlan = {
      id: current?.id ?? `goal-${Date.now()}`,
      type: input.type,
      dietPlanKey: input.dietPlanKey,
      customMacroSplit: input.dietPlanKey === 'custom' ? input.customMacroSplit : null,
      targetWeightKg: input.targetWeightKg,
      targetDate: input.targetDate,
      plannedRateKgPerWeek: input.plannedRateKgPerWeek,
      strictness: input.strictness,
      startDate,
      status,
      startWeightKg,
      dailyTargets,
      progress,
      safetyAlerts,
      history,
    }

    return plan
  },

  savePlan(userId: number, profile: Profile, input: GoalPlanInput) {
    const profileId = profile.id
    const current = this.getPlan(userId, profileId)
    const plan = this.buildPlan(profile, input, current, { recordHistory: true })

    localStorage.setItem(getStorageKey(userId, profileId), JSON.stringify(plan))
    return plan
  },

  refreshPlan(userId: number, profile: Profile) {
    const current = this.getPlan(userId, profile.id)
    if (!current) {
      return null
    }

    const refreshed = this.buildPlan(profile, {
      type: current.type,
      dietPlanKey: current.dietPlanKey,
      customMacroSplit: current.customMacroSplit,
      startDate: current.startDate,
      targetWeightKg: current.targetWeightKg,
      targetDate: current.targetDate,
      plannedRateKgPerWeek: current.plannedRateKgPerWeek,
      strictness: current.strictness,
    }, current, { recordHistory: false })

    localStorage.setItem(getStorageKey(userId, profile.id), JSON.stringify(refreshed))
    return refreshed
  },
}
