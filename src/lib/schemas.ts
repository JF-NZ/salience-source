import { z } from 'zod'

const optionalString = z.string().trim().optional()

const normalizeSubstanceType = (value: unknown) => {
  if (value === 'CLONAZEPAM' || value === 'OTHER_BENZODIAZEPINE') {
    return 'BENZODIAZEPINE'
  }

  return value
}

export const quoteSchema = z.object({
  id: z.string(),
  text: z.string(),
  author: z.string(),
  category: z.enum([
    'RESILIENCE',
    'COURAGE',
    'RECOVERY',
    'RESPONSIBILITY',
    'CALM',
    'COURT_DAY_GROUNDING',
    'SLEEP_AND_REST',
    'SHAME_AND_SELF_FORGIVENESS',
  ]),
  tags: z.array(z.string()),
  isUserAdded: z.boolean(),
  isFavorite: z.boolean().optional().default(false),
  createdAt: z.string(),
})

export const dailyQuoteStateSchema = z.object({
  date: z.string(),
  quoteId: z.string(),
  manuallyRefreshed: z.boolean(),
})

export const sleepEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  durationCategory: z.enum(['UNDER_2', 'TWO_TO_FOUR', 'FIVE_TO_SIX', 'SEVEN_TO_EIGHT', 'EIGHT_PLUS']),
  quality: z.enum(['VERY_POOR', 'POOR', 'FAIR', 'GOOD', 'EXCELLENT']),
  disruptions: z.array(
    z.enum([
      'TROUBLE_FALLING_ASLEEP',
      'WOKE_REPEATEDLY',
      'NIGHTMARES',
      'WOKE_EARLY',
      'SLEPT_UNUSUALLY_LONG',
      'NONE',
    ]),
  ),
  notes: optionalString,
  createdAt: z.string(),
  updatedAt: z.string(),
})

const substanceUseDetailSchema = z.object({
  id: z.string(),
  substance: z.preprocess(
    normalizeSubstanceType,
    z.enum([
      'CANNABIS',
      'BENZODIAZEPINE',
      'ALCOHOL',
      'NICOTINE',
      'CAFFEINE',
      'PRESCRIPTION_STIMULANT',
      'NON_PRESCRIBED_STIMULANT',
      'OPIOID_PAINKILLER',
      'SLEEP_MEDICATION',
      'ANTIHISTAMINE_SEDATING',
      'OTHER_PRESCRIPTION_MEDICATION',
      'OTHER_NON_PRESCRIBED_DRUG',
      'PREFER_NOT_TO_SAY',
    ]),
  ),
  amount: z.enum(['TINY', 'SMALL', 'NORMAL', 'HEAVY', 'UNSURE']).optional(),
  timing: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT']).optional(),
  reason: z.enum(['ANXIETY', 'SLEEP', 'DEPRESSION', 'BOREDOM', 'PAIN', 'CRAVINGS', 'FOCUS', 'SOCIAL', 'OTHER']).optional(),
  helped: z.enum(['YES', 'A_LITTLE', 'NO', 'WORSE']).optional(),
})

export const quickCheckInSchema = z.object({
  id: z.string(),
  date: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  sleepDuration: z.enum(['UNDER_2', 'TWO_TO_FOUR', 'FIVE_TO_SIX', 'SEVEN_TO_EIGHT', 'EIGHT_PLUS']),
  mood: z.enum(['VERY_LOW', 'LOW', 'MEH', 'OKAY', 'GOOD']),
  anxiety: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EXTREME']),
  depression: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  warningSigns: z.enum(['NONE', 'MILD', 'CONCERNING', 'URGENT']),
  substanceUse: z.enum(['NONE', 'YES']),
  substances: z.array(substanceUseDetailSchema).default([]),
  details: z
    .object({
      happened: optionalString,
      helped: optionalString,
      unusual: optionalString,
      safetyOrWarning: optionalString,
      substanceImpact: optionalString,
    })
    .optional(),
})

export const nightmareEntrySchema = z.object({
  id: z.string(),
  occurredAt: z.string(),
  sleepEntryId: optionalString,
  intensity: z.enum(['MILD', 'MODERATE', 'SEVERE']),
  wakeReactions: z.array(z.enum(['SWEATING', 'PANIC', 'FEAR', 'CONFUSION', 'CRYING', 'OTHER'])),
  description: optionalString,
  afterWaking: z.array(
    z.enum([
      'COULD_NOT_GET_BACK_TO_SLEEP',
      'TOOK_MEDICATION',
      'CONTACTED_SOMEONE',
      'USED_GROUNDING',
      'FELL_BACK_ASLEEP_QUICKLY',
    ]),
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const benzodiazepineEntrySchema = z.object({
  id: z.string(),
  takenAt: z.string(),
  date: z.string(),
  medication: z.enum(['CLONAZEPAM', 'BENZODIAZEPINE', 'LORAZEPAM', 'DIAZEPAM']).optional(),
  quarterUnits: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  wholeTabletMg: z.number().positive().max(10000).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const treatmentProgramIdSchema = z.enum(['tf-cbt', 'cpt', 'pe', 'emdr'])
const treatmentProgramStatusSchema = z.enum(['not-started', 'exploring', 'clinician-supported', 'paused', 'completed'])

export const treatmentProgressSchema = z.object({
  id: z.literal('progress'),
  selectedPrograms: z.array(treatmentProgramIdSchema).default([]),
  programStatuses: z.record(z.string(), treatmentProgramStatusSchema).default({}),
  completedModules: z.array(z.string()).default([]),
  lastOpenedProgram: treatmentProgramIdSchema.optional(),
  lastOpenedPrograms: z.record(z.string(), z.string()).default({}),
  clinicianSupportedMode: z.boolean().default(false),
  updatedAt: z.string(),
})

export const treatmentSettingsSchema = z.object({
  id: z.literal('treatment'),
  useMode: z.enum([
    'self-guided-pathway',
    'coping-tools',
    'learning-options',
    'alongside-therapist',
  ]).optional(),
  useRecurringNightmareThemes: z.boolean().default(false),
  realityStatement: optionalString,
  groundingActions: z.array(z.string()).default([]),
  trustedContactId: optionalString,
  clinicianContactId: optionalString,
  crisisContactId: optionalString,
  hiddenAfterWakingPrompts: z.array(z.string()).default([]),
  hiddenTreatmentPromptIds: z.array(z.string()).default([]),
  activityReminderEnabled: z.boolean().default(false),
  activityReminderTime: z.string().default('18:00'),
  appointmentReminderEnabled: z.boolean().default(false),
  appointmentReminderLeadHours: z.number().int().min(1).max(168).default(24),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const treatmentResponseSchema = z.object({
  id: z.string(),
  programId: treatmentProgramIdSchema,
  moduleId: z.string(),
  relatedActivityId: optionalString,
  values: z.record(z.string(), z.string()),
  hiddenPromptIds: z.array(z.string()).default([]),
  clinicianAssigned: z.boolean().default(false),
  status: z.enum(['draft', 'completed']).optional(),
  lastStepIndex: z.number().int().min(0).optional(),
  activationBefore: z.number().min(0).max(10).optional(),
  activationAfter: z.number().min(0).max(10).optional(),
  helpfulness: z.number().min(0).max(10).optional(),
  keyTakeaway: optionalString,
  plannedNextStep: optionalString,
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).transform((response) => ({
  ...response,
  status: response.status ?? 'completed' as const,
  lastStepIndex: response.lastStepIndex ?? 0,
  startedAt: response.startedAt ?? response.createdAt,
  completedAt: response.status === 'draft'
    ? response.completedAt
    : response.completedAt ?? response.updatedAt,
}))

export const treatmentProgramPlanSchema = z.object({
  id: treatmentProgramIdSchema,
  programId: treatmentProgramIdSchema,
  hopes: optionalString,
  goals: z.array(z.string()).default([]),
  concerns: optionalString,
  agreedFocus: optionalString,
  currentPhaseId: optionalString,
  nextModuleId: optionalString,
  reviewDate: optionalString,
  workingAgreement: optionalString,
  pacingPreference: z.enum(['one-step-at-a-time', 'between-appointments', 'custom']).default('one-step-at-a-time'),
  customPacing: optionalString,
  pausePlan: optionalString,
  clinicianContactId: optionalString,
  nextAppointmentAt: optionalString,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const treatmentActivitySchema = z.object({
  id: z.string(),
  programId: treatmentProgramIdSchema,
  title: z.string().min(1),
  details: optionalString,
  source: z.enum(['self-chosen', 'clinician-agreed']),
  status: z.enum(['planned', 'completed', 'paused', 'stopped']).default('planned'),
  dueDate: optionalString,
  relatedModuleId: optionalString,
  safetyNotes: optionalString,
  supportPlan: optionalString,
  completedAt: optionalString,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const treatmentSessionSchema = z.object({
  id: z.string(),
  programId: treatmentProgramIdSchema,
  appointmentAt: z.string(),
  status: z.enum(['planned', 'completed', 'rescheduled']).default('planned'),
  agenda: optionalString,
  questions: optionalString,
  clinicianInstructions: optionalString,
  observations: optionalString,
  nextSteps: optionalString,
  createdAt: z.string(),
  updatedAt: z.string(),
})

const optionalRating = z.number().int().min(0).max(10).optional()

export const treatmentReviewSchema = z.object({
  id: z.string(),
  programId: treatmentProgramIdSchema,
  reviewDate: z.string(),
  sleepImpact: optionalRating,
  nightmareImpact: optionalRating,
  remindersImpact: optionalRating,
  avoidanceImpact: optionalRating,
  dailyFunctioning: optionalRating,
  copingConfidence: optionalRating,
  goalProgress: optionalRating,
  whatHelped: optionalString,
  whatWasDifficult: optionalString,
  questions: optionalString,
  clinicianMeasureName: optionalString,
  clinicianMeasureScore: z.number().min(0).optional(),
  clinicianMeasureMaximum: z.number().positive().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const treatmentNightmareEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  intensity: z.number().min(0).max(10),
  recoveryMinutes: z.number().min(0).optional(),
  returnedToSleep: z.enum(['YES', 'NO', 'UNSURE']).optional(),
  themeTags: z.array(z.string()).default([]),
  customTags: z.array(z.string()).default([]),
  notes: optionalString,
  suspectedTrigger: optionalString,
  nextDayEffect: optionalString,
  linkedSleepEntryId: optionalString,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const eveningCheckInSchema = z.object({
  id: z.string(),
  date: z.string(),
  moodRating: z.enum(['1', '2', '3', '4', '5']).optional(),
  anxietySeverity: z.enum(['NONE', 'MILD', 'MODERATE', 'SEVERE', 'EXTREME']),
  anxietyContributors: z.array(
    z.enum(['COURT_LEGAL', 'FAMILY', 'RELATIONSHIPS', 'MONEY', 'HEALTH', 'SLEEP', 'SOCIAL_SITUATIONS', 'UNKNOWN', 'OTHER']),
  ),
  anxietyOtherText: optionalString,
  depressionSeverity: z.enum(['NONE', 'MILD', 'MODERATE', 'SEVERE', 'EXTREME']),
  depressionSymptoms: z.array(
    z.enum(['HOPELESS', 'GUILTY', 'WORTHLESS', 'LOST_INTEREST', 'ISOLATED_MYSELF', 'STRUGGLED_TO_GET_OUT_OF_BED', 'UNMOTIVATED', 'NONE']),
  ),
  depressionContributors: z.array(
    z.enum(['COURT_LEGAL', 'FAMILY', 'RELATIONSHIPS', 'MONEY', 'HEALTH', 'SLEEP', 'LONELINESS', 'UNKNOWN', 'OTHER']),
  ),
  depressionOtherText: optionalString,
  suspiciousness: z.enum(['NOT_AT_ALL', 'SLIGHTLY', 'MODERATELY', 'SIGNIFICANTLY', 'EXTREMELY']),
  unusualMeanings: z.enum(['NOT_AT_ALL', 'SLIGHTLY', 'MODERATELY', 'SIGNIFICANTLY', 'EXTREMELY']),
  beliefCertainty: z.enum([
    'NOT_AT_ALL',
    'UNSURE',
    'SOMEWHAT_CONVINCED',
    'VERY_CONVINCED',
    'COMPLETELY_CONVINCED',
    'NOT_APPLICABLE',
  ]),
  perceptualExperiences: z.array(z.enum(['HEARD_SOMETHING', 'SAW_SOMETHING', 'FELT_PRESENCE', 'MISTOOK_PERSON', 'NONE'])),
  thinkingClarity: z.enum(['CLEAR', 'SLIGHTLY_SCATTERED', 'NOTICEABLY_SCATTERED', 'VERY_DIFFICULT']),
  realityCheck: z.enum(['NOT_APPLICABLE', 'CHALLENGED_THEM', 'DISCUSSED_WITH_SOMEONE', 'ACCEPTED_AS_TRUE']),
  functioning: z.array(
    z.enum(['SHOWERED', 'LEFT_HOUSE', 'EXERCISED', 'PRODUCTIVE_TASK', 'MEDICATION_AS_PRESCRIBED', 'PERSONAL_PROJECT']),
  ),
  notes: optionalString,
  status: z.enum(['DRAFT', 'COMPLETE']).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const journalEntrySchema = z.object({
  id: z.string(),
  title: optionalString,
  body: z.string(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const supportContactSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  phone: optionalString,
  notes: optionalString,
  isDefault: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const appSettingsSchema = z.object({
  id: z.literal('app'),
  theme: z.enum(['SYSTEM', 'LIGHT', 'DARK']).default('SYSTEM'),
  notificationsEnabled: z.boolean().default(false),
  hideSubstanceUseDetails: z.boolean().default(false),
  morningCheckInReminderEnabled: z.boolean().default(true),
  morningCheckInReminderTime: z.string().default('09:00'),
  checkInReminderEnabled: z.boolean().default(true),
  checkInReminderTime: z.string().default('20:30'),
  sleepReminderEnabled: z.boolean().default(false),
  sleepReminderTime: z.string().default('21:30'),
  quoteReminderEnabled: z.boolean().default(false),
  quoteReminderTime: z.string().default('09:00'),
  benzodiazepineMedication: z.enum(['CLONAZEPAM', 'BENZODIAZEPINE', 'LORAZEPAM', 'DIAZEPAM']).default('CLONAZEPAM'),
  benzodiazepineTabletMgByMedication: z.record(z.string(), z.number().positive().max(10000)).default({}),
  lastNotificationDate: optionalString,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const exportBundleSchema = z.object({
  schemaVersion: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
  exportedAt: z.string(),
  quotes: z.array(quoteSchema),
  dailyQuoteState: z.array(dailyQuoteStateSchema),
  quickCheckIns: z.array(quickCheckInSchema).default([]),
  benzodiazepineEntries: z.array(benzodiazepineEntrySchema).default([]),
  sleepEntries: z.array(sleepEntrySchema),
  nightmareEntries: z.array(nightmareEntrySchema),
  eveningCheckIns: z.array(eveningCheckInSchema),
  journalEntries: z.array(journalEntrySchema),
  supportContacts: z.array(supportContactSchema),
  treatmentProgress: treatmentProgressSchema.optional(),
  treatmentSettings: treatmentSettingsSchema.optional(),
  treatmentResponses: z.array(treatmentResponseSchema).default([]),
  treatmentProgramPlans: z.array(treatmentProgramPlanSchema).default([]),
  treatmentActivities: z.array(treatmentActivitySchema).default([]),
  treatmentSessions: z.array(treatmentSessionSchema).default([]),
  treatmentReviews: z.array(treatmentReviewSchema).default([]),
  treatmentNightmares: z.array(treatmentNightmareEntrySchema).default([]),
  appSettings: appSettingsSchema.optional(),
}).transform((bundle) => {
  const now = bundle.exportedAt
  const isLegacyMedicationBundle = bundle.schemaVersion < 6
  return {
    ...bundle,
    schemaVersion: 6 as const,
    benzodiazepineEntries: isLegacyMedicationBundle
      ? bundle.benzodiazepineEntries.map((entry) => ({
        ...entry,
        medication: entry.medication === undefined || entry.medication === 'BENZODIAZEPINE'
          ? 'CLONAZEPAM' as const
          : entry.medication,
      }))
      : bundle.benzodiazepineEntries,
    appSettings: bundle.appSettings
      ? {
        ...bundle.appSettings,
        benzodiazepineMedication: isLegacyMedicationBundle && bundle.appSettings.benzodiazepineMedication === 'BENZODIAZEPINE'
          ? 'CLONAZEPAM' as const
          : bundle.appSettings.benzodiazepineMedication,
      }
      : bundle.appSettings,
    treatmentProgress: bundle.treatmentProgress ?? {
      id: 'progress' as const,
      selectedPrograms: [],
      programStatuses: {},
      completedModules: [],
      lastOpenedPrograms: {},
      clinicianSupportedMode: false,
      updatedAt: now,
    },
    treatmentSettings: bundle.treatmentSettings ?? {
      id: 'treatment' as const,
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
    },
  }
})
