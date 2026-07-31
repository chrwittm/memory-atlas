# Generated test fixtures

These files are generated, non-personal test assets. They are intentionally
separate from `fixtures/photo-folders/`, which is reserved for ignored private
photo collections.

## `malformed-xmp-metadata.jpg`

A 32×32 baseline JPEG with a deliberately malformed XMP APP1 block. macOS can
decode the image. ExifReader currently recovers from the malformed XMP by
returning empty XMP tags, so this fixture checks that real malformed metadata
does not stop ingestion or image display. It does not replace the controlled
loader-rejection regression test, which verifies the `metadata-error` path.

SHA-256: `50f37a29f30f4ca406e68a0acca1ee90b9dcedf9d00fe6f9b8512933fbf74ff3`

## `valid-neighbor.jpg`

A matching 32×32 baseline JPEG without injected metadata. It keeps the fixture
folder useful for manual previous/next navigation checks.

SHA-256: `93a4c7be4c7c00290846d59d9708419c215e85bf8da247acaae47c6102957a4c`
