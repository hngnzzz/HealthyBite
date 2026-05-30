export interface WeightLog {
  id: number
  profileId: number
  weightKg: number
  loggedDate: string
  createdAt: string
}

export interface CreateWeightLogPayload {
  weightKg: number
  loggedDate: string
}
