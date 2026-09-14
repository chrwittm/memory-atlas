import { DOMParser, onErrorStopParsing, type Element as XmlElement } from '@xmldom/xmldom'
import type { GpxOutcome, GpxScanItem, GpxTrack, TrackPoint } from '../photos/types'

function childElements(parent: XmlElement, localName: string): XmlElement[] {
  const matches: XmlElement[] = []
  for (let child = parent.firstChild; child; child = child.nextSibling) {
    if (child.nodeType === 1 && (child as XmlElement).localName === localName) matches.push(child as XmlElement)
  }
  return matches
}

function pointFrom(element: XmlElement): TrackPoint | undefined {
  const rawLatitude = element.getAttribute('lat')
  const rawLongitude = element.getAttribute('lon')
  if (!rawLatitude?.trim() || !rawLongitude?.trim()) return undefined
  const latitude = Number(rawLatitude)
  const longitude = Number(rawLongitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return undefined
  return [longitude, latitude]
}

export function parseGpxDocument(xml: string, fileName: string, originalIndex: number): GpxTrack[] {
  const document = new DOMParser({ onError: onErrorStopParsing }).parseFromString(xml, 'application/xml')
  const root = document.documentElement
  if (!root || root.localName !== 'gpx') throw new Error('The file is not a GPX document.')

  return childElements(root, 'trk').flatMap((track, documentIndex): GpxTrack[] => {
    const segments: TrackPoint[][] = []
    for (const segment of childElements(track, 'trkseg')) {
      let consecutive: TrackPoint[] = []
      const flush = () => {
        if (consecutive.length >= 2) segments.push(consecutive)
        consecutive = []
      }
      for (const point of childElements(segment, 'trkpt')) {
        const normalized = pointFrom(point)
        if (normalized) consecutive.push(normalized)
        else flush()
      }
      flush()
    }
    if (!segments.length) return []
    const name = childElements(track, 'name')[0]?.textContent?.trim() || undefined
    return [{
      id: `${originalIndex}:${documentIndex}:${fileName}`,
      fileName,
      name,
      originalIndex,
      documentIndex,
      segments,
    }]
  })
}

export async function createGpxOutcome(item: GpxScanItem): Promise<GpxOutcome> {
  try {
    return {
      originalIndex: item.originalIndex,
      fileName: item.file.name,
      tracks: parseGpxDocument(await item.file.text(), item.file.name, item.originalIndex),
      status: 'ready',
    }
  } catch (error) {
    return {
      originalIndex: item.originalIndex,
      fileName: item.file.name,
      tracks: [],
      status: 'error',
      error: error instanceof Error ? error.message : 'GPX could not be read.',
    }
  }
}
