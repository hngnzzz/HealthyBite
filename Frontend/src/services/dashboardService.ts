import { sessionService } from './sessionService'
import { waterLogService } from './waterLogService'
import type { ApiResponse } from '../types/api'
import type { DashboardSummary } from '../types/health'
import axiosClient from '../utils/axiosClient'
import { toLocalDateInputValue } from '../utils/date'

function normalizeDashboardSummary(summary: Partial<DashboardSummary>): DashboardSummary {
  return {
    greetingName: summary.greetingName ?? '',
    summaryDateLabel: summary.summaryDateLabel ?? '',
    caloriesConsumed: summary.caloriesConsumed ?? 0,
    caloriesTarget: summary.caloriesTarget ?? 0,
    caloriesRemaining: summary.caloriesRemaining ?? 0,
    caloriesBalance: summary.caloriesBalance ?? Math.abs((summary.caloriesTarget ?? 0) - (summary.caloriesConsumed ?? 0)),
    isOverCalories: summary.isOverCalories ?? (summary.caloriesConsumed ?? 0) > (summary.caloriesTarget ?? 0),
    bmiValue: summary.bmiValue ?? null,
    bmiLabel: summary.bmiLabel ?? 'No data',
    weightKg: summary.weightKg ?? null,
    heightCm: summary.heightCm ?? null,
    goalLabel: summary.goalLabel ?? 'Maintain',
    waterConsumedMl: summary.waterConsumedMl ?? 0,
    waterGoalMl: summary.waterGoalMl ?? 0,
    mealsLoggedCount: summary.mealsLoggedCount ?? summary.meals?.length ?? 0,
    exerciseMinutes: summary.exerciseMinutes ?? null,
    hasSyncedActivity: summary.hasSyncedActivity ?? false,
    goalProgress: {
      goalLabel: summary.goalProgress?.goalLabel ?? summary.goalLabel ?? 'Maintain',
      currentWeightKg: summary.goalProgress?.currentWeightKg ?? summary.weightKg ?? 0,
      targetWeightKg: summary.goalProgress?.targetWeightKg ?? null,
      remainingKg: summary.goalProgress?.remainingKg ?? 0,
      daysOnPlan: summary.goalProgress?.daysOnPlan ?? 0,
      completionPercent: summary.goalProgress?.completionPercent ?? 0,
    },
    quickCharts: {
      weightTrend: summary.quickCharts?.weightTrend ?? [],
      calories7Days: summary.quickCharts?.calories7Days ?? [],
      calorieAdherencePercent: summary.quickCharts?.calorieAdherencePercent ?? 0,
      proteinTargetPercent: summary.quickCharts?.proteinTargetPercent ?? 0,
      hasWeightHistory: summary.quickCharts?.hasWeightHistory ?? false,
    },
    alerts: summary.alerts ?? [],
    macroProgress: summary.macroProgress ?? [],
    meals: summary.meals ?? [],
  }
}

export const dashboardService = {
  async getTodaySummary(dateValue?: string) {
    const user = sessionService.getUser()

    if (!user) {
      throw new Error('You are not signed in.')
    }

    const activeProfileId = sessionService.getActiveProfileId()
    const date = dateValue ?? toLocalDateInputValue(new Date())
    const response = await axiosClient.get<ApiResponse<DashboardSummary>>('/dashboard/today', {
      params: {
        profileId: activeProfileId ?? undefined,
        date,
      },
    })
    const normalized = normalizeDashboardSummary(response.data.data ?? {})
    const localWaterMl = activeProfileId ? waterLogService.getTotalForDate(user.id, activeProfileId, date) : 0

    return {
      ...normalized,
      waterConsumedMl: normalized.waterConsumedMl + localWaterMl,
    }
  },
}
