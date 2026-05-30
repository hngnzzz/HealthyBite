export type ReportRange = '7d' | '30d' | '90d'

export type TrendDirection = 'up' | 'down' | 'stable'

export type InsightSeverity = 'positive' | 'neutral' | 'warning' | 'risk'

export type DataConfidence = 'sufficient' | 'limited' | 'insufficient'

export type InsightCategory =
  | 'nutrition'
  | 'hydration'
  | 'consistency'
  | 'weight'
  | 'habits'
  | 'goals'

export interface NutritionDaySummary {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  mealsLogged: number
}

export interface NutritionReport {
  dailySummaries: NutritionDaySummary[]
  averageCalories: number
  averageProtein: number
  averageCarbs: number
  averageFat: number
  totalDaysTracked: number
  calorieTrend: TrendDirection
  proteinTrend: TrendDirection
}

export interface GoalAdherenceReport {
  calorieHitRate: number
  proteinHitRate: number
  carbHitRate: number
  fatHitRate: number
  currentStreak: number
  longestStreak: number
  bestDay: string | null
  worstDay: string | null
  goalType: string
}

export interface WeightTrendReport {
  currentWeight: number | null
  startWeight: number | null
  targetWeight: number | null
  changeKg: number
  direction: TrendDirection
  trendLabel: string
  confidence: DataConfidence
}

export interface WaterReport {
  dailyTotals: Array<{ date: string; amountMl: number }>
  averageMl: number
  goalMl: number
  goalAchievementRate: number
  trend: TrendDirection
  confidence: DataConfidence
}

export interface HabitAnalysis {
  mealsPerDay: number
  skippedBreakfastRate: number
  loggingFrequencyPercent: number
  mostLoggedMealType: string
  loggingTrend: TrendDirection
}

export interface SubScore {
  score: number
  confidence: DataConfidence
  label: string
}

export interface ConsistencyScore {
  overall: number
  confidence: DataConfidence
  logging: SubScore
  calories: SubScore
  macros: SubScore
  hydration: SubScore
  message: string
}

export interface Insight {
  id: string
  severity: InsightSeverity
  category: InsightCategory
  title: string
  description: string
}

export interface WeeklySummary {
  totalCalories: number
  averageCalories: number
  totalMeals: number
  daysTracked: number
  calorieBalance: string
  topInsight: string
}

export interface ReportsData {
  nutrition: NutritionReport
  goalAdherence: GoalAdherenceReport
  weightTrend: WeightTrendReport
  water: WaterReport
  habits: HabitAnalysis
  consistency: ConsistencyScore
  insights: Insight[]
  weeklySummary: WeeklySummary
  range: ReportRange
}
