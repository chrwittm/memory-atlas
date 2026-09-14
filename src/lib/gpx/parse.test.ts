import { describe, expect, it } from 'vitest'
import { createGpxOutcome, parseGpxDocument } from './parse'

describe('GPX normalization', () => {
  it.each(['1.0', '1.1'])('reads GPX %s tracks in document and segment order', (version) => {
    const tracks = parseGpxDocument(`<?xml version="1.0"?>
      <gpx version="${version}" xmlns="http://www.topografix.com/GPX/${version === '1.0' ? '1/0' : '1/1'}">
        <wpt lat="1" lon="2"/><rte><rtept lat="3" lon="4"/></rte>
        <trk><name>Morning walk</name>
          <trkseg><trkpt lat="47.1" lon="10.1"/><trkpt lat="47.2" lon="10.2"/></trkseg>
          <trkseg><trkpt lat="48.1" lon="11.1"/><trkpt lat="48.2" lon="11.2"/></trkseg>
        </trk>
        <trk><trkseg><trkpt lat="49.1" lon="12.1"/><trkpt lat="49.2" lon="12.2"/></trkseg></trk>
      </gpx>`, 'route.gpx', 4)

    expect(tracks).toHaveLength(2)
    expect(tracks[0]).toMatchObject({ name: 'Morning walk', documentIndex: 0, originalIndex: 4 })
    expect(tracks[0].segments).toEqual([
      [[10.1, 47.1], [10.2, 47.2]],
      [[11.1, 48.1], [11.2, 48.2]],
    ])
    expect(tracks[1].segments).toEqual([[[12.1, 49.1], [12.2, 49.2]]])
  })

  it('splits geometry at invalid points and omits non-drawable runs', () => {
    const [track] = parseGpxDocument(`<gpx><trk><trkseg>
      <trkpt lat="47" lon="10"/><trkpt lat="47.1" lon="10.1"/>
      <trkpt lat="999" lon="10.2"/>
      <trkpt lat="47.3" lon="10.3"/><trkpt lat="47.4" lon="10.4"/>
      <trkpt lat="" lon="10.5"/><trkpt lat="47.6"/>
    </trkseg></trk></gpx>`, 'gaps.gpx', 0)

    expect(track.segments).toEqual([
      [[10, 47], [10.1, 47.1]],
      [[10.3, 47.3], [10.4, 47.4]],
    ])
  })

  it('isolates malformed files and treats one-point tracks as readable but non-drawable', async () => {
    const malformed = await createGpxOutcome({
      kind: 'gpx', originalIndex: 1,
      file: { name: 'broken.gpx', text: async () => '<gpx><trk>' } as File,
    })
    const onePoint = await createGpxOutcome({
      kind: 'gpx', originalIndex: 2,
      file: { name: 'short.gpx', text: async () => '<gpx><trk><trkseg><trkpt lat="1" lon="2"/></trkseg></trk></gpx>' } as File,
    })
    expect(malformed).toMatchObject({ status: 'error', fileName: 'broken.gpx', tracks: [] })
    expect(onePoint).toEqual({ status: 'ready', fileName: 'short.gpx', originalIndex: 2, tracks: [] })
  })
})
