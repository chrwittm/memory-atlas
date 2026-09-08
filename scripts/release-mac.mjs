#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const packagePath = path.join(rootDir, 'package.json')
const policyPath = path.join(rootDir, 'scripts', 'release-policy.json')
const severityNames = ['info', 'low', 'moderate', 'high', 'critical']

export function parseArgs(args) {
  const options = {
    allowDirty: false,
    allowNetworkAudit: false,
    replaceArtifact: false,
    help: false,
  }

  for (const arg of args) {
    if (arg === '--allow-dirty') options.allowDirty = true
    else if (arg === '--allow-network-audit') options.allowNetworkAudit = true
    else if (arg === '--replace-artifact') options.replaceArtifact = true
    else if (arg === '--help' || arg === '-h') options.help = true
    else throw new Error(`Unknown option: ${arg}`)
  }

  return options
}

export function compareVersions(left, right) {
  const parse = (value) => {
    const match = String(value).match(/^(\d+)\.(\d+)\.(\d+)/)
    if (!match) throw new Error(`Cannot parse version: ${value}`)
    return match.slice(1).map(Number)
  }
  const leftParts = parse(left)
  const rightParts = parse(right)

  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) {
      return leftParts[index] < rightParts[index] ? -1 : 1
    }
  }
  return 0
}

export function auditCounts(report) {
  const counts = report?.metadata?.vulnerabilities
  if (!counts || severityNames.some((name) => !Number.isInteger(counts[name]))) {
    throw new Error('npm audit did not return vulnerability metadata')
  }

  return {
    ...Object.fromEntries(severityNames.map((name) => [name, counts[name]])),
    total:
      Number.isInteger(counts.total)
        ? counts.total
        : severityNames.reduce((sum, name) => sum + counts[name], 0),
  }
}

export function auditAdvisoryUrls(report) {
  const urls = new Set()
  for (const vulnerability of Object.values(report?.vulnerabilities ?? {})) {
    for (const cause of vulnerability?.via ?? []) {
      if (typeof cause === 'object' && cause !== null && typeof cause.url === 'string') {
        urls.add(cause.url)
      }
    }
  }
  return [...urls].sort()
}

export function evaluateAudit(report, maximum, acceptedAdvisoryUrls = []) {
  const counts = auditCounts(report)
  const exceeded = Object.entries(maximum)
    .filter(([name, maximumValue]) => counts[name] > maximumValue)
    .map(([name]) => name)

  const accepted = new Set(acceptedAdvisoryUrls)
  const advisoryUrls = auditAdvisoryUrls(report)
  const newAdvisories = advisoryUrls.filter((url) => !accepted.has(url))
  const resolvedAdvisories = [...accepted].filter((url) => !advisoryUrls.includes(url)).sort()

  return {
    counts,
    advisoryUrls,
    exceeded,
    newAdvisories,
    resolvedAdvisories,
    passed: exceeded.length === 0 && newAdvisories.length === 0,
  }
}

export function verifyApplicationIdentity({ bundleIdentifier, iconFile, iconHash, expectedIconHash }, expected) {
  if (bundleIdentifier !== expected.bundleIdentifier) {
    throw new Error(`Unexpected bundle identifier: ${bundleIdentifier}`)
  }
  if (iconFile !== expected.iconFile || iconHash !== expectedIconHash) {
    throw new Error('Packaged application icon does not match the approved source')
  }
}

export function formatCounts(counts) {
  return `${counts.total} total (${counts.info} info, ${counts.low} low, ${counts.moderate} moderate, ${counts.high} high, ${counts.critical} critical)`
}

export function createVerificationMarkdown(report) {
  const dirtyDescription = report.source.dirty
    ? `dirty working tree allowed explicitly (${report.source.changedFiles.length} path(s))`
    : 'clean working tree'

  return `# Memory Atlas ${report.version} packaged-build verification

**Verification date:** ${report.generatedAt.slice(0, 10)}

**Status:** Automated release gate passed; installed-app interaction checks outstanding

**Source commit:** \`${report.source.commit}\` (${dirtyDescription})

**Host:** ${report.host.platform} ${report.host.release}, ${report.architecture}

**Toolchain:** Node ${report.toolchain.node}, npm ${report.toolchain.npm}

## Automated source and packaging gates

- Clean dependency installation from \`package-lock.json\`: passed.
- Production dependency audit: passed with ${formatCounts(report.audits.production.counts)}.
- Complete dependency audit: passed the accepted ${report.audits.reviewedOn} baseline with ${formatCounts(report.audits.complete.counts)}.
- Svelte and TypeScript checks: passed.
- Automated tests: passed.
- Vite production build: passed.
- Electron Forge packaging and DMG creation: passed for \`darwin/${report.architecture}\`.
- Packaged ASAR content inspection: passed.
- Temporary and DMG-embedded application signatures: passed deep/strict verification.
- DMG checksum verification: passed.

The complete dependency audit is a comparison with the reviewed residual-risk
baseline in \`${report.audits.reviewDocument}\`. The release script never changes
dependencies or runs \`npm audit fix\`. A new advisory or a count above the
baseline stops the release for separate review.

## Artifact identity

| Property | Verified value |
| --- | --- |
| Application version | \`${report.version}\` |
| Architecture | \`${report.architecture}\` |
| Artifact | \`${report.artifact.relativePath}\` |
| Size | ${report.artifact.bytes.toLocaleString('en-US')} bytes |
| SHA-256 | \`${report.artifact.sha256}\` |
| Bundle identifier | \`${report.application.bundleIdentifier}\` |
| App CDHash | \`${report.application.cdHash}\` |
| Signing | ${report.application.signing} |
| Team identifier | ${report.application.teamIdentifier} |
| Notarization | ${report.application.notarization} |

Detailed command logs and the machine-readable report were generated under
\`${report.outputDirectory}\`. That directory is ignored by Git.

## Manual verification still required

Install the exact DMG and complete the installed-app smoke test in
\`docs/operations/macos-packaging.md\`. Do not publish or tag this build until
the intended release workflow, release notes, licensing state, and manual checks
have been reviewed.
`
}

function helpText() {
  return `Memory Atlas macOS release gate

Usage:
  npm run release:mac -- --allow-network-audit

Options:
  --allow-network-audit  Confirm that npm may submit dependency metadata to its advisory service.
  --allow-dirty          Permit a local, non-reproducible build from a dirty working tree.
  --replace-artifact     Replace an existing DMG with the same version and architecture.
  --help, -h             Show this help.

The gate never publishes, tags, commits, installs the app, or changes dependencies.
`
}

function timestampForPath(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function sanitizeStepName(value) {
  return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
}

function tail(value, lineCount = 40) {
  return value.trimEnd().split('\n').slice(-lineCount).join('\n')
}

async function runCommand({ command, args = [], label, logDir, acceptedExitCodes = [0] }) {
  const logPath = path.join(logDir, `${sanitizeStepName(label)}.log`)
  process.stdout.write(`RUN   ${label}\n`)

  const result = await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    child.on('error', reject)
    child.on('close', (exitCode, signal) => resolve({ exitCode, signal, stdout, stderr }))
  })

  const invocation = [command, ...args].join(' ')
  await writeFile(
    logPath,
    `$ ${invocation}\n\n[stdout]\n${result.stdout}\n[stderr]\n${result.stderr}\n[exit]\n${result.exitCode ?? `signal ${result.signal}`}\n`,
  )

  if (!acceptedExitCodes.includes(result.exitCode)) {
    process.stdout.write(`FAIL  ${label}\n`)
    const excerpt = tail(`${result.stdout}\n${result.stderr}`)
    throw new Error(
      `${label} failed (exit ${result.exitCode ?? result.signal}). Log: ${path.relative(rootDir, logPath)}${excerpt ? `\n\n${excerpt}` : ''}`,
    )
  }

  process.stdout.write(`PASS  ${label}\n`)
  return { ...result, logPath }
}

async function sha256(filePath) {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(filePath)) hash.update(chunk)
  return hash.digest('hex')
}

async function verifyResourceTree(source, target) {
  const collect = async (directory, prefix = '') => {
    const files = []
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const relative = path.join(prefix, entry.name)
      if (entry.isDirectory()) files.push(...await collect(path.join(directory, entry.name), relative))
      else if (entry.isFile()) files.push(relative)
      else throw new Error(`Unexpected resource type: ${relative}`)
    }
    return files.sort()
  }
  const expected = await collect(source)
  const actual = await collect(target)
  if (JSON.stringify(expected) !== JSON.stringify(actual)) throw new Error('Packaged legal resource inventory differs from generated inputs')
  for (const file of expected) {
    if (await sha256(path.join(source, file)) !== await sha256(path.join(target, file))) {
      throw new Error(`Packaged legal resource differs: ${file}`)
    }
  }
}

function parseKeyValue(output, name) {
  const match = output.match(new RegExp(`^${name}=(.*)$`, 'm'))
  return match?.[1]?.trim()
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

async function ensurePath(filePath, description) {
  try {
    await access(filePath)
  } catch {
    throw new Error(`${description} not found at ${filePath}`)
  }
}

async function pathExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function runAudit({ npmInvocation, args, label, logDir, maximum, acceptedAdvisories }) {
  const invocation = npmInvocation(['audit', ...args, '--json'])
  const result = await runCommand({
    ...invocation,
    label: `${label} query`,
    logDir,
    acceptedExitCodes: [0, 1],
  })

  let auditReport
  try {
    auditReport = JSON.parse(result.stdout)
  } catch {
    throw new Error(`${label} did not produce valid JSON. Log: ${path.relative(rootDir, result.logPath)}`)
  }
  if (auditReport.error) {
    throw new Error(`${label} could not reach the advisory service. Log: ${path.relative(rootDir, result.logPath)}`)
  }

  const evaluation = evaluateAudit(auditReport, maximum, acceptedAdvisories)
  if (!evaluation.passed) {
    const reasons = []
    if (evaluation.exceeded.length) {
      reasons.push(`counts exceeded the baseline for: ${evaluation.exceeded.join(', ')}`)
    }
    if (evaluation.newAdvisories.length) {
      reasons.push(`new advisories: ${evaluation.newAdvisories.join(', ')}`)
    }
    throw new Error(`${label} requires separate security review: ${reasons.join('; ')}`)
  }

  process.stdout.write(`PASS  ${label} baseline\n`)
  return evaluation
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    process.stdout.write(helpText())
    return
  }
  if (process.platform !== 'darwin') {
    throw new Error('The release gate must run on macOS')
  }
  if (!options.allowNetworkAudit) {
    throw new Error(
      'Dependency audits submit package and lockfile metadata to npm. Rerun with --allow-network-audit after authorizing that disclosure.',
    )
  }

  const packageJson = await readJson(packagePath)
  const policy = await readJson(policyPath)
  const architecture = process.arch
  if (!['arm64', 'x64'].includes(architecture)) {
    throw new Error(`Unsupported macOS architecture: ${architecture}`)
  }

  const runId = `${packageJson.version}-${architecture}-${timestampForPath()}`
  const outputDirectory = path.join(rootDir, 'out', 'release', runId)
  const logDir = path.join(outputDirectory, 'logs')
  await mkdir(logDir, { recursive: true })
  const dmgPath = path.join(
    rootDir,
    'out',
    'make',
    `${packageJson.productName}-${packageJson.version}-${architecture}.dmg`,
  )

  const npmInvocation = (args) =>
    process.env.npm_execpath
      ? { command: process.execPath, args: [process.env.npm_execpath, ...args] }
      : { command: 'npm', args }

  const nodeVersion = process.versions.node
  if (
    compareVersions(nodeVersion, policy.toolchain.node.minimum) < 0 ||
    compareVersions(nodeVersion, policy.toolchain.node.maximumExclusive) >= 0
  ) {
    throw new Error(
      `Node ${nodeVersion} is unsupported; expected >=${policy.toolchain.node.minimum} <${policy.toolchain.node.maximumExclusive}. Run nvm use.`,
    )
  }

  const npmVersionResult = await runCommand({
    ...npmInvocation(['--version']),
    label: 'npm version',
    logDir,
  })
  const npmVersion = npmVersionResult.stdout.trim()
  if (npmVersion !== policy.toolchain.npm) {
    throw new Error(`npm ${npmVersion} is unsupported; expected ${policy.toolchain.npm}`)
  }

  const commitResult = await runCommand({
    command: 'git',
    args: ['rev-parse', 'HEAD'],
    label: 'source commit',
    logDir,
  })
  const statusResult = await runCommand({
    command: 'git',
    args: ['status', '--porcelain', '--untracked-files=all'],
    label: 'working tree',
    logDir,
  })
  const changedFiles = statusResult.stdout.trim()
    ? statusResult.stdout.trimEnd().split('\n')
    : []
  if (changedFiles.length && !options.allowDirty) {
    throw new Error(
      `The working tree is not clean. Commit the release source or rerun an explicitly non-reproducible local build with --allow-dirty.\n${changedFiles.join('\n')}`,
    )
  }
  if ((await pathExists(dmgPath)) && !options.replaceArtifact) {
    throw new Error(
      `A DMG already exists for ${packageJson.version}/${architecture}: ${path.relative(rootDir, dmgPath)}. Bump the version, preserve the existing artifact, or explicitly use --replace-artifact for an unaccepted retry.`,
    )
  }

  process.stdout.write(`\nMemory Atlas ${packageJson.version} — darwin/${architecture}\n`)
  if (changedFiles.length) process.stdout.write('WARN  dirty working tree explicitly allowed\n')

  await runCommand({
    ...npmInvocation(['ci', '--no-audit', '--no-fund']),
    label: 'clean dependency install',
    logDir,
  })

  const productionAudit = await runAudit({
    npmInvocation,
    args: ['--omit=dev'],
    label: 'production dependency audit',
    logDir,
    maximum: policy.audit.productionMaximum,
    acceptedAdvisories: [],
  })
  const completeAudit = await runAudit({
    npmInvocation,
    args: [],
    label: 'complete dependency audit',
    logDir,
    maximum: policy.audit.completeMaximum,
    acceptedAdvisories: policy.audit.acceptedAdvisoryUrls,
  })

  await runCommand({ ...npmInvocation(['run', 'check']), label: 'Svelte and TypeScript checks', logDir })
  await runCommand({ ...npmInvocation(['test']), label: 'automated tests', logDir })
  await runCommand({ command: process.execPath, args: ['scripts/check-doc-links.mjs'], label: 'documentation links', logDir })
  await runCommand({ ...npmInvocation(['run', 'build']), label: 'Vite production build', logDir })

  const forgeCommand = path.join(rootDir, 'node_modules', '.bin', 'electron-forge')
  await ensurePath(forgeCommand, 'Electron Forge executable')
  await runCommand({
    command: forgeCommand,
    args: ['make', '--platform=darwin', `--arch=${architecture}`],
    label: 'Electron Forge DMG',
    logDir,
  })

  const appPath = path.join(
    policy.forgeOutDir,
    `${packageJson.productName}-darwin-${architecture}`,
    `${packageJson.productName}.app`,
  )
  await ensurePath(appPath, 'Packaged application')
  await ensurePath(dmgPath, 'DMG artifact')

  const codesignVerify = async (targetPath, label) =>
    runCommand({
      command: 'codesign',
      args: ['--verify', '--deep', '--strict', '--verbose=2', targetPath],
      label,
      logDir,
    })
  await codesignVerify(appPath, 'temporary app signature')
  const codesignDetails = await runCommand({
    command: 'codesign',
    args: ['-dv', '--verbose=4', appPath],
    label: 'application signature details',
    logDir,
  })
  const signatureOutput = `${codesignDetails.stdout}\n${codesignDetails.stderr}`

  const asarPath = path.join(appPath, 'Contents', 'Resources', 'app.asar')
  const asarCommand = path.join(rootDir, 'node_modules', '.bin', 'asar')
  await ensurePath(asarPath, 'Packaged ASAR')
  await ensurePath(asarCommand, 'ASAR inspection executable')
  const asarList = await runCommand({
    command: asarCommand,
    args: ['list', asarPath],
    label: 'packaged ASAR contents',
    logDir,
  })
  const asarEntries = asarList.stdout.trimEnd().split('\n')
  const missingEntries = policy.requiredAsarEntries.filter((entry) => !asarEntries.includes(entry))
  const missingPatterns = policy.requiredAsarPatterns.filter(
    (pattern) => !asarEntries.some((entry) => new RegExp(pattern).test(entry)),
  )
  if (missingEntries.length || missingPatterns.length) {
    throw new Error(
      `Packaged ASAR is missing required content: ${[...missingEntries, ...missingPatterns].join(', ')}`,
    )
  }

  await runCommand({ command: 'hdiutil', args: ['verify', dmgPath], label: 'DMG checksum verification', logDir })

  const mountPoint = await mkdtemp('/private/tmp/memory-atlas-release-verify-')
  let mounted = false
  try {
    await runCommand({
      command: 'hdiutil',
      args: ['attach', '-readonly', '-nobrowse', '-mountpoint', mountPoint, dmgPath],
      label: 'mount DMG read-only',
      logDir,
    })
    mounted = true
    const mountedAppPath = path.join(mountPoint, `${packageJson.productName}.app`)
    await ensurePath(mountedAppPath, 'Application embedded in DMG')
    await codesignVerify(mountedAppPath, 'DMG app signature')
  } finally {
    if (mounted) {
      await runCommand({ command: 'hdiutil', args: ['detach', mountPoint], label: 'detach DMG', logDir })
    }
    await rm(mountPoint, { recursive: true, force: true })
  }

  const infoPlist = path.join(appPath, 'Contents', 'Info.plist')
  const plistValue = async (key, label) =>
    runCommand({
      command: 'plutil',
      args: ['-extract', key, 'raw', '-o', '-', infoPlist],
      label,
      logDir,
    })
  const bundleVersion = (await plistValue('CFBundleShortVersionString', 'bundle short version')).stdout.trim()
  const buildVersion = (await plistValue('CFBundleVersion', 'bundle version')).stdout.trim()
  const bundleIdentifier = (await plistValue('CFBundleIdentifier', 'bundle identifier')).stdout.trim()
  if (bundleVersion !== packageJson.version || buildVersion !== packageJson.version) {
    throw new Error(
      `Packaged versions do not match package.json: short=${bundleVersion}, build=${buildVersion}, expected=${packageJson.version}`,
    )
  }

  const iconFile = (await plistValue('CFBundleIconFile', 'bundle icon')).stdout.trim()
  const iconPath = path.join(appPath, 'Contents', 'Resources', policy.application.iconFile)
  await ensurePath(iconPath, 'Custom application icon')
  verifyApplicationIdentity({
    bundleIdentifier,
    iconFile,
    iconHash: await sha256(iconPath),
    expectedIconHash: await sha256(path.join(rootDir, policy.application.iconSource)),
  }, policy.application)
  for (const license of ['LICENSE', 'LICENSES.chromium.html']) {
    await ensurePath(path.join(appPath, 'Contents', 'Resources', license), `Electron ${license}`)
  }

  const legalResources = path.join(appPath, 'Contents', 'Resources', 'third-party')
  await verifyResourceTree(path.join(rootDir, 'out', 'legal', 'third-party'), legalResources)
  process.stdout.write('PASS  packaged dependency notices and MPL source parity\n')

  const executablePath = path.join(appPath, 'Contents', 'MacOS', packageJson.productName)
  const fileResult = await runCommand({
    command: 'file',
    args: [executablePath],
    label: 'executable architecture',
    logDir,
  })
  const expectedArchitecture = architecture === 'arm64' ? 'arm64' : 'x86_64'
  if (!fileResult.stdout.includes(expectedArchitecture)) {
    throw new Error(`Packaged executable is not ${expectedArchitecture}: ${fileResult.stdout.trim()}`)
  }

  const finalStatusResult = await runCommand({
    command: 'git',
    args: ['status', '--porcelain', '--untracked-files=all'],
    label: 'final working tree',
    logDir,
  })
  const finalChangedFiles = finalStatusResult.stdout.trim()
    ? finalStatusResult.stdout.trimEnd().split('\n')
    : []
  if (JSON.stringify(finalChangedFiles) !== JSON.stringify(changedFiles)) {
    throw new Error(
      `The release process changed the source working tree. Review these paths before rebuilding:\n${finalChangedFiles.join('\n')}`,
    )
  }

  const artifactStat = await stat(dmgPath)
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    version: packageJson.version,
    architecture,
    host: { platform: os.platform(), release: os.release() },
    toolchain: { node: nodeVersion, npm: npmVersion },
    source: {
      commit: commitResult.stdout.trim(),
      dirty: changedFiles.length > 0,
      changedFiles,
    },
    audits: {
      reviewedOn: policy.audit.reviewedOn,
      reviewDocument: policy.audit.reviewDocument,
      production: productionAudit,
      complete: completeAudit,
    },
    application: {
      bundleIdentifier,
      cdHash: parseKeyValue(signatureOutput, 'CDHash') ?? 'not reported',
      signing: /flags=.*adhoc|Signature=adhoc/i.test(signatureOutput)
        ? 'Ad hoc; deep/strict verification passed'
        : 'Deep/strict verification passed; inspect signature log',
      teamIdentifier: parseKeyValue(signatureOutput, 'TeamIdentifier') ?? 'not set',
      notarization: policy.signing.notarized ? 'Configured' : 'Not notarized',
    },
    artifact: {
      relativePath: path.relative(rootDir, dmgPath),
      bytes: artifactStat.size,
      sha256: await sha256(dmgPath),
    },
    outputDirectory: path.relative(rootDir, outputDirectory),
    manualVerificationRequired: true,
  }

  const reportPath = path.join(outputDirectory, 'release-report.json')
  const verificationPath = path.join(outputDirectory, 'verification-draft.md')
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  await writeFile(verificationPath, createVerificationMarkdown(report))

  process.stdout.write(`\nRELEASE GATE PASSED\n`)
  process.stdout.write(`Artifact            ${report.artifact.relativePath}\n`)
  process.stdout.write(`SHA-256             ${report.artifact.sha256}\n`)
  process.stdout.write(`Production audit    ${formatCounts(productionAudit.counts)}\n`)
  process.stdout.write(`Complete audit      ${formatCounts(completeAudit.counts)}\n`)
  process.stdout.write(`Report              ${path.relative(rootDir, reportPath)}\n`)
  process.stdout.write(`Verification draft  ${path.relative(rootDir, verificationPath)}\n`)
  process.stdout.write('Manual smoke test   REQUIRED\n')
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(`\nRELEASE GATE FAILED\n${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
