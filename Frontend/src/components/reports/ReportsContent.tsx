import type { ChartBarItem, InsightCardVM, ReportsViewModel, StatCardVM } from '../../services/reportViewModels'
import type { InsightSeverity } from '../../types/reports'

function severityClass(severity: InsightSeverity): string {
  return `rpt-insight--${severity}`
}

function ReportStatCard({ card, size = 'default' }: { card: StatCardVM; size?: 'default' | 'compact' }) {
  return (
    <article className={`rpt-stat ${size === 'compact' ? 'rpt-stat--compact' : ''}`} id={`stat-${card.label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className={`rpt-stat__accent rpt-stat__accent--${card.accent}`} />
      <div className="rpt-stat__body">
        <span className="rpt-stat__label">{card.label}</span>
        <strong className="rpt-stat__value">{card.value}</strong>
        <span className="rpt-stat__note">{card.note}</span>
      </div>
    </article>
  )
}

function ReportInsightCard({ card }: { card: InsightCardVM }) {
  return (
    <article className={`rpt-insight ${severityClass(card.severity)}`} id={`insight-${card.id}`}>
      <div className="rpt-insight__badge">
        <span>{card.icon}</span>
      </div>
      <div className="rpt-insight__content">
        <strong className="rpt-insight__title">{card.title}</strong>
        <p className="rpt-insight__desc">{card.description}</p>
      </div>
      <div className="rpt-insight__severity-dot" />
    </article>
  )
}

function ReportChartBar({ item }: { item: ChartBarItem }) {
  return (
    <div className="rpt-bar" id={`chart-${item.label.replace(/\s+/g, '-')}`}>
      <span className="rpt-bar__label">{item.label}</span>
      <div className="rpt-bar__track">
        <div
          className={`rpt-bar__fill rpt-bar__fill--${item.accent}`}
          style={{ width: `${item.widthPercent}%` }}
        />
      </div>
      <strong className="rpt-bar__value">{item.displayValue}</strong>
    </div>
  )
}

function ReportTrendBadge({ direction, label, icon }: { direction: string; label: string; icon: string }) {
  return (
    <span className={`rpt-trend rpt-trend--${direction}`}>
      <span className="rpt-trend__icon">{icon}</span>
      {label}
    </span>
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

function ConsistencyHero({ score, confidence, message, logging, calories, macros, hydration }: {
  score: number
  confidence: string
  message: string
  logging: { score: number; confidence: string; label: string }
  calories: { score: number; confidence: string; label: string }
  macros: { score: number; confidence: string; label: string }
  hydration: { score: number; confidence: string; label: string }
}) {
  const circumference = 2 * Math.PI * 58
  const offset = circumference - (score / 100) * circumference
  const isInsufficient = confidence === 'insufficient'
  const subScores = [logging, calories, macros, hydration]

  return (
    <div className="rpt-score-hero" id="consistency-score">
      <div className="rpt-score-hero__ring-area">
        <span className="rpt-score-hero__eyebrow">Consistency Score</span>
        <div className="rpt-score-hero__ring-wrap">
          <svg className="rpt-score-hero__svg" viewBox="0 0 128 128">
            <circle className="rpt-score-hero__track" cx="64" cy="64" r="58" fill="none" strokeWidth="7" />
            {!isInsufficient && (
              <circle
                className="rpt-score-hero__fill"
                cx="64" cy="64" r="58" fill="none" strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 64 64)"
              />
            )}
          </svg>
          <div className="rpt-score-hero__ring-value">
            {isInsufficient ? (
              <span className="rpt-score-hero__na">—</span>
            ) : (
              <>
                <strong>{score}</strong>
                <span>/100</span>
              </>
            )}
          </div>
        </div>
        <p className="rpt-score-hero__msg">{message}</p>
      </div>

      {!isInsufficient && (
        <div className="rpt-score-hero__breakdown">
          {subScores.map((s) => (
            <div className="rpt-subscore" key={s.label}>
              <div className="rpt-subscore__header">
                <span>{s.label}</span>
                <strong>{s.confidence === 'insufficient' ? '—' : `${s.score}%`}</strong>
              </div>
              <div className="rpt-subscore__track">
                <div
                  className="rpt-subscore__fill"
                  style={{ width: `${s.confidence === 'insufficient' ? 0 : s.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OverviewTab({ vm }: { vm: ReportsViewModel }) {
  const { overview } = vm
  return (
    <div className="rpt-tab-body" id="tab-overview">
      <div className="rpt-overview-top">
        <div className="rpt-summary-hero" id="weekly-summary">
          <div className="rpt-summary-hero__head">
            <div>
              <span className="rpt-summary-hero__eyebrow">Period Summary</span>
              <h3 className="rpt-summary-hero__title">{overview.rangeLabel}</h3>
            </div>
          </div>
          <div className="rpt-summary-hero__metrics">
            <div className="rpt-summary-metric">
              <strong>{overview.summary.totalMeals}</strong>
              <span>Meals</span>
            </div>
            <div className="rpt-summary-metric">
              <strong>{overview.summary.daysTracked}</strong>
              <span>Days</span>
            </div>
            <div className="rpt-summary-metric rpt-summary-metric--highlight">
              <strong>{overview.summary.averageCalories || '—'}</strong>
              <span>Avg kcal</span>
            </div>
            <div className="rpt-summary-metric">
              <strong>{overview.summary.calorieBalance}</strong>
              <span>Balance</span>
            </div>
          </div>
        </div>

        <ConsistencyHero
          score={overview.consistency.overall}
          confidence={overview.consistency.confidence}
          message={overview.consistency.message}
          logging={overview.consistency.logging}
          calories={overview.consistency.calories}
          macros={overview.consistency.macros}
          hydration={overview.consistency.hydration}
        />
      </div>

      <div className="rpt-stat-row" id="overview-stats">
        {overview.statCards.map((card) => (
          <ReportStatCard key={card.label} card={card} />
        ))}
      </div>

      {overview.topInsights.length > 0 && (
        <section className="rpt-section">
          <h3 className="rpt-section__title">
            <span className="rpt-section__icon">✦</span>
            Top Insights
          </h3>
          <div className="rpt-insight-list" id="top-insights">
            {overview.topInsights.map((insight) => (
              <ReportInsightCard key={insight.id} card={insight} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function NutritionTab({ vm }: { vm: ReportsViewModel }) {
  const { nutrition } = vm
  return (
    <div className="rpt-tab-body" id="tab-nutrition">
      <div className="rpt-calorie-hero">
        <div className="rpt-calorie-hero__left">
          <span className="rpt-calorie-hero__eyebrow">Average Daily Intake</span>
          <strong className="rpt-calorie-hero__value">{nutrition.averageCaloriesDisplay}</strong>
          <ReportTrendBadge {...nutrition.calorieTrend} />
        </div>
        <div className="rpt-calorie-hero__pill">
          {nutrition.surplusDeficitLabel}
        </div>
      </div>

      <div className="rpt-macro-row" id="macro-averages">
        {nutrition.macroAverages.map((macro) => (
          <div className={`rpt-macro rpt-macro--${macro.accent}`} key={macro.label}>
            <span className="rpt-macro__label">{macro.label}</span>
            <strong className="rpt-macro__value">{macro.value}</strong>
            <span className="rpt-macro__sub">avg/day</span>
          </div>
        ))}
      </div>

      <section className="rpt-chart-panel" id="calorie-chart">
        <h3 className="rpt-section__title">
          <span className="rpt-section__icon">◉</span>
          Daily Calories
        </h3>
        <div className="rpt-bar-list">
          {nutrition.calorieChart.map((item) => (
            <ReportChartBar key={item.label} item={item} />
          ))}
        </div>
      </section>
    </div>
  )
}

function ProgressTab({ vm }: { vm: ReportsViewModel }) {
  const { progress } = vm
  return (
    <div className="rpt-tab-body" id="tab-progress">
      <div className="rpt-weight-panel" id="weight-trend-section">
        <div className="rpt-weight-panel__info">
          <span className="rpt-weight-panel__eyebrow">Weight Trend</span>
          <h3 className="rpt-weight-panel__title">
            {progress.weightTrend.currentWeight != null ? `${progress.weightTrend.currentWeight} kg` : 'No data'}
          </h3>
          <p className="rpt-weight-panel__desc">{progress.weightTrend.trendLabel}</p>
          <ReportTrendBadge {...progress.weightTrendBadge} />
        </div>
        <div className="rpt-weight-panel__stats">
          <div>
            <span>Start</span>
            <strong>{progress.weightTrend.startWeight != null ? `${progress.weightTrend.startWeight} kg` : '—'}</strong>
          </div>
          <div>
            <span>Target</span>
            <strong>{progress.weightTrend.targetWeight != null ? `${progress.weightTrend.targetWeight} kg` : '—'}</strong>
          </div>
          <div>
            <span>Change</span>
            <strong>{progress.weightTrend.changeKg !== 0 ? `${progress.weightTrend.changeKg > 0 ? '+' : ''}${progress.weightTrend.changeKg} kg` : 'None'}</strong>
          </div>
        </div>
      </div>

      {progress.weightTrend.confidence === 'insufficient' && (
        <ReportsNotice icon="ℹ">
          Insufficient weight data for detailed trend analysis. Update your profile weight regularly to see trends.
        </ReportsNotice>
      )}

      <div className="rpt-stat-row" id="adherence-stats">
        {progress.adherenceCards.map((card) => (
          <ReportStatCard key={card.label} card={card} />
        ))}
      </div>

      <div className="rpt-streak" id="streak-display">
        <div className="rpt-streak__flame">🔥</div>
        <div className="rpt-streak__body">
          <strong>{progress.streakDisplay}</strong>
          <p>Consecutive days meeting your calorie target</p>
        </div>
      </div>
    </div>
  )
}

function InsightsTab({ vm }: { vm: ReportsViewModel }) {
  const { insights } = vm
  return (
    <div className="rpt-tab-body" id="tab-insights">
      <div className="rpt-stat-row" id="habit-stats">
        {insights.habitCards.map((card) => (
          <ReportStatCard key={card.label} card={card} />
        ))}
      </div>

      <section className="rpt-section">
        <h3 className="rpt-section__title">
          <span className="rpt-section__icon">✦</span>
          All Insights
        </h3>
        {insights.cards.length === 0 ? (
          <ReportsNotice icon="ℹ">
            Not enough data to generate insights yet. Keep logging your meals and water to see personalized observations.
          </ReportsNotice>
        ) : (
          <div className="rpt-insight-list" id="all-insights">
            {insights.cards.map((card) => (
              <ReportInsightCard key={card.id} card={card} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

type ReportsTab = 'overview' | 'nutrition' | 'progress' | 'insights'

function ReportsContent({ activeTab, viewModel }: { activeTab: ReportsTab; viewModel: ReportsViewModel }) {
  if (activeTab === 'overview') return <OverviewTab vm={viewModel} />
  if (activeTab === 'nutrition') return <NutritionTab vm={viewModel} />
  if (activeTab === 'progress') return <ProgressTab vm={viewModel} />
  return <InsightsTab vm={viewModel} />
}

export default ReportsContent
