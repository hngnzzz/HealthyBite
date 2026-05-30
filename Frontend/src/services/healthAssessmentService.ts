import type { ApiResponse } from '../types/api'
import type { HealthAssessmentInput, PediatricHealthAssessment } from '../types/health'
import axiosClient from '../utils/axiosClient'

export const healthAssessmentService = {
  async assessPediatricGrowth(input: HealthAssessmentInput) {
    const response = await axiosClient.post<ApiResponse<PediatricHealthAssessment>>(
      '/health-assessment/pediatric',
      input,
    )

    return response.data.data
  },
}
