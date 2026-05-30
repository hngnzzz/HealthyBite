import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardShell from '../components/dashboard/DashboardShell'
import { dashboardService } from '../services/dashboardService'
import { profileBootstrapService } from '../services/profileBootstrapService'
import { sessionService } from '../services/sessionService'
import type { DashboardChartPoint, DashboardSummary } from '../types/health'

function formatMacroValue(consumed: number, target: number) {
  return `${consumed}g / ${target}g`
}

function formatCaloriesValue(summary: DashboardSummary) {
  return {
    value: String(summary.caloriesConsumed),
    unit: `/ ${summary.caloriesTarget} kcal`,
    note: summary.isOverCalories
      ? `${summary.caloriesBalance} kcal over target`
      : `${summary.caloriesRemaining} kcal remaining`,
  }
}

function formatPercent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`
}

function formatWeight(value: number | null | undefined) {
  return value == null ? '--' : `${value.toFixed(1)} kg`
}

function getChartWidth(value: number | null, maxValue: number) {
  if (value == null || maxValue <= 0) {
    return '8%'
  }

  return `${Math.max(8, Math.round((value / maxValue) * 100))}%`
}

function getChartMax(points: DashboardChartPoint[]) {
  return Math.max(...points.map((point) => point.value ?? 0), ...points.map((point) => point.target ?? 0), 1)
}

function getLatestWeightPoint(points: DashboardChartPoint[]) {
  for (let index = points.length - 1; index >= 0; index -= 1) {
    if (points[index].value != null) {
      return points[index]
    }
  }

  return null
}

function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadSummary() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const activeProfile = await profileBootstrapService.resolveExistingProfile()

        if (!activeProfile) {
          throw new Error('No active profile found.')
        }

        const result = await dashboardService.getTodaySummary()

        if (!cancelled) {
          setSummary(result)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load dashboard.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadSummary()

    return () => {
      cancelled = true
    }
  }, [])

  const sessionUser = sessionService.getUser()
  const caloriesCard = summary
    ? formatCaloriesValue(summary)
    : { value: '--', unit: '', note: 'No data yet' }
  const waterProgress =
    summary && summary.waterGoalMl > 0 ? Math.min(100, Math.round((summary.waterConsumedMl / summary.waterGoalMl) * 100)) : 0
  const calorieProgress =
    summary && summary.caloriesTarget > 0
      ? Math.min(100, Math.round((summary.caloriesConsumed / summary.caloriesTarget) * 100))
      : 0
  const latestWeightPoint = summary ? getLatestWeightPoint(summary.quickCharts.weightTrend) : null
  const caloriesChartMax = getChartMax(summary?.quickCharts.calories7Days ?? [])
  const weightChartMax = getChartMax(summary?.quickCharts.weightTrend ?? [])

  const summaryCards = [
    {
      label: 'Calories Today',
      value: caloriesCard.value,
      unit: caloriesCard.unit,
      note: caloriesCard.note,
      accent: 'orange',
      showProgress: true,
      progress: `${calorieProgress}%`,
    },
    {
      label: 'Water',
      value: summary ? `${Math.round(summary.waterConsumedMl)} ml` : '--',
      unit: summary ? `/ ${Math.round(summary.waterGoalMl)} ml` : '',
      note: summary
        ? summary.hasSyncedActivity
          ? `${summary.exerciseMinutes ?? 0} min activity synced today`
          : 'Track hydration through the day'
        : 'No data yet',
      accent: 'blue',
      showProgress: true,
      progress: `${waterProgress}%`,
    },
    {
      label: 'Goal Progress',
      value: summary ? formatPercent(summary.goalProgress.completionPercent) : '--',
      unit: '',
      note: summary
        ? `${summary.goalProgress.daysOnPlan} day(s) on plan | ${summary.goalProgress.goalLabel}`
        : 'No data yet',
      accent: 'green',
      showProgress: false,
      progress: '0%',
    },
    {
      label: 'Weight Target',
      value: summary ? formatWeight(summary.goalProgress.currentWeightKg) : '--',
      unit: '',
      note: summary
        ? `Target ${formatWeight(summary.goalProgress.targetWeightKg)} | ${summary.goalProgress.remainingKg.toFixed(1)} kg remaining`
        : 'No data yet',
      accent: 'pink',
      showProgress: false,
      progress: '0%',
    },
  ] as const

  return (
    <DashboardShell
      activeItem="dashboard"
      title={`Hello, ${summary?.greetingName || sessionUser?.fullName || 'there'}`}
      subtitle={summary?.summaryDateLabel ?? ''}
      action={
        <Link className="dashboard-journal-button dashboard-journal-button--link" to="/meal-log">
          Open Journal
        </Link>
      }
    >
      <section className="dashboard-summary-grid">
        {summaryCards.map((card) => (
          <article className="dashboard-card dashboard-card--summary" key={card.label}>
            <div className={`dashboard-card__badge dashboard-card__badge--${card.accent}`} />
            <p className="dashboard-card__label">{card.label}</p>
            <div className="dashboard-card__value-row">
              <strong>{card.value}</strong>
              {card.unit ? <span>{card.unit}</span> : null}
            </div>
            {card.showProgress ? (
              <div className="dashboard-progress">
                <div className="dashboard-progress__track">
                  <div className="dashboard-progress__bar" style={{ width: card.progress }} />
                </div>
                <p>{card.note}</p>
              </div>
            ) : (
              <p className="dashboard-card__note">{card.note}</p>
            )}
          </article>
        ))}
      </section>

      <section className="dashboard-content-grid">
        <article className="dashboard-card dashboard-card--nutrition">
          <div className="dashboard-section-header">
            <h3>Nutrition Today</h3>
          </div>

          {isLoading ? <p>Loading nutrition data...</p> : null}
          {!isLoading && errorMessage ? <p>{errorMessage}</p> : null}

          {!isLoading && summary ? (
            <>
              <div className="dashboard-nutrition-list">
                {summary.macroProgress.map((item) => (
                  <div className="dashboard-nutrition-row" key={item.label}>
                    <div className="dashboard-nutrition-row__meta">
                      <span>{item.label}</span>
                      <strong>{formatMacroValue(item.consumed, item.target)}</strong>
                    </div>
                    <div className="dashboard-nutrition-row__track">
                      <div
                        className={`dashboard-nutrition-row__bar dashboard-nutrition-row__bar--${item.accent}`}
                        style={{
                          width:
                            item.target > 0
                              ? `${Math.min(100, Math.round((item.consumed / item.target) * 100))}%`
                              : '0%',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="dashboard-macro-summary">
                {summary.macroProgress.map((item) => (
                  <div key={item.label}>
                    <strong>{item.consumed}g</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="dashboard-insights-list">
                <div><span>Water intake</span><strong>{Math.round(summary.waterConsumedMl)} / {Math.round(summary.waterGoalMl)} ml</strong></div>
                <div><span>Meals logged</span><strong>{summary.mealsLoggedCount}</strong></div>
                <div><span>Activity sync</span><strong>{summary.hasSyncedActivity ? `${summary.exerciseMinutes ?? 0} min` : 'Not synced'}</strong></div>
                <div><span>Calorie balance</span><strong>{summary.isOverCalories ? `${summary.caloriesBalance} kcal over` : `${summary.caloriesRemaining} kcal left`}</strong></div>
              </div>

              <div className="dashboard-alert-list">
                <div className="dashboard-section-subtitle">Reminders & Alerts</div>
                {summary.alerts.length === 0 ? (
                  <p className="dashboard-card__note">No alerts right now.</p>
                ) : (
                  summary.alerts.map((alert) => (
                    <div className={`dashboard-alert dashboard-alert--${alert.level}`} key={`${alert.level}-${alert.title}`}>
                      <strong>{alert.title}</strong>
                      <span>{alert.message}</span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : null}
        </article>

        <article className="dashboard-card dashboard-card--meals">
          <div className="dashboard-section-header">
            <h3>Overview & Trends</h3>
            <Link to="/food-search">View all</Link>
          </div>

          {isLoading ? <p>Loading overview...</p> : null}
          {!isLoading && !errorMessage && summary ? (
            <>
              <div className="dashboard-overview-grid">
                <div className="dashboard-overview-block">
                  <div className="dashboard-section-subtitle">Goal Progress</div>
                  <div className="dashboard-insights-list">
                    <div><span>Current goal</span><strong>{summary.goalProgress.goalLabel}</strong></div>
                    <div><span>Current weight</span><strong>{formatWeight(summary.goalProgress.currentWeightKg)}</strong></div>
                    <div><span>Target weight</span><strong>{formatWeight(summary.goalProgress.targetWeightKg)}</strong></div>
                    <div><span>Remaining</span><strong>{summary.goalProgress.remainingKg.toFixed(1)} kg</strong></div>
                    <div><span>Days on plan</span><strong>{summary.goalProgress.daysOnPlan}</strong></div>
                    <div><span>Completion</span><strong>{formatPercent(summary.goalProgress.completionPercent)}</strong></div>
                  </div>
                </div>

                <div className="dashboard-overview-block">
                  <div className="dashboard-section-subtitle">Quick Metrics</div>
                  <div className="dashboard-insights-list">
                    <div><span>7-day calorie adherence</span><strong>{formatPercent(summary.quickCharts.calorieAdherencePercent)}</strong></div>
                    <div><span>Protein target rate</span><strong>{formatPercent(summary.quickCharts.proteinTargetPercent)}</strong></div>
                    <div><span>Latest weight point</span><strong>{latestWeightPoint?.value != null ? `${latestWeightPoint.value} kg` : 'Current value only'}</strong></div>
                    <div><span>Weight trend</span><strong>{summary.quickCharts.hasWeightHistory ? 'History available' : 'Current profile weight only'}</strong></div>
                  </div>
                </div>
              </div>

              <div className="dashboard-chart-grid">
                <div className="dashboard-chart-card">
                  <div className="dashboard-section-subtitle">Calories - last 7 days</div>
                  <div className="dashboard-chart-list">
                    {summary.quickCharts.calories7Days.map((point) => (
                      <div className="dashboard-chart-row" key={`cal-${point.label}`}>
                        <span>{point.label}</span>
                        <div className="dashboard-chart-row__track">
                          <div
                            className="dashboard-chart-row__bar dashboard-chart-row__bar--pink"
                            style={{ width: getChartWidth(point.value, caloriesChartMax) }}
                          />
                        </div>
                        <strong>{Math.round(point.value ?? 0)} kcal</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dashboard-chart-card">
                  <div className="dashboard-section-subtitle">Weight - last 7 days</div>
                  <div className="dashboard-chart-list">
                    {summary.quickCharts.weightTrend.map((point) => (
                      <div className="dashboard-chart-row" key={`weight-${point.label}`}>
                        <span>{point.label}</span>
                        <div className="dashboard-chart-row__track">
                          <div
                            className="dashboard-chart-row__bar dashboard-chart-row__bar--blue"
                            style={{ width: getChartWidth(point.value, weightChartMax) }}
                          />
                        </div>
                        <strong>{point.value == null ? '--' : `${point.value} kg`}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="dashboard-section-subtitle">Meals Today</div>
              {summary.meals.length === 0 ? (
                <p className="dashboard-card__note">No meals logged today.</p>
              ) : (
                <div className="dashboard-meals-list">
                  {summary.meals.map((meal) => (
                    <section className="dashboard-meal-item" key={`${meal.title}-${meal.name}`}>
                      <div>
                        <p className="dashboard-meal-item__title">{meal.title}</p>
                        <h4>{meal.name}</h4>
                      </div>
                      <div className="dashboard-meal-item__calories">
                        <span>{meal.calories} kcal</span>
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </article>
      </section>
    </DashboardShell>
  )
}

export default DashboardPage
