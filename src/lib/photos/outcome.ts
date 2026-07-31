import { DOMParser, onErrorStopParsing } from '@xmldom/xmldom'
import ExifReader, { type ExpandedTags } from 'exifreader'
import { emptyMetadata, normalizeMetadata } from './normalize'
import type { ScanItem, ScanOutcome } from './types'

type MetadataLoader = (file: File) => Promise<ExpandedTags>

const xmpDomParser = new DOMParser({ onError: onErrorStopParsing })

const defaultLoader: MetadataLoader = (file) =>
  ExifReader.load(file, {
    domParser: xmpDomParser,
    expanded: true,
    includeOffsets: true,
    length: 'auto',
    excludeTags: { icc: true, makerNotes: true, thumbnail: true },
  })

export async function createScanOutcome(
  item: ScanItem,
  load: MetadataLoader = defaultLoader,
): Promise<ScanOutcome> {
  try {
    const tags = await load(item.file)
    return {
      originalIndex: item.originalIndex,
      fileName: item.file.name,
      metadata: normalizeMetadata(tags),
      status: 'ready',
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Metadata could not be read'
    return {
      originalIndex: item.originalIndex,
      fileName: item.file.name,
      metadata: emptyMetadata(),
      // A metadata parser cannot establish whether the browser can display the
      // image. The image load path is the authoritative decode check.
      status: 'metadata-error',
      error: message,
    }
  }
}
