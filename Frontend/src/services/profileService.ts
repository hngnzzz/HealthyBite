import type { ApiResponse } from '../types/api'
import type { CreateProfilePayload, Profile, UpdateProfilePayload } from '../types/profile'
import axiosClient from '../utils/axiosClient'

export const profileService = {
  getMyProfiles() {
    return axiosClient.get<ApiResponse<Profile[]>>('/profiles/me')
  },

  getProfilesByUserId(userId: number) {
    void userId
    return axiosClient.get<ApiResponse<Profile[]>>('/profiles/me')
  },

  getProfileById(profileId: number) {
    return axiosClient.get<ApiResponse<Profile>>(`/profiles/${profileId}`)
  },

  createProfile(payload: CreateProfilePayload) {
    return axiosClient.post<ApiResponse<Profile>>('/profiles', payload)
  },

  updateProfile(profileId: number, payload: UpdateProfilePayload) {
    return axiosClient.put<ApiResponse<null>>(`/profiles/${profileId}`, payload)
  },

  deleteProfile(profileId: number) {
    return axiosClient.delete<ApiResponse<null>>(`/profiles/${profileId}`)
  },
}
