export interface MealLogItem {
  id: number
  foodItemId?: number | null
  quantity: number
  unit?: string
  calories: number
  protein: number
  fat: number
  carbs: number
  fiber?: number
  sugar?: number
  sodium?: number
  itemType: string
  itemName: string
}

export type LegacyMealType = 'pre-workout' | 'post-workout'
export type MealType =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | `custom:${string}`

export function normalizeMealType(mealType: string): MealType {
  if (mealType === 'pre-workout' || mealType === 'post-workout') {
    return 'snack'
  }

  return mealType as MealType
}

export interface MealLog {
  id: number
  profileId: number
  mealType: MealType
  mealDate: string
  totalCalories: number
  totalProtein: number
  totalFat: number
  totalCarbs: number
  items: MealLogItem[]
}

export interface CreateMealLogPayload {
  profileId: number
  mealType: MealType
  mealDate?: string
  items: Array<{
    foodItemId?: number
    quantity: number
    unit?: string
    itemType?: string
    itemName?: string
    calories?: number
    protein?: number
    fat?: number
    carbs?: number
    fiber?: number
    sugar?: number
    sodium?: number
  }>
}

export interface UpdateMealLogPayload {
  mealType: MealType
  mealDate?: string
  items: CreateMealLogPayload['items']
}
