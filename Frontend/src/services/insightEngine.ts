import type { RawAnalyticsData } from './analyticsService'
import type {
  NutritionReport,
  NutritionDaySummary,
  GoalAdherenceReport,
  WeightTrendReport,
  WaterReport,
  HabitAnalysis,
  ConsistencyScore,
  SubScore,
  Insight,
  WeeklySummary,
  DataConfidence,
} from '../types/reports'
import { getTrendDirection, rangeToDays } from '../utils/trendHelpers'
import { eachDateInRange } from '../utils/date'

// ─── Helpers ────────────────────────────────────────────────────────────────

function groupByDate<T>(items: T[], dateAccessor: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = dateAccessor(item).slice(0, 10)
    const list = map.get(key)
    if (list) {
      list.push(item)
    } else {
      map.set(key, [item])
    }
  }
  return map
}

function safeAverage(values: number[]): number {
  if (values.length === 0) return 0
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function getAllDatesInRange(start: string, end: string): string[] {
  return eachDateInRange(start, end)
}

// ─── Nutrition Report ───────────────────────────────────────────────────────

export function generateNutritionReport(data: RawAnalyticsData): NutritionReport {
  const grouped = groupByDate(data.mealLogs, (m) => m.mealDate)
  const allDates = getAllDatesInRange(data.dateRange.start, data.dateRange.end)

  const dailySummaries: NutritionDaySummary[] = allDates.map((date) => {
    const meals = grouped.get(date) ?? []
    return {
      date,
      calories: meals.reduce((s, m) => s + m.totalCalories, 0),
      protein: meals.reduce((s, m) => s + m.totalProtein, 0),
      carbs: meals.reduce((s, m) => s + m.totalCarbs, 0),
      fat: meals.reduce((s, m) => s + m.totalFat, 0),
      mealsLogged: meals.length,
    }
  })

  const trackedDays = dailySummaries.filter((d) => d.mealsLogged > 0)
  const calorieValues = trackedDays.map((d) => d.calories)
  const proteinValues = trackedDays.map((d) => d.protein)

  return {
    dailySummaries,
    averageCalories: safeAverage(calorieValues),
    averageProtein: safeAverage(proteinValues),
    averageCarbs: safeAverage(trackedDays.map((d) => d.carbs)),
    averageFat: safeAverage(trackedDays.map((d) => d.fat)),
    totalDaysTracked: trackedDays.length,
    calorieTrend: getTrendDirection(calorieValues),
    proteinTrend: getTrendDirection(proteinValues),
  }
}

// ─── Goal Adherence ─────────────────────────────────────────────────────────

export function generateGoalAdherence(data: RawAnalyticsData): GoalAdherenceReport {
  const targets = data.goalPlan?.dailyTargets
  const nutrition = generateNutritionReport(data)
  const trackedDays = nutrition.dailySummaries.filter((d) => d.mealsLogged > 0)

  if (!targets || trackedDays.length === 0) {
    return {
      calorieHitRate: 0,
      proteinHitRate: 0,
      carbHitRate: 0,
      fatHitRate: 0,
      currentStreak: 0,
      longestStreak: 0,
      bestDay: null,
      worstDay: null,
      goalType: data.goalPlan?.type ?? 'maintain-weight',
    }
  }

  const tolerance = 0.15
  const calorieTarget = targets.calories
  const proteinTarget = targets.proteinGrams
  const carbTarget = targets.carbGrams
  const fatTarget = targets.fatGrams

  const isWithin = (actual: number, target: number) =>
    target > 0 && Math.abs(actual - target) / target <= tolerance

  let calorieHits = 0
  let proteinHits = 0
  let carbHits = 0
  let fatHits = 0
  let bestDay: string | null = null
  let worstDay: string | null = null
  let bestScore = -Infinity
  let worstScore = Infinity

  for (const day of trackedDays) {
    if (isWithin(day.calories, calorieTarget)) calorieHits++
    if (isWithin(day.protein, proteinTarget)) proteinHits++
    if (isWithin(day.carbs, carbTarget)) carbHits++
    if (isWithin(day.fat, fatTarget)) fatHits++

    const deviation = Math.abs(day.calories - calorieTarget)
    if (deviation < worstScore) {
      worstScore = deviation
      bestDay = day.date
    }
    if (deviation > bestScore) {
      bestScore = deviation
      worstDay = day.date
    }
  }

  const total = trackedDays.length

  // Calculate streaks
  const allDates = nutrition.dailySummaries
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  let isCurrentStreakActive = true

  for (let i = allDates.length - 1; i >= 0; i--) {
    const day = allDates[i]
    if (day.mealsLogged > 0 && isWithin(day.calories, calorieTarget)) {
      tempStreak++
      if (isCurrentStreakActive) {
        currentStreak = tempStreak
      }
    } else {
      if (tempStreak > longestStreak) longestStreak = tempStreak
      tempStreak = 0
      isCurrentStreakActive = false
    }
  }
  if (tempStreak > longestStreak) longestStreak = tempStreak

  return {
    calorieHitRate: total > 0 ? Math.round((calorieHits / total) * 100) : 0,
    proteinHitRate: total > 0 ? Math.round((proteinHits / total) * 100) : 0,
    carbHitRate: total > 0 ? Math.round((carbHits / total) * 100) : 0,
    fatHitRate: total > 0 ? Math.round((fatHits / total) * 100) : 0,
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    bestDay,
    worstDay,
    goalType: data.goalPlan?.type ?? 'maintain-weight',
  }
}

// ─── Weight Trend ───────────────────────────────────────────────────────────

export function generateWeightTrend(data: RawAnalyticsData): WeightTrendReport {
  const profile = data.profile
  const dashboard = data.dashboard
  const goalPlan = data.goalPlan

  if (!profile || profile.weightKg <= 0) {
    return {
      currentWeight: null,
      startWeight: null,
      targetWeight: null,
      changeKg: 0,
      direction: 'stable',
      trendLabel: 'No weight data available',
      confidence: 'insufficient',
    }
  }

  const currentWeight = profile.weightKg
  const startWeight = goalPlan?.startWeightKg ?? currentWeight
  const targetWeight = goalPlan?.targetWeightKg ?? profile.targetWeightKg ?? null
  const changeKg = Math.round((currentWeight - startWeight) * 10) / 10

  const weightPoints = dashboard?.quickCharts.weightTrend
    .map((p) => p.value)
    .filter((v): v is number => v != null) ?? []

  const direction = weightPoints.length >= 2 ? getTrendDirection(weightPoints) : 'stable'

  // Soft language — no false precision
  let trendLabel: string
  if (data.confidence.weight === 'insufficient') {
    trendLabel = 'Insufficient weight data for trend analysis'
  } else if (Math.abs(changeKg) < 0.3) {
    trendLabel = 'Your weight has been relatively stable'
  } else if (changeKg < 0) {
    trendLabel = 'Your recent trend suggests gradual weight reduction'
  } else {
    trendLabel = 'Your recent trend shows gradual weight increase'
  }

  return {
    currentWeight,
    startWeight,
    targetWeight,
    changeKg,
    direction,
    trendLabel,
    confidence: data.confidence.weight,
  }
}

// ─── Water Report ───────────────────────────────────────────────────────────

export function generateWaterReport(data: RawAnalyticsData): WaterReport {
  const totalDays = rangeToDays(data.range)
  const allDates = getAllDatesInRange(data.dateRange.start, data.dateRange.end)
  const goalMl = data.profile?.waterGoalMl ?? data.goalPlan?.dailyTargets.waterMl ?? 2500

  const dailyTotals = allDates.map((date) => {
    const dayLogs = data.waterLogs.filter((e) => e.date === date)
    return {
      date,
      amountMl: dayLogs.reduce((s, e) => s + e.amountMl, 0),
    }
  })

  const trackedDays = dailyTotals.filter((d) => d.amountMl > 0)
  const averageMl = safeAverage(trackedDays.map((d) => d.amountMl))
  const daysHitGoal = trackedDays.filter((d) => d.amountMl >= goalMl).length
  const goalAchievementRate = totalDays > 0 ? Math.round((daysHitGoal / totalDays) * 100) : 0
  const trend = getTrendDirection(trackedDays.map((d) => d.amountMl))

  return {
    dailyTotals,
    averageMl,
    goalMl,
    goalAchievementRate,
    trend,
    confidence: data.confidence.water,
  }
}

// ─── Habit Analysis ─────────────────────────────────────────────────────────

export function generateHabitAnalysis(data: RawAnalyticsData): HabitAnalysis {
  const totalDays = rangeToDays(data.range)
  const grouped = groupByDate(data.mealLogs, (m) => m.mealDate)
  const trackedDays = grouped.size

  const mealsPerDay = trackedDays > 0
    ? Math.round((data.mealLogs.length / trackedDays) * 10) / 10
    : 0

  // Check breakfast skipping
  const allDates = getAllDatesInRange(data.dateRange.start, data.dateRange.end)
  let breakfastMissed = 0
  for (const date of allDates) {
    const meals = grouped.get(date) ?? []
    if (meals.length > 0 && !meals.some((m) => m.mealType === 'breakfast')) {
      breakfastMissed++
    }
  }
  const daysWithMeals = allDates.filter((d) => (grouped.get(d)?.length ?? 0) > 0).length
  const skippedBreakfastRate = daysWithMeals > 0 ? Math.round((breakfastMissed / daysWithMeals) * 100) : 0

  // Most logged meal type
  const mealTypeCounts = new Map<string, number>()
  for (const log of data.mealLogs) {
    mealTypeCounts.set(log.mealType, (mealTypeCounts.get(log.mealType) ?? 0) + 1)
  }
  let mostLoggedMealType = 'None'
  let maxCount = 0
  for (const [type, count] of mealTypeCounts) {
    if (count > maxCount) {
      maxCount = count
      mostLoggedMealType = type
    }
  }

  const loggingFrequencyPercent = totalDays > 0 ? Math.round((trackedDays / totalDays) * 100) : 0

  const dailyCounts = allDates.map((d) => grouped.get(d)?.length ?? 0)
  const loggingTrend = getTrendDirection(dailyCounts)

  return {
    mealsPerDay,
    skippedBreakfastRate,
    loggingFrequencyPercent,
    mostLoggedMealType,
    loggingTrend,
  }
}

// ─── Modular Scoring ────────────────────────────────────────────────────────

export function calculateLoggingScore(data: RawAnalyticsData): SubScore {
  const totalDays = rangeToDays(data.range)
  const grouped = groupByDate(data.mealLogs, (m) => m.mealDate)
  const trackedDays = grouped.size
  const ratio = totalDays > 0 ? trackedDays / totalDays : 0
  const score = clamp(Math.round(ratio * 100), 0, 100)

  return {
    score,
    confidence: data.confidence.meals,
    label: 'Logging',
  }
}

export function calculateCalorieScore(data: RawAnalyticsData): SubScore {
  const targets = data.goalPlan?.dailyTargets
  if (!targets || data.confidence.meals === 'insufficient') {
    return { score: 0, confidence: 'insufficient', label: 'Calories' }
  }

  const nutrition = generateNutritionReport(data)
  const trackedDays = nutrition.dailySummaries.filter((d) => d.mealsLogged > 0)
  if (trackedDays.length === 0) {
    return { score: 0, confidence: 'insufficient', label: 'Calories' }
  }

  const tolerance = 0.15
  const hits = trackedDays.filter(
    (d) => Math.abs(d.calories - targets.calories) / targets.calories <= tolerance,
  ).length

  const score = clamp(Math.round((hits / trackedDays.length) * 100), 0, 100)

  return {
    score,
    confidence: data.confidence.meals,
    label: 'Calories',
  }
}

export function calculateMacroScore(data: RawAnalyticsData): SubScore {
  const targets = data.goalPlan?.dailyTargets
  if (!targets || data.confidence.meals === 'insufficient') {
    return { score: 0, confidence: 'insufficient', label: 'Macros' }
  }

  const nutrition = generateNutritionReport(data)
  const trackedDays = nutrition.dailySummaries.filter((d) => d.mealsLogged > 0)
  if (trackedDays.length === 0) {
    return { score: 0, confidence: 'insufficient', label: 'Macros' }
  }

  const tolerance = 0.2
  let totalScore = 0
  for (const day of trackedDays) {
    let macroHits = 0
    if (targets.proteinGrams > 0 && Math.abs(day.protein - targets.proteinGrams) / targets.proteinGrams <= tolerance) macroHits++
    if (targets.carbGrams > 0 && Math.abs(day.carbs - targets.carbGrams) / targets.carbGrams <= tolerance) macroHits++
    if (targets.fatGrams > 0 && Math.abs(day.fat - targets.fatGrams) / targets.fatGrams <= tolerance) macroHits++
    totalScore += (macroHits / 3) * 100
  }

  return {
    score: clamp(Math.round(totalScore / trackedDays.length), 0, 100),
    confidence: data.confidence.meals,
    label: 'Macros',
  }
}

export function calculateHydrationScore(data: RawAnalyticsData): SubScore {
  if (data.confidence.water === 'insufficient') {
    return { score: 0, confidence: 'insufficient', label: 'Hydration' }
  }

  const water = generateWaterReport(data)
  return {
    score: clamp(water.goalAchievementRate, 0, 100),
    confidence: data.confidence.water,
    label: 'Hydration',
  }
}

/**
 * Aggregates individual sub-scores into a weighted composite.
 * Weights: logging 25%, calories 25%, macros 20%, hydration 15%, regularity 15%.
 * If overall confidence is insufficient, returns a guidance message instead.
 */
export function generateConsistencyScore(data: RawAnalyticsData): ConsistencyScore {
  const logging = calculateLoggingScore(data)
  const calories = calculateCalorieScore(data)
  const macros = calculateMacroScore(data)
  const hydration = calculateHydrationScore(data)

  const insufficientCount = [logging, calories, macros, hydration].filter(
    (s) => s.confidence === 'insufficient',
  ).length

  let overallConfidence: DataConfidence
  if (insufficientCount >= 3) {
    overallConfidence = 'insufficient'
  } else if (insufficientCount >= 1) {
    overallConfidence = 'limited'
  } else {
    overallConfidence = 'sufficient'
  }

  if (overallConfidence === 'insufficient') {
    return {
      overall: 0,
      confidence: 'insufficient',
      logging,
      calories,
      macros,
      hydration,
      message: 'Insufficient tracking data for accurate scoring. Log more meals and water to see your consistency score.',
    }
  }

  const overall = clamp(
    Math.round(
      logging.score * 0.25 +
      calories.score * 0.25 +
      macros.score * 0.20 +
      hydration.score * 0.15 +
      logging.score * 0.15, // regularity bonus from logging
    ),
    0,
    100,
  )

  let message: string
  if (overall >= 80) {
    message = 'Excellent consistency! Your tracking habits are strong.'
  } else if (overall >= 60) {
    message = 'Good progress. Staying consistent will help you reach your goals.'
  } else if (overall >= 40) {
    message = 'Room for improvement. Try to log meals and water more regularly.'
  } else {
    message = 'Getting started — every logged meal counts toward building consistency.'
  }

  return { overall, confidence: overallConfidence, logging, calories, macros, hydration, message }
}

// ─── Insight Generation ─────────────────────────────────────────────────────

/**
 * Generates rule-based insight cards from analyzed data.
 * Uses soft language — no false precision.
 */
export function generateInsights(data: RawAnalyticsData): Insight[] {
  const insights: Insight[] = []
  const nutrition = generateNutritionReport(data)
  const habits = generateHabitAnalysis(data)
  const water = generateWaterReport(data)
  const weight = generateWeightTrend(data)
  const targets = data.goalPlan?.dailyTargets

  // ── Nutrition insights ──

  if (nutrition.totalDaysTracked >= 3 && targets) {
    if (nutrition.averageCalories > targets.calories * 1.15) {
      insights.push({
        id: 'calorie-surplus',
        severity: 'warning',
        category: 'nutrition',
        title: 'Calorie intake above target',
        description: `Your average intake is around ${nutrition.averageCalories} kcal, which is above your ${targets.calories} kcal target. Consider reviewing portion sizes.`,
      })
    } else if (nutrition.averageCalories < targets.calories * 0.75) {
      insights.push({
        id: 'calorie-deficit-deep',
        severity: 'risk',
        category: 'nutrition',
        title: 'Calorie intake significantly below target',
        description: 'Your intake has been well below your daily target. Consistent under-eating can slow metabolism and reduce energy.',
      })
    } else if (nutrition.averageCalories >= targets.calories * 0.85 && nutrition.averageCalories <= targets.calories * 1.1) {
      insights.push({
        id: 'calorie-on-track',
        severity: 'positive',
        category: 'nutrition',
        title: 'Calorie intake is on track',
        description: 'Your average calorie intake aligns well with your daily target. Keep it up!',
      })
    }

    if (targets.proteinGrams > 0 && nutrition.averageProtein < targets.proteinGrams * 0.7) {
      insights.push({
        id: 'protein-low',
        severity: 'warning',
        category: 'nutrition',
        title: 'Protein intake could be higher',
        description: 'Your protein intake is trending below your target. Consider adding protein-rich foods like eggs, chicken, or legumes.',
      })
    }
  }

  // ── Hydration insights ──

  if (water.confidence !== 'insufficient') {
    if (water.goalAchievementRate >= 70) {
      insights.push({
        id: 'hydration-good',
        severity: 'positive',
        category: 'hydration',
        title: 'Great hydration habits',
        description: 'You\'re consistently meeting your water goals. Staying hydrated supports energy and recovery.',
      })
    } else if (water.goalAchievementRate < 30) {
      insights.push({
        id: 'hydration-low',
        severity: 'warning',
        category: 'hydration',
        title: 'Water intake needs attention',
        description: 'Your water intake has been below your goal most days. Try setting reminders to drink throughout the day.',
      })
    }
  }

  // ── Habits insights ──

  if (habits.loggingFrequencyPercent >= 80) {
    insights.push({
      id: 'logging-consistent',
      severity: 'positive',
      category: 'consistency',
      title: 'Consistent meal logging',
      description: 'You\'ve been logging meals regularly. Consistency is key to reaching your nutrition goals.',
    })
  } else if (habits.loggingFrequencyPercent < 40 && habits.loggingFrequencyPercent > 0) {
    insights.push({
      id: 'logging-inconsistent',
      severity: 'warning',
      category: 'consistency',
      title: 'Meal logging could be more regular',
      description: 'Tracking meals more consistently gives a clearer picture of your nutrition habits.',
    })
  }

  if (habits.skippedBreakfastRate > 60) {
    insights.push({
      id: 'breakfast-skipping',
      severity: 'neutral',
      category: 'habits',
      title: 'Breakfast is often skipped',
      description: 'You tend to skip breakfast. If intentional (e.g. intermittent fasting), that\'s fine. Otherwise, a light morning meal can help with energy.',
    })
  }

  // ── Weight insights ──

  if (weight.confidence !== 'insufficient') {
    if (weight.direction === 'down' && data.goalPlan?.type === 'lose-weight') {
      insights.push({
        id: 'weight-progress',
        severity: 'positive',
        category: 'weight',
        title: 'Weight trend looks promising',
        description: 'Your recent trend suggests gradual weight reduction, aligning with your goal.',
      })
    } else if (weight.direction === 'up' && data.goalPlan?.type === 'lose-weight') {
      insights.push({
        id: 'weight-attention',
        severity: 'warning',
        category: 'weight',
        title: 'Weight trend needs attention',
        description: 'Your weight appears to be trending upward. Consider reviewing your calorie targets or activity level.',
      })
    }
  }

  // ── Goal insights ──

  if (data.confidence.goals === 'insufficient') {
    insights.push({
      id: 'no-goal',
      severity: 'neutral',
      category: 'goals',
      title: 'No active goal plan',
      description: 'Setting up a goal plan helps track progress and provides personalized targets.',
    })
  }

  return insights
}

// ─── Weekly Summary ─────────────────────────────────────────────────────────

export function generateWeeklySummary(data: RawAnalyticsData): WeeklySummary {
  const nutrition = generateNutritionReport(data)
  const trackedDays = nutrition.dailySummaries.filter((d) => d.mealsLogged > 0)
  const totalCalories = trackedDays.reduce((s, d) => s + d.calories, 0)
  const totalMeals = data.mealLogs.length
  const targets = data.goalPlan?.dailyTargets

  let calorieBalance: string
  if (!targets || trackedDays.length === 0) {
    calorieBalance = 'No target set'
  } else {
    const avgDiff = nutrition.averageCalories - targets.calories
    if (Math.abs(avgDiff) < 50) {
      calorieBalance = 'On target'
    } else if (avgDiff > 0) {
      calorieBalance = `~${Math.round(avgDiff)} kcal over target`
    } else {
      calorieBalance = `~${Math.round(Math.abs(avgDiff))} kcal under target`
    }
  }

  const insights = generateInsights(data)
  const topInsight = insights.length > 0 ? insights[0].title : 'Start tracking to see insights'

  return {
    totalCalories,
    averageCalories: nutrition.averageCalories,
    totalMeals,
    daysTracked: nutrition.totalDaysTracked,
    calorieBalance,
    topInsight,
  }
}
