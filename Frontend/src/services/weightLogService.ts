import type { ApiResponse } from '../types/api'
import type { CreateWeightLogPayload, WeightLog } from '../types/weightLog'
import axiosClient from '../utils/axiosClient'

export const weightLogService = {
  getByProfile(profileId: number) {
    return axiosClient.get<ApiResponse<WeightLog[]>>(`/weightlogs/profile/${profileId}`)
  },

  create(profileId: number, payload: CreateWeightLogPayload) {
    return axiosClient.post<ApiResponse<WeightLog>>(`/weightlogs/profile/${profileId}`, payload)
  },

  remove(weightLogId: number) {
    return axiosClient.delete<ApiResponse<null>>(`/weightlogs/${weightLogId}`)
  },
}
