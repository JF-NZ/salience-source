interface JournalTagRule {
  tag: string
  phrases: readonly string[]
  patterns?: readonly RegExp[]
}

const journalTagRules: readonly JournalTagRule[] = [
  {
    tag: 'struggling',
    phrases: [
      'having a hard time',
      'finding it hard',
      'finding this hard',
      'cant cope',
      'cannot cope',
      'not coping',
      'too much to handle',
      'what im struggling with',
      'what i am struggling with',
    ],
    patterns: [/\bstruggl(?:e|es|ed|ing)\b/, /\boverwhelm(?:ed|ing)?\b/],
  },
  {
    tag: 'sleep',
    phrases: ['awake all night', 'couldnt sleep', 'could not sleep', 'woke up', 'kept waking', 'get to sleep', 'stay asleep', 'sleep loss'],
    patterns: [/\b(?:sleep|sleeping|sleepless|slept|insomnia|bedtime)\b/],
  },
  {
    tag: 'nightmare',
    phrases: ['bad dream', 'bad dreams', 'disturbing dream', 'frightening dream', 'woke from a dream'],
    patterns: [/\bnightmares?\b/],
  },
  {
    tag: 'anxiety',
    phrases: ['on edge', 'panic attack', 'racing heart', 'sense of dread', 'worried about'],
    patterns: [/\b(?:anxiety|anxious|panic(?:ked|king)?|worr(?:y|ied|ying)|stress(?:ed|ful)?|nervous)\b/],
  },
  {
    tag: 'mood',
    phrases: ['low mood', 'feeling down', 'feel down', 'no hope'],
    patterns: [/\b(?:mood|depress(?:ed|ion|ing)?|sad(?:ness)?|hopeless(?:ness)?|tearful|crying|numb)\b/],
  },
  {
    tag: 'anger',
    phrases: ['lost my temper', 'short tempered'],
    patterns: [/\b(?:anger|angry|irritabl(?:e|ility)|frustrat(?:ed|ion)|rage|furious)\b/],
  },
  {
    tag: 'medication',
    phrases: [
      'clonazepam',
      'clonazapam',
      'lorazepam',
      'lorezapam',
      'diazepam',
      'diazapam',
      'sleep medication',
    ],
    patterns: [/\b(?:medication|medications|medicine|meds|tablet|tablets|prescription|dose|doses|prn|benzodiazepine|benzodiazepines)\b/],
  },
  {
    tag: 'treatment',
    phrases: ['coping plan', 'treatment plan', 'therapy session'],
    patterns: [/\b(?:therapy|therapist|psychiatrist|psychologist|counsellor|counselor|clinician|treatment)\b/],
  },
  {
    tag: 'appointment',
    phrases: ['doctor visit', 'meeting with my doctor', 'psychiatrist appointment', 'therapy appointment'],
    patterns: [/\bappointments?\b/],
  },
  {
    tag: 'support',
    phrases: ['support person', 'crisis team', 'trusted person', 'help line', 'called 1737', 'texted 1737'],
    patterns: [/\b(?:support|supported|helpline)\b/, /\b1737\b/],
  },
  {
    tag: 'legal',
    phrases: ['case worker', 'legal aid'],
    patterns: [/\b(?:court|lawyer|solicitor|hearing|probation|parole|prison|jail|corrections|police|bail|legal)\b/],
  },
  {
    tag: 'work',
    phrases: ['at work', 'work today', 'my job', 'work shift'],
    patterns: [/\b(?:job|jobs|shift|shifts|boss|manager|coworker|coworkers|colleague|colleagues|workplace|employment|unemployed)\b/],
  },
  {
    tag: 'study',
    phrases: ['study session'],
    patterns: [/\b(?:school|university|course|class|classes|assignment|assignments|exam|exams|study|studying)\b/],
  },
  {
    tag: 'relationships',
    phrases: ['argument with', 'conflict with'],
    patterns: [/\b(?:relationship|relationships|partner|family|friend|friends|parent|parents|sibling|siblings|mum|mom|dad)\b/],
  },
  {
    tag: 'grief',
    phrases: ['passed away', 'miss them'],
    patterns: [/\b(?:grief|grieving|bereavement|loss|funeral|died|death)\b/],
  },
  {
    tag: 'finances',
    phrases: ['money worries', 'financial stress'],
    patterns: [/\b(?:money|rent|bill|bills|debt|debts|finances|financial|afford|payment|payments|benefit)\b/],
  },
  {
    tag: 'housing',
    phrases: ['moving house', 'where i live'],
    patterns: [/\b(?:housing|accommodation|landlord|flatmate|flatmates|apartment|homeless|tenancy)\b/],
  },
  {
    tag: 'transport',
    phrases: ['get home', 'getting home', 'missed the bus', 'missed the train', 'missed my flight'],
    patterns: [/\b(?:transport|travel|travelling|traveling|bus|train|plane|flight|flights|taxi|driving|car)\b/],
  },
  {
    tag: 'physical health',
    phrases: ['felt unwell', 'feeling unwell'],
    patterns: [/\b(?:pain|painful|headache|migraine|injury|injured|sick|unwell|nausea|illness)\b/],
  },
  {
    tag: 'food',
    phrases: ['didnt eat', 'did not eat', 'forgot to eat', 'comfort eating'],
    patterns: [/\b(?:appetite|eating|ate|meal|meals|food|hungry)\b/],
  },
  {
    tag: 'energy',
    phrases: ['no energy', 'low energy'],
    patterns: [/\b(?:tired|exhausted|fatigue|fatigued|energy|drained)\b/],
  },
  {
    tag: 'motivation',
    phrases: ['cant get started', 'cannot get started', 'putting things off', 'couldnt get out of bed'],
    patterns: [/\b(?:motivation|motivated|unmotivated|procrastinat(?:e|ed|ing|ion))\b/],
  },
  {
    tag: 'concentration',
    phrases: ['hard to focus', 'couldnt focus', 'could not focus', 'racing thoughts'],
    patterns: [/\b(?:focus|focused|concentrate|concentrating|concentration|distracted|scattered|forgetful|memory)\b/],
  },
  {
    tag: 'routine',
    phrases: ['went for a walk', 'brushed my teeth', 'got dressed'],
    patterns: [/\b(?:routine|shower|showered|exercise|exercised|gym|chores|cleaning)\b/],
  },
  {
    tag: 'substance use',
    phrases: ['drank alcohol', 'energy drink', 'energy drinks', 'drug use'],
    patterns: [/\b(?:alcohol|cannabis|weed|nicotine|vaping|vape|cigarette|cigarettes|caffeine|stimulant|stimulants|opioid|opioids)\b/],
  },
  {
    tag: 'safety',
    phrases: ['feel unsafe', 'felt unsafe', 'not safe', 'in danger', 'harm myself', 'harm someone', 'suicidal thoughts'],
    patterns: [/\b(?:unsafe|suicidal)\b/],
  },
  {
    tag: 'social',
    phrases: ['avoiding people', 'spent time with people'],
    patterns: [/\b(?:lonely|loneliness|isolated|isolation|socialising|socializing)\b/],
  },
  {
    tag: 'coping',
    phrases: ['what helped', 'helped me', 'grounding exercise', 'breathing exercise'],
    patterns: [/\b(?:coping|grounding|calmed|soothed)\b/],
  },
  {
    tag: 'progress',
    phrases: ['managed to', 'went well', 'small win'],
    patterns: [/\b(?:proud|achieved|achievement|accomplished|progress|grateful)\b/],
  },
] as const

export const journalTagSuggestionLimit = 8

const normaliseTag = (tag: string) => tag.trim().replace(/\s+/g, ' ')

const tagKey = (tag: string) => normaliseTag(tag).toLowerCase()

const normaliseContent = (content: string) =>
  content
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/&/g, ' and ')
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const escapeRegularExpression = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const containsPhrase = (content: string, phraseValue: string) => {
  const phrase = escapeRegularExpression(normaliseContent(phraseValue)).replace(/\s+/g, '\\s+')
  return new RegExp(`(^|[^a-z0-9])${phrase}(?=$|[^a-z0-9])`).test(content)
}

const ruleScore = (content: string, rule: JournalTagRule) => {
  const phraseMatches = rule.phrases.filter((phrase) => containsPhrase(content, phrase)).length
  const patternMatches = rule.patterns?.filter((pattern) => pattern.test(content)).length ?? 0
  return phraseMatches + patternMatches
}

export const splitJournalTags = (value: string) =>
  value
    .split(',')
    .map(normaliseTag)
    .filter(Boolean)

export const mergeJournalTags = (...tagGroups: readonly string[][]) => {
  const seen = new Set<string>()

  return tagGroups.flat().filter((tag) => {
    const key = tagKey(tag)
    if (!key || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export const suggestJournalTags = (content: string, existingTags: readonly string[] = []) => {
  const existing = new Set(existingTags.map(tagKey))
  const normalisedContent = normaliseContent(content)

  if (!normalisedContent) return []

  return journalTagRules
    .map((rule, index) => ({ rule, index, score: ruleScore(normalisedContent, rule) }))
    .filter(({ rule, score }) => score > 0 && !existing.has(tagKey(rule.tag)))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, journalTagSuggestionLimit)
    .map(({ rule }) => rule.tag)
}
