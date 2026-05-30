import { useEffect, useState } from 'react'
import { collectRawData, getSessionIds } from '../services/analyticsService'
import { buildReportsViewModel, type ReportsViewModel } from '../services/reportViewModels'
import { sessionService } from '../services/sessionService'
import type { ReportRange } from '../types/reports'

export function useReportsData(range: ReportRange) {
  const [viewModel, setViewModel] = useState<ReportsViewModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadReports() {
      setIsLoading(true)
      setErrorMessage('')

      const ids = getSessionIds()
      if (!ids) {
        const hasUser = !!sessionService.getUser()
        setErrorMessage(
          hasUser
            ? 'Please create a health profile first to view reports.'
            : 'Please sign in to view reports.',
        )
        setIsLoading(false)
        return
      }

      try {
        const rawData = await collectRawData(ids.userId, ids.profileId, range)
        if (!cancelled) {
          setViewModel(buildReportsViewModel(rawData))
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load reports.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadReports()

    return () => {
      cancelled = true
    }
  }, [range])

  return { viewModel, isLoading, errorMessage }
}
