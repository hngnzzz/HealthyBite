import axios from 'axios'
import { ApiClientError, type ApiErrorResponse, type ApiResponse } from '../types/api'
import type { AuthSession } from '../types/auth'
import { sessionService } from '../services/sessionService'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5299/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5299/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

function shouldAttemptRefresh(url?: string) {
  const normalizedUrl = String(url ?? '')

  return (
    normalizedUrl !== '' &&
    !normalizedUrl.includes('/auth/login') &&
    !normalizedUrl.includes('/auth/register') &&
    !normalizedUrl.includes('/auth/refresh')
  )
}

axiosClient.interceptors.request.use((config) => {
  const token = sessionService.getAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    const retryRequest = originalRequest as typeof originalRequest & { __isRetryRequest?: boolean } | undefined

    if (status === 401 && retryRequest && retryRequest.__isRetryRequest) {
      sessionService.logout()
    }

    if (status === 401 && retryRequest && !retryRequest.__isRetryRequest && shouldAttemptRefresh(retryRequest.url)) {
      retryRequest.__isRetryRequest = true

      try {
        const refreshResponse = await refreshClient.post<ApiResponse<AuthSession>>('/auth/refresh')
        const refreshedSession = refreshResponse.data?.data

        if (refreshedSession?.accessToken) {
          sessionService.saveUser({
            id: refreshedSession.id,
            fullName: refreshedSession.fullName,
            email: refreshedSession.email,
            createdAt: refreshedSession.createdAt,
            accessTokenExpiresAt: refreshedSession.accessTokenExpiresAt,
          })
          sessionService.saveAccessToken(refreshedSession.accessToken)
          retryRequest.headers = {
            ...retryRequest.headers,
            Authorization: `Bearer ${refreshedSession.accessToken}`,
          }

          return axiosClient(retryRequest)
        }
      } catch {
        sessionService.logout()
      }
    }

    const apiError = error.response?.data as ApiErrorResponse | undefined
    const message = apiError?.message || error.message || 'Request failed'
    const responseStatus = apiError?.status ?? status
    const errors = apiError?.errors

    return Promise.reject(new ApiClientError(message, responseStatus, errors))
  },
)

export default axiosClient
