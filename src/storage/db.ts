import Dexie, { type Table } from 'dexie'
import { defaultAppSettings, defaultSupportContacts, isRetiredSeedQuote, seedQuotes } from '../data/seed'
import { exportBundleSchema } from '../lib/schemas'
import { defaultTreatmentProgress, defaultTreatmentSettings } from '../lib/treatment'
import type {
  AppData,
  AppSettings,
  BenzodiazepineEntry,
  DailyQuoteState,
  EveningCheckIn,
  ExportBundle,
  JournalEntry,
  NightmareEntry,
  QuickCheckIn,
  Quote,
  SleepEntry,
  SupportContact,
  TreatmentActivity,
  TreatmentNightmareEntry,
  TreatmentProgress,
  TreatmentProgramPlan,
  TreatmentResponse,
  TreatmentReview,
  TreatmentSession,
  TreatmentSettings,
} from '../types'

class SalienceDatabase extends Dexie {
  quotes!: Table<Quote, string>
  dailyQuoteState!: Table<DailyQuoteState, string>
  quickCheckIns!: Table<QuickCheckIn, string>
  benzodiazepineEntries!: Table<BenzodiazepineEntry, string>
  sleepEntries!: Table<SleepEntry, string>
  nightmareEntries!: Table<NightmareEntry, string>
  eveningCheckIns!: Table<EveningCheckIn, string>
  journalEntries!: Table<JournalEntry, string>
  supportContacts!: Table<SupportContact, string>
  treatmentProgress!: Table<TreatmentProgress, string>
  treatmentSettings!: Table<TreatmentSettings, string>
  treatmentResponses!: Table<TreatmentResponse, string>
  treatmentProgramPlans!: Table<TreatmentProgramPlan, string>
  treatmentActivities!: Table<TreatmentActivity, string>
  treatmentSessions!: Table<TreatmentSession, string>
  treatmentReviews!: Table<TreatmentReview, string>
  treatmentNightmares!: Table<TreatmentNightmareEntry, string>
  appSettings!: Table<AppSettings, string>

  constructor() {
    super('salience-local-v1')
    this.version(1).stores({
      quotes: 'id, category, isUserAdded',
      dailyQuoteState: 'date, quoteId',
      sleepEntries: 'id, &date, durationCategory, quality',
      nightmareEntries: 'id, occurredAt, intensity',
      eveningCheckIns: 'id, &date, anxietySeverity, depressionSeverity, suspiciousness',
      journalEntries: 'id, createdAt, updatedAt, *tags',
      supportContacts: 'id, role, isDefault',
      appSettings: 'id, theme, notificationsEnabled',
    })
    this.version(2).stores({
      quotes: 'id, category, isUserAdded',
      dailyQuoteState: 'date, quoteId',
      quickCheckIns: 'id, date, createdAt, mood, anxiety, depression, warningSigns, substanceUse',
      sleepEntries: 'id, &date, durationCategory, quality',
      nightmareEntries: 'id, occurredAt, intensity',
      eveningCheckIns: 'id, &date, anxietySeverity, depressionSeverity, suspiciousness',
      journalEntries: 'id, createdAt, updatedAt, *tags',
      supportContacts: 'id, role, isDefault',
      appSettings: 'id, theme, notificationsEnabled',
    })
    this.version(3).stores({
      quotes: 'id, category, isUserAdded',
      dailyQuoteState: 'date, quoteId',
      quickCheckIns: 'id, date, createdAt, mood, anxiety, depression, warningSigns, substanceUse',
      sleepEntries: 'id, &date, durationCategory, quality',
      nightmareEntries: 'id, occurredAt, intensity',
      eveningCheckIns: 'id, &date, anxietySeverity, depressionSeverity, suspiciousness',
      journalEntries: 'id, createdAt, updatedAt, *tags',
      supportContacts: 'id, role, isDefault',
      treatmentProgress: 'id, lastOpenedProgram, updatedAt',
      treatmentSettings: 'id, useMode, updatedAt',
      treatmentResponses: 'id, programId, moduleId, updatedAt',
      treatmentNightmares: 'id, timestamp, intensity, linkedSleepEntryId, *themeTags, *customTags',
      appSettings: 'id, theme, notificationsEnabled',
    })
    this.version(4).stores({
      quotes: 'id, category, isUserAdded',
      dailyQuoteState: 'date, quoteId',
      quickCheckIns: 'id, date, createdAt, mood, anxiety, depression, warningSigns, substanceUse',
      sleepEntries: 'id, &date, durationCategory, quality',
      nightmareEntries: 'id, occurredAt, intensity',
      eveningCheckIns: 'id, &date, anxietySeverity, depressionSeverity, suspiciousness',
      journalEntries: 'id, createdAt, updatedAt, *tags',
      supportContacts: 'id, role, isDefault',
      treatmentProgress: 'id, lastOpenedProgram, updatedAt',
      treatmentSettings: 'id, useMode, updatedAt',
      treatmentResponses: 'id, programId, moduleId, status, updatedAt',
      treatmentProgramPlans: 'id, programId, updatedAt',
      treatmentSessions: 'id, programId, appointmentAt, status, updatedAt',
      treatmentReviews: 'id, programId, reviewDate, updatedAt',
      treatmentNightmares: 'id, timestamp, intensity, linkedSleepEntryId, *themeTags, *customTags',
      appSettings: 'id, theme, notificationsEnabled',
    }).upgrade(async (transaction) => {
      const responses = transaction.table<TreatmentResponse, string>('treatmentResponses')
      const settings = transaction.table<TreatmentSettings, string>('treatmentSettings')
      await responses.toCollection().modify((response) => {
        const now = response.updatedAt || response.createdAt || new Date().toISOString()
        response.status = response.status ?? 'completed'
        response.lastStepIndex = response.lastStepIndex ?? 0
        response.startedAt = response.startedAt ?? response.createdAt ?? now
        if (response.status === 'completed') response.completedAt = response.completedAt ?? response.updatedAt ?? now
      })
      await settings.toCollection().modify((value) => {
        value.hiddenTreatmentPromptIds = value.hiddenTreatmentPromptIds ?? []
        value.activityReminderEnabled = value.activityReminderEnabled ?? false
        value.activityReminderTime = value.activityReminderTime ?? '18:00'
        value.appointmentReminderEnabled = value.appointmentReminderEnabled ?? false
        value.appointmentReminderLeadHours = value.appointmentReminderLeadHours ?? 24
      })
    })
    this.version(5).stores({
      quotes: 'id, category, isUserAdded',
      dailyQuoteState: 'date, quoteId',
      quickCheckIns: 'id, date, createdAt, mood, anxiety, depression, warningSigns, substanceUse',
      sleepEntries: 'id, &date, durationCategory, quality',
      nightmareEntries: 'id, occurredAt, intensity',
      eveningCheckIns: 'id, &date, anxietySeverity, depressionSeverity, suspiciousness',
      journalEntries: 'id, createdAt, updatedAt, *tags',
      supportContacts: 'id, role, isDefault',
      treatmentProgress: 'id, lastOpenedProgram, updatedAt',
      treatmentSettings: 'id, useMode, updatedAt',
      treatmentResponses: 'id, programId, moduleId, relatedActivityId, status, updatedAt',
      treatmentProgramPlans: 'id, programId, updatedAt',
      treatmentActivities: 'id, programId, status, dueDate, relatedModuleId, updatedAt',
      treatmentSessions: 'id, programId, appointmentAt, status, updatedAt',
      treatmentReviews: 'id, programId, reviewDate, updatedAt',
      treatmentNightmares: 'id, timestamp, intensity, linkedSleepEntryId, *themeTags, *customTags',
      appSettings: 'id, theme, notificationsEnabled',
    })
    this.version(6).stores({
      quotes: 'id, category, isUserAdded',
      dailyQuoteState: 'date, quoteId',
      quickCheckIns: 'id, date, createdAt, mood, anxiety, depression, warningSigns, substanceUse',
      benzodiazepineEntries: 'id, date, takenAt',
      sleepEntries: 'id, &date, durationCategory, quality',
      nightmareEntries: 'id, occurredAt, intensity',
      eveningCheckIns: 'id, &date, anxietySeverity, depressionSeverity, suspiciousness',
      journalEntries: 'id, createdAt, updatedAt, *tags',
      supportContacts: 'id, role, isDefault',
      treatmentProgress: 'id, lastOpenedProgram, updatedAt',
      treatmentSettings: 'id, useMode, updatedAt',
      treatmentResponses: 'id, programId, moduleId, relatedActivityId, status, updatedAt',
      treatmentProgramPlans: 'id, programId, updatedAt',
      treatmentActivities: 'id, programId, status, dueDate, relatedModuleId, updatedAt',
      treatmentSessions: 'id, programId, appointmentAt, status, updatedAt',
      treatmentReviews: 'id, programId, reviewDate, updatedAt',
      treatmentNightmares: 'id, timestamp, intensity, linkedSleepEntryId, *themeTags, *customTags',
      appSettings: 'id, theme, notificationsEnabled',
    })
    this.version(7).stores({
      quotes: 'id, category, isUserAdded',
      dailyQuoteState: 'date, quoteId',
      quickCheckIns: 'id, date, createdAt, mood, anxiety, depression, warningSigns, substanceUse',
      benzodiazepineEntries: 'id, date, takenAt',
      sleepEntries: 'id, &date, durationCategory, quality',
      nightmareEntries: 'id, occurredAt, intensity, sleepEntryId',
      eveningCheckIns: 'id, &date, anxietySeverity, depressionSeverity, suspiciousness',
      journalEntries: 'id, createdAt, updatedAt, *tags',
      supportContacts: 'id, role, isDefault',
      treatmentProgress: 'id, lastOpenedProgram, updatedAt',
      treatmentSettings: 'id, useMode, updatedAt',
      treatmentResponses: 'id, programId, moduleId, relatedActivityId, status, updatedAt',
      treatmentProgramPlans: 'id, programId, updatedAt',
      treatmentActivities: 'id, programId, status, dueDate, relatedModuleId, updatedAt',
      treatmentSessions: 'id, programId, appointmentAt, status, updatedAt',
      treatmentReviews: 'id, programId, reviewDate, updatedAt',
      treatmentNightmares: 'id, timestamp, intensity, linkedSleepEntryId, *themeTags, *customTags',
      appSettings: 'id, theme, notificationsEnabled',
    })
    this.version(8).stores({
      quotes: 'id, category, isUserAdded',
      dailyQuoteState: 'date, quoteId',
      quickCheckIns: 'id, date, createdAt, mood, anxiety, depression, warningSigns, substanceUse',
      benzodiazepineEntries: 'id, date, takenAt',
      sleepEntries: 'id, &date, durationCategory, quality',
      nightmareEntries: 'id, occurredAt, intensity, sleepEntryId',
      eveningCheckIns: 'id, &date, anxietySeverity, depressionSeverity, suspiciousness',
      journalEntries: 'id, createdAt, updatedAt, *tags',
      supportContacts: 'id, role, isDefault',
      treatmentProgress: 'id, lastOpenedProgram, updatedAt',
      treatmentSettings: 'id, useMode, updatedAt',
      treatmentResponses: 'id, programId, moduleId, relatedActivityId, status, updatedAt',
      treatmentProgramPlans: 'id, programId, updatedAt',
      treatmentActivities: 'id, programId, status, dueDate, relatedModuleId, updatedAt',
      treatmentSessions: 'id, programId, appointmentAt, status, updatedAt',
      treatmentReviews: 'id, programId, reviewDate, updatedAt',
      treatmentNightmares: 'id, timestamp, intensity, linkedSleepEntryId, *themeTags, *customTags',
      appSettings: 'id, theme, notificationsEnabled',
    }).upgrade(async (transaction) => {
      const settings = transaction.table<AppSettings, string>('appSettings')
      await settings.toCollection().modify((value) => {
        value.benzodiazepineMedication = value.benzodiazepineMedication ?? 'BENZODIAZEPINE'
      })
    })
    this.version(9).stores({
      quotes: 'id, category, isUserAdded',
      dailyQuoteState: 'date, quoteId',
      quickCheckIns: 'id, date, createdAt, mood, anxiety, depression, warningSigns, substanceUse',
      benzodiazepineEntries: 'id, date, takenAt',
      sleepEntries: 'id, &date, durationCategory, quality',
      nightmareEntries: 'id, occurredAt, intensity, sleepEntryId',
      eveningCheckIns: 'id, &date, anxietySeverity, depressionSeverity, suspiciousness',
      journalEntries: 'id, createdAt, updatedAt, *tags',
      supportContacts: 'id, role, isDefault',
      treatmentProgress: 'id, lastOpenedProgram, updatedAt',
      treatmentSettings: 'id, useMode, updatedAt',
      treatmentResponses: 'id, programId, moduleId, relatedActivityId, status, updatedAt',
      treatmentProgramPlans: 'id, programId, updatedAt',
      treatmentActivities: 'id, programId, status, dueDate, relatedModuleId, updatedAt',
      treatmentSessions: 'id, programId, appointmentAt, status, updatedAt',
      treatmentReviews: 'id, programId, reviewDate, updatedAt',
      treatmentNightmares: 'id, timestamp, intensity, linkedSleepEntryId, *themeTags, *customTags',
      appSettings: 'id, theme, notificationsEnabled',
    }).upgrade(async (transaction) => {
      const entries = transaction.table<BenzodiazepineEntry, string>('benzodiazepineEntries')
      const settings = transaction.table<AppSettings, string>('appSettings')

      await entries.toCollection().modify((entry) => {
        if (entry.medication === undefined || entry.medication === 'BENZODIAZEPINE') {
          entry.medication = 'CLONAZEPAM'
        }
      })
      await settings.toCollection().modify((value) => {
        if (value.benzodiazepineMedication === 'BENZODIAZEPINE') {
          value.benzodiazepineMedication = 'CLONAZEPAM'
        }
        value.benzodiazepineTabletMgByMedication = value.benzodiazepineTabletMgByMedication ?? {}
      })
    })
  }
}

export const db = new SalienceDatabase()

const withDefaultSettings = (settings?: AppSettings): AppSettings => ({
  ...defaultAppSettings,
  ...settings,
  id: 'app',
})

export const ensureSeedData = async () => {
  const retiredQuoteIds = (await db.quotes.filter(isRetiredSeedQuote).primaryKeys()).map(String)
  if (retiredQuoteIds.length > 0) {
    await db.transaction('rw', [db.quotes, db.dailyQuoteState], async () => {
      await db.quotes.bulkDelete(retiredQuoteIds)
      await db.dailyQuoteState.where('quoteId').anyOf(retiredQuoteIds).delete()
    })
  }

  const [quoteCount, supportCount, settingsCount, treatmentProgressCount, treatmentSettingsCount] = await Promise.all([
    db.quotes.count(),
    db.supportContacts.count(),
    db.appSettings.count(),
    db.treatmentProgress.count(),
    db.treatmentSettings.count(),
  ])

  if (quoteCount === 0) {
    await db.quotes.bulkPut(seedQuotes)
  } else {
    const existingIds = new Set(await db.quotes.toCollection().primaryKeys())
    const missingSeedQuotes = seedQuotes.filter((quote) => !existingIds.has(quote.id))
    if (missingSeedQuotes.length > 0) {
      await db.quotes.bulkPut(missingSeedQuotes)
    }
  }

  if (supportCount === 0) {
    await db.supportContacts.bulkPut(defaultSupportContacts)
  } else {
    const configuredCrisisTeam = await db.supportContacts.get('support-crisis-team')
    const redundantSeedIds: string[] = []
    if (configuredCrisisTeam?.phone) {
      redundantSeedIds.push(
        ...defaultSupportContacts
          .filter((contact) =>
            contact.id.startsWith('support-crisis-team-') &&
            contact.phone === configuredCrisisTeam.phone,
          )
          .map((contact) => contact.id),
      )

      if (redundantSeedIds.length > 0) {
        await db.supportContacts.bulkDelete(redundantSeedIds)
      }
    }

    const existingIds = new Set(await db.supportContacts.toCollection().primaryKeys())
    const missingDefaultContacts = defaultSupportContacts.filter(
      (contact) => !existingIds.has(contact.id) && !redundantSeedIds.includes(contact.id),
    )
    if (missingDefaultContacts.length > 0) {
      await db.supportContacts.bulkPut(missingDefaultContacts)
    }
  }

  if (settingsCount === 0) {
    await db.appSettings.put(defaultAppSettings)
  }
  if (treatmentProgressCount === 0) {
    await db.treatmentProgress.put(defaultTreatmentProgress())
  }
  if (treatmentSettingsCount === 0) {
    await db.treatmentSettings.put(defaultTreatmentSettings())
  }
}

export const readAllData = async (): Promise<AppData> => {
  await ensureSeedData()

  const [
    quotes,
    dailyQuoteState,
    quickCheckIns,
    benzodiazepineEntries,
    sleepEntries,
    nightmareEntries,
    eveningCheckIns,
    journalEntries,
    supportContacts,
    treatmentProgress,
    treatmentSettings,
    treatmentResponses,
    treatmentProgramPlans,
    treatmentActivities,
    treatmentSessions,
    treatmentReviews,
    treatmentNightmares,
    appSettings,
  ] = await Promise.all([
    db.quotes.toArray(),
    db.dailyQuoteState.toArray(),
    db.quickCheckIns.orderBy('createdAt').toArray(),
    db.benzodiazepineEntries.orderBy('takenAt').toArray(),
    db.sleepEntries.orderBy('date').toArray(),
    db.nightmareEntries.orderBy('occurredAt').toArray(),
    db.eveningCheckIns.orderBy('date').toArray(),
    db.journalEntries.orderBy('createdAt').toArray(),
    db.supportContacts.toArray(),
    db.treatmentProgress.get('progress'),
    db.treatmentSettings.get('treatment'),
    db.treatmentResponses.orderBy('updatedAt').toArray(),
    db.treatmentProgramPlans.orderBy('updatedAt').toArray(),
    db.treatmentActivities.orderBy('updatedAt').toArray(),
    db.treatmentSessions.orderBy('appointmentAt').toArray(),
    db.treatmentReviews.orderBy('reviewDate').toArray(),
    db.treatmentNightmares.orderBy('timestamp').toArray(),
    db.appSettings.get('app'),
  ])

  return {
    quotes,
    dailyQuoteState,
    quickCheckIns,
    benzodiazepineEntries,
    sleepEntries,
    nightmareEntries,
    eveningCheckIns,
    journalEntries,
    supportContacts,
    treatmentProgress: treatmentProgress ?? defaultTreatmentProgress(),
    treatmentSettings: {
      ...defaultTreatmentSettings(treatmentSettings?.createdAt),
      ...treatmentSettings,
    },
    treatmentResponses,
    treatmentProgramPlans,
    treatmentActivities,
    treatmentSessions,
    treatmentReviews,
    treatmentNightmares,
    appSettings: withDefaultSettings(appSettings),
  }
}

export const createExportBundle = async (): Promise<ExportBundle> => ({
  schemaVersion: 6,
  exportedAt: new Date().toISOString(),
  ...(await readAllData()),
})

export const importExportBundle = async (unknownBundle: unknown) => {
  const bundle = exportBundleSchema.parse(unknownBundle)

  await db.transaction(
    'rw',
    [
      db.quotes,
      db.dailyQuoteState,
      db.quickCheckIns,
      db.benzodiazepineEntries,
      db.sleepEntries,
      db.nightmareEntries,
      db.eveningCheckIns,
      db.journalEntries,
      db.supportContacts,
      db.treatmentProgress,
      db.treatmentSettings,
      db.treatmentResponses,
      db.treatmentProgramPlans,
      db.treatmentActivities,
      db.treatmentSessions,
      db.treatmentReviews,
      db.treatmentNightmares,
      db.appSettings,
    ],
    async () => {
      await Promise.all([
        db.quotes.clear(),
        db.dailyQuoteState.clear(),
        db.quickCheckIns.clear(),
        db.benzodiazepineEntries.clear(),
        db.sleepEntries.clear(),
        db.nightmareEntries.clear(),
        db.eveningCheckIns.clear(),
        db.journalEntries.clear(),
        db.supportContacts.clear(),
        db.treatmentProgress.clear(),
        db.treatmentSettings.clear(),
        db.treatmentResponses.clear(),
        db.treatmentProgramPlans.clear(),
        db.treatmentActivities.clear(),
        db.treatmentSessions.clear(),
        db.treatmentReviews.clear(),
        db.treatmentNightmares.clear(),
        db.appSettings.clear(),
      ])

      await Promise.all([
        db.quotes.bulkPut(bundle.quotes),
        db.dailyQuoteState.bulkPut(bundle.dailyQuoteState),
        db.quickCheckIns.bulkPut(bundle.quickCheckIns),
        db.benzodiazepineEntries.bulkPut(bundle.benzodiazepineEntries),
        db.sleepEntries.bulkPut(bundle.sleepEntries),
        db.nightmareEntries.bulkPut(bundle.nightmareEntries),
        db.eveningCheckIns.bulkPut(bundle.eveningCheckIns),
        db.journalEntries.bulkPut(bundle.journalEntries),
        db.supportContacts.bulkPut(bundle.supportContacts),
        db.treatmentProgress.put(bundle.treatmentProgress),
        db.treatmentSettings.put(bundle.treatmentSettings),
        db.treatmentResponses.bulkPut(bundle.treatmentResponses),
        db.treatmentProgramPlans.bulkPut(bundle.treatmentProgramPlans),
        db.treatmentActivities.bulkPut(bundle.treatmentActivities),
        db.treatmentSessions.bulkPut(bundle.treatmentSessions),
        db.treatmentReviews.bulkPut(bundle.treatmentReviews),
        db.treatmentNightmares.bulkPut(bundle.treatmentNightmares),
        db.appSettings.put(bundle.appSettings ?? defaultAppSettings),
      ])
    },
  )
}

export const deleteAllData = async () => {
  await db.transaction(
    'rw',
    [
      db.quotes,
      db.dailyQuoteState,
      db.quickCheckIns,
      db.benzodiazepineEntries,
      db.sleepEntries,
      db.nightmareEntries,
      db.eveningCheckIns,
      db.journalEntries,
      db.supportContacts,
      db.treatmentProgress,
      db.treatmentSettings,
      db.treatmentResponses,
      db.treatmentProgramPlans,
      db.treatmentActivities,
      db.treatmentSessions,
      db.treatmentReviews,
      db.treatmentNightmares,
      db.appSettings,
    ],
    async () => {
      await Promise.all([
        db.quotes.clear(),
        db.dailyQuoteState.clear(),
        db.quickCheckIns.clear(),
        db.benzodiazepineEntries.clear(),
        db.sleepEntries.clear(),
        db.nightmareEntries.clear(),
        db.eveningCheckIns.clear(),
        db.journalEntries.clear(),
        db.supportContacts.clear(),
        db.treatmentProgress.clear(),
        db.treatmentSettings.clear(),
        db.treatmentResponses.clear(),
        db.treatmentProgramPlans.clear(),
        db.treatmentActivities.clear(),
        db.treatmentSessions.clear(),
        db.treatmentReviews.clear(),
        db.treatmentNightmares.clear(),
        db.appSettings.clear(),
      ])
    },
  )

  await ensureSeedData()
}

export const deleteTreatmentData = async () => {
  await db.transaction(
    'rw',
    [
      db.treatmentProgress,
      db.treatmentSettings,
      db.treatmentResponses,
      db.treatmentProgramPlans,
      db.treatmentActivities,
      db.treatmentSessions,
      db.treatmentReviews,
      db.treatmentNightmares,
    ],
    async () => {
      await Promise.all([
        db.treatmentProgress.clear(),
        db.treatmentSettings.clear(),
        db.treatmentResponses.clear(),
        db.treatmentProgramPlans.clear(),
        db.treatmentActivities.clear(),
        db.treatmentSessions.clear(),
        db.treatmentReviews.clear(),
        db.treatmentNightmares.clear(),
      ])
    },
  )

  await Promise.all([
    db.treatmentProgress.put(defaultTreatmentProgress()),
    db.treatmentSettings.put(defaultTreatmentSettings()),
  ])
}
