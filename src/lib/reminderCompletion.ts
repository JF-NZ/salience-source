import { localDateKey, previousDateKey } from './dates'
import type { AppData } from '../types'

export const sleepEntryForLastNight = (data: AppData, now = new Date()) => {
  const yesterday = previousDateKey(now)
  const today = localDateKey(now)

  // Older versions saved “Sleep last night” against the wake-up date. Keep those entries useful.
  return data.sleepEntries.find((entry) => entry.date === yesterday)
    ?? data.sleepEntries.find((entry) => entry.date === today)
}

export const fullDayLogForLastNight = (data: AppData, now = new Date()) => {
  const today = localDateKey(now)
  const yesterday = previousDateKey(now)
  const relevantDates = new Set([yesterday, today])

  return data.eveningCheckIns.some((entry) =>
    relevantDates.has(entry.date) && entry.status !== 'DRAFT')
    || data.journalEntries.some((entry) => relevantDates.has(localDateKey(new Date(entry.createdAt))))
}

export const reminderCompletionForData = (data: AppData, now = new Date()) => {
  const today = localDateKey(now)
  const sleepEntry = Boolean(sleepEntryForLastNight(data, now))
  const eveningCheckIn = data.eveningCheckIns.some((entry) => entry.date === today && entry.status === 'COMPLETE')
  const quickCheckIn = data.quickCheckIns.some((entry) => entry.date === today)

  return {
    // An evening check-in or journal plus last-night sleep is a complete day record.
    morningCheckIn: quickCheckIn || (sleepEntry && fullDayLogForLastNight(data, now)),
    sleepEntry,
    eveningCheckIn,
  }
}
