# Image assets

## `earth.jpg`

Memory Atlas uses this Earth photograph on its entry screen, served locally as
`/images/earth.jpg` and bundled in the desktop application.

- Title: *Artemis II Captures the Terminator Line*
- NASA image identifier: `art002e000190`
- Image credit and source: NASA
- Capture date: 2026-04-02
- [NASA source record](https://www.nasa.gov/image-detail/amf-art002e000190/)
- [NASA original JPEG](https://images-assets.nasa.gov/image/art002e000190/art002e000190~orig.jpg)
- [NASA image and media usage guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/)

NASA's record credits NASA and identifies no third-party copyright holder. Its
usage guidance permits factual use of NASA content without implied endorsement,
with NASA acknowledged as the source; NASA content generally is not subject to
copyright in the United States. This Earth photograph shows no identifiable
person or NASA insignia. NASA does not endorse Memory Atlas. The repository's
Apache-2.0 license does not claim ownership of this NASA material or replace
NASA's usage guidance.

### Reproducible source preparation

Verified on 2026-09-07. The former 3200×2133 Lightroom export was a local
derivative with unrelated editing metadata. It was replaced from the NASA
original, retaining its 5568×3712 resolution, compressed image data, and sRGB
color profile. No resizing, cropping, recompression, or generative editing was
performed. EXIF, IPTC, XMP, editing history, and embedded thumbnails were removed
with ExifTool 13.50; attribution is recorded above.

From the repository root, after downloading and verifying the original:

```sh
curl -fL 'https://images-assets.nasa.gov/image/art002e000190/art002e000190~orig.jpg' -o /tmp/memory-atlas-earth-original.jpg
shasum -a 256 /tmp/memory-atlas-earth-original.jpg
cp /tmp/memory-atlas-earth-original.jpg public/images/earth.jpg
exiftool -overwrite_original -all= -tagsFromFile @ -ICC_Profile public/images/earth.jpg
shasum -a 256 public/images/earth.jpg
exiftool -G1 public/images/earth.jpg
```

SHA-256 values:

| File | SHA-256 |
| --- | --- |
| NASA original | `ef7df0550266ec469fcb91423c2f6206aad2b3aa2992b70d008279380d2d465b` |
| Tracked `earth.jpg` | `6d86f37684b0a7478489f5b1be13b891b2f63dfaee488dc8cee5a30526e8e557` |

Metadata verification found only JPEG structural information, the standard sRGB
ICC profile, and Adobe JPEG color-transform information. There is no EXIF, IPTC,
XMP, GPS, personal metadata, or local editing history. The compressed image scan
and ICC profile are byte-identical to the NASA original. The standard ICC
profile retains its embedded Hewlett-Packard copyright notice.

## Third-party software

The Apache-2.0 repository license covers project material, subject to the asset
record above and separately licensed dependencies. Electron retains its
`LICENSE` and `LICENSES.chromium.html` in the runtime distribution; do not strip
these notices when packaging. Vite's generated third-party license comments and
upstream dependency notices remain subject to their respective licenses.
