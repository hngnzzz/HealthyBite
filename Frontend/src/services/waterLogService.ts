export interface WaterLogEntry {
  id: string
  userId: number
  profileId: number
  date: string
  amountMl: number
  loggedAt: string
}

const STORAGE_KEY = 'waterLogEntries'

function readEntries() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return [] as WaterLogEntry[]
  }

  try {
    return JSON.parse(raw) as WaterLogEntry[]
  } catch {
    return []
  }
}

function saveEntries(entries: WaterLogEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export const waterLogService = {
  getEntriesForDate(userId: number, profileId: number, date: string) {
    return readEntries().filter((entry) => entry.userId === userId && entry.profileId === profileId && entry.date === date)
  },

  getTotalForDate(userId: number, profileId: number, date: string) {
    return this.getEntriesForDate(userId, profileId, date).reduce((total, entry) => total + entry.amountMl, 0)
  },

  addEntry(userId: number, profileId: number, date: string, amountMl: number) {
    const normalizedAmount = Math.max(0, Math.round(amountMl))
    const entries = readEntries()
    const nextEntry: WaterLogEntry = {
      id: `water-${Date.now()}`,
      userId,
      profileId,
      date,
      amountMl: normalizedAmount,
      loggedAt: new Date().toISOString(),
    }

    saveEntries([nextEntry, ...entries].slice(0, 500))
    return nextEntry
  },
}
