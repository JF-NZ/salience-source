export const primaryNavigationItems = [
  { view: 'home', label: 'Home' },
  { view: 'sleep', label: 'Sleep' },
  { view: 'checkin', label: 'Evening check-in' },
  { view: 'treatment', label: 'Treatment' },
  { view: 'journal', label: 'Journal' },
  { view: 'medication', label: 'Medication' },
  { view: 'quotes', label: 'Quotes' },
  { view: 'trends', label: 'Trends' },
  { view: 'report', label: 'Report' },
  { view: 'settings', label: 'Settings' },
] as const

export type PrimaryNavigationView = (typeof primaryNavigationItems)[number]['view']
