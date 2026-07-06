import type { ScanItem } from './types'

const JPEG_EXTENSION = /\.jpe?g$/i

export function isTopLevelJpeg(file: File): boolean {
  if (!JPEG_EXTENSION.test(file.name)) return false

  const relativePath = file.webkitRelativePath
  if (!relativePath) return true

  const parts = relativePath.split('/').filter(Boolean)
  return parts.length === 2
}

export function filterFolderFiles(files: File[]): ScanItem[] {
  return files
    .map((file, originalIndex) => ({ file, originalIndex }))
    .filter(({ file }) => isTopLevelJpeg(file))
}

export function selectedFolderName(files: File[]): string {
  const relativePath = files.find((file) => file.webkitRelativePath)?.webkitRelativePath
  return relativePath?.split('/')[0] || 'Selected folder'
}

