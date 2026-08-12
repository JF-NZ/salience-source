export type QuoteCategory =
  | 'RESILIENCE'
  | 'COURAGE'
  | 'RECOVERY'
  | 'RESPONSIBILITY'
  | 'CALM'
  | 'COURT_DAY_GROUNDING'
  | 'SLEEP_AND_REST'
  | 'SHAME_AND_SELF_FORGIVENESS'

export interface Quote {
  id: string
  text: string
  author: string
  category: QuoteCategory
  tags: string[]
  isUserAdded: boolean
  isFavorite?: boolean
  createdAt: string
}

export interface DailyQuoteState {
  date: string
  quoteId: string
  manuallyRefreshed: boolean
}

export type SleepDuration =
  | 'UNDER_2'
  | 'TWO_TO_FOUR'
  | 'FIVE_TO_SIX'
  | 'SEVEN_TO_EIGHT'
  | 'EIGHT_PLUS'

export type SleepQuality = 'VERY_POOR' | 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT'

export type SleepDisruption =
  | 'TROUBLE_FALLING_ASLEEP'
  | 'WOKE_REPEATEDLY'
  | 'NIGHTMARES'
  | 'WOKE_EARLY'
  | 'SLEPT_UNUSUALLY_LONG'
  | 'NONE'

export interface SleepEntry {
  id: string
  date: string
  durationCategory: SleepDuration
  quality: SleepQuality
  disruptions: SleepDisruption[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export type QuickMood = 'VERY_LOW' | 'LOW' | 'MEH' | 'OKAY' | 'GOOD'
export type QuickAnxiety = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'
export type QuickDepression = 'LOW' | 'MEDIUM' | 'HIGH'
export type QuickWarningSigns = 'NONE' | 'MILD' | 'CONCERNING' | 'URGENT'
export type SubstanceUseAnswer = 'NONE' | 'YES'
export type SubstanceType =
  | 'CANNABIS'
  | 'BENZODIAZEPINE'
  | 'CLONAZEPAM'
  | 'OTHER_BENZODIAZEPINE'
  | 'ALCOHOL'
  | 'NICOTINE'
  | 'CAFFEINE'
  | 'PRESCRIPTION_STIMULANT'
  | 'NON_PRESCRIBED_STIMULANT'
  | 'OPIOID_PAINKILLER'
  | 'SLEEP_MEDICATION'
  | 'ANTIHISTAMINE_SEDATING'
  | 'OTHER_PRESCRIPTION_MEDICATION'
  | 'OTHER_NON_PRESCRIBED_DRUG'
  | 'PREFER_NOT_TO_SAY'
export type SubstanceAmount = 'TINY' | 'SMALL' | 'NORMAL' | 'HEAVY' | 'UNSURE'
export type SubstanceTiming = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT'
export type SubstanceReason = 'ANXIETY' | 'SLEEP' | 'DEPRESSION' | 'BOREDOM' | 'PAIN' | 'CRAVINGS' | 'FOCUS' | 'SOCIAL' | 'OTHER'
export type SubstanceHelped = 'YES' | 'A_LITTLE' | 'NO' | 'WORSE'

export interface SubstanceUseDetail {
  id: string
  substance: SubstanceType
  amount?: SubstanceAmount
  timing?: SubstanceTiming
  reason?: SubstanceReason
  helped?: SubstanceHelped
}

export type BenzodiazepineMedication = 'CLONAZEPAM' | 'BENZODIAZEPINE' | 'LORAZEPAM' | 'DIAZEPAM'

export type BenzodiazepineQuarterUnits = 1 | 2 | 3 | 4

export interface BenzodiazepineEntry {
  id: string
  takenAt: string
  date: string
  medication?: BenzodiazepineMedication
  quarterUnits: BenzodiazepineQuarterUnits
  wholeTabletMg?: number
  createdAt: string
  updatedAt: string
}

export interface QuickCheckIn {
  id: string
  date: string
  createdAt: string
  updatedAt: string
  sleepDuration: SleepDuration
  mood: QuickMood
  anxiety: QuickAnxiety
  depression: QuickDepression
  warningSigns: QuickWarningSigns
  substanceUse: SubstanceUseAnswer
  substances: SubstanceUseDetail[]
  details?: {
    happened?: string
    helped?: string
    unusual?: string
    safetyOrWarning?: string
    substanceImpact?: string
  }
}

export type NightmareIntensity = 'MILD' | 'MODERATE' | 'SEVERE'

export type NightmareWakeReaction =
  | 'SWEATING'
  | 'PANIC'
  | 'FEAR'
  | 'CONFUSION'
  | 'CRYING'
  | 'OTHER'

export type NightmareAfterWaking =
  | 'COULD_NOT_GET_BACK_TO_SLEEP'
  | 'TOOK_MEDICATION'
  | 'CONTACTED_SOMEONE'
  | 'USED_GROUNDING'
  | 'FELL_BACK_ASLEEP_QUICKLY'

export interface NightmareEntry {
  id: string
  occurredAt: string
  sleepEntryId?: string
  intensity: NightmareIntensity
  wakeReactions: NightmareWakeReaction[]
  description?: string
  afterWaking: NightmareAfterWaking[]
  createdAt: string
  updatedAt: string
}

export type TreatmentProgramId = 'tf-cbt' | 'cpt' | 'pe' | 'emdr'

export type TreatmentProgramStatus =
  | 'not-started'
  | 'exploring'
  | 'clinician-supported'
  | 'paused'
  | 'completed'

export type TreatmentUseMode =
  | 'self-guided-pathway'
  | 'coping-tools'
  | 'learning-options'
  | 'alongside-therapist'

export interface TreatmentProgress {
  id: 'progress'
  selectedPrograms: TreatmentProgramId[]
  programStatuses: Partial<Record<TreatmentProgramId, TreatmentProgramStatus>>
  completedModules: string[]
  lastOpenedProgram?: TreatmentProgramId
  lastOpenedPrograms: Partial<Record<TreatmentProgramId, string>>
  clinicianSupportedMode: boolean
  updatedAt: string
}

export type TreatmentResponseStatus = 'draft' | 'completed'

export interface TreatmentSettings {
  id: 'treatment'
  useMode?: TreatmentUseMode
  useRecurringNightmareThemes: boolean
  realityStatement?: string
  groundingActions: string[]
  trustedContactId?: string
  clinicianContactId?: string
  crisisContactId?: string
  hiddenAfterWakingPrompts: string[]
  hiddenTreatmentPromptIds: string[]
  activityReminderEnabled: boolean
  activityReminderTime: string
  appointmentReminderEnabled: boolean
  appointmentReminderLeadHours: number
  createdAt: string
  updatedAt: string
}

export interface TreatmentResponse {
  id: string
  programId: TreatmentProgramId
  moduleId: string
  relatedActivityId?: string
  values: Record<string, string>
  hiddenPromptIds: string[]
  clinicianAssigned: boolean
  status: TreatmentResponseStatus
  lastStepIndex: number
  activationBefore?: number
  activationAfter?: number
  helpfulness?: number
  keyTakeaway?: string
  plannedNextStep?: string
  startedAt: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export type TreatmentPacingPreference =
  | 'one-step-at-a-time'
  | 'between-appointments'
  | 'custom'

export interface TreatmentProgramPlan {
  id: TreatmentProgramId
  programId: TreatmentProgramId
  hopes?: string
  goals: string[]
  concerns?: string
  agreedFocus?: string
  currentPhaseId?: string
  nextModuleId?: string
  reviewDate?: string
  workingAgreement?: string
  pacingPreference: TreatmentPacingPreference
  customPacing?: string
  pausePlan?: string
  clinicianContactId?: string
  nextAppointmentAt?: string
  createdAt: string
  updatedAt: string
}

export type TreatmentActivitySource = 'self-chosen' | 'clinician-agreed'

export type TreatmentActivityStatus =
  | 'planned'
  | 'completed'
  | 'paused'
  | 'stopped'

export interface TreatmentActivity {
  id: string
  programId: TreatmentProgramId
  title: string
  details?: string
  source: TreatmentActivitySource
  status: TreatmentActivityStatus
  dueDate?: string
  relatedModuleId?: string
  safetyNotes?: string
  supportPlan?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export type TreatmentSessionStatus = 'planned' | 'completed' | 'rescheduled'

export interface TreatmentSession {
  id: string
  programId: TreatmentProgramId
  appointmentAt: string
  status: TreatmentSessionStatus
  agenda?: string
  questions?: string
  clinicianInstructions?: string
  observations?: string
  nextSteps?: string
  createdAt: string
  updatedAt: string
}

export interface TreatmentReview {
  id: string
  programId: TreatmentProgramId
  reviewDate: string
  sleepImpact?: number
  nightmareImpact?: number
  remindersImpact?: number
  avoidanceImpact?: number
  dailyFunctioning?: number
  copingConfidence?: number
  goalProgress?: number
  whatHelped?: string
  whatWasDifficult?: string
  questions?: string
  clinicianMeasureName?: string
  clinicianMeasureScore?: number
  clinicianMeasureMaximum?: number
  createdAt: string
  updatedAt: string
}

export interface TreatmentNightmareEntry {
  id: string
  timestamp: string
  intensity: number
  recoveryMinutes?: number
  returnedToSleep?: 'YES' | 'NO' | 'UNSURE'
  themeTags: string[]
  customTags: string[]
  notes?: string
  suspectedTrigger?: string
  nextDayEffect?: string
  linkedSleepEntryId?: string
  createdAt: string
  updatedAt: string
}

export type Severity5 = 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE' | 'EXTREME'

export type PsychosisSeverity =
  | 'NOT_AT_ALL'
  | 'SLIGHTLY'
  | 'MODERATELY'
  | 'SIGNIFICANTLY'
  | 'EXTREMELY'

export type BeliefCertainty =
  | 'NOT_AT_ALL'
  | 'UNSURE'
  | 'SOMEWHAT_CONVINCED'
  | 'VERY_CONVINCED'
  | 'COMPLETELY_CONVINCED'
  | 'NOT_APPLICABLE'

export type ThinkingClarity =
  | 'CLEAR'
  | 'SLIGHTLY_SCATTERED'
  | 'NOTICEABLY_SCATTERED'
  | 'VERY_DIFFICULT'

export type RealityCheck =
  | 'NOT_APPLICABLE'
  | 'CHALLENGED_THEM'
  | 'DISCUSSED_WITH_SOMEONE'
  | 'ACCEPTED_AS_TRUE'

export type AnxietyContributor =
  | 'COURT_LEGAL'
  | 'FAMILY'
  | 'RELATIONSHIPS'
  | 'MONEY'
  | 'HEALTH'
  | 'SLEEP'
  | 'SOCIAL_SITUATIONS'
  | 'UNKNOWN'
  | 'OTHER'

export type DepressionContributor =
  | 'COURT_LEGAL'
  | 'FAMILY'
  | 'RELATIONSHIPS'
  | 'MONEY'
  | 'HEALTH'
  | 'SLEEP'
  | 'LONELINESS'
  | 'UNKNOWN'
  | 'OTHER'

export type DepressionSymptom =
  | 'HOPELESS'
  | 'GUILTY'
  | 'WORTHLESS'
  | 'LOST_INTEREST'
  | 'ISOLATED_MYSELF'
  | 'STRUGGLED_TO_GET_OUT_OF_BED'
  | 'UNMOTIVATED'
  | 'NONE'

export type PerceptualExperience =
  | 'HEARD_SOMETHING'
  | 'SAW_SOMETHING'
  | 'FELT_PRESENCE'
  | 'MISTOOK_PERSON'
  | 'NONE'

export type FunctioningItem =
  | 'SHOWERED'
  | 'LEFT_HOUSE'
  | 'EXERCISED'
  | 'PRODUCTIVE_TASK'
  | 'MEDICATION_AS_PRESCRIBED'
  | 'PERSONAL_PROJECT'

export type EveningMoodRating = '1' | '2' | '3' | '4' | '5'

export interface EveningCheckIn {
  id: string
  date: string
  moodRating?: EveningMoodRating
  anxietySeverity: Severity5
  anxietyContributors: AnxietyContributor[]
  anxietyOtherText?: string
  depressionSeverity: Severity5
  depressionSymptoms: DepressionSymptom[]
  depressionContributors: DepressionContributor[]
  depressionOtherText?: string
  suspiciousness: PsychosisSeverity
  unusualMeanings: PsychosisSeverity
  beliefCertainty: BeliefCertainty
  perceptualExperiences: PerceptualExperience[]
  thinkingClarity: ThinkingClarity
  realityCheck: RealityCheck
  functioning: FunctioningItem[]
  notes?: string
  status?: 'DRAFT' | 'COMPLETE'
  createdAt: string
  updatedAt: string
}

export interface JournalEntry {
  id: string
  title?: string
  body: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface SupportContact {
  id: string
  name: string
  role: string
  phone?: string
  notes?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export type ThemePreference = 'SYSTEM' | 'LIGHT' | 'DARK'

export interface AppSettings {
  id: 'app'
  theme: ThemePreference
  notificationsEnabled: boolean
  hideSubstanceUseDetails: boolean
  morningCheckInReminderEnabled: boolean
  morningCheckInReminderTime: string
  checkInReminderEnabled: boolean
  checkInReminderTime: string
  sleepReminderEnabled: boolean
  sleepReminderTime: string
  quoteReminderEnabled: boolean
  quoteReminderTime: string
  benzodiazepineMedication: BenzodiazepineMedication
  benzodiazepineTabletMgByMedication: Partial<Record<BenzodiazepineMedication, number>>
  lastNotificationDate?: string
  createdAt: string
  updatedAt: string
}

export interface AppData {
  quotes: Quote[]
  dailyQuoteState: DailyQuoteState[]
  quickCheckIns: QuickCheckIn[]
  benzodiazepineEntries: BenzodiazepineEntry[]
  sleepEntries: SleepEntry[]
  nightmareEntries: NightmareEntry[]
  eveningCheckIns: EveningCheckIn[]
  journalEntries: JournalEntry[]
  supportContacts: SupportContact[]
  treatmentProgress: TreatmentProgress
  treatmentSettings: TreatmentSettings
  treatmentResponses: TreatmentResponse[]
  treatmentProgramPlans: TreatmentProgramPlan[]
  treatmentActivities: TreatmentActivity[]
  treatmentSessions: TreatmentSession[]
  treatmentReviews: TreatmentReview[]
  treatmentNightmares: TreatmentNightmareEntry[]
  appSettings: AppSettings
}

export interface ExportBundle extends AppData {
  schemaVersion: 6
  exportedAt: string
}
