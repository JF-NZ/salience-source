import { daysAgoRange, rangeDateKeys } from './dates'
import type { BenzodiazepineEntry, BenzodiazepineMedication } from '../types'

export const medicationTrendRangeOptions = [7, 14, 30] as const

export type MedicationTrendRange = typeof medicationTrendRangeOptions[number]

export const medicationTrendSegmentCounts: Record<BenzodiazepineMedication, 2 | 4> = {
  CLONAZEPAM: 4,
  BENZODIAZEPINE: 4,
  LORAZEPAM: 2,
  DIAZEPAM: 2,
}

export interface MedicationUseDay {
  date: string
  medications: Partial<Record<BenzodiazepineMedication, MedicationDailyUse>>
}

export interface MedicationDailyUse {
  entries: BenzodiazepineEntry[]
  tabletPortions: number
}

const medicationForTrendEntry = (entry: BenzodiazepineEntry): BenzodiazepineMedication =>
  entry.medication ?? 'CLONAZEPAM'

export const buildMedicationUseTrendDays = (
  entries: BenzodiazepineEntry[],
  range: MedicationTrendRange,
  today = new Date(),
): MedicationUseDay[] => {
  const { start, end } = daysAgoRange(range, today)
  const entriesByDate = new Map<string, BenzodiazepineEntry[]>()

  entries.forEach((entry) => {
    entriesByDate.set(entry.date, [...(entriesByDate.get(entry.date) ?? []), entry])
  })

  return rangeDateKeys(start, end).map((date) => {
    const medicationEntries = entriesByDate.get(date) ?? []
    const medications = medicationEntries.reduce<Partial<Record<BenzodiazepineMedication, MedicationDailyUse>>>(
      (result, entry) => {
        const medication = medicationForTrendEntry(entry)
        const existing = result[medication] ?? { entries: [], tabletPortions: 0 }
        const segmentCount = medicationTrendSegmentCounts[medication]
        result[medication] = {
          entries: [...existing.entries, entry].sort((left, right) => left.takenAt.localeCompare(right.takenAt)),
          tabletPortions: existing.tabletPortions + entry.quarterUnits / segmentCount,
        }
        return result
      },
      {},
    )

    return { date, medications }
  })
}
