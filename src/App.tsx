import { lazy, Suspense, useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import {
  ArrowLeft,
  Bed,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileText,
  HeartPulse,
  HeartHandshake,
  Home,
  Library,
  LifeBuoy,
  LineChart,
  LocateFixed,
  Menu,
  Maximize2,
  Monitor,
  Moon,
  MoonStar,
  Pencil,
  Phone,
  Pill,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Sun,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
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
  quickCheckInLabels,
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
  type Option,
} from './data/options'
import {
  crisisTeamOptions,
  healthNzCrisisTeamsLastUpdated,
  healthNzCrisisTeamsSourceUrl,
} from './data/crisisTeams'
import { primaryNavigationItems, type PrimaryNavigationView } from './data/navigation'
import {
  completedDaysRange,
  dateTimeInputToIso,
  displayDate,
  displayDateTime,
  isoToDateTimeInput,
  localDateKey,
  localDateTimeInput,
  previousDateKey,
  rangeDateKeys,
  relativeDateTimeInputLabel,
  relativeDayLabel,
  checkInDatePhrase,
} from './lib/dates'
import { updateSalienceWidget } from './lib/androidWidget'
import { buildExportBundle, downloadJson, serializeExportBundle } from './lib/exportImport'
import { nearestCrisisTeam } from './lib/crisisTeams'
import {
  buildReminderBody,
  notificationPermission,
  notificationSupported,
  requestNotificationPermission,
  scheduleNativeReminderNotifications,
  sendReminderNotification,
  shouldSendReminder,
} from './lib/notifications'
import { chooseQuoteForDate, refreshDailyQuote, resolveDailyQuote } from './lib/quotes'
import { mergeJournalTags, splitJournalTags, suggestJournalTags } from './lib/journalTags'
import { fullDayLogForLastNight, reminderCompletionForData, sleepEntryForLastNight } from './lib/reminderCompletion'
import { createGenericNightmareEntry, sleepEntryHasNightmares } from './lib/sleepNightmares'
import { ClinicianReport } from './ClinicianReport'
import { MedicationUseChart, type MedicationUseChartConfig } from './MedicationUseChart'
import { WellbeingTrendsView } from './WellbeingTrends'
import { featureFlags } from './config/featureFlags'
import {
  entryMilligrams,
  formatMedicationTime,
  formatMilligrams,
  formatTabletAmount,
  hasWholeTabletMg,
  medicationForEntry,
} from './lib/medication'
import { toggleExclusiveNone, toggleValue } from './lib/selection'
import {
  defaultTreatmentProgress,
  defaultTreatmentSettings,
  hasTreatmentActivityToday,
} from './lib/treatment'
import { createExportBundle, db, deleteAllData, importExportBundle, readAllData } from './storage/db'
import type {
  AppData,
  AppSettings,
  BenzodiazepineEntry,
  BenzodiazepineMedication,
  BenzodiazepineQuarterUnits,
  EveningCheckIn,
  JournalEntry,
  NightmareEntry,
  NightmareAfterWaking,
  NightmareIntensity,
  NightmareWakeReaction,
  PsychosisSeverity,
  QuickCheckIn,
  QuickAnxiety,
  QuickDepression,
  QuickMood,
  QuickWarningSigns,
  Severity5,
  SleepDisruption,
  SleepDuration,
  SleepEntry,
  SleepQuality,
  SubstanceAmount,
  SubstanceHelped,
  SubstanceReason,
  SubstanceTiming,
  SubstanceType,
  SubstanceUseDetail,
  SupportContact,
  ThemePreference,
} from './types'

const TreatmentPage = lazy(() =>
  import('./TreatmentPage').then((module) => ({ default: module.TreatmentPage })))

type View = PrimaryNavigationView | 'quick' | 'notwell' | 'nightmare' | 'graph'
type TrendSeriesKey = 'sleep' | 'quality' | 'nightmares' | 'mood' | 'anxiety' | 'depression' | 'warning' | 'thinking' | 'substanceUse'
type NavigationIcon = (props: { className?: string }) => ReactNode

function ScoredTabletIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <circle cx="12" cy="12" r="8.75" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 4.5V19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

interface TrendSeriesDefinition {
  key: TrendSeriesKey
  label: string
  shortLabel: string
  color: string
  naturalMax: number
  format: (value: number) => string
}

const emptyData: AppData = {
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
  appSettings: {
    id: 'app',
    theme: 'SYSTEM',
    notificationsEnabled: false,
    hideSubstanceUseDetails: false,
    morningCheckInReminderEnabled: true,
    morningCheckInReminderTime: '09:00',
    checkInReminderEnabled: true,
    checkInReminderTime: '20:30',
    sleepReminderEnabled: false,
    sleepReminderTime: '21:30',
    quoteReminderEnabled: false,
    quoteReminderTime: '09:00',
    benzodiazepineMedication: 'CLONAZEPAM',
    benzodiazepineTabletMgByMedication: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
}

const disclaimer =
  'Salience is a private tracking tool. It does not provide medical advice, diagnosis, or treatment recommendations. Use this information to support conversations with qualified professionals.'

const {
  treatment: treatmentEnabled,
  substanceTracking: substanceTrackingEnabled,
  medication: medicationEnabled,
} = featureFlags

const navIcons: Record<PrimaryNavigationView, NavigationIcon> = {
  home: Home,
  sleep: Bed,
  medication: ScoredTabletIcon,
  checkin: ClipboardCheck,
  treatment: HeartHandshake,
  journal: BookOpen,
  quotes: Library,
  trends: LineChart,
  report: FileText,
  settings: Settings,
}

const navItems: Array<{ view: PrimaryNavigationView; label: string; icon: NavigationIcon }> =
  primaryNavigationItems
    .filter((item) => (treatmentEnabled || item.view !== 'treatment') && (medicationEnabled || item.view !== 'medication'))
    .map((item) => ({ ...item, icon: navIcons[item.view] }))

const uid = () => crypto.randomUUID()

const upsertTimestamp = (existing?: { createdAt: string }) => {
  const now = new Date().toISOString()
  return {
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

const durationScore: Record<SleepDuration, number> = {
  UNDER_2: 1,
  TWO_TO_FOUR: 3,
  FIVE_TO_SIX: 5.5,
  SEVEN_TO_EIGHT: 7.5,
  EIGHT_PLUS: 8.5,
}

const severityScore: Record<Severity5, number> = {
  NONE: 0,
  MILD: 1,
  MODERATE: 2,
  SEVERE: 3,
  EXTREME: 4,
}

const warningScore: Record<PsychosisSeverity, number> = {
  NOT_AT_ALL: 0,
  SLIGHTLY: 1,
  MODERATELY: 2,
  SIGNIFICANTLY: 3,
  EXTREMELY: 4,
}

const qualityScore: Record<SleepQuality, number> = {
  VERY_POOR: 1,
  POOR: 2,
  FAIR: 3,
  GOOD: 4,
  EXCELLENT: 5,
}

const quickMoodScore: Record<QuickMood, number> = {
  VERY_LOW: 1,
  LOW: 2,
  MEH: 3,
  OKAY: 4,
  GOOD: 5,
}

const quickAnxietyScore: Record<QuickAnxiety, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  EXTREME: 4,
}

const quickDepressionScore: Record<QuickDepression, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
}

const quickWarningScore: Record<QuickWarningSigns, number> = {
  NONE: 0,
  MILD: 1,
  CONCERNING: 3,
  URGENT: 4,
}

const trendSeriesDefinitions: TrendSeriesDefinition[] = [
  { key: 'sleep', label: 'Sleep last night', shortLabel: 'Sleep', color: '#0f766e', naturalMax: 9, format: (value) => value ? `${value.toFixed(1)} hrs` : 'No entry' },
  { key: 'quality', label: 'Sleep quality', shortLabel: 'Quality', color: '#2563eb', naturalMax: 5, format: (value) => value ? `${value}/5` : 'No entry' },
  { key: 'nightmares', label: 'Nightmares', shortLabel: 'Nightmares', color: '#dc5a45', naturalMax: 3, format: (value) => `${value} logged` },
  { key: 'mood', label: quickCheckInLabels.moodToday, shortLabel: 'Mood', color: '#7c3aed', naturalMax: 5, format: (value) => value ? `${value}/5` : 'No entry' },
  { key: 'anxiety', label: 'Anxiety', shortLabel: 'Anxiety', color: '#0284c7', naturalMax: 4, format: (value) => value ? `${value}/4` : 'No entry' },
  { key: 'depression', label: 'Depression', shortLabel: 'Depression', color: '#be123c', naturalMax: 4, format: (value) => value ? `${value}/4` : 'No entry' },
  { key: 'warning', label: 'Warning signs', shortLabel: 'Warning', color: '#b7791f', naturalMax: 4, format: (value) => value ? `${value}/4` : 'None noted' },
  { key: 'thinking', label: 'Thinking clarity', shortLabel: 'Thinking', color: '#15803d', naturalMax: 3, format: (value) => value ? `${value}/3` : 'Clear / no entry' },
  { key: 'substanceUse', label: 'Substance use', shortLabel: 'Substance', color: '#a21caf', naturalMax: 2, format: (value) => value ? `${value} check-in${value === 1 ? '' : 's'}` : 'None recorded' },
]

const trendSeriesByKey = Object.fromEntries(
  trendSeriesDefinitions.map((series) => [series.key, series]),
) as Record<TrendSeriesKey, TrendSeriesDefinition>

function App() {
  const [view, setView] = useState<View>('home')
  const [advancedMetric, setAdvancedMetric] = useState<TrendSeriesKey>('sleep')
  const [advancedReturnView, setAdvancedReturnView] = useState<View>('home')
  const [data, setData] = useState<AppData>(emptyData)
  const [isLoading, setIsLoading] = useState(true)
  const [supportOpen, setSupportOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [homeBanner, setHomeBanner] = useState('')
  const [treatmentEntry, setTreatmentEntry] = useState<'landing' | 'nightmare'>('landing')

  const reloadData = useCallback(async () => {
    setData(await readAllData())
    setIsLoading(false)
  }, [])

  const openView = useCallback((nextView: View) => {
    if ((nextView === 'treatment' && !treatmentEnabled) || (nextView === 'medication' && !medicationEnabled)) {
      return
    }
    if (nextView !== 'home') {
      setHomeBanner('')
    }
    setMobileMenuOpen(false)
    if (nextView === 'treatment') {
      setTreatmentEntry('landing')
    }
    setView(nextView)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  const openTreatmentNightmare = useCallback(() => {
    if (!treatmentEnabled) {
      return
    }
    setTreatmentEntry('nightmare')
    setView('treatment')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [])

  const openAdvancedGraph = useCallback((metric: TrendSeriesKey, returnView: View = 'home') => {
    if (metric === 'substanceUse' && !substanceTrackingEnabled) {
      return
    }
    setAdvancedMetric(metric)
    setAdvancedReturnView(returnView)
    setMobileMenuOpen(false)
    setView('graph')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const completeCheckIn = useCallback(async () => {
    await reloadData()
    setHomeBanner('Check in saved.')
    setView('home')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [reloadData])

  const completeQuickCheckIn = useCallback(async () => {
    await reloadData()
    setHomeBanner('Check-in saved.')
    setView('home')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [reloadData])

  useEffect(() => {
    void reloadData()
  }, [reloadData])

  useEffect(() => {
    const applyTheme = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const shouldUseDark = data.appSettings.theme === 'DARK' || (data.appSettings.theme === 'SYSTEM' && prefersDark)
      document.documentElement.classList.toggle('dark', shouldUseDark)
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    applyTheme()
    media.addEventListener('change', applyTheme)

    return () => media.removeEventListener('change', applyTheme)
  }, [data.appSettings.theme])

  useEffect(() => {
    const now = new Date()
    const completion = reminderCompletionForData(data, now)

    if (!shouldSendReminder(data.appSettings, now, completion) || notificationPermission() !== 'granted') {
      return
    }

    const today = localDateKey(now)
    const quote = resolveDailyQuote(data.quotes, data.dailyQuoteState.find((state) => state.date === today), today)

    void sendReminderNotification(data.appSettings, quote, now, completion).then((sent) => {
      if (sent) {
        return db.appSettings.put({
          ...data.appSettings,
          lastNotificationDate: today,
          updatedAt: new Date().toISOString(),
        }).then(reloadData)
      }
    })
  }, [data, reloadData])

  useEffect(() => {
    void scheduleNativeReminderNotifications(
      data.appSettings,
      reminderCompletionForData(data),
      treatmentEnabled ? data.treatmentSettings : undefined,
      treatmentEnabled ? data.treatmentProgramPlans : [],
      treatmentEnabled
        ? hasTreatmentActivityToday(
            data.treatmentResponses,
            data.treatmentReviews,
            data.treatmentSessions,
            new Date(),
            data.treatmentActivities,
          )
        : false,
      treatmentEnabled ? data.treatmentSessions : [],
    )
  }, [data])

  const page = useMemo(() => {
    if (isLoading) {
      return (
        <Card className="m-4">
          <p className="text-sm text-muted">Loading your local Salience data.</p>
        </Card>
      )
    }

    switch (view) {
      case 'home':
        return <HomePage data={data} banner={homeBanner} onDismissBanner={() => setHomeBanner('')} onView={openView} onOpenGraph={openAdvancedGraph} onChanged={reloadData} />
      case 'quick':
        return <QuickCheckInPage data={data} onSaved={reloadData} onComplete={completeQuickCheckIn} />
      case 'notwell':
        return <NotDoingWellPage data={data} onView={openView} />
      case 'sleep':
        return <SleepPage data={data} onSaved={reloadData} onNightmareSupport={treatmentEnabled ? openTreatmentNightmare : undefined} />
      case 'medication':
        if (!medicationEnabled) {
          return <HomePage data={data} banner={homeBanner} onDismissBanner={() => setHomeBanner('')} onView={openView} onOpenGraph={openAdvancedGraph} onChanged={reloadData} />
        }
        return <BenzodiazepinePage data={data} onSaved={reloadData} />
      case 'nightmare':
        return <NightmarePage data={data} onSaved={reloadData} onView={openView} />
      case 'checkin':
        return <CheckInPage data={data} onSaved={reloadData} onComplete={completeCheckIn} />
      case 'journal':
        return <JournalPage data={data} onSaved={reloadData} />
      case 'quotes':
        return <QuotesPage data={data} onChanged={reloadData} />
      case 'treatment':
        if (!treatmentEnabled) {
          return <HomePage data={data} banner={homeBanner} onDismissBanner={() => setHomeBanner('')} onView={openView} onOpenGraph={openAdvancedGraph} onChanged={reloadData} />
        }
        return (
          <Suspense fallback={<Card><p className="text-sm text-muted">Loading Treatment.</p></Card>}>
            <TreatmentPage key={treatmentEntry} data={data} initialScreen={treatmentEntry} onChanged={reloadData} onExit={() => openView('home')} />
          </Suspense>
        )
      case 'trends':
        return <TrendsPage data={data} />
      case 'graph':
        return <AdvancedGraphPage data={data} initialMetric={advancedMetric} onBack={() => openView(advancedReturnView)} />
      case 'report':
        return <ClinicianReport data={data} substanceTrackingEnabled={substanceTrackingEnabled} />
      case 'settings':
        return <SettingsPage data={data} onChanged={reloadData} onView={openView} />
      default:
        return null
    }
  }, [advancedMetric, advancedReturnView, completeCheckIn, completeQuickCheckIn, data, homeBanner, isLoading, openAdvancedGraph, openTreatmentNightmare, openView, reloadData, treatmentEntry, view])

  return (
    <div className="min-h-screen bg-[#f8faf9] text-ink dark:bg-slate-950 dark:text-slate-100">
      <div className="lg:flex">
        <DesktopRail activeView={view} onView={openView} />
        <div className="min-h-screen flex-1 pb-24 lg:pb-0">
          <MobileHeader onMenu={() => setMobileMenuOpen(true)} onSupport={() => setSupportOpen(true)} />
          <main className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
            <div className="hidden justify-end lg:flex">
              <HelpButton onClick={() => setSupportOpen(true)} />
            </div>
            {page}
          </main>
        </div>
      </div>
      <MobileNav activeView={view} onView={openView} />
      {mobileMenuOpen ? (
        <MobileMenuDrawer
          activeView={view}
          data={data}
          onClose={() => setMobileMenuOpen(false)}
          onView={openView}
        />
      ) : null}
      {supportOpen ? (
        <SupportModal contacts={data.supportContacts} onClose={() => setSupportOpen(false)} />
      ) : null}
    </div>
  )
}

function DesktopRail({ activeView, onView }: { activeView: View; onView: (view: View) => void }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-line bg-white px-5 py-8 dark:border-slate-800 dark:bg-slate-900 lg:block">
      <h1 className="font-display text-5xl text-calm">Salience</h1>
      <nav className="mt-10 space-y-2">
        {navItems.map((item) => (
          <NavButton
            key={item.view}
            active={activeView === item.view}
            icon={item.icon}
            label={item.label}
            onClick={() => onView(item.view)}
          />
        ))}
      </nav>
      <div className="absolute bottom-8 left-5 right-5 flex items-start gap-3 rounded-lg border border-line bg-slate-50 p-4 text-sm text-muted dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        <ShieldCheck className="mt-0.5 h-5 w-5 text-calm" />
        <p>Your data is private and stored in this browser.</p>
      </div>
    </aside>
  )
}

function MobileHeader({ onMenu, onSupport }: { onMenu: () => void; onSupport: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-line bg-white/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
      <button className="rounded-lg p-2 text-slate-700 dark:text-slate-200" type="button" aria-label="Open menu" onClick={onMenu}>
        <Menu className="h-7 w-7" />
      </button>
      <div className="font-display text-4xl font-semibold text-calm">Salience</div>
      <HelpButton onClick={onSupport} compact />
    </header>
  )
}

function MobileNav({ activeView, onView }: { activeView: View; onView: (view: View) => void }) {
  return (
    <nav className="no-scrollbar fixed bottom-0 left-0 right-0 z-40 flex overflow-x-auto border-t border-line bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
      {navItems.map((item) => {
        const Icon = item.icon
        const active = activeView === item.view
        return (
          <button
            key={item.view}
            type="button"
            onClick={() => onView(item.view)}
            className={`flex min-h-16 min-w-[4.75rem] flex-none flex-col items-center justify-center gap-1 rounded-lg px-0.5 text-[10px] font-semibold sm:text-[11px] ${
              active ? 'text-calm' : 'text-slate-600 dark:text-slate-300'
            }`}
            aria-label={`${item.label}${active ? ', selected' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className={`h-6 w-6 ${active ? 'fill-calm/10' : ''}`} />
            <span className="leading-none">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

function MobileMenuDrawer({
  activeView,
  data,
  onClose,
  onView,
}: {
  activeView: View
  data: AppData
  onClose: () => void
  onView: (view: View) => void
}) {
  const enabledReminders = [
    data.appSettings.morningCheckInReminderEnabled ? `Morning ${data.appSettings.morningCheckInReminderTime}` : '',
    data.appSettings.checkInReminderEnabled ? `Evening ${data.appSettings.checkInReminderTime}` : '',
    data.appSettings.sleepReminderEnabled ? `Sleep last night ${data.appSettings.sleepReminderTime}` : '',
    data.appSettings.quoteReminderEnabled ? `Quote ${data.appSettings.quoteReminderTime}` : '',
  ].filter(Boolean)

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile menu">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/40"
        onClick={onClose}
        aria-label="Close menu"
      />
      <aside className="absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] flex-col bg-white shadow-soft dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-line px-4 py-4 dark:border-slate-800">
          <div className="font-display text-4xl font-semibold text-calm">Salience</div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-600 dark:text-slate-300" aria-label="Close menu">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-4 py-4">
          <div className="rounded-lg border border-line bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Bell className="h-4 w-4 text-calm" />
              Reminder settings
            </div>
            <p className="mt-2 text-sm text-muted dark:text-slate-300">
              {data.appSettings.notificationsEnabled
                ? enabledReminders.length
                  ? enabledReminders.join(' / ')
                  : 'Notifications are on, but no reminder types are enabled.'
                : 'Notifications are off.'}
            </p>
            <button
              type="button"
              onClick={() => onView('settings')}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-calm px-3 py-2 text-sm font-bold text-white"
            >
              <Settings className="h-4 w-4" />
              Open settings
            </button>
          </div>

          <nav className="space-y-1" aria-label="Main navigation">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = activeView === item.view
              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => onView(item.view)}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-bold ${
                    active
                      ? 'bg-calm text-white'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>
      </aside>
    </div>
  )
}

function NavButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: NavigationIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-lg px-4 py-4 text-left text-base font-semibold transition ${
        active ? 'bg-calm/10 text-calm' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
      }`}
      aria-current={active ? 'page' : undefined}
      aria-label={`${label}${active ? ', selected' : ''}`}
    >
      <Icon className="h-6 w-6" />
      {label}
    </button>
  )
}

function HelpButton({ onClick, compact = false }: { onClick: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-calm px-3 py-2 font-semibold text-calm transition hover:bg-calm/10 ${
        compact ? 'min-h-11 text-sm dark:bg-slate-900' : 'min-h-12 bg-clay text-white border-clay hover:bg-clay/90'
      }`}
    >
      <Phone className="h-5 w-5" />
      Help Now
    </button>
  )
}

function HomePage({
  data,
  banner,
  onDismissBanner,
  onView,
  onOpenGraph,
  onChanged,
}: {
  data: AppData
  banner: string
  onDismissBanner: () => void
  onView: (view: View) => void
  onOpenGraph: (metric: TrendSeriesKey) => void
  onChanged: () => Promise<void>
}) {
  const today = localDateKey()
  const yesterday = previousDateKey()
  const todayQuoteState = data.dailyQuoteState.find((state) => state.date === today)
  const quote = resolveDailyQuote(data.quotes, todayQuoteState, today) ?? chooseQuoteForDate(data.quotes, today)
  const todayQuickCheckIn = [...data.quickCheckIns].reverse().find((entry) => entry.date === today)
  const lastNightSleep = sleepEntryForLastNight(data)
  const todayCheckIn = data.eveningCheckIns.find((entry) => entry.date === today && entry.status !== 'DRAFT')
  const lastNightNightmares = data.nightmareEntries.filter((entry) => localDateKey(new Date(entry.occurredAt)) === yesterday)
  const latestJournal = [...data.journalEntries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  const trends = buildTrendRows(data)
  const dayLogged = Boolean(todayQuickCheckIn || fullDayLogForLastNight(data))
  const sleepLogged = Boolean(lastNightSleep)
  const missingLogItems = useMemo(
    () => [
      dayLogged ? '' : 'complete a quick check-in',
      sleepLogged ? '' : "log last night's sleep",
    ].filter(Boolean),
    [dayLogged, sleepLogged],
  )

  const refreshQuote = async () => {
    const nextState = refreshDailyQuote(data.quotes, todayQuoteState, today)
    if (nextState) {
      await db.dailyQuoteState.put(nextState)
      await onChanged()
    }
  }

  useEffect(() => {
    const isUpToDate = missingLogItems.length === 0
    void updateSalienceWidget({
      quote: quote?.text,
      author: quote?.author,
      status: isUpToDate ? "You're up to date." : `Reminder: ${missingLogItems.join(' and ')}.`,
      upToDate: isUpToDate,
    })
  }, [missingLogItems, quote?.author, quote?.text])

  return (
    <div className="space-y-4 lg:space-y-6">
      {banner ? <TopBanner message={banner} onDismiss={onDismissBanner} /> : null}
      <QuoteStatusWidget missingItems={missingLogItems} onRefresh={refreshQuote} onView={onView} quote={quote} />
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ActionCard
          icon={HeartPulse}
          label="Quick Check-In"
          detail={todayQuickCheckIn ? 'Logged today · add another if things changed' : '10 seconds. No writing required.'}
          tone="teal"
          onClick={() => onView('quick')}
        />
        <ActionCard
          icon={LifeBuoy}
          label="I'm not doing well"
          detail="Grounding, support plan, and a short safety check."
          tone="amber"
          onClick={() => onView('notwell')}
        />
        <ActionCard
          icon={MoonStar}
          label="Log Nightmare"
          detail="Add a nightmare entry"
          tone="blue"
          onClick={() => onView('nightmare')}
        />
        <ActionCard
          icon={ClipboardCheck}
          label="Evening Check-In"
          detail="Complete your evening check-in"
          tone="green"
          onClick={() => onView('checkin')}
        />
        <ActionCard icon={BookOpen} label="Journal" detail="Write or reflect" tone="clay" onClick={() => onView('journal')} />
        <ActionCard icon={Bed} label="Sleep last night" detail="Log rest and disruptions" tone="night" onClick={() => onView('sleep')} />
      </section>
      <ReminderWidget settings={data.appSettings} onSettings={() => onView('settings')} />

      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Today</h2>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-calm">
            <CalendarDays className="h-4 w-4" />
            {new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <StatusRow
          icon={MoonStar}
          title="Nightmares"
          detail={lastNightNightmares.length ? `${lastNightNightmares.length} logged for yesterday` : 'No entries for yesterday'}
          badge={lastNightNightmares.length ? `${lastNightNightmares.length}` : 'No entry'}
          onClick={() => onView('nightmare')}
        />
        <StatusRow
          icon={ClipboardCheck}
          title="Evening Check-In"
          detail={todayCheckIn ? `${todayCheckIn.status === 'DRAFT' ? 'Draft saved' : 'Completed'}` : 'Not completed'}
          badge={todayCheckIn ? todayCheckIn.status ?? 'Complete' : 'To do'}
          onClick={() => onView('checkin')}
        />
        <StatusRow
          icon={Bed}
          title="Sleep last night"
          detail={lastNightSleep ? optionLabel(sleepDurationOptions, lastNightSleep.durationCategory) : 'No entry for yesterday'}
          badge={lastNightSleep ? optionLabel(sleepQualityOptions, lastNightSleep.quality) : 'No entry'}
          onClick={() => onView('sleep')}
        />
        <StatusRow
          icon={BookOpen}
          title="Journal"
          detail={latestJournal ? displayDateTime(latestJournal.createdAt) : 'No entries yet'}
          badge={latestJournal ? 'Latest' : 'No entry'}
          onClick={() => onView('journal')}
        />
      </Card>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TrendMiniCard title="Sleep last night" value={trends.sleepLabel} helper="weekly avg duration" data={trends.chartData} dataKey="sleep" onOpen={() => onOpenGraph('sleep')} />
        <TrendMiniCard title="Anxiety this week" value={trends.anxietyLabel} helper="avg severity" data={trends.chartData} dataKey="anxiety" onOpen={() => onOpenGraph('anxiety')} />
        <TrendMiniCard title="Depression this week" value={trends.depressionLabel} helper="avg severity" data={trends.chartData} dataKey="depression" onOpen={() => onOpenGraph('depression')} />
        <TrendMiniCard title="Warning signs this week" value={`${trends.warningDays} days`} helper="noted" data={trends.chartData} dataKey="warning" onOpen={() => onOpenGraph('warning')} />
      </section>

      <Card className="bg-[#fbf7ef] dark:bg-slate-900">
        <div className="grid gap-4 sm:grid-cols-2 sm:divide-x sm:divide-line dark:sm:divide-slate-700">
          <div className="flex gap-3">
            <ShieldCheck className="h-8 w-8 shrink-0 rounded-full bg-amber-100 p-1.5 text-amberSoft" />
            <div>
              <h3 className="font-bold">Patterns noticed</h3>
              <p className="text-sm text-muted">These summaries show patterns over time.</p>
            </div>
          </div>
          <div className="flex gap-3 sm:pl-4">
            <LifeBuoy className="h-8 w-8 shrink-0 rounded-full bg-teal-100 p-1.5 text-calm" />
            <div>
              <h3 className="font-bold">Signals to discuss with your psychiatrist</h3>
              <p className="text-sm text-muted">Use this information to support conversations with your psychiatrist.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function QuoteStatusWidget({
  missingItems,
  onRefresh,
  onView,
  quote,
}: {
  missingItems: string[]
  onRefresh: () => void
  onView: (view: View) => void
  quote?: { text: string; author: string; tags?: string[] }
}) {
  const isUpToDate = missingItems.length === 0
  const statusText = isUpToDate
    ? "You're up to date for today."
    : `Reminder: ${missingItems.join(' and ')}.`

  return (
    <Card className="overflow-hidden border-calm/20 bg-gradient-to-br from-teal-50 to-slate-50 p-3 dark:from-slate-900 dark:to-slate-800 sm:p-4">
      <div className="flex items-start gap-2.5">
        <div className="font-display text-4xl leading-none text-calm">"</div>
        <div className="min-w-0 flex-1">
          <div className={`mb-2 inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${
            isUpToDate
              ? 'bg-teal-100 text-calm dark:bg-teal-950 dark:text-teal-100'
              : 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100'
          }`}>
            {statusText}
          </div>
          <p className="text-base font-semibold leading-snug sm:text-lg">{quote?.text ?? 'No quote selected yet.'}</p>
          {quote?.author ? <p className="mt-2 text-sm font-semibold text-calm">- {quote.author}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {isUpToDate ? (
              <SecondaryButton onClick={() => onView('trends')} icon={LineChart}>
                View trends
              </SecondaryButton>
            ) : (
              <>
                {!missingItems.includes("log last night's sleep") ? null : (
                  <SecondaryButton onClick={() => onView('sleep')} icon={Bed}>
                    Log sleep last night
                  </SecondaryButton>
                )}
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-calm shadow-card dark:bg-slate-950"
          aria-label="Refresh quote"
        >
          <RefreshCw className="h-6 w-6" />
        </button>
      </div>
    </Card>
  )
}

function ReminderWidget({ settings, onSettings }: { settings: AppSettings; onSettings: () => void }) {
  const reminders = [
    settings.morningCheckInReminderEnabled ? { label: 'Morning', time: settings.morningCheckInReminderTime } : undefined,
    settings.checkInReminderEnabled ? { label: 'Evening', time: settings.checkInReminderTime } : undefined,
    settings.sleepReminderEnabled ? { label: 'Sleep last night', time: settings.sleepReminderTime } : undefined,
    settings.quoteReminderEnabled ? { label: 'Quote', time: settings.quoteReminderTime } : undefined,
  ].filter((item): item is { label: string; time: string } => Boolean(item))

  return (
    <Card className="space-y-4">
      <div className="flex items-start gap-3">
        <Bell className="h-10 w-10 shrink-0 rounded-full bg-teal-50 p-2 text-calm dark:bg-teal-950" />
        <div>
          <h2 className="text-xl font-bold">Reminder widget</h2>
          <p className="mt-1 text-sm text-muted dark:text-slate-300">
            {settings.notificationsEnabled
              ? reminders.length
                ? `${reminders.length} reminder${reminders.length === 1 ? '' : 's'} active.`
                : 'Notifications are enabled, but reminder types are off.'
              : 'Notifications are off.'}
          </p>
        </div>
      </div>
      <div className="grid gap-2">
        {reminders.length ? (
          reminders.map((reminder) => (
            <div key={reminder.label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
              <span className="font-bold">{reminder.label}</span>
              <span className="text-muted dark:text-slate-300">{reminder.time}</span>
            </div>
          ))
        ) : (
          <p className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-muted dark:bg-slate-800 dark:text-slate-300">
            Set morning, evening, sleep last night, and quote reminders from Settings.
          </p>
        )}
      </div>
      <SecondaryButton onClick={onSettings} icon={Settings}>
        Reminder settings
      </SecondaryButton>
    </Card>
  )
}

function QuickCheckInPage({ data, onSaved, onComplete }: { data: AppData; onSaved: () => Promise<void>; onComplete: () => Promise<void> }) {
  const [sleepDuration, setSleepDuration] = useState<SleepDuration>('FIVE_TO_SIX')
  const [mood, setMood] = useState<QuickMood>('MEH')
  const [anxiety, setAnxiety] = useState<QuickAnxiety>('MEDIUM')
  const [depression, setDepression] = useState<QuickDepression>('MEDIUM')
  const [warningSigns, setWarningSigns] = useState<QuickWarningSigns>('NONE')
  const [substanceUse, setSubstanceUse] = useState<'NONE' | 'YES'>('NONE')
  const [substances, setSubstances] = useState<SubstanceUseDetail[]>([])
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [happened, setHappened] = useState('')
  const [helped, setHelped] = useState('')
  const [unusual, setUnusual] = useState('')
  const [safetyOrWarning, setSafetyOrWarning] = useState('')
  const [substanceImpact, setSubstanceImpact] = useState('')
  const latestQuick = [...data.quickCheckIns].reverse()[0]
  const quickEntryDate = localDateKey()
  const existingSleepEntry = data.sleepEntries.find((entry) => entry.date === quickEntryDate)
  const existingEveningCheckIn = data.eveningCheckIns.find((entry) => entry.date === quickEntryDate)
  const existingWarningSigns = existingEveningCheckIn
    ? `Entry exists Suspiciousness: ${optionLabel(psychosisSeverityOptions, existingEveningCheckIn.suspiciousness)} · Unusual meanings: ${optionLabel(psychosisSeverityOptions, existingEveningCheckIn.unusualMeanings)}`
    : undefined

  const toggleSubstance = (substance: SubstanceType) => {
    setSubstances((current) =>
      current.some((item) => item.substance === substance)
        ? current.filter((item) => item.substance !== substance)
        : [...current, { id: uid(), substance }],
    )
  }

  const updateSubstance = <K extends keyof SubstanceUseDetail>(id: string, key: K, value: SubstanceUseDetail[K] | '') => {
    setSubstances((current) =>
      current.map((item) => (item.id === id ? { ...item, [key]: value || undefined } : item)),
    )
  }

  const submit = async () => {
    const now = new Date().toISOString()
    const entry: QuickCheckIn = {
      id: uid(),
      date: localDateKey(),
      createdAt: now,
      updatedAt: now,
      sleepDuration,
      mood,
      anxiety,
      depression,
      warningSigns,
      substanceUse: substanceTrackingEnabled ? substanceUse : 'NONE',
      substances: substanceTrackingEnabled && substanceUse === 'YES' ? substances : [],
    }

    await db.quickCheckIns.put(entry)
    setSavedEntryId(entry.id)
    await onSaved()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveDetails = async () => {
    if (!savedEntryId) {
      return
    }

    await db.quickCheckIns.update(savedEntryId, {
      details: {
        happened: happened.trim() || undefined,
        helped: helped.trim() || undefined,
        unusual: unusual.trim() || undefined,
        safetyOrWarning: safetyOrWarning.trim() || undefined,
        substanceImpact: substanceTrackingEnabled ? substanceImpact.trim() || undefined : undefined,
      },
      updatedAt: new Date().toISOString(),
    })
    await onComplete()
  }

  if (savedEntryId) {
    return (
      <Page title="Saved" subtitle="That is enough for today. Detail is optional.">
        <Card className="space-y-4">
          <SavedMessage>Quick check-in saved.</SavedMessage>
          {!detailsOpen ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <PrimaryButton onClick={() => setDetailsOpen(true)} icon={Plus}>
                Add detail
              </PrimaryButton>
              <SecondaryButton onClick={() => void onComplete()}>Skip</SecondaryButton>
            </div>
          ) : (
            <div className="space-y-4">
              <TextAreaField label="What happened?" value={happened} onChange={setHappened} placeholder="Optional." />
              <TextAreaField label="What helped?" value={helped} onChange={setHelped} placeholder="Optional." />
              <TextAreaField label="Anything unusual?" value={unusual} onChange={setUnusual} placeholder="Optional." />
              <TextAreaField
                label="Any paranoia, hidden meanings, sleep loss, anger, impulsive urges, or feeling unsafe?"
                value={safetyOrWarning}
                onChange={setSafetyOrWarning}
                placeholder="Optional."
              />
              {substanceTrackingEnabled ? (
                <TextAreaField
                  label="Did substance use affect mood, sleep, anxiety, or warning signs?"
                  value={substanceImpact}
                  onChange={setSubstanceImpact}
                  placeholder="Optional."
                />
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <PrimaryButton onClick={saveDetails} icon={Save}>
                  Save detail
                </PrimaryButton>
                <SecondaryButton onClick={() => void onComplete()}>Skip</SecondaryButton>
              </div>
            </div>
          )}
        </Card>
      </Page>
    )
  }

  return (
    <Page title="Quick Check-In" subtitle="Tap what fits. No text required.">
      <div className="space-y-4">
        {latestQuick ? (
          <div className="rounded-lg bg-teal-50 p-3 text-sm font-semibold text-calm dark:bg-teal-950 dark:text-teal-100">
            Last quick check-in: {displayDateTime(latestQuick.createdAt)}
          </div>
        ) : null}
        <Card className="space-y-5">
          <QuickChoiceGroup
            label={quickCheckInLabels.sleepLastNight}
            helper={existingSleepEntry ? `Entry exists ${optionLabel(sleepDurationOptions, existingSleepEntry.durationCategory)}` : undefined}
            options={sleepDurationOptions}
            value={sleepDuration}
            onChange={setSleepDuration}
          />
          <QuickChoiceGroup
            label={quickCheckInLabels.moodToday}
            helper={existingEveningCheckIn?.moodRating ? `Entry exists ${optionLabel(eveningMoodOptions, existingEveningCheckIn.moodRating)}` : undefined}
            options={quickMoodOptions}
            value={mood}
            onChange={setMood}
          />
          <QuickChoiceGroup
            label="Anxiety"
            helper={existingEveningCheckIn ? `Entry exists ${optionLabel(severityOptions, existingEveningCheckIn.anxietySeverity)}` : undefined}
            options={quickAnxietyOptions}
            value={anxiety}
            onChange={setAnxiety}
          />
          <QuickChoiceGroup
            label="Depression"
            helper={existingEveningCheckIn ? `Entry exists ${optionLabel(severityOptions, existingEveningCheckIn.depressionSeverity)}` : undefined}
            options={quickDepressionOptions}
            value={depression}
            onChange={setDepression}
          />
          <QuickChoiceGroup
            label="Warning signs"
            helper={existingWarningSigns}
            options={quickWarningSignOptions}
            value={warningSigns}
            onChange={setWarningSigns}
          />
          {substanceTrackingEnabled ? (
            <>
              <FieldBlock label="Substance use">
                <div className="grid grid-cols-2 gap-2">
                  <SegmentButton active={substanceUse === 'NONE'} onClick={() => setSubstanceUse('NONE')}>
                    None
                  </SegmentButton>
                  <SegmentButton active={substanceUse === 'YES'} onClick={() => setSubstanceUse('YES')}>
                    Yes
                  </SegmentButton>
                </div>
              </FieldBlock>
              {substanceUse === 'YES' ? (
                <div className="space-y-4 rounded-lg border border-line bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                  <CheckboxGroup
                    label="What did you use?"
                    options={substanceTypeOptions}
                    values={substances.map((item) => item.substance)}
                    onToggle={toggleSubstance}
                  />
                  {substances.map((item) => (
                    <SubstanceDetailEditor key={item.id} item={item} onChange={updateSubstance} />
                  ))}
                  <p className="text-xs font-semibold text-muted dark:text-slate-300">
                    Amount, timing, reason, and whether it helped are optional. Exact doses are not required.
                  </p>
                </div>
              ) : null}
            </>
          ) : null}
          <PrimaryButton onClick={submit} icon={CheckCircle2}>
            Submit
          </PrimaryButton>
        </Card>
      </div>
    </Page>
  )
}

function NotDoingWellPage({ data, onView }: { data: AppData; onView: (view: View) => void }) {
  const [moreSubstances, setMoreSubstances] = useState(false)
  const [lessSleep, setLessSleep] = useState(false)
  const [unusualCertainty, setUnusualCertainty] = useState(false)

  return (
    <Page title="I'm not doing well" subtitle="Short check. Use what helps.">
      <div className="space-y-4">
        <Card className="space-y-4 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <h2 className="text-xl font-bold text-amber-950 dark:text-amber-100">First, reduce the load</h2>
          <div className="grid gap-2">
            <GroundingStep number="1" text="Put both feet on the floor." />
            <GroundingStep number="2" text="Name five things you can see." />
            <GroundingStep number="3" text="Take one slow breath out." />
            <GroundingStep number="4" text="Text or call one support if you need backup." />
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-xl font-bold">Quick safety check</h2>
          {substanceTrackingEnabled ? (
            <SafetyQuestion label="Have you used more substances than usual today?" checked={moreSubstances} onChange={setMoreSubstances} />
          ) : null}
          <SafetyQuestion label="Have you slept less than usual?" checked={lessSleep} onChange={setLessSleep} />
          <SafetyQuestion
            label="Are you feeling unusually certain, threatened, watched, or like things have special meaning?"
            checked={unusualCertainty}
            onChange={setUnusualCertainty}
          />
          {moreSubstances || lessSleep || unusualCertainty ? (
            <div className="rounded-lg bg-teal-50 p-3 text-sm font-semibold text-calm dark:bg-teal-950 dark:text-teal-100">
              This is useful pattern data. Consider using your support plan and logging a quick check-in.
            </div>
          ) : null}
          <PrimaryButton onClick={() => onView('quick')} icon={HeartPulse}>
            Do a 10-second check-in
          </PrimaryButton>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-xl font-bold">Support plan</h2>
          <p className="text-sm text-muted dark:text-slate-300">
            If you feel at immediate risk or cannot stay safe, contact emergency services now. If you can, use one support below.
          </p>
          <div className="grid gap-3">
            {data.supportContacts.map((contact) => (
              <div key={contact.id} className="rounded-lg border border-line bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <div className="font-bold">{contact.name}</div>
                <div className="text-sm text-muted dark:text-slate-300">{contact.role}</div>
                {contact.phone ? (
                  <a href={`tel:${contact.phone}`} className="mt-2 inline-flex min-h-11 whitespace-nowrap items-center rounded-lg bg-calm px-3 text-sm font-bold text-white">
                    {contact.phone}
                  </a>
                ) : null}
                {contact.notes ? <p className="mt-2 text-sm text-muted dark:text-slate-300">{contact.notes}</p> : null}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Page>
  )
}

function SleepPage({ data, onSaved, onNightmareSupport }: { data: AppData; onSaved: () => Promise<void>; onNightmareSupport?: () => void }) {
  const [date, setDate] = useState(previousDateKey())
  const existing = data.sleepEntries.find((entry) => entry.date === date)
  const [durationCategory, setDurationCategory] = useState<SleepDuration>(existing?.durationCategory ?? 'FIVE_TO_SIX')
  const [quality, setQuality] = useState<SleepQuality>(existing?.quality ?? 'FAIR')
  const [disruptions, setDisruptions] = useState<SleepDisruption[]>(existing?.disruptions ?? [])
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [message, setMessage] = useState('')

  useEffect(() => {
    setDurationCategory(existing?.durationCategory ?? 'FIVE_TO_SIX')
    setQuality(existing?.quality ?? 'FAIR')
    setDisruptions(existing?.disruptions ?? [])
    setNotes(existing?.notes ?? '')
  }, [existing])

  const save = async () => {
    const timestamps = upsertTimestamp(existing)
    const entry: SleepEntry = {
      id: existing?.id ?? uid(),
      date,
      durationCategory,
      quality,
      disruptions,
      notes: notes.trim() || undefined,
      ...timestamps,
    }
    let nightmareEntryAdded = false
    await db.transaction('rw', [db.sleepEntries, db.nightmareEntries], async () => {
      await db.sleepEntries.put(entry)

      if (!sleepEntryHasNightmares(entry)) {
        return
      }

      const linkedNightmare = await db.nightmareEntries.where('sleepEntryId').equals(entry.id).first()
      if (!linkedNightmare) {
        await db.nightmareEntries.put(createGenericNightmareEntry(entry, uid(), timestamps.updatedAt))
        nightmareEntryAdded = true
      }
    })
    await onSaved()
    setMessage(nightmareEntryAdded ? 'Sleep entry saved. A nightmare entry was added to your Nightmare log.' : 'Sleep entry saved.')
  }

  const deleteSleep = async (entryId: string) => {
    if (!window.confirm('Remove this sleep entry?')) {
      return
    }

    await db.sleepEntries.delete(entryId)
    setMessage('Sleep entry removed.')
    await onSaved()
  }

  const recentSleepEntries = [...data.sleepEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)

  return (
    <Page title="Sleep last night" subtitle="Record last night's sleep, or choose a date when catching up on an entry.">
      <Card className="space-y-5">
        <DateField label="Entry date" value={date} onChange={setDate} showRelativeHint />
        {existing ? (
          <div className="rounded-lg border border-calm/30 bg-teal-50 p-3 text-sm font-semibold text-calm dark:border-teal-800 dark:bg-teal-950 dark:text-teal-100">
            Editing the sleep entry for this date.
          </div>
        ) : null}
        <SegmentedSelector label="How much sleep did you get last night?" options={sleepDurationOptions} value={durationCategory} onChange={setDurationCategory} />
        <SegmentedSelector label="How rested do you feel after that sleep?" options={sleepQualityOptions} value={quality} onChange={setQuality} />
        <CheckboxGroup
          label="Sleep disruption last night"
          options={sleepDisruptionOptions}
          values={disruptions}
          onToggle={(value) => setDisruptions(toggleExclusiveNone(disruptions, value, 'NONE'))}
        />
        {disruptions.includes('NIGHTMARES') ? (
          <p className="text-sm text-muted dark:text-slate-300">
            Saving this will add one editable entry to your Nightmare log.
          </p>
        ) : null}
        <TextAreaField label="Notes" value={notes} onChange={setNotes} placeholder="Add anything useful about last night's sleep. A few words is enough." />
        <PrimaryButton onClick={save} icon={Save}>
          {existing ? 'Update sleep entry' : 'Save sleep entry'}
        </PrimaryButton>
        {existing ? (
          <SecondaryButton onClick={() => void deleteSleep(existing.id)} icon={Trash2}>
            Remove this sleep entry
          </SecondaryButton>
        ) : null}
        {message ? <SavedMessage>{message}</SavedMessage> : null}
      </Card>
      {onNightmareSupport ? (
        <button
          type="button"
          onClick={onNightmareSupport}
          className="mt-4 flex min-h-20 w-full items-center gap-3 rounded-lg border border-line bg-white p-4 text-left shadow-card outline-none hover:border-calm focus:ring-2 focus:ring-calm/30 dark:border-slate-800 dark:bg-slate-900"
        >
          <MoonStar className="h-7 w-7 shrink-0 text-calm" />
          <span className="min-w-0 flex-1">
            <span className="block font-bold">Nightmare support</span>
            <span className="mt-1 block text-sm text-muted dark:text-slate-300">Ground first, create a recovery plan, or add an optional structured log.</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
        </button>
      ) : null}
      <Card className="mt-4 space-y-3">
        <h2 className="text-xl font-bold">Recent sleep entries</h2>
        {recentSleepEntries.length ? (
          recentSleepEntries.map((entry) => (
            <EntryRow
              key={entry.id}
              title={`${entry.date}${relativeDayLabel(entry.date) ? ` (${relativeDayLabel(entry.date)})` : ''}`}
              detail={`${optionLabel(sleepDurationOptions, entry.durationCategory)} - ${optionLabel(sleepQualityOptions, entry.quality)}`}
              onEdit={() => setDate(entry.date)}
              onDelete={() => void deleteSleep(entry.id)}
            />
          ))
        ) : (
          <p className="text-sm text-muted">No sleep entries yet.</p>
        )}
      </Card>
    </Page>
  )
}

type TabletMedicationConfig = MedicationUseChartConfig

const tabletMedicationConfigs: Record<BenzodiazepineMedication, TabletMedicationConfig> = {
  CLONAZEPAM: {
    id: 'CLONAZEPAM',
    label: 'Clonazepam',
    segmentCount: 4,
    filledColor: '#f97316',
    emptyColor: '#ffedd5',
    borderColor: '#f97316',
    dividerColor: '#c2410c',
  },
  BENZODIAZEPINE: {
    id: 'BENZODIAZEPINE',
    label: 'Benzodiazepine',
    segmentCount: 4,
    filledColor: '#ffffff',
    emptyColor: '#f1f5f9',
    borderColor: '#94a3b8',
    dividerColor: '#cbd5e1',
  },
  LORAZEPAM: {
    id: 'LORAZEPAM',
    label: 'Lorazepam',
    segmentCount: 2,
    filledColor: '#ffffff',
    emptyColor: '#e5e7eb',
    borderColor: '#64748b',
    dividerColor: '#94a3b8',
  },
  DIAZEPAM: {
    id: 'DIAZEPAM',
    label: 'Diazepam',
    segmentCount: 2,
    filledColor: '#fef3c7',
    emptyColor: '#ffffff',
    borderColor: '#d97706',
    dividerColor: '#f59e0b',
  },
}

const medicationOptions: Option<BenzodiazepineMedication>[] = Object.values(tabletMedicationConfigs).map((config) => ({
  value: config.id,
  label: config.label,
}))

const tabletSelection = (segmentCount: 2 | 4, selectedCount = 0) =>
  Array.from({ length: segmentCount }, (_, index) => index < selectedCount)

const tabletVisualSegmentPosition = (segmentCount: 2 | 4, index: number) => {
  if (segmentCount === 2) {
    return index === 0 ? 'inset-y-0 left-0 w-1/2' : 'inset-y-0 right-0 w-1/2'
  }

  return [
    'left-0 top-0 h-1/2 w-1/2',
    'right-0 top-0 h-1/2 w-1/2',
    'bottom-0 left-0 h-1/2 w-1/2',
    'bottom-0 right-0 h-1/2 w-1/2',
  ][index]
}

function TabletVisual({
  medication,
  units,
  size = 'small',
}: {
  medication: BenzodiazepineMedication
  units: number
  size?: 'small' | 'large'
}) {
  const config = tabletMedicationConfigs[medication]
  const clampedUnits = Math.max(0, Math.min(config.segmentCount, units))
  const dimensions = size === 'large' ? 'h-24 w-24' : 'h-10 w-10'

  return (
    <div
      aria-hidden="true"
      className={`${dimensions} relative shrink-0 overflow-hidden rounded-full border-4 shadow-sm`}
      style={{
        backgroundColor: config.emptyColor,
        borderColor: config.borderColor,
      }}
    >
      {Array.from({ length: config.segmentCount }, (_, index) => (
        <span
          key={index}
          className={`absolute ${tabletVisualSegmentPosition(config.segmentCount, index)}`}
          style={{ backgroundColor: index < clampedUnits ? config.filledColor : config.emptyColor }}
        />
      ))}
      {config.segmentCount === 4 ? (
        <>
          <span className="absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2" style={{ backgroundColor: config.dividerColor }} />
          <span className="absolute inset-x-0 top-1/2 z-10 h-px -translate-y-1/2" style={{ backgroundColor: config.dividerColor }} />
        </>
      ) : (
        <span className="absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2" style={{ backgroundColor: config.dividerColor }} />
      )}
    </div>
  )
}

const tabletSegmentAtPoint = (
  clientX: number,
  clientY: number,
  rect: DOMRect,
  segmentCount: 2 | 4,
) => {
  const x = clientX - rect.left
  const y = clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  const radius = Math.min(rect.width, rect.height) / 2
  const distanceFromCenter = Math.hypot(x - centerX, y - centerY)

  if (distanceFromCenter > radius || x < 0 || y < 0 || x > rect.width || y > rect.height) {
    return null
  }

  if (segmentCount === 2) {
    return x < centerX ? 0 : 1
  }
  if (x < centerX && y < centerY) {
    return 0
  }
  if (x >= centerX && y < centerY) {
    return 1
  }
  if (x < centerX && y >= centerY) {
    return 2
  }
  return 3
}

function DailyTabletSummary({ entries }: { entries: BenzodiazepineEntry[] }) {
  const summaries = Object.values(tabletMedicationConfigs).map((config) => {
    const medicationEntries = entries
      .filter((entry) => medicationForEntry(entry) === config.id)
      .sort((left, right) => left.takenAt.localeCompare(right.takenAt))
    const units = medicationEntries.reduce((total, entry) => total + entry.quarterUnits, 0)
    const milligrams = medicationEntries.map((entry) => entryMilligrams(entry, config.segmentCount))

    return {
      config,
      entries: medicationEntries,
      units,
      totalMilligrams: milligrams.length && milligrams.every((value) => value !== undefined)
        ? milligrams.reduce((total, value) => total + (value ?? 0), 0)
        : undefined,
    }
  })
  const recordedSummaries = summaries.filter((summary) => summary.entries.length > 0)

  return (
    <Card className="w-full max-w-sm space-y-3 border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/40">
      <div>
        <h2 className="font-bold text-orange-950 dark:text-orange-100">Taken today</h2>
        {recordedSummaries.length ? (
          <div className="mt-3 space-y-3">
            {recordedSummaries.map(({ config, entries: medicationEntries, units, totalMilligrams }) => {
              return (
                <div key={config.id} className="space-y-3">
                  <div>
                    <p className="text-sm font-bold text-orange-950 dark:text-orange-100">{config.label}</p>
                    <p className="mt-1 text-sm font-semibold text-orange-800 dark:text-orange-200">
                      {formatTabletAmount(units, config.segmentCount)}{totalMilligrams === undefined ? '' : ` - ${formatMilligrams(totalMilligrams)}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-3" role="list" aria-label={`${config.label} doses taken today`}>
                    {medicationEntries.map((entry) => {
                      const milligrams = entryMilligrams(entry, config.segmentCount)
                      const amount = formatTabletAmount(entry.quarterUnits, config.segmentCount)
                      return (
                        <div
                          key={entry.id}
                          role="listitem"
                          className="flex w-12 flex-col items-center gap-1 text-center"
                          aria-label={`${config.label}: ${amount}${milligrams === undefined ? '' : `, ${formatMilligrams(milligrams)}`} at ${formatMedicationTime(entry.takenAt)}`}
                        >
                          <TabletVisual medication={config.id} units={entry.quarterUnits} />
                          <span className="whitespace-nowrap text-[11px] font-semibold leading-none text-orange-800 dark:text-orange-200">
                            {formatMedicationTime(entry.takenAt)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">None recorded</p>
            <TabletVisual medication="CLONAZEPAM" units={0} />
          </div>
        )}
      </div>
      <p className="text-xs text-orange-800/80 dark:text-orange-200/80">A visual record of the tablet portions you logged today.</p>
    </Card>
  )
}

function BenzodiazepinePage({ data, onSaved }: { data: AppData; onSaved: () => Promise<void> }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const editing = data.benzodiazepineEntries.find((entry) => entry.id === editingId)
  const configuredMedication = data.appSettings.benzodiazepineMedication
  const medication = editing ? medicationForEntry(editing) : configuredMedication
  const medicationConfig = tabletMedicationConfigs[medication]
  const configuredWholeTabletMg = data.appSettings.benzodiazepineTabletMgByMedication[medication]
  const entryWholeTabletMg = editing ? editing.wholeTabletMg : configuredWholeTabletMg
  const [takenAt, setTakenAt] = useState(localDateTimeInput(new Date(), 15))
  const [selectedSegments, setSelectedSegments] = useState(() => tabletSelection(medicationConfig.segmentCount))
  const [message, setMessage] = useState('')
  const [showOlderMedicationEntries, setShowOlderMedicationEntries] = useState(false)
  const tabletRef = useRef<HTMLDivElement>(null)
  const timestampManuallyEditedRef = useRef(false)
  const selectedSegmentsRef = useRef(selectedSegments)
  const gestureActiveRef = useRef(false)
  const gestureStartIndexRef = useRef<number | null>(null)
  const gestureStartSelectedRef = useRef(false)
  const gestureMovedRef = useRef(false)
  const gestureVisitedRef = useRef<Set<number>>(new Set())
  const suppressPointerClickRef = useRef(false)
  const selectedSegmentCount = selectedSegments.filter(Boolean).length
  const todayEntries = data.benzodiazepineEntries.filter((entry) => entry.date === localDateKey())

  useEffect(() => {
    if (editing) {
      const editingConfig = tabletMedicationConfigs[medicationForEntry(editing)]
      setTakenAt(isoToDateTimeInput(editing.takenAt, 15))
      setSelectedSegments(tabletSelection(editingConfig.segmentCount, editing.quarterUnits))
      timestampManuallyEditedRef.current = false
      return
    }
    timestampManuallyEditedRef.current = false
    setSelectedSegments(tabletSelection(medicationConfig.segmentCount))
  }, [editing, medication, medicationConfig.segmentCount])

  useEffect(() => {
    const refreshAutoTimestamp = () => {
      if (!editing && !timestampManuallyEditedRef.current) {
        setTakenAt(localDateTimeInput(new Date(), 15))
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAutoTimestamp()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', refreshAutoTimestamp)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', refreshAutoTimestamp)
    }
  }, [editing])

  useEffect(() => {
    selectedSegmentsRef.current = selectedSegments
  }, [selectedSegments])

  const resetForm = () => {
    setEditingId(null)
    setTakenAt(localDateTimeInput(new Date(), 15))
    timestampManuallyEditedRef.current = false
    setSelectedSegments(tabletSelection(tabletMedicationConfigs[configuredMedication].segmentCount))
    setMessage('')
  }

  const updateTakenAt = (value: string) => {
    timestampManuallyEditedRef.current = true
    setTakenAt(value)
  }

  const setSegment = (index: number, selected: boolean) => {
    setSelectedSegments((current) => {
      if (current[index] === selected) {
        return current
      }
      const next = current.map((value, segmentIndex) => segmentIndex === index ? selected : value)
      selectedSegmentsRef.current = next
      return next
    })
    setMessage('')
  }

  const toggleSegment = (index: number) => {
    setSegment(index, !selectedSegmentsRef.current[index])
  }

  const segmentAtPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = tabletRef.current?.getBoundingClientRect()
    return rect ? tabletSegmentAtPoint(event.clientX, event.clientY, rect, medicationConfig.segmentCount) : null
  }

  const handleTabletPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }

    const index = segmentAtPointer(event)
    if (index === null) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    gestureActiveRef.current = true
    gestureStartIndexRef.current = index
    gestureStartSelectedRef.current = selectedSegmentsRef.current[index]
    gestureMovedRef.current = false
    gestureVisitedRef.current = new Set()
  }

  const handleTabletPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!gestureActiveRef.current || gestureStartIndexRef.current === null) {
      return
    }

    const index = segmentAtPointer(event)
    if (index === null || index === gestureStartIndexRef.current || gestureVisitedRef.current.has(index)) {
      return
    }

    const shouldSelect = !gestureStartSelectedRef.current
    gestureMovedRef.current = true
    if (!gestureVisitedRef.current.has(gestureStartIndexRef.current)) {
      gestureVisitedRef.current.add(gestureStartIndexRef.current)
      setSegment(gestureStartIndexRef.current, shouldSelect)
    }
    gestureVisitedRef.current.add(index)
    setSegment(index, shouldSelect)
  }

  const endTabletGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const wasDragged = gestureMovedRef.current
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (wasDragged) {
      suppressPointerClickRef.current = true
      window.setTimeout(() => {
        suppressPointerClickRef.current = false
      }, 0)
    }
    gestureActiveRef.current = false
    gestureStartIndexRef.current = null
    gestureStartSelectedRef.current = false
    gestureMovedRef.current = false
    gestureVisitedRef.current.clear()
  }

  const save = async () => {
    if (selectedSegmentCount === 0) {
      setMessage('Choose at least one section of the tablet.')
      return
    }

    const takenIso = dateTimeInputToIso(takenAt)
    const takenDate = new Date(takenIso)
    if (Number.isNaN(takenDate.getTime())) {
      setMessage('Choose a valid date and time.')
      return
    }

    const now = new Date().toISOString()
    const entry: BenzodiazepineEntry = {
      id: editing?.id ?? uid(),
      takenAt: takenIso,
      date: localDateKey(takenDate),
      medication,
      quarterUnits: selectedSegmentCount as BenzodiazepineQuarterUnits,
      wholeTabletMg: entryWholeTabletMg,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    }

    await db.benzodiazepineEntries.put(entry)
    setEditingId(null)
    setTakenAt(localDateTimeInput(new Date(), 15))
    timestampManuallyEditedRef.current = false
    setSelectedSegments(tabletSelection(medicationConfig.segmentCount))
    setMessage(editing ? 'Medication entry updated.' : 'Medication entry saved.')
    await onSaved()
  }

  const remove = async (entryId: string) => {
    if (!window.confirm('Remove this medication entry?')) {
      return
    }

    await db.benzodiazepineEntries.delete(entryId)
    if (editingId === entryId) {
      resetForm()
    }
    setMessage('Medication entry removed.')
    await onSaved()
  }

  const medicationEntriesByNewest = [...data.benzodiazepineEntries]
    .sort((a, b) => b.takenAt.localeCompare(a.takenAt))
  const todayMedicationEntries = medicationEntriesByNewest.filter((entry) => entry.date === localDateKey())
  const hasOlderMedicationEntries = medicationEntriesByNewest.some((entry) => entry.date !== localDateKey())
  const recentEntries = showOlderMedicationEntries ? medicationEntriesByNewest : todayMedicationEntries

  const segmentPosition = (index: number) => {
    if (medicationConfig.segmentCount === 2) {
      return index === 0
        ? 'bottom-0 left-0 top-0 w-1/2 rounded-l-full border-r'
        : 'bottom-0 right-0 top-0 w-1/2 rounded-r-full border-l'
    }

    return [
      'left-0 top-0 h-1/2 w-1/2 rounded-tl-full border-b border-r',
      'right-0 top-0 h-1/2 w-1/2 rounded-tr-full border-b border-l',
      'bottom-0 left-0 h-1/2 w-1/2 rounded-bl-full border-r border-t',
      'bottom-0 right-0 h-1/2 w-1/2 rounded-br-full border-l border-t',
    ][index]
  }
  const segmentLabel = (index: number) => medicationConfig.segmentCount === 2
    ? `${index + 1}/2 tablet half`
    : `${index + 1}/4 tablet quarter`
  const selectedMilligrams = selectedSegmentCount > 0 && hasWholeTabletMg(entryWholeTabletMg)
    ? entryWholeTabletMg * selectedSegmentCount / medicationConfig.segmentCount
    : undefined

  return (
    <Page title="Medication" subtitle={`Record ${medicationConfig.label.toLowerCase()} tablet portions without entering an exact dose.`}>
      <Card className="space-y-5">
        {editing ? (
          <div className="rounded-lg border border-orange-300 bg-orange-50 p-3 text-sm font-semibold text-orange-950 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-100">
            Editing the medication entry from {displayDateTime(editing.takenAt)}.
          </div>
        ) : null}
        <DateTimeField
          label="When did you take it?"
          helper="This starts at the current time rounded to a 15-minute block. Change it when you are catching up on an entry."
          value={takenAt}
          onChange={updateTakenAt}
          minuteStep={15}
          showRelativeHint
          todayLabel="today"
        />
        <FieldBlock label="How much did you take?" helper={`Select one or more ${medicationConfig.segmentCount === 2 ? 'halves' : 'quarters'}. Exact tablet strength is not required.`}>
          <div
            ref={tabletRef}
            className="relative mx-auto aspect-square w-full max-w-xs touch-none select-none overflow-hidden rounded-full border-8 bg-slate-100 shadow-card dark:bg-slate-900"
            style={{ borderColor: medicationConfig.borderColor }}
            role="group"
            aria-label={medicationConfig.segmentCount === 4 ? 'Select tablet quarters' : `Select ${medicationConfig.label} tablet portions`}
            aria-describedby="tablet-gesture-help"
            onPointerDown={handleTabletPointerDown}
            onPointerMove={handleTabletPointerMove}
            onPointerUp={endTabletGesture}
            onPointerCancel={endTabletGesture}
          >
            {selectedSegments.map((selected, index) => (
              <button
                key={index}
                type="button"
                aria-label={segmentLabel(index)}
                aria-pressed={selected}
                onClick={() => {
                  if (suppressPointerClickRef.current) {
                    suppressPointerClickRef.current = false
                    return
                  }
                  toggleSegment(index)
                }}
                className={`absolute z-0 transition focus:outline-none focus:ring-4 focus:ring-slate-900/35 dark:focus:ring-white/50 ${segmentPosition(index)}`}
                style={{
                  backgroundColor: selected ? medicationConfig.filledColor : medicationConfig.emptyColor,
                  borderColor: medicationConfig.dividerColor,
                }}
              />
            ))}
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center text-center">
              <div className="whitespace-nowrap rounded-full bg-slate-950/90 px-4 py-3 text-base font-bold text-white shadow-lg sm:text-lg">
                {formatTabletAmount(selectedSegmentCount, medicationConfig.segmentCount)}
              </div>
            </div>
          </div>
          <p id="tablet-gesture-help" className="mt-3 text-center text-sm font-semibold text-muted dark:text-slate-300">
            Tap a section, or press and swipe across the tablet to add or remove several at once.
          </p>
          {selectedMilligrams === undefined ? null : (
            <p className="mt-2 text-center text-sm font-semibold text-calm dark:text-teal-200">
              Recorded amount: {formatMilligrams(selectedMilligrams)}
            </p>
          )}
        </FieldBlock>
        <div className="grid gap-3 sm:grid-cols-2">
          <PrimaryButton onClick={save} icon={Pill}>
            {editing ? 'Update medication entry' : 'Save medication entry'}
          </PrimaryButton>
          {editing ? <SecondaryButton onClick={resetForm} icon={X}>Cancel edit</SecondaryButton> : null}
        </div>
        {message ? <SavedMessage>{message}</SavedMessage> : null}
      </Card>

      <div className="mt-4 flex justify-end">
        <DailyTabletSummary entries={todayEntries} />
      </div>

      <MedicationUseChart
        entries={data.benzodiazepineEntries}
        medicationConfigs={Object.values(tabletMedicationConfigs)}
      />

      <Card className="mt-4 space-y-3">
        <h2 className="text-xl font-bold">Recent medication entries</h2>
        {recentEntries.length ? (
          recentEntries.map((entry) => {
            const entryConfig = tabletMedicationConfigs[medicationForEntry(entry)]
            return (
              <EntryRow
                key={entry.id}
                title={displayDateTime(entry.takenAt)}
                detail={`${entryConfig.label} - ${formatTabletAmount(entry.quarterUnits, entryConfig.segmentCount)}${entryMilligrams(entry, entryConfig.segmentCount) === undefined ? '' : ` (${formatMilligrams(entryMilligrams(entry, entryConfig.segmentCount)!)})`}${relativeDayLabel(entry.date) ? ` - ${entry.date} (${relativeDayLabel(entry.date)})` : ` - ${entry.date}`}`}
                onEdit={() => {
                  setEditingId(entry.id)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                onDelete={() => void remove(entry.id)}
              />
            )
          })
        ) : (
          <p className="text-sm text-muted">
            {data.benzodiazepineEntries.length ? 'No medication entries for today.' : 'No medication entries yet.'}
          </p>
        )}
        {hasOlderMedicationEntries ? (
          <SecondaryButton onClick={() => setShowOlderMedicationEntries((current) => !current)}>
            {showOlderMedicationEntries ? 'Show fewer dates' : 'Show more dates'}
          </SecondaryButton>
        ) : null}
      </Card>
    </Page>
  )
}

function NightmarePage({
  data,
  onSaved,
  onView,
}: {
  data: AppData
  onSaved: () => Promise<void>
  onView: (view: View) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const editing = data.nightmareEntries.find((entry) => entry.id === editingId)
  const [occurredAt, setOccurredAt] = useState(localDateTimeInput())
  const [intensity, setIntensity] = useState<NightmareIntensity>('MODERATE')
  const [wakeReactions, setWakeReactions] = useState<NightmareWakeReaction[]>([])
  const [description, setDescription] = useState('')
  const [afterWaking, setAfterWaking] = useState<NightmareAfterWaking[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setOccurredAt(editing ? isoToDateTimeInput(editing.occurredAt) : localDateTimeInput())
    setIntensity(editing?.intensity ?? 'MODERATE')
    setWakeReactions(editing?.wakeReactions ?? [])
    setDescription(editing?.description ?? '')
    setAfterWaking(editing?.afterWaking ?? [])
    setSaved(false)
  }, [editing])

  const resetForm = () => {
    setEditingId(null)
    setOccurredAt(localDateTimeInput())
    setIntensity('MODERATE')
    setWakeReactions([])
    setDescription('')
    setAfterWaking([])
    setSaved(false)
  }

  const save = async () => {
    const now = new Date().toISOString()
    const entry: NightmareEntry = {
      id: editing?.id ?? uid(),
      occurredAt: new Date(occurredAt).toISOString(),
      sleepEntryId: editing?.sleepEntryId,
      intensity,
      wakeReactions,
      description: description.trim() || undefined,
      afterWaking,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    }
    await db.nightmareEntries.put(entry)
    setSaved(true)
    setEditingId(null)
    await onSaved()
  }

  const deleteNightmare = async (entryId: string) => {
    if (!window.confirm('Remove this nightmare entry?')) {
      return
    }

    await db.nightmareEntries.delete(entryId)
    if (editingId === entryId) {
      resetForm()
    }
    await onSaved()
  }

  const recentNightmares = [...data.nightmareEntries].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 10)

  return (
    <Page title="Log Nightmare" subtitle="A quick entry is enough. You can add detail later.">
      <Card className="space-y-5">
        {saved ? (
          <div className="rounded-lg bg-teal-50 p-4">
            <p className="font-bold text-calm">{editing ? 'Updated.' : 'Logged.'} You do not need to analyse it right now.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <SecondaryButton onClick={() => onView('home')}>Back to home</SecondaryButton>
              <SecondaryButton onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>Open grounding</SecondaryButton>
              <SecondaryButton onClick={resetForm}>Add another</SecondaryButton>
            </div>
          </div>
        ) : null}
        {editing ? (
          <div className="rounded-lg border border-calm/30 bg-teal-50 p-3 text-sm font-semibold text-calm dark:border-teal-800 dark:bg-teal-950 dark:text-teal-100">
            Editing nightmare entry from {displayDateTime(editing.occurredAt)}.
          </div>
        ) : null}
        {editing?.sleepEntryId ? (
          <div className="rounded-lg border border-line bg-slate-50 p-3 text-sm text-muted dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            This generic nightmare entry was added from your sleep entry. You can update the details here.
          </div>
        ) : null}
        <DateTimeField
          label="When did the nightmare happen?"
          helper={editing?.sleepEntryId
            ? 'This was added from a sleep entry, so the time is approximate. Change it if you know a better time.'
            : 'Use now if you just woke from it. Salience will mark this as tonight or yesterday when relevant.'}
          value={occurredAt}
          onChange={setOccurredAt}
          showRelativeHint
          todayLabel="tonight"
        />
        <SegmentedSelector label="Intensity" options={nightmareIntensityOptions} value={intensity} onChange={setIntensity} />
        <CheckboxGroup label="How did you wake up?" options={nightmareWakeOptions} values={wakeReactions} onToggle={(value) => setWakeReactions(toggleValue(wakeReactions, value))} />
        <TextAreaField
          label="What do you remember?"
          value={description}
          onChange={setDescription}
          placeholder="Write anything you remember. Fragments are enough."
        />
        <div className="rounded-lg border border-dashed border-line bg-slate-50 p-4 text-sm text-muted">
          <div className="font-semibold text-ink">Voice note slot</div>
          <p>Local voice notes can be added later. Nothing is recorded here.</p>
        </div>
        <CheckboxGroup label="After waking" options={nightmareAfterOptions} values={afterWaking} onToggle={(value) => setAfterWaking(toggleValue(afterWaking, value))} />
        <PrimaryButton onClick={save} icon={Save}>
          {editing ? 'Update nightmare entry' : 'Save nightmare entry'}
        </PrimaryButton>
        {editing ? (
          <SecondaryButton onClick={resetForm} icon={X}>
            Cancel edit
          </SecondaryButton>
        ) : null}
      </Card>
      <Card className="mt-4 bg-[#fbf7ef]">
        <h3 className="font-bold">Grounding</h3>
        <p className="mt-1 text-sm text-muted">Notice five things you can see, four things you can feel, and one slow breath you can take now.</p>
      </Card>
      <Card className="mt-4 space-y-3">
        <h2 className="text-xl font-bold">Recent nightmare entries</h2>
        {recentNightmares.length ? (
          recentNightmares.map((entry) => (
            <EntryRow
              key={entry.id}
              title={entry.sleepEntryId ? `${displayDate(localDateKey(new Date(entry.occurredAt)))} · From sleep entry` : displayDateTime(entry.occurredAt)}
              detail={`${entry.intensity.toLowerCase()} intensity${entry.description ? ` - ${entry.description}` : ''}`}
              onEdit={() => setEditingId(entry.id)}
              onDelete={() => void deleteNightmare(entry.id)}
            />
          ))
        ) : (
          <p className="text-sm text-muted">No nightmare entries yet.</p>
        )}
      </Card>
    </Page>
  )
}

function CheckInPage({
  data,
  onSaved,
  onComplete,
}: {
  data: AppData
  onSaved: () => Promise<void>
  onComplete: () => Promise<void>
}) {
  const [date, setDate] = useState(localDateKey())
  const existing = data.eveningCheckIns.find((entry) => entry.date === date)
  const [form, setForm] = useState(() => makeCheckInForm(existing))
  const [message, setMessage] = useState('')

  useEffect(() => {
    setForm(makeCheckInForm(existing))
  }, [existing])

  const update = <K extends keyof EveningCheckIn>(key: K, value: EveningCheckIn[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const save = async (status: 'DRAFT' | 'COMPLETE') => {
    const existingForDate = await db.eveningCheckIns.where('date').equals(date).first()
    const entryToUpdate = existingForDate ?? existing
    const timestamps = upsertTimestamp(entryToUpdate)
    await db.eveningCheckIns.put({
      ...form,
      id: entryToUpdate?.id ?? form.id,
      date,
      status,
      ...timestamps,
    })
    if (status === 'COMPLETE') {
      await onComplete()
      return
    }

    setMessage(entryToUpdate ? 'Draft updated for this date.' : 'Draft saved.')
    await onSaved()
  }

  const deleteCheckIn = async (entryId: string) => {
    if (!window.confirm('Remove this check-in entry?')) {
      return
    }

    await db.eveningCheckIns.delete(entryId)
    setMessage('Check-in entry removed.')
    await onSaved()
  }

  const recentCheckIns = [...data.eveningCheckIns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)
  const entryDatePhrase = checkInDatePhrase(date)
  const entryDatePhraseStart = entryDatePhrase.charAt(0).toUpperCase() + entryDatePhrase.slice(1)

  return (
    <Page title="Evening Check-In" subtitle="A factual 60-90 second record for patterns over time.">
      <Card className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <DateField
            label="Evening check-in date"
            helper="Use today for tonight's check-in, or yesterday if you are catching up."
            value={date}
            onChange={setDate}
            showRelativeHint
          />
          <div className="hidden rounded-full bg-calm/10 px-3 py-1 text-sm font-semibold text-calm sm:block">6 sections</div>
        </div>
        {existing ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
            A check-in already exists for this date. Saving will update that entry instead of creating a duplicate.
          </div>
        ) : null}

        <FormSection title="Mood" step="A">
          <SegmentedSelector
            label={`How was your mood ${entryDatePhrase}?`}
            options={eveningMoodOptions}
            value={form.moodRating ?? '3'}
            onChange={(value) => update('moodRating', value)}
          />
        </FormSection>

        <FormSection title="Anxiety" step="B">
          <SegmentedSelector label={`How anxious did you feel ${entryDatePhrase}?`} options={severityOptions} value={form.anxietySeverity} onChange={(value) => update('anxietySeverity', value)} />
          <CheckboxGroup
            label={`What contributed to your anxiety ${entryDatePhrase}?`}
            options={anxietyContributorOptions}
            values={form.anxietyContributors}
            onToggle={(value) => update('anxietyContributors', toggleValue(form.anxietyContributors, value))}
          />
          {form.anxietyContributors.includes('OTHER') ? (
            <TextField label="Other anxiety contributor" value={form.anxietyOtherText ?? ''} onChange={(value) => update('anxietyOtherText', value)} />
          ) : null}
        </FormSection>

        <FormSection title="Depression" step="C">
          <SegmentedSelector
            label={`How low or depressed did you feel ${entryDatePhrase}?`}
            options={severityOptions}
            value={form.depressionSeverity}
            onChange={(value) => update('depressionSeverity', value)}
          />
          <CheckboxGroup
            label={`Did you experience any of these ${entryDatePhrase}?`}
            options={depressionSymptomOptions}
            values={form.depressionSymptoms}
            onToggle={(value) => update('depressionSymptoms', toggleExclusiveNone(form.depressionSymptoms, value, 'NONE'))}
          />
          <CheckboxGroup
            label={`What contributed to feeling low ${entryDatePhrase}?`}
            options={depressionContributorOptions}
            values={form.depressionContributors}
            onToggle={(value) => update('depressionContributors', toggleValue(form.depressionContributors, value))}
          />
          {form.depressionContributors.includes('OTHER') ? (
            <TextField label="Other low mood contributor" value={form.depressionOtherText ?? ''} onChange={(value) => update('depressionOtherText', value)} />
          ) : null}
        </FormSection>

        <FormSection title="Warning Signs" step="D">
          <SegmentedSelector
            label={`Did you feel suspicious or distrustful of others ${entryDatePhrase}?`}
            options={psychosisSeverityOptions}
            value={form.suspiciousness}
            onChange={(value) => update('suspiciousness', value)}
          />
          <SegmentedSelector
            label={`Did ordinary things seem to have special meaning for you ${entryDatePhrase}?`}
            helper="Examples: conversations, number plates, TV, social media, news, signs."
            options={psychosisSeverityOptions}
            value={form.unusualMeanings}
            onChange={(value) => update('unusualMeanings', value)}
          />
          <SegmentedSelector
            label={`How convinced were you that these thoughts were true ${entryDatePhrase}?`}
            options={beliefCertaintyOptions}
            value={form.beliefCertainty}
            onChange={(value) => update('beliefCertainty', value)}
          />
          <CheckboxGroup
            label={`Did you experience any of the following ${entryDatePhrase}?`}
            options={perceptualExperienceOptions}
            values={form.perceptualExperiences}
            onToggle={(value) => update('perceptualExperiences', toggleExclusiveNone(form.perceptualExperiences, value, 'NONE'))}
          />
          <SegmentedSelector
            label={`How was your thinking ${entryDatePhrase}?`}
            options={thinkingClarityOptions}
            value={form.thinkingClarity}
            onChange={(value) => update('thinkingClarity', value)}
          />
          <SegmentedSelector
            label={`Looking back now, did you question any unusual thoughts ${entryDatePhrase}?`}
            options={realityCheckOptions}
            value={form.realityCheck}
            onChange={(value) => update('realityCheck', value)}
          />
        </FormSection>

        <FormSection title="Daily Functioning" step="E">
          <CheckboxGroup
            label={`${entryDatePhraseStart} I:`}
            options={functioningOptions}
            values={form.functioning}
            onToggle={(value) => update('functioning', toggleValue(form.functioning, value))}
          />
        </FormSection>

        <FormSection title="Notes" step="F">
          <TextAreaField
            label={`Anything important happen ${entryDatePhrase}?`}
            value={form.notes ?? ''}
            onChange={(value) => update('notes', value)}
            placeholder="Write only what feels useful. A few words is enough."
          />
        </FormSection>

        <div className="grid gap-3 sm:grid-cols-2">
          <SecondaryButton onClick={() => save('DRAFT')}>Save draft</SecondaryButton>
          <PrimaryButton onClick={() => save('COMPLETE')} icon={CheckCircle2}>
            {existing ? 'Update check-in' : 'Save check-in'}
          </PrimaryButton>
        </div>
        {existing ? (
          <SecondaryButton onClick={() => void deleteCheckIn(existing.id)} icon={Trash2}>
            Remove this check-in
          </SecondaryButton>
        ) : null}
        {message ? <SavedMessage>{message}</SavedMessage> : null}
      </Card>
      <Card className="mt-4 space-y-3">
        <h2 className="text-xl font-bold">Recent check-ins</h2>
        {recentCheckIns.length ? (
          recentCheckIns.map((entry) => (
            <EntryRow
              key={entry.id}
              title={`${entry.date}${relativeDayLabel(entry.date) ? ` (${relativeDayLabel(entry.date)})` : ''}`}
              detail={[
                entry.moodRating ? `Mood ${optionLabel(eveningMoodOptions, entry.moodRating)}` : '',
                entry.status === 'DRAFT' ? 'Draft saved' : 'Completed',
              ].filter(Boolean).join(' · ')}
              onEdit={() => setDate(entry.date)}
              onDelete={() => void deleteCheckIn(entry.id)}
            />
          ))
        ) : (
          <p className="text-sm text-muted">No check-ins yet.</p>
        )}
      </Card>
    </Page>
  )
}

function JournalPage({ data, onSaved }: { data: AppData; onSaved: () => Promise<void> }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const editing = data.journalEntries.find((entry) => entry.id === editingId)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [createdAt, setCreatedAt] = useState(localDateTimeInput())
  const [tags, setTags] = useState('')
  const [search, setSearch] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState('')
  const [message, setMessage] = useState('')
  const [dismissedSuggestedTags, setDismissedSuggestedTags] = useState<string[]>([])

  useEffect(() => {
    setTitle(editing?.title ?? '')
    setBody(editing?.body ?? '')
    setCreatedAt(editing ? isoToDateTimeInput(editing.createdAt) : localDateTimeInput())
    setTags(editing?.tags.join(', ') ?? '')
    setSelectedPrompt('')
    setDismissedSuggestedTags([])
  }, [editing])

  const promptItems = [
    'What happened today?',
    'What am I struggling with right now?',
    'What feels hardest about it?',
    'What seems to be making it harder?',
    'What would make this feel a little more manageable?',
    'What am I worried about?',
    'What helped, even slightly?',
    'What do I want my psychiatrist to know?',
    'What do I need right now?',
    'What would I tell a friend in my position?',
    'What is one small thing I handled better than before?',
  ]
  const encouragement = [
    'A short entry still counts.',
    'You do not have to explain everything perfectly.',
    'Writing creates a record that future you can learn from.',
    'Start with one sentence.',
    'You can write without judging it.',
  ][new Date().getDate() % 5]

  const usePrompt = () => {
    if (!selectedPrompt) {
      return
    }

    setBody((current) => (current ? `${current}\n${selectedPrompt} ` : `${selectedPrompt} `))
    setSelectedPrompt('')
  }

  const typedTags = useMemo(() => splitJournalTags(tags), [tags])
  const suggestedTags = useMemo(
    () =>
      suggestJournalTags(`${title}\n${body}`, typedTags).filter(
        (tag) => !dismissedSuggestedTags.includes(tag),
      ),
    [body, dismissedSuggestedTags, title, typedTags],
  )
  const tagsToSave = useMemo(() => mergeJournalTags(typedTags, suggestedTags), [suggestedTags, typedTags])

  const dismissSuggestedTag = (tag: string) => {
    setDismissedSuggestedTags((current) => (current.includes(tag) ? current : [...current, tag]))
  }

  const save = async () => {
    const now = new Date().toISOString()
    const entry: JournalEntry = {
      id: editing?.id ?? uid(),
      title: title.trim() || undefined,
      body,
      tags: tagsToSave,
      createdAt: new Date(createdAt).toISOString(),
      updatedAt: now,
    }
    await db.journalEntries.put(entry)
    setEditingId(null)
    setTitle('')
    setBody('')
    setTags('')
    setDismissedSuggestedTags([])
    setCreatedAt(localDateTimeInput())
    setMessage('Journal entry saved.')
    await onSaved()
  }

  const deleteJournalEntry = async (entryId: string) => {
    if (!window.confirm('Remove this journal entry?')) {
      return
    }

    await db.journalEntries.delete(entryId)
    if (editingId === entryId) {
      setEditingId(null)
      setTitle('')
      setBody('')
      setTags('')
      setDismissedSuggestedTags([])
      setCreatedAt(localDateTimeInput())
    }
    setMessage('Journal entry removed.')
    await onSaved()
  }

  const entries = data.journalEntries
    .filter((entry) => {
      const haystack = `${entry.title ?? ''} ${entry.body} ${entry.tags.join(' ')}`.toLowerCase()
      const matchesSearch = haystack.includes(search.toLowerCase())
      const matchesDate = filterDate ? localDateKey(new Date(entry.createdAt)) === filterDate : true
      return matchesSearch && matchesDate
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <Page title="Journal" subtitle="A private place to write without pressure.">
      <Card className="space-y-5">
        <p className="font-semibold text-clay">{encouragement}</p>
        <TextField label="Optional title" value={title} onChange={setTitle} />
        <DateTimeField label="Date and time" value={createdAt} onChange={setCreatedAt} />
        <TextAreaField label="Entry" value={body} onChange={setBody} placeholder="Write what feels useful." large />
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <SelectField
            label="Journal prompt"
            value={selectedPrompt}
            onChange={setSelectedPrompt}
            placeholder="Choose a prompt"
            options={promptItems.map((prompt) => ({ value: prompt, label: prompt }))}
          />
          <div className="flex items-end">
            <SecondaryButton onClick={usePrompt} icon={Plus}>
              Use prompt
            </SecondaryButton>
          </div>
        </div>
        <TextField label="Tags" value={tags} onChange={setTags} placeholder="sleep, court, appointment" />
        {suggestedTags.length ? (
          <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-3 dark:border-teal-900 dark:bg-teal-950">
            <p className="text-sm font-semibold text-calm dark:text-teal-100">Suggested from this entry</p>
            <p className="mt-1 text-sm text-calm dark:text-teal-200">
              These local suggestions will be added when you save. Tap one to leave it out.
            </p>
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Suggested journal tags">
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => dismissSuggestedTag(tag)}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-teal-300 bg-white px-3 py-2 text-sm font-bold text-calm outline-none transition hover:border-calm focus-visible:ring-2 focus-visible:ring-calm focus-visible:ring-offset-2 dark:border-teal-700 dark:bg-slate-950 dark:text-teal-100 dark:focus-visible:ring-offset-slate-950"
                  aria-label={`Do not add ${tag} tag`}
                  title={`Do not add ${tag} tag`}
                >
                  <span>{tag}</span>
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <PrimaryButton onClick={save} icon={Save}>
          {editing ? 'Save changes' : 'Save journal entry'}
        </PrimaryButton>
        {message ? <SavedMessage>{message}</SavedMessage> : null}
      </Card>

      <Card className="mt-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Search entries" value={search} onChange={setSearch} placeholder="Search words or tags" />
          <DateField label="Filter by date" value={filterDate} onChange={setFilterDate} allowEmpty />
        </div>
        <div className="space-y-3">
          {entries.length ? (
            entries.map((entry) => (
              <EntryRow
                key={entry.id}
                title={entry.title || 'Untitled entry'}
                detail={`${displayDateTime(entry.createdAt)} - ${entry.body || 'No body text'}`}
                onEdit={() => setEditingId(entry.id)}
                onDelete={() => void deleteJournalEntry(entry.id)}
              />
            ))
          ) : (
            <p className="text-sm text-muted">No journal entries match this view.</p>
          )}
        </div>
      </Card>
    </Page>
  )
}

function QuotesPage({ data, onChanged }: { data: AppData; onChanged: () => Promise<void> }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'ALL' | 'FAVORITES' | string>('ALL')
  const [quoteText, setQuoteText] = useState('')
  const [quoteAuthor, setQuoteAuthor] = useState('')
  const [message, setMessage] = useState('')
  const today = localDateKey()
  const currentQuote = resolveDailyQuote(data.quotes, data.dailyQuoteState.find((state) => state.date === today), today)
  const categories = Array.from(new Set(data.quotes.map((quote) => quote.category))).sort()
  const filteredQuotes = data.quotes
    .filter((quote) => {
      const haystack = `${quote.text} ${quote.author} ${quote.tags.join(' ')} ${quote.category}`.toLowerCase()
      const matchesSearch = haystack.includes(search.toLowerCase())
      const matchesCategory =
        category === 'ALL' ||
        (category === 'FAVORITES' ? quote.isFavorite : quote.category === category)

      return matchesSearch && matchesCategory
    })
    .sort((a, b) => Number(Boolean(b.isFavorite)) - Number(Boolean(a.isFavorite)) || a.text.localeCompare(b.text))

  const favoriteQuote = async (quoteId: string) => {
    const quote = data.quotes.find((item) => item.id === quoteId)
    if (!quote) {
      return
    }

    await db.quotes.put({ ...quote, isFavorite: !quote.isFavorite })
    await onChanged()
  }

  const setTodayQuote = async (quoteId: string) => {
    await db.dailyQuoteState.put({
      date: today,
      quoteId,
      manuallyRefreshed: true,
    })
    setMessage('Today quote updated.')
    await onChanged()
  }

  const addQuote = async () => {
    if (!quoteText.trim()) {
      return
    }

    await db.quotes.put({
      id: uid(),
      text: quoteText.trim(),
      author: quoteAuthor.trim() || 'Personal note',
      category: 'CALM',
      tags: ['custom'],
      isFavorite: true,
      isUserAdded: true,
      createdAt: new Date().toISOString(),
    })
    setQuoteText('')
    setMessage('Quote added to your library.')
    await onChanged()
  }

  return (
    <Page title="Quote Library" subtitle="Browse calm statements, save favorites, and choose today's quote.">
      <Card className="mt-4 space-y-4">
        <div className="flex items-start gap-3">
          <Library className="h-10 w-10 shrink-0 rounded-full bg-teal-50 p-2 text-calm dark:bg-teal-950" />
          <div>
            <h2 className="text-xl font-bold">Today's quote</h2>
            <p className="mt-1 text-sm text-muted dark:text-slate-300">{currentQuote?.text ?? 'No quote selected yet.'}</p>
            {currentQuote ? <p className="mt-2 text-sm font-semibold text-calm">- {currentQuote.author}</p> : null}
          </div>
        </div>
      </Card>

      <Card className="mt-4 space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search quotes, authors, or tags"
            className="min-h-12 w-full rounded-lg border border-line bg-white py-2 pl-10 pr-3 text-base outline-none focus:border-calm focus:ring-2 focus:ring-calm/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto pb-1">
          {[
            { value: 'ALL', label: 'All' },
            { value: 'FAVORITES', label: 'Favorites' },
            ...categories.map((item) => ({ value: item, label: categoryLabel(item) })),
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              className={`min-h-11 shrink-0 snap-start rounded-full border px-4 text-sm font-bold ${
                category === item.value
                  ? 'border-calm bg-calm text-white'
                  : 'border-line bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {filteredQuotes.map((quote) => (
          <Card key={quote.id} className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold leading-snug">{quote.text}</p>
                <p className="mt-2 text-sm font-semibold text-calm">- {quote.author}</p>
              </div>
              <button
                type="button"
                onClick={() => void favoriteQuote(quote.id)}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${
                  quote.isFavorite ? 'border-amberSoft bg-amber-50 text-amberSoft dark:bg-amber-950' : 'border-line text-slate-500 dark:border-slate-700 dark:text-slate-300'
                }`}
                aria-label={quote.isFavorite ? 'Remove favorite' : 'Save favorite'}
              >
                <Star className={`h-5 w-5 ${quote.isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-calm dark:bg-teal-950 dark:text-teal-200">{categoryLabel(quote.category)}</span>
              {quote.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-muted dark:bg-slate-800 dark:text-slate-300">
                  {tag}
                </span>
              ))}
            </div>
            <SecondaryButton onClick={() => setTodayQuote(quote.id)} icon={RefreshCw}>
              Use today
            </SecondaryButton>
          </Card>
        ))}
      </div>

      <Card className="mt-4 space-y-4">
        <h2 className="text-xl font-bold">Add a quote</h2>
        <TextAreaField label="Quote text" value={quoteText} onChange={setQuoteText} placeholder="Add a grounding statement." />
        <TextField label="Author/source" value={quoteAuthor} onChange={setQuoteAuthor} />
        <PrimaryButton onClick={addQuote} icon={Plus}>
          Add quote
        </PrimaryButton>
        {message ? <SavedMessage>{message}</SavedMessage> : null}
      </Card>
    </Page>
  )
}

function TrendsPage({ data }: { data: AppData }) {
  return (
    <Page title="Wellbeing trends" subtitle="Review values and patterns from your locally stored entries.">
      <WellbeingTrendsView data={data} medicationConfigs={Object.values(tabletMedicationConfigs)} />
    </Page>
  )
}

function AdvancedGraphPage({
  data,
  initialMetric,
  onBack,
}: {
  data: AppData
  initialMetric: TrendSeriesKey
  onBack: () => void
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-bold text-calm hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-calm/30 dark:hover:bg-teal-950"
      >
        <ArrowLeft className="h-5 w-5" />
        Back
      </button>
      <Page title="Wellbeing trends" subtitle="Review values and patterns from your locally stored entries.">
        <WellbeingTrendsView
          data={data}
          medicationConfigs={Object.values(tabletMedicationConfigs)}
          openedFromMetric={trendSeriesByKey[initialMetric].shortLabel}
        />
      </Page>
    </div>
  )
}
function SettingsPage({
  data,
  onChanged,
  onView,
}: {
  data: AppData
  onChanged: () => Promise<void>
  onView: (view: View) => void
}) {
  const [message, setMessage] = useState('')
  const [permissionState, setPermissionState] = useState(notificationPermission())
  const [contact, setContact] = useState({ name: '', role: '', phone: '', notes: '' })
  const [selectedCrisisTeamId, setSelectedCrisisTeamId] = useState('')
  const [locationState, setLocationState] = useState<'idle' | 'locating'>('idle')
  const permissionsAllowed = permissionState === 'granted' || permissionState === 'native'
  const selectedMedication = data.appSettings.benzodiazepineMedication
  const selectedMedicationConfig = tabletMedicationConfigs[selectedMedication]
  const selectedTabletMg = data.appSettings.benzodiazepineTabletMgByMedication[selectedMedication]
  const [tabletMgInput, setTabletMgInput] = useState(() => selectedTabletMg === undefined ? '' : String(selectedTabletMg))
  const [tabletAmountMessage, setTabletAmountMessage] = useState('')

  useEffect(() => {
    setTabletMgInput(selectedTabletMg === undefined ? '' : String(selectedTabletMg))
  }, [selectedMedication, selectedTabletMg])

  const crisisTeamSelectOptions = useMemo(
    () =>
      crisisTeamOptions.reduce<
        Array<{ value: string; label: string; helper?: string; disabled?: boolean }>
      >((acc, team, index, list) => {
        const previousRegion = index > 0 ? list[index - 1].region : undefined
        if (previousRegion !== team.region) {
            acc.push({ value: `region::${team.region}`, label: team.region.toUpperCase(), disabled: true })
          }
          acc.push({ value: team.id, label: `${team.service} • ${team.phone}`, helper: `Region: ${team.region}` })
          return acc
        },
        [],
      ),
    [],
  )
  const selectedCrisisTeam = crisisTeamOptions.find((team) => team.id === selectedCrisisTeamId)

  const updateSettings = async (partial: Partial<AppSettings>) => {
    const nextSettings = {
      ...data.appSettings,
      ...partial,
      updatedAt: new Date().toISOString(),
    }

    await db.appSettings.put(nextSettings)
    void scheduleNativeReminderNotifications(
      nextSettings,
      reminderCompletionForData(data),
      treatmentEnabled ? data.treatmentSettings : undefined,
      treatmentEnabled ? data.treatmentProgramPlans : [],
      treatmentEnabled
        ? hasTreatmentActivityToday(
            data.treatmentResponses,
            data.treatmentReviews,
            data.treatmentSessions,
            new Date(),
            data.treatmentActivities,
          )
        : false,
      treatmentEnabled ? data.treatmentSessions : [],
    ).catch(() => undefined)
    await onChanged()
  }

  const setTheme = async (theme: ThemePreference) => {
    await updateSettings({ theme })
    setMessage('Theme preference saved.')
  }

  const setMedication = async (medication: BenzodiazepineMedication) => {
    setTabletAmountMessage('')
    await updateSettings({ benzodiazepineMedication: medication })
    setMessage(`${tabletMedicationConfigs[medication].label} selected for new medication entries.`)
  }

  const saveTabletMg = async () => {
    const rawAmount = tabletMgInput.trim()
    const currentAmounts = data.appSettings.benzodiazepineTabletMgByMedication

    if (!rawAmount) {
      const remainingAmounts = { ...currentAmounts }
      delete remainingAmounts[selectedMedication]
      await updateSettings({ benzodiazepineTabletMgByMedication: remainingAmounts })
      setTabletAmountMessage(`Tablet amount cleared for ${selectedMedicationConfig.label}.`)
      return
    }

    const amount = Number(rawAmount.replace(',', '.'))
    if (!Number.isFinite(amount) || amount <= 0 || amount > 10000) {
      setTabletAmountMessage('Enter a valid whole-tablet amount in mg.')
      return
    }

    await updateSettings({
      benzodiazepineTabletMgByMedication: {
        ...currentAmounts,
        [selectedMedication]: amount,
      },
    })
    setTabletMgInput(String(amount))
    setTabletAmountMessage(`Whole ${selectedMedicationConfig.label} tablet amount saved.`)
  }

  const enableNotifications = async () => {
    if (!notificationSupported()) {
      setMessage('This browser does not support local notifications.')
      return
    }

    const permission = await requestNotificationPermission()
    setPermissionState(permission)

    if (permission === 'granted') {
      await updateSettings({ notificationsEnabled: true })
      setMessage('Notifications enabled for this browser.')
      return
    }

    setMessage('Notification permission was not granted.')
  }

  const sendTestNotification = () => {
    const previewSettings = { ...data.appSettings, notificationsEnabled: true }

    if (notificationPermission() === 'granted') {
      void sendReminderNotification(previewSettings).then((sent) => {
        setMessage(sent ? 'Test notification sent.' : buildReminderBody(previewSettings))
      })
      return
    }

    if (notificationPermission() === 'native') {
      void sendReminderNotification(previewSettings).then((sent) => {
        setMessage(sent ? 'Test notification scheduled.' : buildReminderBody(previewSettings))
      }).catch(() => {
        setMessage('Native notification could not be scheduled. Check Android notification permission.')
      })
      return
    }

    setMessage(buildReminderBody(previewSettings))
  }

  const exportAll = async () => {
    const hasSubstanceData = data.quickCheckIns.some((entry) => entry.substanceUse === 'YES' || entry.substances.length > 0)
    const hasTreatmentData =
      data.treatmentResponses.length > 0 ||
      data.treatmentProgramPlans.length > 0 ||
      data.treatmentActivities.length > 0 ||
      data.treatmentSessions.length > 0 ||
      data.treatmentReviews.length > 0 ||
      data.treatmentNightmares.length > 0 ||
      data.treatmentProgress.selectedPrograms.length > 0 ||
      Boolean(data.treatmentSettings.realityStatement)
    if (
      (hasSubstanceData || hasTreatmentData) &&
      !window.confirm(
        `This backup includes sensitive ${[
          hasSubstanceData ? 'substance use' : '',
          hasTreatmentData ? 'Treatment and nightmare support' : '',
        ].filter(Boolean).join(' and ')} information. Only continue if you mean to save or share that data.`,
      )
    ) {
      return
    }

    const bundle = await createExportBundle()
    await downloadJson(`salience-backup-${localDateKey()}.json`, serializeExportBundle(bundle))
    setMessage('Export prepared.')
  }

  const importFile = async (file?: File) => {
    if (!file) {
      return
    }

    const text = await file.text()
    await importExportBundle(JSON.parse(text))
    await onChanged()
    setMessage('Backup imported.')
  }

  const deleteEverything = async () => {
    if (window.confirm('Delete all Salience entries in this browser? This cannot be undone.')) {
      await deleteAllData()
      await onChanged()
      setMessage('All local data was deleted. Default quotes and support contacts were restored.')
    }
  }

  const addContact = async () => {
    if (!contact.name.trim() || !contact.role.trim()) {
      return
    }
    const now = new Date().toISOString()
    const supportContact: SupportContact = {
      id: uid(),
      name: contact.name.trim(),
      role: contact.role.trim(),
      phone: contact.phone.trim() || undefined,
      notes: contact.notes.trim() || undefined,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    }
    await db.supportContacts.put(supportContact)
    setContact({ name: '', role: '', phone: '', notes: '' })
    await onChanged()
    setMessage('Support contact saved.')
  }

  const removeContact = async (contactId: string) => {
    const supportContact = data.supportContacts.find((item) => item.id === contactId)
    if (!supportContact || supportContact.isDefault) {
      return
    }

    if (!window.confirm(`Remove ${supportContact.name} from your support contacts?`)) {
      return
    }

    await db.supportContacts.delete(contactId)
    await onChanged()
    setMessage('Support contact removed.')
  }

  const autofillCrisisTeamFromLocation = () => {
    if (!navigator.geolocation) {
      setMessage('Location is not available here. Choose your region or local service manually.')
      return
    }

    setLocationState('locating')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nearest = nearestCrisisTeam(coords.latitude, coords.longitude)
        setLocationState('idle')
        if (!nearest) {
          setMessage('No configured Health NZ crisis team matched this location. Choose your region manually.')
          return
        }

        setSelectedCrisisTeamId(nearest.id)
        setMessage(`${nearest.service} selected. Review the details, then save it to your support plan.`)
      },
      (error) => {
        setLocationState('idle')
        setMessage(
          error.code === error.PERMISSION_DENIED
            ? 'Location permission was not granted. Choose your region or local service manually.'
            : 'We could not determine your location. Choose your region or local service manually.',
        )
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    )
  }

  const saveCrisisTeam = async () => {
    if (!selectedCrisisTeam) {
      setMessage('Choose a region or local crisis team first.')
      return
    }

    const existing = data.supportContacts.find((item) => item.id === 'support-crisis-team')
    const now = new Date().toISOString()
    const supportContact: SupportContact = {
      id: existing?.id ?? 'support-crisis-team',
      name: `${selectedCrisisTeam.service} crisis team`,
      role: 'Mental health crisis assessment team',
      phone: selectedCrisisTeam.phone,
      notes: [
        selectedCrisisTeam.notes,
        `Region: ${selectedCrisisTeam.region}. Source: Health NZ crisis assessment teams, last updated ${healthNzCrisisTeamsLastUpdated}.`,
        'For immediate danger call 111 or go to the nearest emergency department.',
      ]
        .filter(Boolean)
        .join(' '),
      isDefault: existing?.isDefault ?? false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }

    await db.supportContacts.put(supportContact)
    await onChanged()
    setMessage('Crisis team saved to your support plan.')
  }

  const backup = buildExportBundle(data)

  return (
    <Page title="Settings" subtitle="Manage appearance, reminders, local data, and support contacts.">
      <Card className="space-y-4">
        <h2 className="text-xl font-bold">Appearance</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <ThemeChoice
            active={data.appSettings.theme === 'SYSTEM'}
            icon={Monitor}
            label="System"
            onClick={() => void setTheme('SYSTEM')}
          />
          <ThemeChoice
            active={data.appSettings.theme === 'LIGHT'}
            icon={Sun}
            label="Light"
            onClick={() => void setTheme('LIGHT')}
          />
          <ThemeChoice
            active={data.appSettings.theme === 'DARK'}
            icon={Moon}
            label="Dark"
            onClick={() => void setTheme('DARK')}
          />
        </div>
      </Card>

      <Card className="mt-4 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-10 w-10 shrink-0 rounded-full bg-teal-50 p-2 text-calm dark:bg-teal-950" />
          <div>
            <h2 className="text-xl font-bold">Privacy</h2>
            <p className="mt-1 text-sm text-muted dark:text-slate-300">
              Salience stores entries locally first. Exports are created only when you choose.
            </p>
          </div>
        </div>
        {substanceTrackingEnabled ? (
          <ToggleRow
            label="Hide substance details from casual view"
            checked={data.appSettings.hideSubstanceUseDetails}
            onChange={(checked) => void updateSettings({ hideSubstanceUseDetails: checked })}
          />
        ) : null}
        <p className="rounded-lg border border-line bg-slate-50 p-3 text-sm text-muted dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          Exporting a full backup can include sensitive data. Only export material you intend to share or save.
        </p>
      </Card>

      {medicationEnabled ? (
        <Card className="mt-4 space-y-4">
          <div className="flex items-start gap-3">
            <Pill className="h-10 w-10 shrink-0 rounded-full bg-orange-50 p-2 text-clay dark:bg-orange-950" />
            <div>
              <h2 className="text-xl font-bold">Medication</h2>
              <p className="mt-1 text-sm text-muted dark:text-slate-300">
                Choose the medication tablet you want to record. Changing this does not alter entries already saved.
              </p>
            </div>
          </div>
          <SegmentedSelector
            label="Medication to record"
            helper="Clonazepam and Benzodiazepine use four quarters. Lorazepam and Diazepam use two halves."
            options={medicationOptions}
            value={selectedMedication}
            onChange={(value) => void setMedication(value)}
          />
          <FieldBlock
            label={`Whole ${selectedMedicationConfig.label} tablet amount`}
            helper="Optional. This is used only to label the portion you record; Salience does not advise a dose or medication change."
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="e.g. 0.5"
                value={tabletMgInput}
                onChange={(event) => {
                  setTabletMgInput(event.target.value)
                  setTabletAmountMessage('')
                }}
                className="min-h-12 min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-base outline-none focus:border-calm focus:ring-2 focus:ring-calm/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                aria-label={`Whole ${selectedMedicationConfig.label} tablet amount in mg`}
              />
              <span className="text-sm font-bold text-muted dark:text-slate-300">mg</span>
            </div>
          </FieldBlock>
          <SecondaryButton onClick={saveTabletMg} icon={Save}>
            Save tablet amount
          </SecondaryButton>
          {tabletAmountMessage ? <SavedMessage>{tabletAmountMessage}</SavedMessage> : null}
          <SecondaryButton onClick={() => onView('medication')} icon={Pill}>
            Open medication
          </SecondaryButton>
        </Card>
      ) : null}

      <Card className="mt-4 space-y-4">
        <div className="flex items-start gap-3">
          <Bell className="h-10 w-10 shrink-0 rounded-full bg-teal-50 p-2 text-calm dark:bg-teal-950" />
          <div>
            <h2 className="text-xl font-bold">Notifications</h2>
            <p className="mt-1 text-sm text-muted dark:text-slate-300">
              Gentle local reminders only. Salience does not send your tracking data anywhere.
            </p>
          </div>
        </div>

        {permissionsAllowed ? (
          <div className="rounded-lg border border-line bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
            Permissions allowed: <span className="font-bold text-calm">Yes</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={enableNotifications}
            className="w-full rounded-lg border border-line bg-slate-50 p-3 text-left text-sm transition hover:border-calm hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-calm/30 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-teal-950"
            aria-label="Enable notification permission"
          >
            Permissions allowed: <span className="font-bold text-calm">No</span>
          </button>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <PrimaryButton onClick={enableNotifications} icon={Bell}>
            Enable notifications
          </PrimaryButton>
          <SecondaryButton onClick={sendTestNotification} icon={Bell}>
            Send test
          </SecondaryButton>
        </div>

        <ToggleRow
          label="Use reminder notifications"
          checked={data.appSettings.notificationsEnabled}
          onChange={(checked) => void updateSettings({ notificationsEnabled: checked })}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReminderControl
            label="Morning check-in"
            enabled={data.appSettings.morningCheckInReminderEnabled}
            time={data.appSettings.morningCheckInReminderTime}
            onEnabled={(checked) => void updateSettings({ morningCheckInReminderEnabled: checked })}
            onTime={(time) => void updateSettings({ morningCheckInReminderTime: time })}
          />
          <ReminderControl
            label="Evening check-in"
            enabled={data.appSettings.checkInReminderEnabled}
            time={data.appSettings.checkInReminderTime}
            onEnabled={(checked) => void updateSettings({ checkInReminderEnabled: checked })}
            onTime={(time) => void updateSettings({ checkInReminderTime: time })}
          />
          <ReminderControl
            label="Sleep entry"
            enabled={data.appSettings.sleepReminderEnabled}
            time={data.appSettings.sleepReminderTime}
            onEnabled={(checked) => void updateSettings({ sleepReminderEnabled: checked })}
            onTime={(time) => void updateSettings({ sleepReminderTime: time })}
          />
          <ReminderControl
            label="Daily quote"
            enabled={data.appSettings.quoteReminderEnabled}
            time={data.appSettings.quoteReminderTime}
            onEnabled={(checked) => void updateSettings({ quoteReminderEnabled: checked })}
            onTime={(time) => void updateSettings({ quoteReminderTime: time })}
          />
        </div>
      </Card>

      <Card className="mt-4 space-y-4">
        <div className="flex items-start gap-3">
          <Library className="h-10 w-10 shrink-0 rounded-full bg-teal-50 p-2 text-calm dark:bg-teal-950" />
          <div>
            <h2 className="text-xl font-bold">Quote library</h2>
            <p className="mt-1 text-sm text-muted dark:text-slate-300">
              Browse seeded quotes, save favorites, add custom statements, and choose today's quote.
            </p>
          </div>
        </div>
        <SecondaryButton onClick={() => onView('quotes')} icon={Library}>
          Open quote library
        </SecondaryButton>
      </Card>

      <Card className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <PrimaryButton onClick={exportAll} icon={Download}>
            Export all data
          </PrimaryButton>
          <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-3 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <Upload className="h-5 w-5" />
            Import JSON
            <input className="hidden" type="file" accept="application/json" onChange={(event) => void importFile(event.target.files?.[0])} />
          </label>
          <button
            type="button"
            onClick={deleteEverything}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-clay px-4 py-3 text-sm font-bold text-white"
          >
            <Trash2 className="h-5 w-5" />
            Delete all data
          </button>
        </div>
        <p className="text-xs text-muted dark:text-slate-300">Current export schema version: {backup.schemaVersion}</p>
        {message ? <SavedMessage>{message}</SavedMessage> : null}
      </Card>

      <Card className="mt-4 space-y-4">
        <h2 className="text-xl font-bold">Support contacts</h2>
        <div className="rounded-lg border border-line bg-teal-50 p-3 dark:border-slate-700 dark:bg-teal-950/40">
          <div className="flex items-start gap-3">
            <LifeBuoy className="mt-1 h-5 w-5 shrink-0 text-calm dark:text-teal-100" />
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Autofill local crisis team</h3>
                <p className="mt-1 text-sm text-muted dark:text-slate-300">
                  Choose your region or local service to add the Health NZ crisis team number to your support plan.
                </p>
              </div>
                <SelectField
                  label="Region or local service"
                  value={selectedCrisisTeamId}
                  onChange={setSelectedCrisisTeamId}
                  options={crisisTeamSelectOptions}
                  placeholder="Choose a crisis team"
                />
              <div className="space-y-2">
                <SecondaryButton onClick={autofillCrisisTeamFromLocation} icon={LocateFixed}>
                  {locationState === 'locating' ? 'Checking location...' : 'Use my location'}
                </SecondaryButton>
                <p className="text-xs text-muted dark:text-slate-300">
                  Your browser will ask for permission. Salience uses your location on this device to choose a nearby option and does not save your coordinates.
                </p>
              </div>
              {selectedCrisisTeam ? (
                <div className="rounded-lg bg-white p-3 text-sm dark:bg-slate-900">
                  <div className="font-bold">{selectedCrisisTeam.service}</div>
                  <div className="text-muted dark:text-slate-300">{selectedCrisisTeam.region}</div>
                  <div className="font-semibold text-calm dark:text-teal-200">{selectedCrisisTeam.phone}</div>
                  {selectedCrisisTeam.notes ? <div className="text-muted dark:text-slate-300">{selectedCrisisTeam.notes}</div> : null}
                </div>
              ) : null}
              <div className="grid gap-2 sm:grid-cols-[auto,1fr] sm:items-center">
                <PrimaryButton onClick={saveCrisisTeam} icon={LifeBuoy}>
                  Save crisis team
                </PrimaryButton>
                <p className="text-xs text-muted dark:text-slate-300">
                  Source:{' '}
                  <a className="font-semibold text-calm underline dark:text-teal-200" href={healthNzCrisisTeamsSourceUrl} target="_blank" rel="noreferrer">
                    Health NZ
                  </a>
                  , last updated {healthNzCrisisTeamsLastUpdated}. In immediate danger call 111 or go to the nearest emergency department.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Name" value={contact.name} onChange={(value) => setContact((current) => ({ ...current, name: value }))} />
          <TextField label="Role" value={contact.role} onChange={(value) => setContact((current) => ({ ...current, role: value }))} />
          <TextField label="Phone" value={contact.phone} onChange={(value) => setContact((current) => ({ ...current, phone: value }))} />
          <TextField label="Notes" value={contact.notes} onChange={(value) => setContact((current) => ({ ...current, notes: value }))} />
        </div>
        <PrimaryButton onClick={addContact} icon={Plus}>
          Add support contact
        </PrimaryButton>
        <div className="space-y-2">
          {data.supportContacts.map((item) => (
            <div key={item.id} className="rounded-lg border border-line bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold">{item.name}</div>
                  <div className="text-muted dark:text-slate-300">{item.role}</div>
                  {item.phone ? <div className="font-semibold text-calm">{item.phone}</div> : null}
                  {item.notes ? <div className="text-muted dark:text-slate-300">{item.notes}</div> : null}
                </div>
                {!item.isDefault ? (
                  <button
                    type="button"
                    onClick={() => void removeContact(item.id)}
                    className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-bold text-slate-700 hover:border-clay/60 hover:text-clay dark:border-slate-700 dark:text-slate-100"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                ) : null}
              </div>
              {item.isDefault ? <p className="mt-2 text-xs text-muted dark:text-slate-400">Built-in support resource</p> : null}
            </div>
          ))}
        </div>
      </Card>
      <p className="mt-4 rounded-lg border border-line bg-white p-4 text-xs text-muted dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{disclaimer}</p>
    </Page>
  )
}

function ThemeChoice({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: typeof Home
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-16 items-center gap-3 rounded-lg border px-4 py-3 text-left font-bold ${
        active
          ? 'border-calm bg-calm text-white'
          : 'border-line bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  )
}

function ReminderControl({
  label,
  enabled,
  time,
  onEnabled,
  onTime,
}: {
  label: string
  enabled: boolean
  time: string
  onEnabled: (checked: boolean) => void
  onTime: (time: string) => void
}) {
  return (
    <div className="space-y-3 rounded-lg border border-line bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <ToggleRow label={label} checked={enabled} onChange={onEnabled} />
      <TimeField label={`${label} time`} value={time} onChange={onTime} />
    </div>
  )
}

function SupportModal({ contacts, onClose }: { contacts: SupportContact[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-900/30 p-3 sm:items-center sm:justify-center">
      <div className="max-h-[88vh] w-full overflow-auto rounded-lg bg-white p-5 shadow-soft dark:bg-slate-900 sm:max-w-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Help Now</h2>
            <p className="mt-2 text-sm text-muted">
              If you feel at immediate risk, contact emergency services now. If you need to talk to someone, use one of your saved supports below.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-600 dark:text-slate-300">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="rounded-lg border border-line bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{contact.name}</h3>
                  <p className="text-sm text-muted">{contact.role}</p>
                </div>
                {contact.phone ? (
                  <a href={`tel:${contact.phone}`} className="shrink-0 whitespace-nowrap rounded-lg bg-calm px-3 py-2 text-sm font-bold text-white">
                    {contact.phone}
                  </a>
                ) : null}
              </div>
              {contact.notes ? <p className="mt-2 text-sm text-muted">{contact.notes}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TopBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-calm/30 bg-teal-50 px-4 py-3 text-calm shadow-card dark:border-teal-800 dark:bg-teal-950 dark:text-teal-100">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <p className="font-bold">{message}</p>
      </div>
      <button type="button" onClick={onDismiss} className="rounded-lg p-1 text-calm/80 hover:bg-calm/10 dark:text-teal-100" aria-label="Dismiss banner">
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-line bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-5 ${className}`}>
      {children}
    </section>
  )
}

function Page({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-4 lg:mb-6">
        <h1 className="text-3xl font-bold tracking-normal lg:text-4xl">{title}</h1>
        <p className="mt-1 text-sm text-muted dark:text-slate-300">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function ActionCard({
  icon: Icon,
  label,
  detail,
  tone,
  onClick,
}: {
  icon: typeof Home
  label: string
  detail: string
  tone: 'teal' | 'blue' | 'clay' | 'green' | 'amber' | 'night'
  onClick: () => void
}) {
  const tones = {
    teal: 'from-calm to-teal-700',
    blue: 'from-ocean to-blue-700',
    clay: 'from-clay to-orange-700',
    green: 'from-emerald-700 to-green-900',
    amber: 'from-amber-700 to-orange-800',
    night: 'from-indigo-700 to-slate-900',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-36 rounded-lg bg-gradient-to-br ${tones[tone]} p-4 text-left text-white shadow-card transition hover:scale-[1.01]`}
    >
      <Icon className="h-10 w-10 sm:h-12 sm:w-12" />
      <div className="mt-4 text-lg font-bold leading-tight">{label}</div>
      <div className="mt-1 text-sm text-white/90">{detail}</div>
    </button>
  )
}

function StatusRow({
  icon: Icon,
  title,
  detail,
  badge,
  onClick,
}: {
  icon: typeof Home
  title: string
  detail: string
  badge: string
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 border-t border-line py-4 text-left first:border-t-0 dark:border-slate-800">
      <Icon className="h-10 w-10 shrink-0 rounded-full bg-teal-50 p-2 text-calm dark:bg-teal-950" />
      <div className="min-w-0 flex-1">
        <div className="font-bold">{title}</div>
        <div className="truncate text-sm text-muted dark:text-slate-300">{detail}</div>
      </div>
      <span className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold text-muted dark:bg-slate-800 dark:text-slate-300">{badge}</span>
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </button>
  )
}

function EntryRow({
  title,
  detail,
  onEdit,
  onDelete,
}: {
  title: string
  detail: string
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-3 shadow-card dark:border-slate-700 dark:bg-slate-900">
      <div className="min-w-0">
        <h3 className="truncate font-bold">{title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted dark:text-slate-300">{detail}</p>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <SecondaryButton onClick={onEdit} icon={Pencil}>
          Edit
        </SecondaryButton>
        <SecondaryButton onClick={onDelete} icon={Trash2}>
          Remove
        </SecondaryButton>
      </div>
    </div>
  )
}

function TrendMiniCard({
  title,
  value,
  helper,
  data,
  dataKey,
  onOpen,
}: {
  title: string
  value: string
  helper: string
  data: TrendDatum[]
  dataKey: TrendSeriesKey
  onOpen: () => void
}) {
  const series = trendSeriesByKey[dataKey]
  const values = data.map((item) => Number(item[dataKey]) || 0)
  const max = Math.max(...values, 1)
  const points = values.map((item, index) => ({
    x: values.length <= 1 ? 62 : (index / (values.length - 1)) * 112 + 6,
    y: 68 - (item / max) * 52,
  }))
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')
  const { activeIndex, handlers, svgRef } = useChartScrub(data.length, onOpen, 124, 6, 6)
  const activeRow = activeIndex === null ? undefined : data[activeIndex]

  return (
    <Card className="relative min-h-44">
      <button
        type="button"
        onClick={onOpen}
        className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-slate-100 hover:text-calm focus:outline-none focus:ring-2 focus:ring-calm/30 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label={`Open advanced ${title} graph`}
        title="Open graph explorer"
      >
        <Maximize2 className="h-5 w-5" />
      </button>
      <div className="flex min-h-32 items-center justify-between gap-3 pr-6">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold" style={{ color: series.color }}>
            {title}
          </h3>
          <div className="mt-3 text-3xl font-bold">{activeRow ? series.format(Number(activeRow[dataKey]) || 0) : value}</div>
          <p className="text-sm text-muted dark:text-slate-300">{activeRow ? activeRow.label : helper}</p>
        </div>
        <svg
          ref={svgRef}
          role="img"
          aria-label={`${title} graph. Use left and right arrow keys to inspect entries; press Enter to open graph explorer.`}
          viewBox="0 0 124 76"
          className="h-24 w-32 shrink-0 cursor-crosshair touch-pan-y rounded-lg outline-none focus:ring-2 focus:ring-calm/30"
          tabIndex={0}
          {...handlers}
        >
          <path d="M 6,68 H 118" fill="none" stroke="currentColor" className="text-slate-300 dark:text-slate-600" strokeWidth="2" />
          <path d={path} fill="none" stroke={series.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
          {activeIndex !== null && points[activeIndex] ? (
            <>
              <path d={`M ${points[activeIndex].x} 8 V 68`} stroke="currentColor" className="text-slate-400 dark:text-slate-500" strokeDasharray="3 3" strokeWidth="1.5" />
              <circle cx={points[activeIndex].x} cy={points[activeIndex].y} r="6" fill="white" stroke={series.color} strokeWidth="4" />
            </>
          ) : null}
        </svg>
      </div>
    </Card>
  )
}

function useChartScrub(
  dataLength: number,
  onOpen: (() => void) | undefined,
  viewWidth: number,
  plotLeft: number,
  plotRight: number,
) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const pointerStart = useRef({ x: 0, y: 0 })
  const lastTapAt = useRef(0)

  const activateAt = (clientX: number) => {
    const bounds = svgRef.current?.getBoundingClientRect()
    if (!bounds || dataLength === 0) return
    const viewX = ((clientX - bounds.left) / Math.max(bounds.width, 1)) * viewWidth
    const ratio = Math.max(0, Math.min(1, (viewX - plotLeft) / (viewWidth - plotLeft - plotRight)))
    setActiveIndex(Math.round(ratio * Math.max(dataLength - 1, 0)))
  }

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    pointerStart.current = { x: event.clientX, y: event.clientY }
    event.currentTarget.focus({ preventScroll: true })
    activateAt(event.clientX)
  }
  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => activateAt(event.clientX)
  const onPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    activateAt(event.clientX)
    if (event.pointerType === 'mouse' || !onOpen) return
    const movement = Math.hypot(event.clientX - pointerStart.current.x, event.clientY - pointerStart.current.y)
    const now = Date.now()
    if (movement < 12 && now - lastTapAt.current < 360) {
      lastTapAt.current = 0
      onOpen()
    } else {
      lastTapAt.current = now
    }
  }
  const onKeyDown = (event: ReactKeyboardEvent<SVGSVGElement>) => {
    if (event.key === 'Enter' && onOpen) {
      event.preventDefault()
      onOpen()
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      setActiveIndex((current) => {
        const base = current ?? (event.key === 'ArrowLeft' ? dataLength : -1)
        return Math.max(0, Math.min(dataLength - 1, base + (event.key === 'ArrowLeft' ? -1 : 1)))
      })
    }
    if (event.key === 'Escape') setActiveIndex(null)
  }

  return {
    activeIndex,
    svgRef,
    handlers: {
      onDoubleClick: onOpen,
      onKeyDown,
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
  }
}

function QuickChoiceGroup<T extends string>({
  label,
  helper,
  options,
  value,
  onChange,
}: {
  label: string
  helper?: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <FieldBlock label={label} helper={helper}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`min-h-14 rounded-lg border px-3 py-3 text-center text-sm font-bold transition ${
              value === option.value
                ? 'border-calm bg-calm text-white'
                : 'border-line bg-white text-slate-700 hover:border-calm/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </FieldBlock>
  )
}

function GroundingStep({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white px-3 py-3 text-sm font-bold text-amber-950 dark:bg-slate-900 dark:text-amber-100">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-950">{number}</span>
      {text}
    </div>
  )
}

function SafetyQuestion({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex min-h-14 items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm font-bold ${
        checked ? 'border-calm bg-teal-50 text-calm dark:bg-teal-950' : 'border-line bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
      }`}
    >
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border ${checked ? 'border-calm bg-calm' : 'border-slate-300'}`}>
        {checked ? <CheckCircle2 className="h-4 w-4 text-white" /> : null}
      </span>
      {label}
    </button>
  )
}

function SubstanceDetailEditor({
  item,
  onChange,
}: {
  item: SubstanceUseDetail
  onChange: <K extends keyof SubstanceUseDetail>(id: string, key: K, value: SubstanceUseDetail[K] | '') => void
}) {
  return (
    <div className="space-y-3 rounded-lg border border-line bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <h3 className="font-bold">{optionLabel(substanceTypeOptions, item.substance)}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label="Amount"
          value={item.amount ?? ''}
          onChange={(value) => onChange(item.id, 'amount', value as SubstanceAmount | '')}
          placeholder="Optional"
          options={substanceAmountOptions}
        />
        <SelectField
          label="Timing"
          value={item.timing ?? ''}
          onChange={(value) => onChange(item.id, 'timing', value as SubstanceTiming | '')}
          placeholder="Optional"
          options={substanceTimingOptions}
        />
        <SelectField
          label="Reason"
          value={item.reason ?? ''}
          onChange={(value) => onChange(item.id, 'reason', value as SubstanceReason | '')}
          placeholder="Optional"
          options={substanceReasonOptions}
        />
        <SelectField
          label="Helped?"
          value={item.helped ?? ''}
          onChange={(value) => onChange(item.id, 'helped', value as SubstanceHelped | '')}
          placeholder="Optional"
          options={substanceHelpedOptions}
        />
      </div>
    </div>
  )
}

function FormSection({ title, step, children }: { title: string; step: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border border-line bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-calm text-sm font-bold text-white">{step}</span>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function SegmentedSelector<T extends string>({
  label,
  helper,
  options,
  value,
  onChange,
}: {
  label: string
  helper?: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <FieldBlock label={label} helper={helper}>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {options.map((option) => (
          <SegmentButton key={option.value} active={value === option.value} onClick={() => onChange(option.value)}>
            {option.label}
          </SegmentButton>
        ))}
      </div>
    </FieldBlock>
  )
}

function SegmentButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-12 rounded-lg border px-3 py-2 text-sm font-bold transition ${
        active ? 'border-calm bg-calm text-white' : 'border-line bg-white text-slate-700 hover:border-calm/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
      }`}
    >
      {children}
    </button>
  )
}

function CheckboxGroup<T extends string>({
  label,
  options,
  values,
  onToggle,
}: {
  label: string
  options: Option<T>[]
  values: T[]
  onToggle: (value: T) => void
}) {
  return (
    <FieldBlock label={label}>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const checked = values.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              className={`flex min-h-12 items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm font-semibold ${
                checked ? 'border-calm bg-teal-50 text-calm dark:bg-teal-950' : 'border-line bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
              }`}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${checked ? 'border-calm bg-calm' : 'border-slate-300'}`}>
                {checked ? <CheckCircle2 className="h-4 w-4 text-white" /> : null}
              </span>
              {option.label}
            </button>
          )
        })}
      </div>
    </FieldBlock>
  )
}

function FieldBlock({ label, helper, children, htmlFor }: { label: string; helper?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-bold text-slate-800 dark:text-slate-100">
        {label}
      </label>
      {helper ? <p className="mb-2 text-sm text-muted dark:text-slate-300">{helper}</p> : null}
      {children}
    </div>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  large,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  large?: boolean
}) {
  const inputId = useId()

  return (
    <FieldBlock label={label} htmlFor={inputId}>
      <textarea
        id={inputId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-line bg-white px-3 py-3 text-base outline-none focus:border-calm focus:ring-2 focus:ring-calm/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 ${
          large ? 'min-h-56' : 'min-h-28'
        }`}
      />
    </FieldBlock>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const inputId = useId()

  return (
    <FieldBlock label={label} htmlFor={inputId}>
      <input
        id={inputId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-12 w-full rounded-lg border border-line bg-white px-3 py-2 text-base outline-none focus:border-calm focus:ring-2 focus:ring-calm/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
      />
    </FieldBlock>
  )
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string
  value: T | ''
  onChange: (value: T | '') => void
  options: Option<T>[]
  placeholder?: string
}) {
  const inputId = useId()

  return (
    <FieldBlock label={label} htmlFor={inputId}>
      <div className="relative">
        <select
          id={inputId}
          value={value}
          onChange={(event) => onChange(event.target.value as T | '')}
          className="min-h-12 w-full appearance-none rounded-lg border border-line bg-white px-3 py-2 pr-10 text-base font-semibold text-slate-700 outline-none focus:border-calm focus:ring-2 focus:ring-calm/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="">{placeholder ?? 'Select an option'}</option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className={option.disabled ? 'font-bold text-slate-500' : ''}
              title={option.helper}
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-calm" />
      </div>
    </FieldBlock>
  )
}

function DateField({
  label,
  value,
  onChange,
  allowEmpty = false,
  showRelativeHint = false,
  helper,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  allowEmpty?: boolean
  showRelativeHint?: boolean
  helper?: string
}) {
  const inputId = useId()
  const relative = showRelativeHint ? relativeDayLabel(value) : ''
  const updateValue = (nextValue: string) => onChange(nextValue || (allowEmpty ? '' : localDateKey()))

  return (
    <FieldBlock label={label} helper={helper} htmlFor={inputId}>
      <input
        id={inputId}
        type="date"
        value={value}
        onChange={(event) => updateValue(event.target.value)}
        onInput={(event) => updateValue(event.currentTarget.value)}
        className="min-h-12 w-full rounded-lg border border-line bg-white px-3 py-2 text-base outline-none focus:border-calm focus:ring-2 focus:ring-calm/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      />
      {relative ? (
        <p className="mt-2 rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-calm dark:bg-teal-950 dark:text-teal-100">
          {value} ({relative})
        </p>
      ) : null}
    </FieldBlock>
  )
}

function DateTimeField({
  label,
  value,
  onChange,
  helper,
  minuteStep,
  showRelativeHint = false,
  todayLabel = 'today',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  helper?: string
  minuteStep?: number
  showRelativeHint?: boolean
  todayLabel?: string
}) {
  const inputId = useId()
  const relative = showRelativeHint ? relativeDateTimeInputLabel(value, todayLabel) : ''
  const updateValue = (nextValue: string) => {
    if (!minuteStep) {
      onChange(nextValue)
      return
    }

    const nextDate = new Date(nextValue)
    onChange(Number.isNaN(nextDate.getTime()) ? nextValue : localDateTimeInput(nextDate, minuteStep))
  }

  return (
    <FieldBlock label={label} helper={helper} htmlFor={inputId}>
      <input
        id={inputId}
        type="datetime-local"
        step={minuteStep ? minuteStep * 60 : undefined}
        value={value}
        onChange={(event) => updateValue(event.target.value)}
        onInput={(event) => updateValue(event.currentTarget.value)}
        className="min-h-12 w-full rounded-lg border border-line bg-white px-3 py-2 text-base outline-none focus:border-calm focus:ring-2 focus:ring-calm/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      />
      {relative ? (
        <p className="mt-2 rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-calm dark:bg-teal-950 dark:text-teal-100">
          {value.replace('T', ' ')} ({relative})
        </p>
      ) : null}
    </FieldBlock>
  )
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const inputId = useId()

  return (
    <FieldBlock label={label} htmlFor={inputId}>
      <input
        id={inputId}
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-lg border border-line bg-white px-3 py-2 text-base outline-none focus:border-calm focus:ring-2 focus:ring-calm/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      />
    </FieldBlock>
  )
}

function PrimaryButton({ children, onClick, icon: Icon }: { children: ReactNode; onClick: () => void; icon?: typeof Home }) {
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-calm px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-800 sm:w-auto"
    >
      {Icon ? <Icon className="h-5 w-5" /> : null}
      {children}
    </button>
  )
}

function SecondaryButton({ children, onClick, icon: Icon }: { children: ReactNode; onClick: () => void; icon?: typeof Home }) {
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-calm/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:w-auto"
    >
      {Icon ? <Icon className="h-5 w-5" /> : null}
      {children}
    </button>
  )
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-calm" />
      <span>{label}</span>
    </label>
  )
}

function SavedMessage({ children }: { children: ReactNode }) {
  return <div className="rounded-lg bg-teal-50 p-3 text-sm font-semibold text-calm dark:bg-teal-950">{children}</div>
}

function makeCheckInForm(existing?: EveningCheckIn): EveningCheckIn {
  const now = new Date().toISOString()
  return {
    id: existing?.id ?? uid(),
    date: existing?.date ?? localDateKey(),
    moodRating: existing?.moodRating ?? '3',
    anxietySeverity: existing?.anxietySeverity ?? 'NONE',
    anxietyContributors: existing?.anxietyContributors ?? [],
    anxietyOtherText: existing?.anxietyOtherText ?? '',
    depressionSeverity: existing?.depressionSeverity ?? 'NONE',
    depressionSymptoms: existing?.depressionSymptoms ?? [],
    depressionContributors: existing?.depressionContributors ?? [],
    depressionOtherText: existing?.depressionOtherText ?? '',
    suspiciousness: existing?.suspiciousness ?? 'NOT_AT_ALL',
    unusualMeanings: existing?.unusualMeanings ?? 'NOT_AT_ALL',
    beliefCertainty: existing?.beliefCertainty ?? 'NOT_APPLICABLE',
    perceptualExperiences: existing?.perceptualExperiences ?? [],
    thinkingClarity: existing?.thinkingClarity ?? 'CLEAR',
    realityCheck: existing?.realityCheck ?? 'NOT_APPLICABLE',
    functioning: existing?.functioning ?? [],
    notes: existing?.notes ?? '',
    status: existing?.status ?? 'DRAFT',
    createdAt: existing?.createdAt ?? now,
    updatedAt: existing?.updatedAt ?? now,
  }
}

function categoryLabel(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ')
}

interface TrendDatum {
  date: string
  label: string
  sleep: number
  quality: number
  nightmares: number
  mood: number
  anxiety: number
  depression: number
  warning: number
  thinking: number
  substanceUse: number
  entries: number
}

function buildTrendRows(data: AppData, start?: string, end?: string, options: { showEmptyDays?: boolean } = {}) {
  const fallbackRange = completedDaysRange(7)
  const range = {
    start: start ?? fallbackRange.start,
    end: end ?? fallbackRange.end,
  }
  const dates = range.start <= range.end ? rangeDateKeys(range.start, range.end) : []
  const allRows: TrendDatum[] = dates.map((date) => {
    const sleep = data.sleepEntries.find((entry) => entry.date === date)
    const checkIn = data.eveningCheckIns.find((entry) => entry.date === date)
    const quickCheckIns = data.quickCheckIns
      .filter((entry) => entry.date === date)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const latestQuick = quickCheckIns.at(-1)
    const nightmares = data.nightmareEntries.filter((entry) => localDateKey(new Date(entry.occurredAt)) === date).length
    const journalEntries = data.journalEntries.filter((entry) => localDateKey(new Date(entry.createdAt)) === date).length
    const warning = Math.max(
      checkIn ? Math.max(warningScore[checkIn.suspiciousness], warningScore[checkIn.unusualMeanings]) : 0,
      latestQuick ? quickWarningScore[latestQuick.warningSigns] : 0,
    )
    const thinking =
      checkIn?.thinkingClarity === 'CLEAR'
        ? 0
        : checkIn?.thinkingClarity === 'SLIGHTLY_SCATTERED'
          ? 1
          : checkIn?.thinkingClarity === 'NOTICEABLY_SCATTERED'
            ? 2
            : checkIn
              ? 3
              : 0
    const substanceUse = quickCheckIns.filter((entry) => entry.substanceUse === 'YES').length
    const anxiety = Math.max(
      checkIn ? severityScore[checkIn.anxietySeverity] : 0,
      latestQuick ? quickAnxietyScore[latestQuick.anxiety] : 0,
    )
    const depression = Math.max(
      checkIn ? severityScore[checkIn.depressionSeverity] : 0,
      latestQuick ? quickDepressionScore[latestQuick.depression] : 0,
    )

    return {
      date,
      label: displayDate(date),
      sleep: sleep ? durationScore[sleep.durationCategory] : latestQuick ? durationScore[latestQuick.sleepDuration] : 0,
      quality: sleep ? qualityScore[sleep.quality] : 0,
      nightmares,
      mood: checkIn?.moodRating ? Number(checkIn.moodRating) : latestQuick ? quickMoodScore[latestQuick.mood] : 0,
      anxiety,
      depression,
      warning,
      thinking,
      substanceUse,
      entries: Number(Boolean(sleep)) + Number(Boolean(checkIn)) + nightmares + journalEntries + quickCheckIns.length,
    }
  })
  const chartData = options.showEmptyDays === false ? allRows.filter((item) => item.entries > 0) : allRows

  const average = (values: number[]) => {
    const recorded = values.filter((value) => value > 0)
    return recorded.length ? recorded.reduce((total, value) => total + value, 0) / recorded.length : 0
  }
  const labelSeverity = (value: number) => {
    if (value === 0) return 'No entries'
    if (value < 1.5) return 'Mild'
    if (value < 2.5) return 'Moderate'
    if (value < 3.5) return 'Severe'
    return 'Extreme'
  }
  const labelMood = (value: number) => {
    if (value === 0) return 'No entries'
    if (value < 1.5) return 'Awful mood'
    if (value < 2.5) return 'Low mood'
    if (value < 3.5) return 'Okay mood'
    if (value < 4.5) return 'Good mood'
    return 'Great mood'
  }

  return {
    chartData,
    totalDays: allRows.length,
    recordedDays: allRows.filter((item) => item.entries > 0).length,
    sleepLabel: average(allRows.map((item) => item.sleep)) ? `${average(allRows.map((item) => item.sleep)).toFixed(1)} hrs` : 'No entries',
    moodLabel: labelMood(average(allRows.map((item) => item.mood))),
    anxietyLabel: labelSeverity(average(allRows.map((item) => item.anxiety))),
    depressionLabel: labelSeverity(average(allRows.map((item) => item.depression))),
    warningDays: allRows.filter((item) => item.warning > 0).length,
    substanceUseDays: allRows.filter((item) => item.substanceUse > 0).length,
  }
}

export default App
