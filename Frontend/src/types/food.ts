export interface FoodItem {
  id: number
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  servingSize?: string
  category?: string
  source?: string
}

export interface UsdaFoodItem {
  fdcId: number
  name: string
  dataType: string
  calories: number
  protein: number
  carbs: number
  fat: number
  servingSize?: string
  category?: string
  source?: string
  imageUrl?: string
  fatSecretFoodId?: string
  matchedKeyword?: string
  searchSource?: string
}

export interface SearchFoodParams {
  keyword: string
}
