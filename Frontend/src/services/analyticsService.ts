import { sessionService } from './sessionService'
import { mealLogService } from './mealLogService'
import { waterLogService } from './waterLogService'
import { dashboardService } from './dashboardService'
import { goalManagementService } from './goalManagementService'
import { profileService } from './profileService'
import type { MealLog } from '../types/mealLog'
import type { Profile } from '../types/profile'
import type { GoalPlan } from '../types/goal'
import type { DashboardSummary } from '../types/health'
import type { ReportRange, DataConfidence } from '../types/reports'
import type { WaterLogEntry } from './waterLogService'
import { rangeToDays } from '../utils/trendHelpers'
import { eachDateInRange, toLocalDateInputValue } from '../utils/date'

export interface RawAnalyticsData {
  mealLogs: MealLog[]
  waterLogs: WaterLogEntry[]
  dashboard: DashboardSummary | null
  goalPlan: GoalPlan | null
  profile: Profile | null
  range: ReportRange
  dateRange: { start: string; end: string }
  confidence: {
    meals: DataConfidence
    water: DataConfidence
    weight: DataConfidence
    goals: DataConfidence
  }
}

function getDateRange(range: ReportRange): { start: string; end: string } {
  const days = rangeToDays(range)
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days + 1)

  return {
    start: toLocalDateInputValue(start),
    end: toLocalDateInputValue(end),
  }
}

function filterMealLogsByRange(logs: MealLog[], startDate: string, endDate: string): MealLog[] {
  return logs.filter((log) => {
    const date = log.mealDate.slice(0, 10)
    return date >= startDate && date <= endDate
  })
}

function getWaterLogsForRange(
  userId: number,
  profileId: number,
  startDate: string,
  endDate: string,
): WaterLogEntry[] {
  const entries: WaterLogEntry[] = []
  for (const dateStr of eachDateInRange(startDate, endDate)) {
    const dayEntries = waterLogService.getEntriesForDate(userId, profileId, dateStr)
    entries.push(...dayEntries)
  }

  return entries
}

function assessMealConfidence(logs: MealLog[], totalDays: number): DataConfidence {
  if (logs.length === 0) {
    return 'insufficient'
  }

  const uniqueDays = new Set(logs.map((l) => l.mealDate.slice(0, 10))).size
  const ratio = uniqueDays / totalDays

  if (ratio >= 0.5) {
    return 'sufficient'
  }

  return ratio >= 0.2 ? 'limited' : 'insufficient'
}

function assessWaterConfidence(logs: WaterLogEntry[], totalDays: number): DataConfidence {
  if (logs.length === 0) {
    return 'insufficient'
  }

  const uniqueDays = new Set(logs.map((l) => l.date)).size
  const ratio = uniqueDays / totalDays

  if (ratio >= 0.5) {
    return 'sufficient'
  }

  return ratio >= 0.2 ? 'limited' : 'insufficient'
}

function assessWeightConfidence(dashboard: DashboardSummary | null): DataConfidence {
  if (!dashboard || dashboard.weightKg == null) {
    return 'insufficient'
  }

  return dashboard.quickCharts.hasWeightHistory ? 'sufficient' : 'limited'
}

function assessGoalConfidence(goalPlan: GoalPlan | null): DataConfidence {
  if (!goalPlan) {
    return 'insufficient'
  }

  return goalPlan.status === 'active' ? 'sufficient' : 'limited'
}

/**
 * Collects raw data from all existing services and normalizes it for analytics.
 * Zero analysis logic — pure data fetching and confidence assessment.
 */
export async function collectRawData(
  userId: number,
  profileId: number,
  range: ReportRange,
): Promise<RawAnalyticsData> {
  const dateRange = getDateRange(range)
  const totalDays = rangeToDays(range)

  let dashboard: DashboardSummary | null = null
  try {
    dashboard = await dashboardService.getTodaySummary()
  } catch {
    dashboard = null
  }

  let profile: Profile | null = null
  try {
    const profileResponse = await profileService.getMyProfiles()
    const profiles = profileResponse.data?.data
    if (Array.isArray(profiles)) {
      profile = profiles.find((p: Profile) => p.id === profileId) ?? profiles[0] ?? null
    }
  } catch {
    profile = null
  }

  let allMealLogs: MealLog[] = []
  try {
    const mealResponse = await mealLogService.getMealLogsByProfileId(profileId)
    allMealLogs = mealResponse.data?.data ?? []
  } catch {
    allMealLogs = []
  }

  const mealLogs = filterMealLogsByRange(allMealLogs, dateRange.start, dateRange.end)
  const waterLogs = getWaterLogsForRange(userId, profileId, dateRange.start, dateRange.end)
  const goalPlan = goalManagementService.getPlan(userId, profileId)

  return {
    mealLogs,
    waterLogs,
    dashboard,
    goalPlan,
    profile,
    range,
    dateRange,
    confidence: {
      meals: assessMealConfidence(mealLogs, totalDays),
      water: assessWaterConfidence(waterLogs, totalDays),
      weight: assessWeightConfidence(dashboard),
      goals: assessGoalConfidence(goalPlan),
    },
  }
}

/**
 * Returns the current userId and profileId from session, or null.
 */
export function getSessionIds(): { userId: number; profileId: number } | null {
  const user = sessionService.getUser()
  if (!user) {
    return null
  }

  const profileId = sessionService.getActiveProfileId()
  if (!profileId) {
    return null
  }

  return { userId: user.id, profileId }
}
