# Memory Atlas Technical Readiness Review

**Review date:** 2026-07-25  
**Implementation guidance updated:** 2026-07-26  
**Scope:** Implemented browser MVP, macOS Electron shell, automated tests,
packaging configuration, dependencies, and public engineering documentation  
**Purpose:** Establish a safe, maintainable baseline before implementing
post-MVP features

## Executive assessment

Memory Atlas has a strong MVP implementation. Its foundations match the
accepted product and technology decisions: the application is small,
browser-native, local-first, read-only toward source photos, worker-based for
metadata ingestion, conservative with object URLs, lazy about loading MapLibre,
and appropriately isolated from Electron privileges.

This review does **not** recommend a rewrite, a framework change, a backend, a
database, or a general-purpose architecture layer. The present design is
proportionate to the product.

There are no P0 findings. Before beginning the thumbnail, multi-photo map, or
other state-sharing features, the project should complete one short hardening
slice. The most important work is:

1. remove a fragile metadata-error classification that can hide an otherwise
   displayable photo;
2. promote collection selection and display-resource lifecycle out of the
   monolithic viewer before several views need to share them;
3. make the worker scan protocol cancellable and terminal on every failure;
4. triage the current build-tool dependency advisories;
5. establish automated integration and packaged-application release gates.

After those items, the implementation is in a good position to grow through
small vertical slices.

## Review basis

The review used the accepted MVP description and technology stack as the
authority. Deferred backlog items were not treated as missing MVP behavior.
Private photo fixtures were not opened, served, uploaded, or modified.

Reviewed areas:

- `src/lib/photos/`: filtering, sorting, metadata normalization, worker pool,
  outcome handling, scanner protocol, and object-URL lifecycle;
- `src/components/`: entry, loading/error states, viewer controls, split view,
  lazy map integration, and map failure handling;
- `electron/main.cjs`, `forge.config.cjs`, Vite configuration, CSP, and the
  deployment runbook;
- component and module tests;
- dependency and repository/release hygiene;
- the product backlog, specifically the likely interaction between the current
  viewer and MA-006 through MA-008.

## Verification snapshot

| Check | Result |
| --- | --- |
| `npm run check` | Pass: 0 errors and 0 warnings |
| `npm test` | Pass: 7 files, 15 tests |
| `npm run build` | Pass |
| Production dependency audit | 0 vulnerabilities |
| Complete dependency audit | 25 advisories: 3 low, 21 high, 1 critical |
| Main renderer bundle | 60.12 kB minified, 22.61 kB gzip |
| Lazy map bundle | 1,057.27 kB minified, 286.12 kB gzip |
| Existing unpacked app under `out/` | Strict signature verification failed due to Finder metadata/xattrs |
| Source-photo mutation check | Not repeated; private fixtures were intentionally left untouched |
| Installed DMG end-to-end check | Not repeated in this code-focused review |

The large map chunk is dynamically loaded and therefore does not inflate normal
viewer startup. It is an observation and a measurement baseline, not by itself
a defect.

The full dependency audit findings are currently in development and packaging
transitives, including Electron Forge's `tar` path. The production dependency
tree is clean. This substantially limits runtime exposure, but it does not make
the build-chain findings ignorable.

The unpacked application found under `out/` is a legacy/intermediate artifact in
a OneDrive-managed location. The current Forge configuration intentionally
builds the application under `/private/tmp` and copies only the sealed DMG back
to `out/make`; that is the correct direction. The failed legacy artifact must
not be confused with a verified release.

## What is already strong

### Product and implementation alignment

- File-name order, top-level JPEG filtering, information visibility, map
  persistence, fullscreen, and read-only handling match the accepted MVP.
- Deferred concepts such as persistence, thumbnails, and all-photo maps have
  not leaked into the MVP as speculative infrastructure.
- Provider configuration and normalized metadata have clear module boundaries.

### Resource and performance discipline

- Metadata work runs outside the UI thread with bounded concurrency.
- One file's metadata failure becomes a per-photo outcome.
- Full-resolution display URLs are limited to the current photo and immediate
  neighbors and are revoked on navigation and viewer teardown.
- MapLibre and its CSS are split into a lazy-loaded chunk.

### Desktop security baseline

- Renderer Node integration is disabled.
- Context isolation, renderer sandboxing, and web security are enabled.
- There is no preload bridge.
- New windows are denied and navigation is constrained.
- A restrictive CSP limits scripts, workers, images, connections, and map
  resources.

### Code quality

- The TypeScript configuration is strict.
- Domain helpers are compact and testable.
- Existing tests cover the central ordering, filtering, metadata fallback, GPS
  validation, error isolation, object-URL cleanup, map construction, split
  resizing, map persistence, fullscreen, information visibility, and idle
  controls.
- The implementation remains understandable without a state library or
  framework-specific service architecture.

## Prioritized findings

Priority meanings:

- **P0:** blocks all further work or risks source data;
- **P1:** complete in the pre-feature hardening slice;
- **P2:** complete soon, normally before public distribution or before the
  affected feature;
- **P3:** conditional improvement; implement only when its trigger occurs.

### MA-TR-001 — Metadata error classification can suppress valid photos

**Priority:** P1  
**Area:** Reliability and error isolation  
**Evidence:** `src/lib/photos/outcome.ts` classifies any exception whose message
contains `read`, `load`, `access`, or `not found` as `read-error`.
`src/components/Viewer.svelte` refuses to create an image element for a
`read-error`.

**Risk:** Parser failures commonly use wording such as “failed to load
metadata.” A readable JPEG with bad metadata can therefore be hidden even
though browser image decoding would succeed. This weakens the important rule
that malformed metadata must not prevent the photo from opening.

**Recommendation:**

- Do not infer a display/read failure from exception text.
- Treat metadata-reader exceptions as `metadata-error` and still attempt normal
  image display.
- Let the image load/decode path establish `decode-error`.
- If a distinct `read-error` is still useful, create it only from a typed,
  explicit file-read probe or another reliable error source.

**Acceptance checks:**

- A loader exception with “read” or “load” in its message still produces
  `metadata-error`.
- The viewer attempts to display a `metadata-error` photo.
- A genuinely undecodable JPEG produces the intentional photo-error state.
- Neighboring photos remain navigable.

### MA-TR-002 — Shared collection selection needs a small explicit owner

**Priority:** P1 before MA-006, MA-007, or MA-008  
**Area:** Changeability  
**Evidence:** The selected index, navigation, panel state, decode-status
mutation, and object-URL synchronization all live inside `Viewer.svelte`.
`App.svelte` owns the collection but not its selection. The upcoming gallery
and all-photo map both need two-way access to the same selected photo.

**Risk:** Adding overview views directly to `Viewer.svelte` will create
cross-component callbacks and duplicated selection logic. It will also make URL
retention, decode errors, focus, and keyboard ownership harder to reason about.

**Recommendation:**

- Introduce a small collection-session/controller boundary using ordinary
  Svelte state; do not add a global state library.
- Give one owner responsibility for the collection, current index/current
  photo, bounded navigation, and per-session view preferences.
- Keep transient rendering concerns local where possible, but make display
  status changes explicit rather than mutating a parent-owned `Photo` from the
  image error handler.
- Move object-URL synchronization out of an impure `$derived(...)` expression
  into an explicit resource lifecycle whose cleanup can be tested.
- Preserve a single selected-photo identity across viewer, gallery, and map
  modes.

**Acceptance checks:**

- Viewer behavior and current tests remain unchanged.
- A test can change selection from a second view/controller and observe the
  same current photo in the viewer.
- Selecting another folder disposes every object URL and resets session-only
  state.
- No state library or generalized repository abstraction is introduced.

### MA-TR-003 — The scan lifecycle has no cancellation or guaranteed fatal result

**Priority:** P1  
**Area:** Worker robustness  
**Evidence:** `scanFolder` resolves only after a `complete` message or rejects
on a worker `error`. The async worker message handler has no outer
`try`/`catch`, fatal protocol message, abort path, or request identity.

**Risk:** A future unexpected exception outside `createScanOutcome`, a malformed
message, or a scan superseded by another folder can leave the loading UI waiting
indefinitely or allow stale results to win. This becomes more likely as
ingestion expands to thumbnails, more formats, sidecars, or persistent indexes.

**Recommendation:**

- Add an explicit terminal `failed` worker response with a user-safe message.
- Wrap the worker's complete scan handler so every execution sends either
  `complete` or `failed`.
- Add cancellation using `AbortSignal` or a returned scan handle; termination
  must reject or settle the pending promise predictably.
- Add a request ID only when concurrent/superseding scans become possible; do
  not add it speculatively if cancellation makes that impossible.
- Ensure progress callbacks cannot strand the worker if UI code throws.

**Acceptance checks:**

- Empty, successful, cancelled, worker-crash, and unexpected-task-failure scans
  all settle exactly once.
- The worker is terminated on every terminal path.
- Starting or returning from a scan cannot later replace the current
  collection with stale results.

### MA-TR-004 — The dependency build chain needs explicit remediation and policy

**Priority:** P1 for triage; P2 for ongoing automation  
**Area:** Supply-chain and release engineering  
**Evidence:** On 2026-07-25, `npm audit --omit=dev` reported zero
vulnerabilities, while the complete `npm audit` reported 25 advisories,
including a critical `tar` advisory through Electron Forge/rebuild tooling.
Several findings had automatic fixes; the reported `tar` and `tmp` paths did
not.

**Risk:** These packages are not part of the renderer's production dependency
set, so this is not evidence that viewing a photo is currently exploitable.
They do participate in dependency installation and artifact construction,
however, and therefore matter to release integrity.

**Recommendation:**

- Apply available non-breaking audit fixes in a dedicated change and rerun all
  checks and packaging.
- Investigate current Electron Forge/rebuild releases or upstream tracking for
  the no-fix transitive paths.
- Record temporary risk acceptance when an upstream-only build-time advisory
  remains, including why project inputs are trusted and which version removes
  it later.
- Add complete-tree audit review to dependency-update work. Avoid making raw
  advisory count alone an automatic release blocker; gate on reachability,
  severity, fix availability, and build context.
- Keep Electron itself on a deliberate, frequent security-update cadence.

**Acceptance checks:**

- Available fixes are applied or explicitly rejected with a reason.
- Remaining advisories have ownership, exposure analysis, and an upstream
  tracking/update trigger.
- A clean install, tests, build, packaging, and packaged smoke test pass after
  dependency changes.

### MA-TR-005 — Add integration gates around the highest-risk boundaries

**Priority:** P1  
**Area:** Test strategy  
**Evidence:** The 15 existing tests are useful but mostly module/component
tests. There is no scanner/worker integration test, `App.svelte` journey test,
automated real-browser test, or packaged Electron smoke test.

**Risk:** The failures most likely to escape unit tests are worker bundling and
messaging, real object URL/image events, folder-input behavior, focus/keyboard
interactions, CSP/map requests, and `file://` packaged asset loading.

**Recommendation:**

- Add a scanner contract test using a controllable Worker test double.
- Add an application journey test covering entry → loading → viewer/empty/error
  → choose another folder.
- Add focused tests for worker terminal paths, pool behavior, decode failure,
  object-URL cleanup after folder replacement, and Escape priority.
- Add a small Playwright/Electron packaged smoke test only after identifying a
  reliable way to supply a fixture folder. Keep private fixtures out of CI.
- Use generated, non-personal JPEG fixtures for automation; continue using real
  private folders only for manual compatibility validation.

**Acceptance checks:**

- The complete in-process user journey is covered without parsing metadata in a
  UI component.
- At least one built application test proves that relative assets and the
  metadata worker load outside the Vite development server.
- Tests do not commit or expose private photos.

### MA-TR-006 — Establish a reproducible known-good baseline

**Priority:** P1 before broad feature work  
**Area:** Repository and release hygiene  
**Evidence:** The repository has one initial commit and a large working-tree
delta containing the implemented packaging and recent product work. There is no
CI workflow. Node 20+ is documented, but `package.json` declares neither
`engines` nor a package-manager version.

**Risk:** Feature work begun before capturing the working MVP makes regressions
harder to isolate, review, bisect, and compare with the app the user values.

**Recommendation:**

- After reviewing the existing unrelated working-tree changes, capture the
  accepted MVP in a clean commit and preferably a baseline tag.
- Add CI for clean install, check, test, and build on the supported Node line.
- Declare the supported Node engine and package-manager expectation.
- Add a lightweight formatting/linting decision only for rules that TypeScript
  and `svelte-check` do not cover; avoid a large style-tool migration.
- Keep generated `dist/`, `out/`, private notes, fixtures, and Finder metadata
  ignored.

**Acceptance checks:**

- A fresh clone can run the documented checks from the lockfile.
- The known-good MVP is identifiable by commit/tag and artifact checksum.
- Pull requests cannot merge with failing checks once collaborative development
  begins.

### MA-TR-007 — Escape handling does not preserve fullscreen priority

**Priority:** P2  
**Area:** Keyboard behavior  
**Evidence:** The viewer closes the map on every `Escape` when map mode is open,
without checking `document.fullscreenElement`.

**Risk:** Pressing Escape while both fullscreen and map mode are active can
close the map as the browser exits fullscreen. The accepted behavior says
Escape exits fullscreen and otherwise closes the map.

**Recommendation:** Ignore Escape-based map closure while the viewer is in
fullscreen and let the browser perform its standard fullscreen exit. Add a
regression test for fullscreen plus map mode.

**Acceptance checks:**

- Escape in fullscreen exits fullscreen and leaves map mode unchanged.
- A subsequent Escape outside fullscreen closes the map.

### MA-TR-008 — Add Electron defense-in-depth before native capabilities

**Priority:** P2; required before MA-004 or any preload bridge  
**Area:** Desktop security  
**Evidence:** The shell has a strong baseline but does not explicitly deny
permission requests/checks, accepts external `http://` URLs as well as HTTPS,
and does not surface `loadFile` failure.

**Risk:** These are limited risks in the current no-link/no-bridge renderer, but
the defaults become more consequential when new web content or a native file
action is introduced.

**Recommendation:**

- Install explicit session permission request/check handlers that deny all
  permissions not intentionally required.
- Prefer external HTTPS only unless a concrete HTTP use case is accepted.
- Handle and log packaged renderer load failure and show a controlled failure
  window/message rather than remaining hidden or blank.
- Before any native bridge, write a narrow IPC threat model and expose only
  capability-specific methods with validated arguments.
- Preserve sandboxing, context isolation, no Node integration, CSP, and external
  navigation denial as release invariants.

**Acceptance checks:**

- Unexpected camera, microphone, geolocation, notification, and filesystem
  permission requests are denied.
- Navigation cannot turn the Memory Atlas window into remote content.
- A missing/corrupt renderer build fails visibly and diagnostically.

### MA-TR-009 — Metadata correctness needs a broader compatibility matrix

**Priority:** P2 before tags/people; ongoing for new source types  
**Area:** Data quality  
**Evidence:** Current tests cover one XMP title fallback, basic GPS ranges, and
one EXIF timestamp. The primary real corpus lacks GPS, keyword, people-region,
malformed JPEG, and broad orientation examples. EXIF date construction also
lets JavaScript normalize impossible calendar dates rather than rejecting them.

**Risk:** Metadata looks simple after normalization but varies substantially by
exporter. New context features can silently institutionalize assumptions based
on one corpus.

**Recommendation:**

- Maintain a small, generated/non-personal metadata fixture matrix for CI.
- Manually validate representative exports from each real source application.
- Add cases for description precedence, structured/multilingual XMP, offsets,
  invalid calendar dates, GPS hemispheres/bounds, orientation, keywords, people,
  malformed metadata, and undecodable JPEG data.
- Decide explicitly whether timezone-less EXIF capture times remain “floating
  local time” or are converted to instants before introducing timeline logic.
- Keep raw source-specific parsing behind `normalizeMetadata`.

**Acceptance checks:**

- Invalid dates are rejected instead of silently rolled into another date.
- Timeline-relevant timezone semantics are documented before timeline sorting.
- Tags/people work is not marked ready until representative metadata exists.

### MA-TR-010 — Measure scale before adding persistence or thumbnail machinery

**Priority:** P2 before MA-007; otherwise ongoing  
**Area:** Performance  
**Evidence:** The current four-task scan, all-metadata-before-viewer flow, and
three-photo URL window are sensible but have not been recorded against defined
folder sizes or memory budgets.

**Risk:** Premature caching would complicate the local-first model, while
unmeasured scaling can make gallery work accidentally decode too many originals.

**Recommendation:**

- Add a reproducible benchmark harness or manual protocol for 100, 1,000, and a
  representative upper-bound photo count.
- Record scan time, time to first view, peak renderer memory, worker memory,
  rapid-navigation behavior, and cleanup after folder replacement.
- Define a thumbnail URL/cache budget before MA-007.
- Introduce a disposable index only when measured startup cost crosses an
  accepted threshold.

**Acceptance checks:**

- A performance baseline is recorded with hardware and fixture characteristics.
- Gallery acceptance criteria include bounded decoding and cleanup.
- Persistence remains deferred unless measurements justify it.

### MA-TR-011 — Separate file-backed media only when the roadmap requires it

**Priority:** P3, conditional  
**Trigger:** First non-`File` source, persistent index, video type, hosted
collection, or iOS source abstraction  
**Area:** Domain model

**Evidence:** `Photo` currently contains a browser `File`, which is ideal for
the MVP but means the normalized data shape is not actually source-independent.

**Recommendation:** When the trigger occurs, separate stable media metadata and
identity from the source/display handle. Do not perform this refactor solely for
the thumbnail or all-photo map features; those still use the same selected
folder and can remain file-backed.

**Acceptance checks:**

- Existing folder-backed photos remain the simplest adapter.
- No persistence layer stores a live `File` as if it were durable.
- The UI consumes media capabilities/data rather than source-specific paths.

### MA-TR-012 — Treat map loading and bundle size as monitored constraints

**Priority:** P3  
**Trigger:** Map startup becomes perceptibly slow, offline behavior is confusing,
or additional map modes multiply map instances  
**Area:** Map performance and resilience

**Evidence:** MapLibre is correctly lazy-loaded, but the resulting map chunk is
about 1.06 MB minified. Initial map errors are surfaced; later tile failures are
mostly left to MapLibre.

**Recommendation:** Keep the current design until measurement shows a problem.
For multi-photo maps, reuse one map instance per active view, record map-open
latency, and provide a stable offline/provider-failure state without hiding
attribution or the network boundary. Do not replace MapLibre merely to remove
the build warning.

## Recommended implementation strategy

Slices A and B form the recommended **pre-feature hardening milestone**. Complete
and verify both before beginning a substantial post-MVP feature.

Slice C has a different role. It is not a prerequisite for every possible
feature. Complete it immediately before, or as the enabling part of, the first
feature that needs shared collection and selected-photo state—especially
MA-006, MA-007, or MA-008. A narrow viewer feature that does not need this
shared state can proceed after Slices A and B without waiting for Slice C.

The recommended overall sequence is:

```text
capture current MVP baseline
    -> Slice A
    -> verify and commit
    -> Slice B
    -> verify, package, and commit
    -> select and specify one next feature
    -> Slice C, if that feature requires shared selection
    -> verify and commit
    -> implement the selected feature
```

Use separate, sequential Codex tasks for these stages. Each task should start
from the verified result of the previous task. This gives every task a narrow
objective, keeps its reasoning context focused, and creates useful Git
checkpoints for reviewing or bisecting regressions.

### Model-selection policy

The model does not replace task boundaries, acceptance checks, or manual
packaged-app verification. A well-scoped Terra task is preferable to asking Sol
to implement several slices at once.

Use this default policy for GPT-5.6 Codex tasks:

| Work type | Recommended setting |
| --- | --- |
| Normal implementation and review | `gpt-5.6-terra`, high reasoning |
| Cross-layer architecture, security, concurrency, or packaging | `gpt-5.6-sol`, high reasoning |
| Mechanical, tightly specified follow-up | `gpt-5.6-luna`, high reasoning, or Terra with medium reasoning |

Sol is the flagship-capability model, Terra is the balanced default, and Luna
is suited to efficient high-volume work. See the current
[OpenAI GPT-5.6 model guidance](https://developers.openai.com/api/docs/guides/latest-model).
These recommendations are operational defaults, not permanent architecture
decisions; revisit them if the available model family or observed task
performance changes.

`high` reasoning is sufficient for the planned implementation tasks. Use
`xhigh` only when a task uncovers a genuinely difficult architecture,
dependency, or packaging problem. `max` or `ultra` is not expected to be
necessary for this plan.

### Task 0 — Capture the current MVP baseline

**Recommended Codex setting:** `gpt-5.6-terra`, medium reasoning  

Do this before changing application behavior:

1. Review and reconcile the existing working-tree changes.
2. Run `npm run check`, `npm test`, and `npm run build`.
3. Complete the current documented packaged-MVP verification if it has not
   already been recorded for the exact artifact.
4. Commit the accepted MVP state.
5. Preferably add a clearly named baseline tag, such as `v0.1.0-mvp`, once the
   commit and artifact are accepted.

This step is especially important because the reviewed repository has one
initial commit and a large working-tree delta containing the implemented MVP
packaging and recent product documentation.

**Suggested Codex task:**

> Establish the current Memory Atlas MVP as a known-good baseline. Review the
> existing working-tree changes without discarding unrelated user work, run the
> documented source checks, identify anything that prevents a clean baseline,
> and prepare the accepted MVP for a coherent commit and optional baseline tag.
> Do not implement technical-readiness findings or post-MVP features in this
> task. Do not commit or tag until explicitly requested.

**Exit criterion:** The exact MVP source state and, where applicable, packaged
artifact are identifiable and reproducible from a clean commit.

### Task 1 — Slice A: correctness and reproducibility

**Recommended Codex setting:** `gpt-5.6-terra`, high reasoning  

Implement:

1. MA-TR-001 metadata/display error separation.
2. MA-TR-007 Escape priority.
3. Focused regression tests for both behaviors.
4. The remaining source-level reproducibility items from MA-TR-006, including
   the supported Node declaration and CI checks where appropriate.

**Suggested Codex task:**

> Implement Slice A from
> `docs/technical-readiness-review-2026-07-25.md`. Address MA-TR-001 and
> MA-TR-007, add the specified regression tests, and complete the source-level
> reproducibility items from MA-TR-006 that belong in this slice. Preserve the
> accepted MVP behavior and architecture. Do not begin Slice B, Slice C, or
> post-MVP feature work. Run the complete documented checks and report any
> remaining manual verification.

**Verification checkpoint:**

- review the diff against MA-TR-001 and MA-TR-007;
- run `npm run check`, `npm test`, and `npm run build`;
- manually confirm that a metadata failure does not hide a displayable image;
- manually confirm Escape behavior with map mode inside and outside fullscreen;
- commit Slice A as one coherent checkpoint.

**Exit criterion:** The MVP has a reproducible, regression-protected baseline
with no known behavior conflict in these two correctness paths.

### Task 2 — Slice B: scan and release hardening

**Recommended Codex setting:** `gpt-5.6-sol`, high reasoning  

Implement:

1. MA-TR-003 terminal and cancellable scan lifecycle.
2. Scanner and application integration tests from MA-TR-005.
3. MA-TR-004 dependency remediation and recorded residual-risk review.
4. MA-TR-008 Electron permission and renderer-load-failure hardening.
5. A fresh package, strict signature verification in the temporary build
   location, DMG installation, independent launch, and checksum recording.

**Suggested Codex task:**

> Implement Slice B from
> `docs/technical-readiness-review-2026-07-25.md`. Make the metadata scan
> lifecycle terminal and cancellable, add the scanner and App integration
> coverage, remediate and document the dependency advisories, harden Electron
> permission and renderer-load-failure behavior, and produce and verify a fresh
> packaged build according to `docs/deployment.md`. Preserve the accepted MVP
> and do not implement Slice C or post-MVP features. Run all automated checks
> and clearly separate completed automated verification from manual checks that
> still require the user.

**Verification checkpoint:**

- run all source checks and focused scan/integration tests;
- rerun production and complete-tree dependency audits;
- verify that every scan path settles exactly once and terminates its worker;
- build in the configured non-OneDrive temporary location;
- verify the exact packaged `.app` signature;
- install and launch the exact DMG without Vite or Node running;
- manually exercise representative folders, fullscreen, map/no-network
  behavior, quit/relaunch, and unchanged source-photo checksums;
- record the version, architecture, SHA-256, signing state, and remaining audit
  risk;
- commit Slice B as one coherent checkpoint and optionally tag the resulting
  hardened baseline.

Automated checks are necessary but not sufficient for this task. The user
should personally perform the final installed-DMG experience check because
visual quality, Finder installation, macOS permissions, real folders, and the
overall feel of the application cannot be established completely by unit tests.

**Exit criterion:** Every scan settles, build-chain risk is understood, and one
specific packaged artifact has passed the deployment runbook.

### Task 3 — Select and specify one next feature

**Recommended Codex setting:** `gpt-5.6-terra`, medium reasoning; use high
reasoning when interaction or platform decisions remain materially ambiguous  

After Slice B, choose one primary user outcome from the backlog. Refine it before
changing architecture. Settle its interaction model, keyboard and pointer
behavior, resource limits, privacy/platform implications, acceptance checks,
and explicit non-goals.

For example, before MA-007, decide whether the first thumbnail overview is a
grid or filmstrip, how it opens and closes, how keyboard focus works, how
unreadable photos appear, and how many thumbnail resources may be retained.

**Suggested Codex task:**

> Refine [backlog ID and feature name] into the next Memory Atlas implementation
> slice. Use the product backlog and accepted project documents. Resolve the
> user outcome, interaction and keyboard/pointer behavior, non-goals,
> dependencies, privacy and platform boundary, performance/resource limits,
> and acceptance checks. Determine explicitly whether MA-TR-002/Slice C is
> required. Update planning documentation only; do not implement the feature.

**Exit criterion:** One feature is ready to build, and the need for Slice C is
an evidence-based decision rather than a general architectural assumption.

### Task 4 — Slice C: shared-view foundation, when required

**Recommended Codex setting:** `gpt-5.6-sol`, high reasoning  

Use this task before features that need several views to share the same
collection and current-photo selection. Implement:

1. MA-TR-002's small collection-session and selection owner.
2. Explicit display-resource and decode-status lifecycle.
3. Tests proving that viewer and a second consumer share one selection.
4. The relevant MA-TR-010 performance baseline and resource budget.

Do not introduce a state-management library or a generalized media repository.
Build only the boundary required by the selected feature.

**Suggested Codex task:**

> Implement Slice C as the minimum collection-session, selected-photo, and
> display-resource foundation required by [selected feature]. Follow MA-TR-002
> and the relevant part of MA-TR-010. Preserve all current Viewer behavior,
> avoid a global state-management library and speculative source abstractions,
> add shared-selection and cleanup tests, and record the performance baseline.
> Do not implement the full feature in this task. Run all documented checks and
> explain how the resulting boundary supports the selected feature.

**Verification checkpoint:**

- all existing viewer behavior and tests remain valid;
- selection changed through a second consumer is reflected by the viewer;
- folder replacement resets session state and releases every object URL;
- rapid navigation and resource-window behavior remain bounded;
- the architecture contains only concepts required by the selected feature;
- commit Slice C independently.

**Exit criterion:** A second view can share selection without duplicating
navigation, decode-status, or resource-lifecycle logic.

### Task 5 — Implement the selected feature

**Recommended Codex setting:** Choose by feature complexity:

| Feature shape | Recommended setting |
| --- | --- |
| Narrow viewer change, such as Home, wording, or filename display | `gpt-5.6-terra`, high reasoning |
| Zoom and pan | `gpt-5.6-terra`, high reasoning; use Sol if the interaction becomes cross-cutting |
| First thumbnail gallery or synchronized multi-photo map | `gpt-5.6-sol`, high reasoning |
| Mechanical follow-up after the feature foundation is proven | `gpt-5.6-luna`, high reasoning, or Terra with medium reasoning |

Implement the refined feature in its own Codex task, starting from the verified
Slice C checkpoint when Slice C was required.

**Suggested Codex task:**

> Implement [backlog ID and feature name] according to its refined
> specification. Build on the verified technical-hardening and shared-session
> foundation. Preserve the accepted local-first, read-only, bounded-resource,
> and Electron-security boundaries. Add the feature's focused automated tests,
> run all documented checks, perform the specified packaged/manual
> verification, and update the authoritative product documents only for
> decisions that have now been accepted.

**Exit criterion:** The feature's acceptance checks pass end to end without
weakening the known-good MVP behavior.

### Rules for every implementation task

Every Codex task should:

- read the authoritative project documents and this review before editing;
- state exactly which readiness IDs or backlog item it is implementing;
- preserve unrelated user changes;
- avoid expanding into the next slice;
- add focused tests alongside behavior changes;
- run the complete documented source checks;
- distinguish automated evidence from manual verification;
- finish with a concise change summary, remaining risks, and recommended
  checkpoint commit;
- use a separate coherent commit once the user has reviewed and accepted the
  result.

If a task uncovers evidence that changes the proposed sequence, update this
review or the backlog before silently broadening the implementation.

## Suggested work-item template

Use this structure when transferring a finding into the backlog or an issue:

```text
ID and title:
Priority:
User/product impact:
Observed evidence:
Chosen change:
Non-goals:
Files/boundaries likely affected:
Automated acceptance checks:
Packaged/manual acceptance checks:
Documentation updates:
Dependencies or blockers:
```

## Release/readiness gates

Before merging a normal feature:

- `npm run check`
- `npm test`
- `npm run build`
- focused tests for the changed behavior
- no new source-photo write path
- no new network endpoint without a privacy/CSP review

Before publishing a macOS artifact:

- clean lockfile install on the supported Node version;
- complete dependency-audit triage;
- all normal feature gates;
- Forge build in the non-OneDrive temporary output location;
- strict code-signature verification of the exact packaged `.app`;
- installation and launch from the exact DMG without Vite/Node running;
- offline photo-viewer and online/no-network map checks;
- representative malformed, undecodable, orientation, caption, time, and GPS
  cases;
- source-photo checksums unchanged;
- artifact architecture, version, SHA-256, signing, and notarization state
  recorded.

## Final recommendation

Proceed with evolution, not reconstruction. Complete Slices A and B as a short
technical hardening milestone, then introduce the shared selection boundary in
Slice C immediately before the first additional exploration view. Reassess the
architecture after one such view is delivered; do not pre-build abstractions for
the rest of the backlog.
