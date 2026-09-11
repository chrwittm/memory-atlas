import { expect, it, vi } from 'vitest'
import { AttributionControl, type Map } from 'maplibre-gl'

it('strips adjacent dangerous attribution attributes in the real MapLibre bundle', () => {
  const attribution = '<details open onload="bad()" ontoggle="bad()"><a href="javascript:bad()" onclick="bad()">Provider</a></details><a href="https://example.com/">Safe credit</a>'
  const map = {
    style: { tileManagers: { basemap: { used: true, getSource: () => ({ attribution }) } } },
    _getUIString: () => 'Toggle attribution',
    getCanvasContainer: () => document.createElement('div'),
    on: vi.fn(), off: vi.fn(),
  } as unknown as Map
  const control = new AttributionControl()
  const element = control.onAdd(map)
  expect(element.querySelector('[onload], [ontoggle], [onclick], [href^="javascript:"]')).toBeNull()
  expect(element.querySelector('a[href="https://example.com/"]')?.textContent).toBe('Safe credit')
  expect(element.textContent).toContain('Provider')
  control.onRemove()
})
