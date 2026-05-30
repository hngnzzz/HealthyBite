export function toLocalDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateInputValue(value: string): Date {
  return new Date(`${value}T00:00:00`)
}

export function shiftDateInputValue(value: string, days: number): string {
  const date = parseDateInputValue(value)
  date.setDate(date.getDate() + days)
  return toLocalDateInputValue(date)
}

export function eachDateInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const current = parseDateInputValue(startDate)
  const end = parseDateInputValue(endDate)

  while (current <= end) {
    dates.push(toLocalDateInputValue(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}
