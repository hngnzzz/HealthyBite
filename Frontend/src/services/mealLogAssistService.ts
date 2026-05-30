import type { MealLog, MealLogItem } from '../types/mealLog'
import { shiftDateInputValue } from '../utils/date'

const RECENT_KEY = 'mealLogRecentItems'

function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function saveJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export const mealLogAssistService = {
  recordRecentItems(items: Omit<MealLogItem, 'id'>[]) {
    const current = readJson<Omit<MealLogItem, 'id'>[]>(RECENT_KEY, [])
    const next = [...items, ...current]
      .filter((item, index, array) => index === array.findIndex((entry) => entry.itemName === item.itemName))
      .slice(0, 20)
    saveJson(RECENT_KEY, next)
    return next
  },

  getYesterdayMeals(mealLogs: MealLog[], selectedDate: string) {
    const yesterday = shiftDateInputValue(selectedDate, -1)
    return mealLogs.filter((meal) => meal.mealDate.slice(0, 10) === yesterday)
  },
}
