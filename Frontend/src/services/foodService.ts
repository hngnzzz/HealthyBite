import type { ApiResponse } from '../types/api'
import type { FoodItem, SearchFoodParams, UsdaFoodItem } from '../types/food'
import axiosClient from '../utils/axiosClient'

export const foodService = {
  searchFoods(params: SearchFoodParams) {
    return axiosClient.get<ApiResponse<FoodItem[]>>('/fooditems/search', {
      params: { keyword: params.keyword },
    })
  },

  getFoods(page = 1, pageSize = 20) {
    return axiosClient.get<ApiResponse<FoodItem[]>>('/fooditems', {
      params: { page, pageSize },
    })
  },

  getFoodById(id: number) {
    return axiosClient.get<ApiResponse<FoodItem>>(`/fooditems/${id}`)
  },

  searchUsdaFoods(params: SearchFoodParams) {
    return axiosClient.get<ApiResponse<UsdaFoodItem[]>>('/fooditems/search/usda', {
      params: { keyword: params.keyword },
    })
  },

  searchSmartFoods(params: SearchFoodParams) {
    return axiosClient.get<ApiResponse<UsdaFoodItem[]>>('/fooditems/search/smart', {
      params: { keyword: params.keyword },
    })
  },

  getUsdaFoodById(fdcId: number) {
    return axiosClient.get<ApiResponse<UsdaFoodItem>>(`/fooditems/usda/${fdcId}`)
  },
}
