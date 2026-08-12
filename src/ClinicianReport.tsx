import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileJson,
  FileSpreadsheet,
  FileText,
  Info,
  Pencil,
  Printer,
  Share2,
  ShieldCheck,
  X,
} from 'lucide-react'
import {
  anxietyContributorOptions,
  beliefCertaintyOptions,
  depressionContributorOptions,
  depressionSymptomOptions,
  eveningMoodOptions,
  nightmareAfterOptions,
  nightmareIntensityOptions,
  nightmareWakeOptions,
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
  thinkingClarityOptions,
  type Option,
} from './data/options'
import {
  coverageLevelLabel,
  prepareClinicianReport,
  type PreparedClinicianReport,
  type ReportCoverageItem,
  type ReportDistributionRow,
  type ReportFrequencyRow,
  type ReportKeyMeasure,
  type SummaryFinding,
} from './lib/clinicianReport'
import { daysAgoRange, displayDate, displayDateTime, isoInDateRange } from './lib/dates'
import { saveBlobFile } from './lib/fileExport'
import { toggleValue } from './lib/selection'
import type { AppData } from './types'

type ReportView = 'overview' | 'detailed'
type ReportPreset = '7' | '14' | '30' | 'custom'
type ExportFormat = 'pdf' | 'word' | 'print' | 'excel' | 'csv' | 'json'

interface ReportScope {
  preset: ReportPreset
  start: string
  end: string
  includeNotes: boolean
  includeNightmareNotes: boolean
  includeSubstanceSummary: boolean
  includeSubstanceDetails: boolean
  selectedJournalIds: string[]
}

const initialReportScope = (): ReportScope => {
  const range = daysAgoRange(7)
  return {
    preset: '7',
    start: range.start,
    end: range.end,
    includeNotes: false,
    includeNightmareNotes: false,
    includeSubstanceSummary: false,
    includeSubstanceDetails: false,
    selectedJournalIds: [],
  }
}

const presetLabels: Record<ReportPreset, string> = {
  '7': 'Last 7 days',
  '14': 'Last 14 days',
  '30': 'Last 30 days',
  custom: 'Custom range',
}

const sectionClass = 'rounded-lg border border-line bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-5'
const primaryButtonClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-calm px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-800 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
const secondaryButtonClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-calm/60 focus-visible:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

export function ClinicianReport({ data, substanceTrackingEnabled }: { data: AppData; substanceTrackingEnabled: boolean }) {
  const [scope, setScope] = useState<ReportScope>(initialReportScope)
  const [draftScope, setDraftScope] = useState<ReportScope | null>(null)
  const [activeView, setActiveView] = useState<ReportView>('overview')
  const [shareOpen, setShareOpen] = useState(false)
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const [contributorsExpanded, setContributorsExpanded] = useState(false)
  const [message, setMessage] = useState('')

  const report = useMemo(() => prepareClinicianReport(data, scope.start, scope.end, {
    includeNotes: scope.includeNotes,
    includeNightmareNotes: scope.includeNightmareNotes,
    includeSubstanceSummary: substanceTrackingEnabled && scope.includeSubstanceSummary,
    includeSubstanceDetails: substanceTrackingEnabled && scope.includeSubstanceDetails,
    selectedJournalIds: scope.selectedJournalIds,
  }), [data, scope, substanceTrackingEnabled])

  const openScopeEditor = () => setDraftScope({ ...scope, selectedJournalIds: [...scope.selectedJournalIds] })

  const applyScope = () => {
    if (!draftScope) return
    if (!draftScope.start || !draftScope.end || draftScope.start > draftScope.end) {
      setMessage('Choose a valid report date range.')
      return
    }
    const selectedInRange = new Set(
      data.journalEntries
        .filter((entry) => isoInDateRange(entry.createdAt, draftScope.start, draftScope.end))
        .map((entry) => entry.id),
    )
    setScope({
      ...draftScope,
      selectedJournalIds: draftScope.selectedJournalIds.filter((id) => selectedInRange.has(id)),
      includeSubstanceSummary: substanceTrackingEnabled && draftScope.includeSubstanceSummary,
      includeSubstanceDetails: substanceTrackingEnabled && draftScope.includeSubstanceDetails,
    })
    setDraftScope(null)
    setMessage('Report scope updated.')
  }

  const confirmSensitiveExport = () => {
    if (!report.substanceUse.included || report.substanceUse.entriesWithUse === 0) return true
    return window.confirm('This export includes substance-use information. Continue only if you intend to save or share it.')
  }

  const exportReport = async (format: ExportFormat) => {
    if (!confirmSensitiveExport()) return
    setMessage('Preparing report locally.')
    try {
      if (format === 'print') {
        setShareOpen(false)
        window.setTimeout(() => window.print(), 80)
        return
      }

      let blob: Blob
      let extension: string
      let title: string
      if (format === 'word') {
        const { buildReportDocxBlob } = await import('./lib/reportFiles')
        blob = await buildReportDocxBlob(report)
        extension = 'docx'
        title = 'Salience Word report'
      } else if (format === 'pdf') {
        const { buildReportPdfBlob } = await import('./lib/reportFiles')
        blob = buildReportPdfBlob(report)
        extension = 'pdf'
        title = 'Salience PDF report'
      } else if (format === 'excel') {
        const { buildReportExcelBlob } = await import('./lib/reportFiles')
        blob = buildReportExcelBlob(report)
        extension = 'xls'
        title = 'Salience Excel report'
      } else if (format === 'csv') {
        const { buildReportCsvBlob } = await import('./lib/reportFiles')
        blob = buildReportCsvBlob(report)
        extension = 'csv'
        title = 'Salience CSV report'
      } else {
        blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
        extension = 'json'
        title = 'Salience JSON report'
      }

      const result = await saveBlobFile(
        `salience-report-${scope.start}-to-${scope.end}.${extension}`,
        blob,
        title,
      )
      setMessage(result === 'shared' ? `${title} ready to share.` : `${title} prepared.`)
      setShareOpen(false)
    } catch {
      setMessage('The report could not be prepared. Your saved entries were not changed.')
    }
  }

  const previewReport = () => {
    setActiveView('overview')
    setShareOpen(false)
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }))
  }

  return (
    <div className="pb-8 print:pb-0">
      <div className="print:hidden">
        <div className="mb-4 flex items-start justify-between gap-3 lg:mb-6">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-normal lg:text-4xl">Clinician report</h1>
            <p className="mt-1 text-sm leading-5 text-muted dark:text-slate-300">A factual summary of information you choose to include.</p>
          </div>
          <button type="button" onClick={() => setShareOpen(true)} className={`${primaryButtonClass} shrink-0 px-3 sm:px-4`} aria-label="Share clinician report">
            <Share2 className="h-5 w-5" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>

        <ReportScopeBar scope={scope} onEdit={openScopeEditor} />
        <ReportViewTabs activeView={activeView} onChange={setActiveView} />

        {message ? <div className="mb-4 rounded-lg bg-teal-50 px-4 py-3 text-sm font-semibold text-calm dark:bg-teal-950 dark:text-teal-100" role="status" aria-live="polite">{message}</div> : null}

        {activeView === 'overview' ? (
          <OverviewView
            report={report}
            summaryExpanded={summaryExpanded}
            onToggleSummary={() => setSummaryExpanded((value) => !value)}
            contributorsExpanded={contributorsExpanded}
            onToggleContributors={() => setContributorsExpanded((value) => !value)}
            onShare={() => setShareOpen(true)}
          />
        ) : <DetailedDataView report={report} />}

        <div className="mt-4 flex gap-3 rounded-lg border border-line bg-slate-50 p-3 text-xs leading-5 text-muted dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-calm" aria-hidden="true" />
          <p>Salience is a private tracking tool. This report summarises information you recorded and is not a diagnosis or treatment recommendation.</p>
        </div>
      </div>

      <PrintReport report={report} />

      {draftScope ? (
        <ReportScopeEditor
          draft={draftScope}
          onChange={setDraftScope}
          onApply={applyScope}
          onClose={() => setDraftScope(null)}
          journalEntries={data.journalEntries}
          substanceTrackingEnabled={substanceTrackingEnabled}
        />
      ) : null}

      {shareOpen ? (
        <ShareReportSheet
          report={report}
          onClose={() => setShareOpen(false)}
          onPreview={previewReport}
          onExport={(format) => void exportReport(format)}
        />
      ) : null}
    </div>
  )
}

function ReportScopeBar({ scope, onEdit }: { scope: ReportScope; onEdit: () => void }) {
  return (
    <div className="mb-3 flex min-h-14 items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <CalendarDays className="h-5 w-5 shrink-0 text-calm" aria-hidden="true" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{displayDate(scope.start)} to {displayDate(scope.end)}</p>
          <p className="text-xs text-muted dark:text-slate-300">{presetLabels[scope.preset]}</p>
        </div>
      </div>
      <button type="button" onClick={onEdit} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-bold text-calm hover:bg-teal-50 dark:hover:bg-teal-950" aria-label={`Edit report scope, ${scope.start} to ${scope.end}, ${presetLabels[scope.preset]}`}>
        <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
      </button>
    </div>
  )
}

function ReportViewTabs({ activeView, onChange }: { activeView: ReportView; onChange: (view: ReportView) => void }) {
  return (
    <div className="mb-4 grid grid-cols-2 rounded-lg bg-slate-200 p-1 dark:bg-slate-800" role="tablist" aria-label="Report view">
      {([
        ['overview', 'Overview'],
        ['detailed', 'Detailed data'],
      ] as const).map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={activeView === value}
          onClick={() => onChange(value)}
          className={`min-h-11 rounded-md px-3 text-sm font-bold ${activeView === value ? 'bg-white text-calm shadow-card dark:bg-slate-950 dark:text-teal-200' : 'text-slate-600 dark:text-slate-300'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function OverviewView({
  report,
  summaryExpanded,
  onToggleSummary,
  contributorsExpanded,
  onToggleContributors,
  onShare,
}: {
  report: PreparedClinicianReport
  summaryExpanded: boolean
  onToggleSummary: () => void
  contributorsExpanded: boolean
  onToggleContributors: () => void
  onShare: () => void
}) {
  const findings = summaryExpanded ? report.summaryFindings : report.summaryFindings.slice(0, 4)
  const recordedContributorRows = report.contributorRows.filter((row) => row.anxietyCount || row.depressionCount)
  const contributors = contributorsExpanded ? recordedContributorRows : recordedContributorRows.slice(0, 5)

  return (
    <div className="space-y-4">
      <DataCoverageSection items={report.coverage} />

      <section className={sectionClass} aria-labelledby="report-at-a-glance">
        <h2 id="report-at-a-glance" className="text-lg font-bold">At a glance</h2>
        <div className="mt-3 divide-y divide-line dark:divide-slate-800">
          {findings.map((item) => <SummaryFindingRow key={item.id} finding={item} />)}
        </div>
        {report.summaryFindings.length > 4 ? (
          <button type="button" onClick={onToggleSummary} className="mt-3 min-h-11 text-sm font-bold text-calm" aria-expanded={summaryExpanded}>
            {summaryExpanded ? 'Show concise summary' : 'Read full summary'}
          </button>
        ) : null}
      </section>

      <WhatChangedSection report={report} />

      <section aria-labelledby="key-measures-title">
        <h2 id="key-measures-title" className="mb-3 text-lg font-bold">Key measures</h2>
        <div className="grid gap-3 lg:grid-cols-3">
          {report.keyMeasures.map((measure) => <MetricOverviewCard key={measure.id} measure={measure} />)}
        </div>
      </section>

      <section className={sectionClass} aria-labelledby="functioning-title">
        <h2 id="functioning-title" className="text-lg font-bold">Daily functioning</h2>
        <p className="mt-1 text-xs text-muted dark:text-slate-300">Recorded on completed evening check-ins.</p>
        <FrequencyRows rows={report.functioningRows} showZeros notLoggedCount={report.detailMissing.functioning} />
      </section>

      <section className={sectionClass} aria-labelledby="contributors-title">
        <h2 id="contributors-title" className="text-lg font-bold">Common contributors</h2>
        <p className="mt-1 text-xs leading-5 text-muted dark:text-slate-300">Selected alongside anxiety or depression; this does not establish a cause.</p>
        {contributors.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[29rem] text-left text-sm">
              <thead className="text-xs text-muted dark:text-slate-300">
                <tr><th className="pb-2 font-semibold">Contributor</th><th className="pb-2 text-right font-semibold">Anxiety</th><th className="pb-2 text-right font-semibold">Depression</th></tr>
              </thead>
              <tbody className="divide-y divide-line dark:divide-slate-800">
                {contributors.map((row) => (
                  <tr key={row.label}><th className="py-2 pr-3 font-semibold">{row.label}</th><td className="py-2 text-right">{row.anxietyCount}/{row.denominator}</td><td className="py-2 text-right">{row.depressionCount}/{row.denominator}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="mt-3 text-sm text-muted dark:text-slate-300">No contributors were selected in completed evening check-ins.</p>}
        {recordedContributorRows.length > 5 ? <button type="button" onClick={onToggleContributors} className="mt-2 min-h-11 text-sm font-bold text-calm" aria-expanded={contributorsExpanded}>{contributorsExpanded ? 'Show common only' : 'Show all'}</button> : null}
      </section>

      <section className={sectionClass} aria-labelledby="discussion-title">
        <h2 id="discussion-title" className="text-lg font-bold">Points you may want to discuss</h2>
        {report.pointsToDiscuss.length ? (
          <ul className="mt-3 space-y-2">
            {report.pointsToDiscuss.map((item) => <li key={item.id} className="flex gap-2 text-sm leading-6"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-calm" aria-hidden="true" /><span>{item.statement}</span></li>)}
          </ul>
        ) : <p className="mt-2 text-sm text-muted dark:text-slate-300">No evidence-based discussion points were generated for this report scope.</p>}
      </section>

      <section className={sectionClass} aria-labelledby="included-title">
        <h2 id="included-title" className="text-lg font-bold">Included content</h2>
        <div className="mt-3 space-y-2 text-sm leading-6">
          {report.includedContent.summary.map((line) => <p key={line}>{line}</p>)}
        </div>
        {report.selectedJournalEntries.length ? (
          <div className="mt-3 border-t border-line pt-3 dark:border-slate-800">
            <p className="text-xs font-bold uppercase text-muted dark:text-slate-300">Selected journal entries</p>
            {report.selectedJournalEntries.map((entry) => <p key={`${entry.createdAt}-${entry.title}`} className="mt-2 text-sm"><span className="font-semibold">{entry.title || 'Untitled'}</span> - {displayDateTime(entry.createdAt)}</p>)}
          </div>
        ) : null}
      </section>

      <button type="button" onClick={onShare} className={`${primaryButtonClass} w-full sm:w-auto`}><Share2 className="h-5 w-5" /> Share report</button>
    </div>
  )
}

function DataCoverageSection({ items }: { items: ReportCoverageItem[] }) {
  return (
    <section className={sectionClass} aria-labelledby="coverage-title">
      <h2 id="coverage-title" className="text-lg font-bold">Data coverage</h2>
      <CoverageRows items={items} />
    </section>
  )
}

function CoverageRows({ items }: { items: ReportCoverageItem[] }) {
  return (
    <div className="mt-3 grid gap-x-5 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.id} className="flex min-h-14 items-center justify-between gap-3 border-t border-line py-2 first:border-t-0 dark:border-slate-800 sm:first:border-t">
          <div className="min-w-0"><p className="text-sm font-semibold">{item.label}</p><p className="text-xs text-muted dark:text-slate-300">{item.detail}</p></div>
          <span className="shrink-0 text-sm font-bold text-calm" aria-label={`${item.label}: ${item.display}. ${coverageLevelLabel(item.level)}`}>{item.display}</span>
        </div>
      ))}
    </div>
  )
}

function SummaryFindingRow({ finding }: { finding: SummaryFinding }) {
  return (
    <article className="py-3 first:pt-0 last:pb-0">
      <div className="flex gap-3">
        <span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${finding.safeDisplayVariant === 'protective' ? 'bg-teal-100 text-calm dark:bg-teal-950 dark:text-teal-200' : finding.safeDisplayVariant === 'important' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`} aria-hidden="true">
          {finding.safeDisplayVariant === 'protective' ? <CheckCircle2 className="h-4 w-4" /> : <Info className="h-4 w-4" />}
        </span>
        <p className="text-sm font-medium leading-6 text-slate-800 dark:text-slate-100">{finding.statement}</p>
      </div>
      <details className="ml-9 mt-1 text-xs text-muted dark:text-slate-300">
        <summary className="min-h-9 cursor-pointer py-2 font-bold text-calm">Why this appears</summary>
        <div className="space-y-1 pb-2">
          <p>Source: {finding.sourceForm}. Coverage: {coverageLevelLabel(finding.confidence)}.</p>
          {finding.evidence.map((evidence, index) => <p key={`${finding.id}-evidence-${index}`}>{evidence.sourceForm}: {evidence.numerator !== undefined ? `${evidence.numerator}${evidence.denominator !== undefined ? `/${evidence.denominator}` : ''}` : `${evidence.dates.length} recorded dates`}.</p>)}
          {finding.limitations.map((limitation) => <p key={limitation}>Limit: {limitation}</p>)}
        </div>
      </details>
    </article>
  )
}

function WhatChangedSection({ report }: { report: PreparedClinicianReport }) {
  return (
    <section className={sectionClass} aria-labelledby="changed-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="changed-title" className="text-lg font-bold">What changed</h2>
        <p className="text-xs text-muted dark:text-slate-300">Compared with {displayDate(report.previousRange.start)} to {displayDate(report.previousRange.end)}</p>
      </div>
      {report.whatChanged.length ? (
        <div className="mt-3 divide-y divide-line dark:divide-slate-800">
          {report.whatChanged.map((item) => (
            <details key={item.id} className="group py-2">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm"><span className="font-semibold">{item.label}</span><span className="flex items-center gap-2 font-bold text-calm">{item.display}<ChevronDown className="h-4 w-4 group-open:rotate-180" aria-hidden="true" /></span></summary>
              <p className="pb-2 text-xs leading-5 text-muted dark:text-slate-300">{item.statement}</p>
            </details>
          ))}
        </div>
      ) : <p className="mt-2 text-sm leading-6 text-muted dark:text-slate-300">There is not enough completed data in both periods for a comparison. At least three entries are needed in each period.</p>}
    </section>
  )
}

function MetricOverviewCard({ measure }: { measure: ReportKeyMeasure }) {
  const color = measure.id === 'anxiety' ? 'bg-ocean' : measure.id === 'depression' ? 'bg-clay' : 'bg-calm'
  return (
    <article className={sectionClass} aria-label={measure.accessibleSummary}>
      <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{measure.label}</h3><p className="text-xs text-muted dark:text-slate-300">{measure.sourceLabel}</p></div><span className="text-xs font-bold text-calm">{measure.entries} entries</span></div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div><dt className="text-xs text-muted dark:text-slate-300">Latest</dt><dd className="font-bold">{measure.latest}</dd></div>
        <div><dt className="text-xs text-muted dark:text-slate-300">Typical</dt><dd className="font-bold">{measure.typical}</dd></div>
        {measure.higherSeverityLabel ? <div className="col-span-2"><dt className="text-xs text-muted dark:text-slate-300">{measure.higherSeverityLabel}</dt><dd className="font-bold">{measure.higherSeverityCount ?? 0} of {measure.entries}</dd></div> : null}
      </dl>
      <CompactDistribution rows={measure.distribution} denominator={measure.entries} colorClass={color} hideZero ariaLabel={measure.accessibleSummary} />
      {measure.comparison ? <p className="mt-2 text-xs font-semibold text-calm">Change: {measure.comparison.display}</p> : null}
    </article>
  )
}

function CompactDistribution({ rows, denominator, hideZero, colorClass = 'bg-calm', ariaLabel }: { rows: ReportDistributionRow[]; denominator: number; hideZero?: boolean; colorClass?: string; ariaLabel?: string }) {
  const visible = hideZero ? rows.filter((row) => row.count > 0) : rows
  return (
    <div className="mt-3 space-y-2" role="img" aria-label={ariaLabel ?? visible.map((row) => `${row.label}: ${row.count} of ${denominator}`).join('. ')}>
      {visible.length ? visible.map((row) => (
        <div key={row.value} className="grid grid-cols-[minmax(5rem,1fr)_3rem] items-center gap-2 text-xs">
          <div className="min-w-0"><div className="mb-1 truncate font-semibold">{row.label}</div><div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700" aria-hidden="true"><div className={`h-full ${colorClass}`} style={{ width: `${denominator ? (row.count / denominator) * 100 : 0}%` }} /></div></div>
          <span className="text-right font-bold">{row.count}/{denominator}</span>
        </div>
      )) : <p className="text-xs text-muted dark:text-slate-300">No recorded values.</p>}
    </div>
  )
}

function FrequencyRows({ rows, showZeros = false, notLoggedCount }: { rows: ReportFrequencyRow[]; showZeros?: boolean; notLoggedCount?: number }) {
  const denominator = rows[0]?.denominator ?? 0
  const allRows = notLoggedCount === undefined
    ? rows
    : [...rows, { value: 'NOT_LOGGED', label: 'Not logged', count: notLoggedCount, denominator }]
  const visible = showZeros ? allRows : allRows.filter((row) => row.count > 0)
  return (
    <div className="mt-3 divide-y divide-line dark:divide-slate-800">
      {visible.map((row) => <div key={row.value} className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm"><span className="font-semibold">{row.label}</span><span className="shrink-0 font-bold">{row.count}/{row.denominator}</span></div>)}
      {!visible.length ? <p className="py-2 text-sm text-muted dark:text-slate-300">No recorded items.</p> : null}
    </div>
  )
}

function DetailedDataView({ report }: { report: PreparedClinicianReport }) {
  return (
    <div className="space-y-3">
      <DetailedReportSection title="Completion counts" summary="Exact form and log coverage" defaultOpen>
        <CoverageRows items={report.coverage} />
      </DetailedReportSection>

      <DetailedReportSection title="Quick check-ins" summary={`${report.completion.quickCheckIns} entries; kept separate from evening scales`}>
        <DetailedDistribution title={quickCheckInLabels.moodToday} distribution={report.quickCheckIns.moodDistribution} options={quickMoodOptions} expectedDenominator={report.completion.quickCheckIns} />
        <DetailedDistribution title="Quick anxiety" distribution={report.quickCheckIns.anxietyDistribution} options={quickAnxietyOptions} expectedDenominator={report.completion.quickCheckIns} />
        <DetailedDistribution title="Quick depression" distribution={report.quickCheckIns.depressionDistribution} options={quickDepressionOptions} expectedDenominator={report.completion.quickCheckIns} />
        <DetailedDistribution title="Quick warning signs" distribution={report.quickCheckIns.warningDistribution} options={quickWarningSignOptions} expectedDenominator={report.completion.quickCheckIns} />
      </DetailedReportSection>

      <DetailedReportSection title="Evening mood" summary={`${Object.values(report.mood.ratingDistribution).reduce((total, count) => total + count, 0)} recorded ratings`}>
        <DetailedDistribution title="Mood today" distribution={report.mood.ratingDistribution} options={eveningMoodOptions} expectedDenominator={report.completion.checkInDays} />
      </DetailedReportSection>

      <DetailedReportSection title="Anxiety" summary={`${report.completion.checkInDays} completed evening check-ins`}>
        <DetailedDistribution title="Severity" distribution={report.anxiety.severityDistribution} options={severityOptions} expectedDenominator={report.completion.checkInDays} />
        <DetailedDistribution title="Selected contributors" distribution={report.detailDistributions.anxietyContributors} options={anxietyContributorOptions} expectedDenominator={report.completion.checkInDays} multiSelect notLoggedCount={report.detailMissing.anxietyContributors} />
      </DetailedReportSection>

      <DetailedReportSection title="Depression" summary={`${report.completion.checkInDays} completed evening check-ins`}>
        <DetailedDistribution title="Severity" distribution={report.depression.severityDistribution} options={severityOptions} expectedDenominator={report.completion.checkInDays} />
        <DetailedDistribution title="Selected symptoms" distribution={report.detailDistributions.depressionSymptoms} options={depressionSymptomOptions} expectedDenominator={report.completion.checkInDays} multiSelect notLoggedCount={report.detailMissing.depressionSymptoms} />
        <DetailedDistribution title="Selected contributors" distribution={report.detailDistributions.depressionContributors} options={depressionContributorOptions} expectedDenominator={report.completion.checkInDays} multiSelect notLoggedCount={report.detailMissing.depressionContributors} />
      </DetailedReportSection>

      <DetailedReportSection title="Sleep last night" summary={`${report.completion.sleepEntries} completed sleep entries`}>
        <DetailedDistribution title="Duration" distribution={report.sleep.durationDistribution} options={sleepDurationOptions} expectedDenominator={report.completion.sleepEntries} />
        <DetailedDistribution title="Quality" distribution={report.sleep.qualityDistribution} options={sleepQualityOptions} expectedDenominator={report.completion.sleepEntries} />
        <DetailedDistribution title="Selected disruptions" distribution={report.detailDistributions.sleepDisruptions} options={sleepDisruptionOptions} expectedDenominator={report.completion.sleepEntries} multiSelect notLoggedCount={report.detailMissing.sleepDisruptions} />
      </DetailedReportSection>

      <DetailedReportSection title="Nightmares" summary={report.nightmares.statement}>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <DetailValue label="Nightmare events" value={report.nightmares.eventCount} />
          <DetailValue label="Detailed logs" value={report.nightmares.detailedLogCount} />
          <DetailValue label="Sleep disruption selected" value={report.nightmares.sleepDisruptionDays} />
          <DetailValue label="Sleep entries marked none" value={report.nightmares.explicitNoNightmareDays} />
        </dl>
        {report.nightmares.unansweredSleepEntries ? <p className="mt-3 text-xs text-muted dark:text-slate-300">{report.nightmares.unansweredSleepEntries} sleep entries did not explicitly select either Nightmares or None.</p> : null}
        {report.nightmares.detailedLogCount ? (
          <>
            <DetailedDistribution title="Intensity" distribution={report.detailDistributions.nightmareIntensity} options={nightmareIntensityOptions} expectedDenominator={report.nightmares.detailedLogCount} />
            <DetailedDistribution title="Wake reactions" distribution={report.detailDistributions.nightmareWakeReactions} options={nightmareWakeOptions} expectedDenominator={report.nightmares.detailedLogCount} multiSelect notLoggedCount={report.detailMissing.nightmareWakeReactions} />
            <DetailedDistribution title="After waking" distribution={report.detailDistributions.nightmareAfterWaking} options={nightmareAfterOptions} expectedDenominator={report.nightmares.detailedLogCount} multiSelect notLoggedCount={report.detailMissing.nightmareAfterWaking} />
            {report.nightmareDetails.descriptions.length ? <NoteRows title="Included nightmare notes" rows={report.nightmareDetails.descriptions.map((text) => ({ text }))} /> : null}
          </>
        ) : null}
      </DetailedReportSection>

      <DetailedReportSection title="Warning signs and thinking" summary={`${report.completion.checkInDays} completed evening check-ins`}>
        <DetailedDistribution title="Suspiciousness" distribution={report.warningSigns.suspiciousnessDistribution} options={psychosisSeverityOptions} expectedDenominator={report.completion.checkInDays} />
        <DetailedDistribution title="Unusual meanings" distribution={report.warningSigns.unusualMeaningsDistribution} options={psychosisSeverityOptions} expectedDenominator={report.completion.checkInDays} />
        <DetailedDistribution title="Belief certainty" distribution={report.warningSigns.beliefCertaintyDistribution} options={beliefCertaintyOptions} expectedDenominator={report.completion.checkInDays} />
        <DetailedDistribution title="Perceptual experiences" distribution={report.detailDistributions.perceptualExperiences} options={perceptualExperienceOptions} expectedDenominator={report.completion.checkInDays} multiSelect notLoggedCount={report.detailMissing.perceptualExperiences} />
        <DetailedDistribution title="Thinking clarity" distribution={report.warningSigns.thinkingClarityDistribution} options={thinkingClarityOptions} expectedDenominator={report.completion.checkInDays} />
        <DetailedDistribution title="Reality check" distribution={report.warningSigns.realityCheckDistribution} options={realityCheckOptions} expectedDenominator={report.completion.checkInDays} />
      </DetailedReportSection>

      <DetailedReportSection title="Daily functioning" summary="Recorded completion frequencies">
        <FrequencyRows rows={report.functioningRows} showZeros notLoggedCount={report.detailMissing.functioning} />
      </DetailedReportSection>

      <DetailedReportSection title="Contributors and symptoms" summary="Exact ranked counts with completed-form denominators">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[29rem] text-left text-sm">
            <thead><tr><th className="pb-2">Contributor</th><th className="pb-2 text-right">Anxiety</th><th className="pb-2 text-right">Depression</th></tr></thead>
            <tbody className="divide-y divide-line dark:divide-slate-800">{report.contributorRows.map((row) => <tr key={row.label}><th className="py-2 font-semibold">{row.label}</th><td className="py-2 text-right">{row.anxietyCount}/{row.denominator}</td><td className="py-2 text-right">{row.depressionCount}/{row.denominator}</td></tr>)}</tbody>
          </table>
        </div>
      </DetailedReportSection>

      {report.substanceUse.included ? (
        <DetailedReportSection title="Substance-use information" summary={`${report.substanceUse.entriesWithUse} quick check-ins with recorded use`}>
          <CompactRankedRows title="Recorded substances" rows={report.substanceUse.commonSubstances} denominator={report.completion.quickCheckIns} />
          <DetailedDistribution title="Amount" distribution={report.substanceUse.amountDistribution} options={substanceAmountOptions} />
          <DetailedDistribution title="Timing" distribution={report.substanceUse.timingDistribution} options={substanceTimingOptions} />
          <DetailedDistribution title="Reason" distribution={report.substanceUse.reasonDistribution} options={substanceReasonOptions} />
          <DetailedDistribution title="Helped" distribution={report.substanceUse.helpedDistribution} options={substanceHelpedOptions} />
        </DetailedReportSection>
      ) : null}

      {(report.notes.length || report.selectedJournalEntries.length) ? (
        <DetailedReportSection title="Selected notes and journal entries" summary={`${report.notes.length} daily notes; ${report.selectedJournalEntries.length} journal entries`}>
          <NoteRows title="Daily notes" rows={report.notes.map((note) => ({ label: note.date, text: note.text }))} />
          <NoteRows title="Journal entries" rows={report.selectedJournalEntries.map((entry) => ({ label: `${entry.title || 'Untitled'} - ${displayDateTime(entry.createdAt)}`, text: entry.body }))} />
        </DetailedReportSection>
      ) : null}
    </div>
  )
}

function DetailedReportSection({ title, summary, children, defaultOpen = false }: { title: string; summary: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className={`${sectionClass} group`} open={defaultOpen}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3">
        <span className="min-w-0"><span className="block font-bold">{title}</span><span className="mt-1 block text-xs leading-5 text-muted dark:text-slate-300">{summary}</span></span>
        <ChevronDown className="h-5 w-5 shrink-0 text-calm group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="mt-3 space-y-4 border-t border-line pt-4 dark:border-slate-800">{children}</div>
    </details>
  )
}

function DetailedDistribution<T extends string>({ title, distribution, options, expectedDenominator, multiSelect = false, notLoggedCount }: { title: string; distribution: Record<T, number>; options: Option<T>[]; expectedDenominator?: number; multiSelect?: boolean; notLoggedCount?: number }) {
  const recordedTotal = options.reduce((total, option) => total + (distribution[option.value] ?? 0), 0)
  const denominator = expectedDenominator ?? recordedTotal
  const rows: ReportDistributionRow[] = options.map((option) => ({ value: option.value, label: option.label, count: distribution[option.value] ?? 0 }))
  if (multiSelect && notLoggedCount !== undefined) {
    rows.push({ value: 'NOT_LOGGED', label: 'Not logged', count: notLoggedCount })
  } else if (!multiSelect && expectedDenominator !== undefined) {
    rows.push({ value: 'NOT_LOGGED', label: 'Not logged', count: Math.max(0, expectedDenominator - recordedTotal) })
  }
  return <div><h3 className="text-sm font-bold">{title}</h3><CompactDistribution rows={rows} denominator={denominator} /></div>
}

function CompactRankedRows({ title, rows, denominator }: { title: string; rows: Array<{ label: string; count: number }>; denominator: number }) {
  return (
    <div><h3 className="text-sm font-bold">{title}</h3><div className="mt-2 divide-y divide-line dark:divide-slate-800">{rows.length ? rows.map((row) => <div key={row.label} className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm"><span>{row.label}</span><span className="font-bold">{row.count}/{denominator}</span></div>) : <p className="py-2 text-sm text-muted dark:text-slate-300">No recorded selections.</p>}</div></div>
  )
}

function DetailValue({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-800"><dt className="text-xs text-muted dark:text-slate-300">{label}</dt><dd className="mt-1 font-bold">{value}</dd></div>
}

function NoteRows({ title, rows }: { title: string; rows: Array<{ label?: string; text: string }> }) {
  if (!rows.length) return null
  return <div><h3 className="text-sm font-bold">{title}</h3><div className="mt-2 space-y-2">{rows.map((row, index) => <div key={`${row.label ?? title}-${index}`} className="rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-800">{row.label ? <p className="mb-1 font-bold">{row.label}</p> : null}<p className="whitespace-pre-wrap leading-6 text-muted dark:text-slate-300">{row.text}</p></div>)}</div></div>
}

function ReportScopeEditor({ draft, onChange, onApply, onClose, journalEntries, substanceTrackingEnabled }: { draft: ReportScope; onChange: (scope: ReportScope) => void; onApply: () => void; onClose: () => void; journalEntries: AppData['journalEntries']; substanceTrackingEnabled: boolean }) {
  const visibleJournalEntries = journalEntries.filter((entry) => isoInDateRange(entry.createdAt, draft.start, draft.end)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const setPreset = (preset: ReportPreset) => {
    if (preset === 'custom') {
      onChange({ ...draft, preset })
      return
    }
    const range = daysAgoRange(Number(preset))
    onChange({ ...draft, preset, ...range })
  }

  return (
    <ReportSheet title="Edit report" description="Choose the date range and exactly what optional content is included." onClose={onClose}>
      <fieldset><legend className="text-sm font-bold">Date range</legend><div className="mt-2 grid grid-cols-2 gap-2">{(['7', '14', '30', 'custom'] as ReportPreset[]).map((preset) => <button key={preset} type="button" onClick={() => setPreset(preset)} className={`min-h-12 rounded-lg border px-3 text-sm font-bold ${draft.preset === preset ? 'border-calm bg-calm text-white' : 'border-line bg-white dark:border-slate-700 dark:bg-slate-950'}`} aria-pressed={draft.preset === preset}>{presetLabels[preset]}</button>)}</div></fieldset>
      {draft.preset === 'custom' ? <div className="grid gap-3 sm:grid-cols-2"><DateInput label="Start date" value={draft.start} onChange={(start) => onChange({ ...draft, start })} /><DateInput label="End date" value={draft.end} onChange={(end) => onChange({ ...draft, end })} /></div> : null}
      <fieldset><legend className="text-sm font-bold">Optional content</legend><div className="mt-2 space-y-2"><SheetToggle label="Include daily notes" checked={draft.includeNotes} onChange={(includeNotes) => onChange({ ...draft, includeNotes })} /><SheetToggle label="Include nightmare notes" checked={draft.includeNightmareNotes} onChange={(includeNightmareNotes) => onChange({ ...draft, includeNightmareNotes })} />{substanceTrackingEnabled ? <><SheetToggle label="Include substance-use summary" checked={draft.includeSubstanceSummary} onChange={(includeSubstanceSummary) => onChange({ ...draft, includeSubstanceSummary, includeSubstanceDetails: includeSubstanceSummary ? draft.includeSubstanceDetails : false })} /><SheetToggle label="Include substance-use details" checked={draft.includeSubstanceDetails} onChange={(includeSubstanceDetails) => onChange({ ...draft, includeSubstanceDetails, includeSubstanceSummary: includeSubstanceDetails || draft.includeSubstanceSummary })} /></> : null}</div></fieldset>
      <fieldset><legend className="text-sm font-bold">Journal entries</legend><p className="mt-1 text-xs leading-5 text-muted dark:text-slate-300">Journal text is included exactly as written and is not interpreted by the summary engine.</p><div className="mt-2 max-h-56 space-y-2 overflow-auto">{visibleJournalEntries.length ? visibleJournalEntries.map((entry) => <SheetToggle key={entry.id} label={`${entry.title || 'Untitled'} - ${displayDateTime(entry.createdAt)}`} checked={draft.selectedJournalIds.includes(entry.id)} onChange={() => onChange({ ...draft, selectedJournalIds: toggleValue(draft.selectedJournalIds, entry.id) })} />) : <p className="text-sm text-muted dark:text-slate-300">No journal entries in this date range.</p>}</div></fieldset>
      <button type="button" onClick={onApply} className={`${primaryButtonClass} w-full`}>Apply report scope</button>
    </ReportSheet>
  )
}

function ShareReportSheet({ report, onClose, onPreview, onExport }: { report: PreparedClinicianReport; onClose: () => void; onPreview: () => void; onExport: (format: ExportFormat) => void }) {
  return (
    <ReportSheet title="Share report" description="Review the scope before saving or sharing this private report." onClose={onClose}>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"><div className="flex gap-2"><ShieldCheck className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /><p>Exports can contain private health information. Share only with a person or service you choose.</p></div></div>
      <div><h3 className="text-sm font-bold">This report will include</h3><ul className="mt-2 space-y-1 text-sm leading-6">{report.includedContent.summary.map((line) => <li key={line}>{line}</li>)}</ul></div>
      <div><h3 className="text-sm font-bold">Formatted report</h3><div className="mt-2 grid grid-cols-3 gap-2"><ExportButton label="PDF" icon={FileText} onClick={() => onExport('pdf')} /><ExportButton label="Word" icon={FileText} onClick={() => onExport('word')} /><ExportButton label="Print" icon={Printer} onClick={() => onExport('print')} /></div></div>
      <details className="rounded-lg border border-line p-3 dark:border-slate-700"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-bold"><span>Raw data formats</span><ChevronDown className="h-5 w-5" aria-hidden="true" /></summary><p className="mb-3 mt-1 text-xs leading-5 text-muted dark:text-slate-300">Raw files include only records within this scope. Missing values remain distinct from recorded zero or none.</p><div className="grid grid-cols-3 gap-2"><ExportButton label="Excel" icon={FileSpreadsheet} onClick={() => onExport('excel')} /><ExportButton label="CSV" icon={Download} onClick={() => onExport('csv')} /><ExportButton label="JSON" icon={FileJson} onClick={() => onExport('json')} /></div></details>
      <div className="grid grid-cols-2 gap-2"><button type="button" onClick={onPreview} className={secondaryButtonClass}><Eye className="h-5 w-5" /> Preview</button><button type="button" onClick={() => onExport('pdf')} className={primaryButtonClass}><Share2 className="h-5 w-5" /> Continue</button></div>
    </ReportSheet>
  )
}

function ReportSheet({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: ReactNode }) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="absolute inset-0 bg-slate-950/50" onClick={onClose} aria-hidden="true" />
      <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-lg bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-soft dark:bg-slate-900 sm:max-w-xl sm:rounded-lg sm:p-5">
        <div className="flex items-start justify-between gap-3"><div><h2 id={titleId} className="text-xl font-bold">{title}</h2><p className="mt-1 text-sm leading-6 text-muted dark:text-slate-300">{description}</p></div><button ref={closeRef} type="button" onClick={onClose} className="min-h-11 min-w-11 rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label={`Close ${title}`}><X className="h-6 w-6" /></button></div>
        <div className="mt-4 space-y-5">{children}</div>
      </div>
    </div>
  )
}

function SheetToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-calm" /><span>{label}</span></label>
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = useId()
  return <label htmlFor={id} className="block"><span className="mb-1 block text-sm font-bold">{label}</span><input id={id} type="date" value={value} onChange={(event) => onChange(event.target.value)} className="min-h-12 w-full rounded-lg border border-line bg-white px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-950" /></label>
}

function ExportButton({ label, icon: Icon, onClick }: { label: string; icon: typeof FileText; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-line bg-white px-1 text-xs font-bold hover:border-calm dark:border-slate-700 dark:bg-slate-950"><Icon className="h-5 w-5 text-calm" aria-hidden="true" /><span className="max-w-full truncate">{label}</span></button>
}

function PrintDistribution<T extends string>({ title, distribution, options, expectedDenominator, multiSelect = false, notLoggedCount }: { title: string; distribution: Record<T, number>; options: Option<T>[]; expectedDenominator?: number; multiSelect?: boolean; notLoggedCount?: number }) {
  const recordedTotal = options.reduce((total, option) => total + (distribution[option.value] ?? 0), 0)
  const missing = multiSelect
    ? notLoggedCount
    : expectedDenominator === undefined ? undefined : Math.max(0, expectedDenominator - recordedTotal)
  return (
    <div>
      <h3 className="font-bold">{title}</h3>
      <ul>
        {options.map((option) => <li key={option.value}>{option.label}: {distribution[option.value] ?? 0}</li>)}
        {missing !== undefined ? <li>Not logged: {missing}</li> : null}
      </ul>
    </div>
  )
}

function PrintReport({ report }: { report: PreparedClinicianReport }) {
  return (
    <article className="hidden space-y-5 bg-white text-black print:block">
      <header><h1 className="text-3xl font-bold">Salience Clinician Report</h1><p>Selected period: {report.range.start} to {report.range.end}</p><p>Generated: {new Date().toLocaleString()}</p></header>
      <section><h2 className="text-xl font-bold">Included and excluded content</h2>{report.includedContent.summary.map((line) => <p key={line}>{line}</p>)}</section>
      <section><h2 className="text-xl font-bold">Data coverage</h2><ul>{report.coverage.map((item) => <li key={item.id}>{item.label}: {item.display} - {coverageLevelLabel(item.level)}</li>)}</ul></section>
      <section><h2 className="text-xl font-bold">Overview</h2><ul>{report.summaryFindings.map((item) => <li key={item.id}>{item.statement}</li>)}</ul></section>
      <section><h2 className="text-xl font-bold">What changed</h2>{report.whatChanged.length ? <ul>{report.whatChanged.map((item) => <li key={item.id}>{item.label}: {item.display}. {item.statement}</li>)}</ul> : <p>There is not enough completed data in both periods for a comparison.</p>}</section>
      <section><h2 className="text-xl font-bold">Key measures</h2>{report.keyMeasures.map((measure) => <p key={measure.id}><strong>{measure.label}:</strong> latest {measure.latest}; typical {measure.typical}; {measure.entries} entries.</p>)}</section>
      <section><h2 className="text-xl font-bold">Daily functioning</h2><ul>{report.functioningRows.map((row) => <li key={row.value}>{row.label}: {row.count}/{row.denominator}</li>)}<li>Not logged: {report.detailMissing.functioning}/{report.completion.checkInDays}</li></ul></section>
      <section><h2 className="text-xl font-bold">Common contributors</h2><ul>{report.contributorRows.filter((row) => row.anxietyCount || row.depressionCount).slice(0, 5).map((row) => <li key={row.label}>{row.label}: anxiety {row.anxietyCount}/{row.denominator}; depression {row.depressionCount}/{row.denominator}</li>)}</ul></section>
      <section><h2 className="text-xl font-bold">Points you may want to discuss</h2>{report.pointsToDiscuss.length ? <ul>{report.pointsToDiscuss.map((item) => <li key={item.id}>{item.statement}</li>)}</ul> : <p>No evidence-based discussion points were generated for this report scope.</p>}</section>
      <p className="text-sm">Salience is a private tracking tool. This report summarises information recorded by the user and is not a diagnosis, treatment recommendation, medical advice, or legal advice.</p>

      <section className="break-before-page space-y-4">
        <h2 className="text-2xl font-bold">Detailed data</h2>
        <div><h3 className="font-bold">Completion counts</h3><ul>{report.coverage.map((item) => <li key={item.id}>{item.label}: {item.display}</li>)}</ul></div>
        <PrintDistribution title={quickCheckInLabels.moodToday} distribution={report.quickCheckIns.moodDistribution} options={quickMoodOptions} expectedDenominator={report.completion.quickCheckIns} />
        <PrintDistribution title="Quick anxiety" distribution={report.quickCheckIns.anxietyDistribution} options={quickAnxietyOptions} expectedDenominator={report.completion.quickCheckIns} />
        <PrintDistribution title="Quick depression" distribution={report.quickCheckIns.depressionDistribution} options={quickDepressionOptions} expectedDenominator={report.completion.quickCheckIns} />
        <PrintDistribution title="Quick warning signs" distribution={report.quickCheckIns.warningDistribution} options={quickWarningSignOptions} expectedDenominator={report.completion.quickCheckIns} />
        <PrintDistribution title="Evening mood today" distribution={report.mood.ratingDistribution} options={eveningMoodOptions} expectedDenominator={report.completion.checkInDays} />
        <PrintDistribution title="Anxiety severity" distribution={report.anxiety.severityDistribution} options={severityOptions} expectedDenominator={report.completion.checkInDays} />
        <PrintDistribution title="Anxiety contributors" distribution={report.detailDistributions.anxietyContributors} options={anxietyContributorOptions} expectedDenominator={report.completion.checkInDays} multiSelect notLoggedCount={report.detailMissing.anxietyContributors} />
        <PrintDistribution title="Depression severity" distribution={report.depression.severityDistribution} options={severityOptions} expectedDenominator={report.completion.checkInDays} />
        <PrintDistribution title="Depression symptoms" distribution={report.detailDistributions.depressionSymptoms} options={depressionSymptomOptions} expectedDenominator={report.completion.checkInDays} multiSelect notLoggedCount={report.detailMissing.depressionSymptoms} />
        <PrintDistribution title="Depression contributors" distribution={report.detailDistributions.depressionContributors} options={depressionContributorOptions} expectedDenominator={report.completion.checkInDays} multiSelect notLoggedCount={report.detailMissing.depressionContributors} />
        <PrintDistribution title="Sleep last night duration" distribution={report.sleep.durationDistribution} options={sleepDurationOptions} expectedDenominator={report.completion.sleepEntries} />
        <PrintDistribution title="Sleep quality" distribution={report.sleep.qualityDistribution} options={sleepQualityOptions} expectedDenominator={report.completion.sleepEntries} />
        <PrintDistribution title="Sleep disruptions" distribution={report.detailDistributions.sleepDisruptions} options={sleepDisruptionOptions} expectedDenominator={report.completion.sleepEntries} multiSelect notLoggedCount={report.detailMissing.sleepDisruptions} />
        <div><h3 className="font-bold">Nightmares</h3><p>{report.nightmares.statement}</p><ul><li>Nightmare events: {report.nightmares.eventCount}</li><li>Detailed logs: {report.nightmares.detailedLogCount}</li><li>Sleep-linked generic events: {report.nightmares.genericSleepLinkedCount}</li><li>Sleep disruption selections: {report.nightmares.sleepDisruptionDays}</li><li>Sleep entries explicitly marked none: {report.nightmares.explicitNoNightmareDays}</li><li>Sleep entries not answered: {report.nightmares.unansweredSleepEntries}</li></ul></div>
        {report.nightmares.detailedLogCount ? <><PrintDistribution title="Nightmare intensity" distribution={report.detailDistributions.nightmareIntensity} options={nightmareIntensityOptions} expectedDenominator={report.nightmares.detailedLogCount} /><PrintDistribution title="Nightmare wake reactions" distribution={report.detailDistributions.nightmareWakeReactions} options={nightmareWakeOptions} expectedDenominator={report.nightmares.detailedLogCount} multiSelect notLoggedCount={report.detailMissing.nightmareWakeReactions} /><PrintDistribution title="After waking" distribution={report.detailDistributions.nightmareAfterWaking} options={nightmareAfterOptions} expectedDenominator={report.nightmares.detailedLogCount} multiSelect notLoggedCount={report.detailMissing.nightmareAfterWaking} /></> : null}
        <PrintDistribution title="Suspiciousness" distribution={report.warningSigns.suspiciousnessDistribution} options={psychosisSeverityOptions} expectedDenominator={report.completion.checkInDays} />
        <PrintDistribution title="Unusual meanings" distribution={report.warningSigns.unusualMeaningsDistribution} options={psychosisSeverityOptions} expectedDenominator={report.completion.checkInDays} />
        <PrintDistribution title="Belief certainty" distribution={report.warningSigns.beliefCertaintyDistribution} options={beliefCertaintyOptions} expectedDenominator={report.completion.checkInDays} />
        <PrintDistribution title="Perceptual experiences" distribution={report.detailDistributions.perceptualExperiences} options={perceptualExperienceOptions} expectedDenominator={report.completion.checkInDays} multiSelect notLoggedCount={report.detailMissing.perceptualExperiences} />
        <PrintDistribution title="Thinking clarity" distribution={report.warningSigns.thinkingClarityDistribution} options={thinkingClarityOptions} expectedDenominator={report.completion.checkInDays} />
        <PrintDistribution title="Reality check" distribution={report.warningSigns.realityCheckDistribution} options={realityCheckOptions} expectedDenominator={report.completion.checkInDays} />
        {report.substanceUse.included ? <div><h3 className="font-bold">Substance-use information</h3><p>{report.substanceUse.sleepComparison}</p><p>{report.substanceUse.anxietyComparison}</p><p>{report.substanceUse.warningSignsComparison}</p></div> : null}
        {report.notes.length ? <NoteRows title="Daily notes" rows={report.notes.map((note) => ({ label: note.date, text: note.text }))} /> : null}
        {report.selectedJournalEntries.length ? <NoteRows title="Selected journal entries" rows={report.selectedJournalEntries.map((entry) => ({ label: `${entry.title || 'Untitled'} - ${entry.createdAt}`, text: entry.body }))} /> : null}
        <div><h3 className="font-bold">Scale definitions</h3><p>Quick and evening check-in scales are reported separately. Higher mood values represent better mood; higher anxiety and depression values represent greater recorded severity. Missing responses are labelled Not logged.</p></div>
        <p className="text-sm">Salience is a private tracking tool. This report summarises information recorded by the user and is not a diagnosis, treatment recommendation, medical advice, or legal advice.</p>
      </section>
    </article>
  )
}
