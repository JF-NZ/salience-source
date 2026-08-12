import type { TreatmentProgramId, TreatmentProgramStatus, TreatmentUseMode } from '../types'

export type TreatmentContentType =
  | 'education'
  | 'worksheet'
  | 'coping'
  | 'appointment-preparation'
  | 'clinician-guided'

export type TreatmentDeliveryMode = 'self-guided' | 'information-only'

export type ClinicalReviewStatus = 'pending-professional-review'

export interface TreatmentPrompt {
  id: string
  label: string
  helper?: string
  multiline?: boolean
  inputType?: 'text' | 'textarea' | 'select' | 'multiselect' | 'rating' | 'date'
  options?: Array<{ value: string; label: string }>
}

export interface TreatmentGuideStep {
  id: string
  title: string
  body: string
  promptIds: string[]
}

export interface TreatmentProgramPhase {
  id: string
  title: string
  description: string
}

export interface TreatmentContentItem {
  id: string
  program: TreatmentProgramId
  title: string
  body: string
  contentType: TreatmentContentType
  prompts: TreatmentPrompt[]
  phaseId: string
  phaseTitle: string
  keyPoints: string[]
  steps: TreatmentGuideStep[]
  estimatedMinutes: number
  repeatable: boolean
  requiresCurrentStateCheck: boolean
  professionalRole: string
  sourceTitle: string
  sourceOrganisation: string
  sourcePublicationOrReviewYear: number
  sourceUrl: string
  lastReviewedInSalience: string
  clinicalReviewStatus: ClinicalReviewStatus
  clinicianGuidanceRequired: boolean
  deliveryMode: TreatmentDeliveryMode
  structuredTreatment?: boolean
}

export interface TreatmentProgram {
  id: TreatmentProgramId
  name: string
  description: string
  guidanceLabel: string
  comparison: {
    focus: string
    outsideThisPathway: string
    salienceRole: string
    questionsToDiscuss: string[]
  }
  phases: TreatmentProgramPhase[]
  modules: TreatmentContentItem[]
}

const reviewed = '2026-07-30'
const vaGuideline = {
  sourceTitle: 'VA/DoD Clinical Practice Guideline for Management of PTSD and Acute Stress Disorder',
  sourceOrganisation: 'US Department of Veterans Affairs and Department of Defense',
  sourcePublicationOrReviewYear: 2023,
  sourceUrl: 'https://www.healthquality.va.gov/guidelines/MH/ptsd/',
  lastReviewedInSalience: reviewed,
  clinicalReviewStatus: 'pending-professional-review' as const,
}
const vaCenter = {
  sourceTitle: 'Overview of Psychotherapy for PTSD',
  sourceOrganisation: 'US National Center for PTSD',
  sourcePublicationOrReviewYear: 2025,
  sourceUrl: 'https://www.ptsd.va.gov/professional/treat/txessentials/overview_therapy.asp',
  lastReviewedInSalience: reviewed,
  clinicalReviewStatus: 'pending-professional-review' as const,
}
const vaCpt = {
  sourceTitle: 'Cognitive Processing Therapy for PTSD',
  sourceOrganisation: 'US National Center for PTSD',
  sourcePublicationOrReviewYear: 2026,
  sourceUrl: 'https://www.ptsd.va.gov/professional/treat/txessentials/cpt_for_ptsd_pro.asp',
  lastReviewedInSalience: reviewed,
  clinicalReviewStatus: 'pending-professional-review' as const,
}
const vaPe = {
  sourceTitle: 'Prolonged Exposure for PTSD',
  sourceOrganisation: 'US National Center for PTSD',
  sourcePublicationOrReviewYear: 2026,
  sourceUrl: 'https://www.ptsd.va.gov/professional/treat/txessentials/prolonged_exposure_pro.asp',
  lastReviewedInSalience: reviewed,
  clinicalReviewStatus: 'pending-professional-review' as const,
}
const vaEmdr = {
  sourceTitle: 'Eye Movement Desensitization and Reprocessing for PTSD',
  sourceOrganisation: 'US National Center for PTSD',
  sourcePublicationOrReviewYear: 2026,
  sourceUrl: 'https://www.ptsd.va.gov/professional/treat/txessentials/emdr_pro.asp',
  lastReviewedInSalience: reviewed,
  clinicalReviewStatus: 'pending-professional-review' as const,
}
const vaDecisionAid = {
  sourceTitle: 'PTSD Treatment Decision Aid',
  sourceOrganisation: 'US National Center for PTSD',
  sourcePublicationOrReviewYear: 2026,
  sourceUrl: 'https://www.ptsd.va.gov/appvid/decisionaid_public.asp',
  lastReviewedInSalience: reviewed,
  clinicalReviewStatus: 'pending-professional-review' as const,
}
const nice = {
  sourceTitle: 'Post-traumatic stress disorder: NICE guideline NG116',
  sourceOrganisation: 'National Institute for Health and Care Excellence',
  sourcePublicationOrReviewYear: 2025,
  sourceUrl: 'https://www.nice.org.uk/guidance/ng116',
  lastReviewedInSalience: reviewed,
  clinicalReviewStatus: 'pending-professional-review' as const,
}
const nicePsychosis = {
  sourceTitle: 'Psychosis and schizophrenia in adults: prevention and management',
  sourceOrganisation: 'National Institute for Health and Care Excellence',
  sourcePublicationOrReviewYear: 2014,
  sourceUrl: 'https://www.nice.org.uk/guidance/cg178/chapter/recommendations',
  lastReviewedInSalience: reviewed,
  clinicalReviewStatus: 'pending-professional-review' as const,
}
const cptCoach = {
  sourceTitle: 'Roadmap for Using CPT Coach in Treatment',
  sourceOrganisation: 'US National Center for PTSD',
  sourcePublicationOrReviewYear: 2024,
  sourceUrl: 'https://www.ptsd.va.gov/professional/tech-care/docs/CPT_Coach_Roadmap_VersionA.pdf',
  lastReviewedInSalience: reviewed,
  clinicalReviewStatus: 'pending-professional-review' as const,
}
const peCoach = {
  sourceTitle: 'Mobile App: PE Coach',
  sourceOrganisation: 'US National Center for PTSD',
  sourcePublicationOrReviewYear: 2026,
  sourceUrl: 'https://www.ptsd.va.gov/appvid/mobile/pecoach_app_public.asp',
  lastReviewedInSalience: reviewed,
  clinicalReviewStatus: 'pending-professional-review' as const,
}
const vaAssessment = {
  sourceTitle: 'PTSD Assessment Overview',
  sourceOrganisation: 'US National Center for PTSD',
  sourcePublicationOrReviewYear: 2026,
  sourceUrl: 'https://www.ptsd.va.gov/professional/assessment/overview/',
  lastReviewedInSalience: reviewed,
  clinicalReviewStatus: 'pending-professional-review' as const,
}

interface ModuleDesign {
  phaseId: string
  phaseTitle: string
  keyPoints: string[]
  estimatedMinutes?: number
  repeatable?: boolean
  stepTitles?: string[]
  stepBodies?: string[]
  promptGroups?: string[][]
  requiresCurrentStateCheck?: boolean
  professionalRole?: string
  structuredTreatment?: boolean
}

type ClinicalSource = typeof vaGuideline

const defaultProgramSources: Record<TreatmentProgramId, ClinicalSource> = {
  'tf-cbt': nice,
  cpt: vaCpt,
  pe: vaPe,
  emdr: vaEmdr,
}

const moduleDesign: Record<string, ModuleDesign> = {
  'tf-cbt:responses': {
    phaseId: 'orient',
    phaseTitle: 'Understand and choose',
    keyPoints: ['Responses can vary from day to day.', 'A response is information, not a personal failure.', 'Only a qualified professional can assess or diagnose a condition.'],
  },
  'tf-cbt:priorities': {
    phaseId: 'orient',
    phaseTitle: 'Understand and choose',
    keyPoints: ['Start with what matters in daily life.', 'Goals can be small and can change.', 'The program plan can be reviewed with a clinician.'],
    repeatable: true,
    promptGroups: [['hopes', 'small-change'], ['support']],
    stepTitles: ['Orient to what matters', 'Name a direction', 'Choose support'],
    stepBodies: ['', 'Start with daily life rather than a symptom target. Write only what matters to you, then choose a change small enough to feel possible.', 'Consider practical, personal, or professional support that could make the change more manageable. Leave this blank if you are unsure.'],
  },
  'tf-cbt:regulation': {
    phaseId: 'stabilise',
    phaseTitle: 'Build present-day skills',
    keyPoints: ['Grounding directs attention to current surroundings.', 'No action has to work every time.', 'Stop any strategy that feels unhelpful.'],
    repeatable: true,
    promptGroups: [['skills']],
    stepTitles: ['Understand present-orientation skills', 'Build my menu'],
    stepBodies: ['', 'Record actions you already know or want to discuss. There is no required technique, order, timer, or breathing pattern.'],
  },
  'tf-cbt:then-now': {
    phaseId: 'stabilise',
    phaseTitle: 'Build present-day skills',
    keyPoints: ['Use concrete facts about place, date, choice, and current supports.', 'You do not need to describe the traumatic event.', 'Pause and ground remains available throughout.'],
    repeatable: true,
    promptGroups: [['then', 'now']],
    stepTitles: ['Understand then and now', 'Use present-day facts'],
    stepBodies: ['', 'Name only enough about the reminder to distinguish it from current facts. You do not need to describe what happened in the past.'],
  },
  'tf-cbt:triggers': {
    phaseId: 'notice',
    phaseTitle: 'Notice patterns',
    keyPoints: ['Record only reminders you identify yourself.', 'Notice context as well as thoughts, emotions, body responses, and actions.', 'The aim is observation, not proving why something happened.'],
    repeatable: true,
    promptGroups: [['situation', 'response'], ['helped']],
    stepTitles: ['Understand reminders', 'Notice the sequence', 'Notice return to the present'],
    stepBodies: ['', 'Describe only what you want to record, then separate the situation from thoughts, emotions, body responses, or actions you noticed.', 'Record anything that helped, even briefly. “Nothing yet” is also a valid observation.'],
  },
  'tf-cbt:map': {
    phaseId: 'notice',
    phaseTitle: 'Notice patterns',
    keyPoints: ['Separate parts of an experience without judging them.', 'Thoughts, emotions, body responses, and actions can influence one another.', 'A map can be incomplete and still useful.'],
    repeatable: true,
    promptGroups: [['situation', 'thoughts'], ['emotions', 'body'], ['actions']],
    stepTitles: ['Understand the map', 'Situation and thoughts', 'Emotions and body', 'Actions or urges'],
    stepBodies: ['', 'Begin with a short factual situation and the thoughts you remember noticing. You can use a recent ordinary example.', 'Name emotions and body responses separately if that is useful. Approximate words are enough.', 'Record what you did or felt an urge to do without judging, explaining, or acting on the urge.'],
  },
  'tf-cbt:avoidance': {
    phaseId: 'notice',
    phaseTitle: 'Notice patterns',
    keyPoints: ['Avoidance can be understandable and protective in the short term.', 'Recording a pattern does not mean you must confront it.', 'You choose whether any ordinary-life change feels useful and safe.'],
    repeatable: true,
    promptGroups: [['noticed', 'cost'], ['choice']],
    stepTitles: ['Understand avoidance', 'Notice impact', 'Choose what happens next'],
    stepBodies: ['', 'Record a pattern you have already noticed and how it affects daily life. This does not commit you to approaching it.', 'Record whether you want to leave it alone, make an ordinary-life change, or seek more support. Salience will not choose for you.'],
  },
  'tf-cbt:sleep-plan': {
    phaseId: 'stabilise',
    phaseTitle: 'Build present-day skills',
    keyPoints: ['Plan for both the night and the following morning.', 'Keep steps realistic for low-energy days.', 'Nightmare Support can be used without completing this module.'],
    repeatable: true,
    promptGroups: [['night', 'morning']],
    stepTitles: ['Plan for disrupted sleep', 'Choose night and morning supports'],
    stepBodies: ['', 'Choose simple actions that remain realistic when tired. Include only options you can stop or change easily.'],
  },
  'tf-cbt:coping-plan': {
    phaseId: 'stabilise',
    phaseTitle: 'Build present-day skills',
    keyPoints: ['Choose early signs you personally want to notice.', 'Include actions that are practical and available.', 'Add people or services only when you want them involved.'],
    repeatable: true,
    promptGroups: [['signs', 'actions'], ['supports']],
    stepTitles: ['Understand the coping plan', 'Notice and choose', 'Choose support'],
    stepBodies: ['', 'Record early signs you recognise in yourself and actions that may help you regain choice. Do not use the list as a test or score.', 'Add people or services only when you want them involved, and note any preferences about how they help.'],
  },
  'tf-cbt:therapist-questions': {
    phaseId: 'collaborate',
    phaseTitle: 'Work with care',
    keyPoints: ['Questions can cover pacing, goals, privacy, sleep, and stopping.', 'You can export only the items you choose.', 'It is reasonable to ask how progress will be reviewed.'],
    repeatable: true,
  },
  'tf-cbt:assigned-work': {
    phaseId: 'collaborate',
    phaseTitle: 'Choose support',
    keyPoints: ['You can create a small practice step or record one suggested by a professional.', 'Write down stopping points and support.', 'Change or remove the plan whenever you choose.'],
    repeatable: true,
    requiresCurrentStateCheck: false,
    promptGroups: [['instructions', 'questions']],
    stepTitles: ['Choose a practice plan', 'Record the plan and questions'],
    stepBodies: ['', 'Keep the plan small, specific, and easy to pause. It may be self-chosen or based on professional advice.'],
  },
  'tf-cbt:memory-processing': {
    phaseId: 'collaborate',
    phaseTitle: 'Choose support',
    keyPoints: ['This information page does not request a trauma narrative.', 'Detailed memory processing is not part of the Salience self-guided pathway.', 'Salience will not start memory processing.'],
    requiresCurrentStateCheck: false,
  },
  'tf-cbt:functioning': {
    phaseId: 'maintain',
    phaseTitle: 'Restore and maintain',
    keyPoints: ['Recovery goals can include ordinary routines, relationships, roles, and interests.', 'Choose changes that fit current energy and circumstances.', 'Small changes count; there is no required pace.'],
    repeatable: true,
    promptGroups: [['area', 'matters'], ['small-step', 'support']],
    stepTitles: ['Reconnect with ordinary life', 'Choose what matters', 'Choose a manageable step'],
    stepBodies: ['', 'Select an area because it matters to you, not because Salience ranks it. Describe why it has personal value.', 'Choose a step you can change, pause, or replace. Add support that would make it more manageable.'],
  },
  'tf-cbt:maintaining': {
    phaseId: 'maintain',
    phaseTitle: 'Restore and maintain',
    keyPoints: ['Review what you want to keep using.', 'Plan how to notice when more support may be useful.', 'Treatment endings and booster conversations are planned collaboratively.'],
    repeatable: true,
    promptGroups: [['keep', 'signs'], ['plan', 'booster']],
    stepTitles: ['Review and maintain', 'Keep what is useful', 'Plan future choice'],
    stepBodies: ['', 'Name tools or perspectives you want available and signs that may prompt a review. Signs are information, not relapse or failure labels.', 'Record what you would choose next and any questions about follow-up. Salience does not decide whether treatment should end or restart.'],
  },
  'cpt:overview': {
    phaseId: 'orient',
    phaseTitle: 'Learn the model',
    keyPoints: ['CPT explores how interpretations can affect feelings and actions.', 'You supply your own words and meanings.', 'Salience never decides that a belief is irrational or rewrites it for you.'],
  },
  'cpt:stuck-points': {
    phaseId: 'orient',
    phaseTitle: 'Learn the model',
    keyPoints: ['A possible stuck point is recorded in your own words.', 'Salience does not decide that a belief is wrong.', 'Keep separate entries so changes can be reviewed over time.'],
    repeatable: true,
    promptGroups: [['own-words', 'context']],
    stepTitles: ['Understand possible stuck points', 'Record my own words'],
    stepBodies: ['', 'Write the thought as you notice it and where it tends to appear. Salience will not classify, challenge, or rewrite it.'],
  },
  'cpt:abc': {
    phaseId: 'observe',
    phaseTitle: 'Observe thoughts and responses',
    keyPoints: ['Describe the event briefly; detailed trauma text is not required.', 'Record the interpretation as it occurred.', 'Consequences can include emotions, body responses, and actions.'],
    repeatable: true,
    promptGroups: [['activating'], ['belief'], ['consequence']],
    stepTitles: ['Understand ABC', 'A: Activating event', 'B: Belief or interpretation', 'C: Consequence'],
    stepBodies: ['', 'Use a brief description of a situation or reminder. Detailed trauma text is not needed.', 'Record the words or meaning that came to mind at the time, without correcting them.', 'Record emotions, body responses, actions, or urges you noticed. This step does not decide what caused them.'],
  },
  'cpt:thinking-patterns': {
    phaseId: 'observe',
    phaseTitle: 'Observe thoughts and responses',
    keyPoints: ['A pattern is a prompt for curiosity, not a verdict.', 'Context and uncertainty can matter.', 'Do not force a different conclusion.'],
    repeatable: true,
    promptGroups: [['noticed', 'context']],
    stepTitles: ['Use patterns as questions', 'Notice without a verdict'],
    stepBodies: ['', 'Name a pattern only if it fits your experience, then add context or exceptions you do not want overlooked.'],
  },
  'cpt:challenging-questions': {
    phaseId: 'examine',
    phaseTitle: 'Examine with curiosity',
    keyPoints: ['Choose only questions that fit.', 'Look for missing information and context.', 'The aim is a fuller view, not forced positivity.'],
    repeatable: true,
    promptGroups: [['belief', 'missing'], ['context', 'other-view']],
    stepTitles: ['Use curiosity, not correction', 'Notice information and uncertainty', 'Widen the context'],
    stepBodies: ['', 'Begin with your own wording. Look for information that is missing, uncertain, or based on a particular moment without forcing an answer.', 'Consider context and another caring viewpoint only if useful. Keeping the original view is allowed.'],
  },
  'cpt:evidence': {
    phaseId: 'examine',
    phaseTitle: 'Examine with curiosity',
    keyPoints: ['Record evidence on both sides in your own words.', 'A balanced statement may include uncertainty.', 'Salience does not score or rewrite the belief.'],
    repeatable: true,
    promptGroups: [['belief', 'supporting'], ['not-supporting', 'balanced']],
    stepTitles: ['Examine a belief', 'Record the belief and supporting evidence', 'Record other evidence and a possible balance'],
    stepBodies: ['', 'Write the belief in your words and evidence you think supports it. Avoid treating feelings alone as proof unless that is what you want to discuss.', 'Add evidence you think does not support it, then write a possible balanced statement only if one feels honest. Uncertainty can remain.'],
  },
  'cpt:themes': {
    phaseId: 'themes',
    phaseTitle: 'Review life areas',
    keyPoints: ['The five areas are organisers, not assumptions.', 'Only record an area relevant to you.', 'No belief is preloaded for you.'],
    repeatable: true,
    promptGroups: [['area', 'reflection']],
    stepTitles: ['Understand reflection areas', 'Choose an area'],
    stepBodies: ['', 'Choose only an area relevant to you and write your own reflection. The categories organise notes; they do not imply that an area is a problem.'],
  },
  'cpt:assignments': {
    phaseId: 'practice',
    phaseTitle: 'Practise and review',
    keyPoints: ['Choose a worksheet or reflection you want to practise.', 'You can also record a suggestion from a professional.', 'Incomplete work is not labelled failure.'],
    repeatable: true,
    requiresCurrentStateCheck: false,
    promptGroups: [['instructions', 'questions']],
    stepTitles: ['Choose practice', 'Record the plan'],
    stepBodies: ['', 'Choose a Salience worksheet or record guidance you received elsewhere. Keep questions or barriers with the plan so you can review them later.'],
  },
  'cpt:review': {
    phaseId: 'practice',
    phaseTitle: 'Practise and review',
    keyPoints: ['Review what felt useful, difficult, or unclear.', 'Progress can include daily-life changes as well as symptom measures.', 'Questions can be kept for your own review or an optional clinician report.'],
    repeatable: true,
    promptGroups: [['useful', 'difficult'], ['questions']],
    stepTitles: ['Review without grading', 'Notice what helped and what did not', 'Prepare the conversation'],
    stepBodies: ['', 'Record changes, difficulties, or confusion in neutral terms. Incomplete work is useful information, not non-compliance.', 'Choose questions about fit, pace, support, or next steps for your own review or a support conversation.'],
  },
  'cpt:impact-review': {
    phaseId: 'consolidate',
    phaseTitle: 'Consolidate and maintain',
    keyPoints: ['Use your own words and do not include a detailed trauma account.', 'Compare only reflections you choose to revisit.', 'Pause and ground or seek support whenever that would be more useful.'],
    repeatable: true,
    requiresCurrentStateCheck: true,
    promptGroups: [['earlier-view', 'current-view'], ['context', 'questions']],
    stepTitles: ['Choose whether to review', 'Compare chosen reflections', 'Keep context and questions'],
    stepBodies: ['', 'Revisit only an earlier view you choose. Compare it with your current wording without forcing change or entering a trauma narrative.', 'Record context, uncertainty, and any questions you want to keep for yourself or a support conversation.'],
  },
  'cpt:maintaining': {
    phaseId: 'consolidate',
    phaseTitle: 'Consolidate and maintain',
    keyPoints: ['Record tools or questions you want to carry forward.', 'Notice possible future stuck points without treating them as failure.', 'Plan follow-up or booster conversations with your clinician if useful.'],
    repeatable: true,
    promptGroups: [['tools', 'future-stuck-point'], ['response', 'follow-up']],
    stepTitles: ['Prepare to carry learning forward', 'Notice what to keep', 'Choose a future response'],
    stepBodies: ['', 'Collect tools or perspectives you want available and a pattern you may want to notice again. Recurrence is not labelled failure.', 'Write how you would like to respond and any follow-up questions. Salience does not decide that treatment is complete.'],
  },
  'pe:overview': {
    phaseId: 'orient',
    phaseTitle: 'Understand PE',
    keyPoints: ['PE examines how avoidance can keep everyday life narrowed.', 'Salience does not generate exposure targets.', 'The self-guided pathway is limited to ordinary situations you already judge safe.'],
  },
  'pe:consent-control': {
    phaseId: 'orient',
    phaseTitle: 'Understand PE',
    keyPoints: ['Choice and the ability to stop apply throughout every module.', 'A plan can include how to pause, modify, or remove practice.', 'High distress is information, not failure.'],
    promptGroups: [['stop', 'adjust'], ['support']],
    stepTitles: ['Understand choice and control', 'Choose how to pause or change', 'Plan support afterward'],
    stepBodies: ['', 'Write a clear personal rule for pausing, changing, or removing an activity before recording any practice plan.', 'Record how reorientation and support would work afterward.'],
  },
  'pe:avoidance-safe-reminders': {
    phaseId: 'prepare',
    phaseTitle: 'Check safety and choice',
    keyPoints: ['Use only ordinary situations you already consider safe.', 'The app does not suggest places or situations.', 'Legal, physical, and psychological safety take priority.'],
    promptGroups: [['questions']],
    stepTitles: ['Understand the distinction', 'Record my safety questions'],
    stepBodies: ['', 'Record uncertainty about safety without entering an activity here. Leave the activity alone or seek outside advice if you cannot confidently distinguish it from danger.'],
  },
  'pe:hierarchy': {
    phaseId: 'plan',
    phaseTitle: 'Plan ordinary-life steps',
    keyPoints: ['You supply every item; Salience never suggests one.', 'Items can be paused, made easier, or removed.', 'Never use this tool for dangerous, illegal, detention-related, court, police, or Corrections situations.'],
    repeatable: true,
    requiresCurrentStateCheck: true,
    promptGroups: [['item', 'safety'], ['choice', 'support']],
    stepTitles: ['Choose an ordinary-life step', 'Record the item and safety check', 'Record choice and support'],
    stepBodies: ['', 'Enter only an ordinary situation you already judge physically, legally, and psychologically safe. Salience cannot verify safety. Do not enter a prison, police, court, Corrections, confrontation, pursuit, or confinement activity.', 'Record options to make the item easier, pause, or remove it and the support or stopping plan.'],
  },
  'pe:practice-record': {
    phaseId: 'plan',
    phaseTitle: 'Plan ordinary-life steps',
    keyPoints: ['Record only an ordinary-life activity you chose earlier.', 'Before and after ratings describe a moment; they do not grade performance.', 'Stopping early can be recorded neutrally.'],
    repeatable: true,
    requiresCurrentStateCheck: true,
    promptGroups: [['item'], ['before', 'after'], ['stopped', 'notes']],
    stepTitles: ['Record chosen practice', 'Identify the chosen item', 'Record descriptive ratings', 'Record choice and questions'],
    stepBodies: ['', 'Name only an ordinary-life item you previously chose and judged safe. Do not use this record to create or intensify practice.', 'Record before and after distress if useful. A higher, lower, or unchanged number is not a grade.', 'Record any pause, stop, or modification and what you want to change. Stopping is not failure.'],
  },
  'pe:homework': {
    phaseId: 'plan',
    phaseTitle: 'Plan ordinary-life steps',
    keyPoints: ['The app does not add or intensify practice.', 'Record what you chose to do and what you want to change.', 'There is no streak or completion pressure.'],
    repeatable: true,
    promptGroups: [['instructions'], ['completed', 'review']],
    stepTitles: ['Review my practice plan', 'Record the plan', 'Record what happened'],
    stepBodies: ['', 'Record only the ordinary-life practice you chose. Salience does not add frequency, duration, or difficulty.', 'Record what you chose to do and what needs changing, including pauses or stops.'],
  },
  'pe:imaginal': {
    phaseId: 'processing',
    phaseTitle: 'Understand the treatment boundary',
    keyPoints: ['Salience does not generate a script or ask you to recall trauma.', 'No recordings, repetition schedule, or timer are provided.', 'This is an information page, not an imaginal exposure exercise.'],
    requiresCurrentStateCheck: false,
  },
  'pe:session-review': {
    phaseId: 'review',
    phaseTitle: 'Review and discuss',
    keyPoints: ['Review observations without treating distress change as a pass or fail.', 'Record questions and desired adjustments.', 'Use the program Progress area for longer-term review.'],
    repeatable: true,
    promptGroups: [['observations', 'questions']],
    stepTitles: ['Review without pass or fail', 'Record observations and questions'],
    stepBodies: ['', 'Use brief factual observations and questions about pace, fit, choice, or support. Distress change is not interpreted.'],
  },
  'pe:future-plan': {
    phaseId: 'maintain',
    phaseTitle: 'Maintain choice and support',
    keyPoints: ['Record only plans you choose.', 'Future practice can be changed, paused, or stopped.', 'Plan how to respond to significant dates or renewed avoidance without grading yourself.'],
    repeatable: true,
    requiresCurrentStateCheck: false,
    promptGroups: [['learning', 'signs'], ['instructions', 'support']],
    stepTitles: ['Plan future support', 'Record learning and review signs', 'Record my plan'],
    stepBodies: ['', 'Record learning you want available and signs that may prompt a review. Do not use signs as a failure label.', 'Store only future ordinary-life practice, coping, follow-up, or support choices you make. Salience does not generate them.'],
  },
  'emdr:overview': {
    phaseId: 'orient',
    phaseTitle: 'Understand EMDR',
    keyPoints: ['EMDR is a phased trauma treatment.', 'Preparation and active reprocessing are different.', 'Salience provides a self-guided preparation and recovery pathway, not active EMDR.'],
  },
  'emdr:phases-choice': {
    phaseId: 'orient',
    phaseTitle: 'Understand EMDR',
    keyPoints: ['The treatment phases and ongoing consent are important to understand.', 'Preparation can be revisited.', 'Questions and preferences can be recorded without choosing a target.'],
    promptGroups: [['questions', 'preferences']],
    stepTitles: ['Understand phases and choice', 'Prepare questions and preferences'],
    stepBodies: ['', 'Record what you want explained and any preferences about pace, stopping, communication, or support. Do not select a target here.'],
  },
  'emdr:grounding-resources': {
    phaseId: 'prepare',
    phaseTitle: 'Prepare and orient',
    keyPoints: ['Resources should be chosen rather than imposed.', 'A calm or secure image is optional and is not helpful for everyone.', 'Stop if an exercise increases discomfort.'],
    repeatable: true,
    promptGroups: [['resources', 'image']],
    stepTitles: ['Choose preparation resources', 'Record what I choose'],
    stepBodies: ['', 'Record present-orientation resources you choose. A calm or secure image is optional; leave it blank if imagery is not helpful.'],
  },
  'emdr:stop-signals': {
    phaseId: 'prepare',
    phaseTitle: 'Prepare and orient',
    keyPoints: ['Choose a clear personal pause or stop signal.', 'Plan how to reorient before leaving any difficult activity or appointment.', 'Record what support is available afterward.'],
    promptGroups: [['signal', 'reorient'], ['support']],
    stepTitles: ['Plan stopping and reorientation', 'Record the signal and reorientation', 'Record support afterward'],
    stepBodies: ['', 'Record the pause or stop signal you choose and how you want to reorient before deciding what happens next.', 'Record practical or personal support available afterward.'],
  },
  'emdr:topics': {
    phaseId: 'collaborate',
    phaseTitle: 'Prepare topics and preferences',
    keyPoints: ['Brief topic labels are enough.', 'You do not need to enter detailed trauma text.', 'The app does not assess or select targets.'],
    repeatable: true,
    promptGroups: [['topics']],
    stepTitles: ['Prepare topics, not targets', 'Record brief questions'],
    stepBodies: ['', 'Use short labels or questions only. Salience does not assess readiness, choose a target, or ask you to activate a memory.'],
  },
  'emdr:targets': {
    phaseId: 'collaborate',
    phaseTitle: 'Prepare topics and preferences',
    keyPoints: ['Record only a brief topic description you choose.', 'No memory activation is requested.', 'Salience does not turn a topic into an EMDR target.'],
    repeatable: true,
    promptGroups: [['description', 'instructions']],
    stepTitles: ['Record an optional topic description', 'Keep the record brief'],
    stepBodies: ['', 'Enter a short topic label and any preparation notes you choose. Do not activate or process the memory here.'],
  },
  'emdr:reprocessing': {
    phaseId: 'processing',
    phaseTitle: 'Understand active reprocessing',
    keyPoints: ['This page contains no eye movement, light, tone, tapping, or vibration tool.', 'It does not ask you to activate a traumatic memory.', 'This is an information page, not an EMDR simulator.'],
    requiresCurrentStateCheck: false,
  },
  'emdr:appointments': {
    phaseId: 'review',
    phaseTitle: 'Review and recover',
    keyPoints: ['Keep observations brief and factual if that feels safer.', 'Record self-chosen or professionally supplied coping instructions.', 'The shared Appointments area can organise future sessions.'],
    repeatable: true,
    promptGroups: [['appointment'], ['observations', 'coping']],
    stepTitles: ['Organise an appointment record', 'Record the date', 'Record factual observations and instructions'],
    stepBodies: ['', 'Choose the appointment date you want this record linked to.', 'Record brief present-day observations and any coping instructions you want available. Salience does not interpret either.'],
  },
  'emdr:after-session-plan': {
    phaseId: 'review',
    phaseTitle: 'Review and recover',
    keyPoints: ['Plan ordinary supports after a session or difficult day.', 'Include what to do if you feel unsettled later.', 'Use only coping steps you choose or have been given by a professional.'],
    repeatable: true,
    requiresCurrentStateCheck: false,
    promptGroups: [['instructions', 'supports'], ['contact']],
    stepTitles: ['Prepare after-session support', 'Record instructions and practical support', 'Record contact choices'],
    stepBodies: ['', 'Store coping instructions and practical supports you choose.', 'Record when and how you would choose to contact a trusted person or professional.'],
  },
  'emdr:closure-review': {
    phaseId: 'review',
    phaseTitle: 'Review and recover',
    keyPoints: ['Closure and later re-evaluation are parts of formal EMDR.', 'Record present-day observations without deciding what they mean.', 'Unexpected or difficult effects can be included in an optional clinician report.'],
    repeatable: true,
    promptGroups: [['present', 'support'], ['unexpected', 'questions']],
    stepTitles: ['Prepare closure and review', 'Orient to the present', 'Record what needs discussion'],
    stepBodies: ['', 'Record factual present-day observations and what helps orientation. Do not decide what the observations mean.', 'Record anything unexpected and questions you want to keep for yourself or professional review.'],
  },
  'emdr:future-plan': {
    phaseId: 'maintain',
    phaseTitle: 'Maintain support',
    keyPoints: ['Record only follow-up plans you choose.', 'Preparation resources can be revisited without activating a memory.', 'Formal EMDR treatment decisions are outside the app.'],
    repeatable: true,
    requiresCurrentStateCheck: false,
    promptGroups: [['resources', 'instructions'], ['signs', 'follow-up']],
    stepTitles: ['Maintain preparation and support', 'Keep chosen resources and instructions', 'Plan future contact'],
    stepBodies: ['', 'Record preparation resources and coping instructions you want available.', 'Record what would prompt you to seek more support and any planned review. Salience does not decide whether reprocessing begins or resumes.'],
  },
  'tf-cbt:orientation-card': {
    phaseId: 'stabilise',
    phaseTitle: 'Build present-day skills',
    keyPoints: ['Use facts and choices that are true for you now.', 'A card can be short enough to use when energy is low.', 'Leave out any wording that feels unhelpful or too certain.'],
    estimatedMinutes: 6,
    repeatable: true,
    requiresCurrentStateCheck: false,
    promptGroups: [['facts', 'actions'], ['statement', 'preferences']],
    stepTitles: ['Make a present-orientation card', 'Choose facts and actions', 'Choose wording and boundaries'],
    stepBodies: ['', 'Record present-day facts and optional actions you choose. This is a personal aid, not a reality test or clinical assessment.', 'Write only what you find grounding. You can say what you do not want shown or asked when you are overwhelmed.'],
  },
  'tf-cbt:morning-after-nightmare': {
    phaseId: 'stabilise',
    phaseTitle: 'Build present-day skills',
    keyPoints: ['Orient first; logging can wait.', 'A disrupted night does not require a perfect recovery plan.', 'Choose one small option or choose to do nothing for now.'],
    estimatedMinutes: 6,
    repeatable: true,
    requiresCurrentStateCheck: false,
    promptGroups: [['first', 'actions'], ['day', 'notice']],
    stepTitles: ['Plan for a difficult morning', 'Choose the first small step', 'Plan the rest of the day'],
    stepBodies: ['', 'Choose optional actions for waking after a nightmare. No timer, order, or forced breathing exercise is required.', 'Record how you might make the day gentler and what, if anything, you may want to log later.'],
  },
  'tf-cbt:daily-rhythm': {
    phaseId: 'maintain',
    phaseTitle: 'Restore and maintain',
    keyPoints: ['Ordinary routines can be chosen for personal meaning, not compliance.', 'A backup step keeps the plan usable on low-energy days.', 'Plans can be paused or replaced without being marked as failure.'],
    estimatedMinutes: 7,
    repeatable: true,
    requiresCurrentStateCheck: false,
    promptGroups: [['area', 'why'], ['step', 'backup'], ['support']],
    stepTitles: ['Choose an area of daily life', 'Name a manageable step', 'Make a backup plan', 'Choose support'],
    stepBodies: ['', 'Choose one area because it matters to you. There is no required category or order.', 'Write a step and a smaller backup for a day when energy, sleep, or anxiety is different.', 'Record support that would make the routine more possible, or leave this blank.'],
  },
  'cpt:worksheet-choice': {
    phaseId: 'practice',
    phaseTitle: 'Practise and review',
    keyPoints: ['You choose which worksheet, if any, is useful today.', 'Choosing a worksheet is not an assignment or readiness decision.', 'You can select more than one option and return later.'],
    estimatedMinutes: 5,
    repeatable: true,
    requiresCurrentStateCheck: false,
    promptGroups: [['worksheets', 'pace'], ['reason', 'support']],
    stepTitles: ['Choose a worksheet', 'Choose a pace', 'Keep the plan manageable'],
    stepBodies: ['', 'Select only the worksheets you may want to revisit. You do not need to open one now.', 'Record what would make the choice easier, including a question or support you want to keep nearby.'],
  },
  'cpt:practice-log': {
    phaseId: 'practice',
    phaseTitle: 'Practise and review',
    keyPoints: ['Use a brief record if that is all you have energy for.', 'A worksheet can be useful even when it leaves questions.', 'The app does not score or interpret the record.'],
    estimatedMinutes: 6,
    repeatable: true,
    requiresCurrentStateCheck: false,
    promptGroups: [['date', 'worksheet'], ['recorded', 'noticed'], ['next']],
    stepTitles: ['Record a worksheet review', 'Name the record', 'Notice what it gave me', 'Choose what happens next'],
    stepBodies: ['', 'Add a date and choose the type of record. Detailed trauma text is not required.', 'Write what you noticed, including uncertainty or no clear change.', 'Choose whether to keep it, ask a question, revisit later, or leave it here.'],
  },
  'cpt:conversation-plan': {
    phaseId: 'consolidate',
    phaseTitle: 'Consolidate and maintain',
    keyPoints: ['You decide what belongs in a conversation or report.', 'Questions can be specific without requiring a conclusion.', 'You can record boundaries about what you do not want to discuss yet.'],
    estimatedMinutes: 6,
    repeatable: true,
    requiresCurrentStateCheck: false,
    promptGroups: [['questions', 'include'], ['support', 'boundaries']],
    stepTitles: ['Prepare a conversation', 'Choose what to bring', 'Choose support and boundaries'],
    stepBodies: ['', 'Write questions or observations you may want to discuss about the cognitive pathway.', 'Record what support or boundaries would help the conversation feel manageable.'],
  },
  'pe:avoidance-map': {
    phaseId: 'prepare',
    phaseTitle: 'Check safety and choice',
    keyPoints: ['Avoidance can make sense as an attempt to manage discomfort or danger.', 'You can notice a pattern without approaching it.', 'The app does not choose an activity or decide whether a situation is safe.'],
    estimatedMinutes: 7,
    repeatable: true,
    requiresCurrentStateCheck: false,
    promptGroups: [['pattern', 'short-term'], ['long-term', 'choice'], ['support']],
    stepTitles: ['Notice a pattern', 'Name what it helps with', 'Choose without pressure', 'Keep support nearby'],
    stepBodies: ['', 'Describe a pattern you have already noticed without naming a practice target.', 'Record what the pattern may help you manage in the short term and what it changes in daily life, using your own words.', 'Choose to leave it, make a non-exposure adjustment, ask for support, or discuss it with a professional.'],
  },
  'pe:recovery-plan': {
    phaseId: 'review',
    phaseTitle: 'Review and discuss',
    keyPoints: ['Recovery after an activity is part of staying in control.', 'Use only actions you choose or have already agreed with a professional.', 'Stopping, changing, or removing an activity can be recorded neutrally.'],
    estimatedMinutes: 6,
    repeatable: true,
    requiresCurrentStateCheck: false,
    promptGroups: [['activity', 'actions'], ['observations', 'future'], ['questions']],
    stepTitles: ['Plan recovery after an activity', 'Choose reorientation actions', 'Review and choose next steps', 'Keep questions'],
    stepBodies: ['', 'Name only an ordinary-life activity already chosen elsewhere. Do not create or intensify practice here.', 'Record factual observations and whether you want to repeat, reduce, pause, remove, or discuss the activity.', 'Keep questions for yourself or a professional without treating the record as a grade.'],
  },
  'pe:conversation-plan': {
    phaseId: 'review',
    phaseTitle: 'Review and discuss',
    keyPoints: ['A professional can help review fit, safety, pace, and support.', 'You can bring questions without bringing a detailed trauma narrative.', 'The app does not decide whether PE is suitable.'],
    estimatedMinutes: 5,
    repeatable: true,
    requiresCurrentStateCheck: false,
    promptGroups: [['questions', 'boundaries'], ['support']],
    stepTitles: ['Prepare a PE conversation', 'Record questions and boundaries', 'Choose support for the conversation'],
    stepBodies: ['', 'Record questions about ordinary-life practice, imaginal work, safety, pacing, or stopping. The app will not answer them for you.', 'Record what would help you feel heard and able to pause the conversation.'],
  },
  'emdr:resource-menu': {
    phaseId: 'prepare',
    phaseTitle: 'Prepare and orient',
    keyPoints: ['Resources are optional and should feel like choices.', 'A calm or secure image is not required.', 'Stop using a resource if it makes the present feel less clear.'],
    estimatedMinutes: 6,
    repeatable: true,
    requiresCurrentStateCheck: false,
    promptGroups: [['resources', 'image'], ['instructions', 'avoid']],
    stepTitles: ['Build a resource menu', 'Choose present-day resources', 'Keep instructions and boundaries'],
    stepBodies: ['', 'Choose resources that help you orient or settle without activating a traumatic memory.', 'Record instructions you choose or have received, and anything you prefer not to use. Salience does not create an EMDR resource exercise.'],
  },
  'emdr:communication-plan': {
    phaseId: 'collaborate',
    phaseTitle: 'Prepare topics and preferences',
    keyPoints: ['Clear communication supports choice and consent.', 'You can ask for an explanation before deciding what to do.', 'A pause or stop request does not need to be justified.'],
    estimatedMinutes: 6,
    repeatable: true,
    requiresCurrentStateCheck: false,
    promptGroups: [['pace', 'questions'], ['needs', 'boundaries']],
    stepTitles: ['Plan communication preferences', 'Choose how to ask and pause', 'Record needs and boundaries'],
    stepBodies: ['', 'Record what you want explained about pace, preparation, or the distinction between preparation and reprocessing.', 'Write access needs, communication preferences, or topics you do not want to discuss yet.'],
  },
  'emdr:between-session-log': {
    phaseId: 'review',
    phaseTitle: 'Review and recover',
    keyPoints: ['Keep observations factual and brief if that feels safer.', 'Sleep, nightmares, mood, and daily life can be recorded without deciding why they changed.', 'Use support instructions already chosen or supplied by a professional.'],
    estimatedMinutes: 6,
    repeatable: true,
    requiresCurrentStateCheck: false,
    promptGroups: [['date', 'observations'], ['sleep', 'support'], ['questions']],
    stepTitles: ['Record between-session observations', 'Add the date and observations', 'Notice sleep and support', 'Keep questions'],
    stepBodies: ['', 'Record a date and brief present-day observations. Do not add a detailed trauma account.', 'Note sleep or nightmares only if you choose, and record support that helped or that you want available.', 'Keep questions for a future appointment or personal review. Salience does not interpret the record.'],
  },
  'cpt:course-intake': {
    phaseId: 'orient',
    phaseTitle: 'Start and understand',
    keyPoints: ['These questions guide a starting focus; they are not a diagnostic assessment.', 'You can change the focus later or choose a different module.', 'Salience does not decide whether CPT is suitable or whether you are ready for a clinical procedure.'],
    estimatedMinutes: 8,
    repeatable: false,
    requiresCurrentStateCheck: false,
    promptGroups: [['reason', 'entry-point'], ['detail', 'support'], ['questions']],
    stepTitles: ['Choose a CPT starting focus', 'Name what brings me here', 'Choose detail and support', 'Keep questions'],
    stepBodies: ['', 'Choose the reason and starting point that fit you best. There is no right answer and no need to describe the traumatic event.', 'Choose how much written detail and support feels manageable. You can pause, skip, or change this later.', 'Keep questions for yourself or a professional. Salience does not interpret these answers.'],
  },
  'cpt:course-map': {
    phaseId: 'orient',
    phaseTitle: 'Start and understand',
    keyPoints: ['The pathway moves from learning, to noticing, to examining, to life themes, practice, and consolidation.', 'You can pause, repeat, skip, or return to any stage.', 'A Salience completion record is not formal CPT completion or a clinical outcome.'],
    estimatedMinutes: 7,
    repeatable: false,
    requiresCurrentStateCheck: false,
    promptGroups: [['pace', 'focus'], ['support', 'questions']],
    stepTitles: ['See the whole CPT pathway', 'Choose a pace and focus', 'Prepare support and questions'],
    stepBodies: ['', 'Review the six stages and choose what feels manageable. Salience does not decide when you are ready to move forward.', 'Record support or questions you want nearby. You can change this map later.'],
  },
  'cpt:stuck-point-log': {
    phaseId: 'observe',
    phaseTitle: 'Notice and map patterns',
    keyPoints: ['Keep the possible stuck point in your own words.', 'A category is an organiser, not a judgement about the thought.', 'The log can include uncertainty and does not require a conclusion.'],
    estimatedMinutes: 7,
    repeatable: true,
    requiresCurrentStateCheck: false,
    promptGroups: [['statement', 'area'], ['context', 'effect'], ['question']],
    stepTitles: ['Add a possible stuck point', 'Name the thought and area', 'Notice context and effect', 'Keep a question'],
    stepBodies: ['', 'Write the thought or meaning as you notice it. Choose an area only if it helps organise the record.', 'Record when it appears and what you notice in emotions, body, or actions without deciding what caused them.', 'Keep a question or uncertainty rather than forcing an answer.'],
  },
  'cpt:challenging-beliefs': {
    phaseId: 'examine',
    phaseTitle: 'Examine thoughts with curiosity',
    keyPoints: ['Consider information supporting and not supporting a belief in your own words.', 'A balanced statement is optional and can include uncertainty.', 'Salience does not decide that a belief is irrational, false, or caused by psychosis.'],
    estimatedMinutes: 10,
    repeatable: true,
    requiresCurrentStateCheck: false,
    promptGroups: [['belief'], ['supporting', 'not-supporting'], ['context', 'balanced'], ['honest', 'questions']],
    stepTitles: ['Use the challenging-beliefs worksheet', 'Name the belief', 'Consider evidence and context', 'Write only what feels honest'],
    stepBodies: ['', 'Start with your own wording. Detailed trauma description is not required.', 'Record information on both sides and context you want to keep in view. Feelings, uncertainty, and missing information can remain part of the record.', 'A balanced statement is optional. Keep the original wording, uncertainty, or questions if that is more honest.'],
  },
  'cpt:theme-review': {
    phaseId: 'themes',
    phaseTitle: 'Review the five life areas',
    keyPoints: ['Safety, trust, power and control, esteem, and intimacy are broad organisers.', 'Choose only areas that fit your experience.', 'The app does not preload beliefs or decide that an area is a problem.'],
    estimatedMinutes: 9,
    repeatable: true,
    requiresCurrentStateCheck: false,
    promptGroups: [['areas'], ['reflection', 'current'], ['choice', 'support']],
    stepTitles: ['Review the five areas', 'Choose areas to consider', 'Record reflection and present context', 'Choose what helps next'],
    stepBodies: ['', 'Choose one or more areas that you want to organise. You can leave all of them unselected and return later.', 'Use your own words and stay with present-day context. A detailed trauma account is not required.', 'Record a choice, support, or question without treating it as a treatment verdict.'],
  },
}

const item = (
  program: TreatmentProgramId,
  id: string,
  title: string,
  body: string,
  contentType: TreatmentContentType,
  prompts: TreatmentPrompt[] = [],
  clinicianGuidanceRequired = false,
  source?: ClinicalSource,
  designOverrides: Partial<ModuleDesign> = {},
): TreatmentContentItem => {
  const design = { ...moduleDesign[`${program}:${id}`], ...designOverrides }
  const resolvedSource = source ?? defaultProgramSources[program]
  const promptGroups = design?.promptGroups
    ?? Array.from({ length: Math.max(1, Math.ceil(prompts.length / 2)) }, (_, index) =>
      prompts.slice(index * 2, index * 2 + 2).map((prompt) => prompt.id))

  return {
  id,
  program,
  title,
  body,
  contentType,
  prompts: prompts.map((prompt) => ({
    ...prompt,
    inputType: prompt.inputType ?? (prompt.multiline ? 'textarea' : 'text'),
  })),
  phaseId: design?.phaseId ?? 'core',
  phaseTitle: design?.phaseTitle ?? 'Core',
  keyPoints: design?.keyPoints ?? [],
  steps: [
    {
      id: 'understand',
      title: design?.stepTitles?.[0] ?? 'Understand',
      body,
      promptIds: [],
    },
    ...promptGroups.map((promptIds, index) => ({
      id: `reflect-${index + 1}`,
      title: design?.stepTitles?.[index + 1]
        ?? (clinicianGuidanceRequired ? 'Keep the boundary clear' : 'Reflect at your pace'),
      body: design?.stepBodies?.[index + 1]
        ?? (prompts.length
        ? clinicianGuidanceRequired
          ? 'This page is information only. It does not ask you to carry out the procedure described.'
          : 'Use any prompts that feel useful. Skip, save a draft, or leave whenever you choose.'
        : clinicianGuidanceRequired
          ? 'Salience does not provide this procedure. No written response or action is required.'
          : 'Pause to consider what, if anything, you want to remember or ask about. No written response is required.'),
      promptIds,
    })),
  ],
  estimatedMinutes: design?.estimatedMinutes ?? (prompts.length ? 8 : 4),
  repeatable: design?.repeatable ?? false,
  requiresCurrentStateCheck: design?.requiresCurrentStateCheck
    ?? clinicianGuidanceRequired,
  professionalRole: design?.professionalRole
    ?? (clinicianGuidanceRequired
      ? 'The full procedure described here is outside the Salience self-guided pathway.'
      : 'This module is designed for independent use; professional support remains optional.'),
  clinicianGuidanceRequired,
  deliveryMode: clinicianGuidanceRequired ? 'information-only' : 'self-guided',
  structuredTreatment: design?.structuredTreatment ?? false,
  ...resolvedSource,
  }
}

interface StructuredTreatmentPhases {
  start: { phaseId: string; phaseTitle: string }
  warning: { phaseId: string; phaseTitle: string }
  support: { phaseId: string; phaseTitle: string }
  topics: { phaseId: string; phaseTitle: string }
  prescriber: { phaseId: string; phaseTitle: string }
  review: { phaseId: string; phaseTitle: string }
}

const buildStructuredTreatmentModules = (
  program: TreatmentProgramId,
  source: ClinicalSource,
  phases: StructuredTreatmentPhases,
) => {
  const make = (
    id: string,
    title: string,
    body: string,
    phase: { phaseId: string; phaseTitle: string },
    keyPoints: string[],
    prompts: TreatmentPrompt[],
    promptGroups: string[][],
    stepTitles: string[],
    stepBodies: string[],
  ) => item(program, id, title, body, 'worksheet', prompts, false, source, {
    ...phase,
    keyPoints,
    promptGroups,
    stepTitles,
    stepBodies,
    estimatedMinutes: 8,
    repeatable: true,
    requiresCurrentStateCheck: false,
    professionalRole: 'This worksheet can be completed independently. A psychiatrist, psychologist, or other qualified professional can review it if you choose.',
    structuredTreatment: true,
  })

  return [
    make(
      'treatment-start',
      'Treatment goals and starting point',
      'Set a starting point for this pathway in your own words. This is a structured treatment-companion worksheet, not a diagnosis or a decision about which treatment is right for you.',
      phases.start,
      ['Choose priorities in your own words.', 'A baseline is a starting description, not a diagnosis or score.', 'You can revise this record as circumstances change.'],
      [
        { id: 'priority', label: 'What do I most want help with right now?', multiline: true },
        { id: 'impact', label: 'How is this affecting my sleep, nightmares, mood, anxiety, safety, relationships, or daily life?', multiline: true },
        { id: 'strengths', label: 'What strengths, people, routines, or supports are already helping?', multiline: true },
        { id: 'change', label: 'What would I like to notice changing over the next few weeks?', multiline: true },
      ],
      [['priority', 'impact'], ['strengths', 'change']],
      ['Set a starting point', 'Name what matters', 'Notice a direction'],
      ['', 'Write what you would most like help with right now. Mention only the areas you choose, such as sleep, nightmares, mood, anxiety, warning signs, relationships, or daily functioning.', 'Record what is already helping and what change you would like to notice. Nothing here predicts your future.'],
    ),
    make(
      'early-warning',
      'Early warning signs and support plan',
      'Build a personal map of changes you notice in yourself so you can choose support sooner. This is not a relapse score, diagnosis, or prediction.',
      phases.warning,
      ['Use signs you have personally noticed.', 'A sign is information, not a label.', 'Record an action you choose, including contacting support.'],
      [
        { id: 'sleep', label: 'Changes in sleep I want to notice early', multiline: true },
        { id: 'mood-anxiety', label: 'Changes in mood, anxiety, energy, or irritability I want to notice', multiline: true },
        { id: 'reality', label: 'Changes in my sense of safety, certainty, or what feels real that I want to discuss', multiline: true },
        { id: 'action', label: 'What I choose to do or who I choose to contact if I notice these changes', multiline: true },
      ],
      [['sleep', 'mood-anxiety'], ['reality', 'action']],
      ['Notice early changes', 'Name my signs', 'Choose a response'],
      ['', 'Use your own words for changes you have noticed. You do not need to include every possible sign.', 'Choose a first response that is practical and within your control. A response can be pausing, grounding, asking for help, or arranging an appointment.'],
    ),
    make(
      'support-plan',
      'Personal safety and support plan',
      'Make a written plan for times you feel overwhelmed, unsafe, or less able to stay oriented. You decide what to include, and the plan can be changed at any time.',
      phases.support,
      ['Keep the plan practical for low-energy moments.', 'Support can include people, services, and simple present-orientation actions.', 'This worksheet is not an emergency service.'],
      [
        { id: 'signs', label: 'Signs that tell me I may need more support', multiline: true },
        { id: 'actions', label: 'Grounding or practical actions I can try now', multiline: true },
        { id: 'contacts', label: 'People, clinicians, or crisis services I choose to contact', multiline: true },
        { id: 'help', label: 'What I want a support person to know about helping me', multiline: true },
      ],
      [['signs', 'actions'], ['contacts', 'help']],
      ['Build a support plan', 'Choose immediate actions', 'Choose people and services'],
      ['', 'Record signs and actions that fit your circumstances. You can leave out anything you do not want stored.', 'Write how you would like support to work. Include preferences about contact, privacy, or what helps you return to the present.'],
    ),
    make(
      'processing-topics',
      'Treatment topics and processing plan',
      'Select topics you may want this pathway or a qualified professional to address. Selecting a topic does not interpret it, start a processing exercise, or ask you to recreate what happened.',
      phases.topics,
      ['Choose only topics you want stored.', 'No detailed trauma narrative is requested here.', 'Salience does not generate a trauma simulation, exposure script, or EMDR reprocessing exercise.'],
      [
        {
          id: 'themes',
          label: 'Topics I may want treatment to address',
          inputType: 'multiselect',
          options: [
            { value: 'detained-while-unwell', label: 'Being jailed or detained while unwell' },
            { value: 'back-in-prison', label: 'Being back in prison' },
            { value: 'prison-transfer', label: 'Being transferred or in an unfamiliar prison' },
            { value: 'attacked', label: 'Being attacked' },
            { value: 'knocked-unconscious', label: 'Being knocked unconscious' },
            { value: 'chased-hunted', label: 'Being chased or hunted after escaping' },
            { value: 'lost-home', label: 'Being lost or unable to get home' },
            { value: 'belongings', label: 'Being unable to gather belongings' },
            { value: 'transport-home', label: 'Being unable to find transport home' },
            { value: 'missed-transport', label: 'Missing a plane or train home' },
            { value: 'other', label: 'Another topic I choose' },
          ],
        },
        { id: 'understanding', label: 'What would I like a professional to understand about these topics? (optional; no detailed narrative needed)', multiline: true },
        { id: 'present', label: 'What helps me feel present and able to stop when these topics are discussed?', multiline: true },
        { id: 'clinician-plan', label: 'Pacing or processing instructions already agreed with a qualified professional (optional)', multiline: true, helper: 'Record existing instructions only. Salience does not generate them.' },
        { id: 'questions', label: 'Questions about how a qualified professional might approach these topics', multiline: true },
      ],
      [['themes'], ['understanding', 'present'], ['clinician-plan'], ['questions']],
      ['Choose treatment topics', 'Prepare for safe discussion', 'Record agreed instructions', 'Record questions'],
      ['', 'Select only topics you want to keep. You can leave this blank and return later.', 'Record what helps you stay in the present and keep control. Do not write a detailed account of the event.', 'Record existing instructions only. Salience does not create a processing plan.', 'Keep questions about pacing, consent, stopping, and support for a qualified professional.'],
    ),
    make(
      'prescriber-review',
      'Medication and prescriber review',
      'Prepare for a psychiatrist, prescriber, or other qualified professional. Record instructions and observations in their words where possible. Salience never tells you to start, stop, skip, or change medication.',
      phases.prescriber,
      ['Record professional instructions rather than creating new ones.', 'Possible benefits and unwanted effects are topics to discuss, not conclusions.', 'Bring urgent or worrying concerns to an appropriate professional.'],
      [
        { id: 'plan', label: 'Medication plan or instructions I was given (optional)', multiline: true },
        { id: 'changes', label: 'What I have noticed since a medication or treatment change (optional)', multiline: true },
        { id: 'effects', label: 'Possible benefits or unwanted effects I want to discuss (optional)', multiline: true },
        { id: 'questions', label: 'Questions I want to ask my psychiatrist or prescriber', multiline: true },
      ],
      [['plan', 'changes'], ['effects', 'questions']],
      ['Prepare for a prescriber review', 'Record instructions and observations', 'Write questions'],
      ['', 'Use the prescriber’s instructions where you have them. Do not use this worksheet to make medication changes yourself.', 'Keep questions and observations together so you can decide what to raise at an appointment.'],
    ),
    make(
      'treatment-review',
      'Treatment review and next steps',
      'Review what you have completed and choose what to carry forward. This is a user-authored review, not a clinical outcome or a discharge decision.',
      phases.review,
      ['Useful learning can be kept without calling it success.', 'Difficult or unhelpful material is worth recording.', 'Next steps remain your choice and can include professional support.'],
      [
        { id: 'helpful', label: 'What has felt useful or worth keeping?', multiline: true },
        { id: 'difficult', label: 'What was difficult, confusing, or unhelpful?', multiline: true },
        { id: 'patterns', label: 'What patterns or questions do I want to bring to a clinician or support person?', multiline: true },
        { id: 'next', label: 'What would I choose next: repeat a module, use a coping tool, make an appointment, or pause?', multiline: true },
      ],
      [['helpful', 'difficult'], ['patterns', 'next']],
      ['Review the pathway', 'Keep and question', 'Choose what happens next'],
      ['', 'Record what you want to keep and what you want to question. You do not need to describe a treatment result.', 'Choose a next step that fits your current circumstances. Pausing or asking for help are valid choices.'],
    ),
  ]
}

const addStructuredTreatmentModules = (
  baseModules: TreatmentContentItem[],
  structuredModules: TreatmentContentItem[],
  phaseOrder: string[],
) => {
  const structuredIdsAtEnd = new Set(['treatment-review'])
  const ordered = phaseOrder.flatMap((phaseId) => {
    const phaseStructured = structuredModules.filter((module) => module.phaseId === phaseId)
    return [
      ...phaseStructured.filter((module) => !structuredIdsAtEnd.has(module.id)),
      ...baseModules.filter((module) => module.phaseId === phaseId),
      ...phaseStructured.filter((module) => structuredIdsAtEnd.has(module.id)),
    ]
  })
  const knownPhases = new Set(phaseOrder)
  return [
    ...ordered,
    ...baseModules.filter((module) => !knownPhases.has(module.phaseId)),
  ]
}

const tfCbtBaseModules: TreatmentContentItem[] = [
  item('tf-cbt', 'responses', 'Common responses after trauma', 'Learn about recurring memories, heightened alertness, avoidance, changes in mood, and sleep disruption. Distress can relate to experiences during psychosis, detention, or treatment, but Salience does not diagnose or interpret your experience.', 'education', [], false, nicePsychosis),
  item('tf-cbt', 'priorities', 'My priorities and hopes', 'Begin with the parts of daily life you most want support with. These are personal priorities, not clinical targets selected by Salience.', 'worksheet', [
    { id: 'hopes', label: 'What would you most like to be different in daily life?', multiline: true },
    { id: 'small-change', label: 'What small change would matter over the next few weeks?', multiline: true },
    { id: 'support', label: 'What support would make this feel more manageable?', multiline: true },
  ]),
  item('tf-cbt', 'triggers', 'Triggers and reminders', 'Notice situations, sensations, thoughts, or reminders that you have identified. Salience does not infer triggers for you.', 'worksheet', [
    { id: 'situation', label: 'What did you notice?', multiline: true },
    { id: 'response', label: 'What happened in your thoughts, emotions, body, or actions?', multiline: true },
    { id: 'helped', label: 'What helped you return to the present?', multiline: true },
  ]),
  item('tf-cbt', 'avoidance', 'Recognising avoidance patterns', 'Record things you have noticed yourself putting off, their effect on daily life, and what you choose next.', 'worksheet', [
    { id: 'noticed', label: 'What have you noticed avoiding?', multiline: true },
    { id: 'cost', label: 'How does this affect your day?', multiline: true },
    { id: 'choice', label: 'What do I choose next: leave it, make an ordinary-life change, or seek support?', multiline: true },
  ]),
  item('tf-cbt', 'then-now', 'Distinguishing then from now', 'Use factual present-day details to orient yourself. This is a grounding exercise, not trauma-memory processing.', 'coping', [
    { id: 'then', label: 'What tells you this feels connected to the past?', multiline: true },
    { id: 'now', label: 'What facts tell you where and when you are now?', multiline: true },
  ]),
  item('tf-cbt', 'map', 'Situation, thought, emotion, body, action map', 'Lay out parts of an experience in your own words without judging or automatically rewriting them.', 'worksheet', [
    { id: 'situation', label: 'Situation', multiline: true },
    { id: 'thoughts', label: 'Thoughts', multiline: true },
    { id: 'emotions', label: 'Emotions', multiline: true },
    { id: 'body', label: 'Body responses', multiline: true },
    { id: 'actions', label: 'Actions or urges', multiline: true },
  ]),
  item('tf-cbt', 'regulation', 'Grounding and emotional regulation', 'Build a short list of optional actions that help you notice the present and regain choice.', 'coping', [
    { id: 'skills', label: 'Grounding actions that help me', multiline: true },
  ]),
  item('tf-cbt', 'orientation-card', 'My present-orientation card', 'Create a short, editable card for moments when a reminder or nightmare leaves you unsettled. It stays in your words and does not interpret your experience.', 'coping', [
    { id: 'facts', label: 'Present-day facts I want to name (optional)', multiline: true },
    {
      id: 'actions',
      label: 'Optional actions I choose when I need to orient',
      inputType: 'multiselect',
      options: [
        { value: 'look-around', label: 'Look around and name what I can see' },
        { value: 'feet-floor', label: 'Notice my feet on the floor or the support beneath me' },
        { value: 'date-place', label: 'Name the date, place, and what I choose to do next' },
        { value: 'light-drink', label: 'Turn on a light or have a drink' },
        { value: 'support', label: 'Contact a person I choose' },
        { value: 'pause', label: 'Pause and do nothing else for now' },
      ],
    },
    { id: 'statement', label: 'My own present-orientation statement (optional)', multiline: true, helper: 'Only write a statement you find grounding. It can be changed or left blank.' },
    { id: 'preferences', label: 'What I do not want shown or asked when I am overwhelmed (optional)', multiline: true },
  ]),
  item('tf-cbt', 'sleep-plan', 'Difficult sleep and mornings', 'Plan gentle, practical steps for disrupted sleep or the morning after a nightmare.', 'coping', [
    { id: 'night', label: 'What may help at night?', multiline: true },
    { id: 'morning', label: 'What may make the morning more manageable?', multiline: true },
  ]),
  item('tf-cbt', 'morning-after-nightmare', 'Plan for the morning after a nightmare', 'Build a gentle plan for waking after a nightmare. Orienting and resting can come before logging anything.', 'coping', [
    { id: 'first', label: 'My first small step after waking', multiline: true },
    {
      id: 'actions',
      label: 'Optional actions I want available',
      inputType: 'multiselect',
      options: [
        { value: 'light', label: 'Turn on a light or open a curtain' },
        { value: 'feet', label: 'Place my feet on the floor' },
        { value: 'facts', label: 'Notice a few current facts about where I am' },
        { value: 'drink', label: 'Have a drink or another simple comfort' },
        { value: 'card', label: 'Use my present-orientation card' },
        { value: 'support', label: 'Contact a support person' },
        { value: 'rest', label: 'Rest and decide later' },
      ],
    },
    { id: 'day', label: 'How I want to make the day more manageable if sleep was disrupted', multiline: true },
    {
      id: 'notice',
      label: 'What I may want to record later (optional)',
      inputType: 'multiselect',
      options: [
        { value: 'sleep', label: 'Sleep last night' },
        { value: 'nightmare', label: 'Nightmare support or log' },
        { value: 'mood', label: 'Mood today' },
        { value: 'anxiety', label: 'Anxiety today' },
        { value: 'nothing', label: 'Nothing today' },
      ],
    },
  ]),
  item('tf-cbt', 'coping-plan', 'Personal coping plan', 'Collect signs, grounding actions, and people you choose to contact.', 'coping', [
    { id: 'signs', label: 'Signs I want to notice early', multiline: true },
    { id: 'actions', label: 'Actions I choose', multiline: true },
    { id: 'supports', label: 'People or services I may contact', multiline: true },
  ]),
  item('tf-cbt', 'therapist-questions', 'Questions for a therapist', 'Prepare questions about pacing, goals, safety, sleep, and what to practise between appointments.', 'appointment-preparation', [
    { id: 'questions', label: 'Questions to bring', multiline: true },
  ]),
  item('tf-cbt', 'assigned-work', 'My practice plan', 'Choose a small Salience practice step, or record an exercise suggested by a professional. You can pause, change, or remove it at any time.', 'worksheet', [
    { id: 'instructions', label: 'Practice step I choose', multiline: true },
    { id: 'questions', label: 'Questions or support I may want', multiline: true },
  ], false, nice),
  item('tf-cbt', 'memory-processing', 'About trauma-memory processing', 'Detailed trauma narratives and deliberate memory processing are not included in the Salience self-guided pathway. This information page does not ask you to describe or revisit what happened.', 'clinician-guided', [], true, nice),
  item('tf-cbt', 'functioning', 'Rebuilding ordinary life', 'Choose small, personally meaningful ways to reconnect with routines, roles, relationships, or interests. This is planning, not an app-generated treatment assignment.', 'worksheet', [
    { id: 'area', label: 'Part of daily life I want to reconnect with', multiline: true },
    { id: 'matters', label: 'Why this matters to me', multiline: true },
    { id: 'small-step', label: 'A small step I choose', multiline: true },
    { id: 'support', label: 'What could make the step more manageable?', multiline: true },
  ], false, nice),
  item('tf-cbt', 'daily-rhythm', 'A small daily rhythm', 'Choose one ordinary routine that matters to you and make it usable on both ordinary and low-energy days.', 'worksheet', [
    {
      id: 'area',
      label: 'Area of daily life I want to support',
      inputType: 'select',
      options: [
        { value: 'sleep', label: 'Sleep or mornings' },
        { value: 'food', label: 'Food or drinks' },
        { value: 'medication', label: 'Medication routine as already prescribed' },
        { value: 'appointments', label: 'Appointments or practical tasks' },
        { value: 'connection', label: 'Connection with people' },
        { value: 'movement', label: 'Movement or time outside' },
        { value: 'interest', label: 'An interest or meaningful activity' },
        { value: 'other', label: 'Another area I choose' },
      ],
    },
    { id: 'why', label: 'Why this area matters to me', multiline: true },
    { id: 'step', label: 'A small step I choose', multiline: true },
    { id: 'backup', label: 'A smaller backup step for a low-energy day', multiline: true },
    { id: 'support', label: 'Support that could make this more possible (optional)', multiline: true },
  ], false, nice),
  item('tf-cbt', 'maintaining', 'Maintaining gains and planning ahead', 'Review coping tools, supports, and choices you want available after a phase of the pathway. You decide when to pause, return, or seek more support.', 'worksheet', [
    { id: 'keep', label: 'What I want to keep using', multiline: true },
    { id: 'signs', label: 'Signs that I may want more support', multiline: true },
    { id: 'plan', label: 'What I would choose to do next', multiline: true },
    { id: 'booster', label: 'Questions about follow-up or booster appointments', multiline: true },
  ], false, nice),
]

const cptBaseModules: TreatmentContentItem[] = [
  item('cpt', 'course-intake', 'CPT course entry questions', 'Answer a few self-selection questions so the pathway can suggest a starting focus. The answers do not diagnose you, assess suitability, or replace a clinician conversation.', 'worksheet', [
    {
      id: 'reason',
      label: 'What brings me to this course today?',
      inputType: 'select',
      options: [
        { value: 'learn', label: 'I want to learn how CPT works' },
        { value: 'thoughts', label: 'I want to notice thoughts and responses' },
        { value: 'daily-life', label: 'I want to understand effects on daily life' },
        { value: 'prepare', label: 'I want to organise questions or records for support' },
        { value: 'not-sure', label: 'I am not sure yet' },
      ],
    },
    {
      id: 'entry-point',
      label: 'Where would I like to begin?',
      inputType: 'select',
      options: [
        { value: 'understand', label: 'Understanding CPT and the pathway' },
        { value: 'notice', label: 'Noticing thoughts, feelings, and responses' },
        { value: 'examine', label: 'Examining a belief with questions and context' },
        { value: 'themes', label: 'Reviewing the five life areas' },
        { value: 'practice', label: 'Organising practice and review' },
      ],
    },
    {
      id: 'detail',
      label: 'How much written detail feels manageable right now?',
      inputType: 'select',
      options: [
        { value: 'present-only', label: 'Present-day examples only' },
        { value: 'brief', label: 'Brief written reflections' },
        { value: 'some', label: 'Some writing when it feels manageable' },
        { value: 'not-sure', label: 'Not sure yet' },
      ],
    },
    {
      id: 'support',
      label: 'Support I may want while using the course',
      inputType: 'select',
      options: [
        { value: 'professional', label: 'I have a clinician or support person I may involve' },
        { value: 'considering', label: 'I may want support later' },
        { value: 'private', label: 'I prefer to keep this private for now' },
        { value: 'not-sure', label: 'Not sure yet' },
      ],
    },
    { id: 'questions', label: 'Questions I want to keep before I begin', multiline: true },
  ], false, vaCpt),
  item('cpt', 'overview', 'How the cognitive pathway works', 'This is an ordered CPT-informed companion pathway: learn the model, notice patterns, examine meanings, review life themes, practise and review, then consolidate. It supports worksheets and preparation but does not replace a trained CPT therapist or make clinical decisions.', 'education', [], false, vaCpt),
  item('cpt', 'course-map', 'CPT pathway map', 'See the full start-to-finish route before you begin. You can move at your own pace, repeat a stage, or pause without being marked incomplete.', 'worksheet', [
    {
      id: 'pace',
      label: 'Pace that feels manageable',
      inputType: 'select',
      options: [
        { value: 'one-module', label: 'One module at a time' },
        { value: 'short-sessions', label: 'Short sessions when useful' },
        { value: 'between-appointments', label: 'Between appointments' },
        { value: 'review-only', label: 'Review and organise only for now' },
        { value: 'not-sure', label: 'Not sure yet' },
      ],
    },
    {
      id: 'focus',
      label: 'Areas I may want the pathway to support',
      inputType: 'multiselect',
      options: [
        { value: 'sleep-nightmares', label: 'Sleep and nightmares' },
        { value: 'mood-anxiety', label: 'Mood and anxiety' },
        { value: 'safety-present', label: 'Safety and present orientation' },
        { value: 'trust', label: 'Trust and relationships' },
        { value: 'power-control', label: 'Power and control' },
        { value: 'esteem', label: 'Esteem and self-view' },
        { value: 'intimacy', label: 'Intimacy and closeness' },
        { value: 'daily-life', label: 'Daily functioning' },
      ],
    },
    { id: 'support', label: 'Support I want nearby while I use this pathway (optional)', multiline: true },
    { id: 'questions', label: 'Questions I want to keep before I begin', multiline: true },
  ], false, vaCpt),
  item('cpt', 'stuck-points', 'What a stuck point is', 'A stuck point is a thought that may make recovery harder. Record possible stuck points only in your own words; Salience will not label a belief irrational or rewrite it.', 'education', [
    { id: 'own-words', label: 'A possible stuck point in my own words', multiline: true },
    { id: 'context', label: 'When or where do I notice this thought?', multiline: true },
  ]),
  item('cpt', 'stuck-point-log', 'Stuck point log', 'Keep repeatable records of thoughts or meanings you want to examine. A category organises a record; it does not judge the thought or explain why it is there.', 'worksheet', [
    { id: 'statement', label: 'Possible stuck point in my own words', multiline: true },
    {
      id: 'area',
      label: 'Area that may help me organise this record (optional)',
      inputType: 'select',
      options: [
        { value: 'safety', label: 'Safety' },
        { value: 'trust', label: 'Trust' },
        { value: 'power-control', label: 'Power and control' },
        { value: 'esteem', label: 'Esteem' },
        { value: 'intimacy', label: 'Intimacy' },
        { value: 'self', label: 'Myself or my identity' },
        { value: 'other', label: 'Another area' },
        { value: 'not-sure', label: 'Not sure yet' },
      ],
    },
    { id: 'context', label: 'When or where do I notice it?', multiline: true },
    { id: 'effect', label: 'What do I notice in emotions, body, actions, or daily life?', multiline: true },
    { id: 'question', label: 'A question or uncertainty I want to keep', multiline: true },
  ], false, vaCpt),
  item('cpt', 'abc', 'ABC worksheet', 'Separate an activating event, your belief or interpretation, and the emotional or behavioural consequence.', 'worksheet', [
    { id: 'activating', label: 'Activating event', multiline: true },
    { id: 'belief', label: 'Belief or interpretation', multiline: true },
    { id: 'consequence', label: 'Emotional and behavioural consequence', multiline: true },
  ]),
  item('cpt', 'evidence', 'Examine a belief', 'Record information you see on each side, then consider context or a statement that feels more complete. Salience does not decide whether a belief is true or false.', 'worksheet', [
    { id: 'belief', label: 'Belief in my own words', multiline: true },
    { id: 'supporting', label: 'Evidence I think supports it', multiline: true },
    { id: 'not-supporting', label: 'Evidence I think does not support it', multiline: true },
    { id: 'balanced', label: 'A possible balanced statement', multiline: true },
  ]),
  item('cpt', 'challenging-beliefs', 'Challenging beliefs worksheet', 'Work through a belief using questions and information in your own words. There is no required conclusion, and Salience will not automatically rewrite the belief.', 'worksheet', [
    { id: 'belief', label: 'Belief or interpretation in my own words', multiline: true },
    { id: 'supporting', label: 'Information I think supports it', multiline: true },
    { id: 'not-supporting', label: 'Information I think does not support it', multiline: true },
    { id: 'context', label: 'Context, uncertainty, or missing information I want to keep in view', multiline: true },
    { id: 'balanced', label: 'A possible balanced statement, only if it feels honest', multiline: true },
    { id: 'honest', label: 'What still feels uncertain or unresolved', multiline: true },
    { id: 'questions', label: 'Questions I want to keep for myself or a professional', multiline: true },
  ], false, vaCpt),
  item('cpt', 'thinking-patterns', 'Thinking patterns', 'Notice patterns such as all-or-nothing conclusions, predicting outcomes, or overlooking context without using the pattern as a verdict.', 'education', [
    { id: 'noticed', label: 'Pattern I noticed', multiline: true },
    { id: 'context', label: 'Context I want to remember', multiline: true },
  ]),
  item('cpt', 'challenging-questions', 'Questions for a fuller view', 'Use compassionate questions to look for context, missing information, and other possible viewpoints. You do not have to reach a new conclusion.', 'worksheet', [
    { id: 'belief', label: 'Thought or belief in my own words', multiline: true },
    { id: 'missing', label: 'What information might be missing or uncertain?', multiline: true },
    { id: 'context', label: 'What context could matter here?', multiline: true },
    { id: 'other-view', label: 'How might I view this if it involved someone I care about?', multiline: true },
  ]),
  item('cpt', 'themes', 'Reflection areas', 'Organise your own reflections under safety, trust, power and control, esteem, or intimacy.', 'worksheet', [
    {
      id: 'area',
      label: 'Area I am reflecting on',
      inputType: 'select',
      options: [
        { value: 'safety', label: 'Safety' },
        { value: 'trust', label: 'Trust' },
        { value: 'power-control', label: 'Power and control' },
        { value: 'esteem', label: 'Esteem' },
        { value: 'intimacy', label: 'Intimacy' },
        { value: 'not-sure', label: 'Not sure yet' },
      ],
    },
    { id: 'reflection', label: 'Reflection in my own words', multiline: true },
  ]),
  item('cpt', 'theme-review', 'Five-theme review', 'Use safety, trust, power and control, esteem, and intimacy as broad organisers for present-day reflection. Choose only areas that fit your experience; no belief is preloaded.', 'worksheet', [
    {
      id: 'areas',
      label: 'Areas I want to consider',
      inputType: 'multiselect',
      options: [
        { value: 'safety', label: 'Safety' },
        { value: 'trust', label: 'Trust' },
        { value: 'power-control', label: 'Power and control' },
        { value: 'esteem', label: 'Esteem' },
        { value: 'intimacy', label: 'Intimacy' },
      ],
    },
    { id: 'reflection', label: 'Reflection in my own words', multiline: true },
    { id: 'current', label: 'Present-day context or exceptions I want to remember', multiline: true },
    { id: 'choice', label: 'A choice or perspective I want to carry forward', multiline: true },
    { id: 'support', label: 'Support or questions I may want', multiline: true },
  ], false, vaCpt),
  item('cpt', 'assignments', 'My cognitive practice plan', 'Choose a Salience worksheet to practise or record a suggestion from a professional. You can change the plan without being marked incomplete.', 'worksheet', [
    { id: 'instructions', label: 'Practice I choose', multiline: true },
    { id: 'questions', label: 'Questions or support I may want', multiline: true },
  ], false, vaCpt),
  item('cpt', 'worksheet-choice', 'Choose a cognitive worksheet', 'Use this page to choose what you may want to revisit. It does not assign homework or decide whether you are ready for any treatment step.', 'worksheet', [
    {
      id: 'worksheets',
      label: 'Worksheets I may want to revisit',
      inputType: 'multiselect',
      options: [
        { value: 'stuck-points', label: 'Possible stuck points' },
        { value: 'abc', label: 'ABC worksheet' },
        { value: 'evidence', label: 'Evidence and context' },
        { value: 'thinking-patterns', label: 'Thinking patterns' },
        { value: 'reflection-areas', label: 'Reflection areas' },
        { value: 'questions', label: 'Questions for a fuller view' },
        { value: 'review', label: 'Review changes and questions' },
      ],
    },
    {
      id: 'pace',
      label: 'Pace that feels manageable',
      inputType: 'select',
      options: [
        { value: 'one-small-record', label: 'One small record' },
        { value: 'few-minutes', label: 'A few minutes when useful' },
        { value: 'between-appointments', label: 'Between appointments' },
        { value: 'not-sure', label: 'Not sure yet' },
      ],
    },
    { id: 'reason', label: 'What makes these choices relevant to me?', multiline: true },
    { id: 'support', label: 'What would make revisiting them more manageable?', multiline: true },
  ], false, vaCpt),
  item('cpt', 'practice-log', 'Cognitive worksheet review log', 'Keep a brief record after using a cognitive worksheet. The record can include uncertainty, questions, or no clear change.', 'worksheet', [
    { id: 'date', label: 'Date of this record', inputType: 'date' },
    {
      id: 'worksheet',
      label: 'Worksheet I reviewed',
      inputType: 'select',
      options: [
        { value: 'stuck-points', label: 'Possible stuck points' },
        { value: 'abc', label: 'ABC worksheet' },
        { value: 'evidence', label: 'Evidence and context' },
        { value: 'thinking-patterns', label: 'Thinking patterns' },
        { value: 'reflection-areas', label: 'Reflection areas' },
        { value: 'other', label: 'Another record' },
      ],
    },
    { id: 'recorded', label: 'What I recorded or reviewed', multiline: true },
    { id: 'noticed', label: 'What I noticed, including uncertainty', multiline: true },
    { id: 'next', label: 'What I choose next: keep, question, revisit later, or pause', multiline: true },
  ], false, vaCpt),
  item('cpt', 'review', 'Review changes and questions', 'Review what you have noticed without treating a score or incomplete worksheet as a verdict about recovery.', 'appointment-preparation', [
    { id: 'useful', label: 'What has felt useful or different?', multiline: true },
    { id: 'difficult', label: 'What has felt difficult, confusing, or unhelpful?', multiline: true },
    { id: 'questions', label: 'What do I want to review for myself or with a clinician?', multiline: true },
  ]),
  item('cpt', 'impact-review', 'Reviewing impact in my own words', 'Review how experiences may have affected your views of yourself, other people, or the world. Detailed trauma description is not required, every prompt is optional, and Salience does not judge whether a belief is right or wrong.', 'worksheet', [
    { id: 'earlier-view', label: 'An earlier view I choose to revisit', multiline: true },
    { id: 'current-view', label: 'How I would describe my view now', multiline: true },
    { id: 'context', label: 'Context or uncertainty I want to keep in mind', multiline: true },
    { id: 'questions', label: 'Questions to keep for myself or discuss with a clinician', multiline: true },
  ], false, vaCpt),
  item('cpt', 'conversation-plan', 'Prepare a cognitive therapy conversation', 'Prepare questions or boundaries for a support conversation about the cognitive pathway. You choose what to share and can leave out anything not ready to discuss.', 'appointment-preparation', [
    { id: 'questions', label: 'Questions I may want to ask', multiline: true },
    { id: 'include', label: 'Records or patterns I may want to bring', multiline: true },
    { id: 'support', label: 'What would help the conversation feel manageable?', multiline: true },
    { id: 'boundaries', label: 'What I do not want to discuss or share yet', multiline: true },
  ], false, cptCoach),
  item('cpt', 'maintaining', 'Keeping useful changes going', 'Collect strategies, questions, and support plans you want available after this pathway. You decide when to pause, return, or seek more support.', 'worksheet', [
    { id: 'tools', label: 'Tools or perspectives I want to remember', multiline: true },
    { id: 'future-stuck-point', label: 'A thought pattern I may want to notice again', multiline: true },
    { id: 'response', label: 'How I would like to respond if it returns', multiline: true },
    { id: 'follow-up', label: 'Questions about follow-up or future support', multiline: true },
  ], false, cptCoach),
]

const peBaseModules: TreatmentContentItem[] = [
  item('pe', 'overview', 'About Prolonged Exposure', 'PE is a structured trauma-focused treatment. Salience offers an independent, conservative pathway focused on avoidance education and user-chosen ordinary-life approach practice; it does not create exposure targets or perform imaginal exposure.', 'education', [], false, vaGuideline),
  item('pe', 'consent-control', 'Choice, consent, and stopping', 'Create your rules for pace, stopping, modifications, and support before any ordinary-life approach practice.', 'worksheet', [
    { id: 'stop', label: 'My rule for pausing or stopping', multiline: true },
    { id: 'adjust', label: 'How I can make an activity easier or remove it', multiline: true },
    { id: 'support', label: 'Support I choose afterward', multiline: true },
  ], false, vaGuideline),
  item('pe', 'avoidance-safe-reminders', 'Avoidance and safe situations', 'Learn the difference between an ordinary situation you already judge safe and a situation involving real danger or legal risk. The app will not tell you what place or situation to approach.', 'education', [
    { id: 'questions', label: 'Safety questions or uncertainty I want to record', multiline: true },
  ]),
  item('pe', 'avoidance-map', 'Notice avoidance and choice', 'Notice what a pattern may help you manage and how it changes daily life, without deciding that you should approach anything.', 'worksheet', [
    { id: 'pattern', label: 'A pattern I have already noticed', multiline: true },
    { id: 'short-term', label: 'What this may help me manage in the short term', multiline: true },
    { id: 'long-term', label: 'What changes in daily life when this pattern continues', multiline: true },
    {
      id: 'choice',
      label: 'What I choose next',
      inputType: 'select',
      options: [
        { value: 'leave', label: 'Leave it alone for now' },
        { value: 'daily-adjustment', label: 'Make a non-exposure daily-life adjustment' },
        { value: 'support', label: 'Ask for support' },
        { value: 'discuss', label: 'Discuss it with a professional' },
        { value: 'not-sure', label: 'Not sure yet' },
      ],
    },
    { id: 'support', label: 'Support or information I may want', multiline: true },
  ]),
  item('pe', 'hierarchy', 'My ordinary-life approach plan', 'Record only an everyday situation you already judge safe. Never use this for prisons, police, courts, Corrections facilities, confrontation, pursuit, confinement, illegal activity, or any situation involving real danger.', 'worksheet', [
    { id: 'item', label: 'Ordinary-life activity I choose', multiline: true },
    { id: 'safety', label: 'Facts that tell me this is physically, legally, and psychologically safe', multiline: true },
    { id: 'choice', label: 'How I can make it easier, pause, or remove it', multiline: true },
    { id: 'support', label: 'My support or stopping plan', multiline: true },
  ], false, vaGuideline),
  item('pe', 'practice-record', 'Ordinary-life practice record', 'Record what happened with an activity you previously chose and judged safe. Ratings are descriptive and do not grade success.', 'worksheet', [
    { id: 'item', label: 'Previously chosen ordinary-life activity', multiline: true },
    { id: 'before', label: 'Before distress rating (0-10)', inputType: 'rating' },
    { id: 'after', label: 'After distress rating (0-10)', inputType: 'rating' },
    { id: 'stopped', label: 'Did I pause, stop, or modify anything?', multiline: true },
    { id: 'notes', label: 'Notes or questions', multiline: true },
  ], false, vaGuideline),
  item('pe', 'homework', 'Practice tracking', 'Track only ordinary-life practice you choose. A high distress rating, a pause, or a change is information, not failure.', 'worksheet', [
    { id: 'instructions', label: 'Practice I chose', multiline: true },
    { id: 'completed', label: 'What I chose to do', multiline: true },
    { id: 'review', label: 'What I want to change or review', multiline: true },
  ], false, vaGuideline),
  item('pe', 'imaginal', 'About imaginal exposure', 'Imaginal exposure involves deliberate trauma recall. It is not part of the Salience self-guided pathway: this page provides information only and contains no script, trauma prompt, recording, repetition schedule, or timer.', 'clinician-guided', [], true, vaGuideline),
  item('pe', 'session-review', 'Practice notes and progress review', 'Keep brief observations and questions without pressure to complete an activity.', 'worksheet', [
    { id: 'observations', label: 'Observations', multiline: true },
    { id: 'questions', label: 'Questions or changes I want to consider', multiline: true },
  ], false, vaPe),
  item('pe', 'recovery-plan', 'Recover after an ordinary-life activity', 'Record a present-focused recovery plan after an ordinary-life activity you already chose elsewhere. This page does not create or intensify practice.', 'coping', [
    { id: 'activity', label: 'Ordinary-life activity already chosen', multiline: true },
    {
      id: 'actions',
      label: 'Reorientation or recovery actions I choose',
      inputType: 'multiselect',
      options: [
        { value: 'look-around', label: 'Look around and name current surroundings' },
        { value: 'feet', label: 'Notice my feet or the support beneath me' },
        { value: 'drink', label: 'Have a drink or take a practical break' },
        { value: 'quiet', label: 'Choose quiet or rest' },
        { value: 'support', label: 'Contact a support person' },
        { value: 'plan', label: 'Review my stopping or support plan' },
      ],
    },
    { id: 'observations', label: 'Brief factual observations', multiline: true },
    {
      id: 'future',
      label: 'What I choose about this activity next',
      inputType: 'select',
      options: [
        { value: 'same', label: 'Keep the choice as it is' },
        { value: 'smaller', label: 'Make it smaller or simpler' },
        { value: 'pause', label: 'Pause it' },
        { value: 'remove', label: 'Remove it' },
        { value: 'support', label: 'Discuss it with a professional' },
        { value: 'not-sure', label: 'Not sure yet' },
      ],
    },
    { id: 'questions', label: 'Questions I want to keep', multiline: true },
  ], false, vaPe),
  item('pe', 'conversation-plan', 'Prepare a PE conversation', 'Prepare questions or boundaries for a conversation about PE. Salience does not decide whether PE is suitable or answer questions about imaginal work.', 'appointment-preparation', [
    { id: 'questions', label: 'Questions about fit, pace, safety, or stopping', multiline: true },
    { id: 'boundaries', label: 'Boundaries or topics I want to name', multiline: true },
    { id: 'support', label: 'What would help me feel heard and able to pause?', multiline: true },
  ], false, vaPe),
  item('pe', 'future-plan', 'Maintaining gains and future planning', 'Record your plan for keeping useful learning available, responding to renewed avoidance, and seeking support if wanted. Salience does not create future exposure assignments.', 'worksheet', [
    { id: 'learning', label: 'Learning I want to carry forward', multiline: true },
    { id: 'signs', label: 'Signs I may want to review the plan', multiline: true },
    { id: 'instructions', label: 'Future ordinary-life practice or coping choices', multiline: true },
    { id: 'support', label: 'Follow-up or support plan', multiline: true },
  ], false, vaPe),
]

const emdrBaseModules: TreatmentContentItem[] = [
  item('emdr', 'overview', 'About EMDR', 'EMDR is a phased trauma-focused treatment. Salience provides self-guided preparation, grounding, recovery planning, and education; it does not perform active EMDR reprocessing.', 'education', [], false, nice),
  item('emdr', 'phases-choice', 'Phases, choice, and consent', 'Learn how preparation, assessment, active reprocessing, closure, and later review are distinct parts of EMDR. Salience supports preparation and recovery but does not run reprocessing.', 'education', [
    { id: 'questions', label: 'Questions about phases, choice, or consent', multiline: true },
    { id: 'preferences', label: 'Preferences I want to remember or share', multiline: true },
  ], false, nice),
  item('emdr', 'grounding-resources', 'Grounding resources', 'Record present-orientation and self-calming resources that you choose.', 'coping', [
    { id: 'resources', label: 'Grounding resources', multiline: true },
    { id: 'image', label: 'Optional calm or secure mental image', multiline: true },
  ]),
  item('emdr', 'resource-menu', 'My preparation resource menu', 'Create a personal menu of present-day resources you may choose before or after an appointment. A calm or secure image is optional.', 'coping', [
    {
      id: 'resources',
      label: 'Resources I may want available',
      inputType: 'multiselect',
      options: [
        { value: 'place-date', label: 'Name the present place and date' },
        { value: 'surroundings', label: 'Notice current surroundings' },
        { value: 'feet', label: 'Notice my feet or the support beneath me' },
        { value: 'sensory', label: 'Use a familiar sensory comfort' },
        { value: 'calm-image', label: 'Use a calm or secure image if helpful' },
        { value: 'support', label: 'Contact a support person' },
        { value: 'rest', label: 'Rest and return to ordinary activity' },
      ],
    },
    { id: 'image', label: 'Optional description of a calm or secure image', multiline: true },
    { id: 'instructions', label: 'Instructions I choose or have received', multiline: true },
    { id: 'avoid', label: 'Resources or wording I prefer not to use', multiline: true },
  ], false, vaEmdr),
  item('emdr', 'stop-signals', 'Pause, stop, and reorientation plan', 'Choose how you will pause, stop, reorient, and decide whether to continue during any difficult activity or appointment.', 'coping', [
    { id: 'signal', label: 'My pause or stop signal', multiline: true },
    { id: 'reorient', label: 'What helps me reorient?', multiline: true },
    { id: 'support', label: 'Support available afterward', multiline: true },
  ], false, nice),
  item('emdr', 'topics', 'Topics and questions', 'Note brief topics or questions without requiring detailed trauma text or selecting targets.', 'worksheet', [
    { id: 'topics', label: 'Possible topics or questions', multiline: true },
  ]),
  item('emdr', 'targets', 'Brief topic descriptions', 'Record a short topic label without activating or processing a memory. Salience does not turn this into an EMDR target, and detailed trauma text is not required.', 'worksheet', [
    { id: 'description', label: 'Brief topic description', multiline: true },
    { id: 'instructions', label: 'Preparation or coping notes', multiline: true },
  ], false, nice),
  item('emdr', 'communication-plan', 'Plan communication and consent preferences', 'Record what you want explained, how you prefer to pause, and what you do not want to discuss yet. You can bring this to an appointment or keep it private.', 'appointment-preparation', [
    {
      id: 'pace',
      label: 'How I prefer information and pace to be handled',
      inputType: 'select',
      options: [
        { value: 'explain-first', label: 'Explain first, then let me choose' },
        { value: 'short-steps', label: 'Use short steps and check in' },
        { value: 'written', label: 'Give me written information to review' },
        { value: 'not-sure', label: 'Not sure yet' },
      ],
    },
    { id: 'questions', label: 'Questions I want answered before deciding anything', multiline: true },
    { id: 'needs', label: 'Communication or access needs I want to mention', multiline: true },
    { id: 'boundaries', label: 'Topics or details I do not want to discuss yet', multiline: true },
  ], false, vaEmdr),
  item('emdr', 'reprocessing', 'About active EMDR reprocessing', 'Active reprocessing is not part of the Salience self-guided pathway. This information page contains no trauma-recall prompt, target selection, eye movement, flashing light, alternating tone, vibration, or tapping sequence.', 'clinician-guided', [], true, nice),
  item('emdr', 'appointments', 'Appointments and post-session observations', 'Track appointment dates, neutral observations, and self-chosen or professionally supplied coping instructions.', 'appointment-preparation', [
    { id: 'appointment', label: 'Appointment date', inputType: 'date' },
    { id: 'observations', label: 'Post-session observations', multiline: true },
    { id: 'coping', label: 'Coping instructions I want available', multiline: true },
  ]),
  item('emdr', 'between-session-log', 'Between-session observations', 'Keep a brief present-day record between appointments. Sleep, nightmares, mood, and daily life can be noted without deciding why they changed.', 'worksheet', [
    { id: 'date', label: 'Date of this record', inputType: 'date' },
    { id: 'observations', label: 'Present-day observations', multiline: true },
    {
      id: 'sleep',
      label: 'Sleep last night (optional)',
      inputType: 'select',
      options: [
        { value: 'usual', label: 'About usual for me' },
        { value: 'less', label: 'Less than usual' },
        { value: 'more', label: 'More than usual' },
        { value: 'not-sure', label: 'Not sure' },
      ],
    },
    { id: 'support', label: 'Support or coping that helped or that I want available', multiline: true },
    { id: 'questions', label: 'Questions for a future appointment or personal review', multiline: true },
  ], false, vaEmdr),
  item('emdr', 'after-session-plan', 'After-session support plan', 'Record ordinary practical supports and coping instructions you want available after a difficult activity or appointment.', 'coping', [
    { id: 'instructions', label: 'Coping instructions I choose or received', multiline: true },
    { id: 'supports', label: 'People, places, or practical supports I chose', multiline: true },
    { id: 'contact', label: 'When and how I may contact support', multiline: true },
  ], false, nice),
  item('emdr', 'closure-review', 'Closure and later review', 'Record factual present-day observations, questions, and supports after a difficult activity or appointment. Salience does not interpret post-session experiences.', 'worksheet', [
    { id: 'present', label: 'What I notice in the present', multiline: true },
    { id: 'support', label: 'What has helped me stay oriented', multiline: true },
    { id: 'unexpected', label: 'Anything unexpected I want to remember or share', multiline: true },
    { id: 'questions', label: 'Questions for my own review or a future appointment', multiline: true },
  ], false, nice),
  item('emdr', 'future-plan', 'Maintaining support after a pathway phase', 'Record follow-up choices, preparation resources, and coping instructions you want available. Salience does not decide whether formal EMDR reprocessing should begin or resume.', 'worksheet', [
    { id: 'resources', label: 'Preparation resources I want to keep available', multiline: true },
    { id: 'instructions', label: 'Follow-up or coping instructions I choose', multiline: true },
    { id: 'signs', label: 'What would prompt me to seek more support', multiline: true },
    { id: 'follow-up', label: 'Planned follow-up or review', multiline: true },
  ], false, nice),
]

const tfCbtModules = addStructuredTreatmentModules(
  tfCbtBaseModules,
  buildStructuredTreatmentModules('tf-cbt', nice, {
    start: { phaseId: 'orient', phaseTitle: 'Understand and choose' },
    warning: { phaseId: 'notice', phaseTitle: 'Notice patterns' },
    support: { phaseId: 'stabilise', phaseTitle: 'Build present-day skills' },
    topics: { phaseId: 'collaborate', phaseTitle: 'Choose support' },
    prescriber: { phaseId: 'collaborate', phaseTitle: 'Choose support' },
    review: { phaseId: 'maintain', phaseTitle: 'Restore and maintain' },
  }),
  ['orient', 'stabilise', 'notice', 'collaborate', 'maintain'],
)

const cptModules = addStructuredTreatmentModules(
  cptBaseModules,
  buildStructuredTreatmentModules('cpt', vaCpt, {
    start: { phaseId: 'orient', phaseTitle: 'Learn the model' },
    warning: { phaseId: 'observe', phaseTitle: 'Observe thoughts and responses' },
    support: { phaseId: 'practice', phaseTitle: 'Practise and review' },
    topics: { phaseId: 'themes', phaseTitle: 'Review life areas' },
    prescriber: { phaseId: 'practice', phaseTitle: 'Practise and review' },
    review: { phaseId: 'consolidate', phaseTitle: 'Consolidate and maintain' },
  }),
  ['orient', 'observe', 'examine', 'themes', 'practice', 'consolidate'],
)

const peModules = addStructuredTreatmentModules(
  peBaseModules,
  buildStructuredTreatmentModules('pe', vaPe, {
    start: { phaseId: 'orient', phaseTitle: 'Understand PE' },
    warning: { phaseId: 'prepare', phaseTitle: 'Check safety and choice' },
    support: { phaseId: 'prepare', phaseTitle: 'Check safety and choice' },
    topics: { phaseId: 'processing', phaseTitle: 'Understand the treatment boundary' },
    prescriber: { phaseId: 'review', phaseTitle: 'Review without grading' },
    review: { phaseId: 'maintain', phaseTitle: 'Maintain choice and support' },
  }),
  ['orient', 'prepare', 'plan', 'processing', 'review', 'maintain'],
)

const emdrModules = addStructuredTreatmentModules(
  emdrBaseModules,
  buildStructuredTreatmentModules('emdr', nice, {
    start: { phaseId: 'orient', phaseTitle: 'Understand EMDR' },
    warning: { phaseId: 'prepare', phaseTitle: 'Prepare and orient' },
    support: { phaseId: 'prepare', phaseTitle: 'Prepare and orient' },
    topics: { phaseId: 'collaborate', phaseTitle: 'Prepare topics and preferences' },
    prescriber: { phaseId: 'review', phaseTitle: 'Review and recover' },
    review: { phaseId: 'maintain', phaseTitle: 'Maintain support' },
  }),
  ['orient', 'prepare', 'collaborate', 'processing', 'review', 'maintain'],
)

export const treatmentPrograms: TreatmentProgram[] = [
  {
    id: 'tf-cbt',
    name: 'Trauma-Focused CBT Foundations',
    description: 'A self-guided pathway for present-orientation, coping, patterns, and everyday recovery.',
    guidanceLabel: 'Self-guided pathway · no clinician unlock required',
    comparison: {
      focus: 'A broad foundation for understanding trauma responses, coping in the present, noticing patterns, and rebuilding everyday functioning.',
      outsideThisPathway: 'Salience does not ask for a detailed trauma narrative or start deliberate trauma-memory processing.',
      salienceRole: 'A self-guided sequence of education, grounding, sleep and coping plans, present-focused worksheets, and everyday recovery planning.',
      questionsToDiscuss: [
        'Which parts of my Salience pathway would be useful for you to see?',
        'Are there areas where additional professional support could help?',
        'How should we review symptoms and everyday functioning together?',
      ],
    },
    phases: [
      { id: 'orient', title: 'Understand and choose', description: 'Learn the framework and define what matters to you.' },
      { id: 'stabilise', title: 'Build present-day skills', description: 'Create grounding, sleep, and coping plans that remain under your control.' },
      { id: 'notice', title: 'Notice patterns', description: 'Use repeatable worksheets to observe reminders and responses without interpretation.' },
      { id: 'collaborate', title: 'Choose support', description: 'Keep self-guided practice plans and optional questions or instructions from a professional.' },
      { id: 'maintain', title: 'Restore and maintain', description: 'Reconnect with ordinary life and plan how to retain useful support without a required pace.' },
    ],
    modules: tfCbtModules,
  },
  {
    id: 'cpt',
    name: 'Cognitive Processing Therapy',
    description: 'A complete, ordered CPT-informed course companion for learning the model, noticing patterns, examining beliefs, reviewing life themes, practising, and consolidating.',
    guidanceLabel: 'CPT-informed course companion · choose a starting focus',
    comparison: {
      focus: 'Connections between events, interpretations, emotions, and actions, including thoughts that may keep recovery feeling stuck.',
      outsideThisPathway: 'Salience does not require a detailed trauma account, declare a belief false, or automatically rewrite what the user records.',
      salienceRole: 'A complete ordered course companion with entry questions, learning, stuck-point and ABC records, belief-review worksheets, five-theme reflection, practice, review, maintenance, and clinician reports.',
      questionsToDiscuss: [
        'Which worksheets or patterns would be useful to review together?',
        'How can I keep context and uncertainty in the discussion?',
        'What additional support would be useful if a worksheet feels difficult or I am unsure what to do next?',
      ],
    },
    phases: [
      { id: 'orient', title: 'Start and understand', description: 'Answer entry questions, learn the CPT framework, and choose a starting focus in your own words.' },
      { id: 'observe', title: 'Notice and map patterns', description: 'Use stuck-point, ABC, and thinking-pattern records without verdicts or forced conclusions.' },
      { id: 'examine', title: 'Examine thoughts with curiosity', description: 'Consider evidence, context, and possible balanced statements while keeping uncertainty visible.' },
      { id: 'themes', title: 'Review the five life areas', description: 'Organise reflections across safety, trust, power and control, esteem, and intimacy.' },
      { id: 'practice', title: 'Practise and review', description: 'Choose worksheets to revisit, record what you notice, and keep questions or support plans.' },
      { id: 'consolidate', title: 'Consolidate and plan ahead', description: 'Review chosen reflections, prepare for support, and carry forward what remains useful.' },
    ],
    modules: cptModules,
  },
  {
    id: 'pe',
    name: 'Prolonged Exposure',
    description: 'A self-guided pathway for understanding avoidance and planning user-chosen, ordinary-life approach practice.',
    guidanceLabel: 'Self-guided daily-life work · imaginal exposure is not performed',
    comparison: {
      focus: 'Learning how avoidance can narrow daily life and supporting gradual, user-chosen approach to ordinary situations the user already considers safe.',
      outsideThisPathway: 'Salience does not generate targets, verify safety, initiate imaginal exposure, request trauma recall, or approach legal, physical, or psychological risk.',
      salienceRole: 'Education, a stopping plan, a conservative safety screen, user-created ordinary-life steps, descriptive practice records, and progress review.',
      questionsToDiscuss: [
        'Do any activities in my report need a professional safety review?',
        'How can I adjust, downgrade, or remove an activity that no longer feels appropriate?',
        'Would professionally supported trauma-memory work be suitable for me?',
      ],
    },
    phases: [
      { id: 'orient', title: 'Understand PE', description: 'Learn the treatment boundary, role of choice, and right to stop.' },
      { id: 'prepare', title: 'Check safety and choice', description: 'Separate ordinary, user-identified safe situations from danger or legal risk.' },
      { id: 'plan', title: 'Plan ordinary-life steps', description: 'Create, change, pause, or remove only your own everyday activities; Salience does not generate targets.' },
      { id: 'processing', title: 'Understand the treatment boundary', description: 'Learn what imaginal exposure is without trauma recall, recordings, or a simulation.' },
      { id: 'review', title: 'Review without grading', description: 'Record observations and adjustments without pressure or pass/fail language.' },
      { id: 'maintain', title: 'Maintain choice and support', description: 'Keep useful learning and support available without app-generated exposure work.' },
    ],
    modules: peModules,
  },
  {
    id: 'emdr',
    name: 'EMDR',
    description: 'Self-guided preparation, grounding, recovery planning, and education about EMDR.',
    guidanceLabel: 'Self-guided preparation · active EMDR is not performed',
    comparison: {
      focus: 'A phased treatment that includes history and preparation before clinician-guided assessment and reprocessing, followed by closure and later review.',
      outsideThisPathway: 'Salience does not select targets, activate traumatic memories, provide bilateral stimulation, or claim to perform EMDR reprocessing.',
      salienceRole: 'A self-guided preparation and recovery pathway with education, grounding resources, preferences, stop plans, brief topic notes, and appointment reports.',
      questionsToDiscuss: [
        'How do you decide when preparation is sufficient before active reprocessing?',
        'How will we agree a pause or stop signal and reorient before I leave?',
        'What should I expect between sessions, and how would I contact you if I need support?',
      ],
    },
    phases: [
      { id: 'orient', title: 'Understand EMDR', description: 'Learn the phases and the distinction between preparation and reprocessing.' },
      { id: 'prepare', title: 'Prepare and orient', description: 'Record chosen grounding resources, preferences, and stopping plans.' },
      { id: 'collaborate', title: 'Prepare topics and preferences', description: 'Keep brief topic labels and questions without selecting or activating a target.' },
      { id: 'processing', title: 'Understand active reprocessing', description: 'Information only; no bilateral stimulation or trauma recall is provided.' },
      { id: 'review', title: 'Review and recover', description: 'Track factual observations and self-chosen after-session support.' },
      { id: 'maintain', title: 'Maintain support', description: 'Keep preparation resources and follow-up choices available without autonomous reprocessing.' },
    ],
    modules: emdrModules,
  },
]

export const treatmentNavItem = { view: 'treatment', label: 'Treatment' } as const

export const cptEntryModuleByPoint = {
  understand: 'overview',
  notice: 'stuck-point-log',
  examine: 'challenging-beliefs',
  themes: 'theme-review',
  practice: 'practice-log',
} as const

export const treatmentStatusLabels: Record<TreatmentProgramStatus, string> = {
  'not-started': 'Not started',
  exploring: 'Exploring',
  'clinician-supported': 'Using with support',
  paused: 'Paused',
  completed: 'Completed',
}

export const treatmentUseModeLabels: Record<TreatmentUseMode, string> = {
  'self-guided-pathway': 'I want a self-guided treatment pathway',
  'coping-tools': 'I want coping and nightmare tools',
  'learning-options': 'I am learning about treatment options',
  'alongside-therapist': 'I am using Salience alongside a therapist',
}

export const recurringNightmareThemes = [
  'Back in prison',
  'Prison transfer',
  'Unfamiliar prison',
  'Being pursued after escape',
  'Lost or unable to get home',
  'Unable to gather belongings',
  'Unable to find transport home',
  'Missing a plane or train home',
  'Fighting or being attacked',
  'Being knocked unconscious',
  'Other',
] as const

export const evidenceSources = [
  vaGuideline,
  vaCenter,
  vaCpt,
  vaPe,
  vaEmdr,
  nice,
  nicePsychosis,
  cptCoach,
  peCoach,
  vaDecisionAid,
  vaAssessment,
]

export const treatmentContentLastReviewed = reviewed
