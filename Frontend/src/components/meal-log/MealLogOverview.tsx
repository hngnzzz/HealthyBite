import type { DashboardSummary } from '../../types/health'

interface Totals {
  fiber: number
  sugar: number
  sodium: number
}

interface MealLogDateBarProps {
  dateLabel: string
  selectedDate: string
  onPreviousDay: () => void
  onNextDay: () => void
  onDateChange: (value: string) => void
}

function MealLogDateBar({ dateLabel, selectedDate, onPreviousDay, onNextDay, onDateChange }: MealLogDateBarProps) {
  return (
    <div className="meal-journal__date-bar">
      <button className="meal-journal__date-nav" type="button" onClick={onPreviousDay} aria-label="Previous day">
        {'<'}
      </button>

      <div className="meal-journal__date-copy">
        <strong>{dateLabel}</strong>
        <span>{selectedDate}</span>
      </div>

      <div className="meal-journal__date-actions">
        <input className="meal-journal__date-input" type="date" value={selectedDate} onChange={(event) => onDateChange(event.target.value)} />
        <button className="meal-journal__date-nav" type="button" onClick={onNextDay} aria-label="Next day">
          {'>'}
        </button>
      </div>
    </div>
  )
}

interface MealLogHeroProps {
  summary: DashboardSummary | null
  caloriesProgress: string
  dailyDetailTotals: Totals
  dailyWarnings: string[]
}

function MealLogHero({ summary, caloriesProgress, dailyDetailTotals, dailyWarnings }: MealLogHeroProps) {
  return (
    <section className="meal-journal__hero">
      <div className="meal-journal__hero-main">
        <div>
          <strong>{summary ? Math.round(summary.caloriesConsumed) : 0}</strong>
          <p>/ {summary ? Math.round(summary.caloriesTarget) : 0} target kcal</p>
        </div>
        <div className="meal-journal__hero-badge">
          {summary ? `${Math.max(0, Math.round(summary.caloriesRemaining))} kcal remaining` : 'No data yet'}
        </div>
      </div>

      <div className="meal-journal__progress">
        <div className="meal-journal__progress-bar" style={{ width: caloriesProgress }} />
      </div>

      <div className="meal-journal__macro-grid">
        {summary?.macroProgress.map((macro) => (
          <article className="meal-journal__macro-card" key={macro.label}>
            <div className="meal-journal__macro-copy">
              <strong>{macro.consumed}g</strong>
              <span>{macro.label} / {macro.target}g</span>
            </div>
            <div className="meal-journal__macro-track">
              <div className="meal-journal__macro-fill" style={{ width: macro.target > 0 ? `${Math.min(100, Math.round((macro.consumed / macro.target) * 100))}%` : '0%' }} />
            </div>
          </article>
        ))}
      </div>

      <div className="meal-journal__summary-grid">
        <article className="meal-journal__summary-card"><strong>{Math.round(dailyDetailTotals.fiber)}g</strong><span>Fiber</span></article>
        <article className="meal-journal__summary-card"><strong>{Math.round(dailyDetailTotals.sugar)}g</strong><span>Sugar</span></article>
        <article className="meal-journal__summary-card"><strong>{Math.round(dailyDetailTotals.sodium)}mg</strong><span>Sodium</span></article>
      </div>

      {dailyWarnings.length > 0 ? (
        <div className="meal-journal__warnings">
          {dailyWarnings.map((warning) => <div className="meal-journal__warning" key={warning}>{warning}</div>)}
        </div>
      ) : null}
    </section>
  )
}

export { MealLogDateBar, MealLogHero }
