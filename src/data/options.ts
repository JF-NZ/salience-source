import type {
  AnxietyContributor,
  BeliefCertainty,
  DepressionContributor,
  DepressionSymptom,
  EveningMoodRating,
  FunctioningItem,
  QuickAnxiety,
  QuickDepression,
  QuickMood,
  QuickWarningSigns,
  NightmareAfterWaking,
  NightmareIntensity,
  NightmareWakeReaction,
  PerceptualExperience,
  PsychosisSeverity,
  RealityCheck,
  Severity5,
  SleepDisruption,
  SleepDuration,
  SleepQuality,
  SubstanceAmount,
  SubstanceHelped,
  SubstanceReason,
  SubstanceTiming,
  SubstanceType,
  ThinkingClarity,
} from '../types'

export interface Option<T extends string> {
  value: T
  label: string
  helper?: string
  disabled?: boolean
}

export const quickCheckInLabels = {
  sleepLastNight: 'Sleep last night',
  moodToday: 'Mood today',
  moodYesterday: 'Mood yesterday',
} as const

export const sleepDurationOptions: Option<SleepDuration>[] = [
  { value: 'UNDER_2', label: 'Under 2 hours' },
  { value: 'TWO_TO_FOUR', label: '2-4 hours' },
  { value: 'FIVE_TO_SIX', label: '5-6 hours' },
  { value: 'SEVEN_TO_EIGHT', label: '7-8 hours' },
  { value: 'EIGHT_PLUS', label: '8+ hours' },
]

export const quickMoodOptions: Option<QuickMood>[] = [
  { value: 'VERY_LOW', label: 'Very low' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEH', label: 'Meh' },
  { value: 'OKAY', label: 'Okay' },
  { value: 'GOOD', label: 'Good' },
]

export const eveningMoodOptions: Option<EveningMoodRating>[] = [
  { value: '1', label: '1 - Awful' },
  { value: '2', label: '2 - Low' },
  { value: '3', label: '3 - Okay' },
  { value: '4', label: '4 - Good' },
  { value: '5', label: '5 - Great' },
]

export const quickAnxietyOptions: Option<QuickAnxiety>[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'EXTREME', label: 'Extreme' },
]

export const quickDepressionOptions: Option<QuickDepression>[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
]

export const quickWarningSignOptions: Option<QuickWarningSigns>[] = [
  { value: 'NONE', label: 'None' },
  { value: 'MILD', label: 'Mild' },
  { value: 'CONCERNING', label: 'Concerning' },
  { value: 'URGENT', label: 'Urgent' },
]

export const substanceTypeOptions: Option<SubstanceType>[] = [
  { value: 'CANNABIS', label: 'Cannabis' },
  { value: 'BENZODIAZEPINE', label: 'Benzodiazepine' },
  { value: 'ALCOHOL', label: 'Alcohol' },
  { value: 'NICOTINE', label: 'Nicotine / cigarettes / vaping' },
  { value: 'CAFFEINE', label: 'Caffeine / energy drinks' },
  { value: 'OPIOID_PAINKILLER', label: 'Opioid painkiller' },
  { value: 'SLEEP_MEDICATION', label: 'Sleep medication' },
  { value: 'ANTIHISTAMINE_SEDATING', label: 'Antihistamine / sedating medication' },
  { value: 'OTHER_NON_PRESCRIBED_DRUG', label: 'Other non-prescribed drug' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
]

export const substanceAmountOptions: Option<SubstanceAmount>[] = [
  { value: 'TINY', label: 'Tiny' },
  { value: 'SMALL', label: 'Small' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HEAVY', label: 'Heavy' },
  { value: 'UNSURE', label: 'Unsure' },
]

export const substanceTimingOptions: Option<SubstanceTiming>[] = [
  { value: 'MORNING', label: 'Morning' },
  { value: 'AFTERNOON', label: 'Afternoon' },
  { value: 'EVENING', label: 'Evening' },
  { value: 'NIGHT', label: 'Night' },
]

export const substanceReasonOptions: Option<SubstanceReason>[] = [
  { value: 'ANXIETY', label: 'Anxiety' },
  { value: 'SLEEP', label: 'Sleep' },
  { value: 'DEPRESSION', label: 'Depression' },
  { value: 'BOREDOM', label: 'Boredom' },
  { value: 'PAIN', label: 'Pain' },
  { value: 'CRAVINGS', label: 'Cravings' },
  { value: 'FOCUS', label: 'Focus' },
  { value: 'SOCIAL', label: 'Social' },
  { value: 'OTHER', label: 'Other' },
]

export const substanceHelpedOptions: Option<SubstanceHelped>[] = [
  { value: 'YES', label: 'Yes' },
  { value: 'A_LITTLE', label: 'A little' },
  { value: 'NO', label: 'No' },
  { value: 'WORSE', label: 'Made things worse' },
]

export const sleepQualityOptions: Option<SleepQuality>[] = [
  { value: 'VERY_POOR', label: 'Very Poor' },
  { value: 'POOR', label: 'Poor' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'GOOD', label: 'Good' },
  { value: 'EXCELLENT', label: 'Excellent' },
]

export const sleepDisruptionOptions: Option<SleepDisruption>[] = [
  { value: 'TROUBLE_FALLING_ASLEEP', label: 'Trouble falling asleep' },
  { value: 'WOKE_REPEATEDLY', label: 'Woke repeatedly during the night' },
  { value: 'NIGHTMARES', label: 'Nightmares' },
  { value: 'WOKE_EARLY', label: 'Woke much earlier than intended' },
  { value: 'SLEPT_UNUSUALLY_LONG', label: 'Slept unusually longer than normal' },
  { value: 'NONE', label: 'None of these' },
]

export const nightmareIntensityOptions: Option<NightmareIntensity>[] = [
  { value: 'MILD', label: 'Mild' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'SEVERE', label: 'Severe' },
]

export const nightmareWakeOptions: Option<NightmareWakeReaction>[] = [
  { value: 'SWEATING', label: 'Sweating' },
  { value: 'PANIC', label: 'Panic' },
  { value: 'FEAR', label: 'Fear' },
  { value: 'CONFUSION', label: 'Confusion' },
  { value: 'CRYING', label: 'Crying' },
  { value: 'OTHER', label: 'Other' },
]

export const nightmareAfterOptions: Option<NightmareAfterWaking>[] = [
  { value: 'COULD_NOT_GET_BACK_TO_SLEEP', label: 'Could not get back to sleep' },
  { value: 'TOOK_MEDICATION', label: 'Took medication' },
  { value: 'CONTACTED_SOMEONE', label: 'Contacted someone' },
  { value: 'USED_GROUNDING', label: 'Used grounding techniques' },
  { value: 'FELL_BACK_ASLEEP_QUICKLY', label: 'Fell back asleep quickly' },
]

export const severityOptions: Option<Severity5>[] = [
  { value: 'NONE', label: 'None' },
  { value: 'MILD', label: 'Mild' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'SEVERE', label: 'Severe' },
  { value: 'EXTREME', label: 'Extreme' },
]

export const psychosisSeverityOptions: Option<PsychosisSeverity>[] = [
  { value: 'NOT_AT_ALL', label: 'Not at all' },
  { value: 'SLIGHTLY', label: 'Slightly' },
  { value: 'MODERATELY', label: 'Moderately' },
  { value: 'SIGNIFICANTLY', label: 'Significantly' },
  { value: 'EXTREMELY', label: 'Extremely' },
]

export const beliefCertaintyOptions: Option<BeliefCertainty>[] = [
  { value: 'NOT_AT_ALL', label: 'Not at all' },
  { value: 'UNSURE', label: 'Unsure' },
  { value: 'SOMEWHAT_CONVINCED', label: 'Somewhat convinced' },
  { value: 'VERY_CONVINCED', label: 'Very convinced' },
  { value: 'COMPLETELY_CONVINCED', label: 'Completely convinced' },
  { value: 'NOT_APPLICABLE', label: 'Not applicable' },
]

export const thinkingClarityOptions: Option<ThinkingClarity>[] = [
  { value: 'CLEAR', label: 'Clear' },
  { value: 'SLIGHTLY_SCATTERED', label: 'Slightly scattered' },
  { value: 'NOTICEABLY_SCATTERED', label: 'Noticeably scattered' },
  { value: 'VERY_DIFFICULT', label: 'Very difficult to organise thoughts' },
]

export const realityCheckOptions: Option<RealityCheck>[] = [
  { value: 'NOT_APPLICABLE', label: 'Not applicable' },
  { value: 'CHALLENGED_THEM', label: 'Yes, I challenged them' },
  { value: 'DISCUSSED_WITH_SOMEONE', label: 'Yes, I discussed them with someone' },
  { value: 'ACCEPTED_AS_TRUE', label: 'No, I accepted them as true' },
]

export const anxietyContributorOptions: Option<AnxietyContributor>[] = [
  { value: 'COURT_LEGAL', label: 'Court/legal matters' },
  { value: 'FAMILY', label: 'Family' },
  { value: 'RELATIONSHIPS', label: 'Relationships' },
  { value: 'MONEY', label: 'Money' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'SLEEP', label: 'Sleep' },
  { value: 'SOCIAL_SITUATIONS', label: 'Social situations' },
  { value: 'UNKNOWN', label: 'Unknown' },
  { value: 'OTHER', label: 'Other' },
]

export const depressionContributorOptions: Option<DepressionContributor>[] = [
  { value: 'COURT_LEGAL', label: 'Court/legal matters' },
  { value: 'FAMILY', label: 'Family' },
  { value: 'RELATIONSHIPS', label: 'Relationships' },
  { value: 'MONEY', label: 'Money' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'SLEEP', label: 'Sleep' },
  { value: 'LONELINESS', label: 'Loneliness' },
  { value: 'UNKNOWN', label: 'Unknown' },
  { value: 'OTHER', label: 'Other' },
]

export const depressionSymptomOptions: Option<DepressionSymptom>[] = [
  { value: 'HOPELESS', label: 'Felt hopeless' },
  { value: 'GUILTY', label: 'Felt guilty' },
  { value: 'WORTHLESS', label: 'Felt worthless' },
  { value: 'LOST_INTEREST', label: 'Lost interest in things' },
  { value: 'ISOLATED_MYSELF', label: 'Isolated myself' },
  { value: 'STRUGGLED_TO_GET_OUT_OF_BED', label: 'Struggled to get out of bed' },
  { value: 'UNMOTIVATED', label: 'Felt unmotivated' },
  { value: 'NONE', label: 'None of these' },
]

export const perceptualExperienceOptions: Option<PerceptualExperience>[] = [
  { value: 'HEARD_SOMETHING', label: "Heard something others couldn't hear" },
  { value: 'SAW_SOMETHING', label: "Saw something others couldn't see" },
  { value: 'FELT_PRESENCE', label: "Felt someone's presence when nobody was there" },
  { value: 'MISTOOK_PERSON', label: 'Mistook someone for somebody else' },
  { value: 'NONE', label: 'None of these' },
]

export const functioningOptions: Option<FunctioningItem>[] = [
  { value: 'SHOWERED', label: 'Showered' },
  { value: 'LEFT_HOUSE', label: 'Left the house' },
  { value: 'EXERCISED', label: 'Exercised' },
  { value: 'PRODUCTIVE_TASK', label: 'Completed something productive' },
  { value: 'MEDICATION_AS_PRESCRIBED', label: 'Took medication as prescribed' },
  { value: 'PERSONAL_PROJECT', label: 'Worked on a personal project' },
]

export const optionLabel = <T extends string>(options: Option<T>[], value: T) =>
  options.find((option) => option.value === value)?.label ?? value
