import { describe, expect, it } from 'vitest'
import {
  auditAdvisoryUrls,
  auditCounts,
  compareVersions,
  createVerificationMarkdown,
  evaluateAudit,
  parseArgs,
} from './release-mac.mjs'

function auditReport(counts, urls = []) {
  return {
    metadata: { vulnerabilities: counts },
    vulnerabilities: {
      example: {
        via: urls.map((url) => ({ url })),
      },
    },
  }
}

const zeroCounts = { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 }

describe('macOS release gate helpers', () => {
  it('accepts only explicit release options', () => {
    expect(parseArgs(['--allow-dirty', '--allow-network-audit', '--replace-artifact'])).toEqual({
      allowDirty: true,
      allowNetworkAudit: true,
      replaceArtifact: true,
      help: false,
    })
    expect(() => parseArgs(['--skip-tests'])).toThrow('Unknown option')
  })

  it('compares semantic toolchain versions', () => {
    expect(compareVersions('20.18.0', '20.18.0')).toBe(0)
    expect(compareVersions('20.18.1', '20.18.0')).toBe(1)
    expect(compareVersions('20.17.9', '20.18.0')).toBe(-1)
  })

  it('normalizes counts and unique advisory URLs', () => {
    const report = auditReport(zeroCounts, ['https://example.test/one', 'https://example.test/one'])
    expect(auditCounts(report)).toEqual(zeroCounts)
    expect(auditAdvisoryUrls(report)).toEqual(['https://example.test/one'])
  })

  it('accepts an audit at or below its reviewed baseline', () => {
    const report = auditReport(
      { info: 0, low: 1, moderate: 0, high: 2, critical: 0, total: 3 },
      ['https://example.test/known'],
    )
    const result = evaluateAudit(
      report,
      { info: 0, low: 1, moderate: 0, high: 3, critical: 0, total: 4 },
      ['https://example.test/known', 'https://example.test/resolved'],
    )

    expect(result.passed).toBe(true)
    expect(result.resolvedAdvisories).toEqual(['https://example.test/resolved'])
  })

  it('stops on a higher count or an unreviewed advisory', () => {
    const result = evaluateAudit(
      auditReport(
        { info: 0, low: 0, moderate: 0, high: 2, critical: 0, total: 2 },
        ['https://example.test/new'],
      ),
      { info: 0, low: 0, moderate: 0, high: 1, critical: 0, total: 1 },
      [],
    )

    expect(result.passed).toBe(false)
    expect(result.exceeded).toEqual(['high', 'total'])
    expect(result.newAdvisories).toEqual(['https://example.test/new'])
  })

  it('creates a commit-ready verification draft without claiming manual checks', () => {
    const evaluation = evaluateAudit(auditReport(zeroCounts), zeroCounts)
    const markdown = createVerificationMarkdown({
      generatedAt: '2026-09-04T12:00:00.000Z',
      version: '0.3.0',
      architecture: 'arm64',
      host: { platform: 'darwin', release: '25.6.0' },
      toolchain: { node: '20.18.0', npm: '10.9.0' },
      source: { commit: 'abc123', dirty: false, changedFiles: [] },
      audits: {
        reviewedOn: '2026-09-04',
        reviewDocument: 'docs/operations/dependency-security.md',
        production: evaluation,
        complete: evaluation,
      },
      artifact: { relativePath: 'out/make/example.dmg', bytes: 1234, sha256: 'deadbeef' },
      application: {
        bundleIdentifier: 'com.memoryatlas.app',
        cdHash: 'abc',
        signing: 'Ad hoc',
        teamIdentifier: 'not set',
        notarization: 'Not notarized',
      },
      outputDirectory: 'out/release/example',
    })

    expect(markdown).toContain('Automated release gate passed')
    expect(markdown).toContain('installed-app interaction checks outstanding')
    expect(markdown).toContain('`deadbeef`')
  })
})
