export type PhotoStatus = 'ready' | 'metadata-error' | 'decode-error' | 'read-error'

export type PhotoLocation = {
  latitude: number
  longitude: number
}

export type PhotoMetadata = {
  capturedAt?: string
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

export type ScanItem = {
  file: File
  originalIndex: number
}

export type ScanOutcome = {
  originalIndex: number
  fileName: string
  metadata: PhotoMetadata
  status: Extract<PhotoStatus, 'ready' | 'metadata-error' | 'read-error'>
  error?: string
}

export type WorkerRequest = {
  type: 'scan'
  files: File[]
}

export type WorkerResponse =
  | { type: 'started'; total: number; folderName: string }
  | { type: 'progress'; completed: number; total: number; fileName: string }
  | { type: 'result'; outcome: ScanOutcome }
  | { type: 'complete'; total: number }
  | { type: 'failed'; message: string }
