export interface ApiResponse<T> {
  data: T
  message: string
  success?: boolean
  status?: number
}

export interface ApiErrorResponse {
  message: string
  status: number
  errors?: Record<string, string[]>
}

export class ApiClientError extends Error {
  status?: number
  errors?: Record<string, string[]>

  constructor(message: string, status?: number, errors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.errors = errors
  }
}
