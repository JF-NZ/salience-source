import { describe, expect, it } from 'vitest'
import { crisisTeamOptions, healthNzCrisisTeamsLastUpdated } from '../data/crisisTeams'
import { depressionSymptomOptions, eveningMoodOptions, quickCheckInLabels, substanceTypeOptions } from '../data/options'
import {
  cptEntryModuleByPoint,
  recurringNightmareThemes,
  treatmentNavItem,
  treatmentPrograms,
  treatmentUseModeLabels,
} from '../data/treatmentContent'
import { primaryNavigationItems } from '../data/navigation'
import { defaultAppSettings, defaultSupportContacts, isRetiredSeedQuote, seedQuotes } from '../data/seed'
import { checkInDatePhrase, completedDaysRange, localDateKey, localDateTimeInput, previousDateKey, relativeDateTimeInputLabel, relativeDayLabel } from '../lib/dates'
import { nearestCrisisTeam } from '../lib/crisisTeams'
import { buildExportBundle, parseExportBundle } from '../lib/exportImport'
import { mergeJournalTags, suggestJournalTags } from '../lib/journalTags'
import { buildMedicationUseTrendDays } from '../lib/medicationTrends'
import { createGenericNightmareEntry, sleepEntryHasNightmares } from '../lib/sleepNightmares'
import { featureFlagsFor } from '../config/featureFlags'
import {
  buildReminderBody,
  dueReminderLabels,
  nextTreatmentAppointments,
  shouldSendReminder,
  treatmentActivityNotificationCopy,
  treatmentAppointmentNotificationCopy,
} from '../lib/notifications'
import { chooseQuoteForDate, refreshDailyQuote, resolveDailyQuote } from '../lib/quotes'
import { fullDayLogForLastNight, reminderCompletionForData, sleepEntryForLastNight } from '../lib/reminderCompletion'
import { generateReport } from '../lib/report'
import { prepareClinicianReport } from '../lib/clinicianReport'
import { buildReportDocxBlob, buildReportExcelBlob } from '../lib/reportFiles'
import { toggleExclusiveNone } from '../lib/selection'
import {
  averageKnown,
  buildWellbeingTrendDays,
  hasEnoughGroups,
  hasEnoughPairs,
  nightmareAnxietyPairs,
  sleepMoodPairs,
  weeklyTrendComparisons,
} from '../lib/wellbeingTrends'
import {
  buildTreatmentVisitBrief,
  currentStateBlocksProcessing,
  currentStateNeedsCrisisActions,
  defaultTreatmentProgramPlan,
  defaultTreatmentProgress,
  defaultTreatmentSettings,
  filterTreatmentReviewsByDate,
  findTreatmentReviewDateConflict,
  getConfiguredCrisisContacts,
  hasTreatmentActivityToday,
  isProgramReadyToComplete,
  markProgramOpened,
  summarizePhaseProgress,
  summarizeClinicianMeasures,
  summarizeProgramProgress,
  summarizeTreatmentActivities,
  summarizeTreatmentNightmares,
  summarizeTreatmentReviews,
  treatmentReviewDateIsFuture,
  treatmentEntryScreenForContent,
  treatmentScreenAfterPause,
  validateClinicianMeasure,
} from '../lib/treatment'
import { buildTreatmentHandoffDocx, buildTreatmentHandoffLines } from '../lib/treatmentExport'
import type {
  AppData,
  DepressionSymptom,
  EveningCheckIn,
  JournalEntry,
  PerceptualExperience,
  SleepDisruption,
  SleepEntry,
  TreatmentActivity,
  TreatmentNightmareEntry,
  TreatmentResponse,
  TreatmentReview,
} from '../types'

const emptyData: AppData = {
  quotes: seedQuotes,
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
}

const treatmentResponse = (
  id: string,
  programId: TreatmentResponse['programId'],
  moduleId: string,
  status: TreatmentResponse['status'],
  values: Record<string, string> = {},
): TreatmentResponse => ({
  id,
  programId,
  moduleId,
  values,
  hiddenPromptIds: [],
  clinicianAssigned: false,
  status,
  lastStepIndex: 0,
  startedAt: '2026-07-28T00:00:00.000Z',
  completedAt: status === 'completed' ? '2026-07-28T00:10:00.000Z' : undefined,
  createdAt: '2026-07-28T00:00:00.000Z',
  updatedAt: '2026-07-28T00:10:00.000Z',
})

const chosenActivity = (
  id: string,
  overrides: Partial<TreatmentActivity> = {},
): TreatmentActivity => ({
  id,
  programId: 'cpt',
  title: `Activity ${id}`,
  source: 'clinician-agreed',
  status: 'planned',
  createdAt: '2026-07-28T00:00:00.000Z',
  updatedAt: '2026-07-28T00:10:00.000Z',
  ...overrides,
})

const trendEveningCheckIn = (id: string, date: string, overrides: Partial<EveningCheckIn> = {}): EveningCheckIn => ({
  id,
  date,
  moodRating: '4',
  anxietySeverity: 'NONE',
  anxietyContributors: [],
  depressionSeverity: 'NONE',
  depressionSymptoms: [],
  depressionContributors: [],
  suspiciousness: 'NOT_AT_ALL',
  unusualMeanings: 'NOT_AT_ALL',
  beliefCertainty: 'NOT_APPLICABLE',
  perceptualExperiences: ['NONE'],
  thinkingClarity: 'CLEAR',
  realityCheck: 'NOT_APPLICABLE',
  functioning: [],
  status: 'COMPLETE',
  createdAt: `${date}T20:00:00.000Z`,
  updatedAt: `${date}T20:00:00.000Z`,
  ...overrides,
})

describe('daily quote selection', () => {
  it('ships a broad built-in quote library', () => {
    const genderedLanguage = /\b(?:he|she|him|her|his|hers|himself|herself|man|men|woman|women|female|male|girl|boy|father|mother|son|daughter|husband|wife|ladies|gentlemen)\b/i

    expect(seedQuotes.length).toBeGreaterThan(60)
    expect(seedQuotes.some((quote) => quote.author === 'Marcus Aurelius')).toBe(true)
    expect(seedQuotes.some((quote) => quote.author === 'Epictetus')).toBe(true)
    expect(seedQuotes.some((quote) => quote.author === 'Nelson Mandela')).toBe(true)
    expect(seedQuotes.some((quote) => quote.author === 'Gabor Mate')).toBe(true)
    expect(seedQuotes.some((quote) => quote.author === 'Frederick Douglass')).toBe(true)
    expect(seedQuotes.some((quote) => quote.author === 'Viktor Frankl')).toBe(true)
    expect(seedQuotes.every((quote) => !genderedLanguage.test(quote.text))).toBe(true)
    expect(seedQuotes.every((quote) => !isRetiredSeedQuote(quote))).toBe(true)
  })

  it('chooses a stable quote for a local date and keeps manual refresh state', () => {
    const date = '2026-06-08'
    const first = chooseQuoteForDate(seedQuotes, date)
    const second = chooseQuoteForDate(seedQuotes, date)
    expect(first?.id).toBe(second?.id)

    const refreshed = refreshDailyQuote(seedQuotes, undefined, date)
    expect(refreshed?.manuallyRefreshed).toBe(true)
    expect(resolveDailyQuote(seedQuotes, refreshed, date)?.id).toBe(refreshed?.quoteId)
  })
})

describe('journal tag suggestions', () => {
  it('suggests neutral local tags from journal text without inferring a diagnosis', () => {
    const suggestions = suggestJournalTags(
      'I woke from a nightmare, slept badly, and have a psychiatrist appointment tomorrow.',
    )

    expect(suggestions).toEqual(expect.arrayContaining(['nightmare', 'sleep', 'appointment']))
    expect(suggestions).not.toContain('psychosis')
    expect(suggestions).not.toContain('ptsd')
  })

  it('does not duplicate an existing journal tag when suggestions are merged', () => {
    expect(mergeJournalTags(['Sleep', 'personal'], ['sleep', 'nightmare'])).toEqual([
      'Sleep',
      'personal',
      'nightmare',
    ])
  })

  it('recognises natural struggle wording, common medication spelling, and practical context', () => {
    const suggestions = suggestJournalTags(
      "I'm overwhelmed and struggling to get home after missing the bus. I also took my Clonazapam.",
    )

    expect(suggestions).toEqual(expect.arrayContaining([
      'struggling',
      'transport',
      'medication',
    ]))
  })

  it('avoids treating an ordinary use of worked as an employment entry', () => {
    expect(suggestJournalTags('The breathing exercise worked and helped me settle.')).not.toContain('work')
    expect(suggestJournalTags('My shift at work was difficult today.')).toContain('work')
  })
})

describe('sleep-linked nightmare entries', () => {
  it('creates a generic, editable nightmare record on the same local graph date as the sleep entry', () => {
    const sleepEntry: SleepEntry = {
      id: 'sleep-nightmare',
      date: '2026-08-04',
      durationCategory: 'SEVEN_TO_EIGHT',
      quality: 'FAIR',
      disruptions: ['NIGHTMARES'],
      createdAt: '2026-08-04T08:00:00.000Z',
      updatedAt: '2026-08-04T08:00:00.000Z',
    }

    const nightmare = createGenericNightmareEntry(sleepEntry, 'nightmare-from-sleep', '2026-08-04T08:00:00.000Z')

    expect(sleepEntryHasNightmares(sleepEntry)).toBe(true)
    expect(nightmare).toMatchObject({
      id: 'nightmare-from-sleep',
      sleepEntryId: sleepEntry.id,
      intensity: 'MODERATE',
      wakeReactions: [],
      afterWaking: [],
    })
    expect(localDateKey(new Date(nightmare.occurredAt))).toBe(sleepEntry.date)
  })
})

describe('date labels', () => {
  it('labels today and yesterday for selected local dates', () => {
    const today = new Date('2026-06-08T12:00:00')

    expect(relativeDayLabel('2026-06-08', today)).toBe('today')
    expect(relativeDayLabel('2026-06-07', today)).toBe('yesterday')
    expect(relativeDayLabel('2026-06-06', today)).toBe('')
    expect(previousDateKey(today)).toBe('2026-06-07')
  })

  it('labels date-time entries with the requested today wording', () => {
    const today = new Date('2026-06-08T12:00:00')

    expect(relativeDateTimeInputLabel('2026-06-08T22:30', 'tonight', today)).toBe('tonight')
    expect(relativeDateTimeInputLabel('2026-06-07T23:30', 'tonight', today)).toBe('yesterday')
    expect(relativeDateTimeInputLabel('2026-06-06T23:30', 'tonight', today)).toBe('')
  })

  it('rounds Medication timestamps down to 15-minute blocks', () => {
    expect(localDateTimeInput(new Date(2026, 7, 4, 10, 7), 15)).toBe('2026-08-04T10:00')
    expect(localDateTimeInput(new Date(2026, 7, 4, 10, 30), 15)).toBe('2026-08-04T10:30')
  })

  it('builds check-in wording from the selected entry date', () => {
    const today = new Date('2026-06-29T12:00:00')

    expect(checkInDatePhrase('2026-06-29', today)).toBe('today')
    expect(checkInDatePhrase('2026-06-28', today)).toBe('yesterday')
    expect(checkInDatePhrase('2026-06-25', today)).toBe('on 25/06/2026 (4 days ago)')
  })

  it('builds weekly graph ranges from completed days only', () => {
    const today = new Date('2026-06-12T12:00:00')

    expect(completedDaysRange(7, today)).toEqual({
      start: '2026-06-05',
      end: '2026-06-11',
    })
  })
})

describe('medication use trend data', () => {
  it('keeps blank days separate from the medication portions that were recorded', () => {
    const days = buildMedicationUseTrendDays([
      {
        id: 'morning-clonazepam',
        medication: 'CLONAZEPAM',
        date: '2026-08-05',
        takenAt: '2026-08-05T08:00:00.000Z',
        quarterUnits: 2,
        createdAt: '2026-08-05T08:00:00.000Z',
        updatedAt: '2026-08-05T08:00:00.000Z',
      },
      {
        id: 'afternoon-clonazepam',
        medication: 'CLONAZEPAM',
        date: '2026-08-05',
        takenAt: '2026-08-05T13:00:00.000Z',
        quarterUnits: 2,
        createdAt: '2026-08-05T13:00:00.000Z',
        updatedAt: '2026-08-05T13:00:00.000Z',
      },
      {
        id: 'lorazepam',
        medication: 'LORAZEPAM',
        date: '2026-08-06',
        takenAt: '2026-08-06T09:00:00.000Z',
        quarterUnits: 1,
        createdAt: '2026-08-06T09:00:00.000Z',
        updatedAt: '2026-08-06T09:00:00.000Z',
      },
    ], 7, new Date('2026-08-06T12:00:00'))

    expect(days.map((day) => day.date)).toEqual([
      '2026-07-31',
      '2026-08-01',
      '2026-08-02',
      '2026-08-03',
      '2026-08-04',
      '2026-08-05',
      '2026-08-06',
    ])
    expect(days[0].medications.CLONAZEPAM).toBeUndefined()
    expect(days[5].medications.CLONAZEPAM).toMatchObject({ tabletPortions: 1 })
    expect(days[5].medications.CLONAZEPAM?.entries).toHaveLength(2)
    expect(days[6].medications.LORAZEPAM).toMatchObject({ tabletPortions: 0.5 })
    expect(days[6].medications.CLONAZEPAM).toBeUndefined()
  })
})

describe('wellbeing trend data', () => {
  it('keeps missing values separate from recorded zero, none, and clear states', () => {
    const data: AppData = {
      ...emptyData,
      sleepEntries: [
        {
          id: 'sleep-with-none',
          date: '2026-08-01',
          durationCategory: 'FIVE_TO_SIX',
          quality: 'FAIR',
          disruptions: ['NONE'],
          createdAt: '2026-08-01T08:00:00.000Z',
          updatedAt: '2026-08-01T08:00:00.000Z',
        },
      ],
      eveningCheckIns: [trendEveningCheckIn('clear-check-in', '2026-08-02')],
    }

    const [sleepDay, checkInDay, missingDay] = buildWellbeingTrendDays(data, '2026-08-01', '2026-08-03')

    expect(sleepDay.nightmareCount).toBe(0)
    expect(sleepDay.nightmareState).toBe('none')
    expect(sleepDay.warningSigns).toBeNull()
    expect(sleepDay.warningState).toBe('missing')
    expect(checkInDay.warningSigns).toBe(0)
    expect(checkInDay.warningState).toBe('none')
    expect(checkInDay.thinking).toBe(0)
    expect(checkInDay.thinkingState).toBe('recorded')
    expect(missingDay.nightmareCount).toBeNull()
    expect(missingDay.nightmareState).toBe('missing')
    expect(missingDay.thinkingState).toBe('missing')
  })

  it('pairs sleep with the following local day and preserves a recorded zero in pairs', () => {
    const data: AppData = {
      ...emptyData,
      sleepEntries: [
        {
          id: 'sleep-for-pair',
          date: '2026-08-01',
          durationCategory: 'SEVEN_TO_EIGHT',
          quality: 'GOOD',
          disruptions: ['NONE'],
          createdAt: '2026-08-01T08:00:00.000Z',
          updatedAt: '2026-08-01T08:00:00.000Z',
        },
      ],
      eveningCheckIns: [trendEveningCheckIn('next-day-check-in', '2026-08-02')],
    }
    const days = buildWellbeingTrendDays(data, '2026-08-01', '2026-08-03')

    expect(sleepMoodPairs(days)).toEqual([
      expect.objectContaining({ date: '2026-08-01', nextDate: '2026-08-02', x: 7.5, y: 4 }),
    ])
    expect(nightmareAnxietyPairs(days)).toEqual([
      expect.objectContaining({ date: '2026-08-01', nextDate: '2026-08-02', x: 0, y: 0 }),
    ])
  })

  it('uses the most recently updated same-day check-in instead of selecting the highest score', () => {
    const data: AppData = {
      ...emptyData,
      eveningCheckIns: [trendEveningCheckIn('older-evening', '2026-08-02', {
        moodRating: '5',
        updatedAt: '2026-08-02T18:00:00.000Z',
      })],
      quickCheckIns: [
        {
          id: 'newer-quick',
          date: '2026-08-02',
          createdAt: '2026-08-02T19:00:00.000Z',
          updatedAt: '2026-08-02T19:00:00.000Z',
          sleepDuration: 'FIVE_TO_SIX',
          mood: 'VERY_LOW',
          anxiety: 'HIGH',
          depression: 'HIGH',
          warningSigns: 'CONCERNING',
          substanceUse: 'NONE',
          substances: [],
        },
      ],
    }

    const [day] = buildWellbeingTrendDays(data, '2026-08-02', '2026-08-02')

    expect(day.mood).toBe(1)
    expect(day.anxiety).toBe(3)
    expect(day.depression).toBe(3)
    expect(day.warningSigns).toBe(3)
  })

  it('does not substitute zero for missing values in averages or weekly comparisons', () => {
    expect(averageKnown([0, null, 4])).toBe(2)

    const data: AppData = {
      ...emptyData,
      quickCheckIns: Array.from({ length: 14 }, (_, index) => {
        const day = String(index + 1).padStart(2, '0')
        return {
          id: `quick-${day}`,
          date: `2026-08-${day}`,
          createdAt: `2026-08-${day}T10:00:00.000Z`,
          updatedAt: `2026-08-${day}T10:00:00.000Z`,
          sleepDuration: 'SEVEN_TO_EIGHT' as const,
          mood: index < 7 ? 'LOW' as const : 'GOOD' as const,
          anxiety: 'LOW' as const,
          depression: 'LOW' as const,
          warningSigns: 'NONE' as const,
          substanceUse: 'NONE' as const,
          substances: [],
        }
      }),
    }
    const comparisons = weeklyTrendComparisons(buildWellbeingTrendDays(data, '2026-08-01', '2026-08-14'))
    const mood = comparisons.find((comparison) => comparison.key === 'mood')

    expect(mood).toMatchObject({ previous: { average: 2, count: 7 }, recent: { average: 5, count: 7 } })
  })

  it('uses centralized minimum-data safeguards for pattern wording', () => {
    expect(hasEnoughPairs(6)).toBe(false)
    expect(hasEnoughPairs(7)).toBe(true)
    expect(hasEnoughGroups(2, 3)).toBe(false)
    expect(hasEnoughGroups(3, 3)).toBe(true)
  })
})

describe('quick check-in copy', () => {
  it('uses timeframe-specific sleep and mood labels', () => {
    expect(quickCheckInLabels.sleepLastNight).toBe('Sleep last night')
    expect(quickCheckInLabels.moodToday).toBe('Mood today')
    expect(quickCheckInLabels.moodYesterday).toBe('Mood yesterday')
    expect(Object.values(quickCheckInLabels)).not.toContain('Sleep')
    expect(Object.values(quickCheckInLabels)).not.toContain('Mood')
  })

  it('offers a five-point evening mood scale with clear anchor labels', () => {
    expect(eveningMoodOptions.map((option) => option.label)).toEqual([
      '1 - Awful',
      '2 - Low',
      '3 - Okay',
      '4 - Good',
      '5 - Great',
    ])
  })

  it('keeps the substance list focused on current selectable choices', () => {
    const labels = substanceTypeOptions.map((option) => option.label)

    expect(labels).toContain('Benzodiazepine')
    expect(labels).not.toContain('Clonazepam')
    expect(labels).not.toContain('Other benzodiazepine')
    expect(labels).not.toContain('Prescription stimulant')
    expect(labels).not.toContain('Non-prescribed stimulant')
    expect(labels).not.toContain('Other prescription medication')
  })
})

describe('crisis team directory', () => {
  it('includes the Health NZ regional crisis team numbers used by support plan autofill', () => {
    expect(healthNzCrisisTeamsLastUpdated).toBe('3 February 2026')
    expect(crisisTeamOptions.length).toBeGreaterThan(20)
    expect(crisisTeamOptions.some((team) => team.region === 'Canterbury' && team.phone === '0800 920 092')).toBe(true)
    expect(crisisTeamOptions.some((team) => team.region === 'West Coast' && team.phone === '0800 757 678')).toBe(true)
    expect(crisisTeamOptions.every((team) => team.region && team.service && team.phone)).toBe(true)
  })

  it('ships Canterbury crisis support as a default support contact', () => {
    expect(defaultSupportContacts).toContainEqual(
      expect.objectContaining({
        id: 'support-crisis-team-canterbury',
        phone: '0800 920 092',
        isDefault: true,
      }),
    )
  })

  it('matches a nearby GPS point locally without returning a distant service', () => {
    expect(nearestCrisisTeam(-43.5321, 172.6362)?.id).toBe('canterbury')
    expect(nearestCrisisTeam(40.7128, -74.006)).toBeUndefined()
  })
})

describe('exclusive none checkbox rules', () => {
  it('applies the sleep disruption none rule', () => {
    let selected: SleepDisruption[] = toggleExclusiveNone(['NIGHTMARES'], 'NONE', 'NONE')
    expect(selected).toEqual(['NONE'])
    selected = toggleExclusiveNone(selected, 'WOKE_EARLY', 'NONE')
    expect(selected).toEqual(['WOKE_EARLY'])
  })

  it('applies the depression symptom none rule', () => {
    let selected: DepressionSymptom[] = toggleExclusiveNone(['HOPELESS', 'GUILTY'], 'NONE', 'NONE')
    expect(selected).toEqual(['NONE'])
    selected = toggleExclusiveNone(selected, 'UNMOTIVATED', 'NONE')
    expect(selected).toEqual(['UNMOTIVATED'])
    expect(depressionSymptomOptions).toContainEqual({ value: 'UNMOTIVATED', label: 'Felt unmotivated' })
  })

  it('applies the perceptual experience none rule', () => {
    let selected: PerceptualExperience[] = toggleExclusiveNone(['HEARD_SOMETHING'], 'NONE', 'NONE')
    expect(selected).toEqual(['NONE'])
    selected = toggleExclusiveNone(selected, 'FELT_PRESENCE', 'NONE')
    expect(selected).toEqual(['FELT_PRESENCE'])
  })
})

describe('report calculations', () => {
  it('summarizes sleep, nightmares, contributors, warning signs, and functioning', () => {
    const sleepEntries: SleepEntry[] = [
      {
        id: 'sleep-1',
        date: '2026-06-07',
        durationCategory: 'FIVE_TO_SIX',
        quality: 'FAIR',
        disruptions: ['NIGHTMARES'],
        createdAt: '2026-06-07T08:00:00.000Z',
        updatedAt: '2026-06-07T08:00:00.000Z',
      },
      {
        id: 'sleep-2',
        date: '2026-06-08',
        durationCategory: 'FIVE_TO_SIX',
        quality: 'GOOD',
        disruptions: ['NONE'],
        createdAt: '2026-06-08T08:00:00.000Z',
        updatedAt: '2026-06-08T08:00:00.000Z',
      },
    ]
    const eveningCheckIns: EveningCheckIn[] = [
      {
        id: 'check-1',
        date: '2026-06-08',
        moodRating: '5',
        anxietySeverity: 'MODERATE',
        anxietyContributors: ['SLEEP', 'COURT_LEGAL'],
        depressionSeverity: 'MILD',
        depressionSymptoms: ['HOPELESS'],
        depressionContributors: ['SLEEP'],
        suspiciousness: 'SLIGHTLY',
        unusualMeanings: 'NOT_AT_ALL',
        beliefCertainty: 'UNSURE',
        perceptualExperiences: ['NONE'],
        thinkingClarity: 'SLIGHTLY_SCATTERED',
        realityCheck: 'CHALLENGED_THEM',
        functioning: ['SHOWERED', 'MEDICATION_AS_PRESCRIBED'],
        notes: 'Useful note',
        status: 'COMPLETE',
        createdAt: '2026-06-08T20:00:00.000Z',
        updatedAt: '2026-06-08T20:00:00.000Z',
      },
    ]
    const report = generateReport(
      {
        ...emptyData,
        sleepEntries,
        eveningCheckIns,
        nightmareEntries: [
          {
            id: 'nightmare-1',
            occurredAt: '2026-06-08T03:00:00.000Z',
            intensity: 'SEVERE',
            wakeReactions: ['PANIC'],
            description: 'Fragment',
            afterWaking: ['USED_GROUNDING'],
            createdAt: '2026-06-08T03:05:00.000Z',
            updatedAt: '2026-06-08T03:05:00.000Z',
          },
        ],
      },
      '2026-06-07',
      '2026-06-08',
      { includeNotes: true, includeNightmareNotes: true, selectedJournalIds: [] },
    )

    expect(report.sleep.mostCommonDuration).toBe('5-6 hours')
    expect(report.nightmares.count).toBe(1)
    expect(report.anxiety.commonContributors.map((item) => item.label)).toContain('Court/legal matters')
    expect(report.warningSigns.suspiciousnessDistribution.SLIGHTLY).toBe(1)
    expect(report.mood.ratingDistribution['5']).toBe(1)
    expect(report.functioning.MEDICATION_AS_PRESCRIBED).toBe(1)
    expect(report.plainLanguageSummary).toContain('not a diagnosis')
  })

  it('creates an Excel-readable report workbook for the selected range', async () => {
    const report = prepareClinicianReport(emptyData, '2026-06-01', '2026-06-08', {
      includeNotes: true,
      includeNightmareNotes: true,
      selectedJournalIds: [],
    })
    const workbook = await buildReportExcelBlob(report).text()

    expect(workbook).toContain('Salience report')
    expect(workbook).toContain('2026-06-01 to 2026-06-08')
    expect(workbook).toContain('Worksheet ss:Name="Summary"')
    expect(workbook).toContain('Mood today')
    expect(workbook).toContain('Worksheet ss:Name="Evening mood"')
    expect(workbook).toContain('Worksheet ss:Name="Sleep last night"')
  })

  it('creates a Word report document for the selected range', async () => {
    const report = prepareClinicianReport(emptyData, '2026-06-01', '2026-06-08', {
      includeNotes: true,
      includeNightmareNotes: true,
      selectedJournalIds: [],
    })
    const blob = await buildReportDocxBlob(report)

    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    expect(blob.size).toBeGreaterThan(1000)
  })
})

describe('JSON export/import schema', () => {
  it('serializes schema version 6 and parses the backup shape', () => {
    const bundle = buildExportBundle(emptyData, '2026-06-08T00:00:00.000Z')
    const parsed = parseExportBundle(JSON.parse(JSON.stringify(bundle)))
    expect(parsed.schemaVersion).toBe(6)
    expect(parsed.quotes.length).toBeGreaterThan(0)
    expect(parsed.treatmentActivities).toEqual([])
    expect(parsed.benzodiazepineEntries).toEqual([])
  })

  it('adds safe Treatment defaults when importing a legacy version 1 backup', () => {
    const legacy = {
      ...buildExportBundle(emptyData, '2026-06-08T00:00:00.000Z'),
      schemaVersion: 1,
      treatmentProgress: undefined,
      treatmentSettings: undefined,
      treatmentResponses: undefined,
      treatmentProgramPlans: undefined,
      treatmentActivities: undefined,
      treatmentSessions: undefined,
      treatmentReviews: undefined,
      treatmentNightmares: undefined,
      benzodiazepineEntries: undefined,
    }
    const parsed = parseExportBundle(JSON.parse(JSON.stringify(legacy)))
    expect(parsed.schemaVersion).toBe(6)
    expect(parsed.treatmentProgress.id).toBe('progress')
    expect(parsed.treatmentSettings.id).toBe('treatment')
    expect(parsed.treatmentResponses).toEqual([])
    expect(parsed.treatmentProgramPlans).toEqual([])
    expect(parsed.treatmentActivities).toEqual([])
    expect(parsed.treatmentSessions).toEqual([])
    expect(parsed.treatmentReviews).toEqual([])
    expect(parsed.treatmentNightmares).toEqual([])
    expect(parsed.benzodiazepineEntries).toEqual([])
  })

  it('migrates legacy generic medication entries to Clonazepam without changing their portions', () => {
    const legacy = {
      ...buildExportBundle(emptyData, '2026-08-06T00:00:00.000Z'),
      schemaVersion: 5,
      benzodiazepineEntries: [{
        id: 'legacy-benzodiazepine',
        date: '2026-08-06',
        takenAt: '2026-08-06T08:00:00.000Z',
        medication: 'BENZODIAZEPINE',
        quarterUnits: 2,
        createdAt: '2026-08-06T08:00:00.000Z',
        updatedAt: '2026-08-06T08:00:00.000Z',
      }],
      appSettings: {
        ...defaultAppSettings,
        benzodiazepineMedication: 'BENZODIAZEPINE',
      },
    }

    const parsed = parseExportBundle(JSON.parse(JSON.stringify(legacy)))

    expect(parsed.schemaVersion).toBe(6)
    expect(parsed.benzodiazepineEntries[0]).toMatchObject({
      medication: 'CLONAZEPAM',
      quarterUnits: 2,
    })
    expect(parsed.appSettings?.benzodiazepineMedication).toBe('CLONAZEPAM')
  })

  it('migrates version 2 Treatment worksheets without losing their saved values', () => {
    const legacyResponse = {
      id: 'cpt:abc',
      programId: 'cpt',
      moduleId: 'abc',
      values: { belief: 'private saved value' },
      hiddenPromptIds: [],
      clinicianAssigned: false,
      createdAt: '2026-07-20T00:00:00.000Z',
      updatedAt: '2026-07-20T00:05:00.000Z',
    }
    const legacy = {
      ...buildExportBundle(emptyData, '2026-07-28T00:00:00.000Z'),
      schemaVersion: 2,
      treatmentResponses: [legacyResponse],
      treatmentProgramPlans: undefined,
      treatmentActivities: undefined,
      treatmentSessions: undefined,
      treatmentReviews: undefined,
    }

    const parsed = parseExportBundle(JSON.parse(JSON.stringify(legacy)))
    expect(parsed.schemaVersion).toBe(6)
    expect(parsed.treatmentResponses[0]).toMatchObject({
      id: 'cpt:abc',
      values: { belief: 'private saved value' },
      status: 'completed',
      startedAt: '2026-07-20T00:00:00.000Z',
      completedAt: '2026-07-20T00:05:00.000Z',
    })
  })
})

describe('Release feature flags', () => {
  it('keeps sensitive pathways disabled in production unless explicitly opted in', () => {
    expect(featureFlagsFor({ isDevelopment: false })).toEqual({
      treatment: false,
      substanceTracking: false,
      medication: false,
    })
    expect(featureFlagsFor({
      isDevelopment: false,
      enableTreatment: 'true',
      enableSubstanceTracking: 'true',
      enableMedication: 'true',
    })).toEqual({
      treatment: true,
      substanceTracking: true,
      medication: true,
    })
    expect(featureFlagsFor({ isDevelopment: true })).toEqual({
      treatment: true,
      substanceTracking: true,
      medication: true,
    })
  })
})

describe('Treatment navigation and content boundaries', () => {
  it('keeps Treatment in the shared primary navigation with a selected-state capable destination', () => {
    expect(treatmentNavItem).toEqual({ view: 'treatment', label: 'Treatment' })
    expect(primaryNavigationItems.some((item) => item.view === 'treatment' && item.label === 'Treatment')).toBe(true)
    expect(new Set(primaryNavigationItems.map((item) => item.view)).size).toBe(primaryNavigationItems.length)
  })

  it('shows the four program cards in the required order', () => {
    expect(treatmentPrograms.map((program) => program.name)).toEqual([
      'Trauma-Focused CBT Foundations',
      'Cognitive Processing Therapy',
      'Prolonged Exposure',
      'EMDR',
    ])
  })

  it('offers an explicit self-guided pathway mode without removing optional support modes', () => {
    expect(Object.entries(treatmentUseModeLabels)[0]).toEqual([
      'self-guided-pathway',
      'I want a self-guided treatment pathway',
    ])
    expect(treatmentUseModeLabels['alongside-therapist']).toBe('I am using Salience alongside a therapist')
  })

  it('gives every program a phased, guided, source-attributed curriculum', () => {
    for (const program of treatmentPrograms) {
      expect(program.phases.length).toBeGreaterThanOrEqual(4)
      expect(program.modules.length).toBeGreaterThanOrEqual(8)
      expect(program.modules.every((module) => module.steps.length >= 2)).toBe(true)
      expect(program.modules.every((module) => program.phases.some((phase) => phase.id === module.phaseId))).toBe(true)
      expect(program.modules.every((module) => module.keyPoints.length >= 3)).toBe(true)
      expect(program.modules.every((module) => {
        const guidedPromptIds = module.steps.flatMap((step) => step.promptIds)
        return guidedPromptIds.length === module.prompts.length
          && new Set(guidedPromptIds).size === module.prompts.length
          && module.prompts.every((prompt) => guidedPromptIds.includes(prompt.id))
      })).toBe(true)
      expect(program.modules.every((module) => module.sourceUrl.startsWith('https://'))).toBe(true)
      expect(program.modules.every((module) => module.clinicalReviewStatus === 'pending-professional-review')).toBe(true)
      expect(program.comparison.questionsToDiscuss).toHaveLength(3)
      expect(JSON.stringify(program.comparison)).not.toMatch(/best|guarantee|suitable for you|recommended for you/i)
    }
  })

  it('uses program-specific authoritative sources for CPT, PE, and EMDR content', () => {
    for (const programId of ['cpt', 'pe', 'emdr'] as const) {
      const program = treatmentPrograms.find((item) => item.id === programId)!
      expect(program.modules.every((module) =>
        /US National Center for PTSD|US Department of Veterans Affairs and Department of Defense|National Institute for Health and Care Excellence/.test(
          module.sourceOrganisation,
        ))).toBe(true)
      expect(new Set(program.modules.map((module) => module.sourceUrl))).toContain(
        `https://www.ptsd.va.gov/professional/treat/txessentials/${
          programId === 'cpt'
            ? 'cpt_for_ptsd_pro'
            : programId === 'pe'
              ? 'prolonged_exposure_pro'
              : 'emdr_pro'
        }.asp`,
      )
    }
  })

  it('includes restoring daily life and maintenance planning without app-directed processing', () => {
    const tfCbt = treatmentPrograms.find((program) => program.id === 'tf-cbt')!
    const cpt = treatmentPrograms.find((program) => program.id === 'cpt')!
    const pe = treatmentPrograms.find((program) => program.id === 'pe')!
    const emdr = treatmentPrograms.find((program) => program.id === 'emdr')!

    expect(tfCbt.modules.find((module) => module.id === 'functioning')).toMatchObject({
      phaseId: 'maintain',
      clinicianGuidanceRequired: false,
    })
    expect(tfCbt.modules.find((module) => module.id === 'maintaining')?.body).toMatch(/you decide when to pause, return, or seek more support/i)
    expect(cpt.modules.find((module) => module.id === 'impact-review')).toMatchObject({
      clinicianGuidanceRequired: false,
      deliveryMode: 'self-guided',
      requiresCurrentStateCheck: true,
    })
    expect(pe.modules.find((module) => module.id === 'future-plan')).toMatchObject({
      clinicianGuidanceRequired: false,
      deliveryMode: 'self-guided',
      requiresCurrentStateCheck: false,
    })
    expect(pe.modules.find((module) => module.id === 'future-plan')?.body).toMatch(/does not create future exposure assignments/i)
    expect(emdr.modules.find((module) => module.id === 'future-plan')?.body).toMatch(/does not decide whether formal EMDR reprocessing should begin or resume/i)
  })

  it('tracks drafts, reviewed modules, percentage, and a neutral next module', () => {
    const program = treatmentPrograms.find((item) => item.id === 'cpt')!
    const summary = summarizeProgramProgress(program.modules.map((module) => module.id), [
      treatmentResponse('one', 'cpt', program.modules[0].id, 'completed'),
      treatmentResponse('two', 'cpt', program.modules[1].id, 'draft'),
      treatmentResponse('three', 'cpt', program.modules[0].id, 'draft'),
    ])

    expect(summary.completed).toBe(1)
    expect(summary.drafts).toBe(1)
    expect(summary.percent).toBe(Math.round(100 / program.modules.length))
    expect(summary.nextModuleId).toBe(program.modules[1].id)
  })

  it('summarizes progress within each phase without inferring clinical progress', () => {
    const program = treatmentPrograms.find((item) => item.id === 'tf-cbt')!
    const phase = program.phases[0]
    const phaseModules = program.modules.filter((module) => module.phaseId === phase.id)
    const summary = summarizePhaseProgress(program.modules, [
      treatmentResponse('phase-one', 'tf-cbt', phaseModules[0].id, 'completed'),
    ])

    expect(summary[phase.id]).toEqual({
      total: phaseModules.length,
      completed: 1,
      percent: Math.round(100 / phaseModules.length),
    })
    expect(JSON.stringify(summary)).not.toMatch(/diagnos|improv|success|failure/i)
  })

  it('recognises same-day Treatment activity so a reminder can skip completed work', () => {
    const response = {
      ...treatmentResponse('today', 'cpt', 'abc', 'draft'),
      updatedAt: '2026-07-28T08:00:00',
    }
    expect(hasTreatmentActivityToday([response], [], [], new Date('2026-07-28T20:00:00'))).toBe(true)
    expect(hasTreatmentActivityToday([response], [], [], new Date('2026-07-29T20:00:00'))).toBe(false)
    expect(hasTreatmentActivityToday(
      [],
      [],
      [],
      new Date('2026-07-28T20:00:00'),
      [chosenActivity('today', { updatedAt: '2026-07-28T09:00:00' })],
    )).toBe(true)
  })

  it('tracks clinician-agreed and self-chosen activities with neutral statuses', () => {
    const summary = summarizeTreatmentActivities([
      chosenActivity('planned'),
      chosenActivity('paused', { status: 'paused', dueDate: '2026-08-01' }),
      chosenActivity('done', { status: 'completed', completedAt: '2026-07-28T01:00:00.000Z' }),
      chosenActivity('stopped', { status: 'stopped' }),
    ])

    expect(summary).toMatchObject({ planned: 1, paused: 1, completed: 1, stopped: 1 })
    expect(summary.open.map((activity) => activity.id)).toEqual(['paused', 'planned'])
    expect(JSON.stringify(summary)).not.toMatch(/overdue|failed|noncompliant/i)
  })

  it('provides a neutral program plan without inventing clinical goals', () => {
    expect(defaultTreatmentProgramPlan('pe', '2026-07-28T00:00:00.000Z')).toEqual({
      id: 'pe',
      programId: 'pe',
      goals: [],
      pacingPreference: 'one-step-at-a-time',
      createdAt: '2026-07-28T00:00:00.000Z',
      updatedAt: '2026-07-28T00:00:00.000Z',
    })
  })

  it('persists program selection, status, and last-opened progress without replacing other programs', () => {
    const initial = defaultTreatmentProgress('2026-07-28T00:00:00.000Z')
    const cpt = markProgramOpened(initial, 'cpt', '2026-07-28T01:00:00.000Z')
    const emdr = markProgramOpened(cpt, 'emdr', '2026-07-28T02:00:00.000Z')
    expect(emdr.selectedPrograms).toEqual(['cpt', 'emdr'])
    expect(emdr.programStatuses.cpt).toBe('exploring')
    expect(emdr.lastOpenedPrograms.cpt).toBe('2026-07-28T01:00:00.000Z')
    expect(emdr.lastOpenedProgram).toBe('emdr')
  })

  it('only allows a pathway to be completed after every module has a completed record', () => {
    const moduleIds = ['cpt:overview', 'cpt:abc', 'cpt:review']
    expect(isProgramReadyToComplete(moduleIds, [
      treatmentResponse('one', 'cpt', 'cpt:overview', 'completed'),
      treatmentResponse('two', 'cpt', 'cpt:abc', 'draft'),
      treatmentResponse('three', 'cpt', 'cpt:review', 'completed'),
    ])).toBe(false)
    expect(isProgramReadyToComplete(moduleIds, [
      treatmentResponse('one', 'cpt', 'cpt:overview', 'completed'),
      treatmentResponse('two', 'cpt', 'cpt:abc', 'completed'),
      treatmentResponse('three', 'cpt', 'cpt:review', 'completed'),
    ])).toBe(true)
    expect(isProgramReadyToComplete([], [])).toBe(false)
  })

  it('keeps every included exercise self-guided while separating procedures the app does not perform', () => {
    const modules = treatmentPrograms.flatMap((program) => program.modules)
    expect(modules.some((module) => module.contentType === 'coping' && !module.clinicianGuidanceRequired)).toBe(true)
    expect(modules.find((module) => module.program === 'pe' && module.id === 'imaginal')).toMatchObject({
      contentType: 'clinician-guided',
      clinicianGuidanceRequired: true,
      deliveryMode: 'information-only',
    })
    expect(modules.find((module) => module.program === 'emdr' && module.id === 'reprocessing')).toMatchObject({
      contentType: 'clinician-guided',
      clinicianGuidanceRequired: true,
      deliveryMode: 'information-only',
    })
    expect(modules.filter((module) => module.deliveryMode === 'information-only').map((module) => `${module.program}:${module.id}`)).toEqual([
      'tf-cbt:memory-processing',
      'pe:imaginal',
      'emdr:reprocessing',
    ])
    expect(modules.every((module) => module.clinicalReviewStatus === 'pending-professional-review')).toBe(true)
    expect(modules.filter((module) => module.deliveryMode === 'information-only').every((module) => !module.requiresCurrentStateCheck)).toBe(true)
    expect(modules.find((module) => module.program === 'cpt' && module.id === 'impact-review')?.requiresCurrentStateCheck).toBe(true)
    expect(modules.find((module) => module.program === 'pe' && module.id === 'hierarchy')?.requiresCurrentStateCheck).toBe(true)
    expect(modules.find((module) => module.program === 'emdr' && module.id === 'after-session-plan')?.requiresCurrentStateCheck).toBe(false)
  })

  it('keeps PE imaginal exposure and EMDR reprocessing as information-only pages with no procedural inputs', () => {
    const peImaginal = treatmentPrograms.find((program) => program.id === 'pe')!.modules.find((module) => module.id === 'imaginal')!
    const emdrReprocessing = treatmentPrograms.find((program) => program.id === 'emdr')!.modules.find((module) => module.id === 'reprocessing')!

    expect(peImaginal.prompts).toEqual([])
    expect(peImaginal.body).toMatch(/no script, trauma prompt, recording, repetition schedule, or timer/i)
    expect(emdrReprocessing.prompts).toEqual([])
    expect(emdrReprocessing.body).toMatch(/no trauma-recall prompt, target selection, eye movement/i)
  })

  it('adds a complete structured treatment layer with selectable trauma topics in every pathway', () => {
    const structuredIds = ['treatment-start', 'early-warning', 'support-plan', 'processing-topics', 'prescriber-review', 'treatment-review']
    for (const program of treatmentPrograms) {
      const structured = program.modules.filter((module) => module.structuredTreatment)
      expect(structured).toHaveLength(structuredIds.length)
      expect(structured.map((module) => module.id)).toEqual(expect.arrayContaining(structuredIds))
      expect(structured.every((module) => module.deliveryMode === 'self-guided' && module.prompts.length > 0)).toBe(true)
      expect(program.modules.findIndex((module) => module.id === 'treatment-start')).toBe(0)
      expect(program.modules.at(-1)?.id).toBe('treatment-review')
    }

    const topicModule = treatmentPrograms[0].modules.find((module) => module.id === 'processing-topics')!
    const topicPrompt = topicModule.prompts.find((prompt) => prompt.id === 'themes')!
    expect(topicPrompt.inputType).toBe('multiselect')
    expect(topicPrompt.options?.map((option) => option.label)).toEqual(expect.arrayContaining([
      'Being jailed or detained while unwell',
      'Being attacked',
      'Being knocked unconscious',
      'Being chased or hunted after escaping',
      'Being lost or unable to get home',
      'Being unable to gather belongings',
      'Being unable to find transport home',
    ]))
    expect(topicModule.prompts.find((prompt) => prompt.id === 'clinician-plan')?.helper).toMatch(/existing instructions only/i)
    expect(topicModule.body).toMatch(/does not interpret it, start a processing exercise/i)
  })

  it('adds pathway-specific self-guided modules without expanding the safety-gated boundary', () => {
    const expected: Record<string, string[]> = {
      'tf-cbt': ['orientation-card', 'morning-after-nightmare', 'daily-rhythm'],
      cpt: ['worksheet-choice', 'practice-log', 'conversation-plan'],
      pe: ['avoidance-map', 'recovery-plan', 'conversation-plan'],
      emdr: ['resource-menu', 'communication-plan', 'between-session-log'],
    }

    for (const program of treatmentPrograms) {
      const modules = expected[program.id].map((id) => program.modules.find((module) => module.id === id))
      expect(modules.every(Boolean)).toBe(true)
      expect(modules.every((module) => module?.deliveryMode === 'self-guided')).toBe(true)
      expect(modules.every((module) => module?.clinicianGuidanceRequired === false)).toBe(true)
      expect(modules.every((module) => module?.requiresCurrentStateCheck === false)).toBe(true)
      expect(modules.every((module) => (module?.prompts.length ?? 0) > 0)).toBe(true)
    }

    expect(treatmentPrograms.find((program) => program.id === 'tf-cbt')?.modules
      .find((module) => module.id === 'orientation-card')?.prompts
      .find((prompt) => prompt.id === 'actions')?.inputType).toBe('multiselect')
    expect(treatmentPrograms.find((program) => program.id === 'emdr')?.modules
      .find((module) => module.id === 'between-session-log')?.prompts
      .find((prompt) => prompt.id === 'sleep')?.label).toBe('Sleep last night (optional)')
  })

  it('defines a complete CPT companion sequence with user-selected entry routing', () => {
    const cpt = treatmentPrograms.find((program) => program.id === 'cpt')!
    expect(cpt.modules.slice(0, 3).map((module) => module.id)).toEqual([
      'treatment-start',
      'course-intake',
      'overview',
    ])
    expect(cptEntryModuleByPoint).toEqual({
      understand: 'overview',
      notice: 'stuck-point-log',
      examine: 'challenging-beliefs',
      themes: 'theme-review',
      practice: 'practice-log',
    })

    const intake = cpt.modules.find((module) => module.id === 'course-intake')!
    expect(intake).toMatchObject({
      deliveryMode: 'self-guided',
      requiresCurrentStateCheck: false,
      clinicianGuidanceRequired: false,
    })
    expect(intake.prompts.find((prompt) => prompt.id === 'entry-point')?.options).toEqual(expect.arrayContaining([
      { value: 'understand', label: 'Understanding CPT and the pathway' },
      { value: 'notice', label: 'Noticing thoughts, feelings, and responses' },
      { value: 'examine', label: 'Examining a belief with questions and context' },
      { value: 'themes', label: 'Reviewing the five life areas' },
      { value: 'practice', label: 'Organising practice and review' },
    ]))
    expect(cpt.modules.at(-1)?.id).toBe('treatment-review')
  })

  it('summarizes user ratings without diagnostic or success/failure interpretation', () => {
    const reviews: TreatmentReview[] = [
      {
        id: 'r1',
        programId: 'tf-cbt',
        reviewDate: '2026-07-01',
        sleepImpact: 8,
        dailyFunctioning: 3,
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      },
      {
        id: 'r2',
        programId: 'tf-cbt',
        reviewDate: '2026-07-28',
        sleepImpact: 5,
        dailyFunctioning: 6,
        createdAt: '2026-07-28T00:00:00.000Z',
        updatedAt: '2026-07-28T00:00:00.000Z',
      },
    ]
    const summary = summarizeTreatmentReviews(reviews)
    expect(summary.sleepImpact).toMatchObject({ count: 2, change: -3 })
    expect(summary.dailyFunctioning).toMatchObject({ count: 2, change: 3 })
    expect(JSON.stringify(summary)).not.toMatch(/diagnos|success|failure|better|worse/i)
  })

  it('filters longitudinal reviews by user-selected dates', () => {
    const reviews: TreatmentReview[] = [
      {
        id: 'before',
        programId: 'cpt',
        reviewDate: '2026-06-30',
        dailyFunctioning: 2,
        createdAt: '2026-06-30T00:00:00.000Z',
        updatedAt: '2026-06-30T00:00:00.000Z',
      },
      {
        id: 'inside',
        programId: 'cpt',
        reviewDate: '2026-07-15',
        dailyFunctioning: 5,
        createdAt: '2026-07-15T00:00:00.000Z',
        updatedAt: '2026-07-15T00:00:00.000Z',
      },
      {
        id: 'after',
        programId: 'cpt',
        reviewDate: '2026-08-01',
        dailyFunctioning: 6,
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      },
    ]

    expect(filterTreatmentReviewsByDate(reviews, '2026-07-01', '2026-07-31').map((review) => review.id)).toEqual(['inside'])
    expect(findTreatmentReviewDateConflict(reviews, '2026-07-15')?.id).toBe('inside')
    expect(findTreatmentReviewDateConflict(reviews, '2026-07-15', 'inside')).toBeUndefined()
    expect(treatmentReviewDateIsFuture('2026-07-29', '2026-07-28')).toBe(true)
    expect(treatmentReviewDateIsFuture('2026-07-28', '2026-07-28')).toBe(false)
  })

  it('validates clinician-supplied measure fields without interpreting the result', () => {
    expect(validateClinicianMeasure('', '', '')).toBeUndefined()
    expect(validateClinicianMeasure('PCL-5', '30', '80')).toBeUndefined()
    expect(validateClinicianMeasure('PCL-5', '', '80')).toMatch(/together/i)
    expect(validateClinicianMeasure('PCL-5', '-1', '80')).toMatch(/zero or higher/i)
    expect(validateClinicianMeasure('PCL-5', '20', '0')).toMatch(/greater than zero/i)
    expect(validateClinicianMeasure('PCL-5', '81', '80')).toMatch(/higher than/i)
    expect(validateClinicianMeasure('PCL-5', 'not a number', '80')).toMatch(/numeric/i)
  })

  it('preserves raw clinician-supplied measure histories without comparing changed scales', () => {
    const reviews: TreatmentReview[] = [
      {
        id: 'first',
        programId: 'cpt',
        reviewDate: '2026-07-01',
        clinicianMeasureName: 'Example measure',
        clinicianMeasureScore: 18,
        clinicianMeasureMaximum: 40,
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      },
      {
        id: 'second',
        programId: 'cpt',
        reviewDate: '2026-07-15',
        clinicianMeasureName: 'example measure',
        clinicianMeasureScore: 32,
        clinicianMeasureMaximum: 80,
        createdAt: '2026-07-15T00:00:00.000Z',
        updatedAt: '2026-07-15T00:00:00.000Z',
      },
      {
        id: 'invalid-legacy',
        programId: 'cpt',
        reviewDate: '2026-07-20',
        clinicianMeasureName: 'Example measure',
        clinicianMeasureScore: 90,
        clinicianMeasureMaximum: 80,
        createdAt: '2026-07-20T00:00:00.000Z',
        updatedAt: '2026-07-20T00:00:00.000Z',
      },
    ]

    const [series] = summarizeClinicianMeasures(reviews)
    expect(series.name).toBe('example measure')
    expect(series.entries.map((entry) => [entry.score, entry.maximum])).toEqual([[18, 40], [32, 80]])
    expect(series.latest.reviewId).toBe('second')
    expect(series.hasMixedMaximums).toBe(true)
    expect(JSON.stringify(series)).not.toMatch(/threshold|diagnos|better|worse|percent/i)
  })

  it('builds an on-device visit brief from saved choices without interpreting them', () => {
    const brief = buildTreatmentVisitBrief({
      activities: [chosenActivity('plan', { title: 'Review agreed worksheet' })],
      plan: {
        ...defaultTreatmentProgramPlan('cpt', '2026-07-28T00:00:00.000Z'),
        goals: ['Sleep more consistently'],
        concerns: 'Ask about pace',
      },
      responses: [
        treatmentResponse('question', 'cpt', 'abc', 'draft', { questions: 'Can we review this?' }),
      ],
      reviews: [{
        id: 'review',
        programId: 'cpt',
        reviewDate: '2026-07-28',
        questions: 'Is this scale useful?',
        createdAt: '2026-07-28T00:00:00.000Z',
        updatedAt: '2026-07-28T00:00:00.000Z',
      }],
      sessions: [{
        id: 'next',
        programId: 'cpt',
        appointmentAt: '2026-08-01T10:00:00.000Z',
        status: 'planned',
        createdAt: '2026-07-28T00:00:00.000Z',
        updatedAt: '2026-07-28T00:00:00.000Z',
      }],
      moduleTitles: { abc: 'ABC worksheet' },
      now: new Date('2026-07-28T00:00:00.000Z'),
    })

    expect(brief.goals).toEqual(['Sleep more consistently'])
    expect(brief.questions).toEqual(['Ask about pace', 'Can we review this?', 'Is this scale useful?'])
    expect(brief.openActivities[0].title).toBe('Review agreed worksheet')
    expect(brief.recentResponses[0].title).toBe('ABC worksheet')
    expect(brief.nextAppointment?.id).toBe('next')
    expect(JSON.stringify(brief)).not.toMatch(/diagnos|recommend|improv|failure/i)
  })

  it('exports only user-selected Treatment material to a clinician-ready Word document', async () => {
    const program = treatmentPrograms.find((item) => item.id === 'cpt')!
    const selected = treatmentResponse('selected', 'cpt', 'abc', 'completed', { belief: 'selected private text' })
    const excluded = treatmentResponse('excluded', 'cpt', 'evidence', 'completed', { belief: 'excluded private text' })
    const selectedNightmare: TreatmentNightmareEntry = {
      id: 'selected-nightmare',
      timestamp: '2026-07-27T23:30:00.000Z',
      intensity: 7,
      recoveryMinutes: 20,
      returnedToSleep: 'YES',
      themeTags: ['Unable to find transport home'],
      customTags: [],
      notes: 'selected nightmare note',
      createdAt: '2026-07-28T00:00:00.000Z',
      updatedAt: '2026-07-28T00:00:00.000Z',
    }
    const excludedNightmare = {
      ...selectedNightmare,
      id: 'excluded-nightmare',
      notes: 'excluded nightmare note',
    }
    const input = {
      program,
      status: 'clinician-supported' as const,
      completedModuleCount: 2,
      activities: [
        chosenActivity('selected-activity', { title: 'Selected activity text' }),
        chosenActivity('excluded-activity', { title: 'Excluded activity text' }),
      ],
      responses: [selected, excluded],
      nightmares: [selectedNightmare, excludedNightmare],
      sessions: [],
      reviews: [],
      selection: {
        includePlan: false,
        activityIds: ['selected-activity'],
        responseIds: ['selected'],
        nightmareIds: ['selected-nightmare'],
        sessionIds: [],
        reviewIds: [],
      },
      generatedAt: '2026-07-28T00:00:00.000Z',
    }
    const lines = buildTreatmentHandoffLines(input).join('\n')
    expect(lines).toContain('selected private text')
    expect(lines).not.toContain('excluded private text')
    expect(lines).toContain('Selected activity text')
    expect(lines).not.toContain('Excluded activity text')
    expect(lines).toContain('selected nightmare note')
    expect(lines).toContain('Unable to find transport home')
    expect(lines).not.toContain('excluded nightmare note')
    expect(lines).toContain('not a diagnosis')

    const blob = await buildTreatmentHandoffDocx(input)
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    expect(blob.size).toBeGreaterThan(1000)
  })

  it('blocks trauma-processing entry when the current-state check raises concern', () => {
    expect(treatmentEntryScreenForContent(true)).toBe('safety-check')
    expect(treatmentEntryScreenForContent(false)).toBe('module')
    expect(currentStateBlocksProcessing({
      orientedToPresent: true,
      ableToStop: true,
      immediateDanger: false,
      difficultyKnowingReality: false,
      seriousHarmThoughts: false,
    })).toBe(false)
    expect(currentStateBlocksProcessing({
      orientedToPresent: false,
      ableToStop: true,
      immediateDanger: false,
      difficultyKnowingReality: false,
      seriousHarmThoughts: false,
    })).toBe(true)
    expect(currentStateNeedsCrisisActions({
      orientedToPresent: true,
      ableToStop: true,
      immediateDanger: false,
      difficultyKnowingReality: true,
      seriousHarmThoughts: false,
    })).toBe(true)
  })

  it('moves directly to grounding when Pause and ground is activated', () => {
    expect(treatmentScreenAfterPause()).toBe('grounding')
  })

  it('uses configured New Zealand support contacts without coupling them to program content', () => {
    const configured = getConfiguredCrisisContacts(defaultSupportContacts)
    expect(configured.emergency?.phone).toBe('111')
    expect(configured.briefSupport?.phone).toBe('1737')
    expect(configured.crisisTeam?.name).toMatch(/crisis/i)
    expect(configured.crisisTeam?.phone).toBe('0800 920 092')
  })

  it('keeps recurring nightmare themes opt-in and does not attach interpretations', () => {
    expect(defaultTreatmentSettings().useRecurringNightmareThemes).toBe(false)
    expect(recurringNightmareThemes).toContain('Back in prison')
    expect(recurringNightmareThemes).toContain('Fighting or being attacked')
    expect(recurringNightmareThemes).toContain('Being pursued after escape')
    expect(recurringNightmareThemes).toContain('Unable to gather belongings')
    expect(recurringNightmareThemes).toContain('Unable to find transport home')
    expect(recurringNightmareThemes).toContain('Being knocked unconscious')
    expect(recurringNightmareThemes).not.toContain(expect.stringMatching(/means|diagnos|risk/i))
  })

  it('summarizes only user-recorded nightmare values and deliberate sleep links', () => {
    const summary = summarizeTreatmentNightmares([
      {
        id: 'tn-1',
        timestamp: '2026-07-28T03:00:00.000Z',
        intensity: 8,
        recoveryMinutes: 20,
        returnedToSleep: 'YES',
        themeTags: ['Lost or unable to get home'],
        customTags: [],
        linkedSleepEntryId: 'sleep-1',
        createdAt: '2026-07-28T03:10:00.000Z',
        updatedAt: '2026-07-28T03:10:00.000Z',
      },
    ], [{
      id: 'sleep-1',
      date: '2026-07-27',
      durationCategory: 'FIVE_TO_SIX',
      quality: 'FAIR',
      disruptions: ['NIGHTMARES'],
      createdAt: '2026-07-28T08:00:00.000Z',
      updatedAt: '2026-07-28T08:00:00.000Z',
    }])
    expect(summary.averageIntensity).toBe(8)
    expect(summary.averageRecoveryMinutes).toBe(20)
    expect(summary.linkedSleepSummary).toContain('5.5 hours')
    expect(JSON.stringify(summary)).not.toMatch(/cause|meaning|violence risk/i)
  })

  it('groups nightmare frequency by the user device local week', () => {
    const localMonday = new Date(2026, 6, 27, 0, 30)
    const summary = summarizeTreatmentNightmares([{
      id: 'local-monday',
      timestamp: localMonday.toISOString(),
      intensity: 5,
      themeTags: [],
      customTags: [],
      createdAt: localMonday.toISOString(),
      updatedAt: localMonday.toISOString(),
    }], [])

    expect(summary.frequencyByWeek).toEqual({ [localDateKey(localMonday)]: 1 })
  })

  it('does not place Treatment or nightmare free text into notification copy', () => {
    const settings = {
      ...defaultAppSettings,
      notificationsEnabled: true,
      morningCheckInReminderEnabled: true,
      morningCheckInReminderTime: '00:00',
      lastNotificationDate: '2026-07-27',
    }
    const text = buildReminderBody(settings, undefined, new Date('2026-07-28T09:00:00'))
    expect(text).not.toMatch(/prison|psychosis|ptsd|nightmare/i)
    expect(text).not.toContain('sensitive worksheet text')
    expect(treatmentActivityNotificationCopy).toEqual({
      title: 'Salience',
      body: 'You have a Salience activity available.',
    })
    expect(JSON.stringify(treatmentActivityNotificationCopy)).not.toMatch(/prison|psychosis|ptsd|nightmare|treatment|therapy/i)
    expect(treatmentAppointmentNotificationCopy).toEqual({
      title: 'Salience',
      body: 'You have a Salience activity coming up.',
    })
    expect(JSON.stringify(treatmentAppointmentNotificationCopy)).not.toMatch(/prison|psychosis|ptsd|nightmare|treatment|therapy/i)
  })

  it('selects the nearest future planned appointment without using sensitive copy', () => {
    const plan = {
      ...defaultTreatmentProgramPlan('cpt', '2026-07-28T00:00:00.000Z'),
      nextAppointmentAt: '2026-08-03T10:00:00.000Z',
    }
    const sessions = [
      {
        id: 'session-1',
        programId: 'cpt' as const,
        appointmentAt: '2026-08-01T10:00:00.000Z',
        status: 'planned' as const,
        createdAt: '2026-07-28T00:00:00.000Z',
        updatedAt: '2026-07-28T00:00:00.000Z',
      },
      {
        id: 'session-2',
        programId: 'cpt' as const,
        appointmentAt: '2026-07-31T10:00:00.000Z',
        status: 'rescheduled' as const,
        createdAt: '2026-07-28T00:00:00.000Z',
        updatedAt: '2026-07-28T00:00:00.000Z',
      },
    ]

    expect(nextTreatmentAppointments([plan], sessions, new Date('2026-07-28T00:00:00.000Z'))).toEqual({
      cpt: '2026-08-01T10:00:00.000Z',
    })
  })
})

describe('notification reminders', () => {
  it('recognises existing sleep entries saved on the wake-up date', () => {
    const now = new Date('2026-06-08T09:00:00')
    const data = {
      ...emptyData,
      sleepEntries: [{ date: '2026-06-08' } as SleepEntry],
    }

    expect(sleepEntryForLastNight(data, now)?.date).toBe('2026-06-08')
    expect(reminderCompletionForData(data, now).sleepEntry).toBe(true)
  })

  it('pairs last-night sleep with the preceding completed evening check-in', () => {
    const now = new Date('2026-06-08T09:00:00')
    const data = {
      ...emptyData,
      sleepEntries: [{ date: '2026-06-08' } as SleepEntry],
      eveningCheckIns: [{ date: '2026-06-07', status: 'COMPLETE' } as EveningCheckIn],
    }

    expect(fullDayLogForLastNight(data, now)).toBe(true)
    expect(reminderCompletionForData(data, now)).toEqual({ morningCheckIn: true, sleepEntry: true, eveningCheckIn: false })
  })

  it('treats an evening journal or check-in plus sleep as enough to suppress the quick check-in reminder', () => {
    const now = new Date('2026-06-08T21:30:00')
    const completion = reminderCompletionForData({
      ...emptyData,
      sleepEntries: [{ date: '2026-06-07' } as SleepEntry],
      journalEntries: [{ createdAt: '2026-06-08T08:00:00.000Z' } as JournalEntry],
    }, now)
    const settings = {
      ...defaultAppSettings,
      notificationsEnabled: true,
      morningCheckInReminderEnabled: true,
      morningCheckInReminderTime: '09:00',
      sleepReminderEnabled: false,
      checkInReminderEnabled: false,
      quoteReminderEnabled: false,
    }

    expect(completion).toEqual({ morningCheckIn: true, sleepEntry: true, eveningCheckIn: false })
    expect(dueReminderLabels(settings, now, completion)).toEqual([])
  })

  it('detects due local reminders without sending data anywhere', () => {
    const settings = {
      ...defaultAppSettings,
      notificationsEnabled: true,
      quoteReminderEnabled: true,
      quoteReminderTime: '09:00',
      sleepReminderEnabled: true,
      sleepReminderTime: '21:00',
      checkInReminderEnabled: true,
      checkInReminderTime: '20:00',
      lastNotificationDate: '2026-06-07',
    }

    const now = new Date('2026-06-08T21:30:00')
    expect(dueReminderLabels(settings, now)).toEqual(['daily quote', 'morning check-in', 'sleep entry', 'evening check-in'])
    expect(shouldSendReminder(settings, now)).toBe(true)
  })

  it('does not ask for completed reminders again', () => {
    const settings = {
      ...defaultAppSettings,
      notificationsEnabled: true,
      quoteReminderEnabled: false,
      sleepReminderEnabled: true,
      sleepReminderTime: '21:00',
      checkInReminderEnabled: true,
      checkInReminderTime: '20:00',
      morningCheckInReminderEnabled: true,
      morningCheckInReminderTime: '09:00',
      lastNotificationDate: '2026-06-07',
    }
    const now = new Date('2026-06-08T21:30:00')
    const completion = {
      morningCheckIn: true,
      sleepEntry: true,
      eveningCheckIn: true,
    }

    expect(dueReminderLabels(settings, now, completion)).toEqual([])
    expect(shouldSendReminder(settings, now, completion)).toBe(false)
    expect(buildReminderBody(settings, undefined, now, { sleepEntry: true })).not.toContain('sleep entry')
  })
})
