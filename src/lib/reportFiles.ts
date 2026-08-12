import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
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
} from '../data/options'
import type {
  FunctioningItem,
  SubstanceAmount,
  SubstanceHelped,
  SubstanceReason,
  SubstanceTiming,
} from '../types'
import { coverageLevelLabel, type PreparedClinicianReport } from './clinicianReport'

type CellValue = string | number

const reportDisclaimer =
  'Salience is a private tracking tool. This report summarises information recorded by the user and is not a diagnosis, treatment recommendation, medical advice, or legal advice.'

const xmlEscape = (value: string | number) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

const paragraph = (text: string, bold = false) =>
  new Paragraph({
    children: [new TextRun({ text, bold })],
    spacing: { after: 120 },
  })

const heading = (
  text: string,
  level: typeof HeadingLevel.HEADING_1 | typeof HeadingLevel.HEADING_2,
  pageBreakBefore = false,
) =>
  new Paragraph({
    text,
    heading: level,
    pageBreakBefore,
    spacing: { before: 240, after: 120 },
  })

const bullet = (text: string) =>
  new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { after: 80 },
  })

const distributionLines = <T extends string>(
  title: string,
  distribution: Record<T, number>,
  options: Option<T>[],
  notLoggedCount?: number,
) => [
  paragraph(title, true),
  ...options.map((option) => bullet(`${option.label}: ${distribution[option.value] ?? 0}`)),
  ...(notLoggedCount === undefined ? [] : [bullet(`Not logged: ${notLoggedCount}`)]),
]

const missingSingleCount = <T extends string>(distribution: Record<T, number>, options: Option<T>[], expected: number) =>
  Math.max(0, expected - options.reduce((total, option) => total + (distribution[option.value] ?? 0), 0))

const distributionTextLines = <T extends string>(
  title: string,
  distribution: Record<T, number>,
  options: Option<T>[],
  notLoggedCount?: number,
) => [
  ...options.map((option) => `${title} - ${option.label}: ${distribution[option.value] ?? 0}`),
  ...(notLoggedCount === undefined ? [] : [`${title} - Not logged: ${notLoggedCount}`]),
]

const topLines = (title: string, rows: Array<{ label: string; count: number }>) => [
  paragraph(title, true),
  ...(rows.length
    ? rows.map((row) => bullet(`${row.label}: ${row.count}`))
    : [bullet('No entries in this range.')]),
]

const overviewTextLines = (report: PreparedClinicianReport) => [
  'Salience Clinician Report',
  `Selected period: ${report.range.start} to ${report.range.end}`,
  `Generated: ${new Date().toLocaleString()}`,
  `Comparison period: ${report.previousRange.start} to ${report.previousRange.end}`,
  '',
  'Included and excluded content',
  ...report.includedContent.summary,
  '',
  'Data coverage',
  ...report.coverage.map((item) =>
    `${item.label}: ${item.display} - ${coverageLevelLabel(item.level)}${item.detail !== coverageLevelLabel(item.level) ? ` (${item.detail})` : ''}`,
  ),
  '',
  'Overview',
  ...report.summaryFindings.map((finding) => finding.statement),
  '',
  'What changed',
  ...(report.whatChanged.length
    ? report.whatChanged.map((comparison) => `${comparison.label}: ${comparison.display}. ${comparison.statement}`)
    : ['There is not enough completed data in both periods for a comparison.']),
  '',
  'Key measures',
  ...report.keyMeasures.map((measure) =>
    `${measure.label} (${measure.sourceLabel}): latest ${measure.latest}; typical ${measure.typical}; entries ${measure.entries}${measure.higherSeverityLabel ? `; ${measure.higherSeverityLabel.toLowerCase()} ${measure.higherSeverityCount ?? 0} of ${measure.entries}` : ''}.`,
  ),
  '',
  'Daily functioning',
  ...report.functioningRows.map((row) => `${row.label}: ${row.count}/${row.denominator} completed evening check-ins`),
  '',
  'Common contributors',
  ...report.contributorRows
    .filter((row) => row.anxietyCount || row.depressionCount)
    .slice(0, 5)
    .map((row) => `${row.label}: anxiety ${row.anxietyCount}/${row.denominator}; depression ${row.depressionCount}/${row.denominator}`),
  '',
  'Points you may want to discuss',
  ...(report.pointsToDiscuss.length
    ? report.pointsToDiscuss.map((finding) => finding.statement)
    : ['No evidence-based discussion points were generated for this report scope.']),
  '',
  reportDisclaimer,
]

const detailedTextLines = (report: PreparedClinicianReport) => {
  const lines = [
    'Detailed data',
    '',
    'Completion counts',
    `Quick check-ins: ${report.completion.quickCheckIns}`,
    `Evening check-in days: ${report.completion.checkInDays}`,
    `Sleep entries: ${report.completion.sleepEntries}`,
    `Detailed nightmare logs: ${report.completion.nightmareLogs}`,
    `Selected journal entries: ${report.completion.journalEntries}`,
    '',
    'Quick check-ins',
    ...distributionTextLines(quickCheckInLabels.moodToday, report.quickCheckIns.moodDistribution, quickMoodOptions, missingSingleCount(report.quickCheckIns.moodDistribution, quickMoodOptions, report.completion.quickCheckIns)),
    ...distributionTextLines('Quick anxiety', report.quickCheckIns.anxietyDistribution, quickAnxietyOptions, missingSingleCount(report.quickCheckIns.anxietyDistribution, quickAnxietyOptions, report.completion.quickCheckIns)),
    ...distributionTextLines('Quick depression', report.quickCheckIns.depressionDistribution, quickDepressionOptions, missingSingleCount(report.quickCheckIns.depressionDistribution, quickDepressionOptions, report.completion.quickCheckIns)),
    ...distributionTextLines('Quick warning signs', report.quickCheckIns.warningDistribution, quickWarningSignOptions, missingSingleCount(report.quickCheckIns.warningDistribution, quickWarningSignOptions, report.completion.quickCheckIns)),
    '',
    'Evening mood',
    ...distributionTextLines('Mood today', report.mood.ratingDistribution, eveningMoodOptions, missingSingleCount(report.mood.ratingDistribution, eveningMoodOptions, report.completion.checkInDays)),
    '',
    'Anxiety',
    ...distributionTextLines('Severity', report.anxiety.severityDistribution, severityOptions, missingSingleCount(report.anxiety.severityDistribution, severityOptions, report.completion.checkInDays)),
    ...distributionTextLines('Contributor', report.detailDistributions.anxietyContributors, anxietyContributorOptions, report.detailMissing.anxietyContributors),
    '',
    'Depression',
    ...distributionTextLines('Severity', report.depression.severityDistribution, severityOptions, missingSingleCount(report.depression.severityDistribution, severityOptions, report.completion.checkInDays)),
    ...distributionTextLines('Symptom', report.detailDistributions.depressionSymptoms, depressionSymptomOptions, report.detailMissing.depressionSymptoms),
    ...distributionTextLines('Contributor', report.detailDistributions.depressionContributors, depressionContributorOptions, report.detailMissing.depressionContributors),
    '',
    'Sleep last night',
    ...distributionTextLines('Duration', report.sleep.durationDistribution, sleepDurationOptions, missingSingleCount(report.sleep.durationDistribution, sleepDurationOptions, report.completion.sleepEntries)),
    ...distributionTextLines('Quality', report.sleep.qualityDistribution, sleepQualityOptions, missingSingleCount(report.sleep.qualityDistribution, sleepQualityOptions, report.completion.sleepEntries)),
    ...distributionTextLines('Disruption', report.detailDistributions.sleepDisruptions, sleepDisruptionOptions, report.detailMissing.sleepDisruptions),
    '',
    'Nightmares',
    report.nightmares.statement,
    `Nightmare events: ${report.nightmares.eventCount}`,
    `Detailed logs: ${report.nightmares.detailedLogCount}`,
    `Sleep-linked generic events: ${report.nightmares.genericSleepLinkedCount}`,
    `Sleep disruption selections: ${report.nightmares.sleepDisruptionDays}`,
    `Sleep entries explicitly marked none: ${report.nightmares.explicitNoNightmareDays}`,
    `Sleep entries without an explicit nightmare or none selection: ${report.nightmares.unansweredSleepEntries}`,
    ...(report.nightmares.detailedLogCount ? [
      ...distributionTextLines('Intensity', report.detailDistributions.nightmareIntensity, nightmareIntensityOptions, missingSingleCount(report.detailDistributions.nightmareIntensity, nightmareIntensityOptions, report.nightmares.detailedLogCount)),
      ...distributionTextLines('Wake reaction', report.detailDistributions.nightmareWakeReactions, nightmareWakeOptions, report.detailMissing.nightmareWakeReactions),
      ...distributionTextLines('After waking', report.detailDistributions.nightmareAfterWaking, nightmareAfterOptions, report.detailMissing.nightmareAfterWaking),
    ] : []),
    ...report.nightmareDetails.descriptions.map((description) => `Nightmare note: ${description}`),
    '',
    'Warning signs',
    ...distributionTextLines('Suspiciousness', report.warningSigns.suspiciousnessDistribution, psychosisSeverityOptions, missingSingleCount(report.warningSigns.suspiciousnessDistribution, psychosisSeverityOptions, report.completion.checkInDays)),
    ...distributionTextLines('Unusual meanings', report.warningSigns.unusualMeaningsDistribution, psychosisSeverityOptions, missingSingleCount(report.warningSigns.unusualMeaningsDistribution, psychosisSeverityOptions, report.completion.checkInDays)),
    ...distributionTextLines('Belief certainty', report.warningSigns.beliefCertaintyDistribution, beliefCertaintyOptions, missingSingleCount(report.warningSigns.beliefCertaintyDistribution, beliefCertaintyOptions, report.completion.checkInDays)),
    ...distributionTextLines('Perceptual experience', report.detailDistributions.perceptualExperiences, perceptualExperienceOptions, report.detailMissing.perceptualExperiences),
    ...distributionTextLines('Thinking clarity', report.warningSigns.thinkingClarityDistribution, thinkingClarityOptions, missingSingleCount(report.warningSigns.thinkingClarityDistribution, thinkingClarityOptions, report.completion.checkInDays)),
    ...distributionTextLines('Reality check', report.warningSigns.realityCheckDistribution, realityCheckOptions, missingSingleCount(report.warningSigns.realityCheckDistribution, realityCheckOptions, report.completion.checkInDays)),
    '',
    'Daily functioning',
    ...report.functioningRows.map((row) => `${row.label}: ${row.count}/${row.denominator}`),
    `Not logged: ${report.detailMissing.functioning}/${report.completion.checkInDays}`,
    '',
    'Selected journal entries and notes',
    ...report.notes.map((note) => `Daily note ${note.date}: ${note.text}`),
    ...report.selectedJournalEntries.flatMap((entry) => [
      `Journal: ${entry.title || 'Untitled'} - ${entry.createdAt}`,
      entry.body,
    ]),
  ]

  if (report.substanceUse.included) {
    lines.push(
      '',
      'Substance-use information',
      `Days with recorded use: ${report.substanceUse.daysWithUse}`,
      `Quick check-ins with recorded use: ${report.substanceUse.entriesWithUse}`,
      ...report.substanceUse.commonSubstances.map((row) => `${row.label}: ${row.count}`),
      report.substanceUse.sleepComparison,
      report.substanceUse.anxietyComparison,
      report.substanceUse.warningSignsComparison,
    )
  }

  lines.push(
    '',
    'Scale definitions',
    'Quick and evening check-in scales are reported separately. Higher mood values represent better recorded mood; higher anxiety and depression values represent greater recorded severity. Missing responses are labelled Not logged.',
    '',
    reportDisclaimer,
  )
  return lines
}

const formattedReportChildren = (report: PreparedClinicianReport) => [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    heading: HeadingLevel.TITLE,
    text: 'Salience Clinician Report',
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun(`Selected period: ${report.range.start} to ${report.range.end}`)],
    spacing: { after: 80 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun(`Generated: ${new Date().toLocaleString()}`)],
    spacing: { after: 240 },
  }),
  heading('Included and excluded content', HeadingLevel.HEADING_1),
  ...report.includedContent.summary.map((line) => bullet(line)),
  heading('Data coverage', HeadingLevel.HEADING_1),
  ...report.coverage.map((item) => bullet(`${item.label}: ${item.display} - ${coverageLevelLabel(item.level)}`)),
  heading('Overview', HeadingLevel.HEADING_1),
  ...report.summaryFindings.map((item) => bullet(item.statement)),
  heading('What changed', HeadingLevel.HEADING_1),
  ...(report.whatChanged.length
    ? report.whatChanged.map((item) => bullet(`${item.label}: ${item.display}. ${item.statement}`))
    : [paragraph('There is not enough completed data in both periods for a comparison.')]),
  heading('Key measures', HeadingLevel.HEADING_1),
  ...report.keyMeasures.flatMap((measure) => [
    paragraph(`${measure.label} - ${measure.sourceLabel}`, true),
    bullet(`Latest: ${measure.latest}`),
    bullet(`Typical: ${measure.typical}`),
    bullet(`Entries: ${measure.entries}`),
    ...(measure.higherSeverityLabel
      ? [bullet(`${measure.higherSeverityLabel}: ${measure.higherSeverityCount ?? 0} of ${measure.entries}`)]
      : []),
  ]),
  heading('Daily functioning', HeadingLevel.HEADING_1),
  ...report.functioningRows.map((row) => bullet(`${row.label}: ${row.count}/${row.denominator}`)),
  heading('Common contributors', HeadingLevel.HEADING_1),
  ...report.contributorRows
    .filter((row) => row.anxietyCount || row.depressionCount)
    .slice(0, 5)
    .map((row) => bullet(`${row.label}: anxiety ${row.anxietyCount}/${row.denominator}; depression ${row.depressionCount}/${row.denominator}`)),
  heading('Points you may want to discuss', HeadingLevel.HEADING_1),
  ...(report.pointsToDiscuss.length
    ? report.pointsToDiscuss.map((item) => bullet(item.statement))
    : [paragraph('No evidence-based discussion points were generated for this report scope.')]),
  paragraph(reportDisclaimer),
  heading('Detailed data', HeadingLevel.HEADING_1, true),
  heading('Completion counts', HeadingLevel.HEADING_2),
  ...report.coverage.map((item) => bullet(`${item.label}: ${item.display}`)),
  heading('Quick check-ins', HeadingLevel.HEADING_2),
  ...distributionLines(quickCheckInLabels.moodToday, report.quickCheckIns.moodDistribution, quickMoodOptions, missingSingleCount(report.quickCheckIns.moodDistribution, quickMoodOptions, report.completion.quickCheckIns)),
  ...distributionLines('Quick anxiety', report.quickCheckIns.anxietyDistribution, quickAnxietyOptions, missingSingleCount(report.quickCheckIns.anxietyDistribution, quickAnxietyOptions, report.completion.quickCheckIns)),
  ...distributionLines('Quick depression', report.quickCheckIns.depressionDistribution, quickDepressionOptions, missingSingleCount(report.quickCheckIns.depressionDistribution, quickDepressionOptions, report.completion.quickCheckIns)),
  ...distributionLines('Quick warning signs', report.quickCheckIns.warningDistribution, quickWarningSignOptions, missingSingleCount(report.quickCheckIns.warningDistribution, quickWarningSignOptions, report.completion.quickCheckIns)),
  heading('Evening mood', HeadingLevel.HEADING_2),
  ...distributionLines('Mood today', report.mood.ratingDistribution, eveningMoodOptions, missingSingleCount(report.mood.ratingDistribution, eveningMoodOptions, report.completion.checkInDays)),
  heading('Anxiety', HeadingLevel.HEADING_2),
  ...distributionLines('Severity', report.anxiety.severityDistribution, severityOptions, missingSingleCount(report.anxiety.severityDistribution, severityOptions, report.completion.checkInDays)),
  ...distributionLines('Contributors', report.detailDistributions.anxietyContributors, anxietyContributorOptions, report.detailMissing.anxietyContributors),
  heading('Depression', HeadingLevel.HEADING_2),
  ...distributionLines('Severity', report.depression.severityDistribution, severityOptions, missingSingleCount(report.depression.severityDistribution, severityOptions, report.completion.checkInDays)),
  ...distributionLines('Symptoms', report.detailDistributions.depressionSymptoms, depressionSymptomOptions, report.detailMissing.depressionSymptoms),
  ...distributionLines('Contributors', report.detailDistributions.depressionContributors, depressionContributorOptions, report.detailMissing.depressionContributors),
  heading('Sleep last night', HeadingLevel.HEADING_2),
  ...distributionLines('Duration', report.sleep.durationDistribution, sleepDurationOptions, missingSingleCount(report.sleep.durationDistribution, sleepDurationOptions, report.completion.sleepEntries)),
  ...distributionLines('Quality', report.sleep.qualityDistribution, sleepQualityOptions, missingSingleCount(report.sleep.qualityDistribution, sleepQualityOptions, report.completion.sleepEntries)),
  ...distributionLines('Disruptions', report.detailDistributions.sleepDisruptions, sleepDisruptionOptions, report.detailMissing.sleepDisruptions),
  heading('Nightmares', HeadingLevel.HEADING_2),
  paragraph(report.nightmares.statement),
  bullet(`Nightmare events: ${report.nightmares.eventCount}`),
  bullet(`Detailed nightmare logs: ${report.nightmares.detailedLogCount}`),
  bullet(`Sleep entries with nightmare disruption selected: ${report.nightmares.sleepDisruptionDays}`),
  bullet(`Sleep entries explicitly marked none: ${report.nightmares.explicitNoNightmareDays}`),
  ...(report.nightmares.detailedLogCount
    ? [
        ...distributionLines('Intensity', report.detailDistributions.nightmareIntensity, nightmareIntensityOptions, missingSingleCount(report.detailDistributions.nightmareIntensity, nightmareIntensityOptions, report.nightmares.detailedLogCount)),
        ...distributionLines('Wake reactions', report.detailDistributions.nightmareWakeReactions, nightmareWakeOptions, report.detailMissing.nightmareWakeReactions),
        ...distributionLines('After waking', report.detailDistributions.nightmareAfterWaking, nightmareAfterOptions, report.detailMissing.nightmareAfterWaking),
        ...report.nightmareDetails.descriptions.map((text) => bullet(`Nightmare note: ${text}`)),
      ]
    : []),
  heading('Warning signs', HeadingLevel.HEADING_2),
  ...distributionLines('Suspiciousness', report.warningSigns.suspiciousnessDistribution, psychosisSeverityOptions, missingSingleCount(report.warningSigns.suspiciousnessDistribution, psychosisSeverityOptions, report.completion.checkInDays)),
  ...distributionLines('Unusual meanings', report.warningSigns.unusualMeaningsDistribution, psychosisSeverityOptions, missingSingleCount(report.warningSigns.unusualMeaningsDistribution, psychosisSeverityOptions, report.completion.checkInDays)),
  ...distributionLines('Belief certainty', report.warningSigns.beliefCertaintyDistribution, beliefCertaintyOptions, missingSingleCount(report.warningSigns.beliefCertaintyDistribution, beliefCertaintyOptions, report.completion.checkInDays)),
  ...distributionLines('Perceptual experiences', report.detailDistributions.perceptualExperiences, perceptualExperienceOptions, report.detailMissing.perceptualExperiences),
  ...distributionLines('Thinking clarity', report.warningSigns.thinkingClarityDistribution, thinkingClarityOptions, missingSingleCount(report.warningSigns.thinkingClarityDistribution, thinkingClarityOptions, report.completion.checkInDays)),
  ...distributionLines('Reality check', report.warningSigns.realityCheckDistribution, realityCheckOptions, missingSingleCount(report.warningSigns.realityCheckDistribution, realityCheckOptions, report.completion.checkInDays)),
  ...(report.substanceUse.included
    ? [
        heading('Substance-use information', HeadingLevel.HEADING_2),
        bullet(`Days with recorded use: ${report.substanceUse.daysWithUse}`),
        bullet(`Quick check-ins with recorded use: ${report.substanceUse.entriesWithUse}`),
        ...topLines('Common substances', report.substanceUse.commonSubstances),
        ...distributionLines<SubstanceAmount>('Amount', report.substanceUse.amountDistribution, substanceAmountOptions),
        ...distributionLines<SubstanceTiming>('Timing', report.substanceUse.timingDistribution, substanceTimingOptions),
        ...distributionLines<SubstanceReason>('Reason', report.substanceUse.reasonDistribution, substanceReasonOptions),
        ...distributionLines<SubstanceHelped>('Helped', report.substanceUse.helpedDistribution, substanceHelpedOptions),
        bullet(report.substanceUse.sleepComparison),
        bullet(report.substanceUse.anxietyComparison),
        bullet(report.substanceUse.warningSignsComparison),
      ]
    : []),
  heading('Daily functioning', HeadingLevel.HEADING_2),
  ...distributionLines<FunctioningItem>('Recorded items', report.functioning, functioningOptions),
  bullet(`Not logged: ${report.detailMissing.functioning}`),
  ...(report.notes.length
    ? [heading('Daily notes', HeadingLevel.HEADING_2), ...report.notes.map((note) => bullet(`${note.date}: ${note.text}`))]
    : []),
  ...(report.selectedJournalEntries.length
    ? [
        heading('Selected journal entries', HeadingLevel.HEADING_2),
        ...report.selectedJournalEntries.flatMap((entry) => [
          paragraph(`${entry.title || 'Untitled'} - ${entry.createdAt}`, true),
          paragraph(entry.body),
        ]),
      ]
    : []),
  heading('Scale definitions', HeadingLevel.HEADING_2),
  paragraph('Quick and evening check-in scales are reported separately. Higher mood values represent better recorded mood; higher anxiety and depression values represent greater recorded severity. Missing responses are labelled Not logged.'),
  paragraph(reportDisclaimer),
]

export const buildReportDocxBlob = async (report: PreparedClinicianReport) => {
  const doc = new Document({
    creator: 'Salience',
    title: `Salience clinician report ${report.range.start} to ${report.range.end}`,
    description: 'Private factual tracking summary generated locally by Salience.',
    sections: [{ children: formattedReportChildren(report) }],
  })

  return Packer.toBlob(doc)
}

const cell = (value: CellValue) => {
  const isNumber = typeof value === 'number'
  return `<Cell><Data ss:Type="${isNumber ? 'Number' : 'String'}">${xmlEscape(value)}</Data></Cell>`
}

const row = (values: CellValue[]) => `<Row>${values.map(cell).join('')}</Row>`

const sheet = (name: string, rows: CellValue[][]) => `
  <Worksheet ss:Name="${xmlEscape(name)}">
    <Table>
      ${rows.map(row).join('\n')}
    </Table>
  </Worksheet>`

const distributionRows = <T extends string>(
  title: string,
  distribution: Record<T, number>,
  options: Option<T>[],
  notLoggedCount?: number,
): CellValue[][] => [
  [title, 'Count'],
  ...options.map((option) => [option.label, distribution[option.value] ?? 0]),
  ...(notLoggedCount === undefined ? [] : [['Not logged', notLoggedCount] as CellValue[]]),
]

const topRows = (title: string, rows: Array<{ label: string; count: number }>): CellValue[][] => [
  [title, 'Count'],
  ...(rows.length ? rows.map((item) => [item.label, item.count]) : [['No entries in this range.', 0]]),
]

const rawCellValue = (value: unknown): CellValue => {
  if (value === undefined || value === null) return 'Not logged'
  if (typeof value === 'number') return value
  if (typeof value === 'string') return value
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return JSON.stringify(value)
}

const rawRecordRows = (records: Array<Record<string, unknown>>): CellValue[][] => {
  const keys = [...new Set(records.flatMap((record) => Object.keys(record)))]
  if (!keys.length) return [['No scoped records']]
  return [
    keys,
    ...records.map((record) => keys.map((key) =>
      Object.prototype.hasOwnProperty.call(record, key) ? rawCellValue(record[key]) : 'Not logged',
    )),
  ]
}

export const buildReportExcelBlob = (report: PreparedClinicianReport) => {
  const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  ${sheet('Summary', [
    ['Salience report', `${report.range.start} to ${report.range.end}`],
    ['Generated', new Date().toLocaleString()],
    ['Included content', report.includedContent.included.join('; ')],
    ['Excluded content', report.includedContent.excluded.join('; ') || 'None'],
    ...report.summaryFindings.map((finding) => ['Finding', finding.statement]),
    ...report.coverage.map((item) => [`Coverage - ${item.label}`, item.display]),
  ])}
  ${sheet('Quick Check-ins', [
    ...distributionRows(quickCheckInLabels.moodToday, report.quickCheckIns.moodDistribution, quickMoodOptions, missingSingleCount(report.quickCheckIns.moodDistribution, quickMoodOptions, report.completion.quickCheckIns)),
    [],
    ...distributionRows('Anxiety', report.quickCheckIns.anxietyDistribution, quickAnxietyOptions, missingSingleCount(report.quickCheckIns.anxietyDistribution, quickAnxietyOptions, report.completion.quickCheckIns)),
    [],
    ...distributionRows('Depression', report.quickCheckIns.depressionDistribution, quickDepressionOptions, missingSingleCount(report.quickCheckIns.depressionDistribution, quickDepressionOptions, report.completion.quickCheckIns)),
    [],
    ...distributionRows('Warning signs', report.quickCheckIns.warningDistribution, quickWarningSignOptions, missingSingleCount(report.quickCheckIns.warningDistribution, quickWarningSignOptions, report.completion.quickCheckIns)),
  ])}
  ${sheet('Evening mood', distributionRows('How was your mood today?', report.mood.ratingDistribution, eveningMoodOptions, missingSingleCount(report.mood.ratingDistribution, eveningMoodOptions, report.completion.checkInDays)))}
  ${sheet('Sleep last night', [
    ...distributionRows('Duration', report.sleep.durationDistribution, sleepDurationOptions, missingSingleCount(report.sleep.durationDistribution, sleepDurationOptions, report.completion.sleepEntries)),
    [],
    ...distributionRows('Quality', report.sleep.qualityDistribution, sleepQualityOptions, missingSingleCount(report.sleep.qualityDistribution, sleepQualityOptions, report.completion.sleepEntries)),
    [],
    ...distributionRows('Disruptions', report.detailDistributions.sleepDisruptions, sleepDisruptionOptions, report.detailMissing.sleepDisruptions),
  ])}
  ${sheet('Nightmares', [
    ['Nightmare evidence state', report.nightmares.statement],
    ['Nightmare events', report.nightmares.eventCount],
    ['Detailed logs', report.nightmares.detailedLogCount],
    ['Sleep-linked generic events', report.nightmares.genericSleepLinkedCount],
    ['Sleep entries with nightmare disruption', report.nightmares.sleepDisruptionDays],
    ['Sleep entries explicitly marked none', report.nightmares.explicitNoNightmareDays],
    ['Sleep entries without explicit nightmare or none', report.nightmares.unansweredSleepEntries],
    ...(report.nightmares.detailedLogCount ? [
      [],
      ...distributionRows('Intensity', report.detailDistributions.nightmareIntensity, nightmareIntensityOptions, missingSingleCount(report.detailDistributions.nightmareIntensity, nightmareIntensityOptions, report.nightmares.detailedLogCount)),
      [],
      ...distributionRows('Wake reactions', report.detailDistributions.nightmareWakeReactions, nightmareWakeOptions, report.detailMissing.nightmareWakeReactions),
      [],
      ...distributionRows('After waking', report.detailDistributions.nightmareAfterWaking, nightmareAfterOptions, report.detailMissing.nightmareAfterWaking),
    ] : []),
  ])}
  ${sheet('Anxiety', [
    ...distributionRows('Severity', report.anxiety.severityDistribution, severityOptions, missingSingleCount(report.anxiety.severityDistribution, severityOptions, report.completion.checkInDays)),
    [],
    ...distributionRows('Contributors', report.detailDistributions.anxietyContributors, anxietyContributorOptions, report.detailMissing.anxietyContributors),
  ])}
  ${sheet('Depression', [
    ...distributionRows('Severity', report.depression.severityDistribution, severityOptions, missingSingleCount(report.depression.severityDistribution, severityOptions, report.completion.checkInDays)),
    [],
    ...distributionRows('Symptoms', report.detailDistributions.depressionSymptoms, depressionSymptomOptions, report.detailMissing.depressionSymptoms),
    [],
    ...distributionRows('Contributors', report.detailDistributions.depressionContributors, depressionContributorOptions, report.detailMissing.depressionContributors),
  ])}
  ${sheet('Warning signs', [
    ...distributionRows('Suspiciousness', report.warningSigns.suspiciousnessDistribution, psychosisSeverityOptions, missingSingleCount(report.warningSigns.suspiciousnessDistribution, psychosisSeverityOptions, report.completion.checkInDays)),
    [],
    ...distributionRows('Unusual meanings', report.warningSigns.unusualMeaningsDistribution, psychosisSeverityOptions, missingSingleCount(report.warningSigns.unusualMeaningsDistribution, psychosisSeverityOptions, report.completion.checkInDays)),
    [],
    ...distributionRows('Belief certainty', report.warningSigns.beliefCertaintyDistribution, beliefCertaintyOptions, missingSingleCount(report.warningSigns.beliefCertaintyDistribution, beliefCertaintyOptions, report.completion.checkInDays)),
    [],
    ...distributionRows('Perceptual experiences', report.detailDistributions.perceptualExperiences, perceptualExperienceOptions, report.detailMissing.perceptualExperiences),
    [],
    ...distributionRows('Thinking clarity', report.warningSigns.thinkingClarityDistribution, thinkingClarityOptions, missingSingleCount(report.warningSigns.thinkingClarityDistribution, thinkingClarityOptions, report.completion.checkInDays)),
    [],
    ...distributionRows('Reality check', report.warningSigns.realityCheckDistribution, realityCheckOptions, missingSingleCount(report.warningSigns.realityCheckDistribution, realityCheckOptions, report.completion.checkInDays)),
  ])}
  ${sheet('Functioning', distributionRows('Recorded items', report.functioning, functioningOptions, report.detailMissing.functioning))}
  ${report.substanceUse.included ? sheet('Substance use', [
    ['Days with recorded use', report.substanceUse.daysWithUse],
    ['Quick check-ins with recorded use', report.substanceUse.entriesWithUse],
    [],
    ...topRows('Common substances', report.substanceUse.commonSubstances),
    [],
    ...distributionRows('Amount', report.substanceUse.amountDistribution, substanceAmountOptions),
    [],
    ...distributionRows('Timing', report.substanceUse.timingDistribution, substanceTimingOptions),
    [],
    ...distributionRows('Reason', report.substanceUse.reasonDistribution, substanceReasonOptions),
    [],
    ...distributionRows('Helped', report.substanceUse.helpedDistribution, substanceHelpedOptions),
    [],
    ['Sleep comparison', report.substanceUse.sleepComparison],
    ['Anxiety comparison', report.substanceUse.anxietyComparison],
    ['Warning-sign comparison', report.substanceUse.warningSignsComparison],
  ]) : ''}
  ${sheet('Scale definitions', [
    ['Source separation', 'Quick and evening check-in scales are reported separately.'],
    ['Mood direction', 'Higher mood values represent better recorded mood.'],
    ['Symptom direction', 'Higher anxiety and depression values represent greater recorded severity.'],
    ['Missing values', 'Missing responses are labelled Not logged and are not replaced with zero or none.'],
    ['Disclaimer', reportDisclaimer],
  ])}
  ${sheet('Raw quick', rawRecordRows(report.raw.quickCheckIns))}
  ${sheet('Raw evening', rawRecordRows(report.raw.eveningCheckIns))}
  ${sheet('Raw sleep', rawRecordRows(report.raw.sleepEntries))}
  ${sheet('Raw nightmares', rawRecordRows(report.raw.nightmareEntries))}
  ${sheet('Raw journal', rawRecordRows(report.raw.journalEntries))}
</Workbook>`

  return new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8' })
}

const csvEscape = (value: CellValue) => {
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export const buildReportCsvBlob = (report: PreparedClinicianReport) => {
  const rows: CellValue[][] = [
    ['Section', 'Item', 'Value'],
    ['Summary', 'Date range', `${report.range.start} to ${report.range.end}`],
    ['Summary', 'Generated', new Date().toLocaleString()],
    ['Summary', 'Included content', report.includedContent.included.join('; ')],
    ['Summary', 'Excluded content', report.includedContent.excluded.join('; ') || 'None'],
    ...report.summaryFindings.map((finding) => ['Summary finding', finding.id, finding.statement]),
    ...report.coverage.map((item) => ['Coverage', item.label, item.display]),
  ]

  const appendDistribution = <T extends string>(section: string, distribution: Record<T, number>, options: Option<T>[], notLoggedCount?: number) => {
    options.forEach((option) => rows.push([section, option.label, distribution[option.value] ?? 0]))
    if (notLoggedCount !== undefined) rows.push([section, 'Not logged', notLoggedCount])
  }
  const appendTop = (section: string, title: string, items: Array<{ label: string; count: number }>) => {
    items.forEach((item) => rows.push([section, `${title}: ${item.label}`, item.count]))
  }
  const appendRaw = (section: string, records: Array<Record<string, unknown>>) => {
    const keys = [...new Set(records.flatMap((record) => Object.keys(record)))]
    records.forEach((record, index) => {
      keys.forEach((key) => {
        const value = Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined
        rows.push([section, `${String(record.date ?? record.id ?? index + 1)} - ${key}`, rawCellValue(value)])
      })
    })
  }

  appendDistribution(`Quick ${quickCheckInLabels.moodToday.toLowerCase()}`, report.quickCheckIns.moodDistribution, quickMoodOptions, missingSingleCount(report.quickCheckIns.moodDistribution, quickMoodOptions, report.completion.quickCheckIns))
  appendDistribution('Quick anxiety', report.quickCheckIns.anxietyDistribution, quickAnxietyOptions, missingSingleCount(report.quickCheckIns.anxietyDistribution, quickAnxietyOptions, report.completion.quickCheckIns))
  appendDistribution('Quick depression', report.quickCheckIns.depressionDistribution, quickDepressionOptions, missingSingleCount(report.quickCheckIns.depressionDistribution, quickDepressionOptions, report.completion.quickCheckIns))
  appendDistribution('Quick warning signs', report.quickCheckIns.warningDistribution, quickWarningSignOptions, missingSingleCount(report.quickCheckIns.warningDistribution, quickWarningSignOptions, report.completion.quickCheckIns))
  appendDistribution('Evening mood', report.mood.ratingDistribution, eveningMoodOptions, missingSingleCount(report.mood.ratingDistribution, eveningMoodOptions, report.completion.checkInDays))
  appendDistribution('Sleep duration', report.sleep.durationDistribution, sleepDurationOptions, missingSingleCount(report.sleep.durationDistribution, sleepDurationOptions, report.completion.sleepEntries))
  appendDistribution('Sleep quality', report.sleep.qualityDistribution, sleepQualityOptions, missingSingleCount(report.sleep.qualityDistribution, sleepQualityOptions, report.completion.sleepEntries))
  appendDistribution('Sleep disruption', report.detailDistributions.sleepDisruptions, sleepDisruptionOptions, report.detailMissing.sleepDisruptions)
  appendDistribution('Anxiety severity', report.anxiety.severityDistribution, severityOptions, missingSingleCount(report.anxiety.severityDistribution, severityOptions, report.completion.checkInDays))
  appendDistribution('Anxiety contributor', report.detailDistributions.anxietyContributors, anxietyContributorOptions, report.detailMissing.anxietyContributors)
  appendDistribution('Depression severity', report.depression.severityDistribution, severityOptions, missingSingleCount(report.depression.severityDistribution, severityOptions, report.completion.checkInDays))
  appendDistribution('Depression symptom', report.detailDistributions.depressionSymptoms, depressionSymptomOptions, report.detailMissing.depressionSymptoms)
  appendDistribution('Depression contributor', report.detailDistributions.depressionContributors, depressionContributorOptions, report.detailMissing.depressionContributors)
  rows.push(['Nightmares', 'Evidence state', report.nightmares.statement])
  rows.push(['Nightmares', 'Nightmare events', report.nightmares.eventCount])
  rows.push(['Nightmares', 'Detailed logs', report.nightmares.detailedLogCount])
  rows.push(['Nightmares', 'Explicit recorded none in sleep entries', report.nightmares.explicitNoNightmareDays])
  rows.push(['Nightmares', 'Unanswered sleep entries', report.nightmares.unansweredSleepEntries])
  if (report.nightmares.detailedLogCount) {
    appendDistribution('Nightmare intensity', report.detailDistributions.nightmareIntensity, nightmareIntensityOptions, missingSingleCount(report.detailDistributions.nightmareIntensity, nightmareIntensityOptions, report.nightmares.detailedLogCount))
    appendDistribution('Nightmare wake reaction', report.detailDistributions.nightmareWakeReactions, nightmareWakeOptions, report.detailMissing.nightmareWakeReactions)
    appendDistribution('Nightmare after waking', report.detailDistributions.nightmareAfterWaking, nightmareAfterOptions, report.detailMissing.nightmareAfterWaking)
  }
  appendDistribution('Suspiciousness', report.warningSigns.suspiciousnessDistribution, psychosisSeverityOptions, missingSingleCount(report.warningSigns.suspiciousnessDistribution, psychosisSeverityOptions, report.completion.checkInDays))
  appendDistribution('Unusual meanings', report.warningSigns.unusualMeaningsDistribution, psychosisSeverityOptions, missingSingleCount(report.warningSigns.unusualMeaningsDistribution, psychosisSeverityOptions, report.completion.checkInDays))
  appendDistribution('Belief certainty', report.warningSigns.beliefCertaintyDistribution, beliefCertaintyOptions, missingSingleCount(report.warningSigns.beliefCertaintyDistribution, beliefCertaintyOptions, report.completion.checkInDays))
  appendDistribution('Perceptual experience', report.detailDistributions.perceptualExperiences, perceptualExperienceOptions, report.detailMissing.perceptualExperiences)
  appendDistribution('Thinking clarity', report.warningSigns.thinkingClarityDistribution, thinkingClarityOptions, missingSingleCount(report.warningSigns.thinkingClarityDistribution, thinkingClarityOptions, report.completion.checkInDays))
  appendDistribution('Reality check', report.warningSigns.realityCheckDistribution, realityCheckOptions, missingSingleCount(report.warningSigns.realityCheckDistribution, realityCheckOptions, report.completion.checkInDays))
  appendDistribution('Daily functioning', report.functioning, functioningOptions, report.detailMissing.functioning)

  if (report.substanceUse.included) {
    rows.push(['Substance use', 'Days with recorded use', report.substanceUse.daysWithUse])
    rows.push(['Substance use', 'Quick check-ins with recorded use', report.substanceUse.entriesWithUse])
    appendTop('Substance use', 'Substance', report.substanceUse.commonSubstances)
    rows.push(['Substance use', 'Sleep comparison', report.substanceUse.sleepComparison])
    rows.push(['Substance use', 'Anxiety comparison', report.substanceUse.anxietyComparison])
    rows.push(['Substance use', 'Warning-sign comparison', report.substanceUse.warningSignsComparison])
  }

  rows.push(['Scale definitions', 'Source separation', 'Quick and evening check-in scales are reported separately.'])
  rows.push(['Scale definitions', 'Missing values', 'Missing responses are labelled Not logged and are not replaced with zero or none.'])
  rows.push(['Disclaimer', 'Report limits', reportDisclaimer])

  appendRaw('Raw quick check-in', report.raw.quickCheckIns)
  appendRaw('Raw evening check-in', report.raw.eveningCheckIns)
  appendRaw('Raw sleep entry', report.raw.sleepEntries)
  appendRaw('Raw nightmare entry', report.raw.nightmareEntries)
  appendRaw('Raw journal entry', report.raw.journalEntries)

  const csv = rows.map((csvRow) => csvRow.map(csvEscape).join(',')).join('\n')
  return new Blob([csv], { type: 'text/csv;charset=utf-8' })
}

const pdfEscape = (value: string) =>
  value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)')

const wrapPdfLine = (line: string, maxLength = 90) => {
  if (line.length <= maxLength) return [line]
  const words = line.split(' ')
  const lines: string[] = []
  let current = ''

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxLength && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  })
  if (current) lines.push(current)
  return lines
}

const pagesFor = (report: PreparedClinicianReport) => {
  const linesPerPage = 46
  const overview = overviewTextLines(report).flatMap((line) => wrapPdfLine(line))
  const detailed = detailedTextLines(report).flatMap((line) => wrapPdfLine(line))
  const chunk = (lines: string[]) => Array.from(
    { length: Math.max(1, Math.ceil(lines.length / linesPerPage)) },
    (_, index) => lines.slice(index * linesPerPage, index * linesPerPage + linesPerPage),
  )
  return [...chunk(overview), ...chunk(detailed)]
}

export const buildReportPdfBlob = (report: PreparedClinicianReport) => {
  const pages = pagesFor(report)
  const objects: string[] = []
  const addObject = (body: string) => {
    objects.push(body)
    return objects.length
  }

  const catalogId = addObject('')
  const pagesId = addObject('')
  const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  const pageIds: number[] = []

  pages.forEach((pageLines) => {
    const content = [
      'BT',
      '/F1 11 Tf',
      '50 792 Td',
      '14 TL',
      ...pageLines.map((line) => `(${pdfEscape(line)}) Tj T*`),
      'ET',
    ].join('\n')
    const contentId = addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`)
    pageIds.push(pageId)
  })

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((body, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`
  })

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new Blob([pdf], { type: 'application/pdf' })
}
