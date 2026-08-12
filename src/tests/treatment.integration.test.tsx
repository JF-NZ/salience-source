// @vitest-environment jsdom

import 'fake-indexeddb/auto'
import { act, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { primaryNavigationItems } from '../data/navigation'
import { treatmentPrograms } from '../data/treatmentContent'
import { TreatmentPage } from '../TreatmentPage'
import { localDateKey, previousDateKey } from '../lib/dates'
import {
  createExportBundle,
  db,
  deleteTreatmentData,
  ensureSeedData,
  importExportBundle,
  readAllData,
} from '../storage/db'
import type {
  BenzodiazepineEntry,
  EveningCheckIn,
  SleepEntry,
  TreatmentActivity,
  TreatmentNightmareEntry,
  TreatmentProgramPlan,
  TreatmentResponse,
  TreatmentReview,
  TreatmentSession,
  Quote,
} from '../types'

const reactTestGlobal = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}
reactTestGlobal.IS_REACT_ACT_ENVIRONMENT = true

let root: Root | undefined

const flush = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

const waitFor = async (assertion: () => void, timeoutMs = 4000) => {
  const startedAt = Date.now()
  let lastError: unknown

  while (Date.now() - startedAt < timeoutMs) {
    try {
      assertion()
      return
    } catch (error) {
      lastError = error
      await flush()
    }
  }

  throw lastError
}

const render = async (element: ReactElement) => {
  const container = document.createElement('div')
  document.body.replaceChildren(container)
  root = createRoot(container)
  await act(async () => {
    root?.render(element)
  })
  await flush()
  return container
}

const normalizedText = (element: Element) =>
  element.textContent?.replace(/\s+/g, ' ').trim() ?? ''

const findButton = (label: string, container: ParentNode = document) => {
  const button = [...container.querySelectorAll('button')].find((item) =>
    normalizedText(item) === label || item.getAttribute('aria-label') === label)
  expect(button, `Expected button "${label}"`).toBeTruthy()
  return button as HTMLButtonElement
}

const findButtonContaining = (label: string, container: ParentNode = document) => {
  const button = [...container.querySelectorAll('button')].find((item) =>
    normalizedText(item).includes(label))
  expect(button, `Expected a button containing "${label}"`).toBeTruthy()
  return button as HTMLButtonElement
}

const click = async (element: HTMLElement) => {
  await act(async () => {
    element.click()
  })
  await flush()
}

const dispatchPointer = async (element: HTMLElement, type: string, clientX: number, clientY: number) => {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperties(event, {
    button: { value: 0 },
    clientX: { value: clientX },
    clientY: { value: clientY },
    pointerId: { value: 1 },
    pointerType: { value: 'touch' },
  })
  await act(async () => {
    element.dispatchEvent(event)
  })
  await flush()
}

const expectHeading = (label: string) => {
  const heading = [...document.querySelectorAll('h1, h2, h3')].find((item) =>
    normalizedText(item) === label)
  expect(heading, `Expected heading "${label}"`).toBeTruthy()
}

const selectRadio = async (name: string, value: boolean) => {
  const input = document.querySelector<HTMLInputElement>(
    `input[type="radio"][name="${name}"][value="${String(value)}"]`,
  )
  expect(input, `Expected ${name}=${String(value)}`).toBeTruthy()
  await click(input!)
}

const openProgram = async (programName: string) => {
  const heading = [...document.querySelectorAll('h3')].find((item) =>
    normalizedText(item) === programName)
  expect(heading).toBeTruthy()
  const card = heading?.closest('section')
  expect(card).toBeTruthy()
  const action = [...card!.querySelectorAll('button')].find((item) =>
    ['Start pathway', 'Continue pathway', 'Review pathway'].some((label) => normalizedText(item).includes(label)))
  expect(action, `Expected a pathway action for ${programName}`).toBeTruthy()
  await click(action as HTMLButtonElement)
  await waitFor(() => expectHeading(programName))
}

beforeEach(async () => {
  vi.stubGlobal('confirm', vi.fn(() => true))
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
  Object.defineProperty(window, 'scrollTo', {
    configurable: true,
    value: vi.fn(),
  })
  await db.delete()
  await db.open()
  await ensureSeedData()
})

afterEach(async () => {
  if (root) {
    await act(async () => {
      root?.unmount()
    })
    root = undefined
  }
  await flush()
  await new Promise((resolve) => setTimeout(resolve, 20))
  document.body.replaceChildren()
  vi.unstubAllGlobals()
  await db.delete()
})

describe('quote seed cleanup', () => {
  it('removes retired and non-gender-neutral built-in quotes while preserving user-added quotes', async () => {
    const retiredQuotes: Quote[] = [
      {
        id: 'legacy-salience-quote',
        text: 'Generated text',
        author: 'Salience',
        category: 'CALM',
        tags: ['legacy'],
        isUserAdded: false,
        createdAt: '2026-06-08T00:00:00.000Z',
      },
      {
        id: 'legacy-inspired-quote',
        text: 'Inspired text',
        author: 'Gabor Mate-inspired reflection',
        category: 'RECOVERY',
        tags: ['legacy'],
        isUserAdded: false,
        createdAt: '2026-06-08T00:00:00.000Z',
      },
      {
        id: 'seneca-kindness-now',
        text: 'While we are among men let us cultivate kindness.',
        author: 'Seneca',
        category: 'SHAME_AND_SELF_FORGIVENESS',
        tags: ['legacy'],
        isUserAdded: false,
        createdAt: '2026-06-08T00:00:00.000Z',
      },
      {
        id: 'user-salience-quote',
        text: 'A personal quote',
        author: 'Salience',
        category: 'CALM',
        tags: ['custom'],
        isUserAdded: true,
        createdAt: '2026-06-08T00:00:00.000Z',
      },
    ]

    await db.quotes.bulkPut(retiredQuotes)
    await db.dailyQuoteState.put({
      date: '2026-06-08',
      quoteId: 'legacy-salience-quote',
      manuallyRefreshed: true,
    })
    await ensureSeedData()

    expect(await db.quotes.get('legacy-salience-quote')).toBeUndefined()
    expect(await db.quotes.get('legacy-inspired-quote')).toBeUndefined()
    expect(await db.quotes.get('seneca-kindness-now')).toBeUndefined()
    expect(await db.quotes.get('user-salience-quote')).toEqual(retiredQuotes[3])
    expect(await db.dailyQuoteState.get('2026-06-08')).toBeUndefined()
  })
})

describe('rendered Treatment workflows', () => {
  it('uses a simple unfilled scored circle for Medication navigation', async () => {
    await render(<App />)
    await waitFor(() => findButton('Medication'))

    const medicationButton = [...document.querySelectorAll('button')].find((item) =>
      item.getAttribute('aria-label') === 'Medication')
    const icon = medicationButton?.querySelector('svg')

    expect(icon?.querySelectorAll('circle')).toHaveLength(1)
    expect(icon?.querySelector('circle')?.getAttribute('fill')).toBe('none')
    expect(icon?.querySelectorAll('path')).toHaveLength(1)
    expect(icon?.querySelector('path')?.getAttribute('d')).toBe('M12 4.5V19.5')
  })

  it('keeps Treatment reachable and selected from every primary destination', async () => {
    await render(<App />)
    await waitFor(() => {
      expect(document.querySelector('main')).toBeTruthy()
      expect(findButton('Treatment')).toBeTruthy()
    })

    for (const destination of primaryNavigationItems.filter((item) => item.view !== 'treatment')) {
      const destinationButton = [...document.querySelectorAll('button')].find((item) =>
        item.getAttribute('aria-label') === destination.label
        || item.getAttribute('aria-label') === `${destination.label}, selected`)
      expect(destinationButton, `Expected ${destination.label} navigation`).toBeTruthy()
      await click(destinationButton as HTMLButtonElement)
      expect(
        [...document.querySelectorAll('button[aria-current="page"]')]
          .some((item) => item.getAttribute('aria-label') === `${destination.label}, selected`),
      ).toBe(true)

      const treatmentButton = [...document.querySelectorAll('button')].find((item) =>
        item.getAttribute('aria-label') === 'Treatment'
        || item.getAttribute('aria-label') === 'Treatment, selected')
      expect(treatmentButton).toBeTruthy()
      await click(treatmentButton as HTMLButtonElement)
      await waitFor(() => expectHeading('Treatment'))
      expect(
        [...document.querySelectorAll('button[aria-current="page"]')]
          .some((item) => item.getAttribute('aria-label') === 'Treatment, selected'),
      ).toBe(true)
    }

    expect([...document.querySelectorAll('h3')].map(normalizedText).filter((name) =>
      [
        'Trauma-Focused CBT Foundations',
        'Cognitive Processing Therapy',
        'Prolonged Exposure',
        'EMDR',
      ].includes(name))).toEqual([
      'Trauma-Focused CBT Foundations',
      'Cognitive Processing Therapy',
      'Prolonged Exposure',
      'EMDR',
    ])
  })

  it('logs benzodiazepine tablet quarters and shows the daily total', async () => {
    await render(<App />)
    await waitFor(() => findButton('Medication'))
    await click(findButton('Medication'))
    await waitFor(() => expectHeading('Medication'))

    await click(findButton('1/4 tablet quarter'))
    await click(findButton('2/4 tablet quarter'))
    await click(findButton('Save medication entry'))
    await waitFor(() => expect(document.body.textContent).toContain('Medication entry saved.'))

    const entries = await db.benzodiazepineEntries.toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0].quarterUnits).toBe(2)
    expect(document.body.textContent).toContain('Taken today')
    await waitFor(() => expect(document.body.textContent).toContain('1/2 tablet'))
    expect(document.body.textContent).toContain('Medication use over time')
    expect(findButton('14 days').getAttribute('aria-pressed')).toBe('true')
    const medicationLine = document.querySelector('svg[aria-label="Clonazepam daily use line graph. Each tablet point is selectable."]')
    expect(medicationLine?.querySelector('path')).toBeTruthy()
    await click(findButton('7 days'))
    expect(findButton('7 days').getAttribute('aria-pressed')).toBe('true')

    await click(findButton('Edit'))
    await waitFor(() => expect(document.body.textContent).toContain('Editing the medication entry'))
    await click(findButton('Cancel edit'))
    await click(findButton('Remove'))
    await waitFor(() => expect(document.body.textContent).toContain('Medication entry removed.'))
    expect(await db.benzodiazepineEntries.count()).toBe(0)
  })

  it('keeps separate timed doses visible and stores the configured tablet amount with each entry', async () => {
    const now = new Date().toISOString()
    const today = localDateKey()
    await db.appSettings.update('app', {
      benzodiazepineMedication: 'CLONAZEPAM',
      benzodiazepineTabletMgByMedication: { CLONAZEPAM: 2 },
      updatedAt: now,
    })
    await db.benzodiazepineEntries.bulkPut([
      {
        id: 'morning-clonazepam',
        medication: 'CLONAZEPAM',
        date: today,
        takenAt: `${today}T08:00:00`,
        quarterUnits: 2,
        wholeTabletMg: 2,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'afternoon-clonazepam',
        medication: 'CLONAZEPAM',
        date: today,
        takenAt: `${today}T13:00:00`,
        quarterUnits: 2,
        wholeTabletMg: 2,
        createdAt: now,
        updatedAt: now,
      },
    ])

    await render(<App />)
    await waitFor(() => findButton('Medication'))
    await click(findButton('Medication'))
    await waitFor(() => expectHeading('Medication'))

    const doseMarkers = [...document.querySelectorAll<HTMLElement>('[role="listitem"]')]
      .filter((item) => item.getAttribute('aria-label')?.startsWith('Clonazepam: 1/2 tablet'))

    expect(doseMarkers).toHaveLength(2)
    const doseTimes = doseMarkers.map(normalizedText)
    expect(doseTimes.every(Boolean)).toBe(true)
    expect(new Set(doseTimes).size).toBe(2)
    expect(doseMarkers.every((item) => item.getAttribute('aria-label')?.includes(' at '))).toBe(true)
    expect(document.body.textContent).toContain('1 tablet - 2 mg')
    expect([...document.querySelectorAll<HTMLElement>('[role="listitem"]')]
      .map((item) => item.getAttribute('aria-label'))
      .filter((label) => label?.includes('Clonazepam: 1/2 tablet')))
      .toHaveLength(2)
  })

  it('shows only today’s medication entries until older dates are expanded', async () => {
    const now = new Date().toISOString()
    const today = localDateKey()
    const yesterday = previousDateKey()
    await db.benzodiazepineEntries.bulkPut([
      { id: 'medication-today', date: today, takenAt: `${today}T10:00:00.000Z`, quarterUnits: 1, createdAt: now, updatedAt: now },
      { id: 'medication-yesterday', date: yesterday, takenAt: `${yesterday}T10:00:00.000Z`, quarterUnits: 2, createdAt: now, updatedAt: now },
    ])

    await render(<App />)
    await waitFor(() => findButton('Medication'))
    await click(findButton('Medication'))
    await waitFor(() => expectHeading('Medication'))

    expect(document.body.textContent).toContain(today)
    expect(document.body.textContent).not.toContain(yesterday)
    await click(findButton('Show more dates'))
    expect(document.body.textContent).toContain(yesterday)
    expect(findButton('Show fewer dates')).toBeTruthy()
  })

  it('shows up to date when last-night sleep and a completed evening check-in are logged', async () => {
    const now = new Date().toISOString()
    const today = localDateKey()
    const yesterday = previousDateKey()
    await Promise.all([
      db.sleepEntries.put({
        id: 'sleep-complete-home-status',
        date: yesterday,
        durationCategory: 'SEVEN_TO_EIGHT',
        quality: 'GOOD',
        disruptions: ['NONE'],
        createdAt: now,
        updatedAt: now,
      }),
      db.eveningCheckIns.put({
        id: 'evening-complete-home-status',
        date: today,
        moodRating: '3',
        anxietySeverity: 'MODERATE',
        anxietyContributors: [],
        depressionSeverity: 'MILD',
        depressionSymptoms: [],
        depressionContributors: [],
        suspiciousness: 'NOT_AT_ALL',
        unusualMeanings: 'NOT_AT_ALL',
        beliefCertainty: 'NOT_APPLICABLE',
        perceptualExperiences: ['NONE'],
        thinkingClarity: 'CLEAR',
        realityCheck: 'NOT_APPLICABLE',
        functioning: [],
        status: 'COMPLETE',
        createdAt: now,
        updatedAt: now,
      }),
    ])

    await render(<App />)
    await waitFor(() => expect(document.body.textContent).toContain("You're up to date for today."))
    expect(document.body.textContent).not.toContain('complete a quick check-in')
  })

  it('refreshes an untouched medication timestamp when the app returns to the foreground', async () => {
    const RealDate = Date
    let currentTime = new RealDate(2026, 7, 5, 8, 7)
    class ControlledDate extends RealDate {
      constructor(value?: string | number | Date) {
        super(value ?? currentTime)
      }

      static now() {
        return currentTime.getTime()
      }
    }

    vi.stubGlobal('Date', ControlledDate)
    await render(<App />)
    await waitFor(() => findButton('Medication'))
    await click(findButton('Medication'))
    await waitFor(() => expectHeading('Medication'))

    const timestamp = document.querySelector<HTMLInputElement>('input[type="datetime-local"]')
    expect(timestamp?.value).toBe('2026-08-05T08:00')

    currentTime = new RealDate(2026, 7, 5, 10, 22)
    await act(async () => {
      window.dispatchEvent(new Event('focus'))
    })
    expect(timestamp?.value).toBe('2026-08-05T10:15')
  })

  it('preserves a manually selected medication timestamp when the app returns to the foreground', async () => {
    await render(<App />)
    await waitFor(() => findButton('Medication'))
    await click(findButton('Medication'))
    await waitFor(() => expectHeading('Medication'))

    const timestamp = document.querySelector<HTMLInputElement>('input[type="datetime-local"]')
    expect(timestamp).toBeTruthy()
    await act(async () => {
      timestamp!.value = '2026-08-01T09:30'
      timestamp!.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await flush()

    await act(async () => {
      window.dispatchEvent(new Event('focus'))
    })
    expect(timestamp?.value).toBe('2026-08-01T09:30')
  })

  it('shows existing sleep and evening values in Quick Check-In and creates one editable nightmare entry from Sleep', async () => {
    const now = new Date().toISOString()
    const today = localDateKey()
    const sleepEntry: SleepEntry = {
      id: 'sleep-for-quick-check-in',
      date: today,
      durationCategory: 'SEVEN_TO_EIGHT',
      quality: 'GOOD',
      disruptions: ['NONE'],
      createdAt: now,
      updatedAt: now,
    }
    const eveningCheckIn: EveningCheckIn = {
      id: 'evening-for-quick-check-in',
      date: today,
      moodRating: '3',
      anxietySeverity: 'MODERATE',
      anxietyContributors: [],
      depressionSeverity: 'MILD',
      depressionSymptoms: [],
      depressionContributors: [],
      suspiciousness: 'SLIGHTLY',
      unusualMeanings: 'NOT_AT_ALL',
      beliefCertainty: 'NOT_APPLICABLE',
      perceptualExperiences: ['NONE'],
      thinkingClarity: 'CLEAR',
      realityCheck: 'NOT_APPLICABLE',
      functioning: [],
      status: 'COMPLETE',
      createdAt: now,
      updatedAt: now,
    }
    await Promise.all([
      db.sleepEntries.put(sleepEntry),
      db.eveningCheckIns.put(eveningCheckIn),
    ])

    await render(<App />)
    await waitFor(() => findButtonContaining('Quick Check-In'))
    await click(findButtonContaining('Quick Check-In'))
    await waitFor(() => expectHeading('Quick Check-In'))

    expect(document.body.textContent).toContain('Entry exists 7-8 hours')
    expect(document.body.textContent).toContain('Entry exists 3 - Okay')
    expect(document.body.textContent).toContain('Entry exists Moderate')
    expect(document.body.textContent).toContain('Entry exists Mild')
    expect(document.body.textContent).toContain('Entry exists Suspiciousness: Slightly')

    await click(findButton('Sleep'))
    await waitFor(() => expectHeading('Sleep last night'))
    const sleepDate = document.querySelector<HTMLInputElement>('input[type="date"]')
    expect(sleepDate).toBeTruthy()
    await act(async () => {
      sleepDate!.value = sleepEntry.date
      sleepDate!.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await flush()
    await waitFor(() => findButton('Update sleep entry'))
    await click(findButton('Nightmares'))
    await click(findButton('Update sleep entry'))
    await waitFor(() => expect(document.body.textContent).toContain('A nightmare entry was added to your Nightmare log.'))

    const nightmares = await db.nightmareEntries.toArray()
    expect(nightmares).toHaveLength(1)
    expect(nightmares[0]).toMatchObject({ sleepEntryId: sleepEntry.id, intensity: 'MODERATE' })

    await click(findButton('Update sleep entry'))
    await waitFor(() => expect(document.body.textContent).toContain('Sleep entry saved.'))
    expect(await db.nightmareEntries.count()).toBe(1)

    await click(findButton('Home'))
    await click(findButtonContaining('Log Nightmare'))
    await waitFor(() => expectHeading('Log Nightmare'))
    expect(document.body.textContent).toContain('From sleep entry')

    await click(findButton('Edit'))
    await waitFor(() => expect(document.body.textContent).toContain('This generic nightmare entry was added from your sleep entry.'))
  })

  it('saves the five-point evening mood rating', async () => {
    await render(<App />)
    await waitFor(() => findButton('Evening check-in'))
    await click(findButton('Evening check-in'))
    await waitFor(() => expectHeading('Evening Check-In'))

    expect(document.body.textContent).toContain('How was your mood today?')
    await click(findButton('5 - Great'))
    await click(findButton('Save check-in'))
    await waitFor(() => expect(document.body.textContent).toContain('Check in saved.'))

    const entry = await db.eveningCheckIns.where('date').equals(localDateKey()).first()
    expect(entry?.moodRating).toBe('5')
  })

  it('offers Medication as a quick destination from Settings', async () => {
    await render(<App />)
    await waitFor(() => findButton('Settings'))
    await click(findButton('Settings'))
    await waitFor(() => expectHeading('Settings'))

    await click(findButton('Open medication'))
    await waitFor(() => expectHeading('Medication'))
  })

  it('saves a whole-tablet amount for the selected medication', async () => {
    await render(<App />)
    await waitFor(() => findButton('Settings'))
    await click(findButton('Settings'))
    await waitFor(() => expectHeading('Settings'))

    const tabletAmount = document.querySelector<HTMLInputElement>(
      'input[aria-label="Whole Clonazepam tablet amount in mg"]',
    )
    expect(tabletAmount).toBeTruthy()
    const nativeValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    expect(nativeValueSetter).toBeTruthy()
    await act(async () => {
      nativeValueSetter!.call(tabletAmount, '2')
      tabletAmount!.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await flush()
    await click(findButton('Save tablet amount'))
    await waitFor(() => expect(document.body.textContent).toContain('Whole Clonazepam tablet amount saved.'))

    expect((await db.appSettings.get('app'))?.benzodiazepineTabletMgByMedication).toMatchObject({
      CLONAZEPAM: 2,
    })
  })

  it('uses the selected two-half Lorazepam tablet without changing saved Clonazepam entries', async () => {
    const now = new Date().toISOString()
    await db.benzodiazepineEntries.put({
      id: 'legacy-generic-benzodiazepine',
      medication: 'CLONAZEPAM',
      takenAt: now,
      date: localDateKey(),
      quarterUnits: 1,
      createdAt: now,
      updatedAt: now,
    })

    await render(<App />)
    await waitFor(() => findButton('Settings'))
    await click(findButton('Settings'))
    await waitFor(() => findButton('Lorazepam'))
    await click(findButton('Lorazepam'))
    await waitFor(() => expect(document.body.textContent).toContain('Lorazepam selected for new medication entries.'))
    await click(findButton('Open medication'))
    await waitFor(() => expectHeading('Medication'))

    expect(document.querySelector('[aria-label="Select Lorazepam tablet portions"]')).toBeTruthy()
    expect(findButton('1/2 tablet half')).toBeTruthy()
    expect(findButton('2/2 tablet half')).toBeTruthy()
    expect(document.body.textContent).toContain('Clonazepam - 1/4 tablet')

    await click(findButton('1/2 tablet half'))
    await click(findButton('2/2 tablet half'))
    await click(findButton('Save medication entry'))
    await waitFor(() => expect(document.body.textContent).toContain('Medication entry saved.'))

    const savedEntries = await db.benzodiazepineEntries.orderBy('takenAt').toArray()
    expect(savedEntries).toHaveLength(2)
    expect(savedEntries.find((entry) => entry.medication === 'LORAZEPAM')).toMatchObject({
      medication: 'LORAZEPAM',
      quarterUnits: 2,
    })
  })

  it('allows user-added support contacts to be removed', async () => {
    const now = new Date().toISOString()
    await db.supportContacts.put({
      id: 'custom-support-contact',
      name: 'Test support',
      role: 'Trusted support',
      phone: '021 000 0000',
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    })

    await render(<App />)
    await waitFor(() => findButton('Settings'))
    await click(findButton('Settings'))
    await waitFor(() => findButton('Remove Test support'))
    await click(findButton('Remove Test support'))

    expect(await db.supportContacts.get('custom-support-contact')).toBeUndefined()
    await waitFor(() => expect(document.body.textContent).toContain('Support contact removed.'))
  })

  it('removes a redundant seeded crisis contact after local team configuration', async () => {
    const generic = (await db.supportContacts.get('support-crisis-team'))!
    await db.supportContacts.put({
      ...generic,
      name: 'Canterbury crisis team',
      phone: '0800 920 092',
      updatedAt: new Date().toISOString(),
    })

    await ensureSeedData()

    expect(await db.supportContacts.get('support-crisis-team-canterbury')).toBeUndefined()
    expect(await db.supportContacts.get('support-crisis-team')).toMatchObject({ phone: '0800 920 092' })
  })

  it('adds and removes multiple tablet quarters with a drag gesture', async () => {
    await render(<App />)
    await waitFor(() => findButton('Medication'))
    await click(findButton('Medication'))
    await waitFor(() => expectHeading('Medication'))

    const tablet = document.querySelector('[aria-label="Select tablet quarters"]') as HTMLDivElement
    expect(tablet).toBeTruthy()
    vi.spyOn(tablet, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 200,
      height: 200,
      right: 200,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect)
    Object.defineProperty(tablet, 'setPointerCapture', { value: vi.fn() })
    Object.defineProperty(tablet, 'hasPointerCapture', { value: vi.fn(() => true) })
    Object.defineProperty(tablet, 'releasePointerCapture', { value: vi.fn() })

    await dispatchPointer(tablet, 'pointerdown', 50, 50)
    await dispatchPointer(tablet, 'pointermove', 150, 50)
    await dispatchPointer(tablet, 'pointerup', 150, 50)
    expect(findButton('1/4 tablet quarter').getAttribute('aria-pressed')).toBe('true')
    expect(findButton('2/4 tablet quarter').getAttribute('aria-pressed')).toBe('true')

    await click(findButton('3/4 tablet quarter'))
    await click(findButton('4/4 tablet quarter'))
    await dispatchPointer(tablet, 'pointerdown', 50, 50)
    await dispatchPointer(tablet, 'pointermove', 150, 50)
    await dispatchPointer(tablet, 'pointermove', 150, 150)
    await dispatchPointer(tablet, 'pointerup', 150, 150)
    expect(findButton('1/4 tablet quarter').getAttribute('aria-pressed')).toBe('false')
    expect(findButton('2/4 tablet quarter').getAttribute('aria-pressed')).toBe('false')
    expect(findButton('3/4 tablet quarter').getAttribute('aria-pressed')).toBe('true')
    expect(findButton('4/4 tablet quarter').getAttribute('aria-pressed')).toBe('false')
  })

  it('offers a non-ranked comparison in the required program order', async () => {
    const data = await readAllData()
    await render(
      <TreatmentPage
        data={data}
        onChanged={async () => undefined}
        onExit={vi.fn()}
      />,
    )

    await click(findButton('Compare'))
    await waitFor(() => expectHeading('Compare treatment options'))
    const programNames = [
      'Trauma-Focused CBT Foundations',
      'Cognitive Processing Therapy',
      'Prolonged Exposure',
      'EMDR',
    ]
    expect([...document.querySelectorAll('h2')].map(normalizedText).filter((name) =>
      programNames.includes(name))).toEqual(programNames)
    expect(document.body.textContent).toContain('Not performed by Salience')
    expect(document.body.textContent).toContain('Salience pathway includes')
    expect(document.body.textContent).toContain('does not assess which treatment is suitable for you')
    expect(document.body.textContent).not.toMatch(/universally best|recommended for you/i)
  })

  it('shows raw clinician-supplied measure history without comparing changed scales', async () => {
    await db.treatmentReviews.bulkPut([
      {
        id: 'measure-one',
        programId: 'cpt',
        reviewDate: '2026-07-01',
        dailyFunctioning: 4,
        clinicianMeasureName: 'Example measure',
        clinicianMeasureScore: 18,
        clinicianMeasureMaximum: 40,
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      },
      {
        id: 'measure-two',
        programId: 'cpt',
        reviewDate: '2026-07-15',
        dailyFunctioning: 6,
        clinicianMeasureName: 'Example measure',
        clinicianMeasureScore: 32,
        clinicianMeasureMaximum: 80,
        createdAt: '2026-07-15T00:00:00.000Z',
        updatedAt: '2026-07-15T00:00:00.000Z',
      },
    ])
    const data = await readAllData()
    await render(
      <TreatmentPage
        data={data}
        onChanged={async () => undefined}
        onExit={vi.fn()}
      />,
    )

    await openProgram('Cognitive Processing Therapy')
    await click(findButton('Progress'))
    await waitFor(() => expectHeading('Clinician-supplied measure history'))
    expect(document.body.textContent).toContain('Latest 32/80')
    expect(document.body.textContent).toContain('18/40')
    expect(document.body.textContent).toContain('The recorded maximum changed. Values are kept separate and are not compared.')
    expect(document.body.textContent).toContain('without scoring, thresholds, percentages, or interpretation')
  })

  it('blocks a deliberately trauma-focused self-guided module when the current-state check raises concern', async () => {
    const data = await readAllData()
    const onExit = vi.fn()
    await render(
      <TreatmentPage
        data={data}
        onChanged={async () => undefined}
        onExit={onExit}
      />,
    )

    await openProgram('Prolonged Exposure')
    await click(findButtonContaining('My ordinary-life approach plan'))
    await waitFor(() => expectHeading('Before you continue'))

    await selectRadio('orientedToPresent', false)
    await selectRadio('ableToStop', true)
    await selectRadio('immediateDanger', false)
    await selectRadio('difficultyKnowingReality', false)
    await selectRadio('seriousHarmThoughts', false)
    await click(findButton('Continue'))

    await waitFor(() => expectHeading('Pause and ground'))
    expect(document.body.textContent).toContain('The exercise has stopped')
    expect(document.body.textContent).toContain('Your support plan')
    expect(document.body.textContent).not.toContain('Ordinary-life activity I choose')
    expect(onExit).not.toHaveBeenCalled()
  })

  it('opens excluded trauma procedures as information only without a clinician gate or procedural prompts', async () => {
    const data = await readAllData()
    await render(
      <TreatmentPage
        data={data}
        onChanged={async () => undefined}
        onExit={vi.fn()}
      />,
    )

    await openProgram('Prolonged Exposure')
    await click(findButtonContaining('About imaginal exposure'))
    await waitFor(() => expectHeading('About imaginal exposure'))
    expect(document.body.textContent).toContain('Information only')
    expect(document.body.textContent).toContain('no trauma-recall prompt')
    expect(document.body.textContent).not.toContain('Before you continue')
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('saves a draft before Pause and ground hides the active prompts', async () => {
    const data = await readAllData()
    await render(
      <TreatmentPage
        data={data}
        onChanged={async () => undefined}
        onExit={vi.fn()}
      />,
    )

    await openProgram('Trauma-Focused CBT Foundations')
    await click(findButtonContaining('Triggers and reminders'))
    await waitFor(() => expectHeading('Triggers and reminders'))
    await click(findButtonContaining('Save and continue'))
    await waitFor(() => {
      expect(document.body.textContent).toContain('What did you notice?')
    })

    await click(findButton('Pause and ground'))
    await waitFor(() => expectHeading('Pause and ground'))
    expect(document.body.textContent).not.toContain('What did you notice?')
    expect(await db.treatmentResponses.count()).toBe(1)
    expect((await db.treatmentResponses.toArray())[0].status).toBe('draft')
  })

  it('opens and saves a pathway-specific self-guided module with structured controls', async () => {
    const data = await readAllData()
    await render(
      <TreatmentPage
        data={data}
        onChanged={async () => undefined}
        onExit={vi.fn()}
      />,
    )

    await openProgram('Trauma-Focused CBT Foundations')
    await click(findButtonContaining('My present-orientation card'))
    await waitFor(() => expectHeading('My present-orientation card'))
    await click(findButtonContaining('Save and continue'))
    await waitFor(() => expect(document.body.textContent).toContain('Optional actions I choose when I need to orient'))
    expect(document.body.textContent).toContain('Optional actions I choose when I need to orient')
    expect(document.querySelectorAll('input[type="checkbox"]').length).toBeGreaterThan(0)

    await click(findButton('Save draft'))
    await waitFor(() => expect(document.body.textContent).toContain('Draft saved locally.'))
    expect(await db.treatmentResponses.where('moduleId').equals('orientation-card').count()).toBe(1)
  })

  it('uses saved CPT entry answers to guide the recommended starting module', async () => {
    const now = '2026-08-02T10:00:00.000Z'
    await db.treatmentResponses.bulkPut([
      {
        id: 'cpt-start-complete',
        programId: 'cpt',
        moduleId: 'treatment-start',
        values: {},
        hiddenPromptIds: [],
        clinicianAssigned: false,
        status: 'completed',
        lastStepIndex: 0,
        startedAt: now,
        completedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cpt-intake-complete',
        programId: 'cpt',
        moduleId: 'course-intake',
        values: { 'entry-point': 'examine' },
        hiddenPromptIds: [],
        clinicianAssigned: false,
        status: 'completed',
        lastStepIndex: 0,
        startedAt: now,
        completedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ])
    const data = await readAllData()
    await render(
      <TreatmentPage
        data={data}
        onChanged={async () => undefined}
        onExit={vi.fn()}
      />,
    )

    await openProgram('Cognitive Processing Therapy')
    await waitFor(() => expect(document.body.textContent).toContain('Starting focus from your course answers: Challenging beliefs worksheet.'))
    expect(document.body.textContent).toContain('Challenging beliefs worksheet')
  })

  it('reaches Nightmare Support from a program without opening trauma prompts', async () => {
    const data = await readAllData()
    await render(
      <TreatmentPage
        data={data}
        onChanged={async () => undefined}
        onExit={vi.fn()}
      />,
    )

    await openProgram('EMDR')
    await click(findButton('Nightmare support'))
    await waitFor(() => expectHeading('Nightmare support'))
    expect(document.body.textContent).toContain('I just woke from a nightmare')
    expect(document.body.textContent).not.toContain('Active EMDR reprocessing')
  })

  it('offers an explicit end-of-pathway completion action after every module is reviewed', async () => {
    const program = treatmentPrograms.find((item) => item.id === 'cpt')!
    const now = '2026-07-28T10:00:00.000Z'
    const seededProgress = (await db.treatmentProgress.get('progress'))!
    await Promise.all([
      db.treatmentResponses.bulkPut(program.modules.map((module) => ({
        id: `complete-${module.id}`,
        programId: program.id,
        moduleId: module.id,
        values: {},
        hiddenPromptIds: [],
        clinicianAssigned: false,
        status: 'completed' as const,
        lastStepIndex: 0,
        startedAt: now,
        completedAt: now,
        createdAt: now,
        updatedAt: now,
      } satisfies TreatmentResponse))),
      db.treatmentProgress.put({
        ...seededProgress,
        selectedPrograms: ['cpt'],
        programStatuses: { cpt: 'exploring' },
        updatedAt: now,
      }),
    ])

    await render(<App />)
    await waitFor(() => expect(findButton('Treatment')).toBeTruthy())
    await click(findButton('Treatment'))
    await waitFor(() => expectHeading('Treatment'))
    await openProgram('Cognitive Processing Therapy')
    await waitFor(() => expect(document.body.textContent).toContain('You reached the end of this pathway'))
    await click(findButton('Complete pathway'))
    await waitFor(() => expect((document.body.textContent ?? '')).toContain('Pathway marked complete on this device.'))
    expect((await db.treatmentProgress.get('progress'))?.programStatuses.cpt).toBe('completed')
    expect(document.body.textContent).toContain('Pathway complete')
  })
})

describe('rendered wellbeing trends', () => {
  it('uses metric-specific charts and keeps the selected day in sync with the heatmap', async () => {
    const yesterday = previousDateKey()
    const dayBefore = previousDateKey(new Date(`${yesterday}T12:00:00`))
    const now = new Date().toISOString()
    const sleepEntry: SleepEntry = {
      id: 'trend-sleep',
      date: dayBefore,
      durationCategory: 'SEVEN_TO_EIGHT',
      quality: 'GOOD',
      disruptions: ['NONE'],
      createdAt: now,
      updatedAt: now,
    }
    const eveningCheckIn: EveningCheckIn = {
      id: 'trend-evening',
      date: yesterday,
      moodRating: '4',
      anxietySeverity: 'NONE',
      anxietyContributors: [],
      depressionSeverity: 'MILD',
      depressionSymptoms: [],
      depressionContributors: [],
      suspiciousness: 'NOT_AT_ALL',
      unusualMeanings: 'NOT_AT_ALL',
      beliefCertainty: 'NOT_APPLICABLE',
      perceptualExperiences: ['NONE'],
      thinkingClarity: 'CLEAR',
      realityCheck: 'NOT_APPLICABLE',
      functioning: [],
      status: 'COMPLETE',
      createdAt: now,
      updatedAt: now,
    }
    const medicationEntry: BenzodiazepineEntry = {
      id: 'trend-medication',
      medication: 'CLONAZEPAM',
      date: yesterday,
      takenAt: `${yesterday}T08:00:00.000Z`,
      quarterUnits: 2,
      createdAt: now,
      updatedAt: now,
    }
    await Promise.all([
      db.sleepEntries.put(sleepEntry),
      db.eveningCheckIns.put(eveningCheckIn),
      db.benzodiazepineEntries.put(medicationEntry),
    ])

    await render(<App />)
    await waitFor(() => findButton('Trends'))
    await click(findButton('Trends'))
    await waitFor(() => expectHeading('Wellbeing trends'))

    expect(document.body.textContent).toContain('Sleep duration')
    expect(document.body.textContent).toContain('Sleep quality')
    expect(document.body.textContent).toContain('Anxiety and depression')
    expect(document.body.textContent).toContain('Events and observations')
    expect(document.body.textContent).toContain('Medication use over time')
    expect(document.body.textContent).not.toContain('Combined graph')

    const sleepChart = [...document.querySelectorAll('svg')].find((item) =>
      item.getAttribute('aria-label')?.startsWith('Sleep duration line graph'))
    expect(sleepChart).toBeTruthy()
    expect(sleepChart?.querySelector('path[stroke="#0f766e"]')).toBeTruthy()
    expect([...document.querySelectorAll('svg')].some((item) =>
      item.getAttribute('aria-label')?.startsWith('Clonazepam daily use line graph'))).toBe(true)
    await act(async () => {
      sleepChart?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowLeft' }))
    })
    await flush()
    expect(document.body.textContent).toContain('7.5 hrs (7-8 hours)')

    await click(findButton('Heatmap'))
    await waitFor(() => expect(document.body.textContent).toContain('Date matrix'))
    const heatmap = document.querySelector('[aria-label="Wellbeing heatmap"]')
    expect(heatmap?.querySelector('[aria-label="Heatmap metric labels"]')).toBeTruthy()
    expect(heatmap?.querySelector('[aria-label="Scrollable wellbeing values by date"]')).toBeTruthy()
    expect(heatmap?.querySelector('.sticky')).toBeNull()
    const sleepHeatmapCell = [...document.querySelectorAll('button')].find((item) =>
      item.getAttribute('aria-label')?.startsWith('Sleep, ') && item.getAttribute('aria-label')?.includes('7.5h'))
    expect(sleepHeatmapCell).toBeTruthy()
    await click(sleepHeatmapCell as HTMLButtonElement)
    expect(document.body.textContent).toContain('7.5 hrs (7-8 hours)')
  })
})

describe('rendered journal and reminders', () => {
  it('offers prompts for describing current struggles', async () => {
    await render(<App />)
    await waitFor(() => findButton('Journal'))
    await click(findButton('Journal'))
    await waitFor(() => expectHeading('Journal'))

    const promptOptions = [...document.querySelectorAll('option')].map(normalizedText)
    expect(promptOptions).toEqual(expect.arrayContaining([
      'What am I struggling with right now?',
      'What feels hardest about it?',
      'What seems to be making it harder?',
      'What would make this feel a little more manageable?',
    ]))
  })

  it('uses concise reminder status wording on the home screen', async () => {
    await db.appSettings.update('app', {
      notificationsEnabled: true,
      morningCheckInReminderEnabled: true,
      checkInReminderEnabled: true,
      sleepReminderEnabled: true,
      quoteReminderEnabled: false,
      updatedAt: new Date().toISOString(),
    })

    await render(<App />)
    await waitFor(() => expect(document.body.textContent).toContain('3 reminders active.'))
    expect(document.body.textContent).not.toContain('gentle reminders active')
  })
})

describe('Treatment persistence and deletion', () => {
  const now = '2026-07-28T10:00:00.000Z'
  const sleepEntry: SleepEntry = {
    id: 'sleep-kept',
    date: '2026-07-27',
    durationCategory: 'SEVEN_TO_EIGHT',
    quality: 'GOOD',
    disruptions: [],
    createdAt: now,
    updatedAt: now,
  }
  const activity: TreatmentActivity = {
    id: 'activity-delete',
    programId: 'cpt',
    title: 'Clinician-agreed worksheet',
    source: 'clinician-agreed',
    status: 'planned',
    createdAt: now,
    updatedAt: now,
  }
  const response: TreatmentResponse = {
    id: 'response-delete',
    programId: 'cpt',
    moduleId: 'abc',
    values: { belief: 'sensitive text' },
    hiddenPromptIds: [],
    clinicianAssigned: false,
    status: 'draft',
    lastStepIndex: 1,
    startedAt: now,
    createdAt: now,
    updatedAt: now,
  }
  const plan: TreatmentProgramPlan = {
    id: 'cpt',
    programId: 'cpt',
    goals: ['A private goal'],
    pacingPreference: 'between-appointments',
    createdAt: now,
    updatedAt: now,
  }
  const session: TreatmentSession = {
    id: 'session-delete',
    programId: 'cpt',
    appointmentAt: '2026-08-01T10:00:00.000Z',
    status: 'planned',
    createdAt: now,
    updatedAt: now,
  }
  const review: TreatmentReview = {
    id: 'review-delete',
    programId: 'cpt',
    reviewDate: '2026-07-28',
    dailyFunctioning: 5,
    createdAt: now,
    updatedAt: now,
  }
  const nightmare: TreatmentNightmareEntry = {
    id: 'nightmare-delete',
    timestamp: now,
    intensity: 7,
    themeTags: [],
    customTags: [],
    createdAt: now,
    updatedAt: now,
  }

  const seedTreatmentRecords = async () => {
    await Promise.all([
      db.sleepEntries.put(sleepEntry),
      db.treatmentActivities.put(activity),
      db.treatmentResponses.put(response),
      db.treatmentProgramPlans.put(plan),
      db.treatmentSessions.put(session),
      db.treatmentReviews.put(review),
      db.treatmentNightmares.put(nightmare),
    ])
  }

  it('persists first-use mode, program status, module progress, and chosen activities after reopening', async () => {
    const seededProgress = (await db.treatmentProgress.get('progress'))!
    const seededSettings = (await db.treatmentSettings.get('treatment'))!
    await Promise.all([
      db.treatmentActivities.put(activity),
      db.treatmentProgress.put({
        ...seededProgress,
        selectedPrograms: ['cpt'],
        programStatuses: { cpt: 'clinician-supported' },
        completedModules: ['cpt:abc'],
        lastOpenedProgram: 'cpt',
        lastOpenedPrograms: { cpt: now },
        clinicianSupportedMode: true,
        updatedAt: now,
      }),
      db.treatmentSettings.put({
        ...seededSettings,
        useMode: 'alongside-therapist',
        updatedAt: now,
      }),
    ])
    db.close()
    await db.open()

    expect(await db.treatmentActivities.get(activity.id)).toEqual(activity)
    expect(await db.treatmentProgress.get('progress')).toMatchObject({
      selectedPrograms: ['cpt'],
      programStatuses: { cpt: 'clinician-supported' },
      completedModules: ['cpt:abc'],
      lastOpenedProgram: 'cpt',
      clinicianSupportedMode: true,
    })
    expect(await db.treatmentSettings.get('treatment')).toMatchObject({
      useMode: 'alongside-therapist',
    })
  })

  it('deletes every Treatment collection while preserving ordinary Salience data', async () => {
    await seedTreatmentRecords()
    await deleteTreatmentData()
    const data = await readAllData()

    expect(data.sleepEntries.some((entry) => entry.id === sleepEntry.id)).toBe(true)
    expect(data.treatmentActivities).toEqual([])
    expect(data.treatmentResponses).toEqual([])
    expect(data.treatmentProgramPlans).toEqual([])
    expect(data.treatmentSessions).toEqual([])
    expect(data.treatmentReviews).toEqual([])
    expect(data.treatmentNightmares).toEqual([])
    expect(data.treatmentProgress.selectedPrograms).toEqual([])
    expect(data.treatmentSettings.realityStatement).toBeUndefined()
  })

  it('rolls back the entire import when a validated backup violates a database constraint', async () => {
    await db.sleepEntries.put(sleepEntry)
    const bundle = await createExportBundle()
    bundle.sleepEntries = [
      sleepEntry,
      { ...sleepEntry, id: 'duplicate-sleep-date' },
    ]

    await expect(importExportBundle(bundle)).rejects.toThrow()
    const data = await readAllData()
    expect(data.sleepEntries.filter((entry) => entry.date === sleepEntry.date)).toEqual([sleepEntry])
  })
})
