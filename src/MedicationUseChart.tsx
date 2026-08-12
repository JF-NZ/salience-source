import { useEffect, useMemo, useState } from 'react'
import { displayDate, localDateKey } from './lib/dates'
import { entryMilligrams, formatMedicationTime, formatMilligrams, formatTabletAmount } from './lib/medication'
import {
  buildMedicationUseTrendDays,
  medicationTrendRangeOptions,
  type MedicationDailyUse,
  type MedicationTrendRange,
} from './lib/medicationTrends'
import type { BenzodiazepineEntry, BenzodiazepineMedication } from './types'

export interface MedicationUseChartConfig {
  id: BenzodiazepineMedication
  label: string
  segmentCount: 2 | 4
  filledColor: string
  emptyColor: string
  borderColor: string
  dividerColor: string
}

interface MedicationUseChartProps {
  entries: BenzodiazepineEntry[]
  medicationConfigs: MedicationUseChartConfig[]
}

const chartTickIndexes = (length: number) => {
  if (length <= 7) return Array.from({ length }, (_, index) => index)
  return [...new Set([0, Math.round((length - 1) / 2), length - 1])]
}

const maximumPortion = (values: number[]) => {
  const maximum = Math.max(...values, 0)
  return Math.max(0.25, Math.ceil(maximum * 4) / 4)
}

const chartHeight = 170
const chartTop = 20
const chartBottom = 32
const chartPlotHeight = chartHeight - chartTop - chartBottom

const yForPortion = (portion: number, maximum: number) =>
  chartTop + chartPlotHeight - portion / maximum * chartPlotHeight

const xForIndex = (index: number, columnWidth: number) => index * columnWidth + columnWidth / 2

const linePathFor = (
  days: ReturnType<typeof buildMedicationUseTrendDays>,
  config: MedicationUseChartConfig,
  maximum: number,
  columnWidth: number,
) => {
  let drawing = false

  return days.reduce<string[]>((segments, day, index) => {
    const dailyUse = day.medications[config.id]
    if (!dailyUse) {
      drawing = false
      return segments
    }

    const x = xForIndex(index, columnWidth)
    const y = yForPortion(dailyUse.tabletPortions, maximum)
    segments.push(`${drawing ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    drawing = true
    return segments
  }, []).join(' ')
}

const pointSegmentPosition = (segmentCount: 2 | 4, index: number) => {
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

const totalMilligramsFor = (entries: BenzodiazepineEntry[], segmentCount: 2 | 4) => {
  const values = entries.map((entry) => entryMilligrams(entry, segmentCount))
  return values.length > 0 && values.every((value) => value !== undefined)
    ? values.reduce((total, value) => total + (value ?? 0), 0)
    : undefined
}

function MedicationDosePoint({
  config,
  dailyUse,
}: {
  config: MedicationUseChartConfig
  dailyUse: MedicationDailyUse
}) {
  const totalUnits = dailyUse.entries.reduce((total, entry) => total + entry.quarterUnits, 0)
  const displayedUnits = Math.min(totalUnits, config.segmentCount)
  const amountLabel = Number(dailyUse.tabletPortions.toFixed(2))

  return (
    <span aria-hidden="true" className="relative flex h-8 w-8 items-center justify-center">
      <span
        className="relative h-7 w-7 overflow-hidden rounded-full border-2 shadow-sm"
        style={{ backgroundColor: config.emptyColor, borderColor: config.borderColor }}
      >
        {Array.from({ length: config.segmentCount }, (_, index) => (
          <span
            key={index}
            className={`absolute ${pointSegmentPosition(config.segmentCount, index)}`}
            style={{ backgroundColor: index < displayedUnits ? config.filledColor : config.emptyColor }}
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
      </span>
      {dailyUse.tabletPortions > 1 ? (
        <span className="absolute -right-3 -top-2 rounded-full border border-line bg-white px-1 text-[9px] font-bold leading-4 text-slate-700 shadow-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100">
          {amountLabel}
        </span>
      ) : null}
    </span>
  )
}

export function MedicationUseChart({ entries, medicationConfigs }: MedicationUseChartProps) {
  const [range, setRange] = useState<MedicationTrendRange>(14)
  const [selectedDate, setSelectedDate] = useState(localDateKey())
  const days = useMemo(() => buildMedicationUseTrendDays(entries, range), [entries, range])
  const visibleMedicationConfigs = medicationConfigs.filter((config) =>
    days.some((day) => day.medications[config.id] !== undefined),
  )
  const tickIndexes = chartTickIndexes(days.length)

  useEffect(() => {
    if (!days.some((day) => day.date === selectedDate)) {
      setSelectedDate(days.at(-1)?.date ?? localDateKey())
    }
  }, [days, selectedDate])

  const selectedDay = days.find((day) => day.date === selectedDate)
  const columnWidth = range === 30 ? 36 : range === 14 ? 42 : 46

  return (
    <section className="mt-4 space-y-4 rounded-lg border border-line bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-5" aria-labelledby="medication-use-chart-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="medication-use-chart-heading" className="text-xl font-bold">Medication use over time</h2>
          <p className="mt-1 text-sm text-muted dark:text-slate-300">
            Daily totals of the portions you recorded. A blank day means no medication entry was logged.
          </p>
        </div>
        <div className="inline-flex min-h-11 rounded-lg border border-line bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800" role="group" aria-label="Medication graph range">
          {medicationTrendRangeOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              aria-pressed={range === option}
              className={`min-h-9 rounded-md px-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-calm/40 ${
                range === option
                  ? 'bg-calm text-white'
                  : 'text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {option} days
            </button>
          ))}
        </div>
      </div>

      {visibleMedicationConfigs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-slate-50 p-4 text-sm text-muted dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          No medication entries in this range yet. New entries will appear here without treating blank days as zero.
        </p>
      ) : (
        <>
          <p className="text-xs font-semibold text-muted dark:text-slate-300">Pill points show the amount logged each day. Lines stop at blank days.</p>
          <div className="overflow-x-auto pb-1">
            <div className="min-w-max space-y-5">
              {visibleMedicationConfigs.map((config, rowIndex) => {
                const values = days.flatMap((day) => {
                  const dailyUse = day.medications[config.id]
                  return dailyUse ? [dailyUse.tabletPortions] : []
                })
                const maximum = maximumPortion(values)
                const isLastRow = rowIndex === visibleMedicationConfigs.length - 1
                const path = linePathFor(days, config, maximum, columnWidth)
                const selectedIndex = days.findIndex((day) => day.date === selectedDate)

                return (
                  <div key={config.id} className="min-w-max">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-sm border" style={{ backgroundColor: config.filledColor, borderColor: config.borderColor }} />
                        <h3 className="text-sm font-bold">{config.label}</h3>
                      </div>
                      <p className="text-xs font-semibold text-muted dark:text-slate-300">0 to {maximum} tablet{maximum === 1 ? '' : 's'} per day</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex h-[170px] w-8 shrink-0 flex-col justify-between pt-4 pb-8 text-right text-[10px] font-semibold text-muted dark:text-slate-400" aria-hidden="true">
                        <span>{maximum}</span>
                        <span>0</span>
                      </div>
                      <div>
                        <div className="relative h-[170px] border-b border-line dark:border-slate-700" style={{ width: `${days.length * columnWidth}px` }}>
                          <svg
                            role="img"
                            aria-label={`${config.label} daily use line graph. Each tablet point is selectable.`}
                            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                            viewBox={`0 0 ${days.length * columnWidth} ${chartHeight}`}
                            preserveAspectRatio="none"
                          >
                            {[0, 0.5, 1].map((position) => {
                              const y = chartTop + chartPlotHeight * position
                              return <line key={position} x1="0" x2={days.length * columnWidth} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.16" strokeDasharray="3 4" />
                            })}
                            {selectedIndex >= 0 ? (
                              <line
                                x1={xForIndex(selectedIndex, columnWidth)}
                                x2={xForIndex(selectedIndex, columnWidth)}
                                y1={chartTop}
                                y2={chartTop + chartPlotHeight}
                                stroke="currentColor"
                                strokeOpacity="0.36"
                                strokeDasharray="3 3"
                              />
                            ) : null}
                            {path ? <path d={path} fill="none" stroke={config.borderColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /> : null}
                          </svg>
                          {days.map((day, index) => {
                            const dailyUse = day.medications[config.id]
                            const totalUnits = dailyUse?.entries.reduce((total, entry) => total + entry.quarterUnits, 0) ?? 0
                            const amount = dailyUse ? formatTabletAmount(totalUnits, config.segmentCount) : 'Not logged'
                            const milligrams = dailyUse ? totalMilligramsFor(dailyUse.entries, config.segmentCount) : undefined
                            const pointY = dailyUse ? yForPortion(dailyUse.tabletPortions, maximum) : chartTop + chartPlotHeight
                            const isSelected = selectedDate === day.date

                            return (
                              <button
                                key={day.date}
                                type="button"
                                onClick={() => setSelectedDate(day.date)}
                                aria-pressed={isSelected}
                                aria-label={`${config.label} on ${displayDate(day.date)}: ${amount}${milligrams === undefined ? '' : `, ${formatMilligrams(milligrams)}`}`}
                                className={`absolute z-10 flex h-11 min-h-11 items-center justify-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-calm/60 ${
                                  isSelected ? 'bg-teal-50 dark:bg-teal-950/70' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                                style={{
                                  left: `${index * columnWidth}px`,
                                  top: `${Math.max(0, pointY - 22)}px`,
                                  width: `${columnWidth}px`,
                                }}
                              >
                                {dailyUse ? (
                                  <MedicationDosePoint config={config} dailyUse={dailyUse} />
                                ) : (
                                  <span aria-hidden="true" className="rounded-full border border-dashed border-slate-400 px-1 text-[10px] font-bold text-slate-500 dark:border-slate-500 dark:text-slate-400">?</span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                        {isLastRow ? (
                          <div className="mt-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${days.length}, ${columnWidth}px)` }} aria-hidden="true">
                            {days.map((day, index) => (
                              <span key={day.date} className="overflow-hidden text-center text-[10px] font-semibold text-muted dark:text-slate-400">
                                {tickIndexes.includes(index) ? displayDate(day.date) : ''}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800" aria-live="polite">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-bold">Selected date</h3>
              <p className="text-sm font-semibold text-calm dark:text-teal-200">{selectedDay ? displayDate(selectedDay.date) : ''}</p>
            </div>
            {selectedDay && visibleMedicationConfigs.some((config) => selectedDay.medications[config.id]) ? (
              <div className="mt-3 space-y-3">
                {visibleMedicationConfigs.map((config) => {
                  const dailyUse = selectedDay.medications[config.id]
                  if (!dailyUse) return null
                  const totalUnits = dailyUse.entries.reduce((total, entry) => total + entry.quarterUnits, 0)
                  const milligrams = totalMilligramsFor(dailyUse.entries, config.segmentCount)

                  return (
                    <div key={config.id} className="rounded-md border border-line bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                      <p className="font-bold">{config.label}</p>
                      <p className="mt-1 text-sm font-semibold text-calm dark:text-teal-200">
                        {formatTabletAmount(totalUnits, config.segmentCount)}{milligrams === undefined ? '' : ` - ${formatMilligrams(milligrams)}`}
                      </p>
                      <p className="mt-2 text-sm text-muted dark:text-slate-300">
                        {dailyUse.entries.map((entry) => `${formatMedicationTime(entry.takenAt)}: ${formatTabletAmount(entry.quarterUnits, config.segmentCount)}`).join(' | ')}
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted dark:text-slate-300">No medication entry was logged for this date.</p>
            )}
          </div>
        </>
      )}
    </section>
  )
}
