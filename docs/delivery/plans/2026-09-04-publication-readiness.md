# Memory Atlas publication-readiness specification and delivery plan

**Status:** Implementation in progress; source changes verified, publication gates pending
**Plan date:** 2026-09-04
**Last updated:** 2026-09-07
**Scope:** First public GitHub source import and unnotarized tester prerelease
**Source audit:** Repository state at `255efcb`

## Objective

Import Memory Atlas into its existing public GitHub repository, then publish an
explicitly unnotarized tester prerelease without exposing private source
material, ambiguous asset rights, or avoidable repository and
application-quality problems. Treat public source, a tester DMG, and normal
macOS distribution as separate gates; none may silently claim verification or
distribution qualities it has not achieved.

This document is the implementation handoff for a later session. It records the
required decisions, ordered work packages, acceptance criteria, delegation
boundaries, and verification evidence. It does not authorize a history rewrite,
network audit, GitHub publication, signing operation, tag, release, or upload.

## Implementation record

On 2026-09-07 the owner authorized execution of all plan steps. See the
[implementation verification](../verifications/2026-09-07-publication-readiness.md)
for completed work and remaining installed-app/authentication gates. The
original requirements and historical baseline below remain the acceptance record.

## Current baseline

The pre-publication audit established the following baseline:

- `main` is clean and has no configured Git remote or release tag.
- The owner has created the public personal repository
  `https://github.com/chrwittm/memory-atlas`. An unauthenticated GitHub check on
  2026-09-07 confirmed that it is public, its default branch is `main`, and it
  has exactly one initial commit containing only the Apache-2.0 `LICENSE`. Its
  remote history has not yet been connected to this working repository.
- Node 20.18.0 and npm 10.9.0 pass `npm run check` with zero errors and
  warnings, all 13 test files and 53 tests pass, and `npm run build` succeeds.
- The build retains the known warning for the dynamically loaded MapLibre chunk;
  this is monitored performance work, not a source-publication blocker.
- Reachable commits and tracked files contain no detected private photo files,
  DMGs, environment files, credentials, API tokens, or private keys.
- The only tracked JPEG files are the entry-screen NASA image and two generated,
  non-personal 32×32 test fixtures.
- Private photo corpora, generated builds, release output, dependencies, and
  Finder metadata are ignored. Existing private corpus directories were
  confirmed ignored.
- Every reachable commit currently exposes the author's personal Gmail address.
- Tracked documentation names the `2026-06-20-Schlossherrenrunde` corpus. The
  owner permits that name to remain public, but the actual JPEGs must stay local
  and ignored. A purpose-built public fixture is deferred to `MA-FEAT-019`.
- Apache-2.0 is selected but not yet present in the local history; the NASA image
  lacks a recorded source and reuse statement, and one GitHub configuration
  comment links to a moved runbook.
- The 0.2.0 DMG remains a local artifact: it is ad-hoc signed, not notarized,
  has not completed the installed-app checklist, and was built while the
  accepted dependency review still included Electron runtime and packaging
  findings.

The original audit used targeted current-tree and reachable-history pattern
searches. The implementation must repeat those searches and, when available,
run a dedicated secret scanner before publication. A scanner finding requires
review; it must not be deleted, ignored, or rotated automatically.

## Publication targets and gates

### Gate A — Public source repository

Gate A imports the source into the existing public GitHub repository. It does
not create or upload a DMG and does not claim that 0.2.0 is a transferable
macOS release.

Gate A requires:

1. Apache-2.0 represented consistently in the repository;
2. complete provenance and reuse documentation for every tracked visual asset;
3. the approved author-email rewrite and an explicit decision for every public
   fixture file;
4. a clean reachable-history secret and privacy review;
5. corrected repository metadata and links;
6. a concise, non-personal README screenshot or preview;
7. passing source checks and CI configuration; and
8. explicit approval for the exact first source push, including any required
   `--force-with-lease` replacement of the license-only placeholder history.

Gate A is the immediate target. Completing it removes the one-time repository
setup burden, but Git is not automatic synchronization: future local commits
still require an intentional push.

### Gate B — Tester prerelease

Gate B allows a DMG to be attached to a public GitHub prerelease for a
deliberately limited tester audience. If the artifact is not Developer ID signed
and notarized, the release title, notes, installation instructions, and visible
prerelease status must say so plainly. Gate B is not the recommended endpoint
for normal public distribution.

Gate B requires Gate A plus:

1. complete provenance and reuse documentation for every packaged visual asset;
2. a custom application icon and durable bundle identifier;
3. resolution or explicit re-evaluation of the Electron runtime findings under
   the current dependency advisories;
4. reproduction and resolution or evidence-backed reclassification of
   `MA-BUG-002`;
5. a clean run of the complete release gate with an accepted, current audit;
6. successful installed-app testing on compatible hardware;
7. an exact source commit, version, architecture, checksum, and signing state;
   and
8. release notes that accurately distinguish tester installation from normal
   notarized distribution.

### Gate C — Normal public macOS release

Gate C is the professional download path for an audience that should not need a
Gatekeeper bypass. It requires Gate B plus:

1. Apple Developer ID Application signing;
2. Hardened Runtime configured consistently for Electron's nested code;
3. successful Apple notarization and ticket stapling;
4. Gatekeeper verification on a separately downloaded artifact; and
5. compatible-hardware testing for every advertised architecture.

Intel or universal artifacts must not be promised unless they are built and
tested. Automatic updates remain out of scope.

## Recorded owner decisions

The owner supplied the following decisions on 2026-09-07. Sub-agents must use
these decisions as written and must not broaden them.

### D1 — Repository license

**Decision:** Apache License 2.0. The public GitHub repository was initialized
with that license. Reconcile its canonical license text into the local project,
add the SPDX identifier `Apache-2.0` to `package.json`, and make README wording
consistent. Do not invent custom restrictions inside the standard license.

### D2 — Commit-author privacy

**Decision:** Remove the current personal Gmail address from every reachable
author and committer identity before the first push. Preserve the author name,
use the owner's GitHub-provided `noreply` address, and configure that address
locally for future commits. Do not reproduce the private address in tracked
documentation or verification output.

A history rewrite is destructive and changes every affected commit ID. It
requires separate owner approval immediately before execution. Create a
recoverable backup outside the repository, perform the rewrite before other
implementation commits, and verify the resulting history. Do not push a backup
reference containing the old identities.

### D3 — Private corpus naming

**Decision:** The name and date `2026-06-20-Schlossherrenrunde` may remain in
tracked documentation, but the actual 24 JPEGs remain local, read-only, and
ignored. Do not create tracked derivatives or ignore exceptions for this corpus.

Creating a more varied, purpose-built, compact public test corpus is tracked as
`MA-FEAT-019` in the product backlog.

### D4 — Initial publication target

**Decision:** Complete Gate A by importing the source into the already-public
repository, then complete Gate B with an explicitly unnotarized public tester
prerelease. Gate C is deferred until normal distribution without a Gatekeeper
bypass is worth the signing/notarization cost and setup.

### D5 — Durable application identity

**Decision:** Use `io.github.chrwittm.memoryatlas` as the durable bundle
identifier unless packaging research finds a concrete platform conflict. The
current `com.memoryatlas.app` must not remain the signed distribution identity.

The custom icon remains part of Gate B. Its visual design may follow the current
globe/atlas direction but must be original and must not incorporate NASA marks.

### D6 — Public vulnerability-reporting route

**Decision:** Enable GitHub private vulnerability reporting and add a short root
`SECURITY.md` directing reporters to that private GitHub form rather than a
personal email address.

Private vulnerability reporting is a GitHub-hosted confidential inbox for a
public repository: a researcher submits details visible to repository
maintainers, the maintainer can discuss and coordinate a fix privately, and an
advisory can be published later if warranted. It is separate from Dependabot,
secret scanning, and ordinary public issues. Enabling it does not promise a
response time, security support contract, bounty, or automatic fix.
GitHub's current setup guidance is at
`https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting`.

### D7 — GitHub repository

**Decision:** Use the public repository in the owner's personal account:
`https://github.com/chrwittm/memory-atlas`. Its public visibility and current
license-only state were verified unauthenticated on 2026-09-07. Do not create
another repository, make it private, or move it to an organization without a
new owner decision.

## Work package 0 — Freeze and inventory

**Owner:** Primary agent
**Delegation:** Read-only inventory may be delegated; mutations may not begin
until the decisions above are recorded.

1. Confirm `git status --short --branch`, current commit, branches, tags, and
   remotes.
2. Inspect the existing public GitHub repository and its default branch,
   visibility, refs, license commit, and commit identity without changing it.
3. Save a file list and enumerate all reachable Git objects and historical
   paths. Confirm that no private corpus, generated DMG, environment file,
   signing material, or personal document was ever reachable.
4. Search tracked files and reachable diffs for credential patterns, personal
   email addresses, absolute paths, corpus names, GPS coordinates, host names,
   and other private identifiers.
5. Inspect metadata in every tracked binary asset.
6. Confirm ignore behavior for each private corpus and generated-output
   directory with `git check-ignore -v`.
7. Confirm that the recorded D1–D7 decisions still match the intended target
   before the public source import.

**Acceptance:** The inventory is reproducible, findings are classified, no
source file has been modified, and any unresolved privacy finding stops the
publication path.

## Work package 1 — History privacy rewrite

**Owner:** Primary agent only
**Delegation:** Do not delegate
**Condition:** Required by D2 before the first push

1. Ask for explicit approval immediately before rewriting history.
2. Record the intended old and new identities and the exact reachable refs.
3. Create a recoverable repository backup outside the working repository.
4. Rewrite author and committer email fields without changing commit messages,
   authored dates, file contents, or branch structure.
5. Verify every reachable commit identity and scan the rewritten history.
6. Configure repository-local Git author identity for future commits.
7. Confirm that no remote exists and that no tag or backup ref would publish the
   old history.

**Acceptance:** No reachable commit contains the private email, expected commit
count and messages remain present, the tree at the former and rewritten tips is
identical, and the backup location and recovery procedure are reported to the
owner.

## Work package 2 — Licensing and asset provenance

**Owner:** Primary agent integrates owner decisions
**Delegation:** A documentation sub-agent may prepare changes after D1 is fixed

1. Retrieve and verify the canonical Apache-2.0 text in the remote placeholder
   commit, then implement D1 consistently in root `LICENSE`, `package.json`, and
   `README.md` without merging unrelated histories merely to obtain one file.
2. Confirm that bundled dependency licenses remain in their normal packaged
   locations and that the repository license does not claim ownership of
   third-party material.
3. Replace the provisional entry-image note with an exact source record:
   - title: *Artemis II Captures the Terminator Line*;
   - NASA image identifier: `art002e000190`;
   - image credit: NASA;
   - capture date: 2026-04-02;
   - source: `https://www.nasa.gov/image-detail/amf-art002e000190/`; and
   - usage guidance:
     `https://www.nasa.gov/nasa-brand-center/images-and-media/`.
4. State factually that NASA is the source and that NASA does not endorse Memory
   Atlas.
5. Determine whether the tracked JPEG is the NASA-served file or a local
   derivative. If it is a derivative, either replace it with a verified
   NASA-served JPEG or document the deterministic resize/export and strip
   irrelevant local editing metadata. Preserve visual quality and do not add
   third-party branding.
6. Record a checksum for the final tracked asset and verify it has no GPS,
   personal, or unrelated metadata.

**Acceptance:** GitHub can detect the intended repository license, all license
statements agree, the image has an authoritative source and reuse record, and no
tracked asset remains marked provisional or unverified.

## Work package 3 — Repository privacy and presentation hygiene

**Owner:** Documentation/repository sub-agent, reviewed by primary agent
**Delegation:** Suitable for one sub-agent after any history rewrite

1. Retain the approved corpus name in existing documentation while confirming
   that every actual Schlossherrenrunde JPEG remains ignored and untracked.
2. Correct `.github/release.yml` to reference
   `docs/operations/macos-packaging.md`.
3. Validate every relative Markdown link and every explicit documentation path.
   GitHub-relative release links are allowed when their intended resolution is
   tested separately.
4. Enable private vulnerability reporting and add a short `SECURITY.md` that
   points to GitHub's private form without promising support, response times, or
   a bounty, as accepted in D6.
5. Add repository metadata to `package.json` for
   `https://github.com/chrwittm/memory-atlas`: `repository`, `homepage`, and
   `bugs`. Keep
   `private: true` so the desktop application cannot be published accidentally
   to npm.
6. Capture one or two screenshots that use only non-personal content. At least
   one should show the distinctive entry screen; a viewer screenshot must use a
   provenance-cleared demo image rather than a private corpus. Store optimized
   images under a documented public documentation-assets directory and add
   concise alt text to the README.
7. Remove language that reads as an unfinished internal reminder once its work
   is complete. Preserve honest POC and platform limitations.
8. Do not add badges that are unconfigured, failing, or merely decorative.

**Acceptance:** No tracked text contains a disallowed private identifier, the
README shows the product without exposing personal material, all local links
resolve, GitHub configuration points to current documents, and package metadata
matches the actual repository.

## Work package 4 — Application identity and visual packaging

**Owner:** Packaging sub-agent, reviewed by primary agent
**Delegation:** Suitable for one sub-agent; must not overlap dependency edits to
`package.json`, `package-lock.json`, or Forge configuration
**Condition:** Required for Gate B or C; optional for Gate A

1. Implement `io.github.chrwittm.memoryatlas` in Forge configuration and every
   release assertion, policy, test, and document that records it.
2. Create or select an original, rights-cleared Memory Atlas application icon.
   The icon must remain recognizable at macOS small sizes, avoid NASA marks,
   avoid implying NASA endorsement, and have a documented editable source.
3. Generate the required macOS icon representations deterministically and
   configure Electron Forge to embed them.
4. Verify the icon in the packaged `.app`, Finder, Dock, application switcher,
   and DMG presentation rather than only inspecting source files.
5. Add focused release-script assertions for the bundle identifier and expected
   icon resources when practical.
6. Update packaging documentation and immutable verification records only by
   adding new evidence; do not rewrite historical artifact facts.

**Acceptance:** The packaged application has a non-default icon at relevant
sizes, the final bundle identifier is stable and verified, no unlicensed visual
material is introduced, and packaging tests pass.

## Work package 5 — Dependency and Electron security refresh

**Owner:** Dependency sub-agent for research, then one integration owner
**Delegation:** Read-only research may run in parallel with work package 3 or 4;
lockfile and manifest edits must run alone
**Condition:** Required for Gate B or C

1. Research the current supported Node, Electron, Electron Forge, and related
   package versions using official release notes, security advisories, and
   engine requirements. This research is time-sensitive and must not reuse the
   2026-09-04 conclusion without verification.
2. Propose the smallest supported upgrade that removes or materially reduces
   the accepted Electron runtime risk without forced downgrades, unsupported
   overrides, or pre-release tooling.
3. Record any required Node toolchain decision in the appropriate architecture
   decision and product context before changing the supported range.
4. With explicit authorization for npm advisory requests, update the manifest
   and lockfile, run a clean install, and run both production and complete-tree
   audits. Never run `npm audit fix --force` merely to lower the count.
5. Classify remaining findings by runtime/build phase and reachability. A new
   accepted residual risk requires a dated review and synchronized update of
   `scripts/release-policy.json`.
6. Run source checks, tests, production build, Electron packaging, ASAR
   inspection, strict signature checks, and DMG verification after the upgrade.

**Acceptance:** No unresolved runtime advisory is described as patched when it
is only mitigated; the release policy matches the exact audit; Node and npm
requirements are consistent across `.nvmrc`, `package.json`, CI, README, and
operations docs; and the complete packaging path passes.

## Work package 6 — Fullscreen reliability

**Owner:** Viewer/test sub-agent, reviewed by primary agent
**Delegation:** Suitable for one sub-agent; may run in parallel with read-only
dependency research and non-overlapping documentation work
**Condition:** Required for Gate B or C

1. Reproduce `MA-BUG-002` in development, production preview, direct Electron,
   and an installed packaged build where possible.
2. Record the focused element, map state, fullscreen direction, macOS version,
   and exact source/artifact identity for every result.
3. Inspect keyboard dispatch and Fullscreen API rejection handling. Do not infer
   a fix from the historical report without reproduction evidence.
4. Add focused tests for entering and leaving fullscreen from the supported
   viewer focus regions and for retaining Escape priority.
5. Implement the smallest fix supported by the evidence, or reclassify/close the
   issue only when repeatable packaged evidence shows the report cannot be
   reproduced under defined conditions.
6. Update the user guide, known-issue record, product context, and a new dated
   verification record as required.

**Acceptance:** `F` reliably enters and exits fullscreen in both full-photo and
split-map installed layouts, automated regressions cover dispatch and failure
feedback, and the issue status matches packaged evidence.

## Work package 7 — Release reconciliation, versioning, and evidence

**Owner:** Primary agent
**Delegation:** Release-log review may be delegated; version choice, final gate,
tagging, and publication may not be delegated

The existing 0.2.0 artifact must remain an immutable local milestone. Changing
Electron, the icon, bundle identifier, signing configuration, or runtime behavior
changes the binary and therefore must not silently replace the recorded 0.2.0
DMG or reuse its checksum.

**Recommended version policy:** Publish the source repository with 0.2.0
described as an unreleased local milestone, then assign the first hardened
public binary a new patch version, normally 0.2.1. If the owner instead wants a
public 0.2.0, establish the exact source commit and produce a fresh, fully
verified artifact before creating the tag; remove or clearly supersede the
historical local checksum rather than presenting two different DMGs as the same
artifact.

For the selected version:

1. update `package.json` and `package-lock.json` together;
2. prepare release notes that distinguish source publication, prerelease, and
   normal distribution accurately;
3. run `npm run release:mac -- --allow-network-audit` from a clean committed
   release-candidate tree after explicit network-audit authorization;
4. complete the installed-app checklist without a Vite server;
5. verify source-photo checksums remain unchanged;
6. record the exact commit, architecture, toolchain, audit result, app identity,
   signature, notarization, size, and SHA-256 in a new dated verification file;
7. ensure the generated evidence and artifact remain ignored until publication;
   and
8. review the final diff and reachable history again.

**Acceptance:** The release evidence describes one exact artifact from one exact
source commit, no outstanding checklist is represented as complete, historical
0.2.0 evidence remains truthful, and the version is not reused for a materially
different binary.

## Work package 8 — GitHub connection and publication

**Owner:** Primary agent with explicit owner authorization
**Delegation:** Read-only settings checklist may be delegated; remote
reconciliation, push, tag, release, and artifact upload may not be delegated

1. Reconfirm that the repository is public, owned by `chrwittm`, named
   `memory-atlas`, and contains only the expected placeholder Apache-2.0 license
   commit before changing it.
2. Add the repository as `origin`, fetch it, and compare its license text and
   commit identity with the locally prepared Apache-2.0 state.
3. Reconcile the unrelated histories explicitly. The recommended clean import
   is to preserve the verified license content in the local publication commit
   and replace the placeholder-only remote branch with
   `git push --force-with-lease`, but only after separate approval for that exact
   destructive remote update. If the remote contains any additional work, stop
   rather than force-pushing it.
4. Push only the intended rewritten default branch. Do not use `--mirror` or
   `--all`, and do not push privacy-backup refs or old history.
5. Confirm GitHub renders the README, license, screenshots, relative links, and
   release links correctly and that CI passes on GitHub-hosted runners.
6. Configure the repository description, topics, social preview, default branch,
   branch protection/ruleset, dependency alerts, secret scanning where
   available, and private vulnerability reporting according to D6. Preserve
   public visibility.
7. Create an annotated version tag only for a release that has satisfied the
   selected gate. Verify the tag points to the recorded source commit.
8. Create the GitHub release or prerelease, upload only the verified DMG, and
   publish its checksum and exact signing/notarization state.
9. Download the uploaded asset from GitHub again and verify its SHA-256. For
   Gate C, perform Gatekeeper assessment and a launch test on the downloaded
   artifact.
10. Update README and release notes statements such as “no public release has
    been published yet” only after publication succeeds.

**Acceptance:** Only intended refs and files are present remotely, CI passes,
repository metadata is complete, the repository remains public, release text
matches the selected gate, and an uploaded binary exactly matches the recorded
checksum.

## Efficient delegation plan

All agents share one working tree. Sub-agents must receive explicit file
ownership, must not commit, rebase, rewrite history, tag, push, publish, install
applications, or change GitHub settings, and must report changed files plus
verification evidence to the primary agent. The primary agent reviews and
integrates all work.

Use this sequence to avoid collisions:

### Wave 0 — Primary agent only

- Confirm that the recorded D1–D7 decisions still match the intended target.
- Run work package 0.
- Run the separately approved history rewrite in work package 1.
- Establish a fresh clean baseline after rewritten commit IDs settle.

### Wave 1 — Parallel, non-overlapping work

- **Agent A: licensing and NASA provenance** — work package 2; owns `LICENSE`,
  `public/images/README.md`, and only the license/asset sections of README and
  `package.json` agreed with the coordinator.
- **Agent B: repository privacy and docs** — work package 3; owns corpus-name
  references, `.github/release.yml`, `SECURITY.md`, README presentation, and link
  validation. It must coordinate before touching README or `package.json`.
- **Agent C: dependency research only** — research phase of work package 5;
  makes no edits and returns a primary-source-supported upgrade proposal.

The primary agent reviews Wave 1, resolves overlapping README/package metadata
changes, and commits one coherent publication-hygiene change if authorized.

### Wave 2 — Parallel product/package work

- **Agent A: application identity and icon** — work package 4; owns icon assets,
  Forge icon/bundle configuration, focused packaging assertions, and related
  docs.
- **Agent B: fullscreen reliability** — work package 6; owns viewer dispatch,
  focused tests, known-issue updates, and feature verification.
- **Agent C: dependency research follow-up** — answers review questions without
  editing manifests or the lockfile.

Do not let the icon agent and dependency implementation edit Forge configuration
or package manifests concurrently.

### Wave 3 — Serialized integration

- One dependency integration owner performs work package 5 manifest and lockfile
  changes after Wave 2 is merged into the working tree.
- The primary agent performs work package 7, resolves documentation consistency,
  and runs the complete verification gate.
- The owner or primary agent performs manual installed-app checks and any Apple
  signing/notarization interaction.

### Wave 4 — Primary agent only

- After explicit remote-update approval, perform work package 8.
- Independently download and verify any uploaded release artifact.

## Verification checklist

### Source and privacy

- `git status --short --branch` is clean at each gate.
- `git diff --check` passes.
- Current tracked files and reachable history pass privacy and secret searches.
- Dedicated secret scanning passes or every finding is reviewed and documented.
- `git ls-files` contains no private corpus files, build output, DMGs, signing
  material, or Finder metadata.
- Every private corpus and output path is confirmed ignored.
- Tracked binary metadata contains no personal or location data.
- All Markdown local links and explicit runbook paths resolve.

### Automated quality

```bash
nvm use
npm ci --no-audit --no-fund
npm run check
npm test
npm run build
```

With explicit authorization for dependency-metadata submission:

```bash
npm run audit:prod
npm run audit:all
```

For Gate B or C, use the clean release gate rather than treating the commands
above as complete release evidence:

```bash
npm run release:mac -- --allow-network-audit
```

### Manual and packaged

- README and screenshots render correctly on GitHub at desktop and narrow widths.
- CI passes in a fresh GitHub-hosted checkout.
- The packaged app displays the intended name, bundle identifier, version, and
  custom icon.
- Folder selection, metadata, natural ordering, caption/time overlay, zoom/pan,
  map/no-GPS state, fullscreen, error isolation, quit, and relaunch pass in the
  installed app.
- Offline map behavior matches documented limitations.
- Source JPEG checksums remain unchanged.
- Signature, notarization, stapling, architecture, ASAR contents, DMG integrity,
  and public-download checksum match the selected gate.

## Documentation updates required by implementation

Update only documents affected by the chosen gate:

- `README.md` — status, screenshots, license, release availability, installation,
  privacy wording, and public links;
- `RELEASE_NOTES.md` — next version, immutable 0.2.0 status, checksum, signing,
  notarization, and known limitations;
- `docs/README.md` — links to this plan and new verification evidence;
- `docs/product/context.md` — durable Node/Electron, application identity,
  distribution, or publication decisions;
- architecture decisions — only for lasting toolchain, identity, signing, or
  distribution changes;
- `docs/operations/dependency-security.md` and `scripts/release-policy.json` —
  exact current audit and accepted residual risk;
- `docs/operations/macos-packaging.md` — icon, signing, notarization, and revised
  release steps;
- `docs/planning/known-issues.md` — evidence-backed `MA-BUG-002` status;
- a new dated verification record for the exact public artifact; and
- `.github/RELEASE_NOTES_TEMPLATE.md` — align with the chosen public release
  gate.

Historical verification records must retain their historical facts. Add a newer
record or an explicit superseding note rather than rewriting an old artifact's
identity or result.

## Non-goals

- Implementing new photo-viewing, thumbnail, multi-photo map, GPX, video,
  database, account, sync, or update features.
- Publishing Windows, Linux, Intel, or universal builds without a separately
  accepted and verified platform slice.
- Adding automatic updates, a hosted web application, app-store distribution,
  analytics, telemetry, crash upload, or a general native filesystem bridge.
- Fixing the MapLibre chunk warning without measured evidence that it harms the
  first-use or map-opening experience.
- Renaming, editing, copying, uploading, or tracking the ignored
  Schlossherrenrunde photos; D3 keeps them private and `MA-FEAT-019` will supply
  a separate public corpus.
- Treating a public source repository as proof that a DMG is secure,
  transferable, signed, or notarized.

## Stop conditions

Stop and return to the owner when:

- a secret, signing credential, private photo, or unexpected personal identifier
  appears in reachable history;
- the requested license, email rewrite, repository visibility, bundle identifier,
  vulnerability-reporting route, or publication gate is unresolved;
- a network audit reports a new advisory outside the accepted policy;
- an upgrade requires an unsupported override, forced remediation, or
  pre-release toolchain;
- history rewrite verification cannot prove content equivalence;
- the release gate or installed-app checklist fails;
- signing/notarization requires credentials or agreements not already available;
  or
- the artifact to upload does not match the recorded checksum exactly.

## Definition of done

Gate A is done when the source repository is intentionally licensed, rights- and
privacy-reviewed, professionally presented, pushed with only intended history,
and green in GitHub CI.

Gate B is done when an explicitly labelled tester prerelease additionally has a
current accepted security review, stable application identity, custom icon,
resolved fullscreen evidence, clean release-gate report, installed-app evidence,
and verified public-download checksum.

Gate C is done when the same artifact is also Developer ID signed, Hardened
Runtime compatible, notarized, stapled, Gatekeeper-verified, and tested on every
advertised architecture without asking ordinary users to bypass macOS security.
