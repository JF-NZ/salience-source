import type { BenzodiazepineEntry, BenzodiazepineMedication } from '../types'

export const medicationForEntry = (entry: BenzodiazepineEntry): BenzodiazepineMedication =>
  entry.medication ?? 'CLONAZEPAM'

const tabletFractionLabels: Record<2 | 4, Record<number, string>> = {
  2: { 1: '1/2' },
  4: { 1: '1/4', 2: '1/2', 3: '3/4' },
}

export const formatTabletAmount = (units: number, segmentCount: 2 | 4) => {
  if (units <= 0) {
    return 'None recorded'
  }

  const wholeTablets = Math.floor(units / segmentCount)
  const remainder = units % segmentCount
  const fraction = tabletFractionLabels[segmentCount][remainder]

  if (wholeTablets === 0) {
    return `${fraction} tablet`
  }

  return `${wholeTablets}${fraction ? ` ${fraction}` : ''} tablet${wholeTablets === 1 && !fraction ? '' : 's'}`
}

export const hasWholeTabletMg = (wholeTabletMg: number | undefined): wholeTabletMg is number =>
  typeof wholeTabletMg === 'number' && Number.isFinite(wholeTabletMg) && wholeTabletMg > 0

export const formatMilligrams = (milligrams: number) => `${Number(milligrams.toFixed(3))} mg`

export const entryMilligrams = (entry: BenzodiazepineEntry, segmentCount: 2 | 4) =>
  hasWholeTabletMg(entry.wholeTabletMg)
    ? entry.wholeTabletMg * entry.quarterUnits / segmentCount
    : undefined

export const formatMedicationTime = (takenAt: string) => new Date(takenAt).toLocaleTimeString(undefined, {
  hour: 'numeric',
  minute: '2-digit',
})
