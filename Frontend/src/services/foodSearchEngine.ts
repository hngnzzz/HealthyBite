import type { UsdaFoodItem } from '../types/food'

type CuratedFoodItem = UsdaFoodItem & {
  aliases: string[]
}

const CURATED_FOODS: CuratedFoodItem[] = [
  {
    fdcId: 900001,
    name: 'Cơm trắng / White rice',
    dataType: 'Branded',
    calories: 130,
    protein: 2.7,
    carbs: 28.0,
    fat: 0.3,
    servingSize: '100 g',
    category: 'Grains',
    source: 'Local',
    imageUrl: '',
    fatSecretFoodId: '',
    matchedKeyword: '',
    searchSource: 'local',
    aliases: ['com', 'gao', 'gao trang', 'rice', 'white rice', 'cooked rice'],
  },
  {
    fdcId: 900002,
    name: 'Bánh mì / Bread',
    dataType: 'Branded',
    calories: 265,
    protein: 9.0,
    carbs: 49.0,
    fat: 3.2,
    servingSize: '100 g',
    category: 'Bakery',
    source: 'Local',
    imageUrl: '',
    fatSecretFoodId: '',
    matchedKeyword: '',
    searchSource: 'local',
    aliases: ['banh mi', 'banh my', 'bread', 'baguette'],
  },
  {
    fdcId: 900003,
    name: 'Thịt gà / Chicken',
    dataType: 'Branded',
    calories: 165,
    protein: 31.0,
    carbs: 0.0,
    fat: 3.6,
    servingSize: '100 g',
    category: 'Protein',
    source: 'Local',
    imageUrl: '',
    fatSecretFoodId: '',
    matchedKeyword: '',
    searchSource: 'local',
    aliases: ['ga', 'ga ran', 'thit ga', 'chicken', 'fried chicken'],
  },
  {
    fdcId: 900004,
    name: 'Cá hồi / Salmon',
    dataType: 'Branded',
    calories: 208,
    protein: 20.0,
    carbs: 0.0,
    fat: 13.0,
    servingSize: '100 g',
    category: 'Protein',
    source: 'Local',
    imageUrl: '',
    fatSecretFoodId: '',
    matchedKeyword: '',
    searchSource: 'local',
    aliases: ['ca hoi', 'salmon'],
  },
  {
    fdcId: 900005,
    name: 'Trứng gà / Egg',
    dataType: 'Branded',
    calories: 155,
    protein: 13.0,
    carbs: 1.1,
    fat: 11.0,
    servingSize: '100 g',
    category: 'Protein',
    source: 'Local',
    imageUrl: '',
    fatSecretFoodId: '',
    matchedKeyword: '',
    searchSource: 'local',
    aliases: ['trung', 'trung ga', 'egg', 'chicken egg'],
  },
  {
    fdcId: 900006,
    name: 'Sữa chua / Yogurt',
    dataType: 'Branded',
    calories: 59,
    protein: 10.0,
    carbs: 3.6,
    fat: 0.4,
    servingSize: '100 g',
    category: 'Dairy',
    source: 'Local',
    imageUrl: '',
    fatSecretFoodId: '',
    matchedKeyword: '',
    searchSource: 'local',
    aliases: ['sua chua', 'yogurt'],
  },
  {
    fdcId: 900007,
    name: 'Chuối / Banana',
    dataType: 'Branded',
    calories: 89,
    protein: 1.1,
    carbs: 22.8,
    fat: 0.3,
    servingSize: '100 g',
    category: 'Fruit',
    source: 'Local',
    imageUrl: '',
    fatSecretFoodId: '',
    matchedKeyword: '',
    searchSource: 'local',
    aliases: ['chuoi', 'banana'],
  },
  {
    fdcId: 900008,
    name: 'Táo / Apple',
    dataType: 'Branded',
    calories: 52,
    protein: 0.3,
    carbs: 13.8,
    fat: 0.2,
    servingSize: '100 g',
    category: 'Fruit',
    source: 'Local',
    imageUrl: '',
    fatSecretFoodId: '',
    matchedKeyword: '',
    searchSource: 'local',
    aliases: ['tao', 'apple'],
  },
]

function stripDiacritics(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export function normalizeQuery(value: string) {
  return stripDiacritics(value).toLowerCase().replace(/\s+/g, ' ').trim()
}

function getSearchTerms(food: CuratedFoodItem) {
  return [food.name, food.category, food.servingSize, ...food.aliases]
    .filter((term): term is string => typeof term === 'string' && term.trim().length > 0)
    .map((term) => normalizeQuery(term))
}

function scoreTerm(term: string, query: string) {
  if (term === query) {
    return 100
  }

  const words = term.split(' ')
  if (words.includes(query)) {
    return 90
  }

  if (query.length > 2 && (term.startsWith(query) || words.some((word) => word.startsWith(query)))) {
    return 70
  }

  if (query.length > 2 && term.includes(query)) {
    return 40
  }

  return 0
}

export function searchLocalCurated(keyword: string): UsdaFoodItem[] {
  const query = normalizeQuery(keyword)
  if (!query) {
    return []
  }

  return CURATED_FOODS
    .map((food) => ({
      food,
      score: Math.max(...getSearchTerms(food).map((term) => scoreTerm(term, query))),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.food.name.localeCompare(right.food.name))
    .map((food) => {
      const { aliases, ...normalizedFood } = food.food
      void aliases

      return {
        ...normalizedFood,
        matchedKeyword: keyword,
      }
    })
}

export function rankAndFilterFoods(foods: UsdaFoodItem[], keyword: string) {
  const query = normalizeQuery(keyword)
  if (!query) {
    return foods.slice()
  }

  const scoredFoods = foods
    .filter((food) => normalizeQuery(food.name || '').length > 0)
    .map((food) => {
      const name = normalizeQuery(food.name)
      const category = normalizeQuery(food.category || '')
      const matchedKeyword = normalizeQuery(food.matchedKeyword || '')
      const source = normalizeQuery(food.searchSource || food.source || '')
      let score = 0

      if (name === query) {
        score += 100
      } else if (name.startsWith(query)) {
        score += 70
      } else if (name.includes(query)) {
        score += 40
      }

      if (category.includes(query)) {
        score += 10
      }

      if (matchedKeyword === query) {
        score += 95
      } else if (matchedKeyword.includes(query)) {
        score += 35
      }

      if (source.includes(query)) {
        score += 2
      }

      return { food, score }
    })

  return scoredFoods
    .sort((left, right) => right.score - left.score || left.food.name.localeCompare(right.food.name))
    .map(({ food }) => food)
}
