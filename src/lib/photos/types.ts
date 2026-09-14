export type PhotoStatus = 'ready' | 'metadata-error' | 'decode-error' | 'read-error'

export type PhotoLocation = {
  latitude: number
  longitude: number
}

export type PhotoMetadata = {
  capturedAt?: string
  capturedLocalDate?: string
  title?: string
  caption?: string
  tags: string[]
  people: string[]
  orientation?: number
  width?: number
  height?: number
  location?: PhotoLocation
}

export type Photo = PhotoMetadata & {
  id: string
  file: File
  fileName: string
  originalIndex: number
  status: PhotoStatus
  error?: string
}

export type PhotoScanItem = {
  kind: 'photo'
  file: File
  originalIndex: number
}

export type GpxScanItem = {
  kind: 'gpx'
  file: File
  originalIndex: number
}

export type ScanItem = PhotoScanItem | GpxScanItem

export type ScanOutcome = {
  originalIndex: number
  fileName: string
  metadata: PhotoMetadata
  status: Extract<PhotoStatus, 'ready' | 'metadata-error' | 'read-error'>
  error?: string
}

export type TrackPoint = [longitude: number, latitude: number]

export type GpxTrack = {
  id: string
  fileName: string
  name?: string
  originalIndex: number
  documentIndex: number
  segments: TrackPoint[][]
}

export type GpxOutcome = {
  originalIndex: number
  fileName: string
  tracks: GpxTrack[]
  status: 'ready' | 'error'
  error?: string
}

export type WorkerRequest = {
  type: 'scan'
  files: File[]
}

export type WorkerResponse =
  | { type: 'started'; total: number; folderName: string }
  | { type: 'progress'; completed: number; total: number; fileName: string }
  | { type: 'photo-result'; outcome: ScanOutcome }
  | { type: 'gpx-result'; outcome: GpxOutcome }
  | { type: 'complete'; total: number }
  | { type: 'failed'; message: string }
