import { test } from 'vitest'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { destinations, checkLinks } from './check-doc-links.mjs'

test('extracts inline, image and reference destinations and ignores fenced examples', () => {
  assert.deepEqual(destinations('[text](guide.md#part) ![image](<some image.png>)\n[ref]: guide.md "Guide"\n```md\n[example](absent.md)\n```'), ['guide.md#part', 'some image.png', 'guide.md'])
})

test('checks publication membership as well as local existence', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'memory-atlas-doc-links-'))
  try {
    mkdirSync(path.join(root, 'docs'))
    writeFileSync(path.join(root, 'README.md'), '[ok](docs/guide.md#section) [private](private.md) [missing](missing.md) [outside](../outside.md) [remote](https://example.com)')
    writeFileSync(path.join(root, 'private.md'), 'Local only')
    writeFileSync(path.join(root, 'docs/guide.md'), 'Guide')
    const results = checkLinks(root, ['README.md', 'docs/guide.md'])
    assert.equal(results.length, 3)
    assert.ok(results.some(result => result.includes('unpublished destination: private.md')))
    assert.ok(results.some(result => result.includes('missing destination: missing.md')))
    assert.ok(results.some(result => result.includes('link escapes repository: ../outside.md')))
  } finally { rmSync(root, { recursive: true, force: true }) }
})
