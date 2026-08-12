import { dateTimeInputToIso } from './dates'
import type { NightmareEntry, SleepEntry } from '../types'

export const sleepEntryHasNightmares = (entry: Pick<SleepEntry, 'disruptions'>) =>
  entry.disruptions.includes('NIGHTMARES')

export const createGenericNightmareEntry = (
  sleepEntry: Pick<SleepEntry, 'id' | 'date'>,
  id: string,
  timestamp: string,
): NightmareEntry => ({
  id,
  // A stable early-morning placeholder keeps the generic record on the same graph day as its Sleep entry.
  occurredAt: dateTimeInputToIso(`${sleepEntry.date}T03:00`),
  sleepEntryId: sleepEntry.id,
  intensity: 'MODERATE',
  wakeReactions: [],
  afterWaking: [],
  createdAt: timestamp,
  updatedAt: timestamp,
})
