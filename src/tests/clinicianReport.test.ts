import { describe, expect, it } from 'vitest'
import { defaultAppSettings } from '../data/seed'
import {
  coverageLevelFor,
  ordinalMedianValues,
  prepareClinicianReport,
  previousEquivalentRange,
  reportEvidenceRules,
  tiedModes,
} from '../lib/clinicianReport'
import { buildReportCsvBlob, buildReportExcelBlob, buildReportPdfBlob } from '../lib/reportFiles'
import { defaultTreatmentProgress, defaultTreatmentSettings } from '../lib/treatment'
import type {
  AppData,
  EveningCheckIn,
  NightmareEntry,
  QuickCheckIn,
  SleepEntry,
} from '../types'

const emptyData = (): AppData => ({
  quotes: [],
  dailyQuoteState: [],
  quickCheckIns: [],
  benzodiazepineEntries: [],
  sleepEntries: [],
  nightmareEntries: [],
  eveningCheckIns: [],
  journalEntries: [],
  supportContacts: [],
  treatmentProgress: defaultTreatmentProgress(),
  treatmentSettings: defaultTreatmentSettings(),
  treatmentResponses: [],
  treatmentProgramPlans: [],
  treatmentActivities: [],
  treatmentSessions: [],
  treatmentReviews: [],
  treatmentNightmares: [],
  appSettings: defaultAppSettings,
})

const evening = (date: string, overrides: Partial<EveningCheckIn> = {}): EveningCheckIn => ({
  id: `evening-${date}`,
  date,
  moodRating: '3',
  anxietySeverity: 'MODERATE',
  anxietyContributors: [],
  depressionSeverity: 'MODERATE',
  depressionSymptoms: ['NONE'],
  depressionContributors: [],
  suspiciousness: 'NOT_AT_ALL',
  unusualMeanings: 'NOT_AT_ALL',
  beliefCertainty: 'NOT_APPLICABLE',
  perceptualExperiences: ['NONE'],
  thinkingClarity: 'CLEAR',
  realityCheck: 'NOT_APPLICABLE',
  functioning: [],
  status: 'COMPLETE',
  createdAt: `${date}T08:00:00.000Z`,
  updatedAt: `${date}T08:00:00.000Z`,
  ...overrides,
})

const sleep = (date: string, overrides: Partial<SleepEntry> = {}): SleepEntry => ({
  id: `sleep-${date}`,
  date,
  durationCategory: 'SEVEN_TO_EIGHT',
  quality: 'FAIR',
  disruptions: ['NONE'],
  createdAt: `${date}T07:00:00.000Z`,
  updatedAt: `${date}T07:00:00.000Z`,
  ...overrides,
})

const quick = (date: string, overrides: Partial<QuickCheckIn> = {}): QuickCheckIn => ({
  id: `quick-${date}`,
  date,
  sleepDuration: 'SEVEN_TO_EIGHT',
  mood: 'MEH',
  anxiety: 'MEDIUM',
  depression: 'MEDIUM',
  warningSigns: 'NONE',
  substanceUse: 'NONE',
  substances: [],
  createdAt: `${date}T09:00:00.000Z`,
  updatedAt: `${date}T09:00:00.000Z`,
  ...overrides,
})

const nightmare = (date: string, overrides: Partial<NightmareEntry> = {}): NightmareEntry => ({
  id: `nightmare-${date}`,
  occurredAt: `${date}T03:00:00.000Z`,
  intensity: 'SEVERE',
  wakeReactions: ['PANIC'],
  afterWaking: ['USED_GROUNDING'],
  createdAt: `${date}T03:05:00.000Z`,
  updatedAt: `${date}T03:05:00.000Z`,
  ...overrides,
})

const options = {
  includeNotes: false,
  includeNightmareNotes: false,
  includeSubstanceSummary: false,
  includeSubstanceDetails: false,
  selectedJournalIds: [],
}

describe('clinician report evidence engine', () => {
  it('centralises the requested sample thresholds', () => {
    expect(reportEvidenceRules).toEqual(expect.objectContaining({
      simplePeriodMinimum: 5,
      comparisonMinimum: 3,
      relationshipMinimum: 7,
      comparisonGroupMinimum: 3,
    }))
    expect(coverageLevelFor(0)).toBe('no-data')
    expect(coverageLevelFor(2)).toBe('very-limited')
    expect(coverageLevelFor(4)).toBe('limited')
    expect(coverageLevelFor(5)).toBe('sufficient')
  })

  it('describes one completed entry as a single observation', () => {
    const data = emptyData()
    data.eveningCheckIns = [evening('2026-08-04', { anxietySeverity: 'SEVERE' })]
    const report = prepareClinicianReport(data, '2026-07-29', '2026-08-04', options)
    expect(report.summaryFindings.find((item) => item.id === 'anxiety-summary')?.statement).toContain('single observation')
    expect(report.keyMeasures[0].typical).toBe('Limited data')
  })

  it('uses limited wording for three or four entries and period wording at five', () => {
    const limitedData = emptyData()
    limitedData.eveningCheckIns = ['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04'].map((date) => evening(date))
    const limited = prepareClinicianReport(limitedData, '2026-07-29', '2026-08-04', options)
    expect(limited.summaryFindings.find((item) => item.id === 'anxiety-summary')?.statement).toContain('available data is limited')

    const sufficientData = emptyData()
    sufficientData.eveningCheckIns = ['2026-07-31', '2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04'].map((date) => evening(date))
    const sufficient = prepareClinicianReport(sufficientData, '2026-07-29', '2026-08-04', options)
    expect(sufficient.summaryFindings.find((item) => item.id === 'anxiety-summary')?.statement).toContain('5 completed evening check-ins')
    expect(sufficient.summaryFindings.find((item) => item.id === 'anxiety-summary')?.statement).not.toContain('available data is limited')
  })

  it('handles tied modes and ordinal medians without arbitrary selection', () => {
    expect(tiedModes({ NONE: 0, MILD: 2, MODERATE: 2, SEVERE: 0 }, ['NONE', 'MILD', 'MODERATE', 'SEVERE'])).toEqual(['MILD', 'MODERATE'])
    expect(ordinalMedianValues(['MILD', 'MODERATE', 'SEVERE', 'EXTREME'], ['NONE', 'MILD', 'MODERATE', 'SEVERE', 'EXTREME'])).toEqual(['MODERATE', 'SEVERE'])
    expect(ordinalMedianValues(['MILD', undefined, 'SEVERE'], ['NONE', 'MILD', 'MODERATE', 'SEVERE', 'EXTREME'])).toEqual(['MILD', 'SEVERE'])
  })

  it('keeps the latest severe value visible beside a moderate typical value', () => {
    const data = emptyData()
    data.eveningCheckIns = [
      evening('2026-07-31'),
      evening('2026-08-01'),
      evening('2026-08-02'),
      evening('2026-08-03'),
      evening('2026-08-04', { anxietySeverity: 'SEVERE' }),
    ]
    const report = prepareClinicianReport(data, '2026-07-29', '2026-08-04', options)
    expect(report.keyMeasures[0]).toEqual(expect.objectContaining({ latest: 'Severe', typical: 'Moderate', higherSeverityCount: 1 }))
  })

  it('keeps quick and evening scales separate', () => {
    const data = emptyData()
    data.quickCheckIns = [quick('2026-08-04', { anxiety: 'EXTREME' })]
    data.eveningCheckIns = [evening('2026-08-04', { anxietySeverity: 'NONE' })]
    const report = prepareClinicianReport(data, '2026-07-29', '2026-08-04', options)
    expect(report.quickCheckIns.anxietyDistribution.EXTREME).toBe(1)
    expect(report.anxiety.severityDistribution.NONE).toBe(1)
    expect(report.summaryFindings.find((item) => item.id === 'quick-limited')?.limitations).toContain('Quick and evening scales are not merged.')
  })

  it('keeps unanswered multi-select fields separate from explicit none', () => {
    const data = emptyData()
    data.eveningCheckIns = [
      evening('2026-08-03', { depressionSymptoms: [], perceptualExperiences: [], functioning: [] }),
      evening('2026-08-04', { depressionSymptoms: ['NONE'], perceptualExperiences: ['NONE'], functioning: ['SHOWERED'] }),
    ]
    data.sleepEntries = [
      sleep('2026-08-03', { disruptions: [] }),
      sleep('2026-08-04', { disruptions: ['NONE'] }),
    ]
    const report = prepareClinicianReport(data, '2026-07-29', '2026-08-04', options)
    expect(report.detailMissing).toEqual(expect.objectContaining({
      depressionSymptoms: 1,
      perceptualExperiences: 1,
      sleepDisruptions: 1,
      functioning: 1,
    }))
    expect(report.detailDistributions.depressionSymptoms.NONE).toBe(1)
    expect(report.detailDistributions.perceptualExperiences.NONE).toBe(1)
    expect(report.detailDistributions.sleepDisruptions.NONE).toBe(1)
  })

  it('applies relationship sample and variation rules to substance comparisons', () => {
    const data = emptyData()
    const dates = ['2026-07-29', '2026-07-30', '2026-07-31', '2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04']
    data.quickCheckIns = dates.map((date, index) => quick(date, {
      substanceUse: index < 3 ? 'YES' : 'NONE',
      sleepDuration: index % 2 ? 'FIVE_TO_SIX' : 'SEVEN_TO_EIGHT',
      anxiety: index % 2 ? 'HIGH' : 'MEDIUM',
      warningSigns: index % 2 ? 'MILD' : 'NONE',
    }))
    const sufficient = prepareClinicianReport(data, '2026-07-29', '2026-08-04', { ...options, includeSubstanceSummary: true })
    expect(sufficient.substanceUse.sleepComparison).toContain('3 quick check-ins with recorded substance use')
    expect(sufficient.substanceUse.sleepComparison).toContain('does not establish a cause')

    data.quickCheckIns.pop()
    const limited = prepareClinicianReport(data, '2026-07-29', '2026-08-04', { ...options, includeSubstanceSummary: true })
    expect(limited.substanceUse.sleepComparison).toContain('Not enough completed, varied quick check-ins')
  })

  it('uses the immediately preceding equal date range and requires enough entries', () => {
    expect(previousEquivalentRange('2026-07-29', '2026-08-04')).toEqual({ start: '2026-07-22', end: '2026-07-28' })
    const data = emptyData()
    data.eveningCheckIns = [
      evening('2026-07-26', { anxietySeverity: 'MILD' }),
      evening('2026-07-27', { anxietySeverity: 'MILD' }),
      evening('2026-07-28', { anxietySeverity: 'MILD' }),
      evening('2026-08-02', { anxietySeverity: 'SEVERE' }),
      evening('2026-08-03', { anxietySeverity: 'SEVERE' }),
      evening('2026-08-04', { anxietySeverity: 'SEVERE' }),
    ]
    const report = prepareClinicianReport(data, '2026-07-29', '2026-08-04', options)
    expect(report.whatChanged.find((item) => item.id === 'evening-anxiety')).toEqual(expect.objectContaining({ display: 'Higher severity', currentCount: 3, previousCount: 3 }))

    data.eveningCheckIns = data.eveningCheckIns.filter((entry) => entry.date !== '2026-07-26')
    const insufficient = prepareClinicianReport(data, '2026-07-29', '2026-08-04', options)
    expect(insufficient.whatChanged.some((item) => item.id === 'evening-anxiety')).toBe(false)
  })

  it('attaches evidence and uses non-causal contributor language', () => {
    const data = emptyData()
    data.eveningCheckIns = ['2026-07-31', '2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04'].map((date) => evening(date, { anxietyContributors: ['HEALTH'] }))
    const report = prepareClinicianReport(data, '2026-07-29', '2026-08-04', options)
    const contributor = report.summaryFindings.find((item) => item.id === 'contributor-summary')
    expect(contributor?.statement).toContain('selected as a contributor')
    expect(contributor?.statement).toContain('not presented as a proven cause')
    expect(contributor?.evidence[0]).toEqual(expect.objectContaining({ numerator: 5, denominator: 5 }))
  })

  it('keeps excluded free text out of scoped records and generated findings', () => {
    const data = emptyData()
    data.eveningCheckIns = [evening('2026-08-04', { notes: 'private daily note' })]
    data.sleepEntries = [sleep('2026-08-04', { notes: 'private sleep note' })]
    data.nightmareEntries = [nightmare('2026-08-04', { description: 'private nightmare note' })]
    const excluded = prepareClinicianReport(data, '2026-07-29', '2026-08-04', options)
    const excludedJson = JSON.stringify(excluded)
    expect(excludedJson).not.toContain('private daily note')
    expect(excludedJson).not.toContain('private sleep note')
    expect(excludedJson).not.toContain('private nightmare note')

    const included = prepareClinicianReport(data, '2026-07-29', '2026-08-04', { ...options, includeNotes: true, includeNightmareNotes: true })
    expect(JSON.stringify(included.raw)).toContain('private daily note')
    expect(JSON.stringify(included.raw)).toContain('private nightmare note')
    expect(included.summaryFindings.map((item) => item.statement).join(' ')).not.toContain('private daily note')
  })

  it('produces deterministic safe findings for the same input', () => {
    const data = emptyData()
    data.eveningCheckIns = ['2026-07-31', '2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04'].map((date) => evening(date))
    const first = prepareClinicianReport(data, '2026-07-29', '2026-08-04', options)
    const second = prepareClinicianReport(data, '2026-07-29', '2026-08-04', options)
    expect(second.summaryFindings).toEqual(first.summaryFindings)
    const statements = first.summaryFindings.map((item) => item.statement).join(' ')
    expect(statements).not.toMatch(/caused|this proves|you have|should change medication|will help/i)
  })
})

describe('nightmare report semantics', () => {
  it('distinguishes no detailed logs from an explicit sleep entry marked none', () => {
    const data = emptyData()
    data.sleepEntries = [sleep('2026-08-04', { disruptions: ['NONE'] })]
    const report = prepareClinicianReport(data, '2026-07-29', '2026-08-04', options)
    expect(report.nightmares).toEqual(expect.objectContaining({ eventCount: 0, detailedLogCount: 0, explicitNoNightmareDays: 1, unansweredSleepEntries: 0 }))
    expect(report.nightmares.statement).toContain('No nightmares were recorded across 1 completed sleep entry')
  })

  it('keeps an unanswered disruption list separate from recorded none', () => {
    const data = emptyData()
    data.sleepEntries = [sleep('2026-08-03', { disruptions: ['NONE'] }), sleep('2026-08-04', { disruptions: [] })]
    const report = prepareClinicianReport(data, '2026-07-29', '2026-08-04', options)
    expect(report.nightmares.explicitNoNightmareDays).toBe(1)
    expect(report.nightmares.unansweredSleepEntries).toBe(1)
  })

  it('reports a sleep disruption separately from an uncompleted detailed log', () => {
    const data = emptyData()
    const sleepEntry = sleep('2026-08-04', { disruptions: ['NIGHTMARES'] })
    data.sleepEntries = [sleepEntry]
    data.nightmareEntries = [nightmare('2026-08-04', {
      sleepEntryId: sleepEntry.id,
      intensity: 'MODERATE',
      wakeReactions: [],
      afterWaking: [],
      createdAt: '2026-08-04T03:05:00.000Z',
      updatedAt: '2026-08-04T03:05:00.000Z',
    })]
    const report = prepareClinicianReport(data, '2026-07-29', '2026-08-04', options)
    expect(report.nightmares).toEqual(expect.objectContaining({ eventCount: 1, detailedLogCount: 0, genericSleepLinkedCount: 1, sleepDisruptionDays: 1 }))
    expect(report.nightmares.statement).toContain('selected as a sleep disruption')
    expect(report.nightmares.statement).toContain('no detailed nightmare logs')
    expect(Object.values(report.detailDistributions.nightmareIntensity).every((count) => count === 0)).toBe(true)
  })

  it('shows detailed intensity only for a completed detailed log', () => {
    const data = emptyData()
    data.nightmareEntries = [nightmare('2026-08-04')]
    const report = prepareClinicianReport(data, '2026-07-29', '2026-08-04', options)
    expect(report.nightmares.detailedLogCount).toBe(1)
    expect(report.detailDistributions.nightmareIntensity.SEVERE).toBe(1)
  })
})

describe('clinician report exports', () => {
  it('uses the same evidence in formatted exports and scoped raw records in data exports', async () => {
    const data = emptyData()
    data.quickCheckIns = [quick('2026-08-04')]
    data.eveningCheckIns = [evening('2026-08-04')]
    data.sleepEntries = [sleep('2026-08-04')]
    const report = prepareClinicianReport(data, '2026-07-29', '2026-08-04', options)
    const evidenceSentence = report.summaryFindings[0].statement
    const pdf = await buildReportPdfBlob(report).text()
    const workbook = await buildReportExcelBlob(report).text()
    const csv = await buildReportCsvBlob(report).text()

    expect(pdf).toContain('1 of 7 days have completed evening check-ins')
    expect(pdf).toContain('check-in was completed.')
    expect(pdf.indexOf('Overview')).toBeLessThan(pdf.indexOf('Detailed data'))
    expect(workbook).toContain('Worksheet ss:Name="Raw evening"')
    expect(workbook).toContain(evidenceSentence)
    expect(csv).toContain('Raw evening check-in')
    expect(csv).toContain(evidenceSentence)
  })
})
