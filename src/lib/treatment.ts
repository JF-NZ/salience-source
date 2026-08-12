import type {
  SleepEntry,
  SupportContact,
  TreatmentActivity,
  TreatmentNightmareEntry,
  TreatmentProgress,
  TreatmentProgramPlan,
  TreatmentProgramId,
  TreatmentResponse,
  TreatmentReview,
  TreatmentSession,
  TreatmentSettings,
} from '../types'
import { localDateKey } from './dates'

export interface CurrentStateAnswers {
  orientedToPresent: boolean
  ableToStop: boolean
  immediateDanger: boolean
  difficultyKnowingReality: boolean
  seriousHarmThoughts: boolean
}

export const currentStateBlocksProcessing = (answers: CurrentStateAnswers) =>
  !answers.orientedToPresent ||
  !answers.ableToStop ||
  answers.immediateDanger ||
  answers.difficultyKnowingReality ||
  answers.seriousHarmThoughts

export const currentStateNeedsCrisisActions = (answers: CurrentStateAnswers) =>
  !answers.orientedToPresent ||
  answers.immediateDanger ||
  answers.difficultyKnowingReality ||
  answers.seriousHarmThoughts

export const treatmentEntryScreenForContent = (requiresCurrentStateCheck: boolean) =>
  requiresCurrentStateCheck ? 'safety-check' as const : 'module' as const

export const treatmentScreenAfterPause = () => 'grounding' as const

export const defaultTreatmentProgress = (now = new Date().toISOString()): TreatmentProgress => ({
  id: 'progress',
  selectedPrograms: [],
  programStatuses: {},
  completedModules: [],
  lastOpenedPrograms: {},
  clinicianSupportedMode: false,
  updatedAt: now,
})

export const defaultTreatmentSettings = (now = new Date().toISOString()): TreatmentSettings => ({
  id: 'treatment',
  useRecurringNightmareThemes: false,
  groundingActions: [],
  hiddenAfterWakingPrompts: [],
  hiddenTreatmentPromptIds: [],
  activityReminderEnabled: false,
  activityReminderTime: '18:00',
  appointmentReminderEnabled: false,
  appointmentReminderLeadHours: 24,
  createdAt: now,
  updatedAt: now,
})

export const defaultTreatmentProgramPlan = (
  programId: TreatmentProgramId,
  now = new Date().toISOString(),
): TreatmentProgramPlan => ({
  id: programId,
  programId,
  goals: [],
  pacingPreference: 'one-step-at-a-time',
  createdAt: now,
  updatedAt: now,
})

export const summarizeProgramProgress = (
  moduleIds: string[],
  responses: TreatmentResponse[],
) => {
  const programResponses = responses.filter((response) => moduleIds.includes(response.moduleId))
  const completedModuleIds = new Set(
    programResponses
      .filter((response) => response.status === 'completed')
      .map((response) => response.moduleId),
  )
  const draftModuleIds = new Set(
    programResponses
      .filter((response) => response.status === 'draft' && !completedModuleIds.has(response.moduleId))
      .map((response) => response.moduleId),
  )
  const total = moduleIds.length
  const completed = completedModuleIds.size

  return {
    total,
    completed,
    drafts: draftModuleIds.size,
    percent: total ? Math.round((completed / total) * 100) : 0,
    nextModuleId: moduleIds.find((moduleId) => !completedModuleIds.has(moduleId)),
  }
}

export const isProgramReadyToComplete = (
  moduleIds: string[],
  responses: TreatmentResponse[],
) => {
  const progress = summarizeProgramProgress(moduleIds, responses)
  return progress.total > 0 && progress.completed === progress.total
}

export const summarizePhaseProgress = (
  modules: Array<{ id: string; phaseId: string }>,
  responses: TreatmentResponse[],
) => {
  const completedModuleIds = new Set(
    responses
      .filter((response) => response.status === 'completed')
      .map((response) => response.moduleId),
  )
  const phaseIds = [...new Set(modules.map((module) => module.phaseId))]

  return Object.fromEntries(phaseIds.map((phaseId) => {
    const phaseModules = modules.filter((module) => module.phaseId === phaseId)
    const completed = phaseModules.filter((module) => completedModuleIds.has(module.id)).length
    return [phaseId, {
      total: phaseModules.length,
      completed,
      percent: phaseModules.length ? Math.round((completed / phaseModules.length) * 100) : 0,
    }]
  })) as Record<string, { total: number; completed: number; percent: number }>
}

export const summarizeTreatmentActivities = (activities: TreatmentActivity[]) => ({
  planned: activities.filter((activity) => activity.status === 'planned').length,
  completed: activities.filter((activity) => activity.status === 'completed').length,
  paused: activities.filter((activity) => activity.status === 'paused').length,
  stopped: activities.filter((activity) => activity.status === 'stopped').length,
  open: activities
    .filter((activity) => activity.status === 'planned' || activity.status === 'paused')
    .sort((a, b) => (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31')
      || a.createdAt.localeCompare(b.createdAt)),
})

const reviewMetricKeys = [
  'sleepImpact',
  'nightmareImpact',
  'remindersImpact',
  'avoidanceImpact',
  'dailyFunctioning',
  'copingConfidence',
  'goalProgress',
] as const

export const summarizeTreatmentReviews = (reviews: TreatmentReview[]) => {
  const ordered = [...reviews].sort((a, b) =>
    a.reviewDate.localeCompare(b.reviewDate) || a.createdAt.localeCompare(b.createdAt))

  return Object.fromEntries(reviewMetricKeys.map((key) => {
    const recorded = ordered.flatMap((review) =>
      review[key] === undefined ? [] : [{ date: review.reviewDate, value: review[key] }])
    return [key, {
      count: recorded.length,
      first: recorded[0],
      latest: recorded.at(-1),
      change: recorded.length > 1 ? recorded.at(-1)!.value - recorded[0].value : undefined,
    }]
  })) as Record<typeof reviewMetricKeys[number], {
    count: number
    first?: { date: string; value: number }
    latest?: { date: string; value: number }
    change?: number
  }>
}

export const filterTreatmentReviewsByDate = (
  reviews: TreatmentReview[],
  start?: string,
  end?: string,
) => reviews.filter((review) =>
  (!start || review.reviewDate >= start) && (!end || review.reviewDate <= end))

export const findTreatmentReviewDateConflict = (
  reviews: TreatmentReview[],
  reviewDate: string,
  editingId?: string,
) => reviews.find((review) => review.reviewDate === reviewDate && review.id !== editingId)

export const treatmentReviewDateIsFuture = (
  reviewDate: string,
  today = localDateKey(),
) => reviewDate > today

export const validateClinicianMeasure = (
  name: string,
  score: string,
  maximum: string,
) => {
  const trimmedName = name.trim()
  const trimmedScore = score.trim()
  const trimmedMaximum = maximum.trim()
  const hasAnyValue = Boolean(trimmedName || trimmedScore || trimmedMaximum)

  if (!hasAnyValue) return undefined
  if (!trimmedName || !trimmedScore || !trimmedMaximum) {
    return 'Enter the clinician-supplied measure name, score, and maximum together, or leave all three blank.'
  }

  const numericScore = Number(trimmedScore)
  const numericMaximum = Number(trimmedMaximum)
  if (!Number.isFinite(numericScore) || !Number.isFinite(numericMaximum)) {
    return 'Enter a numeric score and maximum supplied by your clinician.'
  }
  if (numericScore < 0 || numericMaximum <= 0) {
    return 'The recorded score must be zero or higher, and the maximum must be greater than zero.'
  }
  if (numericScore > numericMaximum) {
    return 'The recorded score cannot be higher than the recorded maximum.'
  }

  return undefined
}

export const summarizeClinicianMeasures = (reviews: TreatmentReview[]) => {
  const grouped = new Map<string, {
    name: string
    entries: Array<{
      reviewId: string
      reviewDate: string
      score: number
      maximum: number
    }>
  }>()

  ;[...reviews]
    .sort((a, b) => a.reviewDate.localeCompare(b.reviewDate) || a.createdAt.localeCompare(b.createdAt))
    .forEach((review) => {
      const name = review.clinicianMeasureName?.trim()
      const score = review.clinicianMeasureScore
      const maximum = review.clinicianMeasureMaximum
      if (
        !name
        || score === undefined
        || maximum === undefined
        || !Number.isFinite(score)
        || !Number.isFinite(maximum)
        || score < 0
        || maximum <= 0
        || score > maximum
      ) return

      const key = name.toLocaleLowerCase()
      const series = grouped.get(key) ?? { name, entries: [] }
      series.name = name
      series.entries.push({
        reviewId: review.id,
        reviewDate: review.reviewDate,
        score,
        maximum,
      })
      grouped.set(key, series)
    })

  return [...grouped.values()]
    .map((series) => ({
      ...series,
      latest: series.entries.at(-1)!,
      hasMixedMaximums: new Set(series.entries.map((entry) => entry.maximum)).size > 1,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export const buildTreatmentVisitBrief = ({
  activities,
  plan,
  responses,
  reviews,
  sessions,
  moduleTitles,
  now = new Date(),
}: {
  activities: TreatmentActivity[]
  plan?: TreatmentProgramPlan
  responses: TreatmentResponse[]
  reviews: TreatmentReview[]
  sessions: TreatmentSession[]
  moduleTitles: Record<string, string>
  now?: Date
}) => {
  const nowIso = now.toISOString()
  const nextAppointment = [...sessions]
    .filter((session) => session.status === 'planned' && session.appointmentAt >= nowIso)
    .sort((a, b) => a.appointmentAt.localeCompare(b.appointmentAt))[0]
  const questions = [
    plan?.concerns,
    ...responses.flatMap((response) =>
      Object.entries(response.values)
        .filter(([key, value]) => /question|concern/i.test(key) && value.trim())
        .map(([, value]) => value.trim())),
    ...reviews.map((review) => review.questions?.trim()).filter(Boolean),
  ].filter((value): value is string => Boolean(value))
  const recentResponses = [...responses]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)
    .map((response) => ({
      id: response.id,
      moduleId: response.moduleId,
      title: moduleTitles[response.moduleId] ?? response.moduleId,
      status: response.status,
      updatedAt: response.updatedAt,
    }))

  return {
    nextAppointment,
    goals: plan?.goals ?? [],
    questions: [...new Set(questions)],
    openActivities: summarizeTreatmentActivities(activities).open,
    recentResponses,
    latestReview: [...reviews].sort((a, b) =>
      b.reviewDate.localeCompare(a.reviewDate) || b.createdAt.localeCompare(a.createdAt))[0],
  }
}

export const hasTreatmentActivityToday = (
  responses: TreatmentResponse[],
  reviews: TreatmentReview[],
  sessions: TreatmentSession[],
  now = new Date(),
  activities: TreatmentActivity[] = [],
) => {
  const today = localDateKey(now)
  return [...responses, ...reviews, ...sessions, ...activities].some((record) =>
    localDateKey(new Date(record.updatedAt)) === today)
}

export const getConfiguredCrisisContacts = (contacts: SupportContact[]) => {
  const byId = (id: string) => contacts.find((contact) => contact.id === id)
  const emergency = byId('support-111') ?? contacts.find((contact) => contact.phone === '111')
  const briefSupport = byId('support-1737') ?? contacts.find((contact) => contact.phone === '1737')
  const configuredCrisisTeam = byId('support-crisis-team')
  const crisisTeam = configuredCrisisTeam?.phone
    ? configuredCrisisTeam
    : contacts.find((contact) => Boolean(contact.phone) && /crisis/i.test(`${contact.name} ${contact.role}`))
      ?? configuredCrisisTeam
  const personal = contacts.filter((contact) => !contact.isDefault)

  return { emergency, briefSupport, crisisTeam, personal }
}

const weekKey = (timestamp: string) => {
  const date = new Date(timestamp)
  const day = date.getDay() || 7
  date.setDate(date.getDate() - day + 1)
  return localDateKey(date)
}

const durationHours: Record<SleepEntry['durationCategory'], number> = {
  UNDER_2: 1,
  TWO_TO_FOUR: 3,
  FIVE_TO_SIX: 5.5,
  SEVEN_TO_EIGHT: 7.5,
  EIGHT_PLUS: 8.5,
}

export const summarizeTreatmentNightmares = (
  entries: TreatmentNightmareEntry[],
  sleepEntries: SleepEntry[],
) => {
  const frequencyByWeek = entries.reduce<Record<string, number>>((counts, entry) => {
    const key = weekKey(entry.timestamp)
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {})
  const average = (values: number[]) =>
    values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0
  const tagCounts = entries
    .flatMap((entry) => [...entry.themeTags, ...entry.customTags])
    .reduce<Record<string, number>>((counts, tag) => {
      counts[tag] = (counts[tag] ?? 0) + 1
      return counts
    }, {})
  const commonTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
  const linkedPairs = entries.flatMap((entry) => {
    const sleep = sleepEntries.find((item) => item.id === entry.linkedSleepEntryId)
    return sleep ? [{ intensity: entry.intensity, sleepHours: durationHours[sleep.durationCategory] }] : []
  })

  return {
    frequencyByWeek,
    averageIntensity: average(entries.map((entry) => entry.intensity)),
    averageRecoveryMinutes: average(entries.flatMap((entry) => entry.recoveryMinutes === undefined ? [] : [entry.recoveryMinutes])),
    commonTags,
    linkedSleepSummary: linkedPairs.length
      ? `${linkedPairs.length} linked entr${linkedPairs.length === 1 ? 'y' : 'ies'}; average recorded sleep ${average(linkedPairs.map((pair) => pair.sleepHours)).toFixed(1)} hours and average nightmare intensity ${average(linkedPairs.map((pair) => pair.intensity)).toFixed(1)}/10.`
      : 'No nightmare entries have been deliberately linked to sleep entries.',
  }
}

export const markProgramOpened = (
  progress: TreatmentProgress,
  programId: TreatmentProgramId,
  now = new Date().toISOString(),
): TreatmentProgress => ({
  ...progress,
  selectedPrograms: progress.selectedPrograms.includes(programId)
    ? progress.selectedPrograms
    : [...progress.selectedPrograms, programId],
  programStatuses: {
    ...progress.programStatuses,
    [programId]: progress.programStatuses[programId] ?? 'exploring',
  },
  lastOpenedProgram: programId,
  lastOpenedPrograms: { ...progress.lastOpenedPrograms, [programId]: now },
  updatedAt: now,
})
