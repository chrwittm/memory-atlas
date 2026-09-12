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
