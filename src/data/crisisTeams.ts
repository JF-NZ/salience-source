export interface CrisisTeamOption {
  id: string
  region: string
  service: string
  phone: string
  notes?: string
}

export interface CrisisTeamGpsHint {
  latitude: number
  longitude: number
}

export const healthNzCrisisTeamsSourceUrl =
  'https://www.healthnz.govt.nz/health-topics/mental-health/crisis-assessment-teams'

export const healthNzCrisisTeamsLastUpdated = '3 February 2026'

export const crisisTeamOptions: CrisisTeamOption[] = [
  {
    id: 'auckland-central',
    region: 'Auckland',
    service: 'Auckland Central',
    phone: '0800 800 717',
  },
  {
    id: 'auckland-east-south',
    region: 'Auckland',
    service: 'Auckland East and South',
    phone: '09 261 3700 or freephone 0800 775 222',
  },
  {
    id: 'auckland-henderson',
    region: 'Auckland',
    service: 'Henderson',
    phone: '09 822 8501',
  },
  {
    id: 'auckland-north-shore',
    region: 'Auckland',
    service: 'North Shore',
    phone: '09 486 8900',
  },
  {
    id: 'auckland-rodney',
    region: 'Auckland',
    service: 'Rodney',
    phone: '09 427 0360',
  },
  {
    id: 'bay-of-plenty-tauranga',
    region: 'Bay of Plenty',
    service: 'Tauranga',
    phone: '0800 800 508',
  },
  {
    id: 'bay-of-plenty-whakatane',
    region: 'Bay of Plenty',
    service: 'Whakatāne',
    phone: '0800 77 4545',
  },
  {
    id: 'canterbury',
    region: 'Canterbury',
    service: 'Canterbury',
    phone: '0800 920 092',
  },
  {
    id: 'hawkes-bay',
    region: "Hawke's Bay",
    service: "Hawke's Bay",
    phone: '0800 112 334',
  },
  {
    id: 'manawatu-whanganui-palmerston-north',
    region: 'Manawatū-Whanganui',
    service: 'Palmerston North',
    phone: '0800 653 357',
  },
  {
    id: 'manawatu-whanganui-whanganui',
    region: 'Manawatū-Whanganui',
    service: 'Whanganui',
    phone: '0800 653 358',
  },
  {
    id: 'nelson-marlborough-tasman-golden-bay',
    region: 'Nelson, Marlborough and Tasman',
    service: 'Golden Bay',
    phone: '0800 776 364',
  },
  {
    id: 'nelson-marlborough-tasman-marlborough',
    region: 'Nelson, Marlborough and Tasman',
    service: 'Marlborough',
    phone: '0800 948 497',
  },
  {
    id: 'nelson-marlborough-tasman-nelson',
    region: 'Nelson, Marlborough and Tasman',
    service: 'Nelson',
    phone: '0800 776 364',
  },
  {
    id: 'northland-kaipara',
    region: 'Northland',
    service: 'Kaipara',
    phone: '09 439 3330 extension 65401',
    notes: 'Hours: 8am to 4:30pm, Monday to Friday. After hours: 0800 223 371.',
  },
  {
    id: 'northland-mid-north',
    region: 'Northland',
    service: 'Mid North',
    phone: '0800 643 647',
    notes: 'Hours: 8am to 4:30pm, Monday to Friday. After hours: 0800 223 371.',
  },
  {
    id: 'northland-whangarei',
    region: 'Northland',
    service: 'Whangārei',
    phone: '09 430 4101 extension 3537',
    notes: 'Hours: 8am to 4:30pm, Monday to Friday. After hours: 0800 223 371.',
  },
  {
    id: 'otago-southland-otago',
    region: 'Otago and Southland',
    service: 'Otago',
    phone: '0800 467 846 and press 2',
  },
  {
    id: 'otago-southland-southland',
    region: 'Otago and Southland',
    service: 'Southland',
    phone: '0800 467 846 and press 1',
  },
  {
    id: 'rotorua-taupo',
    region: 'Rotorua and Taupō',
    service: 'Rotorua and Taupō',
    phone: '0800 166 167',
  },
  {
    id: 'south-canterbury',
    region: 'South Canterbury',
    service: 'South Canterbury',
    phone: '0800 277 997',
  },
  {
    id: 'tairawhiti',
    region: 'Tairāwhiti',
    service: 'Tairāwhiti',
    phone: '0800 243 500',
    notes: 'After 10pm: 06 869 0512.',
  },
  {
    id: 'taranaki',
    region: 'Taranaki',
    service: 'Taranaki',
    phone: '0508 292 467',
  },
  {
    id: 'waikato',
    region: 'Waikato',
    service: 'Waikato',
    phone: '0800 505 050',
  },
  {
    id: 'wairarapa',
    region: 'Wairarapa',
    service: 'Wairarapa',
    phone: '0508 432 432',
  },
  {
    id: 'wellington-hutt-kapiti',
    region: 'Wellington, Hutt and Kapiti',
    service: 'Wellington, Hutt and Kapiti',
    phone: '0800 745 477',
  },
  {
    id: 'west-coast',
    region: 'West Coast',
    service: 'West Coast',
    phone: '0800 757 678',
  },
]

// Approximate service-area points used only for local nearest-team selection.
// They are not precise boundaries and are never saved with a user's data.
export const crisisTeamGpsHints: Record<string, CrisisTeamGpsHint> = {
  'auckland-central': { latitude: -36.8485, longitude: 174.7633 },
  'auckland-east-south': { latitude: -36.95, longitude: 174.9 },
  'auckland-henderson': { latitude: -36.87, longitude: 174.63 },
  'auckland-north-shore': { latitude: -36.78, longitude: 174.75 },
  'auckland-rodney': { latitude: -36.42, longitude: 174.66 },
  'bay-of-plenty-tauranga': { latitude: -37.6878, longitude: 176.1651 },
  'bay-of-plenty-whakatane': { latitude: -37.9586, longitude: 176.9858 },
  canterbury: { latitude: -43.5321, longitude: 172.6362 },
  'hawkes-bay': { latitude: -39.4928, longitude: 176.912 },
  'manawatu-whanganui-palmerston-north': { latitude: -40.3564, longitude: 175.611 },
  'manawatu-whanganui-whanganui': { latitude: -39.93, longitude: 175.05 },
  'nelson-marlborough-tasman-golden-bay': { latitude: -40.85, longitude: 172.8 },
  'nelson-marlborough-tasman-marlborough': { latitude: -41.5134, longitude: 173.961 },
  'nelson-marlborough-tasman-nelson': { latitude: -41.2706, longitude: 173.284 },
  'northland-kaipara': { latitude: -35.94, longitude: 173.88 },
  'northland-mid-north': { latitude: -35.407, longitude: 173.8 },
  'northland-whangarei': { latitude: -35.725, longitude: 174.323 },
  'otago-southland-otago': { latitude: -45.8788, longitude: 170.5028 },
  'otago-southland-southland': { latitude: -46.4132, longitude: 168.3538 },
  'rotorua-taupo': { latitude: -38.41, longitude: 176.16 },
  'south-canterbury': { latitude: -44.396, longitude: 171.254 },
  tairawhiti: { latitude: -38.6623, longitude: 178.0176 },
  taranaki: { latitude: -39.057, longitude: 174.075 },
  waikato: { latitude: -37.787, longitude: 175.279 },
  wairarapa: { latitude: -40.95, longitude: 175.657 },
  'wellington-hutt-kapiti': { latitude: -41.2866, longitude: 174.7756 },
  'west-coast': { latitude: -42.45, longitude: 171.21 },
}
