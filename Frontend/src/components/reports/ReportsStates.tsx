function ReportsLoadingState() {
  return (
    <div className="rpt-loading" id="reports-loading">
      <div className="rpt-loading__spinner" />
      <p>Analyzing your health data...</p>
    </div>
  )
}

function ReportsEmptyState({ rangeLabel }: { rangeLabel: string }) {
  return (
    <div className="rpt-empty" id="reports-empty-state">
      <div className="rpt-empty__visual">
        <div className="rpt-empty__circle" />
        <div className="rpt-empty__icon">📊</div>
      </div>
      <h3>No data yet</h3>
      <p>Start logging meals, water, and body metrics to see your {rangeLabel.toLowerCase()} reports and insights here.</p>
    </div>
  )
}

function ReportsNotice({ icon, children, variant }: { icon: string; children: string; variant?: 'error' }) {
  return (
    <div className={`rpt-notice${variant === 'error' ? ' rpt-notice--error' : ''}`}>
      <div className="rpt-notice__icon">{icon}</div>
      <p>{children}</p>
    </div>
  )
}

export { ReportsLoadingState, ReportsEmptyState, ReportsNotice }
