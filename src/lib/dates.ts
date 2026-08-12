import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  subDays,
} from 'date-fns'

export const localDateKey = (date = new Date()) => format(date, 'yyyy-MM-dd')

export const localDateTimeInput = (date = new Date(), minuteStep?: number) => {
  if (minuteStep && minuteStep > 1) {
    const rounded = new Date(date)
    rounded.setSeconds(0, 0)
    rounded.setMinutes(Math.floor(rounded.getMinutes() / minuteStep) * minuteStep)
    return format(rounded, "yyyy-MM-dd'T'HH:mm")
  }

  return format(date, "yyyy-MM-dd'T'HH:mm")
}

export const dateTimeInputToIso = (value: string) => new Date(value).toISOString()

export const isoToDateTimeInput = (value: string, minuteStep?: number) => localDateTimeInput(parseISO(value), minuteStep)

export const daysAgoRange = (days: number, today = new Date()) => ({
  start: localDateKey(subDays(today, days - 1)),
  end: localDateKey(today),
})

export const previousDateKey = (today = new Date()) => localDateKey(subDays(today, 1))

export const nextDateKey = (dateKey: string) => localDateKey(addDays(parseISO(`${dateKey}T12:00:00`), 1))

export const completedDaysRange = (days: number, today = new Date()) => ({
  start: localDateKey(subDays(today, days)),
  end: previousDateKey(today),
})

export const dateInRange = (dateKey: string, start: string, end: string) =>
  isWithinInterval(parseISO(`${dateKey}T12:00:00`), {
    start: startOfDay(parseISO(`${start}T12:00:00`)),
    end: endOfDay(parseISO(`${end}T12:00:00`)),
  })

export const isoInDateRange = (iso: string, start: string, end: string) =>
  dateInRange(localDateKey(parseISO(iso)), start, end)

export const rangeDateKeys = (start: string, end: string) => {
  const first = parseISO(`${start}T12:00:00`)
  const last = parseISO(`${end}T12:00:00`)
  const days = Math.max(0, differenceInCalendarDays(last, first))

  return Array.from({ length: days + 1 }, (_, index) => localDateKey(addDays(first, index)))
}

export const displayDate = (dateKey: string) => format(parseISO(`${dateKey}T12:00:00`), 'MMM d')

export const displayDateTime = (iso: string) => format(parseISO(iso), 'MMM d, h:mm a')

export const relativeDayLabel = (dateKey: string, today = new Date()) => {
  if (!dateKey) {
    return ''
  }

  const todayKey = localDateKey(today)
  const yesterdayKey = previousDateKey(today)

  if (dateKey === todayKey) {
    return 'today'
  }

  if (dateKey === yesterdayKey) {
    return 'yesterday'
  }

  return ''
}

export const checkInDatePhrase = (dateKey: string, today = new Date()) => {
  if (!dateKey) {
    return 'today'
  }

  const selectedDate = parseISO(`${dateKey}T12:00:00`)
  const todayDate = parseISO(`${localDateKey(today)}T12:00:00`)
  const daysAgo = differenceInCalendarDays(todayDate, selectedDate)

  if (daysAgo === 0) {
    return 'today'
  }

  if (daysAgo === 1) {
    return 'yesterday'
  }

  const formatted = format(selectedDate, 'dd/MM/yyyy')

  if (daysAgo > 1) {
    return `on ${formatted} (${daysAgo} days ago)`
  }

  return `on ${formatted}`
}

export const relativeDateTimeInputLabel = (value: string, todayLabel = 'today', today = new Date()) => {
  if (!value) {
    return ''
  }

  const dateKey = value.slice(0, 10)

  if (dateKey === localDateKey(today)) {
    return todayLabel
  }

  if (dateKey === previousDateKey(today)) {
    return 'yesterday'
  }

  return ''
}
