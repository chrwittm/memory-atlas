import { describe, expect, it } from 'vitest'
import { photo } from '../../test/factories'
import { coordinateGroups, nextMapMode, nextMemberInGroup } from './model'

describe('map collection model', () => {
  it('cycles all map modes in the accepted order', () => {
    expect(nextMapMode('current')).toBe('all')
    expect(nextMapMode('all')).toBe('track')
    expect(nextMapMode('track')).toBe('current')
  })

  it('groups exact coordinates while retaining every member in natural photo order', () => {
    const photos = [
      photo({ id: 'a', location: { latitude: 47, longitude: 10 } }),
      photo({ id: 'b', location: { latitude: 48, longitude: 11 } }),
      photo({ id: 'c', location: { latitude: 47, longitude: 10 } }),
    ]
    const groups = coordinateGroups(photos)
    expect(groups.map((group) => group.photoIndices)).toEqual([[0, 2], [1]])
    expect(nextMemberInGroup(groups[0], 0)).toBe(2)
    expect(nextMemberInGroup(groups[0], 2)).toBe(0)
  })
})
