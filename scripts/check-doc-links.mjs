#!/usr/bin/env node
// Check local Markdown link destinations against publishable Git paths. Fragments
// and remote URLs are outside this filesystem check and need rendered-page QA.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export function destinations(markdown) {
  const prose = markdown.replace(/^\s*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\s*\1\s*$/gm, '')
  const links = []
  const pattern = /!?\[(?:[^\]\\]|\\.)*\]\(\s*(?:<([^>]+)>|((?:[^\s()\\]|\\.|\([^()]*\))+))(?:\s+["'][^\n]*?["'])?\s*\)|^\s*\[[^\]]+\]:\s*(?:<([^>]+)>|(\S+))/gm
  for (const match of prose.matchAll(pattern)) links.push(match[1] ?? match[2] ?? match[3] ?? match[4])
  return links
}

export function checkLinks(root, files) {
  const published = new Set(files.map(file => file.split(path.sep).join('/')))
  const problems = []
  for (const file of files.filter(file => /\.md$/i.test(file))) {
    if (!existsSync(path.join(root, file))) continue
    for (const destination of destinations(readFileSync(path.join(root, file), 'utf8'))) {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(destination)) continue
      let local
      try { local = decodeURIComponent(destination.split(/[?#]/)[0]).replace(/\\([() ])/g, '$1') }
      catch { problems.push(`${file}: malformed URL ${destination}`); continue }
      if (!local) continue
      // GitHub resolves these repository-relative links on the hosting site.
      if (file === 'README.md' && /^\.\.\/\.\.\/releases(?:\/|$)/.test(local)) continue
      const absolute = path.resolve(root, path.dirname(file), local)
      const relative = path.relative(root, absolute).split(path.sep).join('/')
      if (relative.startsWith('../') || path.isAbsolute(relative)) {
        problems.push(`${file}: link escapes repository: ${destination}`)
      } else if (!existsSync(absolute)) {
        problems.push(`${file}: missing destination: ${destination}`)
      } else if (statSync(absolute).isDirectory()) {
        if (![...published].some(candidate => candidate.startsWith(`${relative}/`))) problems.push(`${file}: unpublished directory: ${destination}`)
      } else if (!published.has(relative)) problems.push(`${file}: unpublished destination: ${destination}`)
    }
  }
  return problems
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean)
  const problems = checkLinks(root, files)
  for (const problem of problems) console.error(problem)
  console.log(`Checked ${files.filter(file => /\.md$/i.test(file)).length} Markdown files: ${problems.length} local destination problem(s). Remote URLs and fragments require separate verification.`)
  process.exitCode = problems.length ? 1 : 0
}
