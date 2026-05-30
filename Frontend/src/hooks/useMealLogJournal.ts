import { useEffect, useState } from 'react'
import { dashboardService } from '../services/dashboardService'
import { mealLogService } from '../services/mealLogService'
import { profileBootstrapService } from '../services/profileBootstrapService'
import { sessionService } from '../services/sessionService'
import type { DashboardSummary } from '../types/health'
import type { MealLog } from '../types/mealLog'

export function useMealLogJournal(selectedDate: string) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [mealLogs, setMealLogs] = useState<MealLog[]>([])
  const [allMealLogs, setAllMealLogs] = useState<MealLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function runLoad() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const profile = await profileBootstrapService.resolveExistingProfile()
        const activeProfileId = profile?.id ?? sessionService.getActiveProfileId()

        if (!activeProfileId) {
          throw new Error('No active profile found.')
        }

        const [summaryData, mealLogsResponse] = await Promise.all([
          dashboardService.getTodaySummary(selectedDate),
          mealLogService.getMealLogsByProfileId(activeProfileId),
        ])

        const nextAllLogs = mealLogsResponse.data.data
        const filteredMealLogs = nextAllLogs.filter((mealLog) => mealLog.mealDate.slice(0, 10) === selectedDate)

        if (!cancelled) {
          setSummary(summaryData)
          setAllMealLogs(nextAllLogs)
          setMealLogs(filteredMealLogs)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load meal log.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void runLoad()

    return () => {
      cancelled = true
    }
  }, [selectedDate])

  async function refreshMealLogs() {
    const activeProfileId = sessionService.getActiveProfileId()
    if (!activeProfileId) {
      return
    }

    const [summaryData, mealLogsResponse] = await Promise.all([
      dashboardService.getTodaySummary(selectedDate),
      mealLogService.getMealLogsByProfileId(activeProfileId),
    ])

    const nextAllLogs = mealLogsResponse.data.data
    setSummary(summaryData)
    setAllMealLogs(nextAllLogs)
    setMealLogs(nextAllLogs.filter((mealLog) => mealLog.mealDate.slice(0, 10) === selectedDate))
  }

  return {
    summary,
    mealLogs,
    allMealLogs,
    isLoading,
    errorMessage,
    setErrorMessage,
    refreshMealLogs,
  }
}
