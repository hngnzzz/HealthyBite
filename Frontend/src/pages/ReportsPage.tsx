import { useState } from 'react'
import DashboardShell from '../components/dashboard/DashboardShell'
import ReportsContent from '../components/reports/ReportsContent'
import { ReportsEmptyState, ReportsLoadingState, ReportsNotice } from '../components/reports/ReportsStates'
import ReportsToolbar, { type ReportsTab } from '../components/reports/ReportsToolbar'
import { useReportsData } from '../hooks/useReportsData'
import type { ReportRange } from '../types/reports'

function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportsTab>('overview')
  const [range, setRange] = useState<ReportRange>('7d')
  const { viewModel, isLoading, errorMessage } = useReportsData(range)

  return (
    <DashboardShell
      activeItem="reports"
      title="Reports & Insights"
      subtitle="Track nutrition consistency and health progress over time"
    >
      <div className="rpt-page" id="reports-page">
        <ReportsToolbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          range={range}
          onRangeChange={setRange}
        />

        <div className="rpt-content" id="reports-content">
          {isLoading && <ReportsLoadingState />}

          {!isLoading && errorMessage && (
            <ReportsNotice icon="⚠" variant="error">{errorMessage}</ReportsNotice>
          )}

          {!isLoading && !errorMessage && viewModel && (
            <>
              {viewModel.isDataEmpty ? (
                <ReportsEmptyState rangeLabel={viewModel.rangeLabel} />
              ) : (
                <ReportsContent activeTab={activeTab} viewModel={viewModel} />
              )}
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

export default ReportsPage
