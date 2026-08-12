// @vitest-environment jsdom

import { act, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ClinicianReport } from '../ClinicianReport'
import { defaultAppSettings } from '../data/seed'
import { defaultTreatmentProgress, defaultTreatmentSettings } from '../lib/treatment'
import type { AppData } from '../types'

const reactTestGlobal = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
reactTestGlobal.IS_REACT_ACT_ENVIRONMENT = true

let root: Root | undefined

const data: AppData = {
  quotes: [], dailyQuoteState: [], quickCheckIns: [], benzodiazepineEntries: [], sleepEntries: [], nightmareEntries: [], eveningCheckIns: [], journalEntries: [], supportContacts: [],
  treatmentProgress: defaultTreatmentProgress(), treatmentSettings: defaultTreatmentSettings(), treatmentResponses: [], treatmentProgramPlans: [], treatmentActivities: [], treatmentSessions: [], treatmentReviews: [], treatmentNightmares: [], appSettings: defaultAppSettings,
}

const render = async (element: ReactElement) => {
  const container = document.createElement('div')
  document.body.replaceChildren(container)
  root = createRoot(container)
  await act(async () => { root?.render(element) })
  return container
}

const click = async (button: Element) => {
  await act(async () => { button.dispatchEvent(new MouseEvent('click', { bubbles: true })) })
}

const buttonNamed = (container: ParentNode, name: string) => {
  const button = [...container.querySelectorAll('button')].find((item) => item.textContent?.replace(/\s+/g, ' ').trim() === name || item.getAttribute('aria-label') === name)
  expect(button, `Expected button ${name}`).toBeTruthy()
  return button!
}

beforeEach(() => {
  document.body.replaceChildren()
})

afterEach(async () => {
  await act(async () => { root?.unmount() })
  root = undefined
})

describe('ClinicianReport', () => {
  it('opens on Overview and keeps Detailed data accessible', async () => {
    const container = await render(<ClinicianReport data={data} substanceTrackingEnabled={false} />)
    expect(buttonNamed(container, 'Overview').getAttribute('aria-selected')).toBe('true')
    await click(buttonNamed(container, 'Detailed data'))
    expect(buttonNamed(container, 'Detailed data').getAttribute('aria-selected')).toBe('true')
    expect(container.textContent).toContain('Completion counts')
  })

  it('shows custom dates only after Custom range is selected', async () => {
    const container = await render(<ClinicianReport data={data} substanceTrackingEnabled={false} />)
    await click(buttonNamed(container, 'Edit'))
    expect(container.querySelectorAll('input[type="date"]')).toHaveLength(0)
    await click(buttonNamed(container, 'Custom range'))
    expect(container.querySelectorAll('input[type="date"]')).toHaveLength(2)
  })

  it('opens a grouped Share report sheet with formatted and raw formats', async () => {
    const container = await render(<ClinicianReport data={data} substanceTrackingEnabled={false} />)
    await click(buttonNamed(container, 'Share clinician report'))
    expect(container.textContent).toContain('Formatted report')
    expect(container.textContent).toContain('Raw data formats')
    expect(container.textContent).toContain('PDF')
    expect(container.textContent).toContain('Word')
    expect(container.textContent).toContain('Print')
    expect(container.querySelectorAll('button[aria-label="Close Share report"]')).toHaveLength(1)
  })
})
