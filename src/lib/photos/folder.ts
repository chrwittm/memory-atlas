import type { ScanItem } from './types'

const JPEG_EXTENSION = /\.jpe?g$/i
const GPX_EXTENSION = /\.gpx$/i

function isTopLevel(file: File): boolean {
  const relativePath = file.webkitRelativePath
  if (!relativePath) return true
  return relativePath.split('/').filter(Boolean).length === 2
}

export function isTopLevelJpeg(file: File): boolean {
  return JPEG_EXTENSION.test(file.name) && isTopLevel(file)
}

export function isTopLevelGpx(file: File): boolean {
  return GPX_EXTENSION.test(file.name) && isTopLevel(file)
}

export function filterFolderFiles(files: File[]): ScanItem[] {
  return files
    .flatMap((file, originalIndex): ScanItem[] => {
      if (isTopLevelJpeg(file)) return [{ kind: 'photo', file, originalIndex }]
      if (isTopLevelGpx(file)) return [{ kind: 'gpx', file, originalIndex }]
      return []
    })
}

export function selectedFolderName(files: File[]): string {
  const relativePath = files.find((file) => file.webkitRelativePath)?.webkitRelativePath
  return relativePath?.split('/')[0] || 'Selected folder'
}
