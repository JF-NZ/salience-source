import {
  eveningMoodOptions,
  optionLabel,
  quickAnxietyOptions,
  quickDepressionOptions,
  quickMoodOptions,
  quickWarningSignOptions,
  severityOptions,
  sleepDurationOptions,
  sleepQualityOptions,
  thinkingClarityOptions,
} from '../data/options'
import { displayDate, localDateKey, nextDateKey, rangeDateKeys } from './dates'
import type {
  AppData,
  EveningCheckIn,
  QuickCheckIn,
  SleepDuration,
  ThinkingClarity,
} from '../types'

export const wellbeingPatternMinimums = {
  pairedEntries: 7,
  groupEntries: 3,
} as const

export type WellbeingMetricKey =
  | 'sleepDuration'
  | 'sleepQuality'
  | 'mood'
  | 'anxiety'
  | 'depression'
  | 'nightmares'
  | 'warningSigns'
  | 'thinking'
  | 'medication'

export type WellbeingValueState = 'recorded' | 'none' | 'missing' | 'noted'

export interface WellbeingTrendDay {
  date: string
  label: string
  sleepDuration: number | null
  sleepDurationLabel: string | null
  sleepQuality: number | null
  sleepQualityLabel: string | null
  mood: number | null
  moodLabel: string | null
  anxiety: number | null
  anxietyLabel: string | null
  depression: number | null
  depressionLabel: string | null
  nightmareCount: number | null
  nightmareState: WellbeingValueState
  nightmareLabel: string | null
  warningSigns: number | null
  warningState: WellbeingValueState
  warningLabel: string | null
  thinking: number | null
  thinkingState: WellbeingValueState
  thinkingLabel: string | null
  medicationCount: number | null
}

export interface WellbeingDayMetric {
  key: WellbeingMetricKey
  label: string
  value: string
  state: WellbeingValueState
}

export interface NextDayPair {
  date: string
  nextDate: string
  x: number
  y: number
}

export interface GroupedPatternComparison {
  medianSleep: number | null
  shorter: number[]
  normalOrHigher: number[]
}

export interface WeeklyTrendComparison {
  key: WellbeingMetricKey
  label: string
  recent: { average: number | null; count: number }
  previous: { average: number | null; count: number }
}

const sleepDurationHours: Record<SleepDuration, number> = {
  UNDER_2: 1,
  TWO_TO_FOUR: 3,
  FIVE_TO_SIX: 5.5,
  SEVEN_TO_EIGHT: 7.5,
  EIGHT_PLUS: 8.5,
}

const sleepQualityScore = {
  VERY_POOR: 1,
  POOR: 2,
  FAIR: 3,
  GOOD: 4,
  EXCELLENT: 5,
} as const

const quickMoodScore = {
  VERY_LOW: 1,
  LOW: 2,
  MEH: 3,
  OKAY: 4,
  GOOD: 5,
} as const

const quickAnxietyScore = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  EXTREME: 4,
} as const

const quickDepressionScore = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
} as const

const quickWarningScore = {
  NONE: 0,
  MILD: 1,
  CONCERNING: 3,
  URGENT: 4,
} as const

const severityScore = {
  NONE: 0,
  MILD: 1,
  MODERATE: 2,
  SEVERE: 3,
  EXTREME: 4,
} as const

const psychosisWarningScore = {
  NOT_AT_ALL: 0,
  SLIGHTLY: 1,
  MODERATELY: 2,
  SIGNIFICANTLY: 3,
  EXTREMELY: 4,
} as const

const thinkingScore: Record<ThinkingClarity, number> = {
  CLEAR: 0,
  SLIGHTLY_SCATTERED: 1,
  NOTICEABLY_SCATTERED: 2,
  VERY_DIFFICULT: 3,
}

interface ScoredValue {
  value: number
  label: string
  updatedAt: string
}

const latestByDate = <T extends { date: string; updatedAt: string }>(entries: T[]) => {
  const result = new Map<string, T>()
  entries.forEach((entry) => {
    const current = result.get(entry.date)
    if (!current || entry.updatedAt > current.updatedAt) {
      result.set(entry.date, entry)
    }
  })
  return result
}

const latestQuickCheckInByDate = (entries: QuickCheckIn[]) => {
  const result = new Map<string, QuickCheckIn>()
  entries.forEach((entry) => {
    const current = result.get(entry.date)
    if (!current || entry.createdAt > current.createdAt) {
      result.set(entry.date, entry)
    }
  })
  return result
}

const completedEveningCheckIns = (entries: EveningCheckIn[]) =>
  entries.filter((entry) => entry.status !== 'DRAFT')

const selectMostRecent = (values: ScoredValue[]): ScoredValue | null =>
  values.reduce<ScoredValue | null>((latest, value) => !latest || value.updatedAt > latest.updatedAt ? value : latest, null)

const warningStateFor = (value: number | null): WellbeingValueState => {
  if (value === null) return 'missing'
  return value === 0 ? 'none' : 'recorded'
}

const warningLabelFor = (value: number) => {
  if (value === 0) return 'None noted'
  if (value === 1) return 'Mild'
  if (value === 2) return 'Moderate'
  if (value === 3) return 'Concerning'
  return 'Urgent'
}

export const buildWellbeingTrendDays = (data: AppData, start: string, end: string): WellbeingTrendDay[] => {
  if (!start || !end || start > end) return []

  const sleepEntries = latestByDate(data.sleepEntries)
  const eveningCheckIns = latestByDate(completedEveningCheckIns(data.eveningCheckIns))
  const quickCheckIns = latestQuickCheckInByDate(data.quickCheckIns)
  const nightmaresByDate = new Map<string, typeof data.nightmareEntries>()
  const medicationByDate = new Map<string, typeof data.benzodiazepineEntries>()

  data.nightmareEntries.forEach((entry) => {
    const date = localDateKey(new Date(entry.occurredAt))
    nightmaresByDate.set(date, [...(nightmaresByDate.get(date) ?? []), entry])
  })
  data.benzodiazepineEntries.forEach((entry) => {
    medicationByDate.set(entry.date, [...(medicationByDate.get(entry.date) ?? []), entry])
  })

  return rangeDateKeys(start, end).map((date) => {
    const sleep = sleepEntries.get(date)
    const checkIn = eveningCheckIns.get(date)
    const quick = quickCheckIns.get(date)
    const nightmareEntries = nightmaresByDate.get(date) ?? []
    const medicationEntries = medicationByDate.get(date) ?? []

    const sleepDuration = sleep
      ? { value: sleepDurationHours[sleep.durationCategory], label: optionLabel(sleepDurationOptions, sleep.durationCategory) }
      : quick
        ? { value: sleepDurationHours[quick.sleepDuration], label: optionLabel(sleepDurationOptions, quick.sleepDuration) }
        : null
    const sleepQuality = sleep
      ? { value: sleepQualityScore[sleep.quality], label: optionLabel(sleepQualityOptions, sleep.quality) }
      : null
    const mood = selectMostRecent([
      ...(checkIn?.moodRating ? [{ value: Number(checkIn.moodRating), label: optionLabel(eveningMoodOptions, checkIn.moodRating), updatedAt: checkIn.updatedAt }] : []),
      ...(quick ? [{ value: quickMoodScore[quick.mood], label: optionLabel(quickMoodOptions, quick.mood), updatedAt: quick.updatedAt }] : []),
    ])
    const anxiety = selectMostRecent([
      ...(checkIn ? [{ value: severityScore[checkIn.anxietySeverity], label: optionLabel(severityOptions, checkIn.anxietySeverity), updatedAt: checkIn.updatedAt }] : []),
      ...(quick ? [{ value: quickAnxietyScore[quick.anxiety], label: optionLabel(quickAnxietyOptions, quick.anxiety), updatedAt: quick.updatedAt }] : []),
    ])
    const depression = selectMostRecent([
      ...(checkIn ? [{ value: severityScore[checkIn.depressionSeverity], label: optionLabel(severityOptions, checkIn.depressionSeverity), updatedAt: checkIn.updatedAt }] : []),
      ...(quick ? [{ value: quickDepressionScore[quick.depression], label: optionLabel(quickDepressionOptions, quick.depression), updatedAt: quick.updatedAt }] : []),
    ])
    const warning = selectMostRecent([
      ...(checkIn ? [{
        value: Math.max(psychosisWarningScore[checkIn.suspiciousness], psychosisWarningScore[checkIn.unusualMeanings]),
        label: warningLabelFor(Math.max(psychosisWarningScore[checkIn.suspiciousness], psychosisWarningScore[checkIn.unusualMeanings])),
        updatedAt: checkIn.updatedAt,
      }] : []),
      ...(quick ? [{ value: quickWarningScore[quick.warningSigns], label: optionLabel(quickWarningSignOptions, quick.warningSigns), updatedAt: quick.updatedAt }] : []),
    ])
    const thinking = checkIn
      ? { value: thinkingScore[checkIn.thinkingClarity], label: optionLabel(thinkingClarityOptions, checkIn.thinkingClarity) }
      : null

    const nightmare = (() => {
      if (nightmareEntries.length > 0) {
        return { count: nightmareEntries.length, state: 'recorded' as const, label: `${nightmareEntries.length}` }
      }
      if (!sleep) {
        return { count: null, state: 'missing' as const, label: null }
      }
      if (sleep.disruptions.includes('NIGHTMARES')) {
        return { count: 1, state: 'noted' as const, label: 'Noted' }
      }
      return { count: 0, state: 'none' as const, label: '0' }
    })()

    return {
      date,
      label: displayDate(date),
      sleepDuration: sleepDuration?.value ?? null,
      sleepDurationLabel: sleepDuration?.label ?? null,
      sleepQuality: sleepQuality?.value ?? null,
      sleepQualityLabel: sleepQuality?.label ?? null,
      mood: mood?.value ?? null,
      moodLabel: mood?.label ?? null,
      anxiety: anxiety?.value ?? null,
      anxietyLabel: anxiety?.label ?? null,
      depression: depression?.value ?? null,
      depressionLabel: depression?.label ?? null,
      nightmareCount: nightmare.count,
      nightmareState: nightmare.state,
      nightmareLabel: nightmare.label,
      warningSigns: warning?.value ?? null,
      warningState: warningStateFor(warning?.value ?? null),
      warningLabel: warning?.value === 0 ? 'None noted' : warning?.label ?? null,
      thinking: thinking?.value ?? null,
      thinkingState: thinking ? 'recorded' : 'missing',
      thinkingLabel: thinking?.label ?? null,
      medicationCount: medicationEntries.length > 0 ? medicationEntries.length : null,
    }
  })
}

export const wellbeingDayMetrics = (day: WellbeingTrendDay, includeMedication = false): WellbeingDayMetric[] => {
  const metrics: WellbeingDayMetric[] = [
    {
      key: 'sleepDuration',
      label: 'Sleep',
      value: day.sleepDuration === null ? 'Not logged' : `${day.sleepDuration.toFixed(1)} hrs (${day.sleepDurationLabel})`,
      state: day.sleepDuration === null ? 'missing' : 'recorded',
    },
    {
      key: 'sleepQuality',
      label: 'Quality',
      value: day.sleepQuality === null ? 'Not logged' : `${day.sleepQuality}/5 (${day.sleepQualityLabel})`,
      state: day.sleepQuality === null ? 'missing' : 'recorded',
    },
    {
      key: 'mood',
      label: 'Mood',
      value: day.mood === null ? 'Not logged' : `${day.mood}/5 (${day.moodLabel})`,
      state: day.mood === null ? 'missing' : 'recorded',
    },
    {
      key: 'anxiety',
      label: 'Anxiety',
      value: day.anxiety === null ? 'Not logged' : `${day.anxiety}/4 (${day.anxietyLabel})`,
      state: day.anxiety === null ? 'missing' : day.anxiety === 0 ? 'none' : 'recorded',
    },
    {
      key: 'depression',
      label: 'Depression',
      value: day.depression === null ? 'Not logged' : `${day.depression}/4 (${day.depressionLabel})`,
      state: day.depression === null ? 'missing' : day.depression === 0 ? 'none' : 'recorded',
    },
    {
      key: 'nightmares',
      label: 'Nightmares',
      value: day.nightmareState === 'missing' ? 'Not logged' : day.nightmareState === 'noted' ? 'Noted (count not logged)' : `${day.nightmareCount}`,
      state: day.nightmareState,
    },
    {
      key: 'warningSigns',
      label: 'Warning signs',
      value: day.warningSigns === null ? 'Not logged' : day.warningLabel ?? `${day.warningSigns}/4`,
      state: day.warningState,
    },
    {
      key: 'thinking',
      label: 'Thinking',
      value: day.thinking === null ? 'Not logged' : day.thinkingLabel ?? `${day.thinking}/3`,
      state: day.thinkingState,
    },
  ]

  if (includeMedication) {
    metrics.push({
      key: 'medication',
      label: 'Medication',
      value: day.medicationCount === null ? 'Not logged' : `${day.medicationCount} ${day.medicationCount === 1 ? 'entry' : 'entries'}`,
      state: day.medicationCount === null ? 'missing' : 'recorded',
    })
  }

  return metrics
}

const numericValue = (value: number | null): value is number => value !== null && Number.isFinite(value)

const pairNextDayValues = (
  days: WellbeingTrendDay[],
  x: (day: WellbeingTrendDay) => number | null,
  y: (day: WellbeingTrendDay) => number | null,
): NextDayPair[] => {
  const byDate = new Map(days.map((day) => [day.date, day]))
  return days.flatMap((day) => {
    const nextDate = nextDateKey(day.date)
    const nextDay = byDate.get(nextDate)
    const xValue = x(day)
    const yValue = nextDay ? y(nextDay) : null
    return numericValue(xValue) && numericValue(yValue) ? [{ date: day.date, nextDate, x: xValue, y: yValue }] : []
  })
}

export const sleepMoodPairs = (days: WellbeingTrendDay[]) =>
  pairNextDayValues(days, (day) => day.sleepDuration, (day) => day.mood)

export const nightmareAnxietyPairs = (days: WellbeingTrendDay[]) =>
  pairNextDayValues(days, (day) => day.nightmareCount, (day) => day.anxiety)

export const averageKnown = (values: Array<number | null>) => {
  const known = values.filter(numericValue)
  return known.length === 0 ? null : known.reduce((sum, value) => sum + value, 0) / known.length
}

export const median = (values: number[]) => {
  if (values.length === 0) return null
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export const depressionAfterSleepGroups = (days: WellbeingTrendDay[]): GroupedPatternComparison => {
  const pairs = pairNextDayValues(days, (day) => day.sleepDuration, (day) => day.depression)
  const medianSleep = median(pairs.map((pair) => pair.x))
  if (medianSleep === null) return { medianSleep: null, shorter: [], normalOrHigher: [] }

  return {
    medianSleep,
    shorter: pairs.filter((pair) => pair.x < medianSleep).map((pair) => pair.y),
    normalOrHigher: pairs.filter((pair) => pair.x >= medianSleep).map((pair) => pair.y),
  }
}

export const linearAssociation = (pairs: NextDayPair[]) => {
  if (pairs.length < wellbeingPatternMinimums.pairedEntries) return null
  const xMean = pairs.reduce((sum, pair) => sum + pair.x, 0) / pairs.length
  const yMean = pairs.reduce((sum, pair) => sum + pair.y, 0) / pairs.length
  const numerator = pairs.reduce((sum, pair) => sum + (pair.x - xMean) * (pair.y - yMean), 0)
  const xVariance = pairs.reduce((sum, pair) => sum + (pair.x - xMean) ** 2, 0)
  const yVariance = pairs.reduce((sum, pair) => sum + (pair.y - yMean) ** 2, 0)
  const denominator = Math.sqrt(xVariance * yVariance)
  return denominator === 0 ? 0 : numerator / denominator
}

export const weeklyTrendComparisons = (days: WellbeingTrendDay[]): WeeklyTrendComparison[] => {
  const previous = days.slice(-14, -7)
  const recent = days.slice(-7)
  const metrics: Array<{ key: WellbeingMetricKey; label: string; values: (day: WellbeingTrendDay) => number | null }> = [
    { key: 'sleepDuration', label: 'Sleep', values: (day) => day.sleepDuration },
    { key: 'mood', label: 'Mood', values: (day) => day.mood },
    { key: 'anxiety', label: 'Anxiety', values: (day) => day.anxiety },
    { key: 'depression', label: 'Depression', values: (day) => day.depression },
    { key: 'nightmares', label: 'Nightmares', values: (day) => day.nightmareCount },
  ]

  return metrics.map((metric) => {
    const recentValues = recent.map(metric.values).filter(numericValue)
    const previousValues = previous.map(metric.values).filter(numericValue)
    return {
      key: metric.key,
      label: metric.label,
      recent: { average: averageKnown(recentValues), count: recentValues.length },
      previous: { average: averageKnown(previousValues), count: previousValues.length },
    }
  })
}

export const hasEnoughPairs = (count: number) => count >= wellbeingPatternMinimums.pairedEntries

export const hasEnoughGroups = (leftCount: number, rightCount: number) =>
  leftCount >= wellbeingPatternMinimums.groupEntries && rightCount >= wellbeingPatternMinimums.groupEntries
