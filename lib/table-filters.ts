export function matchesSelectedValues(values: string[], selectedValues: string[]) {
  if (selectedValues.length === 0) return true
  const normalizedValues = values.map((value) => value.toLocaleLowerCase("ja"))
  return selectedValues.some((selectedValue) => {
    const normalizedSelection = selectedValue.trim().toLocaleLowerCase("ja")
    return normalizedValues.some((value) => value.includes(normalizedSelection))
  })
}
