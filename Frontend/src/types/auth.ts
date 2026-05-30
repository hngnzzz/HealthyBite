export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  fullName: string
  phoneNumber?: string
  email: string
  password: string
}

export interface AuthUser {
  id: number
  fullName: string
  email: string
  createdAt?: string
  accessToken?: string
  accessTokenExpiresAt?: string
}

export type AuthSession = AuthUser
