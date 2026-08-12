import { useMemo, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  EyeOff,
  FileText,
  Gauge,
  History,
  MoonStar,
  Pause,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Target,
  Trash2,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  cptEntryModuleByPoint,
  treatmentStatusLabels,
  type TreatmentContentItem,
  type TreatmentProgram,
  type TreatmentPrompt,
} from './data/treatmentContent'
import { displayDate, displayDateTime, localDateKey, localDateTimeInput } from './lib/dates'
import { saveBlobFile } from './lib/fileExport'
import {
  buildTreatmentVisitBrief,
  defaultTreatmentProgramPlan,
  filterTreatmentReviewsByDate,
  findTreatmentReviewDateConflict,
  isProgramReadyToComplete,
  summarizePhaseProgress,
  summarizeClinicianMeasures,
  summarizeProgramProgress,
  summarizeTreatmentActivities,
  summarizeTreatmentReviews,
  treatmentReviewDateIsFuture,
  validateClinicianMeasure,
} from './lib/treatment'
import { db } from './storage/db'
import type {
  AppData,
  TreatmentActivity,
  TreatmentActivitySource,
  TreatmentActivityStatus,
  TreatmentNightmareEntry,
  TreatmentPacingPreference,
  TreatmentProgramPlan,
  TreatmentProgramStatus,
  TreatmentResponse,
  TreatmentReview,
  TreatmentSession,
  TreatmentSessionStatus,
} from './types'

type WorkspaceTab = 'modules' | 'plan' | 'appointments' | 'progress' | 'share'

interface ProgramWorkspaceProps {
  data: AppData
  headingRef: RefObject<HTMLHeadingElement | null>
  program: TreatmentProgram
  onChanged: () => Promise<void>
  onModule: (module: TreatmentContentItem) => void
  onNightmare: () => void
  onPause: () => void
}

const uid = () => crypto.randomUUID()

export function TreatmentProgramWorkspace({
  data,
  headingRef,
  program,
  onChanged,
  onModule,
  onNightmare,
  onPause,
}: ProgramWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('modules')
  const status = data.treatmentProgress.programStatuses[program.id] ?? 'not-started'
  const responses = data.treatmentResponses.filter((response) => response.programId === program.id)
  const activities = data.treatmentActivities.filter((activity) => activity.programId === program.id)
  const sessions = data.treatmentSessions.filter((session) => session.programId === program.id)
  const reviews = data.treatmentReviews.filter((review) => review.programId === program.id)
  const plan = data.treatmentProgramPlans.find((item) => item.programId === program.id)
  const progress = summarizeProgramProgress(program.modules.map((module) => module.id), responses)
  const readyToComplete = isProgramReadyToComplete(program.modules.map((module) => module.id), responses)
  const completedModuleIds = new Set(
    responses.filter((response) => response.status === 'completed').map((response) => response.moduleId),
  )
  const cptEntryPoint = program.id === 'cpt'
    ? responses.find((response) => response.moduleId === 'course-intake' && response.status === 'completed')?.values['entry-point']
    : undefined
  const cptGuidedModuleId = cptEntryPoint
    ? cptEntryModuleByPoint[cptEntryPoint as keyof typeof cptEntryModuleByPoint]
    : undefined
  const cptGuidedStartModule = cptGuidedModuleId
    ? program.modules.find((module) => module.id === cptGuidedModuleId)
    : undefined
  const plannedNextModule = program.modules.find((module) => module.id === plan?.nextModuleId && !completedModuleIds.has(module.id))
  const guidedNextModule = cptGuidedModuleId
    ? program.modules.find((module) => module.id === cptGuidedModuleId && !completedModuleIds.has(module.id))
    : undefined
  const nextModule = plannedNextModule
    ?? guidedNextModule
    ?? program.modules.find((module) => module.id === progress.nextModuleId)
  const [statusMessage, setStatusMessage] = useState('')

  const updateStatus = async (nextStatus: TreatmentProgramStatus) => {
    if (nextStatus === 'completed' && !readyToComplete) {
      setStatusMessage(`Review all ${progress.total} modules before completing this pathway.`)
      return
    }
    await db.treatmentProgress.put({
      ...data.treatmentProgress,
      programStatuses: { ...data.treatmentProgress.programStatuses, [program.id]: nextStatus },
      clinicianSupportedMode: data.treatmentProgress.clinicianSupportedMode || nextStatus === 'clinician-supported',
      updatedAt: new Date().toISOString(),
    })
    await onChanged()
    setStatusMessage(nextStatus === 'completed' ? 'Pathway marked complete on this device.' : '')
  }

  const tabs: Array<{ id: WorkspaceTab; label: string; icon: typeof FileText }> = [
    { id: 'modules', label: 'Modules', icon: FileText },
    { id: 'plan', label: 'Plan', icon: Target },
    { id: 'appointments', label: 'Visits', icon: CalendarDays },
    { id: 'progress', label: 'Progress', icon: Gauge },
    { id: 'share', label: 'Report', icon: Download },
  ]

  const moveTabFocus = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    const requestedIndex = event.key === 'ArrowRight'
      ? (currentIndex + 1) % tabs.length
      : event.key === 'ArrowLeft'
        ? (currentIndex - 1 + tabs.length) % tabs.length
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? tabs.length - 1
            : undefined
    if (requestedIndex === undefined) return
    event.preventDefault()
    const nextTab = tabs[requestedIndex]
    setActiveTab(nextTab.id)
    document.getElementById(`${program.id}-${nextTab.id}-tab`)?.focus()
  }

  return (
    <div className="space-y-4">
      <TreatmentExerciseToolbar onNightmare={onNightmare} onPause={onPause} />
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold outline-none">{program.name}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted dark:text-slate-300">{program.description}</p>
        {program.id === 'cpt' && cptGuidedStartModule ? (
          <p className="mt-3 rounded-lg border border-calm/30 bg-teal-50 px-3 py-2 text-sm leading-6 text-slate-700 dark:border-teal-800 dark:bg-teal-950 dark:text-slate-200">
            Starting focus from your course answers: <span className="font-bold">{cptGuidedStartModule.title}</span>. You can change this focus or open any stage at any time.
          </p>
        ) : null}
      </div>

      <section className="grid gap-3 border-y border-line py-4 dark:border-slate-800 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-bold">Pathway progress</span>
            <span>{progress.completed} of {progress.total} modules reviewed</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden="true">
            <div className="h-full bg-calm transition-[width] motion-reduce:transition-none" style={{ width: `${progress.percent}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted dark:text-slate-400">
            {progress.drafts ? `${progress.drafts} saved draft${progress.drafts === 1 ? '' : 's'}. ` : ''}
            Completion means you reviewed a Salience module; it is not a clinical outcome score.
          </p>
        </div>
        <label className="block min-w-52 text-sm font-bold">
          Program status
          <select
            value={status}
            onChange={(event) => void updateStatus(event.target.value as TreatmentProgramStatus)}
            className={`${inputClass} mt-2`}
          >
            {(Object.entries(treatmentStatusLabels) as Array<[TreatmentProgramStatus, string]>)
              .map(([value, label]) => (
                <option key={value} value={value} disabled={value === 'completed' && !readyToComplete && status !== 'completed'}>
                  {label}{value === 'completed' && !readyToComplete && status !== 'completed' ? ' · review all modules first' : ''}
                </option>
              ))}
          </select>
        </label>
      </section>
      {statusMessage ? <StatusMessage>{statusMessage}</StatusMessage> : null}

      <div className="-mx-1 px-1">
        <div role="tablist" aria-label={`${program.name} sections`} className="grid grid-cols-5 border-b border-line dark:border-slate-800">
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const selected = tab.id === activeTab
            return (
              <button
                key={tab.id}
                id={`${program.id}-${tab.id}-tab`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`${program.id}-workspace-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => moveTabFocus(event, index)}
                className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 border-b-2 px-1 text-[11px] font-bold outline-none focus:ring-2 focus:ring-inset focus:ring-calm/30 sm:flex-row sm:gap-2 sm:px-3 sm:text-sm ${
                  selected ? 'border-calm text-calm' : 'border-transparent text-muted hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div
        id={`${program.id}-workspace-panel`}
        role="tabpanel"
        aria-labelledby={`${program.id}-${activeTab}-tab`}
      >
        {activeTab === 'modules' ? (
          <ProgramModules
            activities={activities}
            nextModule={nextModule}
            onModule={onModule}
            onComplete={() => void updateStatus('completed')}
            onReopen={() => void updateStatus('exploring')}
            onReport={() => setActiveTab('share')}
            plan={plan}
            program={program}
            responses={responses}
            reviews={reviews}
            sessions={sessions}
            status={status}
          />
        ) : null}
        {activeTab === 'plan' ? (
          <ProgramPlan
            contacts={data.supportContacts}
            activities={activities}
            onChanged={onChanged}
            plan={plan}
            program={program}
          />
        ) : null}
        {activeTab === 'appointments' ? (
          <AppointmentWorkspace
            activities={activities}
            onChanged={onChanged}
            plan={plan}
            program={program}
            responses={responses}
            reviews={reviews}
            sessions={sessions}
          />
        ) : null}
        {activeTab === 'progress' ? (
          <ProgressWorkspace
            onChanged={onChanged}
            program={program}
            reviews={reviews}
          />
        ) : null}
        {activeTab === 'share' ? (
          <ShareWorkspace
            activities={activities}
            nightmares={data.treatmentNightmares}
            plan={plan}
            program={program}
            progress={progress}
            responses={responses}
            reviews={reviews}
            sessions={sessions}
            status={status}
          />
        ) : null}
      </div>
    </div>
  )
}

function ProgramModules({
  activities,
  nextModule,
  onModule,
  onComplete,
  onReopen,
  onReport,
  plan,
  program,
  responses,
  reviews,
  sessions,
  status,
}: {
  activities: TreatmentActivity[]
  nextModule?: TreatmentContentItem
  onModule: (module: TreatmentContentItem) => void
  onComplete: () => void
  onReopen: () => void
  onReport: () => void
  plan?: TreatmentProgramPlan
  program: TreatmentProgram
  responses: TreatmentResponse[]
  reviews: TreatmentReview[]
  sessions: TreatmentSession[]
  status: TreatmentProgramStatus
}) {
  const phaseProgress = summarizePhaseProgress(program.modules, responses)

  return (
    <div className="space-y-6">
      <ProgramSnapshot
        activities={activities}
        nextModule={nextModule}
        plan={plan}
        program={program}
        reviews={reviews}
        sessions={sessions}
      />
      {nextModule ? (
        <section className="flex flex-col gap-3 border-b border-line pb-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-calm">{plan?.nextModuleId ? 'Chosen next module' : 'Continue when ready'}</p>
            <h2 className="mt-1 text-lg font-bold">{nextModule.title}</h2>
            <p className="mt-1 text-sm text-muted dark:text-slate-300">
              About {nextModule.estimatedMinutes} minutes, with save-and-return controls.
            </p>
          </div>
          <button type="button" onClick={() => onModule(nextModule)} className={primaryButtonClass}>
            Open next <ChevronRight className="h-5 w-5" />
          </button>
        </section>
      ) : (
        <section className="rounded-lg border border-calm/30 bg-teal-50 p-5 dark:border-teal-800 dark:bg-teal-950" aria-labelledby={`${program.id}-completion-heading`}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-calm dark:bg-slate-900"><Check className="h-5 w-5" /></span>
            <div>
              <h2 id={`${program.id}-completion-heading`} className="text-xl font-bold">{status === 'completed' ? 'Pathway complete' : 'You reached the end of this pathway'}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-teal-50">
                You have reviewed every module in this Salience pathway. This records what you chose to review; it is not a clinical outcome or a claim that treatment is finished in your life.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {status === 'completed' ? (
              <button type="button" onClick={onReopen} className={secondaryButtonClass}>Reopen pathway</button>
            ) : (
              <button type="button" onClick={onComplete} className={primaryButtonClass}><Check className="h-5 w-5" /> Complete pathway</button>
            )}
            <button type="button" onClick={onReport} className={secondaryButtonClass}><Download className="h-5 w-5" /> Create report</button>
          </div>
        </section>
      )}

      {program.phases.map((phase) => {
        const phaseModules = program.modules.filter((module) => module.phaseId === phase.id)
        if (!phaseModules.length) return null
        return (
          <section key={phase.id} aria-labelledby={`${program.id}-${phase.id}-heading`}>
            <div className="flex items-end justify-between gap-3">
              <h2 id={`${program.id}-${phase.id}-heading`} className="text-xl font-bold">{phase.title}</h2>
              <span className="text-xs font-bold text-muted">
                {phaseProgress[phase.id]?.completed ?? 0}/{phaseProgress[phase.id]?.total ?? phaseModules.length} reviewed
              </span>
            </div>
            <p className="mt-1 text-sm leading-6 text-muted dark:text-slate-300">{phase.description}</p>
            <div
              role="progressbar"
              aria-label={`${phase.title} pathway progress`}
              aria-valuemin={0}
              aria-valuemax={phaseProgress[phase.id]?.total ?? phaseModules.length}
              aria-valuenow={phaseProgress[phase.id]?.completed ?? 0}
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
            >
              <div
                className="h-full bg-calm transition-[width] motion-reduce:transition-none"
                style={{ width: `${phaseProgress[phase.id]?.percent ?? 0}%` }}
              />
            </div>
            <div className="mt-3 grid gap-2">
              {phaseModules.map((module) => {
                const records = responses.filter((response) => response.moduleId === module.id)
                const completed = records.some((response) => response.status === 'completed')
                const draft = records.some((response) => response.status === 'draft')
                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => onModule(module)}
                    className="flex min-h-20 w-full items-center gap-3 rounded-lg border border-line bg-white p-4 text-left shadow-card outline-none hover:border-calm focus:ring-2 focus:ring-calm/30 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      completed
                        ? 'bg-teal-100 text-calm dark:bg-teal-950'
                        : draft
                          ? 'bg-blue-100 text-ocean dark:bg-blue-950'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {completed ? <Check className="h-5 w-5" /> : draft ? <History className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{module.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-muted dark:text-slate-300">
                        {module.deliveryMode === 'information-only'
                          ? 'Information only · procedure not performed'
                          : module.structuredTreatment
                            ? 'Structured treatment worksheet'
                            : 'Self-guided pathway'}
                        {' · '}{module.estimatedMinutes} min
                        {module.repeatable ? ' · Repeatable' : ''}
                        {records.length ? ` · ${records.length} saved` : ''}
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function ProgramSnapshot({
  activities,
  nextModule,
  plan,
  program,
  reviews,
  sessions,
}: {
  activities: TreatmentActivity[]
  nextModule?: TreatmentContentItem
  plan?: TreatmentProgramPlan
  program: TreatmentProgram
  reviews: TreatmentReview[]
  sessions: TreatmentSession[]
}) {
  const [openedAt] = useState(() => new Date().toISOString())
  const activitySummary = summarizeTreatmentActivities(activities)
  const currentPhase = program.phases.find((phase) => phase.id === plan?.currentPhaseId)
  const nextAppointment = [...sessions]
    .filter((session) => session.status === 'planned' && session.appointmentAt >= openedAt)
    .sort((a, b) => a.appointmentAt.localeCompare(b.appointmentAt))[0]
  const latestReview = [...reviews].sort((a, b) =>
    b.reviewDate.localeCompare(a.reviewDate) || b.createdAt.localeCompare(a.createdAt))[0]

  return (
    <section aria-labelledby={`${program.id}-snapshot-heading`} className="border-b border-line pb-5 dark:border-slate-800">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-calm" />
        <h2 id={`${program.id}-snapshot-heading`} className="text-lg font-bold">My care snapshot</h2>
      </div>
      <p className="mt-1 text-xs leading-5 text-muted dark:text-slate-300">
        A factual summary of choices and records saved on this device. Salience does not use it to decide treatment.
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 lg:grid-cols-4">
        <div>
          <dt className="text-xs font-bold text-muted">Current focus</dt>
          <dd className="mt-1 text-sm font-semibold">{currentPhase?.title ?? 'Not chosen'}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-muted">Next module</dt>
          <dd className="mt-1 text-sm font-semibold">{nextModule?.title ?? 'None selected'}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-muted">Chosen activities</dt>
          <dd className="mt-1 text-sm font-semibold">{activitySummary.planned} planned, {activitySummary.paused} paused</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-muted">Next review</dt>
          <dd className="mt-1 text-sm font-semibold">
            {plan?.reviewDate
              ? displayDate(plan.reviewDate)
              : latestReview
                ? `Last ${displayDate(latestReview.reviewDate)}`
                : nextAppointment
                  ? displayDateTime(nextAppointment.appointmentAt)
                  : 'Not chosen'}
          </dd>
        </div>
      </dl>
    </section>
  )
}

function ProgramPlan({
  activities,
  contacts,
  onChanged,
  plan,
  program,
}: {
  activities: TreatmentActivity[]
  contacts: AppData['supportContacts']
  onChanged: () => Promise<void>
  plan?: TreatmentProgramPlan
  program: TreatmentProgram
}) {
  const initial = plan ?? defaultTreatmentProgramPlan(program.id)
  const [hopes, setHopes] = useState(initial.hopes ?? '')
  const [goals, setGoals] = useState(initial.goals.join('\n'))
  const [concerns, setConcerns] = useState(initial.concerns ?? '')
  const [agreedFocus, setAgreedFocus] = useState(initial.agreedFocus ?? '')
  const [currentPhaseId, setCurrentPhaseId] = useState(initial.currentPhaseId ?? '')
  const [nextModuleId, setNextModuleId] = useState(initial.nextModuleId ?? '')
  const [reviewDate, setReviewDate] = useState(initial.reviewDate ?? '')
  const [workingAgreement, setWorkingAgreement] = useState(initial.workingAgreement ?? '')
  const [pacingPreference, setPacingPreference] = useState<TreatmentPacingPreference>(initial.pacingPreference)
  const [customPacing, setCustomPacing] = useState(initial.customPacing ?? '')
  const [pausePlan, setPausePlan] = useState(initial.pausePlan ?? '')
  const [clinicianContactId, setClinicianContactId] = useState(initial.clinicianContactId ?? '')
  const [nextAppointmentAt, setNextAppointmentAt] = useState(
    initial.nextAppointmentAt ? initial.nextAppointmentAt.slice(0, 16) : '',
  )
  const [message, setMessage] = useState('')

  const resetFields = () => {
    setHopes('')
    setGoals('')
    setConcerns('')
    setAgreedFocus('')
    setCurrentPhaseId('')
    setNextModuleId('')
    setReviewDate('')
    setWorkingAgreement('')
    setPacingPreference('one-step-at-a-time')
    setCustomPacing('')
    setPausePlan('')
    setClinicianContactId('')
    setNextAppointmentAt('')
  }

  const save = async () => {
    const now = new Date().toISOString()
    await db.treatmentProgramPlans.put({
      ...initial,
      hopes: hopes.trim() || undefined,
      goals: goals.split('\n').map((goal) => goal.trim()).filter(Boolean),
      concerns: concerns.trim() || undefined,
      agreedFocus: agreedFocus.trim() || undefined,
      currentPhaseId: currentPhaseId || undefined,
      nextModuleId: nextModuleId || undefined,
      reviewDate: reviewDate || undefined,
      workingAgreement: workingAgreement.trim() || undefined,
      pacingPreference,
      customPacing: pacingPreference === 'custom' ? customPacing.trim() || undefined : undefined,
      pausePlan: pausePlan.trim() || undefined,
      clinicianContactId: clinicianContactId || undefined,
      nextAppointmentAt: nextAppointmentAt ? new Date(nextAppointmentAt).toISOString() : undefined,
      updatedAt: now,
      createdAt: plan?.createdAt ?? now,
    })
    await onChanged()
    setMessage('Program plan saved locally.')
  }

  const remove = async () => {
    if (!window.confirm('Delete this program plan? Module records, chosen activities, appointments, and progress reviews will remain.')) return
    await db.treatmentProgramPlans.delete(program.id)
    resetFields()
    await onChanged()
    setMessage('Program plan deleted.')
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">My program plan</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted dark:text-slate-300">
          A flexible pathway plan for your priorities, choices, and optional clinical conversations. Salience does not select treatment goals for you.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <TreatmentCard>
          <h3 className="font-bold">What matters to me</h3>
          <div className="mt-4 space-y-4">
            <Field label="What I hope will be different"><textarea value={hopes} onChange={(event) => setHopes(event.target.value)} rows={3} className={textareaClass} /></Field>
            <Field label="Personal goals (one per line)"><textarea value={goals} onChange={(event) => setGoals(event.target.value)} rows={4} className={textareaClass} /></Field>
            <Field label="Concerns or questions"><textarea value={concerns} onChange={(event) => setConcerns(event.target.value)} rows={3} className={textareaClass} /></Field>
          </div>
        </TreatmentCard>
        <TreatmentCard>
          <h3 className="font-bold">How I want to work</h3>
          <div className="mt-4 space-y-4">
            <Field label="My current focus (optional)"><textarea value={agreedFocus} onChange={(event) => setAgreedFocus(event.target.value)} rows={3} className={textareaClass} /></Field>
            <Field label="Preferred pace">
              <select value={pacingPreference} onChange={(event) => setPacingPreference(event.target.value as TreatmentPacingPreference)} className={inputClass}>
                <option value="one-step-at-a-time">One step at a time</option>
                <option value="between-appointments">Organised between appointments</option>
                <option value="custom">Custom plan</option>
              </select>
            </Field>
            {pacingPreference === 'custom' ? <Field label="Custom pacing"><input value={customPacing} onChange={(event) => setCustomPacing(event.target.value)} className={inputClass} /></Field> : null}
            <Field label="My pause or stop plan"><textarea value={pausePlan} onChange={(event) => setPausePlan(event.target.value)} rows={3} className={textareaClass} /></Field>
          </div>
        </TreatmentCard>
      </div>
      <TreatmentCard>
        <h3 className="font-bold">My care pathway</h3>
        <p className="mt-1 text-xs leading-5 text-muted dark:text-slate-300">
          These are organising choices, not a sequence selected or approved by Salience. You can change them at any time.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Current focus phase (optional)">
            <select value={currentPhaseId} onChange={(event) => setCurrentPhaseId(event.target.value)} className={inputClass}>
              <option value="">Not chosen</option>
              {program.phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.title}</option>)}
            </select>
          </Field>
          <Field label="Next pathway module (optional)">
            <select value={nextModuleId} onChange={(event) => setNextModuleId(event.target.value)} className={inputClass}>
              <option value="">Use the next unreviewed module</option>
              {program.modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
            </select>
          </Field>
          <Field label="Plan review date (optional)">
            <input type="date" value={reviewDate} onChange={(event) => setReviewDate(event.target.value)} className={inputClass} />
          </Field>
          <Field label="How I plan to use Salience (optional)">
            <textarea value={workingAgreement} onChange={(event) => setWorkingAgreement(event.target.value)} rows={3} className={textareaClass} />
          </Field>
        </div>
      </TreatmentCard>
      <TreatmentCard>
        <h3 className="font-bold">Care connection</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Professional contact (optional)">
            <select value={clinicianContactId} onChange={(event) => setClinicianContactId(event.target.value)} className={inputClass}>
              <option value="">Not selected</option>
              {contacts.filter((contact) => !contact.isDefault).map((contact) => <option key={contact.id} value={contact.id}>{contact.name} · {contact.role}</option>)}
            </select>
          </Field>
          <Field label="Next appointment (optional)">
            <input type="datetime-local" value={nextAppointmentAt} onChange={(event) => setNextAppointmentAt(event.target.value)} className={inputClass} />
          </Field>
        </div>
      </TreatmentCard>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void save()} className={primaryButtonClass}><Save className="h-5 w-5" /> Save plan</button>
        {plan ? <button type="button" onClick={() => void remove()} className={`${secondaryButtonClass} text-clay`}><Trash2 className="h-5 w-5" /> Delete plan</button> : null}
      </div>
      {message ? <StatusMessage>{message}</StatusMessage> : null}
      <TreatmentActivities
        activities={activities}
        onChanged={onChanged}
        program={program}
      />
    </div>
  )
}

const treatmentActivityStatusLabels: Record<TreatmentActivityStatus, string> = {
  planned: 'Planned',
  completed: 'Done or reviewed',
  paused: 'Paused',
  stopped: 'Stopped or removed',
}

const treatmentActivitySourceLabels: Record<TreatmentActivitySource, string> = {
  'self-chosen': 'Chosen by me',
  'clinician-agreed': 'Suggested by a clinician',
}

function TreatmentActivities({
  activities,
  onChanged,
  program,
}: {
  activities: TreatmentActivity[]
  onChanged: () => Promise<void>
  program: TreatmentProgram
}) {
  const [editingId, setEditingId] = useState<string>()
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [source, setSource] = useState<TreatmentActivitySource>('self-chosen')
  const [status, setStatus] = useState<TreatmentActivityStatus>('planned')
  const [dueDate, setDueDate] = useState('')
  const [relatedModuleId, setRelatedModuleId] = useState('')
  const [safetyNotes, setSafetyNotes] = useState('')
  const [supportPlan, setSupportPlan] = useState('')
  const [message, setMessage] = useState('')
  const availableModules = program.modules.filter((module) =>
    module.deliveryMode === 'self-guided')

  const reset = () => {
    setEditingId(undefined)
    setTitle('')
    setDetails('')
    setSource('self-chosen')
    setStatus('planned')
    setDueDate('')
    setRelatedModuleId('')
    setSafetyNotes('')
    setSupportPlan('')
  }

  const load = (activity: TreatmentActivity) => {
    setEditingId(activity.id)
    setTitle(activity.title)
    setDetails(activity.details ?? '')
    setSource(activity.source)
    setStatus(activity.status)
    setDueDate(activity.dueDate ?? '')
    setRelatedModuleId(activity.relatedModuleId ?? '')
    setSafetyNotes(activity.safetyNotes ?? '')
    setSupportPlan(activity.supportPlan ?? '')
    setMessage('')
  }

  const save = async () => {
    if (!title.trim()) {
      setMessage('Add a short name for this chosen activity.')
      return
    }
    const relatedModule = program.modules.find((module) => module.id === relatedModuleId)
    if (relatedModule?.deliveryMode === 'information-only') {
      setMessage('Information-only pages cannot be linked to a practice activity because Salience does not perform that procedure.')
      return
    }
    const existing = activities.find((activity) => activity.id === editingId)
    const now = new Date().toISOString()
    await db.treatmentActivities.put({
      id: editingId ?? uid(),
      programId: program.id,
      title: title.trim(),
      details: details.trim() || undefined,
      source,
      status,
      dueDate: dueDate || undefined,
      relatedModuleId: relatedModuleId || undefined,
      safetyNotes: safetyNotes.trim() || undefined,
      supportPlan: supportPlan.trim() || undefined,
      completedAt: status === 'completed' ? existing?.completedAt ?? now : undefined,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    })
    await onChanged()
    reset()
    setMessage('Chosen activity saved locally.')
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete this chosen activity? Linked module records will remain and will no longer show the link.')) return
    await db.treatmentActivities.delete(id)
    await db.treatmentResponses.where('relatedActivityId').equals(id).modify({ relatedActivityId: undefined })
    await onChanged()
    if (editingId === id) reset()
    setMessage('Chosen activity deleted.')
  }

  return (
    <section aria-labelledby={`${program.id}-activities-heading`} className="border-t border-line pt-5 dark:border-slate-800">
      <h2 id={`${program.id}-activities-heading`} className="text-xl font-bold">Activities I chose</h2>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-muted dark:text-slate-300">
        Organise self-chosen pathway activities or suggestions received from a clinician. Salience does not create, intensify, or mark activities overdue.
      </p>
      {program.id === 'pe' ? (
        <p className="mt-3 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-ocean dark:bg-blue-950 dark:text-blue-100">
          Use only ordinary-life activities you already judge safe. Never use this list for prisons, police stations, courts, Corrections facilities, confrontation, pursuit, confinement, illegal activity, or any dangerous or legally risky situation.
        </p>
      ) : null}
      <TreatmentCard>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Activity name">
            <input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
          </Field>
          <Field label="Where this came from">
            <select
              value={source}
              onChange={(event) => {
                const nextSource = event.target.value as TreatmentActivitySource
                setSource(nextSource)
              }}
              className={inputClass}
            >
              {(Object.entries(treatmentActivitySourceLabels) as Array<[TreatmentActivitySource, string]>)
                .map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(event) => setStatus(event.target.value as TreatmentActivityStatus)} className={inputClass}>
              {(Object.entries(treatmentActivityStatusLabels) as Array<[TreatmentActivityStatus, string]>)
                .map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label="Chosen date (optional)">
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={inputClass} />
          </Field>
          <Field label="Related module (optional)">
            <select value={relatedModuleId} onChange={(event) => setRelatedModuleId(event.target.value)} className={inputClass}>
              <option value="">Not linked</option>
              {availableModules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Field label="Details or professionally supplied instructions (optional)">
            <textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={3} className={textareaClass} />
          </Field>
          <Field label="Safety, choice, or modification notes (optional)">
            <textarea value={safetyNotes} onChange={(event) => setSafetyNotes(event.target.value)} rows={3} className={textareaClass} />
          </Field>
          <Field label="Support or stopping plan (optional)">
            <textarea value={supportPlan} onChange={(event) => setSupportPlan(event.target.value)} rows={3} className={textareaClass} />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => void save()} className={primaryButtonClass}>
            <Save className="h-5 w-5" /> {editingId ? 'Update activity' : 'Save activity'}
          </button>
          {editingId ? <button type="button" onClick={reset} className={secondaryButtonClass}>Cancel edit</button> : null}
        </div>
      </TreatmentCard>
      {message ? <StatusMessage>{message}</StatusMessage> : null}
      {activities.length ? (
        <div className="mt-4 grid gap-2">
          {[...activities]
            .sort((a, b) => {
              const statusOrder: Record<TreatmentActivityStatus, number> = { planned: 0, paused: 1, completed: 2, stopped: 3 }
              return statusOrder[a.status] - statusOrder[b.status]
                || (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31')
                || b.updatedAt.localeCompare(a.updatedAt)
            })
            .map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 rounded-lg border border-line bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <button type="button" onClick={() => load(activity)} className="min-w-0 flex-1 text-left outline-none focus:ring-2 focus:ring-calm/30">
                  <span className="block font-bold">{activity.title}</span>
                  <span className="mt-1 block text-xs text-muted">
                    {treatmentActivityStatusLabels[activity.status]} · {treatmentActivitySourceLabels[activity.source]}
                    {activity.dueDate ? ` · ${displayDate(activity.dueDate)}` : ''}
                  </span>
                </button>
                <button type="button" onClick={() => void remove(activity.id)} className={iconDeleteClass} aria-label={`Delete chosen activity ${activity.title}`}>
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
        </div>
      ) : null}
    </section>
  )
}

function AppointmentWorkspace({
  activities,
  onChanged,
  plan,
  program,
  responses,
  reviews,
  sessions,
}: {
  activities: TreatmentActivity[]
  onChanged: () => Promise<void>
  plan?: TreatmentProgramPlan
  program: TreatmentProgram
  responses: TreatmentResponse[]
  reviews: TreatmentReview[]
  sessions: TreatmentSession[]
}) {
  const [showBrief, setShowBrief] = useState(false)
  const [editingId, setEditingId] = useState<string>()
  const [appointmentAt, setAppointmentAt] = useState(localDateTimeInput())
  const [status, setStatus] = useState<TreatmentSessionStatus>('planned')
  const [agenda, setAgenda] = useState('')
  const [questions, setQuestions] = useState('')
  const [clinicianInstructions, setClinicianInstructions] = useState('')
  const [observations, setObservations] = useState('')
  const [nextSteps, setNextSteps] = useState('')
  const [message, setMessage] = useState('')
  const visitBrief = useMemo(() => buildTreatmentVisitBrief({
    activities,
    plan,
    responses,
    reviews,
    sessions,
    moduleTitles: Object.fromEntries(program.modules.map((module) => [module.id, module.title])),
  }), [activities, plan, program.modules, responses, reviews, sessions])

  const reset = () => {
    setEditingId(undefined)
    setAppointmentAt(localDateTimeInput())
    setStatus('planned')
    setAgenda('')
    setQuestions('')
    setClinicianInstructions('')
    setObservations('')
    setNextSteps('')
  }

  const load = (session: TreatmentSession) => {
    setEditingId(session.id)
    setAppointmentAt(session.appointmentAt.slice(0, 16))
    setStatus(session.status)
    setAgenda(session.agenda ?? '')
    setQuestions(session.questions ?? '')
    setClinicianInstructions(session.clinicianInstructions ?? '')
    setObservations(session.observations ?? '')
    setNextSteps(session.nextSteps ?? '')
    setMessage('')
  }

  const save = async () => {
    if (!appointmentAt) {
      setMessage('Choose an appointment date and time.')
      return
    }
    const existing = sessions.find((session) => session.id === editingId)
    const now = new Date().toISOString()
    await db.treatmentSessions.put({
      id: editingId ?? uid(),
      programId: program.id,
      appointmentAt: new Date(appointmentAt).toISOString(),
      status,
      agenda: agenda.trim() || undefined,
      questions: questions.trim() || undefined,
      clinicianInstructions: clinicianInstructions.trim() || undefined,
      observations: observations.trim() || undefined,
      nextSteps: nextSteps.trim() || undefined,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    })
    await onChanged()
    reset()
    setMessage('Appointment note saved locally.')
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete this appointment note?')) return
    await db.treatmentSessions.delete(id)
    await onChanged()
    if (editingId === id) reset()
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Appointments</h2>
        <p className="mt-1 text-sm leading-6 text-muted dark:text-slate-300">Prepare an agenda, record clinician-supplied instructions, and choose what to review next.</p>
      </div>
      <section className="border-y border-line py-4 dark:border-slate-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold">Next visit brief</h3>
            <p className="mt-1 text-xs leading-5 text-muted dark:text-slate-300">
              Build an on-device summary from the goals, questions, chosen activities, and recent records already saved here.
            </p>
          </div>
          <button type="button" onClick={() => setShowBrief((current) => !current)} className={secondaryButtonClass} aria-expanded={showBrief}>
            <ClipboardList className="h-5 w-5" /> {showBrief ? 'Hide brief' : 'Build brief'}
          </button>
        </div>
        {showBrief ? <VisitBriefPanel brief={visitBrief} /> : null}
      </section>
      <TreatmentCard>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Appointment date and time"><input type="datetime-local" value={appointmentAt} onChange={(event) => setAppointmentAt(event.target.value)} className={inputClass} /></Field>
          <Field label="Status">
            <select value={status} onChange={(event) => setStatus(event.target.value as TreatmentSessionStatus)} className={inputClass}>
              <option value="planned">Planned</option>
              <option value="completed">Completed</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </Field>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Field label="Agenda or topics"><textarea value={agenda} onChange={(event) => setAgenda(event.target.value)} rows={3} className={textareaClass} /></Field>
          <Field label="Questions to ask"><textarea value={questions} onChange={(event) => setQuestions(event.target.value)} rows={3} className={textareaClass} /></Field>
          <Field label="Instructions supplied by my clinician"><textarea value={clinicianInstructions} onChange={(event) => setClinicianInstructions(event.target.value)} rows={3} className={textareaClass} /></Field>
          <Field label="Brief observations after the appointment"><textarea value={observations} onChange={(event) => setObservations(event.target.value)} rows={3} className={textareaClass} /></Field>
          <Field label="Next steps we agreed"><textarea value={nextSteps} onChange={(event) => setNextSteps(event.target.value)} rows={3} className={textareaClass} /></Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => void save()} className={primaryButtonClass}><Save className="h-5 w-5" /> {editingId ? 'Update note' : 'Save note'}</button>
          {editingId ? <button type="button" onClick={reset} className={secondaryButtonClass}>Cancel edit</button> : null}
        </div>
      </TreatmentCard>
      {message ? <StatusMessage>{message}</StatusMessage> : null}
      {sessions.length ? (
        <section>
          <h3 className="font-bold">Saved appointments</h3>
          <div className="mt-3 grid gap-2">
            {[...sessions].sort((a, b) => b.appointmentAt.localeCompare(a.appointmentAt)).map((session) => (
              <div key={session.id} className="flex items-center gap-3 rounded-lg border border-line bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <button type="button" onClick={() => load(session)} className="min-w-0 flex-1 text-left outline-none focus:ring-2 focus:ring-calm/30">
                  <span className="block font-bold">{displayDateTime(session.appointmentAt)}</span>
                  <span className="mt-1 block text-xs capitalize text-muted">{session.status}{session.agenda ? ` · ${session.agenda}` : ''}</span>
                </button>
                <button type="button" onClick={() => void remove(session.id)} className={iconDeleteClass} aria-label={`Delete appointment note from ${displayDateTime(session.appointmentAt)}`}><Trash2 className="h-5 w-5" /></button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function VisitBriefPanel({
  brief,
}: {
  brief: ReturnType<typeof buildTreatmentVisitBrief>
}) {
  const hasMaterial = brief.nextAppointment
    || brief.goals.length
    || brief.questions.length
    || brief.openActivities.length
    || brief.recentResponses.length
    || brief.latestReview

  if (!hasMaterial) {
    return <p className="mt-4 text-sm text-muted">There is no saved material for a visit brief yet.</p>
  }

  return (
    <div className="mt-4 space-y-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
      <p className="text-xs leading-5 text-muted dark:text-slate-300">
        This summary is not sent anywhere and is not a clinical record. Open only when you want these saved details on screen.
      </p>
      {brief.nextAppointment ? (
        <div>
          <h4 className="text-sm font-bold">Next saved appointment</h4>
          <p className="mt-1 text-sm">{displayDateTime(brief.nextAppointment.appointmentAt)}</p>
        </div>
      ) : null}
      {brief.goals.length ? (
        <div>
          <h4 className="text-sm font-bold">My goals</h4>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {brief.goals.map((goal, index) => <li key={`${goal}-${index}`}>{goal}</li>)}
          </ul>
        </div>
      ) : null}
      {brief.questions.length ? (
        <div>
          <h4 className="text-sm font-bold">Questions and concerns I saved</h4>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {brief.questions.map((question, index) => <li key={`${question}-${index}`}>{question}</li>)}
          </ul>
        </div>
      ) : null}
      {brief.openActivities.length ? (
        <div>
          <h4 className="text-sm font-bold">Activities to review</h4>
          <ul className="mt-1 space-y-1 text-sm">
            {brief.openActivities.map((activity) => (
              <li key={activity.id}>
                <span className="font-semibold">{activity.title}</span>
                <span className="text-muted"> · {treatmentActivityStatusLabels[activity.status]}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {brief.recentResponses.length ? (
        <div>
          <h4 className="text-sm font-bold">Recent pathway work</h4>
          <ul className="mt-1 space-y-1 text-sm">
            {brief.recentResponses.map((response) => (
              <li key={response.id}>{response.title} · {response.status} · {displayDateTime(response.updatedAt)}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {brief.latestReview ? (
        <p className="text-sm"><span className="font-bold">Latest progress review:</span> {displayDate(brief.latestReview.reviewDate)}</p>
      ) : null}
    </div>
  )
}

const reviewRatingFields: Array<{
  key: keyof Pick<TreatmentReview, 'sleepImpact' | 'nightmareImpact' | 'remindersImpact' | 'avoidanceImpact' | 'dailyFunctioning' | 'copingConfidence' | 'goalProgress'>
  label: string
  low: string
  high: string
}> = [
  { key: 'sleepImpact', label: 'Sleep disruption impact', low: 'No impact', high: 'Very high impact' },
  { key: 'nightmareImpact', label: 'Nightmare impact', low: 'No impact', high: 'Very high impact' },
  { key: 'remindersImpact', label: 'Trauma-reminder impact', low: 'No impact', high: 'Very high impact' },
  { key: 'avoidanceImpact', label: 'Avoidance impact', low: 'No impact', high: 'Very high impact' },
  { key: 'dailyFunctioning', label: 'Day-to-day functioning', low: 'Very limited', high: 'Going very well' },
  { key: 'copingConfidence', label: 'Confidence using coping tools', low: 'No confidence', high: 'Very confident' },
  { key: 'goalProgress', label: 'Progress toward my goals', low: 'No progress noticed', high: 'Strong progress' },
]

type ReviewRatingKey = typeof reviewRatingFields[number]['key']

const treatmentReviewRatingCount = (review: TreatmentReview) =>
  reviewRatingFields.filter((field) => review[field.key] !== undefined).length

function ProgressWorkspace({
  onChanged,
  program,
  reviews,
}: {
  onChanged: () => Promise<void>
  program: TreatmentProgram
  reviews: TreatmentReview[]
}) {
  const [editingId, setEditingId] = useState<string>()
  const [reviewDate, setReviewDate] = useState(localDateKey())
  const [ratings, setRatings] = useState<Partial<Record<ReviewRatingKey, number>>>({})
  const [whatHelped, setWhatHelped] = useState('')
  const [whatWasDifficult, setWhatWasDifficult] = useState('')
  const [questions, setQuestions] = useState('')
  const [clinicianMeasureName, setClinicianMeasureName] = useState('')
  const [clinicianMeasureScore, setClinicianMeasureScore] = useState('')
  const [clinicianMeasureMaximum, setClinicianMeasureMaximum] = useState('')
  const [message, setMessage] = useState('')
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [selectedMetric, setSelectedMetric] = useState<ReviewRatingKey>('dailyFunctioning')
  const filteredReviews = useMemo(
    () => filterTreatmentReviewsByDate(reviews, rangeStart || undefined, rangeEnd || undefined),
    [rangeEnd, rangeStart, reviews],
  )
  const summary = useMemo(() => summarizeTreatmentReviews(filteredReviews), [filteredReviews])
  const clinicianMeasureSeries = useMemo(
    () => summarizeClinicianMeasures(filteredReviews),
    [filteredReviews],
  )

  const reset = () => {
    setEditingId(undefined)
    setReviewDate(localDateKey())
    setRatings({})
    setWhatHelped('')
    setWhatWasDifficult('')
    setQuestions('')
    setClinicianMeasureName('')
    setClinicianMeasureScore('')
    setClinicianMeasureMaximum('')
  }

  const load = (review: TreatmentReview) => {
    setEditingId(review.id)
    setReviewDate(review.reviewDate)
    setRatings(Object.fromEntries(reviewRatingFields.flatMap(({ key }) =>
      review[key] === undefined ? [] : [[key, review[key]]])) as Partial<Record<ReviewRatingKey, number>>)
    setWhatHelped(review.whatHelped ?? '')
    setWhatWasDifficult(review.whatWasDifficult ?? '')
    setQuestions(review.questions ?? '')
    setClinicianMeasureName(review.clinicianMeasureName ?? '')
    setClinicianMeasureScore(review.clinicianMeasureScore?.toString() ?? '')
    setClinicianMeasureMaximum(review.clinicianMeasureMaximum?.toString() ?? '')
    setMessage('')
  }

  const save = async () => {
    if (!reviewDate) {
      setMessage('Choose a review date.')
      return
    }
    if (treatmentReviewDateIsFuture(reviewDate)) {
      setMessage('The review date cannot be in the future.')
      return
    }
    const measureError = validateClinicianMeasure(
      clinicianMeasureName,
      clinicianMeasureScore,
      clinicianMeasureMaximum,
    )
    if (measureError) {
      setMessage(measureError)
      return
    }
    const sameDateReview = findTreatmentReviewDateConflict(reviews, reviewDate, editingId)
    if (sameDateReview && editingId) {
      setMessage('Another progress review already exists for this date. Edit that review or choose a different date.')
      return
    }
    if (
      sameDateReview
      && !window.confirm('A progress review already exists for this date. Update that review with these values?')
    ) return
    const recordId = editingId ?? sameDateReview?.id ?? uid()
    const existing = reviews.find((review) => review.id === recordId)
    const now = new Date().toISOString()
    await db.treatmentReviews.put({
      id: recordId,
      programId: program.id,
      reviewDate,
      ...ratings,
      whatHelped: whatHelped.trim() || undefined,
      whatWasDifficult: whatWasDifficult.trim() || undefined,
      questions: questions.trim() || undefined,
      clinicianMeasureName: clinicianMeasureName.trim() || undefined,
      clinicianMeasureScore: clinicianMeasureScore ? Number(clinicianMeasureScore) : undefined,
      clinicianMeasureMaximum: clinicianMeasureMaximum ? Number(clinicianMeasureMaximum) : undefined,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    })
    await onChanged()
    reset()
    setMessage('Progress review saved locally.')
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete this progress review?')) return
    await db.treatmentReviews.delete(id)
    await onChanged()
    if (editingId === id) reset()
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Progress review</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted dark:text-slate-300">
          Optional, non-diagnostic ratings for noticing change. Impact ratings run from no impact to very high impact; functioning and confidence run from low to high.
        </p>
      </div>
      {reviews.length ? (
        <section aria-labelledby={`${program.id}-trend-heading`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 id={`${program.id}-trend-heading`} className="font-bold">Recorded change</h3>
              <p className="mt-1 text-xs text-muted">{filteredReviews.length} of {reviews.length} reviews in this range</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setRangeStart('')
                setRangeEnd('')
              }}
              className={secondaryButtonClass}
            >
              Show all dates
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr]">
            <Field label="From date">
              <input type="date" value={rangeStart} max={rangeEnd || undefined} onChange={(event) => setRangeStart(event.target.value)} className={inputClass} />
            </Field>
            <Field label="To date">
              <input type="date" value={rangeEnd} min={rangeStart || undefined} onChange={(event) => setRangeEnd(event.target.value)} className={inputClass} />
            </Field>
            <Field label="Metric shown in graph">
              <select value={selectedMetric} onChange={(event) => setSelectedMetric(event.target.value as ReviewRatingKey)} className={inputClass}>
                {reviewRatingFields.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}
              </select>
            </Field>
          </div>
          {filteredReviews.length ? (
            <TreatmentReviewChart
              metric={selectedMetric}
              reviews={filteredReviews}
              summary={summary[selectedMetric]}
            />
          ) : (
            <p className="mt-4 rounded-lg bg-slate-100 p-4 text-sm text-muted dark:bg-slate-800 dark:text-slate-300">
              No progress reviews are recorded in the selected date range.
            </p>
          )}
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {reviewRatingFields.map(({ key, label }) => {
              const metric = summary[key]
              return (
                <div key={key} className="rounded-lg border border-line bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-bold text-muted dark:text-slate-300">{label}</p>
                  <p className="mt-2 text-lg font-bold">{metric.latest ? `${metric.latest.value}/10` : 'Not recorded'}</p>
                  <p className="mt-1 text-xs text-muted">
                    {metric.count === 0
                      ? 'No recorded points'
                      : metric.change === undefined
                        ? 'One recorded point'
                        : `${metric.change > 0 ? '+' : ''}${metric.change} from first entry`}
                  </p>
                </div>
              )
            })}
          </div>
          <p className="mt-2 text-xs leading-5 text-muted dark:text-slate-400">Changes are shown without interpretation. Higher impact ratings and higher functioning ratings have different meanings.</p>
          {clinicianMeasureSeries.length ? (
            <section aria-labelledby={`${program.id}-clinician-measures-heading`} className="mt-6 border-t border-line pt-5 dark:border-slate-800">
              <h3 id={`${program.id}-clinician-measures-heading`} className="font-bold">Clinician-supplied measure history</h3>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-muted dark:text-slate-300">
                Raw names and scores you entered from a clinician are shown without scoring, thresholds, percentages, or interpretation. The selected date range applies.
              </p>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {clinicianMeasureSeries.map((series) => (
                  <div key={series.name.toLocaleLowerCase()} className="rounded-lg border border-line bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="font-bold">{series.name}</h4>
                      <span className="text-xs font-bold text-muted">
                        Latest {series.latest.score}/{series.latest.maximum}
                      </span>
                    </div>
                    {series.hasMixedMaximums ? (
                      <p className="mt-2 rounded-lg bg-slate-100 p-2 text-xs leading-5 text-muted dark:bg-slate-800 dark:text-slate-300">
                        The recorded maximum changed. Values are kept separate and are not compared.
                      </p>
                    ) : null}
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-line dark:border-slate-700">
                            <th className="p-2">Date</th>
                            <th className="p-2">Recorded score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {series.entries.map((entry) => (
                            <tr key={entry.reviewId} className="border-b border-line last:border-0 dark:border-slate-800">
                              <td className="p-2">{displayDate(entry.reviewDate)}</td>
                              <td className="p-2">{entry.score}/{entry.maximum}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </section>
      ) : null}
      <TreatmentCard>
        <Field label="Review date"><input type="date" max={localDateKey()} value={reviewDate} onChange={(event) => setReviewDate(event.target.value)} className={inputClass} /></Field>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {reviewRatingFields.map(({ key, label, low, high }) => (
            <Field key={key} label={`${label} (optional)`}>
              <select
                value={ratings[key] ?? ''}
                onChange={(event) => setRatings((current) => ({
                  ...current,
                  [key]: event.target.value === '' ? undefined : Number(event.target.value),
                }))}
                className={inputClass}
              >
                <option value="">Not recorded</option>
                {Array.from({ length: 11 }, (_, value) => (
                  <option key={value} value={value}>{value}{value === 0 ? ` · ${low}` : value === 10 ? ` · ${high}` : ''}</option>
                ))}
              </select>
            </Field>
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Field label="What helped?"><textarea value={whatHelped} onChange={(event) => setWhatHelped(event.target.value)} rows={3} className={textareaClass} /></Field>
          <Field label="What was difficult or unhelpful?"><textarea value={whatWasDifficult} onChange={(event) => setWhatWasDifficult(event.target.value)} rows={3} className={textareaClass} /></Field>
          <Field label="Questions for my review or a clinician"><textarea value={questions} onChange={(event) => setQuestions(event.target.value)} rows={3} className={textareaClass} /></Field>
        </div>
        <fieldset className="mt-5 border-t border-line pt-4 dark:border-slate-700">
          <legend className="px-1 text-sm font-bold">Optional score supplied by a clinician</legend>
          <p className="mt-1 text-xs leading-5 text-muted dark:text-slate-300">Salience does not administer or interpret a diagnostic measure. Enter this only if your clinician gave you the measure name and score.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Field label="Measure name"><input value={clinicianMeasureName} onChange={(event) => setClinicianMeasureName(event.target.value)} className={inputClass} /></Field>
            <Field label="Score"><input type="number" min="0" inputMode="decimal" value={clinicianMeasureScore} onChange={(event) => setClinicianMeasureScore(event.target.value)} className={inputClass} /></Field>
            <Field label="Maximum"><input type="number" min="1" inputMode="decimal" value={clinicianMeasureMaximum} onChange={(event) => setClinicianMeasureMaximum(event.target.value)} className={inputClass} /></Field>
          </div>
        </fieldset>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => void save()} className={primaryButtonClass}><Save className="h-5 w-5" /> {editingId ? 'Update review' : 'Save review'}</button>
          {editingId ? <button type="button" onClick={reset} className={secondaryButtonClass}>Cancel edit</button> : null}
        </div>
      </TreatmentCard>
      {message ? <StatusMessage>{message}</StatusMessage> : null}
      {reviews.length ? (
        <section>
          <h3 className="font-bold">Review history</h3>
          <div className="mt-3 grid gap-2">
            {[...reviews].sort((a, b) => b.reviewDate.localeCompare(a.reviewDate)).map((review) => (
              <div key={review.id} className="flex items-center gap-3 rounded-lg border border-line bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <button type="button" onClick={() => load(review)} className="min-w-0 flex-1 text-left outline-none focus:ring-2 focus:ring-calm/30">
                  <span className="block font-bold">{displayDate(review.reviewDate)}</span>
                  <span className="mt-1 block text-xs text-muted">
                    {treatmentReviewRatingCount(review)} rating{treatmentReviewRatingCount(review) === 1 ? '' : 's'} recorded
                    {' · '}saved {displayDateTime(review.createdAt)}
                  </span>
                </button>
                <button type="button" onClick={() => void remove(review.id)} className={iconDeleteClass} aria-label={`Delete progress review from ${displayDate(review.reviewDate)}`}><Trash2 className="h-5 w-5" /></button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function TreatmentReviewChart({
  metric,
  reviews,
  summary,
}: {
  metric: ReviewRatingKey
  reviews: TreatmentReview[]
  summary: ReturnType<typeof summarizeTreatmentReviews>[ReviewRatingKey]
}) {
  const definition = reviewRatingFields.find((field) => field.key === metric)!
  const orderedReviews = [...reviews]
    .sort((a, b) => a.reviewDate.localeCompare(b.reviewDate) || a.createdAt.localeCompare(b.createdAt))
  const dateCounts = orderedReviews.reduce<Record<string, number>>((counts, review) => {
    counts[review.reviewDate] = (counts[review.reviewDate] ?? 0) + 1
    return counts
  }, {})
  const dateIndexes: Record<string, number> = {}
  const data = orderedReviews.flatMap((review) => {
    if (review[metric] === undefined) return []
    dateIndexes[review.reviewDate] = (dateIndexes[review.reviewDate] ?? 0) + 1
    return [{
      date: review.reviewDate,
      dateLabel: dateCounts[review.reviewDate] > 1
        ? `${displayDate(review.reviewDate)} · ${dateIndexes[review.reviewDate]}`
        : displayDate(review.reviewDate),
      value: review[metric],
    }]
  })
  const changeText = summary.change === undefined
    ? data.length === 1
      ? 'One recorded point.'
      : 'No values recorded for this metric.'
    : `${summary.change > 0 ? '+' : ''}${summary.change} from the first recorded value in this range.`

  return (
    <div className="mt-4 rounded-lg border border-line bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h4 className="font-bold">{definition.label}</h4>
        <p className="text-xs text-muted">{data.length} recorded point{data.length === 1 ? '' : 's'}</p>
      </div>
      <p className="mt-1 text-xs leading-5 text-muted dark:text-slate-300">
        0 means “{definition.low}”; 10 means “{definition.high}”. {changeText} No interpretation is applied.
      </p>
      {data.length ? (
        <>
          <div className="mt-3 h-60 min-w-0 w-full" role="img" aria-label={`${definition.label} over time. ${changeText}`}>
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                  minHeight={240}
                  initialDimension={{ width: 640, height: 240 }}
                >
              <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: -20 }} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.16} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [`${String(value)}/10`, definition.label]}
                  labelFormatter={(label) => String(label)}
                  contentStyle={{ borderRadius: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={definition.label}
                  stroke="#0f766e"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0f766e' }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <details className="mt-2">
            <summary className="min-h-11 cursor-pointer py-3 text-sm font-bold text-calm outline-none focus:ring-2 focus:ring-calm/30">
              Text table for this graph
            </summary>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-line dark:border-slate-700"><th className="p-2">Date</th><th className="p-2">Recorded value</th></tr></thead>
                <tbody>
                  {data.map((point, index) => <tr key={`${point.date}-${point.value}-${index}`} className="border-b border-line dark:border-slate-800"><td className="p-2">{point.dateLabel}</td><td className="p-2">{point.value}/10</td></tr>)}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted">No values for this metric in the selected range.</p>
      )}
    </div>
  )
}

function ShareWorkspace({
  activities,
  nightmares,
  plan,
  program,
  progress,
  responses,
  reviews,
  sessions,
  status,
}: {
  activities: TreatmentActivity[]
  nightmares: TreatmentNightmareEntry[]
  plan?: TreatmentProgramPlan
  program: TreatmentProgram
  progress: ReturnType<typeof summarizeProgramProgress>
  responses: TreatmentResponse[]
  reviews: TreatmentReview[]
  sessions: TreatmentSession[]
  status: TreatmentProgramStatus
}) {
  const [includePlan, setIncludePlan] = useState(false)
  const [activityIds, setActivityIds] = useState<string[]>([])
  const [responseIds, setResponseIds] = useState<string[]>([])
  const [nightmareIds, setNightmareIds] = useState<string[]>([])
  const [sessionIds, setSessionIds] = useState<string[]>([])
  const [reviewIds, setReviewIds] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const selectedCount = (includePlan && plan ? 1 : 0) + activityIds.length + responseIds.length + nightmareIds.length + sessionIds.length + reviewIds.length

  const toggle = (id: string, current: string[], setter: (value: string[]) => void) =>
    setter(current.includes(id) ? current.filter((item) => item !== id) : [...current, id])

  const clear = () => {
    setIncludePlan(false)
    setActivityIds([])
    setResponseIds([])
    setNightmareIds([])
    setSessionIds([])
    setReviewIds([])
  }

  const exportSelected = async () => {
    if (!selectedCount) return
    if (!window.confirm('This clinician report may contain highly sensitive Treatment information. It will include only the items you selected. Continue only if you intend to save or share them.')) return
    const { buildTreatmentHandoffDocx } = await import('./lib/treatmentExport')
    const blob = await buildTreatmentHandoffDocx({
      program,
      status,
      completedModuleCount: progress.completed,
      plan,
      activities,
      nightmares,
      responses,
      sessions,
      reviews,
      selection: { includePlan, activityIds, responseIds, nightmareIds, sessionIds, reviewIds },
    })
    await saveBlobFile(
      `salience-${program.id}-clinician-report-${localDateKey()}.docx`,
      blob,
      'Salience clinician report',
    )
    setMessage('Clinician report prepared as a Word document.')
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Create a clinician report</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted dark:text-slate-300">Build a user-controlled report for a clinician or support person. Nothing is included automatically. Select only what you want in the Word document, then review where you save or send it.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => {
          setIncludePlan(Boolean(plan))
          setActivityIds(activities.map((item) => item.id))
          setResponseIds(responses.map((item) => item.id))
          setNightmareIds(nightmares.map((item) => item.id))
          setSessionIds(sessions.map((item) => item.id))
          setReviewIds(reviews.map((item) => item.id))
        }} className={secondaryButtonClass}>Select all available</button>
        <button type="button" onClick={clear} className={secondaryButtonClass}>Clear</button>
      </div>
      {plan ? (
        <SelectionGroup title="Program plan">
          <SelectionRow checked={includePlan} label="My program plan" onChange={() => setIncludePlan((current) => !current)} />
        </SelectionGroup>
      ) : null}
      {activities.length ? (
        <SelectionGroup title="Chosen activities">
          {activities.map((activity) => (
            <SelectionRow
              key={activity.id}
              checked={activityIds.includes(activity.id)}
              label={`${activity.title} · ${treatmentActivityStatusLabels[activity.status]} · ${treatmentActivitySourceLabels[activity.source]}`}
              onChange={() => toggle(activity.id, activityIds, setActivityIds)}
            />
          ))}
        </SelectionGroup>
      ) : null}
      {responses.length ? (
        <SelectionGroup title="Worksheets">
          {responses.map((response) => {
            const module = program.modules.find((item) => item.id === response.moduleId)
            return <SelectionRow key={response.id} checked={responseIds.includes(response.id)} label={`${module?.title ?? response.moduleId} · ${response.status} · ${displayDateTime(response.updatedAt)}`} onChange={() => toggle(response.id, responseIds, setResponseIds)} />
          })}
        </SelectionGroup>
      ) : null}
      {nightmares.length ? (
        <SelectionGroup title="Nightmare records">
          {[...nightmares].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map((nightmare) => (
            <SelectionRow
              key={nightmare.id}
              checked={nightmareIds.includes(nightmare.id)}
              label={`${displayDateTime(nightmare.timestamp)} · intensity ${nightmare.intensity}/10${nightmare.themeTags.length ? ` · ${nightmare.themeTags.join(', ')}` : ''}`}
              onChange={() => toggle(nightmare.id, nightmareIds, setNightmareIds)}
            />
          ))}
        </SelectionGroup>
      ) : null}
      {sessions.length ? (
        <SelectionGroup title="Appointment notes">
          {sessions.map((session) => <SelectionRow key={session.id} checked={sessionIds.includes(session.id)} label={`${displayDateTime(session.appointmentAt)} · ${session.status}`} onChange={() => toggle(session.id, sessionIds, setSessionIds)} />)}
        </SelectionGroup>
      ) : null}
      {reviews.length ? (
        <SelectionGroup title="Progress reviews">
          {reviews.map((review) => <SelectionRow key={review.id} checked={reviewIds.includes(review.id)} label={displayDate(review.reviewDate)} onChange={() => toggle(review.id, reviewIds, setReviewIds)} />)}
        </SelectionGroup>
      ) : null}
      {!plan && !activities.length && !responses.length && !nightmares.length && !sessions.length && !reviews.length ? <p className="text-sm text-muted">There is no saved pathway material to select yet.</p> : null}
      <button type="button" disabled={!selectedCount} onClick={() => void exportSelected()} className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}><Download className="h-5 w-5" /> Create clinician report ({selectedCount || 0})</button>
      {message ? <StatusMessage>{message}</StatusMessage> : null}
    </div>
  )
}

export function TreatmentModuleScreen({
  data,
  headingRef,
  module,
  onChanged,
  onLeave,
  onNightmare,
  onPause,
  program,
}: {
  data: AppData
  headingRef: RefObject<HTMLHeadingElement | null>
  module: TreatmentContentItem
  onChanged: () => Promise<void>
  onLeave: () => void
  onNightmare: () => void
  onPause: () => void
  program: TreatmentProgram
}) {
  const records = useMemo(
    () => data.treatmentResponses
      .filter((response) => response.programId === program.id && response.moduleId === module.id)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [data.treatmentResponses, module.id, program.id],
  )
  const initial = records.find((record) => record.status === 'draft') ?? records[0]
  const linkableActivities = data.treatmentActivities.filter((activity) =>
    activity.programId === program.id
    && (!activity.relatedModuleId || activity.relatedModuleId === module.id)
    && module.deliveryMode === 'self-guided')
  const globallyHiddenPromptIds = module.prompts
    .filter((prompt) => data.treatmentSettings.hiddenTreatmentPromptIds.includes(`${program.id}:${module.id}:${prompt.id}`))
    .map((prompt) => prompt.id)
  const [recordId, setRecordId] = useState(initial?.id ?? uid())
  const [relatedActivityId, setRelatedActivityId] = useState(initial?.relatedActivityId ?? '')
  const [values, setValues] = useState<Record<string, string>>(initial?.values ?? {})
  const [hiddenPromptIds, setHiddenPromptIds] = useState(
    [...new Set([...(initial?.hiddenPromptIds ?? []), ...globallyHiddenPromptIds])],
  )
  const [stepIndex, setStepIndex] = useState(initial?.lastStepIndex ?? 0)
  const [activationBefore, setActivationBefore] = useState(initial?.activationBefore?.toString() ?? '')
  const [activationAfter, setActivationAfter] = useState(initial?.activationAfter?.toString() ?? '')
  const [helpfulness, setHelpfulness] = useState(initial?.helpfulness?.toString() ?? '')
  const [keyTakeaway, setKeyTakeaway] = useState(initial?.keyTakeaway ?? '')
  const [plannedNextStep, setPlannedNextStep] = useState(initial?.plannedNextStep ?? '')
  const [createdAt, setCreatedAt] = useState<string | undefined>(initial?.createdAt)
  const [message, setMessage] = useState('')
  const reviewStep = {
    id: 'review',
    title: 'Review and choose',
    body: 'Save a draft or mark this pathway activity reviewed. Every field is optional.',
    promptIds: [] as string[],
  }
  const steps = [...module.steps, reviewStep]
  const safeStepIndex = Math.min(stepIndex, steps.length - 1)
  const currentStep = steps[safeStepIndex]
  const isReview = currentStep.id === 'review'
  const visiblePrompts = module.prompts.filter((prompt) =>
    currentStep.promptIds.includes(prompt.id) && !hiddenPromptIds.includes(prompt.id))

  const loadRecord = (record: TreatmentResponse) => {
    setRecordId(record.id)
    setRelatedActivityId(record.relatedActivityId ?? '')
    setValues(record.values)
    setHiddenPromptIds([...new Set([...record.hiddenPromptIds, ...globallyHiddenPromptIds])])
    setStepIndex(record.lastStepIndex)
    setActivationBefore(record.activationBefore?.toString() ?? '')
    setActivationAfter(record.activationAfter?.toString() ?? '')
    setHelpfulness(record.helpfulness?.toString() ?? '')
    setKeyTakeaway(record.keyTakeaway ?? '')
    setPlannedNextStep(record.plannedNextStep ?? '')
    setCreatedAt(record.createdAt)
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const startNew = () => {
    setRecordId(uid())
    setRelatedActivityId('')
    setValues({})
    setHiddenPromptIds(globallyHiddenPromptIds)
    setStepIndex(0)
    setActivationBefore('')
    setActivationAfter('')
    setHelpfulness('')
    setKeyTakeaway('')
    setPlannedNextStep('')
    setCreatedAt(undefined)
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const persist = async (
    status: TreatmentResponse['status'],
    nextStepIndex = safeStepIndex,
    leave = false,
  ) => {
    const now = new Date().toISOString()
    const storedRecord = records.find((record) => record.id === recordId)
    const effectiveStatus = status === 'draft' && storedRecord?.status === 'completed'
      ? 'completed'
      : status
    const response: TreatmentResponse = {
      id: recordId,
      programId: program.id,
      moduleId: module.id,
      relatedActivityId: relatedActivityId || undefined,
      values,
      hiddenPromptIds,
      clinicianAssigned: false,
      status: effectiveStatus,
      lastStepIndex: nextStepIndex,
      activationBefore: activationBefore === '' ? undefined : Number(activationBefore),
      activationAfter: activationAfter === '' ? undefined : Number(activationAfter),
      helpfulness: helpfulness === '' ? undefined : Number(helpfulness),
      keyTakeaway: keyTakeaway.trim() || undefined,
      plannedNextStep: plannedNextStep.trim() || undefined,
      startedAt: createdAt ?? now,
      completedAt: effectiveStatus === 'completed' ? storedRecord?.completedAt ?? now : undefined,
      createdAt: createdAt ?? now,
      updatedAt: now,
    }
    await db.treatmentResponses.put(response)
    const moduleKey = `${program.id}:${module.id}`
    const completedModules = effectiveStatus === 'completed'
      ? data.treatmentProgress.completedModules.includes(moduleKey)
        ? data.treatmentProgress.completedModules
        : [...data.treatmentProgress.completedModules, moduleKey]
      : data.treatmentProgress.completedModules
    await db.treatmentProgress.put({ ...data.treatmentProgress, completedModules, updatedAt: now })
    setCreatedAt(response.createdAt)
    await onChanged()
    setMessage(effectiveStatus === 'completed' ? 'Reviewed record saved locally.' : 'Draft saved locally.')
    if (leave) onLeave()
  }

  const move = async (direction: -1 | 1) => {
    const next = Math.max(0, Math.min(steps.length - 1, safeStepIndex + direction))
    if (direction > 0) await persist('draft', next)
    setStepIndex(next)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const pause = async () => {
    const hasContent = Object.values(values).some(Boolean)
      || relatedActivityId !== ''
      || activationBefore !== ''
      || activationAfter !== ''
      || helpfulness !== ''
      || keyTakeaway.trim()
      || plannedNextStep.trim()
    if (hasContent) await persist('draft', safeStepIndex)
    onPause()
  }

  const deleteRecord = async () => {
    if (!records.some((record) => record.id === recordId)) {
      startNew()
      return
    }
    if (!window.confirm('Delete this saved module record?')) return
    await db.treatmentResponses.delete(recordId)
    const remaining = records.filter((record) => record.id !== recordId)
    const moduleKey = `${program.id}:${module.id}`
    if (!remaining.some((record) => record.status === 'completed')) {
      await db.treatmentProgress.put({
        ...data.treatmentProgress,
        completedModules: data.treatmentProgress.completedModules.filter((id) => id !== moduleKey),
        updatedAt: new Date().toISOString(),
      })
    }
    await onChanged()
    if (remaining[0]) loadRecord(remaining[0])
    else startNew()
    setMessage('Record deleted.')
  }

  const hidePrompt = async (promptId: string) => {
    const key = `${program.id}:${module.id}:${promptId}`
    setHiddenPromptIds((current) => current.includes(promptId) ? current : [...current, promptId])
    if (!data.treatmentSettings.hiddenTreatmentPromptIds.includes(key)) {
      await db.treatmentSettings.put({
        ...data.treatmentSettings,
        hiddenTreatmentPromptIds: [...data.treatmentSettings.hiddenTreatmentPromptIds, key],
        updatedAt: new Date().toISOString(),
      })
      await onChanged()
    }
  }

  const showPrompts = async (promptIds: string[]) => {
    const keys = new Set(promptIds.map((promptId) => `${program.id}:${module.id}:${promptId}`))
    setHiddenPromptIds((current) => current.filter((id) => !promptIds.includes(id)))
    await db.treatmentSettings.put({
      ...data.treatmentSettings,
      hiddenTreatmentPromptIds: data.treatmentSettings.hiddenTreatmentPromptIds.filter((key) => !keys.has(key)),
      updatedAt: new Date().toISOString(),
    })
    await onChanged()
  }

  return (
    <div className="space-y-4">
      <TreatmentExerciseToolbar onNightmare={onNightmare} onPause={() => void pause()} />
      <div>
        <p className="text-sm font-bold text-calm">{program.name} · {module.phaseTitle}</p>
        <h1 ref={headingRef} tabIndex={-1} className="mt-1 text-3xl font-bold outline-none">{module.title}</h1>
        <p className="mt-2 text-sm text-muted dark:text-slate-300">About {module.estimatedMinutes} minutes · {module.repeatable ? 'Repeatable record' : 'Return whenever needed'}</p>
      </div>
      {module.deliveryMode === 'information-only' ? (
        <div className="rounded-lg border border-ocean/30 bg-blue-50 p-4 text-sm dark:border-blue-900 dark:bg-blue-950">
          <p className="flex items-center gap-2 font-bold text-ocean dark:text-blue-200"><ShieldCheck className="h-5 w-5" /> Information only · procedure not performed by Salience</p>
          <p className="mt-2 leading-6 text-slate-700 dark:text-slate-200">You can read this explanation independently. The self-guided pathway does not ask you to carry out the procedure described here.</p>
          <p className="mt-2 leading-6 text-slate-700 dark:text-slate-200">This screen contains no trauma-recall prompt, exposure script, recording, timer, target selection, or bilateral stimulation.</p>
        </div>
      ) : module.structuredTreatment ? (
        <div className="rounded-lg border border-calm/30 bg-teal-50 p-4 text-sm dark:border-teal-800 dark:bg-teal-950">
          <p className="flex items-center gap-2 font-bold text-calm dark:text-teal-100"><ShieldCheck className="h-5 w-5" /> Structured treatment worksheet</p>
          <p className="mt-2 leading-6 text-slate-700 dark:text-slate-200">This prototype lets you complete the worksheet in your own words and save it locally. It can be reviewed with a psychiatrist, psychologist, or other qualified professional if you choose. Salience does not make medication decisions or run trauma-processing procedures.</p>
        </div>
      ) : (
        <p className="rounded-lg bg-teal-50 p-3 text-sm font-bold text-calm dark:bg-teal-950 dark:text-teal-100">Self-guided pathway · no clinician unlock or supervision required</p>
      )}
      {linkableActivities.length ? (
        <div className="rounded-lg border border-line bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <Field label="Link this record to a chosen activity (optional)">
            <select value={relatedActivityId} onChange={(event) => setRelatedActivityId(event.target.value)} className={inputClass}>
              <option value="">Not linked</option>
              {linkableActivities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.title} · {treatmentActivityStatusLabels[activity.status]}
                </option>
              ))}
            </select>
          </Field>
        </div>
      ) : null}

      <div aria-label={`Step ${safeStepIndex + 1} of ${steps.length}`} className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full bg-calm transition-[width] motion-reduce:transition-none" style={{ width: `${((safeStepIndex + 1) / steps.length) * 100}%` }} />
        </div>
        <span className="text-xs font-bold text-muted">Step {safeStepIndex + 1} of {steps.length}</span>
      </div>

      <TreatmentCard>
        <h2 className="text-xl font-bold">{currentStep.title}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200">{currentStep.body}</p>
        {currentStep.id === 'understand' && module.keyPoints.length ? (
          <ul className="mt-4 space-y-2">
            {module.keyPoints.map((point) => <li key={point} className="flex gap-2 text-sm leading-6"><Check className="mt-1 h-4 w-4 shrink-0 text-calm" /><span>{point}</span></li>)}
          </ul>
        ) : null}
        {currentStep.id === 'understand' && module.deliveryMode === 'self-guided' ? (
          <Field label="How activated or unsettled do I feel right now? (optional)">
            <RatingSelect value={activationBefore} onChange={setActivationBefore} low="Not at all" high="As intense as I can imagine" />
          </Field>
        ) : null}
        {visiblePrompts.length ? (
          <div className="mt-5 space-y-5">
            {visiblePrompts.map((prompt) => (
              <PromptField
                key={prompt.id}
                id={`${recordId}-${prompt.id}`}
                prompt={prompt}
                value={values[prompt.id] ?? ''}
                onChange={(value) => setValues((current) => ({ ...current, [prompt.id]: value }))}
                onHide={() => void hidePrompt(prompt.id)}
              />
            ))}
          </div>
        ) : null}
        {currentStep.promptIds.some((id) => hiddenPromptIds.includes(id)) ? (
          <button type="button" onClick={() => void showPrompts(currentStep.promptIds)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold text-calm outline-none focus:ring-2 focus:ring-calm/30">
            <RotateCcw className="h-4 w-4" /> Show hidden prompts in this step
          </button>
        ) : null}
        {isReview ? (
          <div className="mt-5 space-y-4">
            {module.deliveryMode === 'self-guided' ? <Field label="How activated or unsettled do I feel now? (optional)"><RatingSelect value={activationAfter} onChange={setActivationAfter} low="Not at all" high="As intense as I can imagine" /></Field> : null}
            <Field label={`How useful was this ${module.deliveryMode === 'information-only' ? 'information' : 'pathway activity'} today? (optional)`}><RatingSelect value={helpfulness} onChange={setHelpfulness} low="Not useful" high="Very useful" /></Field>
            <Field label="What do I want to remember? (optional)"><textarea value={keyTakeaway} onChange={(event) => setKeyTakeaway(event.target.value)} rows={3} className={textareaClass} /></Field>
            <Field label="A next step I choose (optional)"><textarea value={plannedNextStep} onChange={(event) => setPlannedNextStep(event.target.value)} rows={2} className={textareaClass} /></Field>
            <p className="rounded-lg bg-slate-100 p-3 text-xs leading-5 text-muted dark:bg-slate-800 dark:text-slate-300">A change in activation is not a score and is never treated as success or failure.</p>
          </div>
        ) : null}
      </TreatmentCard>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={safeStepIndex === 0} onClick={() => void move(-1)} className={`${secondaryButtonClass} disabled:opacity-40`}><ChevronLeft className="h-5 w-5" /> Back</button>
        {!isReview ? (
          <button type="button" onClick={() => void move(1)} className={primaryButtonClass}>Save and continue <ChevronRight className="h-5 w-5" /></button>
        ) : (
          <button type="button" onClick={() => void persist('completed', safeStepIndex)} className={primaryButtonClass}><Check className="h-5 w-5" /> Mark reviewed</button>
        )}
        <button type="button" onClick={() => void persist('draft', safeStepIndex)} className={secondaryButtonClass}><Save className="h-5 w-5" /> Save draft</button>
        <button type="button" onClick={() => void persist('draft', safeStepIndex, true)} className={secondaryButtonClass}>Save and leave</button>
        <button type="button" onClick={onLeave} className={secondaryButtonClass}>Return later / Skip</button>
        <button type="button" onClick={() => void deleteRecord()} className={`${secondaryButtonClass} text-clay`}><Trash2 className="h-5 w-5" /> Delete record</button>
      </div>
      {message ? <StatusMessage>{message}</StatusMessage> : null}

      {module.repeatable || records.length > 1 ? (
        <section className="border-t border-line pt-4 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold">Saved records</h2>
            {module.repeatable ? <button type="button" onClick={startNew} className={secondaryButtonClass}><Plus className="h-5 w-5" /> New record</button> : null}
          </div>
          {records.length ? (
            <div className="mt-3 grid gap-2">
              {records.map((record) => (
                <button key={record.id} type="button" onClick={() => loadRecord(record)} aria-current={record.id === recordId ? 'true' : undefined} className={`flex min-h-12 items-center justify-between gap-3 rounded-lg border px-3 text-left outline-none focus:ring-2 focus:ring-calm/30 ${record.id === recordId ? 'border-calm bg-teal-50 dark:bg-teal-950' : 'border-line dark:border-slate-700'}`}>
                  <span><span className="block text-sm font-bold">{displayDateTime(record.updatedAt)}</span><span className="block text-xs capitalize text-muted">{record.status}</span></span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ))}
            </div>
          ) : <p className="mt-2 text-sm text-muted">No records saved yet.</p>}
        </section>
      ) : null}
      <p className="text-xs leading-5 text-muted dark:text-slate-400">Source: {module.sourceOrganisation}, {module.sourcePublicationOrReviewYear}. Clinical review status: pending professional review.</p>
    </div>
  )
}

function PromptField({
  id,
  onChange,
  onHide,
  prompt,
  value,
}: {
  id: string
  onChange: (value: string) => void
  onHide: () => void
  prompt: TreatmentPrompt
  value: string
}) {
  const selectedValues = new Set(value.split('|').filter(Boolean))
  const toggleMultiSelect = (optionValue: string) => {
    const next = new Set(selectedValues)
    if (next.has(optionValue)) next.delete(optionValue)
    else next.add(optionValue)
    onChange(prompt.options?.filter((option) => next.has(option.value)).map((option) => option.value).join('|') ?? '')
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        {prompt.inputType === 'multiselect' ? (
          <span id={`${id}-label`} className="text-sm font-bold">{prompt.label}</span>
        ) : <label htmlFor={id} className="text-sm font-bold">{prompt.label}</label>}
        <button type="button" onClick={onHide} className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-bold text-muted outline-none hover:bg-slate-100 focus:ring-2 focus:ring-calm/30 dark:hover:bg-slate-800">
          <EyeOff className="h-4 w-4" /> Hide
        </button>
      </div>
      {prompt.helper ? <p id={`${id}-help`} className="mt-1 text-xs leading-5 text-muted">{prompt.helper}</p> : null}
      {prompt.inputType === 'multiselect' ? (
        <fieldset aria-labelledby={`${id}-label`} aria-describedby={prompt.helper ? `${id}-help` : undefined} className="mt-2 grid gap-2">
          <legend className="sr-only">{prompt.label}</legend>
          {prompt.options?.map((option) => (
            <label key={option.value} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-line bg-white px-3 text-sm font-semibold outline-none focus-within:border-calm focus-within:ring-2 focus-within:ring-calm/20 dark:border-slate-700 dark:bg-slate-950">
              <input type="checkbox" checked={selectedValues.has(option.value)} onChange={() => toggleMultiSelect(option.value)} className="h-5 w-5 accent-calm" />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>
      ) : prompt.inputType === 'select' ? (
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)} aria-describedby={prompt.helper ? `${id}-help` : undefined} className={`${inputClass} mt-2`}>
          <option value="">Not selected</option>
          {prompt.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : prompt.inputType === 'rating' ? (
        <div className="mt-2"><RatingSelect id={id} value={value} onChange={onChange} low="No distress" high="Highest distress" /></div>
      ) : prompt.inputType === 'date' ? (
        <input id={id} type="date" value={value} onChange={(event) => onChange(event.target.value)} aria-describedby={prompt.helper ? `${id}-help` : undefined} className={`${inputClass} mt-2`} />
      ) : prompt.inputType === 'textarea' || prompt.multiline ? (
        <textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} aria-describedby={prompt.helper ? `${id}-help` : undefined} rows={4} className={`${textareaClass} mt-2`} />
      ) : (
        <input id={id} value={value} onChange={(event) => onChange(event.target.value)} aria-describedby={prompt.helper ? `${id}-help` : undefined} className={`${inputClass} mt-2`} />
      )}
    </div>
  )
}

function RatingSelect({
  id,
  high,
  low,
  onChange,
  value,
}: {
  id?: string
  high: string
  low: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
      <option value="">Not recorded</option>
      {Array.from({ length: 11 }, (_, rating) => <option key={rating} value={rating}>{rating}{rating === 0 ? ` · ${low}` : rating === 10 ? ` · ${high}` : ''}</option>)}
    </select>
  )
}

export function TreatmentExerciseToolbar({ onNightmare, onPause }: { onNightmare: () => void; onPause: () => void }) {
  return (
    <div className="sticky top-16 z-20 grid grid-cols-2 gap-2 rounded-lg border border-line bg-white/95 p-2 shadow-card backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:top-3">
      <button type="button" onClick={onPause} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-calm px-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-calm/30"><Pause className="h-5 w-5" /> Pause and ground</button>
      <button type="button" onClick={onNightmare} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-line px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-calm/30 dark:border-slate-700"><MoonStar className="h-5 w-5" /> Nightmare support</button>
    </div>
  )
}

function SelectionGroup({ children, title }: { children: ReactNode; title: string }) {
  return <fieldset><legend className="font-bold">{title}</legend><div className="mt-2 grid gap-2">{children}</div></fieldset>
}

function SelectionRow({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return <label className="flex min-h-12 items-center gap-3 rounded-lg border border-line bg-white px-3 dark:border-slate-800 dark:bg-slate-900"><input type="checkbox" checked={checked} onChange={onChange} className="h-5 w-5 accent-calm" /><span className="text-sm font-semibold">{label}</span></label>
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return <label className="block"><span className="text-sm font-bold">{label}</span><span className="mt-2 block">{children}</span></label>
}

function TreatmentCard({ children }: { children: ReactNode }) {
  return <section className="rounded-lg border border-line bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-5">{children}</section>
}

function StatusMessage({ children }: { children: ReactNode }) {
  return <p role="status" className="rounded-lg bg-teal-50 p-3 text-sm font-bold text-calm dark:bg-teal-950 dark:text-teal-100">{children}</p>
}

const inputClass = 'min-h-12 w-full rounded-lg border border-line bg-white px-3 text-base outline-none focus:border-calm focus:ring-2 focus:ring-calm/20 dark:border-slate-700 dark:bg-slate-950'
const textareaClass = 'w-full rounded-lg border border-line bg-white px-3 py-2 text-base outline-none focus:border-calm focus:ring-2 focus:ring-calm/20 dark:border-slate-700 dark:bg-slate-950'
const primaryButtonClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-calm px-4 text-sm font-bold text-white outline-none hover:bg-teal-800 focus:ring-2 focus:ring-calm/30'
const secondaryButtonClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-line px-4 text-sm font-bold outline-none hover:bg-slate-50 focus:ring-2 focus:ring-calm/30 dark:border-slate-700 dark:hover:bg-slate-800'
const iconDeleteClass = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-clay outline-none hover:bg-red-50 focus:ring-2 focus:ring-clay/30 dark:hover:bg-red-950'
