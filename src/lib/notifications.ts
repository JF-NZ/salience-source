import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { localDateKey } from './dates'
import type {
  AppSettings,
  Quote,
  TreatmentProgramPlan,
  TreatmentSession,
  TreatmentSettings,
} from '../types'

const notificationIds = {
  quote: 1001,
  sleep: 1002,
  checkIn: 1003,
  morningCheckIn: 1004,
  treatmentActivity: 1005,
  treatmentAppointmentTfCbt: 1101,
  treatmentAppointmentCpt: 1102,
  treatmentAppointmentPe: 1103,
  treatmentAppointmentEmdr: 1104,
}

export const treatmentActivityNotificationCopy = {
  title: 'Salience',
  body: 'You have a Salience activity available.',
} as const

export const treatmentAppointmentNotificationCopy = {
  title: 'Salience',
  body: 'You have a Salience activity coming up.',
} as const

const treatmentAppointmentNotificationIds = {
  'tf-cbt': notificationIds.treatmentAppointmentTfCbt,
  cpt: notificationIds.treatmentAppointmentCpt,
  pe: notificationIds.treatmentAppointmentPe,
  emdr: notificationIds.treatmentAppointmentEmdr,
} as const

export const nextTreatmentAppointments = (
  plans: TreatmentProgramPlan[],
  sessions: TreatmentSession[],
  now = new Date(),
) => Object.fromEntries(
  (Object.keys(treatmentAppointmentNotificationIds) as Array<keyof typeof treatmentAppointmentNotificationIds>)
    .flatMap((programId) => {
      const candidates = [
        ...plans.flatMap((plan) =>
          plan.programId === programId && plan.nextAppointmentAt ? [plan.nextAppointmentAt] : []),
        ...sessions.flatMap((session) =>
          session.programId === programId && session.status === 'planned' ? [session.appointmentAt] : []),
      ].filter((value) => new Date(value) > now).sort()
      return candidates[0] ? [[programId, candidates[0]]] : []
    }),
) as Partial<Record<keyof typeof treatmentAppointmentNotificationIds, string>>

export const isNativeNotificationPlatform = () => Capacitor.isNativePlatform()

export const notificationSupported = () =>
  isNativeNotificationPlatform() || (typeof window !== 'undefined' && 'Notification' in window)

export const notificationPermission = () => {
  if (isNativeNotificationPlatform()) {
    return 'native'
  }

  if (!notificationSupported()) {
    return 'unsupported'
  }

  return Notification.permission
}

export interface ReminderCompletion {
  morningCheckIn?: boolean
  sleepEntry?: boolean
  eveningCheckIn?: boolean
}

export const requestNotificationPermission = async () => {
  if (isNativeNotificationPlatform()) {
    const permission = await LocalNotifications.requestPermissions()
    return permission.display
  }

  if (!notificationSupported()) {
    return 'unsupported'
  }

  return Notification.requestPermission()
}

export const dueReminderLabels = (settings: AppSettings, now = new Date(), completion: ReminderCompletion = {}) => {
  if (!settings.notificationsEnabled) {
    return []
  }

  const currentTime = now.toTimeString().slice(0, 5)
  const reminders: string[] = []

  if (settings.quoteReminderEnabled && currentTime >= settings.quoteReminderTime) {
    reminders.push('daily quote')
  }

  if (settings.morningCheckInReminderEnabled && !completion.morningCheckIn && currentTime >= settings.morningCheckInReminderTime) {
    reminders.push('morning check-in')
  }

  if (settings.sleepReminderEnabled && !completion.sleepEntry && currentTime >= settings.sleepReminderTime) {
    reminders.push('sleep entry')
  }

  if (settings.checkInReminderEnabled && !completion.eveningCheckIn && currentTime >= settings.checkInReminderTime) {
    reminders.push('evening check-in')
  }

  return reminders
}

export const shouldSendReminder = (settings: AppSettings, now = new Date(), completion: ReminderCompletion = {}) =>
  settings.notificationsEnabled &&
  settings.lastNotificationDate !== localDateKey(now) &&
  dueReminderLabels(settings, now, completion).length > 0

export const buildReminderBody = (settings: AppSettings, quote?: Quote, now = new Date(), completion: ReminderCompletion = {}) => {
  const labels = dueReminderLabels(settings, now, completion)
  const suffix = quote ? ` Today's quote: ${quote.text}` : ''
  return `No worries, want to do a 10-second check-in? ${labels.join(', ')}.${suffix}`
}

const nextDailyDate = (time: string, now = new Date(), skipToday = false) => {
  const [hours, minutes] = time.split(':').map(Number)
  const next = new Date(now)
  next.setHours(hours || 0, minutes || 0, 0, 0)

  if (next <= now || skipToday) {
    next.setDate(next.getDate() + 1)
  }

  return next
}

export const scheduleNativeReminderNotifications = async (
  settings: AppSettings,
  completion: ReminderCompletion = {},
  treatmentSettings?: Pick<
    TreatmentSettings,
    'activityReminderEnabled' | 'activityReminderTime' | 'appointmentReminderEnabled' | 'appointmentReminderLeadHours'
  >,
  treatmentProgramPlans: TreatmentProgramPlan[] = [],
  treatmentActivityCompletedToday = false,
  treatmentSessions: TreatmentSession[] = [],
) => {
  if (!isNativeNotificationPlatform()) {
    return false
  }

  await LocalNotifications.cancel({
    notifications: Object.values(notificationIds).map((id) => ({ id })),
  })

  if (!settings.notificationsEnabled) {
    return true
  }

  const notifications = []

  if (settings.quoteReminderEnabled) {
    notifications.push({
      id: notificationIds.quote,
      title: 'Salience quote',
      body: "Open Salience for today's grounding quote.",
      schedule: { at: nextDailyDate(settings.quoteReminderTime), repeats: true },
    })
  }

  if (settings.morningCheckInReminderEnabled) {
    notifications.push({
      id: notificationIds.morningCheckIn,
      title: 'Salience check-in',
      body: 'No worries, want to do a 10-second check-in?',
      schedule: { at: nextDailyDate(settings.morningCheckInReminderTime, new Date(), Boolean(completion.morningCheckIn)), repeats: true },
    })
  }

  if (settings.sleepReminderEnabled) {
    notifications.push({
      id: notificationIds.sleep,
      title: 'Salience sleep entry',
      body: 'A short sleep entry is enough.',
      schedule: { at: nextDailyDate(settings.sleepReminderTime, new Date(), Boolean(completion.sleepEntry)), repeats: true },
    })
  }

  if (settings.checkInReminderEnabled) {
    notifications.push({
      id: notificationIds.checkIn,
      title: 'Salience check-in',
      body: 'No worries, want to do a 10-second check-in?',
      schedule: { at: nextDailyDate(settings.checkInReminderTime, new Date(), Boolean(completion.eveningCheckIn)), repeats: true },
    })
  }

  if (treatmentSettings?.activityReminderEnabled) {
    notifications.push({
      id: notificationIds.treatmentActivity,
      ...treatmentActivityNotificationCopy,
      schedule: {
        at: nextDailyDate(
          treatmentSettings.activityReminderTime,
          new Date(),
          treatmentActivityCompletedToday,
        ),
        repeats: true,
      },
    })
  }

  if (treatmentSettings?.appointmentReminderEnabled) {
    const now = new Date()
    const nextAppointments = nextTreatmentAppointments(treatmentProgramPlans, treatmentSessions, now)
    for (const [programId, nextAppointmentAt] of Object.entries(nextAppointments) as Array<
      [keyof typeof treatmentAppointmentNotificationIds, string]
    >) {
      const reminderAt = new Date(nextAppointmentAt)
      reminderAt.setHours(reminderAt.getHours() - treatmentSettings.appointmentReminderLeadHours)
      if (reminderAt <= now) continue
      notifications.push({
        id: treatmentAppointmentNotificationIds[programId],
        ...treatmentAppointmentNotificationCopy,
        schedule: { at: reminderAt },
      })
    }
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications })
  }

  return true
}

export const sendReminderNotification = async (settings: AppSettings, quote?: Quote, now = new Date(), completion: ReminderCompletion = {}) => {
  if (isNativeNotificationPlatform()) {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Date.now() % 2147483647),
          title: 'Salience reminder',
          body: buildReminderBody(settings, quote, now, completion),
          schedule: { at: new Date(Date.now() + 1000) },
        },
      ],
    })

    return true
  }

  if (!notificationSupported() || Notification.permission !== 'granted') {
    return false
  }

  new Notification('Salience reminder', {
    body: buildReminderBody(settings, quote, now, completion),
    tag: 'salience-daily-reminder',
  })

  return true
}
