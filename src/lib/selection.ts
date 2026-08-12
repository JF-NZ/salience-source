export const toggleValue = <T extends string>(selected: T[], value: T) =>
  selected.includes(value)
    ? selected.filter((item) => item !== value)
    : [...selected, value]

export const toggleExclusiveNone = <T extends string>(
  selected: T[],
  value: T,
  noneValue: T,
) => {
  if (value === noneValue) {
    return selected.includes(noneValue) ? [] : [noneValue]
  }

  const withoutNone = selected.filter((item) => item !== noneValue)

  return withoutNone.includes(value)
    ? withoutNone.filter((item) => item !== value)
    : [...withoutNone, value]
}
