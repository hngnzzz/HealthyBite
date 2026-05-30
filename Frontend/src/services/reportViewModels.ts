import type { RawAnalyticsData } from './analyticsService'
import type {
  ReportRange,
  NutritionReport,
  GoalAdherenceReport,
  WeightTrendReport,
  WaterReport,
  HabitAnalysis,
  ConsistencyScore,
  Insight,
  WeeklySummary,
  InsightSeverity,
  TrendDirection,
} from '../types/reports'
import {
  generateNutritionReport,
  generateGoalAdherence,
  generateWeightTrend,
  generateWaterReport,
  generateHabitAnalysis,
  generateConsistencyScore,
  generateInsights,
  generateWeeklySummary,
} from './insightEngine'
import { getTrendLabel, rangeToLabel } from '../utils/trendHelpers'

// ─── View Model Interfaces ─────────────────────────────────────────────────

export interface ChartBarItem {
  label: string
  value: number
  maxValue: number
  displayValue: string
  widthPercent: number
  accent: string
}

export interface StatCardVM {
  label: string
  value: string
  note: string
  accent: string
}

export interface InsightCardVM {
  id: string
  severity: InsightSeverity
  title: string
  description: string
  icon: string
}

export interface TrendBadgeVM {
  direction: TrendDirection
  label: string
  icon: string
}

export interface OverviewVM {
  summary: WeeklySummary
  consistency: ConsistencyScore
  topInsights: InsightCardVM[]
  statCards: StatCardVM[]
  rangeLabel: string
}

export interface NutritionVM {
  calorieChart: ChartBarItem[]
  macroAverages: Array<{ label: string; value: string; accent: string }>
  calorieTrend: TrendBadgeVM
  averageCaloriesDisplay: string
  surplusDeficitLabel: string
}

export interface ProgressVM {
  weightTrend: WeightTrendReport
  goalAdherence: GoalAdherenceReport
  weightTrendBadge: TrendBadgeVM
  streakDisplay: string
  adherenceCards: StatCardVM[]
}

export interface InsightsVM {
  cards: InsightCardVM[]
  habits: HabitAnalysis
  waterSummary: WaterReport
  habitCards: StatCardVM[]
}

export interface ReportsViewModel {
  overview: OverviewVM
  nutrition: NutritionVM
  progress: ProgressVM
  insights: InsightsVM
  range: ReportRange
  rangeLabel: string
  isDataEmpty: boolean
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function severityIcon(severity: InsightSeverity): string {
  switch (severity) {
    case 'positive': return '✓'
    case 'neutral': return 'ℹ'
    case 'warning': return '⚠'
    case 'risk': return '!'
  }
}

function trendIcon(direction: TrendDirection): string {
  switch (direction) {
    case 'up': return '↑'
    case 'down': return '↓'
    case 'stable': return '→'
  }
}

function toInsightCardVM(insight: Insight): InsightCardVM {
  return {
    id: insight.id,
    severity: insight.severity,
    title: insight.title,
    description: insight.description,
    icon: severityIcon(insight.severity),
  }
}

function toTrendBadgeVM(direction: TrendDirection): TrendBadgeVM {
  return {
    direction,
    label: getTrendLabel(direction),
    icon: trendIcon(direction),
  }
}

function formatMealType(type: string): string {
  if (type.startsWith('custom:')) return type.slice(7)
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')
}

function humanizeGoalType(type: string): string {
  switch (type) {
    case 'lose-weight': return 'Lose Weight'
    case 'gain-weight': return 'Gain Weight'
    case 'maintain-weight': return 'Maintain'
    case 'body-recomposition': return 'Recomp'
    default:
      return type ? type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ') : '--'
  }
}

// ─── View Model Builder ────────────────────────────────────────────────────

/**
 * Transforms raw analytics data into a display-ready view model.
 * This is the ONLY bridge between the analytics engine and the UI.
 * Components receive this and render — zero calculations in JSX.
 */
export function buildReportsViewModel(rawData: RawAnalyticsData): ReportsViewModel {
  const nutrition = generateNutritionReport(rawData)
  const goalAdherence = generateGoalAdherence(rawData)
  const weightTrend = generateWeightTrend(rawData)
  const water = generateWaterReport(rawData)
  const habits = generateHabitAnalysis(rawData)
  const consistency = generateConsistencyScore(rawData)
  const insights = generateInsights(rawData)
  const summary = generateWeeklySummary(rawData)
  const rLabel = rangeToLabel(rawData.range)

  const hasMeals = rawData.mealLogs.length > 0
  const hasWater = rawData.waterLogs.length > 0
  const hasWeight = rawData.dashboard?.quickCharts.weightTrend.some((p) => p.value != null) || (rawData.profile?.weightKg ?? 0) > 0
  const hasGoals = rawData.goalPlan != null
  const isDataEmpty = !hasMeals && !hasWater && !hasWeight && !hasGoals

  // ── Overview VM ──
  const overviewVM: OverviewVM = {
    summary,
    consistency,
    topInsights: insights.slice(0, 3).map(toInsightCardVM),
    statCards: buildOverviewStats(nutrition, summary, water),
    rangeLabel: rLabel,
  }

  // ── Nutrition VM ──
  const targets = rawData.goalPlan?.dailyTargets
  const calorieChartData = nutrition.dailySummaries.slice(-14)
  const maxCalorie = Math.max(...calorieChartData.map((d) => d.calories), targets?.calories ?? 0, 1)

  const nutritionVM: NutritionVM = {
    calorieChart: calorieChartData.map((d) => {
      const dayLabel = new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
      return {
        label: dayLabel,
        value: d.calories,
        maxValue: maxCalorie,
        displayValue: d.mealsLogged > 0 ? `${d.calories} kcal` : 'No data',
        widthPercent: maxCalorie > 0 ? Math.max(4, Math.round((d.calories / maxCalorie) * 100)) : 4,
        accent: d.mealsLogged === 0
          ? 'empty'
          : targets && d.calories > targets.calories * 1.15
            ? 'over'
            : targets && d.calories < targets.calories * 0.75
              ? 'under'
              : 'normal',
      }
    }),
    macroAverages: [
      { label: 'Protein', value: `${nutrition.averageProtein}g`, accent: 'blue' },
      { label: 'Carbs', value: `${nutrition.averageCarbs}g`, accent: 'amber' },
      { label: 'Fat', value: `${nutrition.averageFat}g`, accent: 'rose' },
    ],
    calorieTrend: toTrendBadgeVM(nutrition.calorieTrend),
    averageCaloriesDisplay: `${nutrition.averageCalories} kcal/day`,
    surplusDeficitLabel: summary.calorieBalance,
  }

  // ── Progress VM ──
  const progressVM: ProgressVM = {
    weightTrend,
    goalAdherence,
    weightTrendBadge: toTrendBadgeVM(weightTrend.direction),
    streakDisplay: goalAdherence.currentStreak > 0
      ? `${goalAdherence.currentStreak} day${goalAdherence.currentStreak === 1 ? '' : 's'} streak`
      : 'No active streak',
    adherenceCards: [
      { label: 'Calorie Adherence', value: `${goalAdherence.calorieHitRate}%`, note: 'Days within target', accent: 'orange' },
      { label: 'Protein Adherence', value: `${goalAdherence.proteinHitRate}%`, note: 'Days within target', accent: 'blue' },
      { label: 'Current Streak', value: `${goalAdherence.currentStreak}`, note: `Best: ${goalAdherence.longestStreak} days`, accent: 'green' },
      { label: 'Goal Type', value: humanizeGoalType(goalAdherence.goalType), note: 'Active plan', accent: 'pink' },
    ],
  }

  // ── Insights VM ──
  const insightsVM: InsightsVM = {
    cards: insights.map(toInsightCardVM),
    habits,
    waterSummary: water,
    habitCards: [
      { label: 'Meals per Day', value: `${habits.mealsPerDay}`, note: formatMealType(habits.mostLoggedMealType) + ' most logged', accent: 'orange' },
      { label: 'Logging Rate', value: `${habits.loggingFrequencyPercent}%`, note: 'Days with meals logged', accent: 'blue' },
      { label: 'Breakfast Skipped', value: `${habits.skippedBreakfastRate}%`, note: 'Of tracked days', accent: 'amber' },
      { label: 'Water Goal Hit', value: `${water.goalAchievementRate}%`, note: `Avg ${Math.round(water.averageMl)} ml/day`, accent: 'cyan' },
    ],
  }

  return {
    overview: overviewVM,
    nutrition: nutritionVM,
    progress: progressVM,
    insights: insightsVM,
    range: rawData.range,
    rangeLabel: rLabel,
    isDataEmpty,
  }
}

// ─── Private Helpers ────────────────────────────────────────────────────────

function buildOverviewStats(
  nutrition: NutritionReport,
  summary: WeeklySummary,
  water: WaterReport,
): StatCardVM[] {
  return [
    {
      label: 'Avg Calories',
      value: nutrition.averageCalories > 0 ? `${nutrition.averageCalories}` : '--',
      note: 'kcal per day',
      accent: 'orange',
    },
    {
      label: 'Days Tracked',
      value: `${nutrition.totalDaysTracked}`,
      note: `of ${summary.daysTracked > 0 ? summary.daysTracked : nutrition.totalDaysTracked} days`,
      accent: 'blue',
    },
    {
      label: 'Avg Protein',
      value: nutrition.averageProtein > 0 ? `${nutrition.averageProtein}g` : '--',
      note: 'per day',
      accent: 'green',
    },
    {
      label: 'Hydration',
      value: water.averageMl > 0 ? `${Math.round(water.averageMl)}` : '--',
      note: 'ml per day avg',
      accent: 'cyan',
    },
  ]
}
