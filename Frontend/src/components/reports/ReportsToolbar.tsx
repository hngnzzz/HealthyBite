import type { ReportRange } from '../../types/reports'

type ReportsTab = 'overview' | 'nutrition' | 'progress' | 'insights'

const TAB_CONFIG: Array<{ key: ReportsTab; label: string; icon: string }> = [
  { key: 'overview', label: 'Overview', icon: '◎' },
  { key: 'nutrition', label: 'Nutrition', icon: '◉' },
  { key: 'progress', label: 'Progress', icon: '▲' },
  { key: 'insights', label: 'Insights', icon: '✦' },
]

const RANGE_OPTIONS: Array<{ key: ReportRange; label: string }> = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
]

interface ReportsToolbarProps {
  activeTab: ReportsTab
  onTabChange: (tab: ReportsTab) => void
  range: ReportRange
  onRangeChange: (range: ReportRange) => void
}

function ReportsToolbar({ activeTab, onTabChange, range, onRangeChange }: ReportsToolbarProps) {
  return (
    <div className="rpt-controls" id="reports-controls">
      <div className="rpt-controls__range">
        <div className="rpt-range" id="range-selector">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`rpt-range__btn${range === opt.key ? ' rpt-range__btn--active' : ''}`}
              onClick={() => onRangeChange(opt.key)}
              id={`range-${opt.key}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rpt-controls__tabs">
        <nav className="rpt-tabs" id="reports-tabs" aria-label="Report sections">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`rpt-tabs__btn${activeTab === tab.key ? ' rpt-tabs__btn--active' : ''}`}
              onClick={() => onTabChange(tab.key)}
              id={`tab-btn-${tab.key}`}
            >
              <span className="rpt-tabs__icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default ReportsToolbar
export type { ReportsTab }
