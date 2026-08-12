import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  BookOpenCheck,
  ChevronRight,
  LifeBuoy,
  ListChecks,
  MoonStar,
  Pause,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import {
  evidenceSources,
  recurringNightmareThemes,
  treatmentContentLastReviewed,
  treatmentPrograms,
  treatmentStatusLabels,
  treatmentUseModeLabels,
  type TreatmentContentItem,
} from './data/treatmentContent'
import {
  TreatmentModuleScreen,
  TreatmentProgramWorkspace,
} from './TreatmentProgramWorkspace'
import { displayDate, displayDateTime, localDateTimeInput } from './lib/dates'
import {
  currentStateBlocksProcessing,
  currentStateNeedsCrisisActions,
  getConfiguredCrisisContacts,
  markProgramOpened,
  summarizeProgramProgress,
  summarizeTreatmentNightmares,
  treatmentEntryScreenForContent,
  treatmentScreenAfterPause,
  type CurrentStateAnswers,
} from './lib/treatment'
import { deleteTreatmentData, db } from './storage/db'
import type {
  AppData,
  SupportContact,
  TreatmentNightmareEntry,
  TreatmentProgramId,
  TreatmentSettings,
  TreatmentUseMode,
} from './types'

type TreatmentScreen =
  | 'landing'
  | 'comparison'
  | 'evidence'
  | 'program'
  | 'module'
  | 'safety-check'
  | 'grounding'
  | 'nightmare'
  | 'preferences'

interface TreatmentPageProps {
  data: AppData
  initialScreen?: 'landing' | 'nightmare'
  onChanged: () => Promise<void>
  onExit: () => void
}

const uid = () => crypto.randomUUID()

export function TreatmentPage({
  data,
  initialScreen = 'landing',
  onChanged,
  onExit,
}: TreatmentPageProps) {
  const [screen, setScreen] = useState<TreatmentScreen>(initialScreen)
  const [programId, setProgramId] = useState<TreatmentProgramId>()
  const [moduleId, setModuleId] = useState<string>()
  const [groundingShowsCrisis, setGroundingShowsCrisis] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const program = treatmentPrograms.find((item) => item.id === programId)
  const module = program?.modules.find((item) => item.id === moduleId)

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [screen, programId, moduleId])

  const openProgram = async (nextProgramId: TreatmentProgramId) => {
    await db.treatmentProgress.put(markProgramOpened(data.treatmentProgress, nextProgramId))
    await onChanged()
    setProgramId(nextProgramId)
    setScreen('program')
  }

  const openModule = (nextModule: TreatmentContentItem) => {
    setModuleId(nextModule.id)
    setScreen(treatmentEntryScreenForContent(nextModule.requiresCurrentStateCheck))
  }

  const pauseAndGround = (showCrisis = false) => {
    setGroundingShowsCrisis(showCrisis)
    setScreen(treatmentScreenAfterPause())
  }

  const openNightmareSupport = () => {
    setScreen('nightmare')
  }

  const returnToProgram = () => setScreen(program ? 'program' : 'landing')

  return (
    <div>
      {screen !== 'landing' ? (
        <button
          type="button"
          onClick={() => {
            if (screen === 'module' || screen === 'safety-check') returnToProgram()
            else if (screen === 'program') setScreen('landing')
            else setScreen('landing')
          }}
          className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-bold text-calm outline-none hover:bg-teal-50 focus:ring-2 focus:ring-calm/30 dark:hover:bg-teal-950"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
      ) : null}

      {screen === 'landing' ? (
        <TreatmentLanding
          data={data}
          headingRef={headingRef}
          onChanged={onChanged}
          onCompare={() => setScreen('comparison')}
          onEvidence={() => setScreen('evidence')}
          onNightmare={openNightmareSupport}
          onOpenProgram={openProgram}
          onPause={() => pauseAndGround(false)}
          onPreferences={() => setScreen('preferences')}
        />
      ) : null}
      {screen === 'comparison' ? (
        <TreatmentComparisonScreen
          headingRef={headingRef}
          onOpenProgram={openProgram}
        />
      ) : null}
      {screen === 'evidence' ? <EvidenceScreen headingRef={headingRef} /> : null}
      {screen === 'program' && program ? (
        <TreatmentProgramWorkspace
          data={data}
          headingRef={headingRef}
          program={program}
          onChanged={onChanged}
          onModule={openModule}
          onNightmare={openNightmareSupport}
          onPause={() => pauseAndGround(false)}
        />
      ) : null}
      {screen === 'safety-check' && module ? (
        <CurrentStateCheck
          headingRef={headingRef}
          onContinue={() => setScreen('module')}
          onConcern={(showCrisis) => pauseAndGround(showCrisis)}
          onExit={onExit}
        />
      ) : null}
      {screen === 'module' && program && module ? (
        <TreatmentModuleScreen
          data={data}
          headingRef={headingRef}
          module={module}
          onChanged={onChanged}
          onLeave={returnToProgram}
          onNightmare={openNightmareSupport}
          onPause={() => pauseAndGround(false)}
          program={program}
        />
      ) : null}
      {screen === 'grounding' ? (
        <GroundingScreen
          contacts={data.supportContacts}
          headingRef={headingRef}
          onChanged={onChanged}
          onExit={onExit}
          onReturn={() => setScreen('landing')}
          settings={data.treatmentSettings}
          showCrisis={groundingShowsCrisis}
        />
      ) : null}
      {screen === 'nightmare' ? (
        <NightmareSupport
          data={data}
          headingRef={headingRef}
          onChanged={onChanged}
          onGround={() => pauseAndGround(false)}
        />
      ) : null}
      {screen === 'preferences' ? (
        <TreatmentPreferences
          data={data}
          headingRef={headingRef}
          onChanged={onChanged}
          onDeleted={() => setScreen('landing')}
        />
      ) : null}
    </div>
  )
}

function TreatmentLanding({
  data,
  headingRef,
  onChanged,
  onCompare,
  onEvidence,
  onNightmare,
  onOpenProgram,
  onPause,
  onPreferences,
}: {
  data: AppData
  headingRef: React.RefObject<HTMLHeadingElement | null>
  onChanged: () => Promise<void>
  onCompare: () => void
  onEvidence: () => void
  onNightmare: () => void
  onOpenProgram: (id: TreatmentProgramId) => Promise<void>
  onPause: () => void
  onPreferences: () => void
}) {
  const saveMode = async (useMode: TreatmentUseMode) => {
    const now = new Date().toISOString()
    await Promise.all([
      db.treatmentSettings.put({ ...data.treatmentSettings, useMode, updatedAt: now }),
      db.treatmentProgress.put({
        ...data.treatmentProgress,
        clinicianSupportedMode: useMode === 'alongside-therapist',
        updatedAt: now,
      }),
    ])
    await onChanged()
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold outline-none lg:text-4xl">Treatment</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted dark:text-slate-300">
          A self-guided therapeutic pathway with education, coping, structured worksheets, nightmare recovery, and progress review. No clinician unlock or supervision is required to use the included modules.
        </p>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-muted dark:text-slate-400">
          Salience does not diagnose, provide emergency care, or perform detailed trauma-memory processing, imaginal exposure, or active EMDR reprocessing. Optional reports can support a conversation with a clinician.
        </p>
        <button type="button" onClick={onEvidence} className="mt-2 min-h-11 text-sm font-bold text-calm underline decoration-calm/40 underline-offset-4 focus:outline-none focus:ring-2 focus:ring-calm/30">
          Evidence and limits
        </button>
      </div>

      {!data.treatmentSettings.useMode ? (
        <TreatmentCard className="border-calm/40 bg-teal-50 dark:border-teal-800 dark:bg-teal-950">
          <h2 className="text-xl font-bold">How would you like to use Treatment?</h2>
          <div className="mt-4 grid gap-2">
            {(Object.entries(treatmentUseModeLabels) as Array<[TreatmentUseMode, string]>).map(([value, label]) => (
              <button key={value} type="button" onClick={() => void saveMode(value)} className="min-h-12 rounded-lg border border-calm/30 bg-white px-4 py-3 text-left text-sm font-bold text-slate-900 outline-none hover:border-calm focus:ring-2 focus:ring-calm/30 dark:bg-slate-900 dark:text-slate-100">
                {label}
              </button>
            ))}
          </div>
        </TreatmentCard>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={onNightmare} className="min-h-32 rounded-lg border border-line bg-white p-5 text-left shadow-card outline-none hover:border-calm focus:ring-2 focus:ring-calm/30 dark:border-slate-800 dark:bg-slate-900">
          <MoonStar className="h-9 w-9 text-calm" />
          <span className="mt-4 block text-xl font-bold">Nightmare support</span>
          <span className="mt-1 block text-sm text-muted dark:text-slate-300">Orient first, then choose whether to log anything.</span>
        </button>
        <button type="button" onClick={onPause} className="min-h-32 rounded-lg border border-line bg-white p-5 text-left shadow-card outline-none hover:border-calm focus:ring-2 focus:ring-calm/30 dark:border-slate-800 dark:bg-slate-900">
          <Pause className="h-9 w-9 text-ocean" />
          <span className="mt-4 block text-xl font-bold">Pause and ground</span>
          <span className="mt-1 block text-sm text-muted dark:text-slate-300">Leave treatment content and return attention to the present.</span>
        </button>
      </section>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">Programs</h2>
          <div className="flex flex-wrap justify-end gap-1">
            <button type="button" onClick={onCompare} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold text-calm outline-none hover:bg-teal-50 focus:ring-2 focus:ring-calm/30 dark:hover:bg-teal-950">
              <ListChecks className="h-4 w-4" /> Compare
            </button>
            <button type="button" onClick={onPreferences} className="min-h-11 rounded-lg px-3 text-sm font-bold text-calm outline-none hover:bg-teal-50 focus:ring-2 focus:ring-calm/30 dark:hover:bg-teal-950">
              Preferences
            </button>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {treatmentPrograms.map((program) => {
            const status = data.treatmentProgress.programStatuses[program.id] ?? 'not-started'
            const lastOpened = data.treatmentProgress.lastOpenedPrograms[program.id]
            const progress = summarizeProgramProgress(
              program.modules.map((module) => module.id),
              data.treatmentResponses.filter((response) => response.programId === program.id),
            )
            return (
              <TreatmentCard key={program.id} className="flex flex-col">
                <div className="flex items-start gap-3">
                  <BookOpenCheck className="mt-0.5 h-7 w-7 shrink-0 text-calm" />
                  <div>
                    <h3 className="text-lg font-bold">{program.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted dark:text-slate-300">{program.description}</p>
                  </div>
                </div>
                <dl className="mt-4 grid gap-2 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-muted dark:text-slate-300">Status</dt><dd className="font-bold">{treatmentStatusLabels[status]}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-muted dark:text-slate-300">Pathway progress</dt><dd className="font-bold">{progress.completed} of {progress.total}</dd></div>
                  {lastOpened ? <div className="flex justify-between gap-3"><dt className="text-muted dark:text-slate-300">Last opened</dt><dd className="font-bold">{displayDate(lastOpened.slice(0, 10))}</dd></div> : null}
                </dl>
                <div
                  role="progressbar"
                  aria-label={`${program.name} pathway progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress.percent}
                  className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
                >
                  <div className="h-full bg-calm" style={{ width: `${progress.percent}%` }} />
                </div>
                <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <ShieldCheck className="mr-2 inline h-4 w-4" />
                  {program.guidanceLabel}
                </p>
                <button type="button" onClick={() => void onOpenProgram(program.id)} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-calm px-4 py-3 text-sm font-bold text-white outline-none hover:bg-teal-800 focus:ring-2 focus:ring-calm/30">
                  {status === 'not-started' ? 'Start pathway' : status === 'completed' ? 'Review pathway' : 'Continue pathway'}
                  <ChevronRight className="h-5 w-5" />
                </button>
              </TreatmentCard>
            )
          })}
        </div>
      </div>

      <p className="rounded-lg border border-line bg-slate-50 p-4 text-sm leading-6 text-muted dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        CPT and PE are themselves trauma-focused therapies. The four choices share some concepts, and no one option is universally best. You can explore more than one pathway and optionally discuss your records with a clinician.
      </p>
    </div>
  )
}


function CurrentStateCheck({
  headingRef,
  onContinue,
  onConcern,
  onExit,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>
  onContinue: () => void
  onConcern: (showCrisis: boolean) => void
  onExit: () => void
}) {
  const [answers, setAnswers] = useState<Partial<CurrentStateAnswers>>({})
  const questions: Array<{ key: keyof CurrentStateAnswers; label: string; safeAnswer: boolean }> = [
    { key: 'orientedToPresent', label: 'Can you tell where you are and recognise that the past event is not happening now?', safeAnswer: true },
    { key: 'ableToStop', label: 'Do you feel able to stop this exercise whenever you choose?', safeAnswer: true },
    { key: 'immediateDanger', label: 'Are you in immediate danger?', safeAnswer: false },
    { key: 'difficultyKnowingReality', label: 'Are you having difficulty knowing what is real or whether you are currently safe?', safeAnswer: false },
    { key: 'seriousHarmThoughts', label: 'Are you thinking about seriously harming yourself or someone else?', safeAnswer: false },
  ]
  const complete = questions.every((question) => answers[question.key] !== undefined)

  const continueFromCheck = () => {
    if (!complete) return
    const completeAnswers = answers as CurrentStateAnswers
    if (currentStateBlocksProcessing(completeAnswers)) {
      onConcern(currentStateNeedsCrisisActions(completeAnswers))
      return
    }
    onContinue()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold outline-none">Before you continue</h1>
        <p className="mt-2 text-sm leading-6 text-muted dark:text-slate-300">A brief present-state check. Your answers are not saved.</p>
      </div>
      <TreatmentCard>
        <div className="space-y-5">
          {questions.map((question) => (
            <fieldset key={question.key}>
              <legend className="text-sm font-bold leading-6">{question.label}</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[true, false].map((value) => (
                  <label key={String(value)} className={`flex min-h-12 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-bold ${answers[question.key] === value ? 'border-calm bg-teal-50 dark:bg-teal-950' : 'border-line dark:border-slate-700'}`}>
                    <input type="radio" name={question.key} value={String(value)} checked={answers[question.key] === value} onChange={() => setAnswers((current) => ({ ...current, [question.key]: value }))} className="sr-only" />
                    {value ? 'Yes' : 'No'}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </TreatmentCard>
      <button type="button" disabled={!complete} onClick={continueFromCheck} className="min-h-12 w-full rounded-lg bg-calm px-4 text-sm font-bold text-white disabled:opacity-50">Continue</button>
      <button type="button" onClick={onExit} className="min-h-12 w-full rounded-lg border border-line px-4 text-sm font-bold dark:border-slate-700">Leave Treatment</button>
    </div>
  )
}


function GroundingScreen({
  contacts,
  headingRef,
  onChanged,
  onExit,
  onReturn,
  settings,
  showCrisis,
}: {
  contacts: SupportContact[]
  headingRef: React.RefObject<HTMLHeadingElement | null>
  onChanged: () => Promise<void>
  onExit: () => void
  onReturn: () => void
  settings: TreatmentSettings
  showCrisis: boolean
}) {
  const [statement, setStatement] = useState(settings.realityStatement ?? '')
  const actions = ['Turn on a light', 'Place both feet on the floor', 'Notice five things around me', 'Take a drink', 'Contact a support person']
  const crisis = getConfiguredCrisisContacts(contacts)

  const saveStatement = async () => {
    await db.treatmentSettings.put({ ...settings, realityStatement: statement.trim() || undefined, updatedAt: new Date().toISOString() })
    await onChanged()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold outline-none">Pause and ground</h1>
        <p className="mt-2 text-sm leading-6 text-muted dark:text-slate-300">The exercise has stopped. No treatment or trauma prompts are shown here.</p>
      </div>
      {settings.realityStatement ? (
        <TreatmentCard className="border-calm/30 bg-teal-50 dark:bg-teal-950">
          <h2 className="text-sm font-bold text-calm dark:text-teal-100">My present-orientation statement</h2>
          <p className="mt-3 text-lg font-semibold leading-8">{settings.realityStatement}</p>
        </TreatmentCard>
      ) : null}
      <TreatmentCard>
        <label htmlFor="orientation-statement" className="text-sm font-bold">Personal reality statement (optional)</label>
        <p className="mt-1 text-xs leading-5 text-muted dark:text-slate-300">Write facts that are true and helpful for you now. Salience will not assume a statement is true.</p>
        <textarea id="orientation-statement" value={statement} onChange={(event) => setStatement(event.target.value)} rows={4} className="mt-3 w-full rounded-lg border border-line bg-white px-3 py-2 text-base outline-none focus:border-calm focus:ring-2 focus:ring-calm/20 dark:border-slate-700 dark:bg-slate-950" />
        <button type="button" onClick={() => void saveStatement()} className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-lg bg-calm px-4 text-sm font-bold text-white"><Save className="h-5 w-5" /> Save statement</button>
      </TreatmentCard>
      <TreatmentCard>
        <h2 className="text-lg font-bold">Optional grounding actions</h2>
        <div className="mt-3 space-y-2">
          {actions.map((action) => (
            <label key={action} className="flex min-h-12 items-center gap-3 rounded-lg border border-line px-3 dark:border-slate-700">
              <input type="checkbox" className="h-5 w-5 accent-calm" />
              <span className="text-sm font-semibold">{action}</span>
            </label>
          ))}
        </div>
      </TreatmentCard>
      {showCrisis ? <SupportPlan contacts={contacts} /> : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={onReturn} className="min-h-12 rounded-lg bg-calm px-4 text-sm font-bold text-white">Treatment home</button>
        <button type="button" onClick={onExit} className="min-h-12 rounded-lg border border-line px-4 text-sm font-bold dark:border-slate-700">Leave Treatment</button>
      </div>
      {showCrisis && crisis.emergency?.phone ? <a href={`tel:${crisis.emergency.phone}`} className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-line text-sm font-bold text-slate-700 dark:border-slate-700 dark:text-slate-100"><Phone className="h-5 w-5" /> Emergency {crisis.emergency.phone}</a> : null}
    </div>
  )
}

function NightmareSupport({
  data,
  headingRef,
  onChanged,
  onGround,
}: {
  data: AppData
  headingRef: React.RefObject<HTMLHeadingElement | null>
  onChanged: () => Promise<void>
  onGround: () => void
}) {
  const [timestamp, setTimestamp] = useState(localDateTimeInput())
  const [intensity, setIntensity] = useState(5)
  const [recoveryMinutes, setRecoveryMinutes] = useState('')
  const [returnedToSleep, setReturnedToSleep] = useState<TreatmentNightmareEntry['returnedToSleep']>()
  const [notes, setNotes] = useState('')
  const [trigger, setTrigger] = useState('')
  const [nextDayEffect, setNextDayEffect] = useState('')
  const [linkedSleepEntryId, setLinkedSleepEntryId] = useState('')
  const [themeTags, setThemeTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [message, setMessage] = useState('')
  const summary = useMemo(() => summarizeTreatmentNightmares(data.treatmentNightmares, data.sleepEntries), [data.sleepEntries, data.treatmentNightmares])

  const toggleTheme = (tag: string) => setThemeTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])

  const saveNightmare = async () => {
    if (!timestamp) {
      setMessage('Choose an approximate date and time.')
      return
    }
    const now = new Date().toISOString()
    const entry: TreatmentNightmareEntry = {
      id: uid(),
      timestamp: new Date(timestamp).toISOString(),
      intensity,
      recoveryMinutes: recoveryMinutes ? Math.max(0, Number(recoveryMinutes)) : undefined,
      returnedToSleep,
      themeTags,
      customTags: customTag.trim() ? customTag.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
      notes: notes.trim() || undefined,
      suspectedTrigger: trigger.trim() || undefined,
      nextDayEffect: nextDayEffect.trim() || undefined,
      linkedSleepEntryId: linkedSleepEntryId || undefined,
      createdAt: now,
      updatedAt: now,
    }
    await db.treatmentNightmares.put(entry)
    setNotes('')
    setTrigger('')
    setNextDayEffect('')
    setCustomTag('')
    setThemeTags([])
    await onChanged()
    setMessage('Nightmare entry saved locally.')
  }

  const deleteEntry = async (id: string) => {
    if (!window.confirm('Delete this nightmare support entry?')) return
    await db.treatmentNightmares.delete(id)
    await onChanged()
  }

  const setThemePreference = async (enabled: boolean) => {
    await db.treatmentSettings.put({ ...data.treatmentSettings, useRecurringNightmareThemes: enabled, updatedAt: new Date().toISOString() })
    await onChanged()
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold outline-none">Nightmare support</h1>
        <p className="mt-2 text-sm leading-6 text-muted dark:text-slate-300">Ground first. A detailed description is never required, and Salience does not interpret nightmares.</p>
      </div>
      <button type="button" onClick={onGround} className="flex min-h-24 w-full items-center gap-4 rounded-lg bg-calm p-5 text-left text-white outline-none focus:ring-2 focus:ring-calm/30">
        <MoonStar className="h-10 w-10 shrink-0" />
        <span><span className="block text-xl font-bold">I just woke from a nightmare</span><span className="mt-1 block text-sm text-white/90">Show present-orientation tools now</span></span>
      </button>
      <TreatmentCard>
        <h2 className="text-xl font-bold">Nightmare log</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Approximate date and time">
            <input type="datetime-local" value={timestamp} onChange={(event) => setTimestamp(event.target.value)} className={inputClass} />
          </Field>
          <Field label={`Intensity: ${intensity}/10`}>
            <input type="range" min="0" max="10" step="1" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} className="min-h-12 w-full accent-calm" aria-label="Nightmare intensity from 0 to 10" />
          </Field>
          <Field label="Minutes to feel oriented again (optional)">
            <input type="number" min="0" inputMode="numeric" value={recoveryMinutes} onChange={(event) => setRecoveryMinutes(event.target.value)} className={inputClass} />
          </Field>
          <Field label="Returned to sleep (optional)">
            <select value={returnedToSleep ?? ''} onChange={(event) => setReturnedToSleep((event.target.value || undefined) as TreatmentNightmareEntry['returnedToSleep'])} className={inputClass}>
              <option value="">Not recorded</option><option value="YES">Yes</option><option value="NO">No</option><option value="UNSURE">Unsure</option>
            </select>
          </Field>
          <Field label="Link to a sleep entry (optional)">
            <select value={linkedSleepEntryId} onChange={(event) => setLinkedSleepEntryId(event.target.value)} className={inputClass}>
              <option value="">Do not link</option>
              {[...data.sleepEntries].reverse().map((entry) => <option key={entry.id} value={entry.id}>{displayDate(entry.date)}</option>)}
            </select>
          </Field>
        </div>
        <label className="mt-4 flex min-h-12 items-center gap-3 rounded-lg border border-line px-3 text-sm font-semibold dark:border-slate-700">
          <input type="checkbox" checked={data.treatmentSettings.useRecurringNightmareThemes} onChange={(event) => void setThemePreference(event.target.checked)} className="h-5 w-5 accent-calm" />
          Use my recurring nightmare themes
        </label>
        {data.treatmentSettings.useRecurringNightmareThemes ? (
          <fieldset className="mt-4">
            <legend className="text-sm font-bold">Optional theme tags</legend>
            <p className="mt-1 text-xs leading-5 text-muted dark:text-slate-300">These user-identified themes include detention, attack, pursuit, being lost, belongings, and transport home. Salience records tags without interpreting why a nightmare happened or inferring risk.</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {recurringNightmareThemes.map((tag) => (
                <label key={tag} className={`flex min-h-12 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${themeTags.includes(tag) ? 'border-calm bg-teal-50 dark:bg-teal-950' : 'border-line dark:border-slate-700'}`}>
                  <input type="checkbox" checked={themeTags.includes(tag)} onChange={() => toggleTheme(tag)} className="h-5 w-5 accent-calm" /> {tag}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
        <div className="mt-4 space-y-4">
          <Field label="Custom tags (optional, comma separated)"><input value={customTag} onChange={(event) => setCustomTag(event.target.value)} className={inputClass} /></Field>
          <Field label="Notes (optional)"><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className={textareaClass} /></Field>
          <Field label="Suspected daytime trigger (optional)"><textarea value={trigger} onChange={(event) => setTrigger(event.target.value)} rows={2} className={textareaClass} /></Field>
          <Field label="Effect on the following day (optional)"><textarea value={nextDayEffect} onChange={(event) => setNextDayEffect(event.target.value)} rows={2} className={textareaClass} /></Field>
        </div>
        <button type="button" onClick={() => void saveNightmare()} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-calm px-4 text-sm font-bold text-white sm:w-auto"><Save className="h-5 w-5" /> Save nightmare entry</button>
        {message ? <p role="status" className="mt-3 rounded-lg bg-teal-50 p-3 text-sm font-bold text-calm dark:bg-teal-950">{message}</p> : null}
      </TreatmentCard>
      <RecoveryPlan data={data} onChanged={onChanged} />
      <TreatmentCard>
        <h2 className="text-xl font-bold">Pattern review</h2>
        <p className="mt-1 text-sm text-muted dark:text-slate-300">Neutral summaries of what you chose to record. No dream interpretation is performed.</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <SummaryItem label="Entries" value={String(data.treatmentNightmares.length)} />
          <SummaryItem label="Average intensity" value={data.treatmentNightmares.length ? `${summary.averageIntensity.toFixed(1)}/10` : 'No entries'} />
          <SummaryItem label="Average recovery time" value={summary.averageRecoveryMinutes ? `${summary.averageRecoveryMinutes.toFixed(0)} minutes` : 'Not enough data'} />
          <SummaryItem label="Common selected tags" value={summary.commonTags.length ? summary.commonTags.map(([tag, count]) => `${tag} (${count})`).join(', ') : 'No tags selected'} />
        </dl>
        <div className="mt-4">
          <h3 className="text-sm font-bold">Frequency by week</h3>
          {Object.keys(summary.frequencyByWeek).length ? (
            <ul className="mt-2 space-y-2">
              {Object.entries(summary.frequencyByWeek).sort((a, b) => b[0].localeCompare(a[0])).map(([week, count]) => <li key={week} className="flex justify-between rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800"><span>Week of {displayDate(week)}</span><strong>{count}</strong></li>)}
            </ul>
          ) : <p className="mt-2 text-sm text-muted">No entries yet.</p>}
        </div>
        <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm leading-6 text-muted dark:bg-slate-800 dark:text-slate-300">{summary.linkedSleepSummary}</p>
      </TreatmentCard>
      {data.treatmentNightmares.length ? (
        <TreatmentCard>
          <h2 className="text-xl font-bold">Saved entries</h2>
          <div className="mt-3 space-y-2">
            {[...data.treatmentNightmares].reverse().map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 rounded-lg border border-line p-3 dark:border-slate-700">
                <div><p className="font-bold">{displayDateTime(entry.timestamp)}</p><p className="text-sm text-muted">Intensity {entry.intensity}/10{entry.recoveryMinutes !== undefined ? ` · ${entry.recoveryMinutes} min to orient` : ''}</p></div>
                <button type="button" onClick={() => void deleteEntry(entry.id)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-clay outline-none hover:bg-red-50 focus:ring-2 focus:ring-clay/30 dark:hover:bg-red-950" aria-label={`Delete nightmare entry from ${displayDateTime(entry.timestamp)}`}><Trash2 className="h-5 w-5" /></button>
              </div>
            ))}
          </div>
        </TreatmentCard>
      ) : null}
    </div>
  )
}

function RecoveryPlan({ data, onChanged }: { data: AppData; onChanged: () => Promise<void> }) {
  const settings = data.treatmentSettings
  const [statement, setStatement] = useState(settings.realityStatement ?? '')
  const [actions, setActions] = useState(settings.groundingActions.join(', '))
  const [hidden, setHidden] = useState(settings.hiddenAfterWakingPrompts.join(', '))

  const save = async () => {
    await db.treatmentSettings.put({
      ...settings,
      realityStatement: statement.trim() || undefined,
      groundingActions: actions.split(',').map((item) => item.trim()).filter(Boolean),
      hiddenAfterWakingPrompts: hidden.split(',').map((item) => item.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(),
    })
    await onChanged()
  }

  return (
    <TreatmentCard>
      <h2 className="text-xl font-bold">Recovery plan</h2>
      <div className="mt-4 space-y-4">
        <Field label="Personal reality statement"><textarea value={statement} onChange={(event) => setStatement(event.target.value)} rows={3} className={textareaClass} /></Field>
        <Field label="Grounding actions that usually help (comma separated)"><input value={actions} onChange={(event) => setActions(event.target.value)} className={inputClass} /></Field>
        <Field label="What I prefer not to be shown immediately after waking (comma separated)"><input value={hidden} onChange={(event) => setHidden(event.target.value)} className={inputClass} /></Field>
        <ContactSelect label="Trusted contact" value={settings.trustedContactId ?? ''} contacts={data.supportContacts} onChange={(trustedContactId) => void db.treatmentSettings.put({ ...settings, trustedContactId: trustedContactId || undefined, updatedAt: new Date().toISOString() }).then(onChanged)} />
        <ContactSelect label="Clinician contact" value={settings.clinicianContactId ?? ''} contacts={data.supportContacts} onChange={(clinicianContactId) => void db.treatmentSettings.put({ ...settings, clinicianContactId: clinicianContactId || undefined, updatedAt: new Date().toISOString() }).then(onChanged)} />
        <ContactSelect label="Crisis contact" value={settings.crisisContactId ?? ''} contacts={data.supportContacts} onChange={(crisisContactId) => void db.treatmentSettings.put({ ...settings, crisisContactId: crisisContactId || undefined, updatedAt: new Date().toISOString() }).then(onChanged)} />
      </div>
      <button type="button" onClick={() => void save()} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-lg bg-calm px-4 text-sm font-bold text-white"><Save className="h-5 w-5" /> Save recovery plan</button>
      <p className="mt-3 text-xs text-muted">Audio is not added because Salience does not currently store calming audio.</p>
    </TreatmentCard>
  )
}

function TreatmentPreferences({
  data,
  headingRef,
  onChanged,
  onDeleted,
}: {
  data: AppData
  headingRef: React.RefObject<HTMLHeadingElement | null>
  onChanged: () => Promise<void>
  onDeleted: () => void
}) {
  const updateMode = async (useMode: TreatmentUseMode) => {
    await Promise.all([
      db.treatmentSettings.put({ ...data.treatmentSettings, useMode, updatedAt: new Date().toISOString() }),
      db.treatmentProgress.put({ ...data.treatmentProgress, clinicianSupportedMode: useMode === 'alongside-therapist', updatedAt: new Date().toISOString() }),
    ])
    await onChanged()
  }
  const updateReminder = async (partial: Partial<Pick<
    TreatmentSettings,
    'activityReminderEnabled' | 'activityReminderTime' | 'appointmentReminderEnabled' | 'appointmentReminderLeadHours'
  >>) => {
    await db.treatmentSettings.put({
      ...data.treatmentSettings,
      ...partial,
      updatedAt: new Date().toISOString(),
    })
    await onChanged()
  }
  const removeData = async () => {
    if (!window.confirm('Delete all Treatment worksheets, progress, recovery-plan settings, and Treatment nightmare entries? Other Salience check-ins will remain.')) return
    await deleteTreatmentData()
    await onChanged()
    onDeleted()
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold outline-none">Treatment preferences</h1>
        <p className="mt-2 text-sm text-muted dark:text-slate-300">Treatment data is stored locally in this app’s IndexedDB database. Salience does not currently claim encryption, biometric locking, cloud sync, or analytics.</p>
      </div>
      <TreatmentCard>
        <h2 className="text-lg font-bold">How I use Treatment</h2>
        <div className="mt-3 grid gap-2">
          {(Object.entries(treatmentUseModeLabels) as Array<[TreatmentUseMode, string]>).map(([value, label]) => (
            <label key={value} className={`flex min-h-12 items-center gap-3 rounded-lg border px-3 text-sm font-semibold ${data.treatmentSettings.useMode === value ? 'border-calm bg-teal-50 dark:bg-teal-950' : 'border-line dark:border-slate-700'}`}>
              <input type="radio" name="treatment-use-mode" checked={data.treatmentSettings.useMode === value} onChange={() => void updateMode(value)} className="h-5 w-5 accent-calm" /> {label}
            </label>
          ))}
        </div>
      </TreatmentCard>
      <TreatmentCard>
        <h2 className="text-lg font-bold">Private activity reminder</h2>
        <label className="mt-3 flex min-h-12 items-center justify-between gap-4 rounded-lg border border-line px-3 dark:border-slate-700">
          <span className="text-sm font-semibold">Daily neutral reminder</span>
          <input
            type="checkbox"
            checked={data.treatmentSettings.activityReminderEnabled}
            onChange={(event) => void updateReminder({ activityReminderEnabled: event.target.checked })}
            className="h-5 w-5 accent-calm"
          />
        </label>
        {data.treatmentSettings.activityReminderEnabled ? (
          <div className="mt-4">
            <Field label="Reminder time">
              <input
                type="time"
                value={data.treatmentSettings.activityReminderTime}
                onChange={(event) => void updateReminder({ activityReminderTime: event.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
        ) : null}
        <label className="mt-3 flex min-h-12 items-center justify-between gap-4 rounded-lg border border-line px-3 dark:border-slate-700">
          <span className="text-sm font-semibold">Upcoming appointment reminder</span>
          <input
            type="checkbox"
            checked={data.treatmentSettings.appointmentReminderEnabled}
            onChange={(event) => void updateReminder({ appointmentReminderEnabled: event.target.checked })}
            className="h-5 w-5 accent-calm"
          />
        </label>
        {data.treatmentSettings.appointmentReminderEnabled ? (
          <div className="mt-4">
            <Field label="Remind me before">
              <select
                value={data.treatmentSettings.appointmentReminderLeadHours}
                onChange={(event) => void updateReminder({ appointmentReminderLeadHours: Number(event.target.value) })}
                className={inputClass}
              >
                <option value={1}>1 hour</option>
                <option value={12}>12 hours</option>
                <option value={24}>1 day</option>
                <option value={48}>2 days</option>
                <option value={168}>1 week</option>
              </select>
            </Field>
          </div>
        ) : null}
        <p className="mt-3 text-xs leading-5 text-muted dark:text-slate-300">
          Notifications use neutral wording only. Device notifications must also be enabled in Salience Settings.
        </p>
        {!data.appSettings.notificationsEnabled ? <p className="mt-2 text-xs font-bold text-ocean dark:text-blue-200">Salience notifications are currently off.</p> : null}
      </TreatmentCard>
      <TreatmentCard>
        <h2 className="text-lg font-bold">Hidden exercise prompts</h2>
        <p className="mt-2 text-sm leading-6 text-muted dark:text-slate-300">
          {data.treatmentSettings.hiddenTreatmentPromptIds.length
            ? `${data.treatmentSettings.hiddenTreatmentPromptIds.length} prompt${data.treatmentSettings.hiddenTreatmentPromptIds.length === 1 ? ' is' : 's are'} hidden in future records.`
            : 'No exercise prompts are hidden.'}
        </p>
        {data.treatmentSettings.hiddenTreatmentPromptIds.length ? (
          <button
            type="button"
            onClick={() => void db.treatmentSettings.put({
              ...data.treatmentSettings,
              hiddenTreatmentPromptIds: [],
              updatedAt: new Date().toISOString(),
            }).then(onChanged)}
            className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-lg border border-line px-4 text-sm font-bold dark:border-slate-700"
          >
            Show all prompts again
          </button>
        ) : null}
      </TreatmentCard>
      <TreatmentCard>
        <h2 className="text-lg font-bold">Delete Treatment data</h2>
        <p className="mt-2 text-sm leading-6 text-muted dark:text-slate-300">Deletes only Treatment progress, worksheets, recovery plan, and Treatment nightmare entries. Existing sleep, check-in, journal, quote, and support-contact data remains.</p>
        <button type="button" onClick={() => void removeData()} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-lg border border-clay px-4 text-sm font-bold text-clay"><Trash2 className="h-5 w-5" /> Delete all Treatment data</button>
      </TreatmentCard>
    </div>
  )
}

function TreatmentComparisonScreen({
  headingRef,
  onOpenProgram,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>
  onOpenProgram: (id: TreatmentProgramId) => Promise<void>
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold outline-none">Compare treatment options</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted dark:text-slate-300">
          A neutral overview for choosing what to explore or preparing a conversation with a qualified clinician. It does not assess which treatment is suitable for you or rank one option above another.
        </p>
      </div>

      <p className="rounded-lg border border-line bg-slate-50 p-4 text-sm leading-6 text-muted dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        CPT and PE are forms of trauma-focused CBT. Treatment structure, length, pacing, and fit vary by person and service. Salience records your choices but does not prescribe a program.
      </p>

      <div className="divide-y divide-line border-y border-line dark:divide-slate-800 dark:border-slate-800">
        {treatmentPrograms.map((program) => (
          <section key={program.id} aria-labelledby={`${program.id}-comparison-heading`} className="py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-3xl">
                <h2 id={`${program.id}-comparison-heading`} className="text-xl font-bold">{program.name}</h2>
                <p className="mt-2 text-sm leading-6 text-muted dark:text-slate-300">{program.description}</p>
              </div>
              <button type="button" onClick={() => void onOpenProgram(program.id)} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-calm px-4 py-3 text-sm font-bold text-white outline-none hover:bg-teal-800 focus:ring-2 focus:ring-calm/30">
                Explore <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <dl className="mt-5 grid gap-4 lg:grid-cols-3">
              <div>
                <dt className="text-xs font-bold uppercase text-calm">Main focus</dt>
                <dd className="mt-2 text-sm leading-6">{program.comparison.focus}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-ocean dark:text-blue-300">Not performed by Salience</dt>
                <dd className="mt-2 text-sm leading-6">{program.comparison.outsideThisPathway}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-muted dark:text-slate-300">Salience pathway includes</dt>
                <dd className="mt-2 text-sm leading-6">{program.comparison.salienceRole}</dd>
              </div>
            </dl>
            <div className="mt-5">
              <h3 className="text-sm font-bold">Optional questions for a clinician</h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-muted dark:text-slate-300">
                {program.comparison.questionsToDiscuss.map((question) => <li key={question}>{question}</li>)}
              </ul>
            </div>
            <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <ShieldCheck className="h-4 w-4" /> {program.guidanceLabel}
            </p>
          </section>
        ))}
      </div>
    </div>
  )
}

function EvidenceScreen({ headingRef }: { headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold outline-none">Evidence and limits</h1>
        <p className="mt-2 text-sm leading-6 text-muted dark:text-slate-300">Content last reviewed in Salience on {displayDate(treatmentContentLastReviewed)}. All clinical copy remains pending professional review.</p>
      </div>
      <TreatmentCard>
        <h2 className="text-xl font-bold">What the programs are</h2>
        <div className="mt-3 space-y-3">
          {treatmentPrograms.map((program) => <div key={program.id}><h3 className="font-bold">{program.name}</h3><p className="mt-1 text-sm leading-6 text-muted dark:text-slate-300">{program.description}</p></div>)}
        </div>
        <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm leading-6 dark:bg-slate-800">The included modules are designed for independent use after professional review. CPT and PE are trauma-focused therapies, and the four pathways share some concepts. Salience does not rank one as universally best.</p>
      </TreatmentCard>
      <TreatmentCard>
        <h2 className="text-xl font-bold">Limits</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted dark:text-slate-300">
          <li>Salience does not diagnose PTSD, psychosis, or any other condition.</li>
          <li>Salience is not an emergency service and does not prevent you from seeking qualified care.</li>
          <li>Included exercises are self-guided and do not require a clinician unlock or supervision.</li>
          <li>The CPT companion can be followed from entry questions through consolidation, but reviewing every module does not establish formal CPT completion, clinical readiness, or treatment response.</li>
          <li>Information-only pages explain detailed trauma-memory processing, imaginal exposure, and active EMDR reprocessing, but the app does not perform those procedures.</li>
          <li>Nightmare tags and text are recorded without automated interpretation.</li>
          <li>Salience progress ratings are personal tracking items, not diagnostic measures. Any clinician-supplied score is stored without interpretation.</li>
          <li>Clinician reports contain only records you select and are not a diagnosis or clinical record.</li>
          <li>All treatment content remains pending professional review and is not yet clinically validated.</li>
        </ul>
      </TreatmentCard>
      <TreatmentCard>
        <h2 className="text-xl font-bold">Sources</h2>
        <div className="mt-3 space-y-3">
          {evidenceSources.map((source) => (
            <a key={source.sourceTitle} href={source.sourceUrl} target="_blank" rel="noreferrer" className="block min-h-12 rounded-lg border border-line p-3 outline-none hover:border-calm focus:ring-2 focus:ring-calm/30 dark:border-slate-700">
              <strong className="block">{source.sourceTitle}</strong>
              <span className="mt-1 block text-sm text-muted dark:text-slate-300">{source.sourceOrganisation} · {source.sourcePublicationOrReviewYear}</span>
            </a>
          ))}
        </div>
      </TreatmentCard>
    </div>
  )
}


function SupportPlan({ contacts }: { contacts: SupportContact[] }) {
  const configured = getConfiguredCrisisContacts(contacts)
  const ordered = [configured.emergency, configured.briefSupport, configured.crisisTeam, ...configured.personal].filter(Boolean) as SupportContact[]
  return (
    <TreatmentCard className="border-ocean/30 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
      <div className="flex items-start gap-3">
        <LifeBuoy className="h-7 w-7 shrink-0 text-ocean dark:text-blue-200" />
        <div><h2 className="text-lg font-bold">Your support plan</h2><p className="mt-1 text-sm leading-6 text-muted dark:text-slate-300">You stay in control of which support to contact.</p></div>
      </div>
      <div className="mt-3 space-y-2">
        {ordered.map((contact) => (
          <div key={contact.id} className="flex items-center justify-between gap-3 rounded-lg bg-white p-3 dark:bg-slate-900">
            <div><p className="font-bold">{contact.name}</p><p className="text-xs text-muted">{contact.role}</p></div>
            {contact.phone ? <a href={`tel:${contact.phone}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-calm px-3 text-sm font-bold text-white"><Phone className="h-4 w-4" /> {contact.phone}</a> : null}
          </div>
        ))}
      </div>
    </TreatmentCard>
  )
}

function ContactSelect({ label, value, contacts, onChange }: { label: string; value: string; contacts: SupportContact[]; onChange: (value: string) => void }) {
  return <Field label={label}><select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}><option value="">Not configured</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name} · {contact.role}</option>)}</select></Field>
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800"><dt className="text-xs font-bold uppercase text-muted dark:text-slate-300">{label}</dt><dd className="mt-2 text-sm font-bold">{value}</dd></div>
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="text-sm font-bold">{label}</span><span className="mt-2 block">{children}</span></label>
}

function TreatmentCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-line bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-5 ${className}`}>{children}</section>
}

const inputClass = 'min-h-12 w-full rounded-lg border border-line bg-white px-3 text-base outline-none focus:border-calm focus:ring-2 focus:ring-calm/20 dark:border-slate-700 dark:bg-slate-950'
const textareaClass = 'w-full rounded-lg border border-line bg-white px-3 py-2 text-base outline-none focus:border-calm focus:ring-2 focus:ring-calm/20 dark:border-slate-700 dark:bg-slate-950'
