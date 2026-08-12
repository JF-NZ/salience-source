import { parseISO, subDays } from 'date-fns'
import {
  anxietyContributorOptions,
  depressionContributorOptions,
  depressionSymptomOptions,
  eveningMoodOptions,
  functioningOptions,
  nightmareAfterOptions,
  nightmareIntensityOptions,
  nightmareWakeOptions,
  optionLabel,
  perceptualExperienceOptions,
  psychosisSeverityOptions,
  quickAnxietyOptions,
  quickDepressionOptions,
  quickMoodOptions,
  quickWarningSignOptions,
  severityOptions,
  sleepDisruptionOptions,
  sleepDurationOptions,
  sleepQualityOptions,
  thinkingClarityOptions,
  type Option,
} from '../data/options'
import type {
  AnxietyContributor,
  AppData,
  DepressionContributor,
  DepressionSymptom,
  EveningCheckIn,
  FunctioningItem,
  NightmareAfterWaking,
  NightmareEntry,
  NightmareIntensity,
  NightmareWakeReaction,
  PerceptualExperience,
  QuickCheckIn,
  SleepDisruption,
  SleepEntry,
} from '../types'
import { dateInRange, isoInDateRange, localDateKey, rangeDateKeys } from './dates'
import { countArrayValues, countValues, generateReport, type ReportOptions, type ReportSummary } from './report'

export const reportEvidenceRules = {
  veryLimitedMaximum: 2,
  limitedMaximum: 4,
  simplePeriodMinimum: 5,
  comparisonMinimum: 3,
  relationshipMinimum: 7,
  comparisonGroupMinimum: 3,
} as const

export type ReportCoverageLevel = 'no-data' | 'very-limited' | 'limited' | 'sufficient'
export type ReportMetricDirection = 'higher-better' | 'higher-worse' | 'neutral'
export type ReportValueType = 'ordinal' | 'categorical' | 'boolean' | 'count' | 'text'
export type ReportSourceForm = 'Quick check-in' | 'Evening check-in' | 'Sleep entry' | 'Nightmare log'

export interface ReportMetricDefinition {
  id: string
  displayLabel: string
  sourceForm: ReportSourceForm
  orderedValues: readonly string[]
  valueType: ReportValueType
  direction: ReportMetricDirection
  higherSeverityValues: readonly string[]
  zeroIsRecorded: boolean
  noneIsRecorded: boolean
  allowsNotApplicable: boolean
  minimumData: {
    periodSummary: number
    comparison: number
  }
  trendCalculation: 'ordinal-median' | 'distribution' | 'count'
  safeLanguageTemplate: string
}

const metricDefinition = (
  definition: Omit<ReportMetricDefinition, 'minimumData'>,
): ReportMetricDefinition => ({
  ...definition,
  minimumData: {
    periodSummary: reportEvidenceRules.simplePeriodMinimum,
    comparison: reportEvidenceRules.comparisonMinimum,
  },
})

export const reportMetricDefinitions: readonly ReportMetricDefinition[] = [
  metricDefinition({
    id: 'quick-mood',
    displayLabel: 'Mood today',
    sourceForm: 'Quick check-in',
    orderedValues: quickMoodOptions.map((option) => option.value),
    valueType: 'ordinal',
    direction: 'higher-better',
    higherSeverityValues: ['VERY_LOW', 'LOW'],
    zeroIsRecorded: false,
    noneIsRecorded: false,
    allowsNotApplicable: false,
    trendCalculation: 'ordinal-median',
    safeLanguageTemplate: 'Mood today was recorded as {value} in {count} quick check-ins.',
  }),
  metricDefinition({
    id: 'quick-anxiety',
    displayLabel: 'Quick anxiety',
    sourceForm: 'Quick check-in',
    orderedValues: quickAnxietyOptions.map((option) => option.value),
    valueType: 'ordinal',
    direction: 'higher-worse',
    higherSeverityValues: ['HIGH', 'EXTREME'],
    zeroIsRecorded: false,
    noneIsRecorded: false,
    allowsNotApplicable: false,
    trendCalculation: 'ordinal-median',
    safeLanguageTemplate: 'Anxiety was recorded as {value} in {count} quick check-ins.',
  }),
  metricDefinition({
    id: 'quick-depression',
    displayLabel: 'Quick depression',
    sourceForm: 'Quick check-in',
    orderedValues: quickDepressionOptions.map((option) => option.value),
    valueType: 'ordinal',
    direction: 'higher-worse',
    higherSeverityValues: ['HIGH'],
    zeroIsRecorded: false,
    noneIsRecorded: false,
    allowsNotApplicable: false,
    trendCalculation: 'ordinal-median',
    safeLanguageTemplate: 'Depression was recorded as {value} in {count} quick check-ins.',
  }),
  metricDefinition({
    id: 'quick-warning-signs',
    displayLabel: 'Quick warning signs',
    sourceForm: 'Quick check-in',
    orderedValues: quickWarningSignOptions.map((option) => option.value),
    valueType: 'ordinal',
    direction: 'higher-worse',
    higherSeverityValues: ['CONCERNING', 'URGENT'],
    zeroIsRecorded: false,
    noneIsRecorded: true,
    allowsNotApplicable: false,
    trendCalculation: 'distribution',
    safeLanguageTemplate: 'Warning signs were recorded as {value} in {count} quick check-ins.',
  }),
  metricDefinition({
    id: 'evening-mood',
    displayLabel: 'Mood today',
    sourceForm: 'Evening check-in',
    orderedValues: eveningMoodOptions.map((option) => option.value),
    valueType: 'ordinal',
    direction: 'higher-better',
    higherSeverityValues: ['1', '2'],
    zeroIsRecorded: false,
    noneIsRecorded: false,
    allowsNotApplicable: false,
    trendCalculation: 'ordinal-median',
    safeLanguageTemplate: 'Evening mood was recorded as {value} on {count} completed check-ins.',
  }),
  metricDefinition({
    id: 'evening-anxiety',
    displayLabel: 'Anxiety',
    sourceForm: 'Evening check-in',
    orderedValues: severityOptions.map((option) => option.value),
    valueType: 'ordinal',
    direction: 'higher-worse',
    higherSeverityValues: ['SEVERE', 'EXTREME'],
    zeroIsRecorded: false,
    noneIsRecorded: true,
    allowsNotApplicable: false,
    trendCalculation: 'ordinal-median',
    safeLanguageTemplate: 'Anxiety was recorded as {value} on {count} completed evening check-ins.',
  }),
  metricDefinition({
    id: 'evening-depression',
    displayLabel: 'Depression',
    sourceForm: 'Evening check-in',
    orderedValues: severityOptions.map((option) => option.value),
    valueType: 'ordinal',
    direction: 'higher-worse',
    higherSeverityValues: ['SEVERE', 'EXTREME'],
    zeroIsRecorded: false,
    noneIsRecorded: true,
    allowsNotApplicable: false,
    trendCalculation: 'ordinal-median',
    safeLanguageTemplate: 'Depression was recorded as {value} on {count} completed evening check-ins.',
  }),
  metricDefinition({
    id: 'sleep-duration',
    displayLabel: 'Sleep duration',
    sourceForm: 'Sleep entry',
    orderedValues: sleepDurationOptions.map((option) => option.value),
    valueType: 'ordinal',
    direction: 'neutral',
    higherSeverityValues: [],
    zeroIsRecorded: false,
    noneIsRecorded: false,
    allowsNotApplicable: false,
    trendCalculation: 'ordinal-median',
    safeLanguageTemplate: 'Sleep duration was typically {value} across {count} completed sleep entries.',
  }),
  metricDefinition({
    id: 'sleep-quality',
    displayLabel: 'Sleep quality',
    sourceForm: 'Sleep entry',
    orderedValues: sleepQualityOptions.map((option) => option.value),
    valueType: 'ordinal',
    direction: 'higher-better',
    higherSeverityValues: ['VERY_POOR', 'POOR'],
    zeroIsRecorded: false,
    noneIsRecorded: false,
    allowsNotApplicable: false,
    trendCalculation: 'ordinal-median',
    safeLanguageTemplate: 'Sleep quality was typically {value} across {count} completed sleep entries.',
  }),
  metricDefinition({
    id: 'suspiciousness',
    displayLabel: 'Suspiciousness',
    sourceForm: 'Evening check-in',
    orderedValues: psychosisSeverityOptions.map((option) => option.value),
    valueType: 'ordinal',
    direction: 'higher-worse',
    higherSeverityValues: ['SIGNIFICANTLY', 'EXTREMELY'],
    zeroIsRecorded: false,
    noneIsRecorded: true,
    allowsNotApplicable: false,
    trendCalculation: 'distribution',
    safeLanguageTemplate: 'Suspiciousness was recorded as {value} on {count} completed check-ins.',
  }),
  metricDefinition({
    id: 'thinking-clarity',
    displayLabel: 'Thinking clarity',
    sourceForm: 'Evening check-in',
    orderedValues: thinkingClarityOptions.map((option) => option.value),
    valueType: 'ordinal',
    direction: 'higher-worse',
    higherSeverityValues: ['VERY_DIFFICULT'],
    zeroIsRecorded: false,
    noneIsRecorded: false,
    allowsNotApplicable: false,
    trendCalculation: 'distribution',
    safeLanguageTemplate: 'Thinking clarity was recorded as {value} on {count} completed check-ins.',
  }),
  metricDefinition({
    id: 'nightmare-events',
    displayLabel: 'Nightmare events',
    sourceForm: 'Nightmare log',
    orderedValues: [],
    valueType: 'count',
    direction: 'neutral',
    higherSeverityValues: [],
    zeroIsRecorded: true,
    noneIsRecorded: false,
    allowsNotApplicable: false,
    trendCalculation: 'count',
    safeLanguageTemplate: '{count} nightmare events were logged during the selected period.',
  }),
] as const

export interface ReportEvidenceReference {
  sourceForm: ReportSourceForm
  metricId: string
  dates: string[]
  numerator?: number
  denominator?: number
  distribution?: Record<string, number>
}

export interface SummaryFinding {
  id: string
  category: 'coverage' | 'symptom' | 'change' | 'sleep' | 'functioning' | 'contributor' | 'nightmare' | 'limitation'
  priority: number
  statement: string
  evidence: ReportEvidenceReference[]
  numerator?: number
  denominator?: number
  dates: { start: string; end: string }
  sourceForm: ReportSourceForm | 'Multiple sources'
  confidence: ReportCoverageLevel
  limitations: string[]
  safeDisplayVariant: 'standard' | 'important' | 'protective' | 'limited'
}

export interface ReportCoverageItem {
  id: 'evening' | 'sleep' | 'quick' | 'nightmare' | 'journal'
  label: string
  completed: number
  denominator?: number
  entryCount: number
  level: ReportCoverageLevel
  display: string
  detail: string
}

export interface ReportDistributionRow {
  value: string
  label: string
  count: number
}

export interface ReportComparison {
  id: string
  label: string
  result: 'higher' | 'lower' | 'similar' | 'better' | 'worse'
  display: string
  statement: string
  currentCount: number
  previousCount: number
  currentTypical: string
  previousTypical: string
  evidence: ReportEvidenceReference[]
}

export interface ReportKeyMeasure {
  id: 'anxiety' | 'depression' | 'sleep'
  label: string
  sourceLabel: string
  entries: number
  latest: string
  typical: string
  higherSeverityLabel?: string
  higherSeverityCount?: number
  comparison?: ReportComparison
  distribution: ReportDistributionRow[]
  accessibleSummary: string
}

export interface ReportFrequencyRow {
  value: string
  label: string
  count: number
  denominator: number
}

export interface ContributorComparisonRow {
  label: string
  anxietyCount: number
  depressionCount: number
  denominator: number
}

export interface NightmareReportSemantics {
  eventCount: number
  detailedLogCount: number
  genericSleepLinkedCount: number
  sleepDisruptionDays: number
  explicitNoNightmareDays: number
  unansweredSleepEntries: number
  statement: string
}

export interface ReportIncludedContent {
  included: string[]
  excluded: string[]
  summary: string[]
}

export interface ScopedRawReportData {
  quickCheckIns: Array<Record<string, unknown>>
  eveningCheckIns: Array<Record<string, unknown>>
  sleepEntries: Array<Record<string, unknown>>
  nightmareEntries: Array<Record<string, unknown>>
  journalEntries: Array<Record<string, unknown>>
}

export interface DetailedReportDistributions {
  sleepDisruptions: Record<SleepDisruption, number>
  anxietyContributors: Record<AnxietyContributor, number>
  depressionContributors: Record<DepressionContributor, number>
  depressionSymptoms: Record<DepressionSymptom, number>
  perceptualExperiences: Record<PerceptualExperience, number>
  nightmareWakeReactions: Record<NightmareWakeReaction, number>
  nightmareAfterWaking: Record<NightmareAfterWaking, number>
  nightmareIntensity: Record<NightmareIntensity, number>
}

export interface DetailedReportMissingCounts {
  sleepDisruptions: number
  anxietyContributors: number
  depressionContributors: number
  depressionSymptoms: number
  perceptualExperiences: number
  nightmareWakeReactions: number
  nightmareAfterWaking: number
  functioning: number
}

export interface PreparedClinicianReport extends Omit<ReportSummary, 'nightmares'> {
  nightmareDetails: ReportSummary['nightmares']
  nightmares: ReportSummary['nightmares'] & NightmareReportSemantics
  options: Required<ReportOptions>
  dayCount: number
  previousRange: { start: string; end: string }
  coverage: ReportCoverageItem[]
  summaryFindings: SummaryFinding[]
  whatChanged: ReportComparison[]
  keyMeasures: ReportKeyMeasure[]
  functioningRows: ReportFrequencyRow[]
  contributorRows: ContributorComparisonRow[]
  depressionSymptomRows: ReportFrequencyRow[]
  pointsToDiscuss: SummaryFinding[]
  includedContent: ReportIncludedContent
  detailDistributions: DetailedReportDistributions
  detailMissing: DetailedReportMissingCounts
  raw: ScopedRawReportData
}

export const coverageLevelFor = (completed: number): ReportCoverageLevel => {
  if (completed === 0) return 'no-data'
  if (completed <= reportEvidenceRules.veryLimitedMaximum) return 'very-limited'
  if (completed <= reportEvidenceRules.limitedMaximum) return 'limited'
  return 'sufficient'
}

export const coverageLevelLabel = (level: ReportCoverageLevel) => ({
  'no-data': 'No data',
  'very-limited': 'Very limited',
  limited: 'Limited',
  sufficient: 'Sufficient for a simple summary',
})[level]

export const ordinalMedianValues = <T extends string>(values: Array<T | undefined | null>, order: readonly T[]): T[] => {
  const ordered = values
    .flatMap((value) => value && order.includes(value) ? [order.indexOf(value)] : [])
    .sort((a, b) => a - b)

  if (!ordered.length) return []

  const lower = ordered[Math.floor((ordered.length - 1) / 2)]
  const upper = ordered[Math.ceil((ordered.length - 1) / 2)]
  return lower === upper ? [order[lower]] : [order[lower], order[upper]]
}

export const tiedModes = <T extends string>(distribution: Record<T, number>, order: readonly T[]): T[] => {
  const maximum = Math.max(0, ...order.map((value) => distribution[value] ?? 0))
  return maximum === 0 ? [] : order.filter((value) => distribution[value] === maximum)
}

export const previousEquivalentRange = (start: string, end: string) => {
  const dayCount = rangeDateKeys(start, end).length
  const first = parseISO(`${start}T12:00:00`)
  return {
    start: localDateKey(subDays(first, dayCount)),
    end: localDateKey(subDays(first, 1)),
  }
}

const completeEveningCheckIns = (entries: EveningCheckIn[]) => entries.filter((entry) => entry.status !== 'DRAFT')

const sortedByDate = <T extends { date: string; updatedAt?: string; createdAt?: string }>(entries: T[]) =>
  [...entries].sort((a, b) => a.date.localeCompare(b.date) || (a.updatedAt ?? a.createdAt ?? '').localeCompare(b.updatedAt ?? b.createdAt ?? ''))

const uniqueDateCount = (entries: Array<{ date: string }>) => new Set(entries.map((entry) => entry.date)).size

const optionRows = <T extends string>(distribution: Record<T, number>, options: Option<T>[]): ReportDistributionRow[] =>
  options.map((option) => ({ value: option.value, label: option.label, count: distribution[option.value] ?? 0 }))

const typicalLabel = <T extends string>(values: Array<T | undefined | null>, options: Option<T>[]) => {
  const medians = ordinalMedianValues(values, options.map((option) => option.value))
  return medians.length ? medians.map((value) => optionLabel(options, value)).join(' to ') : 'Not logged'
}

const latestLabel = <T extends string>(values: Array<T | undefined | null>, options: Option<T>[]) => {
  const latest = [...values].reverse().find((value): value is T => Boolean(value && options.some((option) => option.value === value)))
  return latest ? optionLabel(options, latest) : 'Not logged'
}

const listPhrase = (parts: string[]) => {
  if (parts.length <= 1) return parts[0] ?? ''
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`
  return `${parts.slice(0, -1).join(', ')}, and ${parts.at(-1)}`
}

const substanceGroupComparison = <T extends string>(
  label: string,
  quickCheckIns: QuickCheckIn[],
  selector: (entry: QuickCheckIn) => T,
  options: Option<T>[],
) => {
  const withUse = quickCheckIns.filter((entry) => entry.substanceUse === 'YES')
  const withoutUse = quickCheckIns.filter((entry) => entry.substanceUse === 'NONE')
  const allValues = quickCheckIns.map(selector)
  const hasEnoughData = quickCheckIns.length >= reportEvidenceRules.relationshipMinimum
    && withUse.length >= reportEvidenceRules.comparisonGroupMinimum
    && withoutUse.length >= reportEvidenceRules.comparisonGroupMinimum
  const hasVariation = new Set(allValues).size > 1

  if (!hasEnoughData || !hasVariation) {
    return `Not enough completed, varied quick check-ins to compare ${label.toLowerCase()} by recorded substance use.`
  }

  const useTypical = typicalLabel(withUse.map(selector), options).toLowerCase()
  const noUseTypical = typicalLabel(withoutUse.map(selector), options).toLowerCase()
  return `${label} was typically ${useTypical} on ${withUse.length} quick check-ins with recorded substance use and ${noUseTypical} on ${withoutUse.length} quick check-ins with no use recorded. This describes logged data and does not establish a cause.`
}

const distributionStatement = <T extends string>(
  label: string,
  distribution: Record<T, number>,
  options: Option<T>[],
  denominator: number,
  sourceLabel: string,
) => {
  const rows = optionRows(distribution, options).filter((row) => row.count > 0)
  const shown = rows.length <= 3
    ? rows
    : [...rows].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, 3)
  const shownTotal = shown.reduce((total, row) => total + row.count, 0)
  const parts = shown.map((row) => `${row.label.toLowerCase()} on ${row.count}`)
  if (shownTotal < denominator) parts.push(`not logged on ${denominator - shownTotal}`)
  return `${label} was recorded as ${listPhrase(parts)} of ${denominator} ${sourceLabel}.`
}

const comparisonFor = <T extends string>({
  id,
  label,
  currentValues,
  previousValues,
  currentDates,
  previousDates,
  options,
  direction,
  sourceForm,
}: {
  id: string
  label: string
  currentValues: Array<T | undefined | null>
  previousValues: Array<T | undefined | null>
  currentDates: string[]
  previousDates: string[]
  options: Option<T>[]
  direction: ReportMetricDirection
  sourceForm: ReportSourceForm
}): ReportComparison | undefined => {
  const order = options.map((option) => option.value)
  const currentKnown = currentValues.filter((value): value is T => Boolean(value && order.includes(value)))
  const previousKnown = previousValues.filter((value): value is T => Boolean(value && order.includes(value)))
  if (currentKnown.length < reportEvidenceRules.comparisonMinimum || previousKnown.length < reportEvidenceRules.comparisonMinimum) return undefined

  const currentMedians = ordinalMedianValues(currentKnown, order)
  const previousMedians = ordinalMedianValues(previousKnown, order)
  const midpoint = (values: T[]) => values.reduce((total, value) => total + order.indexOf(value), 0) / values.length
  const difference = midpoint(currentMedians) - midpoint(previousMedians)
  const currentTypical = currentMedians.map((value) => optionLabel(options, value)).join(' to ')
  const previousTypical = previousMedians.map((value) => optionLabel(options, value)).join(' to ')
  let result: ReportComparison['result'] = 'similar'
  let display = 'Similar'

  if (difference !== 0) {
    if (direction === 'higher-worse') {
      result = difference > 0 ? 'higher' : 'lower'
      display = difference > 0 ? 'Higher severity' : 'Lower severity'
    } else if (direction === 'higher-better') {
      result = difference > 0 ? 'better' : 'worse'
      display = difference > 0 ? 'Higher' : 'Lower'
    } else {
      result = difference > 0 ? 'higher' : 'lower'
      display = difference > 0 ? 'Higher' : 'Lower'
    }
  }

  return {
    id,
    label,
    result,
    display,
    statement: `${label} was typically ${currentTypical.toLowerCase()} in the selected period and ${previousTypical.toLowerCase()} in the previous period. This comparison is based on ${currentKnown.length} current entries and ${previousKnown.length} previous entries.`,
    currentCount: currentKnown.length,
    previousCount: previousKnown.length,
    currentTypical,
    previousTypical,
    evidence: [
      { sourceForm, metricId: id, dates: currentDates, denominator: currentKnown.length },
      { sourceForm, metricId: id, dates: previousDates, denominator: previousKnown.length },
    ],
  }
}

const highSeverityCount = <T extends string>(values: Array<T | undefined | null>, highValues: readonly T[]) =>
  values.filter((value) => value !== undefined && value !== null && highValues.includes(value)).length

const finding = (input: Omit<SummaryFinding, 'dates'>, start: string, end: string): SummaryFinding => ({
  ...input,
  dates: { start, end },
})

const detailedNightmareLog = (entry: NightmareEntry) =>
  !entry.sleepEntryId ||
  entry.createdAt !== entry.updatedAt ||
  Boolean(entry.description?.trim()) ||
  (entry.wakeReactions ?? []).length > 0 ||
  (entry.afterWaking ?? []).length > 0

const nightmareSemanticsFor = (sleepEntries: SleepEntry[], nightmareEntries: NightmareEntry[]): NightmareReportSemantics => {
  const sleepDisruptionDays = sleepEntries.filter((entry) => entry.disruptions?.includes('NIGHTMARES')).length
  const explicitNoNightmareDays = sleepEntries.filter((entry) => entry.disruptions?.includes('NONE')).length
  const unansweredSleepEntries = sleepEntries.filter((entry) =>
    !entry.disruptions?.includes('NIGHTMARES') && !entry.disruptions?.includes('NONE'),
  ).length
  const detailedLogCount = nightmareEntries.filter(detailedNightmareLog).length
  const genericSleepLinkedCount = nightmareEntries.filter((entry) => !detailedNightmareLog(entry)).length
  let statement = 'No detailed nightmare logs were completed during this period.'

  if (sleepDisruptionDays > 0 && detailedLogCount === 0) {
    statement = `Nightmares were selected as a sleep disruption on ${sleepDisruptionDays} ${sleepDisruptionDays === 1 ? 'night' : 'nights'}, but no detailed nightmare logs were completed.`
  } else if (sleepDisruptionDays > 0) {
    statement = `Nightmares were selected as a sleep disruption on ${sleepDisruptionDays} ${sleepDisruptionDays === 1 ? 'night' : 'nights'}, and ${detailedLogCount} detailed ${detailedLogCount === 1 ? 'log was' : 'logs were'} completed.`
  } else if (detailedLogCount > 0) {
    statement = `${detailedLogCount} detailed nightmare ${detailedLogCount === 1 ? 'log was' : 'logs were'} completed during this period.`
  } else if (sleepEntries.length > 0 && explicitNoNightmareDays === sleepEntries.length) {
    statement = `No nightmares were recorded across ${sleepEntries.length} completed sleep ${sleepEntries.length === 1 ? 'entry' : 'entries'}. No detailed nightmare logs were completed.`
  }

  return {
    eventCount: nightmareEntries.length,
    detailedLogCount,
    genericSleepLinkedCount,
    sleepDisruptionDays,
    explicitNoNightmareDays,
    unansweredSleepEntries,
    statement,
  }
}

const scopedRawData = (
  quickCheckIns: QuickCheckIn[],
  eveningCheckIns: EveningCheckIn[],
  sleepEntries: SleepEntry[],
  nightmareEntries: NightmareEntry[],
  selectedJournalEntries: ReportSummary['selectedJournalEntries'],
  options: Required<ReportOptions>,
): ScopedRawReportData => ({
  quickCheckIns: quickCheckIns.map((entry) => {
    const { substanceUse, substances, details, ...core } = entry
    return {
      ...core,
      ...(options.includeSubstanceSummary ? { substanceUse } : {}),
      ...(options.includeSubstanceDetails ? { substances } : {}),
      ...(options.includeNotes && details ? { details } : {}),
    }
  }),
  eveningCheckIns: eveningCheckIns.map((entry) => {
    const { notes, anxietyOtherText, depressionOtherText, ...core } = entry
    return {
      ...core,
      ...(options.includeNotes && notes ? { notes } : {}),
      ...(options.includeNotes && anxietyOtherText ? { anxietyOtherText } : {}),
      ...(options.includeNotes && depressionOtherText ? { depressionOtherText } : {}),
    }
  }),
  sleepEntries: sleepEntries.map((entry) => {
    const { notes, ...core } = entry
    return { ...core, ...(options.includeNotes && notes ? { notes } : {}) }
  }),
  nightmareEntries: nightmareEntries.map((entry) => {
    const { description, ...core } = entry
    return { ...core, ...(options.includeNightmareNotes && description ? { description } : {}) }
  }),
  journalEntries: selectedJournalEntries.map((entry) => ({ ...entry })),
})

const coverageItem = (
  id: ReportCoverageItem['id'],
  label: string,
  completed: number,
  entryCount: number,
  denominator?: number,
  detail?: string,
): ReportCoverageItem => {
  const level = coverageLevelFor(completed)
  return {
    id,
    label,
    completed,
    denominator,
    entryCount,
    level,
    display: denominator === undefined
      ? completed === 0 ? 'None completed' : `${completed} completed`
      : `${completed}/${denominator}`,
    detail: detail ?? coverageLevelLabel(level),
  }
}

const topFullCounts = <T extends string>(counts: Record<T, number>, options: Option<T>[]) =>
  options
    .map((option) => ({ value: option.value, label: option.label, count: counts[option.value] ?? 0 }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))

const rankFindings = (coverage: SummaryFinding, candidates: SummaryFinding[], functioning?: SummaryFinding) => {
  const selected = [coverage, ...[...candidates].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id)).slice(0, 5)]
  if (functioning && !selected.some((item) => item.id === functioning.id)) {
    if (selected.length >= 6) selected[selected.length - 1] = functioning
    else selected.push(functioning)
  }
  return selected.slice(0, 6)
}

export const prepareClinicianReport = (
  data: AppData,
  start: string,
  end: string,
  inputOptions: ReportOptions,
): PreparedClinicianReport => {
  const options: Required<ReportOptions> = {
    includeNotes: inputOptions.includeNotes,
    includeNightmareNotes: inputOptions.includeNightmareNotes,
    selectedJournalIds: inputOptions.selectedJournalIds,
    includeSubstanceSummary: Boolean(inputOptions.includeSubstanceSummary || inputOptions.includeSubstanceDetails),
    includeSubstanceDetails: Boolean(inputOptions.includeSubstanceDetails),
  }
  const dayKeys = rangeDateKeys(start, end)
  const dayCount = dayKeys.length
  const previousRange = previousEquivalentRange(start, end)
  const completeData: AppData = {
    ...data,
    eveningCheckIns: completeEveningCheckIns(data.eveningCheckIns),
  }
  const base = generateReport(completeData, start, end, options)
  const quickCheckIns = completeData.quickCheckIns.filter((entry) => dateInRange(entry.date, start, end))
  const eveningCheckIns = sortedByDate(completeData.eveningCheckIns.filter((entry) => dateInRange(entry.date, start, end)))
  const sleepEntries = sortedByDate(completeData.sleepEntries.filter((entry) => dateInRange(entry.date, start, end)))
  const nightmareEntries = completeData.nightmareEntries.filter((entry) => isoInDateRange(entry.occurredAt, start, end))
  const previousEvening = sortedByDate(completeData.eveningCheckIns.filter((entry) => dateInRange(entry.date, previousRange.start, previousRange.end)))
  const previousSleep = sortedByDate(completeData.sleepEntries.filter((entry) => dateInRange(entry.date, previousRange.start, previousRange.end)))
  const selectedJournalEntries = base.selectedJournalEntries
  const nightmareSemantics = nightmareSemanticsFor(sleepEntries, nightmareEntries)

  const coverage = [
    coverageItem('evening', 'Evening check-ins', uniqueDateCount(eveningCheckIns), eveningCheckIns.length, dayCount),
    coverageItem('sleep', 'Sleep entries', uniqueDateCount(sleepEntries), sleepEntries.length, dayCount),
    coverageItem(
      'quick',
      'Quick check-ins',
      uniqueDateCount(quickCheckIns),
      quickCheckIns.length,
      dayCount,
      quickCheckIns.length === uniqueDateCount(quickCheckIns)
        ? coverageLevelLabel(coverageLevelFor(uniqueDateCount(quickCheckIns)))
        : `${quickCheckIns.length} entries across ${uniqueDateCount(quickCheckIns)} days`,
    ),
    coverageItem('nightmare', 'Detailed nightmare logs', nightmareSemantics.detailedLogCount, nightmareSemantics.detailedLogCount),
    coverageItem('journal', 'Journal entries', selectedJournalEntries.length, selectedJournalEntries.length, undefined, `${selectedJournalEntries.length} selected`),
  ]

  const anxietyValues = eveningCheckIns.map((entry) => entry.anxietySeverity)
  const depressionValues = eveningCheckIns.map((entry) => entry.depressionSeverity)
  const sleepDurationValues = sleepEntries.map((entry) => entry.durationCategory)
  const sleepQualityValues = sleepEntries.map((entry) => entry.quality)
  const anxietyHigh = highSeverityCount(anxietyValues, ['SEVERE', 'EXTREME'])
  const depressionHigh = highSeverityCount(depressionValues, ['SEVERE', 'EXTREME'])

  const anxietyComparison = comparisonFor({
    id: 'evening-anxiety',
    label: 'Anxiety',
    currentValues: anxietyValues,
    previousValues: previousEvening.map((entry) => entry.anxietySeverity),
    currentDates: eveningCheckIns.map((entry) => entry.date),
    previousDates: previousEvening.map((entry) => entry.date),
    options: severityOptions,
    direction: 'higher-worse',
    sourceForm: 'Evening check-in',
  })
  const depressionComparison = comparisonFor({
    id: 'evening-depression',
    label: 'Depression',
    currentValues: depressionValues,
    previousValues: previousEvening.map((entry) => entry.depressionSeverity),
    currentDates: eveningCheckIns.map((entry) => entry.date),
    previousDates: previousEvening.map((entry) => entry.date),
    options: severityOptions,
    direction: 'higher-worse',
    sourceForm: 'Evening check-in',
  })
  const sleepQualityComparison = comparisonFor({
    id: 'sleep-quality',
    label: 'Sleep quality',
    currentValues: sleepQualityValues,
    previousValues: previousSleep.map((entry) => entry.quality),
    currentDates: sleepEntries.map((entry) => entry.date),
    previousDates: previousSleep.map((entry) => entry.date),
    options: sleepQualityOptions,
    direction: 'higher-better',
    sourceForm: 'Sleep entry',
  })
  const moodComparison = comparisonFor({
    id: 'evening-mood',
    label: 'Mood',
    currentValues: eveningCheckIns.map((entry) => entry.moodRating),
    previousValues: previousEvening.map((entry) => entry.moodRating),
    currentDates: eveningCheckIns.map((entry) => entry.date),
    previousDates: previousEvening.map((entry) => entry.date),
    options: eveningMoodOptions,
    direction: 'higher-better',
    sourceForm: 'Evening check-in',
  })
  const whatChanged = [anxietyComparison, depressionComparison, sleepQualityComparison, moodComparison]
    .filter((comparison): comparison is ReportComparison => Boolean(comparison))

  const keyMeasures: ReportKeyMeasure[] = [
    {
      id: 'anxiety',
      label: 'Anxiety',
      sourceLabel: 'Evening check-in',
      entries: anxietyValues.length,
      latest: latestLabel(anxietyValues, severityOptions),
      typical: anxietyValues.length >= reportEvidenceRules.comparisonMinimum ? typicalLabel(anxietyValues, severityOptions) : 'Limited data',
      higherSeverityLabel: 'Severe or extreme',
      higherSeverityCount: anxietyHigh,
      comparison: anxietyComparison,
      distribution: optionRows(base.anxiety.severityDistribution, severityOptions),
      accessibleSummary: `Anxiety. ${anxietyValues.length} evening entries. ${optionRows(base.anxiety.severityDistribution, severityOptions).filter((row) => row.count > 0).map((row) => `${row.label} on ${row.count}`).join('. ') || 'Not logged'}.`,
    },
    {
      id: 'depression',
      label: 'Depression',
      sourceLabel: 'Evening check-in',
      entries: depressionValues.length,
      latest: latestLabel(depressionValues, severityOptions),
      typical: depressionValues.length >= reportEvidenceRules.comparisonMinimum ? typicalLabel(depressionValues, severityOptions) : 'Limited data',
      higherSeverityLabel: 'Severe or extreme',
      higherSeverityCount: depressionHigh,
      comparison: depressionComparison,
      distribution: optionRows(base.depression.severityDistribution, severityOptions),
      accessibleSummary: `Depression. ${depressionValues.length} evening entries. ${optionRows(base.depression.severityDistribution, severityOptions).filter((row) => row.count > 0).map((row) => `${row.label} on ${row.count}`).join('. ') || 'Not logged'}.`,
    },
    {
      id: 'sleep',
      label: 'Sleep',
      sourceLabel: 'Sleep entry',
      entries: sleepEntries.length,
      latest: sleepEntries.length ? `${latestLabel(sleepDurationValues, sleepDurationOptions)}; ${latestLabel(sleepQualityValues, sleepQualityOptions)}` : 'Not logged',
      typical: sleepEntries.length >= reportEvidenceRules.comparisonMinimum
        ? `${typicalLabel(sleepDurationValues, sleepDurationOptions)}; ${typicalLabel(sleepQualityValues, sleepQualityOptions)}`
        : 'Limited data',
      comparison: sleepQualityComparison,
      distribution: optionRows(base.sleep.durationDistribution, sleepDurationOptions),
      accessibleSummary: `Sleep. ${sleepEntries.length} entries. Typical duration ${typicalLabel(sleepDurationValues, sleepDurationOptions)}. Typical quality ${typicalLabel(sleepQualityValues, sleepQualityOptions)}.`,
    },
  ]

  const functioningOrder: FunctioningItem[] = [
    'LEFT_HOUSE',
    'MEDICATION_AS_PRESCRIBED',
    'SHOWERED',
    'PRODUCTIVE_TASK',
    'PERSONAL_PROJECT',
    'EXERCISED',
  ]
  const functioningRows = functioningOrder.map((value) => ({
    value,
    label: optionLabel(functioningOptions, value),
    count: base.functioning[value] ?? 0,
    denominator: eveningCheckIns.length,
  }))

  const anxietyContributorCounts = countArrayValues<AnxietyContributor>(
    eveningCheckIns.map((entry) => entry.anxietyContributors ?? []),
    anxietyContributorOptions.map((option) => option.value),
  )
  const depressionContributorCounts = countArrayValues<DepressionContributor>(
    eveningCheckIns.map((entry) => entry.depressionContributors ?? []),
    depressionContributorOptions.map((option) => option.value),
  )
  const contributorLabels = new Map<string, string>()
  anxietyContributorOptions.forEach((option) => contributorLabels.set(option.value, option.label))
  depressionContributorOptions.forEach((option) => contributorLabels.set(option.value, option.label))
  const contributorRows = [...contributorLabels.entries()]
    .map(([value, label]) => ({
      label,
      anxietyCount: anxietyContributorCounts[value as AnxietyContributor] ?? 0,
      depressionCount: depressionContributorCounts[value as DepressionContributor] ?? 0,
      denominator: eveningCheckIns.length,
    }))
    .sort((a, b) => Math.max(b.anxietyCount, b.depressionCount) - Math.max(a.anxietyCount, a.depressionCount) || a.label.localeCompare(b.label))

  const depressionSymptomCounts = countArrayValues<DepressionSymptom>(
    eveningCheckIns.map((entry) => entry.depressionSymptoms ?? []),
    depressionSymptomOptions.map((option) => option.value),
    ['NONE'],
  )
  const depressionSymptomRows = topFullCounts(depressionSymptomCounts, depressionSymptomOptions)
    .filter((row) => row.value !== 'NONE')
    .map((row) => ({ ...row, denominator: eveningCheckIns.length }))
  const detailedNightmareEntries = nightmareEntries.filter(detailedNightmareLog)
  const detailDistributions: DetailedReportDistributions = {
    sleepDisruptions: countArrayValues<SleepDisruption>(
      sleepEntries.map((entry) => entry.disruptions ?? []),
      sleepDisruptionOptions.map((option) => option.value),
    ),
    anxietyContributors: anxietyContributorCounts,
    depressionContributors: depressionContributorCounts,
    depressionSymptoms: countArrayValues<DepressionSymptom>(
      eveningCheckIns.map((entry) => entry.depressionSymptoms ?? []),
      depressionSymptomOptions.map((option) => option.value),
    ),
    perceptualExperiences: countArrayValues<PerceptualExperience>(
      eveningCheckIns.map((entry) => entry.perceptualExperiences ?? []),
      perceptualExperienceOptions.map((option) => option.value),
    ),
    nightmareWakeReactions: countArrayValues<NightmareWakeReaction>(
      detailedNightmareEntries.map((entry) => entry.wakeReactions ?? []),
      nightmareWakeOptions.map((option) => option.value),
    ),
    nightmareAfterWaking: countArrayValues<NightmareAfterWaking>(
      detailedNightmareEntries.map((entry) => entry.afterWaking ?? []),
      nightmareAfterOptions.map((option) => option.value),
    ),
    nightmareIntensity: countValues(
      detailedNightmareEntries.map((entry) => entry.intensity),
      nightmareIntensityOptions.map((option) => option.value),
    ),
  }
  const detailMissing: DetailedReportMissingCounts = {
    sleepDisruptions: sleepEntries.filter((entry) => !entry.disruptions?.length).length,
    anxietyContributors: eveningCheckIns.filter((entry) => !entry.anxietyContributors?.length).length,
    depressionContributors: eveningCheckIns.filter((entry) => !entry.depressionContributors?.length).length,
    depressionSymptoms: eveningCheckIns.filter((entry) => !entry.depressionSymptoms?.length).length,
    perceptualExperiences: eveningCheckIns.filter((entry) => !entry.perceptualExperiences?.length).length,
    nightmareWakeReactions: detailedNightmareEntries.filter((entry) => !entry.wakeReactions?.length).length,
    nightmareAfterWaking: detailedNightmareEntries.filter((entry) => !entry.afterWaking?.length).length,
    functioning: eveningCheckIns.filter((entry) => !entry.functioning?.length).length,
  }

  const substanceUse = {
    ...base.substanceUse,
    sleepComparison: options.includeSubstanceSummary
      ? substanceGroupComparison('Sleep last night', quickCheckIns, (entry) => entry.sleepDuration, sleepDurationOptions)
      : 'Not included in this report.',
    anxietyComparison: options.includeSubstanceSummary
      ? substanceGroupComparison('Quick anxiety', quickCheckIns, (entry) => entry.anxiety, quickAnxietyOptions)
      : 'Not included in this report.',
    warningSignsComparison: options.includeSubstanceSummary
      ? substanceGroupComparison('Quick warning signs', quickCheckIns, (entry) => entry.warningSigns, quickWarningSignOptions)
      : 'Not included in this report.',
  }

  const coverageFinding = finding({
    id: 'coverage-overview',
    category: 'coverage',
    priority: 100,
    statement: `${uniqueDateCount(eveningCheckIns)} of ${dayCount} days have completed evening check-ins, and ${uniqueDateCount(sleepEntries)} of ${dayCount} have sleep entries. ${quickCheckIns.length} quick ${quickCheckIns.length === 1 ? 'check-in was' : 'check-ins were'} completed.`,
    evidence: [
      { sourceForm: 'Evening check-in', metricId: 'completion', dates: eveningCheckIns.map((entry) => entry.date), numerator: uniqueDateCount(eveningCheckIns), denominator: dayCount },
      { sourceForm: 'Sleep entry', metricId: 'completion', dates: sleepEntries.map((entry) => entry.date), numerator: uniqueDateCount(sleepEntries), denominator: dayCount },
      { sourceForm: 'Quick check-in', metricId: 'completion', dates: quickCheckIns.map((entry) => entry.date), numerator: quickCheckIns.length, denominator: dayCount },
    ],
    denominator: dayCount,
    sourceForm: 'Multiple sources',
    confidence: coverageLevelFor(Math.max(uniqueDateCount(eveningCheckIns), uniqueDateCount(sleepEntries))),
    limitations: [],
    safeDisplayVariant: 'standard',
  }, start, end)

  const candidates: SummaryFinding[] = []
  const eveningConfidence = coverageLevelFor(eveningCheckIns.length)
  if (eveningCheckIns.length) {
    const anxietyStatement = eveningCheckIns.length === 1
      ? `One evening check-in was completed and recorded anxiety as ${latestLabel(anxietyValues, severityOptions).toLowerCase()}. This single observation does not describe the full period.`
      : `${distributionStatement('Anxiety', base.anxiety.severityDistribution, severityOptions, eveningCheckIns.length, 'completed evening check-ins')}${eveningCheckIns.length < reportEvidenceRules.simplePeriodMinimum ? ' The available data is limited.' : ''}`
    candidates.push(finding({
      id: 'anxiety-summary',
      category: 'symptom',
      priority: 82 + anxietyHigh * 3,
      statement: anxietyStatement,
      evidence: [{ sourceForm: 'Evening check-in', metricId: 'evening-anxiety', dates: eveningCheckIns.map((entry) => entry.date), numerator: anxietyHigh, denominator: eveningCheckIns.length, distribution: base.anxiety.severityDistribution }],
      numerator: anxietyHigh,
      denominator: eveningCheckIns.length,
      sourceForm: 'Evening check-in',
      confidence: eveningConfidence,
      limitations: eveningCheckIns.length < reportEvidenceRules.simplePeriodMinimum ? ['Fewer than five completed entries.'] : [],
      safeDisplayVariant: anxietyHigh ? 'important' : 'standard',
    }, start, end))

    const depressionStatement = eveningCheckIns.length === 1
      ? `The same evening check-in recorded depression as ${latestLabel(depressionValues, severityOptions).toLowerCase()}. This is a single observation.`
      : `${distributionStatement('Depression', base.depression.severityDistribution, severityOptions, eveningCheckIns.length, 'completed evening check-ins')}${eveningCheckIns.length < reportEvidenceRules.simplePeriodMinimum ? ' The available data is limited.' : ''}`
    candidates.push(finding({
      id: 'depression-summary',
      category: 'symptom',
      priority: 80 + depressionHigh * 3,
      statement: depressionStatement,
      evidence: [{ sourceForm: 'Evening check-in', metricId: 'evening-depression', dates: eveningCheckIns.map((entry) => entry.date), numerator: depressionHigh, denominator: eveningCheckIns.length, distribution: base.depression.severityDistribution }],
      numerator: depressionHigh,
      denominator: eveningCheckIns.length,
      sourceForm: 'Evening check-in',
      confidence: eveningConfidence,
      limitations: eveningCheckIns.length < reportEvidenceRules.simplePeriodMinimum ? ['Fewer than five completed entries.'] : [],
      safeDisplayVariant: depressionHigh ? 'important' : 'standard',
    }, start, end))
  }

  if (sleepEntries.length) {
    candidates.push(finding({
      id: 'sleep-summary',
      category: 'sleep',
      priority: 70,
      statement: sleepEntries.length >= reportEvidenceRules.simplePeriodMinimum
        ? `Sleep duration was typically ${typicalLabel(sleepDurationValues, sleepDurationOptions).toLowerCase()}, and sleep quality was typically ${typicalLabel(sleepQualityValues, sleepQualityOptions).toLowerCase()}, across ${sleepEntries.length} completed sleep entries.`
        : `${sleepEntries.length} sleep ${sleepEntries.length === 1 ? 'entry was' : 'entries were'} completed. The available data is ${sleepEntries.length <= 2 ? 'very limited' : 'limited'} and is shown without a period-level conclusion.`,
      evidence: [
        { sourceForm: 'Sleep entry', metricId: 'sleep-duration', dates: sleepEntries.map((entry) => entry.date), denominator: sleepEntries.length, distribution: base.sleep.durationDistribution },
        { sourceForm: 'Sleep entry', metricId: 'sleep-quality', dates: sleepEntries.map((entry) => entry.date), denominator: sleepEntries.length, distribution: base.sleep.qualityDistribution },
      ],
      denominator: sleepEntries.length,
      sourceForm: 'Sleep entry',
      confidence: coverageLevelFor(sleepEntries.length),
      limitations: sleepEntries.length < reportEvidenceRules.simplePeriodMinimum ? ['Fewer than five completed sleep entries.'] : [],
      safeDisplayVariant: sleepEntries.length < reportEvidenceRules.simplePeriodMinimum ? 'limited' : 'standard',
    }, start, end))
  }

  const changed = whatChanged.find((item) => item.result !== 'similar')
  if (changed) {
    candidates.push(finding({
      id: `change-${changed.id}`,
      category: 'change',
      priority: 76,
      statement: changed.statement,
      evidence: changed.evidence,
      denominator: changed.currentCount,
      sourceForm: changed.evidence[0].sourceForm,
      confidence: 'limited',
      limitations: ['This is a scale-aware period comparison, not a causal finding.'],
      safeDisplayVariant: 'standard',
    }, start, end))
  }

  const topFunctioning = functioningRows
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count || functioningOrder.indexOf(a.value as FunctioningItem) - functioningOrder.indexOf(b.value as FunctioningItem))
    .slice(0, 2)
  const functioningFinding = topFunctioning.length && eveningCheckIns.length
    ? finding({
        id: 'functioning-summary',
        category: 'functioning',
        priority: 64,
        statement: `${listPhrase(topFunctioning.map((row) => `${row.label.toLowerCase()} was recorded on ${row.count} of ${row.denominator} completed evening check-ins`))}.`,
        evidence: topFunctioning.map((row) => ({ sourceForm: 'Evening check-in' as const, metricId: `functioning-${row.value.toLowerCase()}`, dates: eveningCheckIns.filter((entry) => entry.functioning?.includes(row.value as FunctioningItem)).map((entry) => entry.date), numerator: row.count, denominator: row.denominator })),
        denominator: eveningCheckIns.length,
        sourceForm: 'Evening check-in',
        confidence: eveningConfidence,
        limitations: ['These are recorded check-in responses, not independent verification of activity.'],
        safeDisplayVariant: 'protective',
      }, start, end)
    : undefined

  const topContributor = contributorRows.find((row) => Math.max(row.anxietyCount, row.depressionCount) > 0)
  if (topContributor && eveningCheckIns.length) {
    const parts = [
      topContributor.anxietyCount ? `${topContributor.anxietyCount} anxiety check-ins` : '',
      topContributor.depressionCount ? `${topContributor.depressionCount} depression check-ins` : '',
    ].filter(Boolean)
    candidates.push(finding({
      id: 'contributor-summary',
      category: 'contributor',
      priority: 58,
      statement: `${topContributor.label} was selected as a contributor on ${listPhrase(parts)}. It was recorded alongside symptoms and is not presented as a proven cause.`,
      evidence: [{ sourceForm: 'Evening check-in', metricId: 'contributors', dates: eveningCheckIns.map((entry) => entry.date), numerator: Math.max(topContributor.anxietyCount, topContributor.depressionCount), denominator: eveningCheckIns.length }],
      numerator: Math.max(topContributor.anxietyCount, topContributor.depressionCount),
      denominator: eveningCheckIns.length,
      sourceForm: 'Evening check-in',
      confidence: eveningConfidence,
      limitations: ['Contributor selection describes co-recorded information, not causation.'],
      safeDisplayVariant: 'standard',
    }, start, end))
  }

  const highSuspiciousness = eveningCheckIns.filter((entry) => ['SIGNIFICANTLY', 'EXTREMELY'].includes(entry.suspiciousness)).length
  const highUnusualMeanings = eveningCheckIns.filter((entry) => ['SIGNIFICANTLY', 'EXTREMELY'].includes(entry.unusualMeanings)).length
  if (highSuspiciousness || highUnusualMeanings) {
    candidates.push(finding({
      id: 'warning-signs-summary',
      category: 'symptom',
      priority: 94 + highSuspiciousness + highUnusualMeanings,
      statement: `${highSuspiciousness} of ${eveningCheckIns.length} completed evening check-ins recorded significant or extreme suspiciousness, and ${highUnusualMeanings} recorded significant or extreme unusual meanings.`,
      evidence: [
        { sourceForm: 'Evening check-in', metricId: 'suspiciousness', dates: eveningCheckIns.map((entry) => entry.date), numerator: highSuspiciousness, denominator: eveningCheckIns.length },
        { sourceForm: 'Evening check-in', metricId: 'unusual-meanings', dates: eveningCheckIns.map((entry) => entry.date), numerator: highUnusualMeanings, denominator: eveningCheckIns.length },
      ],
      numerator: highSuspiciousness + highUnusualMeanings,
      denominator: eveningCheckIns.length,
      sourceForm: 'Evening check-in',
      confidence: eveningConfidence,
      limitations: [],
      safeDisplayVariant: 'important',
    }, start, end))
  }

  if (nightmareSemantics.sleepDisruptionDays || nightmareSemantics.detailedLogCount) {
    candidates.push(finding({
      id: 'nightmare-summary',
      category: 'nightmare',
      priority: 68,
      statement: nightmareSemantics.statement,
      evidence: [
        { sourceForm: 'Sleep entry', metricId: 'nightmare-disruption', dates: sleepEntries.filter((entry) => entry.disruptions?.includes('NIGHTMARES')).map((entry) => entry.date), numerator: nightmareSemantics.sleepDisruptionDays, denominator: sleepEntries.length },
        { sourceForm: 'Nightmare log', metricId: 'detailed-nightmare-log', dates: nightmareEntries.filter(detailedNightmareLog).map((entry) => localDateKey(parseISO(entry.occurredAt))), numerator: nightmareSemantics.detailedLogCount },
      ],
      numerator: nightmareSemantics.eventCount,
      sourceForm: 'Multiple sources',
      confidence: coverageLevelFor(Math.max(nightmareSemantics.sleepDisruptionDays, nightmareSemantics.detailedLogCount)),
      limitations: nightmareSemantics.detailedLogCount === 0 ? ['No detailed nightmare logs were completed.'] : [],
      safeDisplayVariant: nightmareSemantics.detailedLogCount === 0 ? 'limited' : 'standard',
    }, start, end))
  }

  if (quickCheckIns.length > 0 && quickCheckIns.length < reportEvidenceRules.comparisonMinimum) {
    const latestQuick = [...quickCheckIns].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1)!
    candidates.push(finding({
      id: 'quick-limited',
      category: 'limitation',
      priority: 62,
      statement: quickCheckIns.length === 1
        ? `One quick check-in was completed and recorded mood today as ${optionLabel(quickMoodOptions, latestQuick.mood).toLowerCase()}, anxiety as ${optionLabel(quickAnxietyOptions, latestQuick.anxiety).toLowerCase()}, and depression as ${optionLabel(quickDepressionOptions, latestQuick.depression).toLowerCase()}. This single entry is not enough to describe the full period.`
        : `Two quick check-ins were completed. The quick check-in data is very limited and is kept separate from evening check-ins.`,
      evidence: [{ sourceForm: 'Quick check-in', metricId: 'quick-observation', dates: quickCheckIns.map((entry) => entry.date), numerator: quickCheckIns.length, denominator: dayCount }],
      numerator: quickCheckIns.length,
      denominator: dayCount,
      sourceForm: 'Quick check-in',
      confidence: 'very-limited',
      limitations: ['Quick and evening scales are not merged.'],
      safeDisplayVariant: 'limited',
    }, start, end))
  }

  const summaryFindings = rankFindings(coverageFinding, candidates, functioningFinding)
  const pointsToDiscuss: SummaryFinding[] = []
  if (anxietyHigh) pointsToDiscuss.push(finding({
    id: 'discuss-anxiety-high', category: 'symptom', priority: 90,
    statement: `Anxiety was severe or extreme on ${anxietyHigh} of ${eveningCheckIns.length} completed evening check-ins.`,
    evidence: [{ sourceForm: 'Evening check-in', metricId: 'evening-anxiety', dates: eveningCheckIns.filter((entry) => ['SEVERE', 'EXTREME'].includes(entry.anxietySeverity)).map((entry) => entry.date), numerator: anxietyHigh, denominator: eveningCheckIns.length }],
    numerator: anxietyHigh, denominator: eveningCheckIns.length, sourceForm: 'Evening check-in', confidence: eveningConfidence, limitations: [], safeDisplayVariant: 'important',
  }, start, end))
  if (depressionHigh) pointsToDiscuss.push(finding({
    id: 'discuss-depression-high', category: 'symptom', priority: 90,
    statement: `Depression was severe or extreme on ${depressionHigh} of ${eveningCheckIns.length} completed evening check-ins.`,
    evidence: [{ sourceForm: 'Evening check-in', metricId: 'evening-depression', dates: eveningCheckIns.filter((entry) => ['SEVERE', 'EXTREME'].includes(entry.depressionSeverity)).map((entry) => entry.date), numerator: depressionHigh, denominator: eveningCheckIns.length }],
    numerator: depressionHigh, denominator: eveningCheckIns.length, sourceForm: 'Evening check-in', confidence: eveningConfidence, limitations: [], safeDisplayVariant: 'important',
  }, start, end))
  const exercise = functioningRows.find((row) => row.value === 'EXERCISED')
  if (exercise && eveningCheckIns.length >= reportEvidenceRules.comparisonMinimum && exercise.count === 0) pointsToDiscuss.push(finding({
    id: 'discuss-exercise-zero', category: 'functioning', priority: 50,
    statement: `Exercise was not selected on any of ${eveningCheckIns.length} completed evening check-ins.`,
    evidence: [{ sourceForm: 'Evening check-in', metricId: 'functioning-exercised', dates: eveningCheckIns.map((entry) => entry.date), numerator: 0, denominator: eveningCheckIns.length }],
    numerator: 0, denominator: eveningCheckIns.length, sourceForm: 'Evening check-in', confidence: eveningConfidence,
    limitations: ['This describes recorded check-ins and does not prove that no exercise occurred outside the app.'], safeDisplayVariant: 'standard',
  }, start, end))
  if (quickCheckIns.length > 0 && quickCheckIns.length < reportEvidenceRules.comparisonMinimum) pointsToDiscuss.push(finding({
    id: 'discuss-quick-coverage', category: 'limitation', priority: 45,
    statement: `Quick check-in coverage was limited to ${quickCheckIns.length} ${quickCheckIns.length === 1 ? 'entry' : 'entries'} across the ${dayCount}-day period.`,
    evidence: [{ sourceForm: 'Quick check-in', metricId: 'completion', dates: quickCheckIns.map((entry) => entry.date), numerator: quickCheckIns.length, denominator: dayCount }],
    numerator: quickCheckIns.length, denominator: dayCount, sourceForm: 'Quick check-in', confidence: 'very-limited', limitations: [], safeDisplayVariant: 'limited',
  }, start, end))
  if (nightmareSemantics.sleepDisruptionDays && !nightmareSemantics.detailedLogCount) pointsToDiscuss.push(finding({
    id: 'discuss-nightmare-detail', category: 'nightmare', priority: 55,
    statement: `Nightmares were selected as a sleep disruption on ${nightmareSemantics.sleepDisruptionDays} ${nightmareSemantics.sleepDisruptionDays === 1 ? 'night' : 'nights'}, with no detailed nightmare logs completed.`,
    evidence: [{ sourceForm: 'Sleep entry', metricId: 'nightmare-disruption', dates: sleepEntries.filter((entry) => entry.disruptions?.includes('NIGHTMARES')).map((entry) => entry.date), numerator: nightmareSemantics.sleepDisruptionDays, denominator: sleepEntries.length }],
    numerator: nightmareSemantics.sleepDisruptionDays, denominator: sleepEntries.length, sourceForm: 'Multiple sources', confidence: coverageLevelFor(nightmareSemantics.sleepDisruptionDays), limitations: [], safeDisplayVariant: 'limited',
  }, start, end))

  const included: string[] = ['Evening check-ins', 'Sleep entries', 'Quick check-ins']
  if (options.includeNotes) included.push('Daily notes')
  if (options.includeNightmareNotes) included.push('Nightmare notes')
  if (options.includeSubstanceSummary) included.push(options.includeSubstanceDetails ? 'Substance-use summary and details' : 'Substance-use summary')
  if (selectedJournalEntries.length) included.push(`${selectedJournalEntries.length} selected journal ${selectedJournalEntries.length === 1 ? 'entry' : 'entries'}`)
  const excluded: string[] = []
  if (!options.includeNotes) excluded.push('Daily notes')
  if (!options.includeNightmareNotes) excluded.push('Nightmare notes')
  if (!options.includeSubstanceSummary) excluded.push('Substance-use information')
  if (!selectedJournalEntries.length) excluded.push('Journal entries')
  const includedContent: ReportIncludedContent = {
    included,
    excluded,
    summary: [
      `Includes ${listPhrase(included.map((value) => value.toLowerCase()))}.`,
      excluded.length ? `${listPhrase(excluded)} ${excluded.length === 1 ? 'is' : 'are'} excluded.` : 'No optional report content is excluded.',
    ],
  }

  const plainLanguageSummary = [
    ...summaryFindings.map((item) => item.statement),
    'Salience summarises information recorded in the app. This report is not a diagnosis or treatment recommendation.',
  ].join(' ')

  return {
    ...base,
    substanceUse,
    completion: {
      ...base.completion,
      quickCheckIns: quickCheckIns.length,
      checkInDays: uniqueDateCount(eveningCheckIns),
      sleepEntries: sleepEntries.length,
      nightmareLogs: nightmareSemantics.detailedLogCount,
      journalEntries: selectedJournalEntries.length,
    },
    plainLanguageSummary,
    nightmareDetails: base.nightmares,
    nightmares: { ...base.nightmares, ...nightmareSemantics },
    options,
    dayCount,
    previousRange,
    coverage,
    summaryFindings,
    whatChanged,
    keyMeasures,
    functioningRows,
    contributorRows,
    depressionSymptomRows,
    pointsToDiscuss: pointsToDiscuss.sort((a, b) => b.priority - a.priority),
    includedContent,
    detailDistributions,
    detailMissing,
    raw: scopedRawData(quickCheckIns, eveningCheckIns, sleepEntries, nightmareEntries, selectedJournalEntries, options),
  }
}
