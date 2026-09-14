import { describe, expect, it } from 'vitest'
import styles from './styles.css?raw'

describe('viewer focus appearance', () => {
  it('suppresses decorative viewer focus only outside forced-colors mode', () => {
    expect(styles).not.toContain('.photo-surface:focus-visible { box-shadow')
    expect(styles).not.toContain('.split-divider:focus-visible::before')
    expect(styles).toContain('@media (forced-colors: none)')
    expect(styles).toContain('.photo-surface, .map-region, .split-divider, button):focus-visible')
  })
})

describe('map canvas layout', () => {
  it('keeps the dynamically styled MapLibre container filling its panel', () => {
    expect(styles).toContain('.map-panel > .map-canvas { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; }')
    expect(styles).not.toMatch(/(?:^|\n)\.map-canvas\s*\{[^}]*position:\s*absolute/)
  })
})
