# Dependency security policy and current review

**Status:** Living operational policy and risk review

**Owner:** Memory Atlas maintainers

**Last reviewed:** 2026-09-04

**Applies to:** Runtime, development, and macOS packaging dependencies

## Policy

Dependency-update work must run both:

```bash
npm run audit:prod
npm run audit:all
```

The production audit covers packages shipped as application dependencies. The
complete audit also covers test and packaging tools that execute during install
and release construction. A raw advisory count is not an automatic release
decision. Each finding is reviewed for severity, reachability, affected phase,
fix availability, and whether the proposed update preserves the supported
release path.

`npm audit` submits package and lockfile dependency metadata to npm's advisory
service. The automated release gate therefore requires the explicit
`--allow-network-audit` flag; using it records the operator's authorization for
that lookup. It does not authorize `npm audit fix`, package updates, or any
other external action.

Available non-breaking fixes should be applied with the lockfile, followed by a
clean `npm ci`, source checks, packaging, signature verification, and an
installed-build smoke test. Do not force an unsupported major or pre-release
build-tool upgrade only to reduce an advisory count.

## Automated release baseline

Routine releases use the reviewed policy in `scripts/release-policy.json`.
`npm run release:mac -- --allow-network-audit` requires zero production
findings and permits complete-tree findings only when both conditions hold:

- no severity count exceeds the last reviewed maximum; and
- every reported leaf advisory URL is already present in the accepted set.

A lower count or resolved advisory is allowed and recorded. A new advisory or
higher count stops the release and becomes a separate dependency-security
review; the release script never retries with a weaker audit mode and never
runs automatic remediation. After that review, update this document and the
machine policy together. Do not change the policy merely to make a failing
release pass.

## 2026-09-04 review

The 0.2.0 local macOS build used Node 20.18.0 and npm 10.9.0. The initial
production audit found one moderate `@xmldom/xmldom` advisory. The compatible
fix was applied by moving the declared range from `^0.9.10` to `^0.9.12`; a
subsequent production audit passed with zero vulnerabilities.

Non-force remediation also updated the compatible locked build transitives
`browserslist`, `fast-uri`, `ip-address`, and `nanoid`. After a final clean
install, the complete-tree audit reported 28 vulnerabilities (3 low, 24 high,
1 critical). The remaining report is limited to Electron and Electron Forge
packaging paths involving `electron`, `extract-zip`, `image-size`, `tar`, and
`tmp`.

The patched Electron 41 releases identified by npm require Node 22.12 or later,
which is incompatible with the accepted Node 20.18.x release toolchain. The
automatic non-force remediation therefore failed its engine check and did not
change the locked Electron 41.7.1 version. Memory Atlas does not register custom
Electron protocols or embed sandboxed iframes, which limits reachability of the
two reported Electron behaviors. The app also denies unexpected permissions,
blocks in-app navigation away from packaged content, and opens only validated
HTTPS links externally. This is a time-bounded local-testing acceptance, not a
claim that the affected Electron runtime is patched.

The remaining Forge findings continue to be build-host risks: release inputs
are repository-owned, the toolchain runs non-interactively, and untrusted
archives, image assets, temporary-file names, photo metadata, and photo file
names are not passed into the affected packaging operations. npm's suggested
forced remediation would downgrade Forge across a breaking boundary and was
not accepted.

**Update trigger:** Reconcile the project's Node support range with a patched
stable Electron release, then rerun clean installation, both audits, all source
checks, packaging, signature verification, and the installed-app smoke test.
Also accept compatible stable Forge updates that remove the remaining
`extract-zip`, `image-size`, `tar`, and `tmp` paths.

## 2026-07-31 review

A clean install from `package-lock.json` completed on Node 20.18.0 and npm
10.9.0. npm reported:

- production/runtime tree: zero vulnerabilities;
- complete tree after non-breaking remediation: 31 vulnerabilities (3 low,
  27 high, 1 critical);
- current stable Electron Forge: 7.11.2;
- vulnerable packages are development and packaging transitives and are not
  included in the renderer's production dependency set.

With explicit authorization to submit the dependency tree to npm's advisory
endpoint, both audit commands completed. `npm audit fix` without `--force`
updated the available transitive fixes:

- `brace-expansion` 1.1.15 to 1.1.18 and 2.1.1 to 2.1.4;
- `fast-uri` 3.1.3 to 3.1.4;
- `postcss` 8.5.16 to 8.5.25; and
- `nanoid` 3.3.15 to 3.3.16.

A second clean `npm ci` and both audits confirmed the results above. The
complete-tree count rose from 25 to 31 even though available fixes were applied:
npm now expands a newer unpatched `brace-expansion` advisory across additional
Forge dependency paths. This is an audit-counting change, not increased
production exposure.

### Electron Forge `brace-expansion` path

The remaining high-severity `brace-expansion` advisory
([GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg))
concerns denial of service through unbounded expansion. npm reports no fixed
release. The affected instances are reached through Forge's packaging,
universal-binary, cache, and glob/minimatch paths.

Memory Atlas invokes these tools only with repository-owned paths and fixed
configuration. It does not pass user photo names or metadata into glob patterns
or brace expressions. The issue is therefore a trusted-build-input risk, not a
renderer or selected-photo reachability path.

**Update trigger:** Accept the first compatible stable upstream releases that
move every affected `minimatch`/`brace-expansion` path to fixed versions, then
rerun clean installation, audits, tests, packaging, and signature verification.

### Electron Forge `tar` path

Forge 7.11.2 depends on `@electron/rebuild` 3.7.2, which pulls `tar` 6.2.1
directly and through Electron's Node-gyp toolchain. The affected `tar` releases
have archive-extraction path traversal and overwrite advisories. Memory Atlas
does not accept user-supplied archives: the path executes only while installing
locked build dependencies or constructing an application from repository-owned
inputs. Package integrity checks and a reviewed lockfile reduce exposure, but
do not remove build-chain risk.

The final audit reports no compatible fix on the installed stable Forge 7
line. Electron Forge issue
[#4228](https://github.com/electron/forge/issues/4228) tracks the stable
upgrade/backport gap. The current audit also includes Forge 8 alpha and
`@electron/rebuild` 4 in affected ranges, so adopting that pre-release would not
clear the current findings and would add breaking changes and a newer Node
requirement. Memory Atlas therefore does not force a `tar` override or adopt
the alpha toolchain.

**Update trigger:** Move to the first stable Forge release, or a stable 7.x
backport, that replaces `@electron/rebuild` 3. Re-run the full release gate
before accepting it.

### Legacy `tmp` and related CLI paths

Forge's interactive CLI dependency path includes `external-editor` 3.1.0 and
`tmp` 0.0.33. Memory Atlas invokes Forge non-interactively with fixed
repository configuration and never calls the external-editor feature or passes
attacker-controlled temporary-file prefixes. This is a build-host risk rather
than packaged application reachability.

An override across `tmp`'s pre-1.0 compatibility boundary would be
project-maintained and unsupported by the parent package, so it is not accepted
without an upstream dependency update. The same stable Forge update trigger
applies.

## Release controls while residual findings remain

- Build only from the reviewed lockfile and trusted repository inputs.
- Do not run the packaging toolchain over untrusted archives or unreviewed
  dependency changes.
- Keep Electron and Electron Forge on a deliberate security-update cadence.
- Run both audits during dependency work and record remaining paths and
  rationale.
- Verify the exact packaged app signature and DMG checksum after every
  dependency change.
- Replace this risk acceptance when a supported upstream fix becomes available.
