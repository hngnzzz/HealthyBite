import type { TrendDirection } from '../types/reports'

/**
 * Determines trend direction from a series of numeric values.
 * Uses simple linear regression slope to determine direction.
 * Requires at least 2 data points; returns 'stable' otherwise.
 */
export function getTrendDirection(values: number[]): TrendDirection {
  if (values.length < 2) {
    return 'stable'
  }

  const n = values.length
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0

  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += values[i]
    sumXY += i * values[i]
    sumXX += i * i
  }

  const denominator = n * sumXX - sumX * sumX
  if (denominator === 0) {
    return 'stable'
  }

  const slope = (n * sumXY - sumX * sumY) / denominator
  const mean = sumY / n
  const threshold = mean * 0.02

  if (slope > threshold) {
    return 'up'
  }

  if (slope < -threshold) {
    return 'down'
  }

  return 'stable'
}

/**
 * Returns a human-readable label for a trend direction.
 */
export function getTrendLabel(direction: TrendDirection): string {
  switch (direction) {
    case 'up':
      return 'Trending up'
    case 'down':
      return 'Trending down'
    case 'stable':
      return 'Holding steady'
  }
}

/**
 * Returns a formatted delta string (e.g., "+2.3" or "-1.5") without false precision.
 * Rounds to 1 decimal place.
 */
export function formatTrendDelta(current: number, previous: number): string {
  const delta = current - previous
  const rounded = Math.round(delta * 10) / 10

  if (rounded === 0) {
    return 'No change'
  }

  return rounded > 0 ? `+${rounded}` : `${rounded}`
}

/**
 * Returns the number of days for a given ReportRange.
 */
export function rangeToDays(range: '7d' | '30d' | '90d'): number {
  switch (range) {
    case '7d':
      return 7
    case '30d':
      return 30
    case '90d':
      return 90
  }
}

/**
 * Returns a human-readable label for a ReportRange.
 */
export function rangeToLabel(range: '7d' | '30d' | '90d'): string {
  switch (range) {
    case '7d':
      return 'Last 7 days'
    case '30d':
      return 'Last 30 days'
    case '90d':
      return 'Last 90 days'
  }
}
