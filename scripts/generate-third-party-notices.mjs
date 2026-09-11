#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const digest = data => createHash('sha256').update(data).digest('hex')
// These source/compiler utilities are absent from the distributed runtime.
// Their installed packages do not contain complete license texts. Do not silently
// apply this exclusion to different versions or to additional packages.
const excluded = { 'is-reference': '3.0.3', 'locate-character': '3.0.0', '@mapbox/jsonlint-lines-primitives': '2.0.2' }

export function generate(projectRoot = root, outputDir = 'out/legal/third-party') {
  const lock = JSON.parse(readFileSync(path.join(projectRoot, 'package-lock.json'), 'utf8'))
  const output = path.resolve(projectRoot, outputDir)
  const sections = ['Memory Atlas third-party notices\n\nThis file includes the installed production dependency closure conservatively; some listed compiler/type packages are not shipped as executable code. Each component retains its own license. Electron and Chromium notices are supplied separately by Electron.\n']
  const inventory = []
  for (const [location, entry] of Object.entries(lock.packages).sort(([a], [b]) => a.localeCompare(b))) {
    if (!location || entry.dev) continue
    const directory = path.join(projectRoot, location)
    const pkg = JSON.parse(readFileSync(path.join(directory, 'package.json'), 'utf8'))
    if (pkg.version !== entry.version) throw new Error(`Installed/locked version mismatch: ${pkg.name}`)
    if (excluded[pkg.name] === pkg.version) continue
    let notices = readdirSync(directory).filter(name => /^(licen[sc]e|copying|notice|copyright)(\.|$)/i.test(name)).sort().map(name => ({ name, text: readFileSync(path.join(directory, name), 'utf8') }))
    if (pkg.name === 'murmurhash-js') {
      const readme = readFileSync(path.join(directory, 'README.md'), 'utf8')
      const start = readme.indexOf('## License (MIT)')
      if (start < 0) throw new Error('Missing murmurhash-js license')
      notices = [{ name: 'README.md license section', text: readme.slice(start) }]
    }
    if (!notices.length) throw new Error(`No complete notice file: ${pkg.name}@${pkg.version}`)
    sections.push(`\n${'='.repeat(72)}\n${pkg.name}@${pkg.version}\n${location}\nLicense: ${pkg.license ?? entry.license ?? 'see notice'}\n`)
    for (const notice of notices) sections.push(`\n--- ${notice.name} ---\n${notice.text}\n`)
    inventory.push({ name: pkg.name, version: pkg.version, location, notices: notices.map(({ name, text }) => ({ name, sha256: digest(text) })) })
  }
  // MapLibre 6 ships ESM without the previously embedded tslib runtime.
  // Fail closed if a future bundle reintroduces it without a bundled notice.
  const mapDir = path.join(projectRoot, 'node_modules/maplibre-gl/dist')
  for (const file of readdirSync(mapDir).filter(name => name.endsWith('.mjs.map'))) {
    const map = JSON.parse(readFileSync(path.join(mapDir, file), 'utf8'))
    if (map.sources.some(source => /\btslib\b/.test(source))) throw new Error('Review newly embedded tslib notice')
  }
  const exif = JSON.parse(readFileSync(path.join(projectRoot, 'node_modules/exifreader/package.json'), 'utf8'))
  const sourcePath = `source/exifreader-${exif.version}`
  const access = `ExifReader ${exif.version} source availability\n\nExifReader is covered by Mozilla Public License 2.0. Its complete installed source is supplied alongside this notice at ${sourcePath}/src, with its MPL license at ${sourcePath}/LICENSE. These are unmodified upstream npm source files for the exact packaged version. Memory Atlas bundles/minifies this code for execution without editing those upstream source files. The source remains available under MPL-2.0; Memory Atlas's Apache-2.0 license does not replace it.\n`
  // Build only after all inputs validate; generated material contains no host paths.
  rmSync(output, { recursive: true, force: true })
  mkdirSync(path.join(output, sourcePath), { recursive: true })
  for (const name of ['src', 'bin', 'LICENSE', 'package.json', 'README.md', 'babel.config.json', 'webpack.config.js']) {
    const input = path.join(projectRoot, 'node_modules/exifreader', name)
    if (!existsSync(input)) throw new Error(`Missing ExifReader source material: ${name}`)
    cpSync(input, path.join(output, sourcePath, name), { recursive: true })
  }
  writeFileSync(path.join(output, 'THIRD_PARTY_NOTICES.txt'), sections.join(''))
  writeFileSync(path.join(output, 'SOURCE_AVAILABILITY.txt'), access)
  writeFileSync(path.join(output, 'inventory.json'), JSON.stringify({ packages: inventory, excludedNonRuntime: excluded }, null, 2) + '\n')
  return { output, packageCount: inventory.length, sourcePath }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = generate()
  console.log(`Generated out/legal/third-party: ${result.packageCount} component notices and ${result.sourcePath}`)
}
