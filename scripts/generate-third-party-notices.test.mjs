import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { generate } from './generate-third-party-notices.mjs'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
function hashes(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const name = `${prefix}${entry.name}`
    return entry.isDirectory() ? hashes(path.join(directory, entry.name), `${name}/`) : [[name, createHash('sha256').update(readFileSync(path.join(directory, entry.name))).digest('hex')]]
  })
}
test('legal materials are deterministic and include full notices and unchanged MPL source', () => {
  const temp = mkdtempSync(path.join(tmpdir(), 'memory-atlas-notices-'))
  try {
    generate(root, path.join(temp, 'one'))
    generate(root, path.join(temp, 'two'))
    assert.deepEqual(hashes(path.join(temp, 'one')), hashes(path.join(temp, 'two')))
    const notices = readFileSync(path.join(temp, 'one/THIRD_PARTY_NOTICES.txt'), 'utf8')
    for (const file of ['svelte/LICENSE.md', '@xmldom/xmldom/LICENSE', 'maplibre-gl/LICENSE.txt', 'exifreader/LICENSE']) assert.ok(notices.includes(readFileSync(path.join(root, 'node_modules', file), 'utf8')))
    assert.ok(notices.includes('Copyright (c) Microsoft Corporation.'))
    assert.ok(notices.includes('Copyright (c) 2011 Gary Court'))
    assert.ok(!notices.includes(root))
    const pkg = JSON.parse(readFileSync(path.join(root, 'node_modules/exifreader/package.json')))
    assert.deepEqual(hashes(path.join(root, 'node_modules/exifreader/src')), hashes(path.join(temp, `one/source/exifreader-${pkg.version}/src`)))
    assert.match(readFileSync(path.join(temp, 'one/SOURCE_AVAILABILITY.txt'), 'utf8'), /Mozilla Public License 2.0/)
  } finally { rmSync(temp, { recursive: true, force: true }) }
})
