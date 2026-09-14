export type MapKeyboardHandler = (event: KeyboardEvent) => boolean

export type MapCameraCommand = 'cycle' | 'current' | 'day' | 'complete-track' | 'all-photos'

function isLabeledZ(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase()
  // macOS currently produces Ω for Option+Z on both the U.S. and German
  // layouts. `key` handles ordinary Z by label; the alternate character keeps
  // the direct shortcut attached to that same labeled key after Option changes
  // its text value. Do not use `code`: German Z is physically `KeyY`.
  return key === 'z' || (event.altKey && (event.key === 'Ω' || event.key === 'Ω'))
}

export function mapCameraCommand(event: KeyboardEvent): MapCameraCommand | undefined {
  if (event.repeat || event.isComposing || !isLabeledZ(event)) return undefined
  if (event.metaKey) {
    return event.altKey && !event.shiftKey && !event.ctrlKey ? 'all-photos' : undefined
  }
  const modifierCount = Number(event.shiftKey) + Number(event.ctrlKey) + Number(event.altKey)
  if (modifierCount > 1) return undefined
  if (event.shiftKey) return 'current'
  if (event.ctrlKey) return 'day'
  if (event.altKey) return 'complete-track'
  return 'cycle'
}
