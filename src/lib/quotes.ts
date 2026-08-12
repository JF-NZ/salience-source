import type { DailyQuoteState, Quote } from '../types'

const hashString = (value: string) =>
  Array.from(value).reduce((total, character) => total + character.charCodeAt(0), 0)

export const chooseQuoteForDate = (quotes: Quote[], date: string) => {
  if (quotes.length === 0) {
    return undefined
  }

  return quotes[hashString(date) % quotes.length]
}

export const resolveDailyQuote = (
  quotes: Quote[],
  state: DailyQuoteState | undefined,
  date: string,
) => {
  if (quotes.length === 0) {
    return undefined
  }

  const stateQuote = state?.date === date ? quotes.find((quote) => quote.id === state.quoteId) : undefined
  return stateQuote ?? chooseQuoteForDate(quotes, date)
}

export const refreshDailyQuote = (
  quotes: Quote[],
  state: DailyQuoteState | undefined,
  date: string,
): DailyQuoteState | undefined => {
  if (quotes.length === 0) {
    return undefined
  }

  const current = resolveDailyQuote(quotes, state, date)
  const currentIndex = current ? quotes.findIndex((quote) => quote.id === current.id) : -1
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % quotes.length : 0

  return {
    date,
    quoteId: quotes[nextIndex].id,
    manuallyRefreshed: true,
  }
}
