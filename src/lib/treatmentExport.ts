import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import type { TreatmentProgram } from '../data/treatmentContent'
import { treatmentStatusLabels } from '../data/treatmentContent'
import type {
  TreatmentActivity,
  TreatmentNightmareEntry,
  TreatmentProgramPlan,
  TreatmentProgramStatus,
  TreatmentResponse,
  TreatmentReview,
  TreatmentSession,
} from '../types'

export interface TreatmentHandoffSelection {
  includePlan: boolean
  activityIds: string[]
  responseIds: string[]
  nightmareIds?: string[]
  sessionIds: string[]
  reviewIds: string[]
}

export interface TreatmentHandoffInput {
  program: TreatmentProgram
  status: TreatmentProgramStatus
  completedModuleCount: number
  plan?: TreatmentProgramPlan
  activities: TreatmentActivity[]
  nightmares?: TreatmentNightmareEntry[]
  responses: TreatmentResponse[]
  sessions: TreatmentSession[]
  reviews: TreatmentReview[]
  selection: TreatmentHandoffSelection
  generatedAt?: string
}

const valueOrNotRecorded = (value?: string | number) =>
  value === undefined || value === '' ? 'Not recorded' : String(value)

const responseLines = (program: TreatmentProgram, response: TreatmentResponse) => {
  const module = program.modules.find((item) => item.id === response.moduleId)
  const lines = [
    module?.title ?? response.moduleId,
    `Status: ${response.status === 'completed' ? 'Completed' : 'Draft'}`,
    `Updated: ${response.updatedAt}`,
  ]

  for (const [promptId, value] of Object.entries(response.values)) {
    if (!value.trim()) continue
    const label = module?.prompts.find((prompt) => prompt.id === promptId)?.label ?? promptId
    lines.push(`${label}: ${value}`)
  }
  if (response.keyTakeaway) lines.push(`What I want to remember: ${response.keyTakeaway}`)
  if (response.plannedNextStep) lines.push(`Chosen next step: ${response.plannedNextStep}`)
  return lines
}

export const buildTreatmentHandoffLines = ({
  program,
  status,
  completedModuleCount,
  plan,
  activities,
  nightmares = [],
  responses,
  sessions,
  reviews,
  selection,
  generatedAt = new Date().toISOString(),
}: TreatmentHandoffInput) => {
  const selectedActivities = activities.filter((item) => selection.activityIds.includes(item.id))
  const selectedResponses = responses.filter((item) => selection.responseIds.includes(item.id))
  const selectedNightmares = nightmares.filter((item) => selection.nightmareIds?.includes(item.id))
  const selectedSessions = sessions.filter((item) => selection.sessionIds.includes(item.id))
  const selectedReviews = reviews.filter((item) => selection.reviewIds.includes(item.id))
  const lines = [
    'Salience Treatment Pathway Report',
    program.name,
    `Generated: ${generatedAt}`,
    `Program status: ${treatmentStatusLabels[status]}`,
    `Modules completed: ${completedModuleCount} of ${program.modules.length}`,
    '',
    'This user-generated report contains only material selected by the Salience user. It is not a diagnosis, clinical assessment, treatment recommendation, clinician-authored record, or emergency record.',
  ]

  if (selection.includePlan && plan) {
    lines.push(
      '',
      'Program plan',
      `Hopes: ${valueOrNotRecorded(plan.hopes)}`,
      `Goals: ${plan.goals.length ? plan.goals.join(' | ') : 'Not recorded'}`,
      `Concerns or questions: ${valueOrNotRecorded(plan.concerns)}`,
      `Agreed focus: ${valueOrNotRecorded(plan.agreedFocus)}`,
      `Current focus phase: ${valueOrNotRecorded(program.phases.find((phase) => phase.id === plan.currentPhaseId)?.title)}`,
      `Chosen next module: ${valueOrNotRecorded(program.modules.find((module) => module.id === plan.nextModuleId)?.title)}`,
      `Plan review date: ${valueOrNotRecorded(plan.reviewDate)}`,
      `Working agreement for Salience: ${valueOrNotRecorded(plan.workingAgreement)}`,
      `Pacing preference: ${plan.pacingPreference}`,
      `Custom pacing: ${valueOrNotRecorded(plan.customPacing)}`,
      `Pause plan: ${valueOrNotRecorded(plan.pausePlan)}`,
      `Next appointment: ${valueOrNotRecorded(plan.nextAppointmentAt)}`,
    )
  }

  if (selectedActivities.length) {
    lines.push('', 'Selected chosen activities')
    for (const activity of selectedActivities) {
      lines.push(
        '',
        `Activity: ${activity.title}`,
        `Source recorded by user: ${activity.source}`,
        `Status: ${activity.status}`,
        `Chosen date: ${valueOrNotRecorded(activity.dueDate)}`,
        `Related module: ${valueOrNotRecorded(program.modules.find((module) => module.id === activity.relatedModuleId)?.title)}`,
        `Details or instructions: ${valueOrNotRecorded(activity.details)}`,
        `Safety, choice, or modification notes: ${valueOrNotRecorded(activity.safetyNotes)}`,
        `Support or stopping plan: ${valueOrNotRecorded(activity.supportPlan)}`,
      )
    }
  }

  if (selectedResponses.length) {
    lines.push('', 'Selected worksheets')
    for (const response of selectedResponses) {
      lines.push('', ...responseLines(program, response))
    }
  }

  if (selectedNightmares.length) {
    lines.push('', 'Selected nightmare records')
    for (const nightmare of selectedNightmares) {
      lines.push(
        '',
        `Nightmare date and time: ${nightmare.timestamp}`,
        `Intensity (0-10): ${nightmare.intensity}`,
        `Minutes to feel oriented: ${valueOrNotRecorded(nightmare.recoveryMinutes)}`,
        `Returned to sleep: ${valueOrNotRecorded(nightmare.returnedToSleep)}`,
        `User-selected themes: ${nightmare.themeTags.length ? nightmare.themeTags.join(' | ') : 'Not recorded'}`,
        `Custom tags: ${nightmare.customTags.length ? nightmare.customTags.join(' | ') : 'Not recorded'}`,
        `Optional notes: ${valueOrNotRecorded(nightmare.notes)}`,
        `Suspected daytime trigger: ${valueOrNotRecorded(nightmare.suspectedTrigger)}`,
        `Effect on following day: ${valueOrNotRecorded(nightmare.nextDayEffect)}`,
      )
    }
  }

  if (selectedSessions.length) {
    lines.push('', 'Selected appointment notes')
    for (const session of selectedSessions) {
      lines.push(
        '',
        `Appointment: ${session.appointmentAt}`,
        `Status: ${session.status}`,
        `Agenda: ${valueOrNotRecorded(session.agenda)}`,
        `Questions: ${valueOrNotRecorded(session.questions)}`,
        `Clinician instructions: ${valueOrNotRecorded(session.clinicianInstructions)}`,
        `Observations: ${valueOrNotRecorded(session.observations)}`,
        `Next steps: ${valueOrNotRecorded(session.nextSteps)}`,
      )
    }
  }

  if (selectedReviews.length) {
    lines.push('', 'Selected progress reviews')
    for (const review of selectedReviews) {
      lines.push(
        '',
        `Review date: ${review.reviewDate}`,
        `Sleep impact (0-10): ${valueOrNotRecorded(review.sleepImpact)}`,
        `Nightmare impact (0-10): ${valueOrNotRecorded(review.nightmareImpact)}`,
        `Trauma-reminder impact (0-10): ${valueOrNotRecorded(review.remindersImpact)}`,
        `Avoidance impact (0-10): ${valueOrNotRecorded(review.avoidanceImpact)}`,
        `Daily functioning (0-10): ${valueOrNotRecorded(review.dailyFunctioning)}`,
        `Confidence using coping tools (0-10): ${valueOrNotRecorded(review.copingConfidence)}`,
        `Progress toward personal goals (0-10): ${valueOrNotRecorded(review.goalProgress)}`,
        `What helped: ${valueOrNotRecorded(review.whatHelped)}`,
        `What was difficult: ${valueOrNotRecorded(review.whatWasDifficult)}`,
        `Questions: ${valueOrNotRecorded(review.questions)}`,
        `Clinician-recorded measure: ${review.clinicianMeasureName
          ? `${review.clinicianMeasureName} ${valueOrNotRecorded(review.clinicianMeasureScore)}/${valueOrNotRecorded(review.clinicianMeasureMaximum)}`
          : 'Not recorded'}`,
      )
    }
  }

  return lines
}

const heading = (text: string, level: typeof HeadingLevel.HEADING_1 | typeof HeadingLevel.HEADING_2) =>
  new Paragraph({ text, heading: level, spacing: { before: 220, after: 100 } })

export const buildTreatmentHandoffDocx = async (input: TreatmentHandoffInput) => {
  const lines = buildTreatmentHandoffLines(input)
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      text: lines[0],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: lines[1], bold: true })],
      spacing: { after: 220 },
    }),
  ]

  for (const line of lines.slice(2)) {
    if (['Program plan', 'Selected chosen activities', 'Selected worksheets', 'Selected nightmare records', 'Selected appointment notes', 'Selected progress reviews'].includes(line)) {
      children.push(heading(line, HeadingLevel.HEADING_1))
    } else if (!line) {
      children.push(new Paragraph({ text: '' }))
    } else {
      children.push(new Paragraph({ text: line, spacing: { after: 90 } }))
    }
  }

  const doc = new Document({
    creator: 'Salience',
    title: `Salience ${input.program.name} clinician report`,
    description: 'User-selected treatment pathway material prepared for an optional clinical conversation.',
    sections: [{ children }],
  })

  return Packer.toBlob(doc)
}
