import {
  anxietyContributorOptions,
  beliefCertaintyOptions,
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
  realityCheckOptions,
  severityOptions,
  sleepDisruptionOptions,
  sleepDurationOptions,
  sleepQualityOptions,
  substanceAmountOptions,
  substanceHelpedOptions,
  substanceReasonOptions,
  substanceTimingOptions,
  substanceTypeOptions,
  thinkingClarityOptions,
} from '../data/options'
import { dateInRange, isoInDateRange } from './dates'
import type {
  AnxietyContributor,
  AppData,
  BeliefCertainty,
  DepressionContributor,
  DepressionSymptom,
  EveningCheckIn,
  EveningMoodRating,
  FunctioningItem,
  NightmareAfterWaking,
  NightmareIntensity,
  NightmareWakeReaction,
  PerceptualExperience,
  PsychosisSeverity,
  QuickAnxiety,
  QuickDepression,
  QuickMood,
  QuickWarningSigns,
  RealityCheck,
  Severity5,
  SleepDuration,
  SleepQuality,
  SubstanceAmount,
  SubstanceHelped,
  SubstanceReason,
  SubstanceTiming,
  ThinkingClarity,
  ExportBundle,
} from '../types'

export interface ReportOptions {
  includeNotes: boolean
  includeNightmareNotes: boolean
  selectedJournalIds: string[]
  includeSubstanceSummary?: boolean
  includeSubstanceDetails?: boolean
}

export interface ReportSummary {
  range: {
    start: string
    end: string
  }
  completion: {
    quickCheckIns: number
    checkInDays: number
    sleepEntries: number
    nightmareLogs: number
    journalEntries: number
  }
  quickCheckIns: {
    moodDistribution: Record<QuickMood, number>
    anxietyDistribution: Record<QuickAnxiety, number>
    depressionDistribution: Record<QuickDepression, number>
    warningDistribution: Record<QuickWarningSigns, number>
  }
  mood: {
    ratingDistribution: Record<EveningMoodRating, number>
  }
  sleep: {
    mostCommonDuration: string
    durationDistribution: Record<SleepDuration, number>
    qualityDistribution: Record<SleepQuality, number>
    commonDisruptions: Array<{ label: string; count: number }>
  }
  nightmares: {
    count: number
    intensityDistribution: Record<NightmareIntensity, number>
    wakeReactions: Array<{ label: string; count: number }>
    afterWaking: Array<{ label: string; count: number }>
    descriptions: string[]
  }
  anxiety: {
    severityDistribution: Record<Severity5, number>
    commonContributors: Array<{ label: string; count: number }>
  }
  depression: {
    severityDistribution: Record<Severity5, number>
    commonSymptoms: Array<{ label: string; count: number }>
    commonContributors: Array<{ label: string; count: number }>
  }
  warningSigns: {
    suspiciousnessDistribution: Record<PsychosisSeverity, number>
    unusualMeaningsDistribution: Record<PsychosisSeverity, number>
    beliefCertaintyDistribution: Record<BeliefCertainty, number>
    perceptualExperiences: Array<{ label: string; count: number }>
    thinkingClarityDistribution: Record<ThinkingClarity, number>
    realityCheckDistribution: Record<RealityCheck, number>
  }
  substanceUse: {
    included: boolean
    detailsIncluded: boolean
    daysWithUse: number
    entriesWithUse: number
    commonSubstances: Array<{ label: string; count: number }>
    amountDistribution: Record<SubstanceAmount, number>
    timingDistribution: Record<SubstanceTiming, number>
    reasonDistribution: Record<SubstanceReason, number>
    helpedDistribution: Record<SubstanceHelped, number>
    sleepComparison: string
    anxietyComparison: string
    warningSignsComparison: string
    details: Array<{
      date: string
      substance: string
      amount?: string
      timing?: string
      reason?: string
      helped?: string
    }>
  }
  functioning: Record<FunctioningItem, number>
  notes: Array<{ date: string; text: string }>
  selectedJournalEntries: Array<{ title?: string; body: string; createdAt: string }>
  plainLanguageSummary: string
}

export const countValues = <T extends string>(values: T[], allValues: readonly T[]) =>
  allValues.reduce(
    (counts, value) => ({
      ...counts,
      [value]: values.filter((item) => item === value).length,
    }),
    {} as Record<T, number>,
  )

export const countArrayValues = <T extends string>(
  entries: T[][],
  allValues: readonly T[],
  excludeValues: T[] = [],
) => {
  const values = entries.flat().filter((value) => !excludeValues.includes(value))
  return countValues(values, allValues)
}

export const topCounts = <T extends string>(
  counts: Record<T, number>,
  labeler: (value: T) => string,
  limit = 3,
) =>
  Object.entries(counts)
    .map(([value, count]) => ({ label: labeler(value as T), count: count as number }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit)

export const mostCommon = <T extends string>(counts: Record<T, number>, labeler: (value: T) => string) => {
  const [top] = topCounts(counts, labeler, 1)
  return top?.label ?? 'No entries'
}

const filterReportData = (data: AppData, start: string, end: string) => ({
  quickCheckIns: data.quickCheckIns.filter((entry) => dateInRange(entry.date, start, end)),
  sleepEntries: data.sleepEntries.filter((entry) => dateInRange(entry.date, start, end)),
  nightmareEntries: data.nightmareEntries.filter((entry) => isoInDateRange(entry.occurredAt, start, end)),
  eveningCheckIns: data.eveningCheckIns.filter((entry) => dateInRange(entry.date, start, end)),
  journalEntries: data.journalEntries.filter((entry) => isoInDateRange(entry.createdAt, start, end)),
})

const quickSleepScore: Record<SleepDuration, number> = {
  UNDER_2: 1,
  TWO_TO_FOUR: 3,
  FIVE_TO_SIX: 5.5,
  SEVEN_TO_EIGHT: 7.5,
  EIGHT_PLUS: 8.5,
}

const quickAnxietyScore: Record<QuickAnxiety, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  EXTREME: 4,
}

const quickWarningScore: Record<QuickWarningSigns, number> = {
  NONE: 0,
  MILD: 1,
  CONCERNING: 3,
  URGENT: 4,
}

const severityPhrase = (entries: EveningCheckIn[], key: 'anxietySeverity' | 'depressionSeverity') => {
  const counts = countValues(
    entries.map((entry) => entry[key]),
    severityOptions.map((option) => option.value),
  )
  const top = topCounts(counts, (value) => optionLabel(severityOptions, value), 2)

  if (top.length === 0) {
    return 'not recorded'
  }

  if (top.length === 1) {
    return top[0].label.toLowerCase()
  }

  return `${top[0].label.toLowerCase()} or ${top[1].label.toLowerCase()}`
}

export const generateReport = (
  data: AppData | ExportBundle,
  start: string,
  end: string,
  options: ReportOptions,
): ReportSummary => {
  const { quickCheckIns, sleepEntries, nightmareEntries, eveningCheckIns, journalEntries } = filterReportData(data, start, end)
  const includeSubstanceSummary = Boolean(options.includeSubstanceSummary || options.includeSubstanceDetails)
  const includeSubstanceDetails = Boolean(options.includeSubstanceDetails)

  const quickMoodDistribution = countValues(
    quickCheckIns.map((entry) => entry.mood),
    quickMoodOptions.map((option) => option.value),
  )
  const quickAnxietyDistribution = countValues(
    quickCheckIns.map((entry) => entry.anxiety),
    quickAnxietyOptions.map((option) => option.value),
  )
  const quickDepressionDistribution = countValues(
    quickCheckIns.map((entry) => entry.depression),
    quickDepressionOptions.map((option) => option.value),
  )
  const quickWarningDistribution = countValues(
    quickCheckIns.map((entry) => entry.warningSigns),
    quickWarningSignOptions.map((option) => option.value),
  )
  const eveningMoodDistribution = countValues(
    eveningCheckIns.flatMap((entry) => (entry.moodRating ? [entry.moodRating] : [])),
    eveningMoodOptions.map((option) => option.value),
  )

  const substanceCheckIns = quickCheckIns.filter((entry) => entry.substanceUse === 'YES')
  const substanceDetails = substanceCheckIns.flatMap((entry) =>
    entry.substances.map((item) => ({ ...item, date: entry.date })),
  )
  const substanceTypeDistribution = countValues(
    substanceDetails.map((entry) => entry.substance),
    substanceTypeOptions.map((option) => option.value),
  )
  const substanceAmountDistribution = countValues(
    substanceDetails.flatMap((entry) => (entry.amount ? [entry.amount] : [])),
    substanceAmountOptions.map((option) => option.value),
  )
  const substanceTimingDistribution = countValues(
    substanceDetails.flatMap((entry) => (entry.timing ? [entry.timing] : [])),
    substanceTimingOptions.map((option) => option.value),
  )
  const substanceReasonDistribution = countValues(
    substanceDetails.flatMap((entry) => (entry.reason ? [entry.reason] : [])),
    substanceReasonOptions.map((option) => option.value),
  )
  const substanceHelpedDistribution = countValues(
    substanceDetails.flatMap((entry) => (entry.helped ? [entry.helped] : [])),
    substanceHelpedOptions.map((option) => option.value),
  )

  const average = (values: number[]) => {
    const recorded = values.filter((value) => value > 0)
    return recorded.length ? recorded.reduce((total, value) => total + value, 0) / recorded.length : 0
  }
  const quickRows = quickCheckIns.map((entry) => ({
    use: entry.substanceUse === 'YES',
    sleep: quickSleepScore[entry.sleepDuration],
    anxiety: quickAnxietyScore[entry.anxiety],
    warning: quickWarningScore[entry.warningSigns],
  }))
  const useRows = quickRows.filter((entry) => entry.use)
  const noUseRows = quickRows.filter((entry) => !entry.use)
  const compareAverage = (key: 'sleep' | 'anxiety') => {
    const useAverage = average(useRows.map((entry) => entry[key]))
    const noUseAverage = average(noUseRows.map((entry) => entry[key]))

    if (!useAverage || !noUseAverage) {
      return 'Not enough quick check-ins to compare yet.'
    }

    const unit = key === 'sleep' ? 'hours' : 'anxiety score'
    return `Use days averaged ${useAverage.toFixed(1)} ${unit}; non-use days averaged ${noUseAverage.toFixed(1)} ${unit}.`
  }
  const warningSignsComparison =
    useRows.length && noUseRows.length
      ? `Warning signs were noted on ${useRows.filter((entry) => entry.warning > 0).length}/${useRows.length} use days and ${noUseRows.filter((entry) => entry.warning > 0).length}/${noUseRows.length} non-use days.`
      : 'Not enough quick check-ins to compare yet.'

  const sleepDurationDistribution = countValues(
    sleepEntries.map((entry) => entry.durationCategory),
    sleepDurationOptions.map((option) => option.value),
  )
  const sleepQualityDistribution = countValues(
    sleepEntries.map((entry) => entry.quality),
    sleepQualityOptions.map((option) => option.value),
  )
  const sleepDisruptions = countArrayValues(
    sleepEntries.map((entry) => entry.disruptions),
    sleepDisruptionOptions.map((option) => option.value),
    ['NONE'],
  )

  const nightmareIntensityDistribution = countValues(
    nightmareEntries.map((entry) => entry.intensity),
    nightmareIntensityOptions.map((option) => option.value),
  )
  const wakeReactions = countArrayValues<NightmareWakeReaction>(
    nightmareEntries.map((entry) => entry.wakeReactions),
    nightmareWakeOptions.map((option) => option.value),
  )
  const afterWaking = countArrayValues<NightmareAfterWaking>(
    nightmareEntries.map((entry) => entry.afterWaking),
    nightmareAfterOptions.map((option) => option.value),
  )

  const anxietySeverityDistribution = countValues(
    eveningCheckIns.map((entry) => entry.anxietySeverity),
    severityOptions.map((option) => option.value),
  )
  const anxietyContributors = countArrayValues<AnxietyContributor>(
    eveningCheckIns.map((entry) => entry.anxietyContributors),
    anxietyContributorOptions.map((option) => option.value),
  )

  const depressionSeverityDistribution = countValues(
    eveningCheckIns.map((entry) => entry.depressionSeverity),
    severityOptions.map((option) => option.value),
  )
  const depressionSymptoms = countArrayValues<DepressionSymptom>(
    eveningCheckIns.map((entry) => entry.depressionSymptoms),
    depressionSymptomOptions.map((option) => option.value),
    ['NONE'],
  )
  const depressionContributors = countArrayValues<DepressionContributor>(
    eveningCheckIns.map((entry) => entry.depressionContributors),
    depressionContributorOptions.map((option) => option.value),
  )

  const suspiciousnessDistribution = countValues(
    eveningCheckIns.map((entry) => entry.suspiciousness),
    psychosisSeverityOptions.map((option) => option.value),
  )
  const unusualMeaningsDistribution = countValues(
    eveningCheckIns.map((entry) => entry.unusualMeanings),
    psychosisSeverityOptions.map((option) => option.value),
  )
  const beliefCertaintyDistribution = countValues(
    eveningCheckIns.map((entry) => entry.beliefCertainty),
    beliefCertaintyOptions.map((option) => option.value),
  )
  const perceptualExperiences = countArrayValues<PerceptualExperience>(
    eveningCheckIns.map((entry) => entry.perceptualExperiences),
    perceptualExperienceOptions.map((option) => option.value),
    ['NONE'],
  )
  const thinkingClarityDistribution = countValues(
    eveningCheckIns.map((entry) => entry.thinkingClarity),
    thinkingClarityOptions.map((option) => option.value),
  )
  const realityCheckDistribution = countValues(
    eveningCheckIns.map((entry) => entry.realityCheck),
    realityCheckOptions.map((option) => option.value),
  )
  const functioning = countArrayValues<FunctioningItem>(
    eveningCheckIns.map((entry) => entry.functioning),
    functioningOptions.map((option) => option.value),
  )

  const mostCommonDuration = mostCommon(sleepDurationDistribution, (value) =>
    optionLabel(sleepDurationOptions, value),
  )
  const anxietyPhrase = severityPhrase(eveningCheckIns, 'anxietySeverity')
  const depressionPhrase = severityPhrase(eveningCheckIns, 'depressionSeverity')
  const commonAnxiety = topCounts(anxietyContributors, (value) => optionLabel(anxietyContributorOptions, value), 2)
    .map((item) => item.label.toLowerCase())
    .join(' and ')
  const suspiciousnessPhrase = mostCommon(suspiciousnessDistribution, (value) =>
    optionLabel(psychosisSeverityOptions, value),
  ).toLowerCase()

  const summaryBits = [
    `Quick check-ins were logged ${quickCheckIns.length} time${quickCheckIns.length === 1 ? '' : 's'}.`,
    `Over this period, sleep last night was most often ${mostCommonDuration.toLowerCase()}.`,
    `Anxiety was most often ${anxietyPhrase}${commonAnxiety ? ` and was commonly linked with ${commonAnxiety}` : ''}.`,
    `Depression was most often ${depressionPhrase}.`,
    `Nightmares were logged ${nightmareEntries.length} time${nightmareEntries.length === 1 ? '' : 's'}.`,
    `Suspiciousness was mostly ${suspiciousnessPhrase}.`,
    includeSubstanceSummary
      ? `Substance use was recorded on ${new Set(substanceCheckIns.map((entry) => entry.date)).size} day${new Set(substanceCheckIns.map((entry) => entry.date)).size === 1 ? '' : 's'}.`
      : 'Substance use is not included in this report.',
    'This report is a factual tracking summary and is not a diagnosis.',
  ]

  return {
    range: { start, end },
    completion: {
      quickCheckIns: quickCheckIns.length,
      checkInDays: eveningCheckIns.length,
      sleepEntries: sleepEntries.length,
      nightmareLogs: nightmareEntries.length,
      journalEntries: journalEntries.length,
    },
    quickCheckIns: {
      moodDistribution: quickMoodDistribution,
      anxietyDistribution: quickAnxietyDistribution,
      depressionDistribution: quickDepressionDistribution,
      warningDistribution: quickWarningDistribution,
    },
    mood: {
      ratingDistribution: eveningMoodDistribution,
    },
    sleep: {
      mostCommonDuration,
      durationDistribution: sleepDurationDistribution,
      qualityDistribution: sleepQualityDistribution,
      commonDisruptions: topCounts(sleepDisruptions, (value) => optionLabel(sleepDisruptionOptions, value), 5),
    },
    nightmares: {
      count: nightmareEntries.length,
      intensityDistribution: nightmareIntensityDistribution,
      wakeReactions: topCounts(wakeReactions, (value) => optionLabel(nightmareWakeOptions, value), 5),
      afterWaking: topCounts(afterWaking, (value) => optionLabel(nightmareAfterOptions, value), 5),
      descriptions: options.includeNightmareNotes
        ? nightmareEntries.map((entry) => entry.description?.trim()).filter(Boolean) as string[]
        : [],
    },
    anxiety: {
      severityDistribution: anxietySeverityDistribution,
      commonContributors: topCounts(anxietyContributors, (value) => optionLabel(anxietyContributorOptions, value), 5),
    },
    depression: {
      severityDistribution: depressionSeverityDistribution,
      commonSymptoms: topCounts(depressionSymptoms, (value) => optionLabel(depressionSymptomOptions, value), 5),
      commonContributors: topCounts(
        depressionContributors,
        (value) => optionLabel(depressionContributorOptions, value),
        5,
      ),
    },
    warningSigns: {
      suspiciousnessDistribution,
      unusualMeaningsDistribution,
      beliefCertaintyDistribution,
      perceptualExperiences: topCounts(perceptualExperiences, (value) => optionLabel(perceptualExperienceOptions, value), 5),
      thinkingClarityDistribution,
      realityCheckDistribution,
    },
    substanceUse: {
      included: includeSubstanceSummary,
      detailsIncluded: includeSubstanceDetails,
      daysWithUse: includeSubstanceSummary ? new Set(substanceCheckIns.map((entry) => entry.date)).size : 0,
      entriesWithUse: includeSubstanceSummary ? substanceCheckIns.length : 0,
      commonSubstances: includeSubstanceSummary
        ? topCounts(substanceTypeDistribution, (value) => optionLabel(substanceTypeOptions, value), 5)
        : [],
      amountDistribution: includeSubstanceSummary ? substanceAmountDistribution : countValues([], substanceAmountOptions.map((option) => option.value)),
      timingDistribution: includeSubstanceSummary ? substanceTimingDistribution : countValues([], substanceTimingOptions.map((option) => option.value)),
      reasonDistribution: includeSubstanceSummary ? substanceReasonDistribution : countValues([], substanceReasonOptions.map((option) => option.value)),
      helpedDistribution: includeSubstanceSummary ? substanceHelpedDistribution : countValues([], substanceHelpedOptions.map((option) => option.value)),
      sleepComparison: includeSubstanceSummary ? compareAverage('sleep') : 'Not included in this report.',
      anxietyComparison: includeSubstanceSummary ? compareAverage('anxiety') : 'Not included in this report.',
      warningSignsComparison: includeSubstanceSummary ? warningSignsComparison : 'Not included in this report.',
      details: includeSubstanceDetails
        ? substanceDetails.map((entry) => ({
            date: entry.date,
            substance: optionLabel(substanceTypeOptions, entry.substance),
            amount: entry.amount ? optionLabel(substanceAmountOptions, entry.amount) : undefined,
            timing: entry.timing ? optionLabel(substanceTimingOptions, entry.timing) : undefined,
            reason: entry.reason ? optionLabel(substanceReasonOptions, entry.reason) : undefined,
            helped: entry.helped ? optionLabel(substanceHelpedOptions, entry.helped) : undefined,
          }))
        : [],
    },
    functioning,
    notes: options.includeNotes
      ? eveningCheckIns.flatMap((entry) => (entry.notes?.trim() ? [{ date: entry.date, text: entry.notes.trim() }] : []))
      : [],
    selectedJournalEntries: journalEntries
      .filter((entry) => options.selectedJournalIds.includes(entry.id))
      .map((entry) => ({ title: entry.title, body: entry.body, createdAt: entry.createdAt })),
    plainLanguageSummary: summaryBits.join(' '),
  }
}
