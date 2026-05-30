import type { ApiResponse } from '../types/api'
import { normalizeMealType, type CreateMealLogPayload, type MealLog, type UpdateMealLogPayload } from '../types/mealLog'
import axiosClient from '../utils/axiosClient'

function sanitizeMealLog(mealLog: MealLog): MealLog {
  return {
    ...mealLog,
    mealType: normalizeMealType(mealLog.mealType),
  }
}

function sanitizePayload<T extends CreateMealLogPayload | UpdateMealLogPayload>(payload: T): T {
  return {
    ...payload,
    mealType: normalizeMealType(payload.mealType),
  }
}

export const mealLogService = {
  async getMealLogsByProfileId(profileId: number) {
    const response = await axiosClient.get<ApiResponse<MealLog[]>>(`/MealLogs/profile/${profileId}`)
    return {
      ...response,
      data: {
        ...response.data,
        data: response.data.data.map(sanitizeMealLog),
      },
    }
  },

  async getMealLogById(mealLogId: number) {
    const response = await axiosClient.get<ApiResponse<MealLog>>(`/MealLogs/${mealLogId}`)
    return {
      ...response,
      data: {
        ...response.data,
        data: sanitizeMealLog(response.data.data),
      },
    }
  },

  createMealLog(payload: CreateMealLogPayload) {
    return axiosClient
      .post<ApiResponse<MealLog>>('/MealLogs', sanitizePayload(payload))
      .then((response) => ({
        ...response,
        data: {
          ...response.data,
          data: sanitizeMealLog(response.data.data),
        },
      }))
  },

  updateMealLog(mealLogId: number, payload: UpdateMealLogPayload) {
    return axiosClient
      .put<ApiResponse<MealLog>>(`/MealLogs/${mealLogId}`, sanitizePayload(payload))
      .then((response) => ({
        ...response,
        data: {
          ...response.data,
          data: sanitizeMealLog(response.data.data),
        },
      }))
  },

  removeMealLog(mealLogId: number) {
    return axiosClient.delete<ApiResponse<null>>(`/MealLogs/${mealLogId}`)
  },
}
