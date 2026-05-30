import type { ApiResponse } from '../types/api'
import type { AuthSession, LoginPayload, RegisterPayload } from '../types/auth'
import axiosClient from '../utils/axiosClient'
import { sessionService } from './sessionService'

export const authService = {
  login(payload: LoginPayload) {
    return axiosClient.post<ApiResponse<AuthSession>>('/auth/login', payload)
  },

  register(payload: RegisterPayload) {
    return axiosClient.post<ApiResponse<AuthSession>>(
      '/auth/register',
      payload,
    )
  },

  async logout() {
    try {
      await axiosClient.post('/auth/logout')
    } catch {
      // ignore transport errors
    } finally {
      sessionService.logout()
    }
  },

  refresh() {
    return axiosClient.post<ApiResponse<AuthSession>>('/auth/refresh')
  },
}
