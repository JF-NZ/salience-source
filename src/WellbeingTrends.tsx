import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import type { AppData } from './types'
import { MedicationUseChart, type MedicationUseChartConfig } from './MedicationUseChart'
import { completedDaysRange } from './lib/dates'
import {
  averageKnown,
  buildWellbeingTrendDays,
  depressionAfterSleepGroups,
  hasEnoughGroups,
  hasEnoughPairs,
  linearAssociation,
  nightmareAnxietyPairs,
  sleepMoodPairs,
  wellbeingDayMetrics,
  wellbeingPatternMinimums,
  weeklyTrendComparisons,
  type NextDayPair,
  type WellbeingDayMetric,
  type WellbeingMetricKey,
  type WellbeingTrendDay,
  type WellbeingValueState,
} from './lib/wellbeingTrends'

type RangePreset = '7' | '14' | '30' | 'custom'
type TrendsTab = 'values' | 'patterns'
type ValuesView = 'charts' | 'heatmap'

interface WellbeingTrendsViewProps {
  data: AppData
  medicationConfigs: MedicationUseChartConfig[]
  openedFromMetric?: string
}

const chartWidth = 340
const chartLeft = 38
const chartRight = 14
const chartTop = 16
const chartBottom = 30
const chartPlotWidth = chartWidth - chartLeft - chartRight

const rangeOptions: Array<{ value: RangePreset; label: string }> = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: 'custom', label: 'Custom range' },
]

const panelClass = 'rounded-lg border border-line bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-5'

const heatToneClasses = {
  missing: 'border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400',
  calm: [
    'border-teal-100 bg-teal-50 text-teal-950 dark:border-teal-950 dark:bg-teal-950/40 dark:text-teal-100',
    'border-teal-200 bg-teal-100 text-teal-950 dark:border-teal-900 dark:bg-teal-950/65 dark:text-teal-50',
    'border-teal-300 bg-teal-200 text-teal-950 dark:border-teal-700 dark:bg-teal-900 dark:text-teal-50',
    'border-teal-500 bg-teal-700 text-white dark:border-teal-400 dark:bg-teal-700 dark:text-white',
  ],
  mood: [
    'border-orange-200 bg-orange-100 text-orange-950 dark:border-orange-950 dark:bg-orange-950/45 dark:text-orange-100',
    'border-amber-200 bg-amber-100 text-amber-950 dark:border-amber-900 dark:bg-amber-950/45 dark:text-amber-100',
    'border-slate-300 bg-slate-100 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
    'border-teal-300 bg-teal-100 text-teal-950 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-50',
    'border-teal-500 bg-teal-700 text-white dark:border-teal-400 dark:bg-teal-700 dark:text-white',
  ],
  symptom: [
    'border-teal-100 bg-teal-50 text-teal-950 dark:border-teal-950 dark:bg-teal-950/40 dark:text-teal-100',
    'border-amber-200 bg-amber-100 text-amber-950 dark:border-amber-900 dark:bg-amber-950/45 dark:text-amber-100',
    'border-orange-300 bg-orange-200 text-orange-950 dark:border-orange-800 dark:bg-orange-900 dark:text-orange-50',
    'border-clay bg-clay text-white dark:border-orange-400 dark:bg-clay dark:text-white',
    'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950',
  ],
  event: [
    'border-teal-100 bg-teal-50 text-teal-950 dark:border-teal-950 dark:bg-teal-950/40 dark:text-teal-100',
    'border-amber-200 bg-amber-100 text-amber-950 dark:border-amber-900 dark:bg-amber-950/45 dark:text-amber-100',
    'border-orange-300 bg-orange-200 text-orange-950 dark:border-orange-800 dark:bg-orange-900 dark:text-orange-50',
    'border-clay bg-clay text-white dark:border-orange-400 dark:bg-clay dark:text-white',
  ],
} as const

const formatLocalDate = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(undefined, options).format(new Date(`${date}T12:00:00`))

const shortDate = (date: string) => formatLocalDate(date, { month: 'short', day: 'numeric' })

const longDate = (date: string) => formatLocalDate(date, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value))

const xForIndex = (index: number, length: number) =>
  chartLeft + (length <= 1 ? chartPlotWidth / 2 : (index / (length - 1)) * chartPlotWidth)

const valueY = (value: number, minimum: number, maximum: number, height: number) => {
  const plotHeight = height - chartTop - chartBottom
  const safeMaximum = maximum === minimum ? maximum + 1 : maximum
  const proportion = clamp((value - minimum) / (safeMaximum - minimum), 0, 1)
  return chartTop + plotHeight - proportion * plotHeight
}

const linePath = (
  days: WellbeingTrendDay[],
  values: (day: WellbeingTrendDay) => number | null,
  minimum: number,
  maximum: number,
  height: number,
) => {
  let drawing = false
  return days.reduce<string[]>((segments, day, index) => {
    const value = values(day)
    if (value === null) {
      drawing = false
      return segments
    }
    const x = xForIndex(index, days.length)
    const y = valueY(value, minimum, maximum, height)
    segments.push(`${drawing ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    drawing = true
    return segments
  }, []).join(' ')
}

const selectedIndexFor = (days: WellbeingTrendDay[], selectedDate: string) => {
  const selectedIndex = days.findIndex((day) => day.date === selectedDate)
  return selectedIndex >= 0 ? selectedIndex : Math.max(days.length - 1, 0)
}

const chartTickIndexes = (length: number) => {
  if (length <= 1) return [0]
  if (length <= 7) return Array.from({ length }, (_, index) => index)
  return [...new Set([0, Math.round((length - 1) / 2), length - 1])]
}

const metricStatusClass = (state: WellbeingValueState) => {
  if (state === 'missing') return 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
  if (state === 'none') return 'border-teal-200 bg-teal-50 text-calm dark:border-teal-900 dark:bg-teal-950 dark:text-teal-100'
  if (state === 'noted') return 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100'
  return 'border-line bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
}

export function WellbeingTrendsView({ data, medicationConfigs, openedFromMetric }: WellbeingTrendsViewProps) {
  const initialRange = useMemo(() => completedDaysRange(14), [])
  const [rangePreset, setRangePreset] = useState<RangePreset>('14')
  const [start, setStart] = useState(initialRange.start)
  const [end, setEnd] = useState(initialRange.end)
  const [activeTab, setActiveTab] = useState<TrendsTab>('values')
  const [valuesView, setValuesView] = useState<ValuesView>('charts')
  const [selectedDate, setSelectedDate] = useState(initialRange.end)
  const rangeIsValid = start <= end
  const days = useMemo(
    () => rangeIsValid ? buildWellbeingTrendDays(data, start, end) : [],
    [data, end, rangeIsValid, start],
  )
  const selectedIndex = selectedIndexFor(days, selectedDate)
  const selectedDay = days[selectedIndex]
  const hasMedicationEvents = days.some((day) => day.medicationCount !== null)

  useEffect(() => {
    if (rangeIsValid && (selectedDate < start || selectedDate > end)) {
      setSelectedDate(end)
    }
  }, [end, rangeIsValid, selectedDate, start])

  const setPreset = (value: RangePreset) => {
    setRangePreset(value)
    if (value === 'custom') return
    const range = completedDaysRange(Number(value))
    setStart(range.start)
    setEnd(range.end)
    setSelectedDate(range.end)
  }

  const updateStart = (value: string) => {
    setRangePreset('custom')
    setStart(value)
    if (value <= end && selectedDate < value) setSelectedDate(value)
  }

  const updateEnd = (value: string) => {
    setRangePreset('custom')
    setEnd(value)
    if (value >= start && selectedDate > value) setSelectedDate(value)
  }

  return (
    <div className="space-y-4">
      {openedFromMetric ? <p className="sr-only">Opened from the {openedFromMetric} graph.</p> : null}
      <section className={panelClass} aria-label="Wellbeing trend controls">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-calm dark:text-teal-200">Wellbeing trends</p>
            <p className="mt-1 text-sm text-muted dark:text-slate-300">Each measure keeps its own scale. Gaps mean it was not logged.</p>
          </div>
          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <span className="sr-only">Date range</span>
            <select
              value={rangePreset}
              onChange={(event) => setPreset(event.target.value as RangePreset)}
              className="min-h-10 bg-transparent pr-1 outline-none"
              aria-label="Date range"
            >
              {rangeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
        {rangePreset === 'custom' ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-bold">
              Start date
              <input
                type="date"
                value={start}
                onChange={(event) => updateStart(event.target.value)}
                className="mt-1 min-h-12 w-full rounded-lg border border-line bg-white px-3 text-base font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>
            <label className="block text-sm font-bold">
              End date
              <input
                type="date"
                value={end}
                onChange={(event) => updateEnd(event.target.value)}
                className="mt-1 min-h-12 w-full rounded-lg border border-line bg-white px-3 text-base font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>
          </div>
        ) : null}
        {!rangeIsValid ? <p role="alert" className="mt-3 text-sm font-semibold text-clay dark:text-orange-200">Start date must be on or before end date.</p> : null}
      </section>

      <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Trend sections">
        <TabButton label="Values" active={activeTab === 'values'} onClick={() => setActiveTab('values')} />
        <TabButton label="Patterns" active={activeTab === 'patterns'} onClick={() => setActiveTab('patterns')} />
      </div>

      {rangeIsValid && activeTab === 'values' ? (
        <>
          <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Value display mode">
            <TabButton label="Charts" active={valuesView === 'charts'} onClick={() => setValuesView('charts')} />
            <TabButton label="Heatmap" active={valuesView === 'heatmap'} onClick={() => setValuesView('heatmap')} />
          </div>
          {valuesView === 'charts' ? (
            <>
              <ChartsView days={days} selectedDate={selectedDate} onSelectDate={setSelectedDate} includeMedication={hasMedicationEvents} />
              <MedicationUseChart entries={data.benzodiazepineEntries} medicationConfigs={medicationConfigs} />
            </>
          ) : (
            <WellbeingHeatmap days={days} selectedDate={selectedDate} onSelectDate={setSelectedDate} includeMedication={hasMedicationEvents} />
          )}
          {selectedDay ? <SelectedDaySummary day={selectedDay} includeMedication={hasMedicationEvents} /> : null}
        </>
      ) : null}

      {rangeIsValid && activeTab === 'patterns' ? <PatternsView days={days} /> : null}
    </div>
  )
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
        active
          ? 'border-calm bg-calm text-white dark:border-teal-300 dark:bg-teal-700'
          : 'border-line bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
      }`}
    >
      {label}
    </button>
  )
}

function ChartsView({
  days,
  selectedDate,
  onSelectDate,
  includeMedication,
}: {
  days: WellbeingTrendDay[]
  selectedDate: string
  onSelectDate: (date: string) => void
  includeMedication: boolean
}) {
  return (
    <div className="space-y-3">
      <SleepDurationChart days={days} selectedDate={selectedDate} onSelectDate={onSelectDate} />
      <RatingTrendChart
        title="Sleep quality"
        description="Recorded quality from 1 (very poor) to 5 (excellent). Gaps mean not logged."
        days={days}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        getValue={(day) => day.sleepQuality}
        color="#256f9f"
        pointShape="square"
        ariaLabel="Sleep quality trend, scored from 1 to 5"
      />
      <RatingTrendChart
        title="Mood"
        description="Mood is shown separately: a higher score is a better recorded mood. Gaps mean not logged."
        days={days}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        getValue={(day) => day.mood}
        color="#0f766e"
        pointShape="circle"
        ariaLabel="Mood trend, scored from 1 to 5 where higher is better"
      />
      <SymptomComparisonChart days={days} selectedDate={selectedDate} onSelectDate={onSelectDate} />
      <EventTimeline days={days} selectedDate={selectedDate} onSelectDate={onSelectDate} includeMedication={includeMedication} />
    </div>
  )
}

function MetricChartCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className={panelClass}>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted dark:text-slate-300">{description}</p>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function SleepDurationChart({ days, selectedDate, onSelectDate }: ChartProps) {
  const height = 166
  const selectedIndex = selectedIndexFor(days, selectedDate)
  const selectedX = xForIndex(selectedIndex, days.length)
  const path = linePath(days, (day) => day.sleepDuration, 0, 12, height)

  return (
    <MetricChartCard title="Sleep duration" description="Hours slept last night on a 0 to 12 hour scale. Points are recorded nights; gaps mean not logged.">
      <SelectableChart
        days={days}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        height={height}
        ariaLabel="Sleep duration line graph, scored from 0 to 12 hours"
      >
        <ChartGrid height={height} ticks={[0, 6, 12]} minimum={0} maximum={12} />
        {path ? <path d={path} fill="none" stroke="#0f766e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" /> : null}
        {days.map((day, index) => {
          const x = xForIndex(index, days.length)
          if (day.sleepDuration === null) return <MissingPointMark key={day.date} x={x} bottom={height - chartBottom} />
          const y = valueY(day.sleepDuration, 0, 12, height)
          return <ChartPoint key={day.date} x={x} y={y} color="#0f766e" shape="circle" label={`${shortDate(day.date)}: ${day.sleepDuration.toFixed(1)} hours`} />
        })}
        <SelectedGuide x={selectedX} height={height} />
        <DateAxis days={days} height={height} />
      </SelectableChart>
      <ChartHelper selectedDate={selectedDate} selectedValue={days[selectedIndex]?.sleepDuration} unit="hours" missingLabel="Sleep not logged" />
    </MetricChartCard>
  )
}

type PointShape = 'circle' | 'square'

interface ChartProps {
  days: WellbeingTrendDay[]
  selectedDate: string
  onSelectDate: (date: string) => void
}

function RatingTrendChart({
  title,
  description,
  days,
  selectedDate,
  onSelectDate,
  getValue,
  color,
  pointShape,
  ariaLabel,
}: ChartProps & {
  title: string
  description: string
  getValue: (day: WellbeingTrendDay) => number | null
  color: string
  pointShape: PointShape
  ariaLabel: string
}) {
  const height = 166
  const selectedIndex = selectedIndexFor(days, selectedDate)
  const selectedValue = getValue(days[selectedIndex])
  const selectedX = xForIndex(selectedIndex, days.length)
  const path = linePath(days, getValue, 1, 5, height)

  return (
    <MetricChartCard title={title} description={description}>
      <SelectableChart days={days} selectedDate={selectedDate} onSelectDate={onSelectDate} height={height} ariaLabel={ariaLabel}>
        <ChartGrid height={height} ticks={[1, 3, 5]} minimum={1} maximum={5} />
        {path ? <path d={path} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" /> : null}
        {days.map((day, index) => {
          const value = getValue(day)
          const x = xForIndex(index, days.length)
          if (value === null) return <MissingPointMark key={day.date} x={x} bottom={height - chartBottom} />
          const y = valueY(value, 1, 5, height)
          return <ChartPoint key={day.date} x={x} y={y} color={color} shape={pointShape} label={`${shortDate(day.date)}: ${value}/5`} />
        })}
        <SelectedGuide x={selectedX} height={height} />
        <DateAxis days={days} height={height} />
      </SelectableChart>
      <ChartHelper selectedDate={selectedDate} selectedValue={selectedValue} unit="/5" missingLabel={`${title} not logged`} />
    </MetricChartCard>
  )
}

function SymptomComparisonChart({ days, selectedDate, onSelectDate }: ChartProps) {
  const height = 178
  const selectedIndex = selectedIndexFor(days, selectedDate)
  const selectedDay = days[selectedIndex]
  const selectedX = xForIndex(selectedIndex, days.length)
  const anxietyPath = linePath(days, (day) => day.anxiety, 0, 4, height)
  const depressionPath = linePath(days, (day) => day.depression, 0, 4, height)

  return (
    <MetricChartCard title="Anxiety and depression" description="Both use a 0 to 4 severity scale, where higher is more severe. A circle is Anxiety; a diamond and dashed line is Depression.">
      <SelectableChart
        days={days}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        height={height}
        ariaLabel="Anxiety and depression symptom chart, each scored from 0 to 4 where higher is more severe"
      >
        <ChartGrid height={height} ticks={[0, 2, 4]} minimum={0} maximum={4} />
        {anxietyPath ? <path d={anxietyPath} fill="none" stroke="#256f9f" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" /> : null}
        {depressionPath ? <path d={depressionPath} fill="none" stroke="#b7634d" strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" /> : null}
        {days.map((day, index) => {
          const x = xForIndex(index, days.length)
          return (
            <g key={day.date}>
              {day.anxiety === null
                ? <MissingPointMark x={x - 3} bottom={height - chartBottom} />
                : <ChartPoint x={x} y={valueY(day.anxiety, 0, 4, height)} color="#256f9f" shape="circle" label={`${shortDate(day.date)} Anxiety: ${day.anxiety}/4`} />}
              {day.depression === null
                ? <MissingPointMark x={x + 3} bottom={height - chartBottom - 8} />
                : <ChartPoint x={x} y={valueY(day.depression, 0, 4, height)} color="#b7634d" shape="diamond" label={`${shortDate(day.date)} Depression: ${day.depression}/4`} />}
            </g>
          )
        })}
        <SelectedGuide x={selectedX} height={height} />
        <DateAxis days={days} height={height} />
      </SelectableChart>
      <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-muted dark:text-slate-300">
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-ocean" aria-hidden="true" /> Anxiety, circle</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rotate-45 bg-clay" aria-hidden="true" /> Depression, diamond/dashed</span>
        <span>Gaps are not logged.</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2" aria-live="polite">
        <SelectedMetric label="Anxiety" value={selectedDay?.anxiety === null || !selectedDay ? 'Not logged' : `${selectedDay.anxiety}/4`} />
        <SelectedMetric label="Depression" value={selectedDay?.depression === null || !selectedDay ? 'Not logged' : `${selectedDay.depression}/4`} />
      </div>
    </MetricChartCard>
  )
}

function EventTimeline({ days, selectedDate, onSelectDate, includeMedication }: ChartProps & { includeMedication: boolean }) {
  const rows = [
    { key: 'nightmares' as const, label: 'Nightmares', shortLabel: 'Night.' },
    { key: 'warningSigns' as const, label: 'Warning signs', shortLabel: 'Warn.' },
    { key: 'thinking' as const, label: 'Thinking', shortLabel: 'Think.' },
    ...(includeMedication ? [{ key: 'medication' as const, label: 'Medication', shortLabel: 'Med.' }] : []),
  ]
  const rowHeight = 34
  const height = chartTop + rows.length * rowHeight + 32
  const selectedIndex = selectedIndexFor(days, selectedDate)
  const selectedX = xForIndex(selectedIndex, days.length)

  return (
    <MetricChartCard title="Events and observations" description="Events are markers, not continuous lines. A question mark means not logged; 0 and None are recorded states.">
      <SelectableChart
        days={days}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        height={height}
        ariaLabel="Event timeline for nightmares, warning signs, thinking, and medication entries when present"
      >
        {rows.map((row, rowIndex) => {
          const y = chartTop + 16 + rowIndex * rowHeight
          return (
            <g key={row.key}>
              <text x="2" y={y + 4} className="fill-slate-600 text-[9px] font-bold dark:fill-slate-300" aria-label={row.label}>
                <title>{row.label}</title>
                {row.shortLabel}
              </text>
              <path d={`M ${chartLeft} ${y} H ${chartWidth - chartRight}`} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="1" />
              {days.map((day, index) => <EventMarker key={`${row.key}-${day.date}`} x={xForIndex(index, days.length)} y={y} row={row.key} day={day} />)}
            </g>
          )
        })}
        <SelectedGuide x={selectedX} height={height - 28} />
        <DateAxis days={days} height={height} />
      </SelectableChart>
      <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-muted dark:text-slate-300">
        <span>? not logged</span>
        <span>0 or None recorded</span>
        <span>Clear is a recorded thinking state</span>
      </div>
    </MetricChartCard>
  )
}

function SelectableChart({
  days,
  selectedDate,
  onSelectDate,
  height,
  ariaLabel,
  children,
}: ChartProps & { height: number; ariaLabel: string; children: ReactNode }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const pointerDown = useRef(false)
  const selectedDay = days.find((day) => day.date === selectedDate)

  const selectAtPointer = (clientX: number) => {
    const bounds = svgRef.current?.getBoundingClientRect()
    if (!bounds || days.length === 0) return
    const viewX = ((clientX - bounds.left) / Math.max(bounds.width, 1)) * chartWidth
    const ratio = clamp((viewX - chartLeft) / chartPlotWidth, 0, 1)
    const index = Math.round(ratio * Math.max(days.length - 1, 0))
    const day = days[index]
    if (day) onSelectDate(day.date)
  }

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    pointerDown.current = true
    event.currentTarget.focus({ preventScroll: true })
    if (typeof event.currentTarget.setPointerCapture === 'function') event.currentTarget.setPointerCapture(event.pointerId)
    selectAtPointer(event.clientX)
  }

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (pointerDown.current) selectAtPointer(event.clientX)
  }

  const onPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (pointerDown.current) selectAtPointer(event.clientX)
    pointerDown.current = false
  }

  const onKeyDown = (event: ReactKeyboardEvent<SVGSVGElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const current = selectedIndexFor(days, selectedDate)
    const next = clamp(current + (event.key === 'ArrowLeft' ? -1 : 1), 0, Math.max(days.length - 1, 0))
    const day = days[next]
    if (day) onSelectDate(day.date)
  }

  return (
    <div>
      <svg
        ref={svgRef}
        role="img"
        tabIndex={0}
        viewBox={`0 0 ${chartWidth} ${height}`}
        className="h-auto w-full touch-pan-y rounded-lg outline-none focus:ring-2 focus:ring-calm/50"
        aria-label={`${ariaLabel}. Selected date: ${selectedDay ? longDate(selectedDay.date) : 'none'}. Tap or drag to select a date, or use the left and right arrow keys.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { pointerDown.current = false }}
        onKeyDown={onKeyDown}
      >
        {children}
      </svg>
      <p className="sr-only" aria-live="polite">Selected date: {selectedDay ? longDate(selectedDay.date) : 'none'}</p>
    </div>
  )
}

function ChartGrid({ height, ticks, minimum, maximum }: { height: number; ticks: number[]; minimum: number; maximum: number }) {
  const plotBottom = height - chartBottom
  return (
    <>
      {ticks.map((tick) => {
        const y = valueY(tick, minimum, maximum, height)
        return (
          <g key={tick}>
            <path d={`M ${chartLeft} ${y} H ${chartWidth - chartRight}`} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeDasharray="3 4" strokeWidth="1" />
            <text x="2" y={y + 4} className="fill-slate-500 text-[10px] font-bold dark:fill-slate-300">{tick}</text>
          </g>
        )
      })}
      <path d={`M ${chartLeft} ${plotBottom} H ${chartWidth - chartRight}`} stroke="currentColor" className="text-slate-400 dark:text-slate-500" strokeWidth="1.5" />
    </>
  )
}

function SelectedGuide({ x, height }: { x: number; height: number }) {
  return <path d={`M ${x} ${chartTop} V ${height - chartBottom}`} stroke="currentColor" className="text-slate-500 dark:text-slate-400" strokeDasharray="3 3" strokeWidth="1.25" />
}

function DateAxis({ days, height }: { days: WellbeingTrendDay[]; height: number }) {
  return (
    <>
      {chartTickIndexes(days.length).map((index) => {
        const day = days[index]
        if (!day) return null
        const x = xForIndex(index, days.length)
        return <text key={day.date} x={x} y={height - 7} textAnchor="middle" className="fill-slate-500 text-[9px] font-bold dark:fill-slate-300">{shortDate(day.date)}</text>
      })}
    </>
  )
}

function MissingPointMark({ x, bottom }: { x: number; bottom: number }) {
  return (
    <g aria-label="Not logged">
      <path d={`M ${x - 3} ${bottom - 8} L ${x + 3} ${bottom - 2} M ${x + 3} ${bottom - 8} L ${x - 3} ${bottom - 2}`} stroke="currentColor" className="text-slate-400 dark:text-slate-500" strokeWidth="1.5" />
      <title>Not logged</title>
    </g>
  )
}

function ChartPoint({ x, y, color, shape, label }: { x: number; y: number; color: string; shape: 'circle' | 'square' | 'diamond'; label: string }) {
  if (shape === 'square') {
    return <rect x={x - 4} y={y - 4} width="8" height="8" rx="1" fill="white" stroke={color} strokeWidth="3"><title>{label}</title></rect>
  }
  if (shape === 'diamond') {
    return <path d={`M ${x} ${y - 5} L ${x + 5} ${y} L ${x} ${y + 5} L ${x - 5} ${y} Z`} fill="white" stroke={color} strokeWidth="3"><title>{label}</title></path>
  }
  return <circle cx={x} cy={y} r="4.5" fill="white" stroke={color} strokeWidth="3"><title>{label}</title></circle>
}

function ChartHelper({ selectedDate, selectedValue, unit, missingLabel }: { selectedDate: string; selectedValue: number | null; unit: string; missingLabel: string }) {
  return (
    <div aria-live="polite" className="mt-3 flex min-h-11 items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold dark:bg-slate-800">
      <span className="text-muted dark:text-slate-300">{shortDate(selectedDate)}</span>
      <span>{selectedValue === null ? missingLabel : `${selectedValue}${unit}`}</span>
    </div>
  )
}

function SelectedMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
      <p className="text-xs font-bold text-muted dark:text-slate-300">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  )
}

function EventMarker({ x, y, row, day }: { x: number; y: number; row: 'nightmares' | 'warningSigns' | 'thinking' | 'medication'; day: WellbeingTrendDay }) {
  const visual = eventVisual(row, day)
  if (visual.kind === 'missing') {
    return <text x={x} y={y + 4} textAnchor="middle" className="fill-slate-400 text-[12px] font-bold dark:fill-slate-500"><title>{visual.label}</title>?</text>
  }
  if (visual.kind === 'none') {
    return <circle cx={x} cy={y} r="7" fill="#ecfdf5" stroke="#0f766e" strokeWidth="2"><title>{visual.label}</title></circle>
  }
  if (visual.kind === 'clear') {
    return <rect x={x - 7} y={y - 7} width="14" height="14" rx="3" fill="#0f766e"><title>{visual.label}</title></rect>
  }
  return <circle cx={x} cy={y} r="8" fill={visual.kind === 'noted' ? '#b7791f' : '#b7634d'}><title>{visual.label}</title></circle>
}

function eventVisual(row: 'nightmares' | 'warningSigns' | 'thinking' | 'medication', day: WellbeingTrendDay): { kind: 'missing' | 'none' | 'noted' | 'recorded' | 'clear'; label: string } {
  if (row === 'nightmares') {
    if (day.nightmareState === 'missing') return { kind: 'missing', label: 'Nightmares not logged' }
    if (day.nightmareState === 'none') return { kind: 'none', label: '0 nightmares recorded' }
    if (day.nightmareState === 'noted') return { kind: 'noted', label: 'Nightmares noted; count not logged' }
    return { kind: 'recorded', label: `${day.nightmareCount} nightmares recorded` }
  }
  if (row === 'warningSigns') {
    if (day.warningState === 'missing') return { kind: 'missing', label: 'Warning signs not logged' }
    if (day.warningState === 'none') return { kind: 'none', label: 'No warning signs noted' }
    return { kind: 'recorded', label: `${day.warningLabel ?? 'Warning signs'} recorded` }
  }
  if (row === 'thinking') {
    if (day.thinkingState === 'missing') return { kind: 'missing', label: 'Thinking not logged' }
    if (day.thinking === 0) return { kind: 'clear', label: 'Thinking recorded as clear' }
    return { kind: 'recorded', label: `${day.thinkingLabel ?? 'Thinking difficulty'} recorded` }
  }
  if (day.medicationCount === null) return { kind: 'missing', label: 'Medication not logged' }
  return { kind: 'recorded', label: `${day.medicationCount} medication ${day.medicationCount === 1 ? 'entry' : 'entries'} recorded` }
}

function SelectedDaySummary({ day, includeMedication }: { day: WellbeingTrendDay; includeMedication: boolean }) {
  const metrics = wellbeingDayMetrics(day, includeMedication)
  return (
    <section className={panelClass} aria-live="polite" aria-label={`Selected day details for ${longDate(day.date)}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">Selected day</h2>
        <p className="text-sm font-semibold text-calm dark:text-teal-200">{longDate(day.date)}</p>
      </div>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {metrics.map((metric) => <SelectedDayMetric key={metric.key} metric={metric} />)}
      </dl>
    </section>
  )
}

function SelectedDayMetric({ metric }: { metric: WellbeingDayMetric }) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${metricStatusClass(metric.state)}`}>
      <dt className="text-xs font-bold uppercase tracking-normal opacity-75">{metric.label}</dt>
      <dd className="mt-1 text-sm font-bold">{metric.value}</dd>
    </div>
  )
}

interface HeatmapRow {
  key: WellbeingMetricKey
  label: string
  cell: (day: WellbeingTrendDay) => HeatmapCell
}

interface HeatmapCell {
  label: string
  state: WellbeingValueState
  tone: 'missing' | 'calm' | 'mood' | 'symptom' | 'event'
  intensity: number
}

function WellbeingHeatmap({ days, selectedDate, onSelectDate, includeMedication }: ChartProps & { includeMedication: boolean }) {
  const rows = heatmapRows(includeMedication)
  const dateColumns = { gridTemplateColumns: `repeat(${days.length}, 2.75rem)` }
  return (
    <section className={panelClass} aria-label="Wellbeing heatmap">
      <h2 className="text-lg font-bold">Date matrix</h2>
      <p className="mt-1 text-sm text-muted dark:text-slate-300">Each cell has a value or recorded state for this date range. A dash means not logged, while 0 and None were recorded.</p>
      <div className="mt-4 grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] gap-2">
        <div aria-label="Heatmap metric labels" className="min-w-0">
          <div className="flex h-7 items-center px-1 text-left text-xs font-bold text-muted dark:text-slate-300">Metric</div>
          <div className="mt-1 space-y-1">
            {rows.map((row) => (
              <div key={row.key} className="flex h-11 items-center px-1 text-left text-xs font-bold leading-tight">
                {row.label}
              </div>
            ))}
          </div>
        </div>
        <div
          className="no-scrollbar min-w-0 overflow-x-auto overscroll-x-contain pb-2"
          aria-label="Scrollable wellbeing values by date"
        >
          <div className="w-max px-1">
            <div className="grid h-7 gap-1" style={dateColumns}>
              {days.map((day) => (
                <div key={day.date} className="flex h-7 items-center justify-center px-0.5 text-center text-[10px] font-bold text-muted dark:text-slate-300">
                  {shortDate(day.date)}
                </div>
              ))}
            </div>
            <div className="mt-1 space-y-1">
              {rows.map((row) => (
                <div key={row.key} className="grid gap-1" style={dateColumns} aria-label={row.label}>
                  {days.map((day) => {
                    const cell = row.cell(day)
                    const className = heatmapCellClass(cell)
                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => onSelectDate(day.date)}
                        aria-pressed={day.date === selectedDate}
                        aria-label={`${row.label}, ${longDate(day.date)}: ${cell.label}. Select this date.`}
                        className={`flex h-11 w-11 items-center justify-center rounded-lg border px-1 text-[10px] font-bold leading-tight ${className} ${day.date === selectedDate ? 'ring-2 ring-inset ring-calm dark:ring-teal-300' : ''}`}
                      >
                        {cell.label}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs font-semibold text-muted dark:text-slate-300">Mood colours move toward teal as the recorded score improves. Symptom colours become stronger as recorded severity rises. Values stay visible in every cell.</p>
    </section>
  )
}

function heatmapRows(includeMedication: boolean): HeatmapRow[] {
  return [
    { key: 'sleepDuration', label: 'Sleep', cell: (day) => numericCell(day.sleepDuration, day.sleepDuration === null ? 'Not logged' : `${day.sleepDuration.toFixed(1)}h`, 'calm', 12) },
    { key: 'sleepQuality', label: 'Quality', cell: (day) => numericCell(day.sleepQuality, day.sleepQuality === null ? 'Not logged' : `${day.sleepQuality}/5`, 'calm', 5) },
    { key: 'mood', label: 'Mood', cell: (day) => numericCell(day.mood, day.mood === null ? 'Not logged' : `${day.mood}/5`, 'mood', 5) },
    { key: 'anxiety', label: 'Anxiety', cell: (day) => numericCell(day.anxiety, day.anxiety === null ? 'Not logged' : `${day.anxiety}/4`, 'symptom', 4) },
    { key: 'depression', label: 'Depression', cell: (day) => numericCell(day.depression, day.depression === null ? 'Not logged' : `${day.depression}/4`, 'symptom', 4) },
    { key: 'nightmares', label: 'Nightmares', cell: nightmareHeatmapCell },
    { key: 'warningSigns', label: 'Warning signs', cell: warningHeatmapCell },
    { key: 'thinking', label: 'Thinking', cell: thinkingHeatmapCell },
    ...(includeMedication ? [{ key: 'medication' as const, label: 'Medication', cell: (day: WellbeingTrendDay) => numericCell(day.medicationCount, day.medicationCount === null ? 'Not logged' : `${day.medicationCount}`, 'event', 4) }] : []),
  ]
}

function numericCell(value: number | null, label: string, tone: HeatmapCell['tone'], maximum: number): HeatmapCell {
  if (value === null) return { label: '-', state: 'missing', tone: 'missing', intensity: 0 }
  return { label: label.replace('Not logged', '-'), state: value === 0 ? 'none' : 'recorded', tone, intensity: clamp(Math.ceil((value / Math.max(maximum, 1)) * 4), 0, 4) }
}

function nightmareHeatmapCell(day: WellbeingTrendDay): HeatmapCell {
  if (day.nightmareState === 'missing') return { label: '-', state: 'missing', tone: 'missing', intensity: 0 }
  if (day.nightmareState === 'none') return { label: '0', state: 'none', tone: 'event', intensity: 0 }
  if (day.nightmareState === 'noted') return { label: 'Note', state: 'noted', tone: 'event', intensity: 2 }
  return { label: `${day.nightmareCount}`, state: 'recorded', tone: 'event', intensity: clamp(day.nightmareCount ?? 0, 1, 4) }
}

function warningHeatmapCell(day: WellbeingTrendDay): HeatmapCell {
  if (day.warningState === 'missing') return { label: '-', state: 'missing', tone: 'missing', intensity: 0 }
  if (day.warningState === 'none') return { label: 'None', state: 'none', tone: 'event', intensity: 0 }
  return { label: `${day.warningSigns}`, state: 'recorded', tone: 'event', intensity: clamp(day.warningSigns ?? 0, 1, 4) }
}

function thinkingHeatmapCell(day: WellbeingTrendDay): HeatmapCell {
  if (day.thinkingState === 'missing') return { label: '-', state: 'missing', tone: 'missing', intensity: 0 }
  if (day.thinking === 0) return { label: 'Clear', state: 'recorded', tone: 'calm', intensity: 1 }
  return { label: `${day.thinking}`, state: 'recorded', tone: 'symptom', intensity: clamp(day.thinking ?? 0, 1, 4) }
}

function heatmapCellClass(cell: HeatmapCell) {
  if (cell.tone === 'missing') return heatToneClasses.missing
  if (cell.tone === 'mood') return heatToneClasses.mood[clamp(cell.intensity, 0, 4)]
  if (cell.tone === 'symptom') return heatToneClasses.symptom[clamp(cell.intensity, 0, 4)]
  if (cell.tone === 'event') return heatToneClasses.event[clamp(cell.intensity, 0, 3)]
  return heatToneClasses.calm[clamp(cell.intensity, 0, 3)]
}

function PatternsView({ days }: { days: WellbeingTrendDay[] }) {
  const moodPairs = useMemo(() => sleepMoodPairs(days), [days])
  const nightmarePairs = useMemo(() => nightmareAnxietyPairs(days), [days])
  const depressionGroups = useMemo(() => depressionAfterSleepGroups(days), [days])
  const weekly = useMemo(() => weeklyTrendComparisons(days), [days])
  const nightmareFreeAnxiety = nightmarePairs.filter((pair) => pair.x === 0).map((pair) => pair.y)
  const nightmarePresentAnxiety = nightmarePairs.filter((pair) => pair.x > 0).map((pair) => pair.y)

  return (
    <div className="space-y-3">
      <section className={panelClass}>
        <h2 className="text-lg font-bold">Patterns in your logged data</h2>
        <p className="mt-1 text-sm text-muted dark:text-slate-300">These views describe associations in recorded entries only. They do not show causes or predict what will happen.</p>
      </section>
      <PatternCard title="Sleep duration and next-day mood" description="Each point pairs sleep on one date with mood on the following date." count={moodPairs.length}>
        <ScatterPlot pairs={moodPairs} xLabel="Sleep hours" yLabel="Next-day mood" xRange={[0, 12]} yRange={[1, 5]} color="#0f766e" />
        {hasEnoughPairs(moodPairs.length)
          ? <AssociationCopy pairs={moodPairs} />
          : <InsufficientDataState needed={`${wellbeingPatternMinimums.pairedEntries} paired sleep and following-day mood entries`} current={moodPairs.length} />}
      </PatternCard>
      <PatternCard title="Nightmares and next-morning anxiety" description="Only dates with a completed nightmare state and a following-day anxiety entry are included." count={nightmarePairs.length}>
        {hasEnoughGroups(nightmareFreeAnxiety.length, nightmarePresentAnxiety.length)
          ? <>
              <GroupComparison
                leftLabel="0 nightmares recorded"
                leftValues={nightmareFreeAnxiety}
                rightLabel="Nightmares recorded or noted"
                rightValues={nightmarePresentAnxiety}
                unit="/4 anxiety"
              />
              <p className="mt-3 text-sm leading-6 text-muted dark:text-slate-300">In your logged data, this compares next-morning anxiety after the two recorded groups. It is based on {nightmareFreeAnxiety.length + nightmarePresentAnxiety.length} paired entries and does not show cause.</p>
            </>
          : <>
              <GroupCounts leftLabel="0 nightmares recorded" leftCount={nightmareFreeAnxiety.length} rightLabel="Nightmares recorded or noted" rightCount={nightmarePresentAnxiety.length} />
              <InsufficientDataState needed={`${wellbeingPatternMinimums.groupEntries} entries in each group`} current={Math.min(nightmareFreeAnxiety.length, nightmarePresentAnxiety.length)} />
            </>}
      </PatternCard>
      <PatternCard title="Depression following shorter sleep" description={depressionGroups.medianSleep === null ? 'A personal median sleep split will appear when paired entries are available.' : `Shorter means below your logged median of ${depressionGroups.medianSleep.toFixed(1)} hours.`} count={depressionGroups.shorter.length + depressionGroups.normalOrHigher.length}>
        {hasEnoughGroups(depressionGroups.shorter.length, depressionGroups.normalOrHigher.length)
          ? <>
              <GroupComparison
                leftLabel="Below your median sleep"
                leftValues={depressionGroups.shorter}
                rightLabel="At or above your median"
                rightValues={depressionGroups.normalOrHigher}
                unit="/4 depression"
              />
              <p className="mt-3 text-sm leading-6 text-muted dark:text-slate-300">This comparison uses your own logged median rather than a clinical sleep threshold. It describes the recorded groups only.</p>
            </>
          : <>
              <GroupCounts leftLabel="Below your median sleep" leftCount={depressionGroups.shorter.length} rightLabel="At or above your median" rightCount={depressionGroups.normalOrHigher.length} />
              <InsufficientDataState needed={`${wellbeingPatternMinimums.groupEntries} paired entries on each side of your personal median`} current={Math.min(depressionGroups.shorter.length, depressionGroups.normalOrHigher.length)} />
            </>}
      </PatternCard>
      <WeeklyComparisonCard comparisons={weekly} hasFullWindow={days.length >= 14} />
    </div>
  )
}

function PatternCard({ title, description, count, children }: { title: string; description: string; count: number; children: ReactNode }) {
  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        <span className="text-xs font-bold text-muted dark:text-slate-300">{count} paired {count === 1 ? 'entry' : 'entries'}</span>
      </div>
      <p className="mt-1 text-sm text-muted dark:text-slate-300">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function ScatterPlot({ pairs, xLabel, yLabel, xRange, yRange, color }: { pairs: NextDayPair[]; xLabel: string; yLabel: string; xRange: [number, number]; yRange: [number, number]; color: string }) {
  const height = 180
  return (
    <div>
      <svg role="img" viewBox={`0 0 ${chartWidth} ${height}`} className="h-auto w-full" aria-label={`${yLabel} plotted against ${xLabel}. ${pairs.length} paired entries.`}>
        <ChartGrid height={height} ticks={[yRange[0], (yRange[0] + yRange[1]) / 2, yRange[1]]} minimum={yRange[0]} maximum={yRange[1]} />
        {pairs.map((pair) => {
          const x = chartLeft + ((pair.x - xRange[0]) / Math.max(xRange[1] - xRange[0], 1)) * chartPlotWidth
          const y = valueY(pair.y, yRange[0], yRange[1], height)
          return <circle key={`${pair.date}-${pair.nextDate}`} cx={x} cy={y} r="5" fill="white" stroke={color} strokeWidth="3"><title>{`${shortDate(pair.date)} sleep ${pair.x.toFixed(1)}; ${shortDate(pair.nextDate)} ${yLabel.toLowerCase()} ${pair.y}`}</title></circle>
        })}
        <text x={chartLeft} y={height - 7} className="fill-slate-500 text-[10px] font-bold dark:fill-slate-300">{xLabel} {xRange[0]}</text>
        <text x={chartWidth - chartRight} y={height - 7} textAnchor="end" className="fill-slate-500 text-[10px] font-bold dark:fill-slate-300">{xRange[1]}</text>
      </svg>
      {pairs.length === 0 ? <p className="mt-2 text-sm font-semibold text-muted dark:text-slate-300">No valid paired entries in this range.</p> : null}
    </div>
  )
}

function AssociationCopy({ pairs }: { pairs: NextDayPair[] }) {
  const association = linearAssociation(pairs)
  if (association === null) return null
  const direction = association > 0.1 ? 'positive' : association < -0.1 ? 'negative' : 'mixed'
  return <p className="mt-3 text-sm leading-6 text-muted dark:text-slate-300">In your logged data, the plotted values show a {direction} association across {pairs.length} paired entries. This describes a relationship, not a cause.</p>
}

function GroupComparison({ leftLabel, leftValues, rightLabel, rightValues, unit }: { leftLabel: string; leftValues: number[]; rightLabel: string; rightValues: number[]; unit: string }) {
  const leftAverage = averageKnown(leftValues)
  const rightAverage = averageKnown(rightValues)
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <GroupAverage label={leftLabel} average={leftAverage} count={leftValues.length} unit={unit} />
      <GroupAverage label={rightLabel} average={rightAverage} count={rightValues.length} unit={unit} />
    </div>
  )
}

function GroupCounts({ leftLabel, leftCount, rightLabel, rightCount }: { leftLabel: string; leftCount: number; rightLabel: string; rightCount: number }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="rounded-lg border border-line bg-slate-50 p-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-800">{leftLabel}: {leftCount} completed {leftCount === 1 ? 'entry' : 'entries'}</div>
      <div className="rounded-lg border border-line bg-slate-50 p-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-800">{rightLabel}: {rightCount} completed {rightCount === 1 ? 'entry' : 'entries'}</div>
    </div>
  )
}

function GroupAverage({ label, average, count, unit }: { label: string; average: number | null; count: number; unit: string }) {
  return (
    <div className="rounded-lg border border-line bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-2 text-2xl font-bold text-calm dark:text-teal-200">{average === null ? 'Not enough data' : `${average.toFixed(1)} ${unit}`}</p>
      <p className="mt-1 text-xs font-semibold text-muted dark:text-slate-300">{count} completed {count === 1 ? 'entry' : 'entries'}</p>
    </div>
  )
}

function InsufficientDataState({ needed, current }: { needed: string; current: number }) {
  return <p className="mt-3 rounded-lg border border-dashed border-line bg-slate-50 px-3 py-2 text-sm font-semibold text-muted dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">There is not enough logged data yet. This needs {needed}; {current} available in the smaller group or pairing set.</p>
}

function WeeklyComparisonCard({ comparisons, hasFullWindow }: { comparisons: ReturnType<typeof weeklyTrendComparisons>; hasFullWindow: boolean }) {
  return (
    <section className={panelClass}>
      <h2 className="text-lg font-bold">Seven-day comparison</h2>
      <p className="mt-1 text-sm text-muted dark:text-slate-300">Most recent seven calendar days compared with the preceding seven. Averages use completed entries only.</p>
      {!hasFullWindow ? <InsufficientDataState needed="a 14-day date range" current={0} /> : null}
      {hasFullWindow ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {comparisons.map((comparison) => <WeeklyMetric key={comparison.key} comparison={comparison} />)}
        </div>
      ) : null}
    </section>
  )
}

function WeeklyMetric({ comparison }: { comparison: ReturnType<typeof weeklyTrendComparisons>[number] }) {
  const { recent, previous } = comparison
  const hasBothPeriods = recent.average !== null && previous.average !== null
  const change = hasBothPeriods ? recent.average! - previous.average! : null
  return (
    <div className="rounded-lg border border-line bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
      <h3 className="font-bold">{comparison.label}</h3>
      {hasBothPeriods ? (
        <p className="mt-2 text-sm font-semibold">Recent: {recent.average!.toFixed(1)} ({recent.count}) | Previous: {previous.average!.toFixed(1)} ({previous.count}) | Change: {change! > 0 ? '+' : ''}{change!.toFixed(1)}</p>
      ) : (
        <p className="mt-2 text-sm font-semibold text-muted dark:text-slate-300">Not enough completed entries in both seven-day periods. Recent: {recent.count}; previous: {previous.count}.</p>
      )}
    </div>
  )
}
