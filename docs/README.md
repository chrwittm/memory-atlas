# Memory Atlas Documentation

**Status:** Current documentation guide
**Last updated:** 2026-09-07

This directory organizes project documentation by purpose and lifecycle. Start
with the product context and accepted specification, then consult architecture,
planning, operations, or delivery records as the task requires.

## Documentation map

### User documentation

- [`../RELEASE_NOTES.md`](../RELEASE_NOTES.md) — versioned user-facing changes,
  installation notes, checksums, and known limitations for packaged builds.
- [`user-guide.md`](user-guide.md) — current MVP features, controls, keyboard
  shortcuts, map behavior, privacy notes, and recovery guidance.

### Product

- [`product/context.md`](product/context.md) — durable current product
  understanding and implementation handoff.
- [`product/vision.md`](product/vision.md) — long-term vision and naming
  rationale.
- [`product/specifications/mvp.md`](product/specifications/mvp.md) — accepted
  behavior and acceptance criteria for the MVP baseline.
- `product/specifications/features/` — accepted or proposed specifications for
  individual post-MVP features, created when a backlog item is selected.

### Planning

- [`planning/backlog.md`](planning/backlog.md) — product ideas, priorities, and
  refinement states.
- [`planning/known-issues.md`](planning/known-issues.md) — confirmed defects,
  workarounds, and resolution criteria.

### Architecture and operations

- [`architecture/decisions/0001-mvp-technology-stack.md`](architecture/decisions/0001-mvp-technology-stack.md)
  — accepted MVP implementation stack.
- [`architecture/decisions/0002-macos-electron-packaging.md`](architecture/decisions/0002-macos-electron-packaging.md)
  — accepted macOS packaging decision and considered alternatives.
- [`operations/macos-packaging.md`](operations/macos-packaging.md) — executable
  macOS release-gate, manual verification, and publishing runbook.
- [`operations/dependency-security.md`](operations/dependency-security.md) —
  dependency policy, current risk assessment, and release controls.

- [`architecture/decisions/0003-publication-toolchain-and-identity.md`](architecture/decisions/0003-publication-toolchain-and-identity.md)
  — supported publication toolchain, stable identity, and version boundary.

- [`operations/third-party-notices.md`](operations/third-party-notices.md)
  — packaged dependency notices and ExifReader source availability.

### Delivery records and history

- [`delivery/verifications/2026-09-08-public-source.md`](delivery/verifications/2026-09-08-public-source.md)
  — completed source import, GitHub CI, and repository security settings.
- [`delivery/verifications/2026-09-08-v0.2.1-candidate.md`](delivery/verifications/2026-09-08-v0.2.1-candidate.md)
  — exact candidate artifact identity and pending installed interaction evidence.

- [`delivery/verifications/2026-09-07-publication-readiness.md`](delivery/verifications/2026-09-07-publication-readiness.md)
  — publication implementation, privacy rewrite, and remaining release gates.

- [`delivery/reviews/2026-07-25-technical-readiness.md`](delivery/reviews/2026-07-25-technical-readiness.md)
  — dated technical-readiness assessment and implementation guidance.
- [`delivery/verifications/2026-07-31-slice-b-packaged-build.md`](delivery/verifications/2026-07-31-slice-b-packaged-build.md)
  — evidence for the verified Slice B package.
- [`delivery/verifications/2026-09-04-ma-feat-001-image-zoom-and-pan.md`](delivery/verifications/2026-09-04-ma-feat-001-image-zoom-and-pan.md)
  — automated implementation evidence and the remaining packaged interaction
  check for image zoom and pan.
- [`delivery/verifications/2026-09-04-v0.2.0-packaged-build.md`](delivery/verifications/2026-09-04-v0.2.0-packaged-build.md)
  — release-gate, dependency-audit, signature, and checksum evidence for the
  local Apple silicon 0.2.0 DMG.
- [`delivery/verifications/2026-09-04-release-gate-automation.md`](delivery/verifications/2026-09-04-release-gate-automation.md)
  — source, policy, packaging, signature, and DMG evidence for the repeatable
  macOS release automation.
- [`delivery/plans/2026-09-04-publication-readiness.md`](delivery/plans/2026-09-04-publication-readiness.md)
  — implementation-ready public-source and macOS-release gates, owner decisions,
  privacy checks, work packages, and safe sub-agent delegation.
- `delivery/plans/` — dated implementation plans for selected work.
- [`archive/product/intent-v1.md`](archive/product/intent-v1.md) — historical
  initial proposal; not a current implementation authority.

## Authority and lifecycle

When documents disagree:

1. An accepted product or feature specification defines behavior and scope.
2. An accepted architecture decision defines the relevant technical boundary.
3. The living product context summarizes the current overall understanding.
4. Backlog items, known issues, plans, reviews, and verification records inform
   work but do not silently override accepted specifications or decisions.
5. Archived documents provide history only.

The MVP specification remains the baseline record. Post-MVP work should receive
its own feature specification instead of being appended to the MVP document.

## Feature workflow

Use this lightweight path for new product work:

```text
planning/backlog.md
    -> product/specifications/features/<feature-id>-<slug>.md
    -> delivery/plans/<date>-<feature-id>-<slug>.md
    -> implementation and verification
```

Keep the backlog entry concise once a separate specification exists, and link
the two documents. Add an architecture decision only when the work changes a
lasting technical or platform boundary. Keep completed plans and verification
records as dated evidence rather than rewriting them as current product truth.

Known defects stay in `planning/known-issues.md`; they may receive a delivery
plan when the fix needs design or coordination.

## Naming conventions

- Use lowercase kebab-case file names.
- Prefix immutable, time-bound plans, reviews, and verification records with an
  ISO date: `YYYY-MM-DD-topic.md`.
- Number architecture decisions sequentially: `0001-topic.md`.
- Use typed work identifiers:
  - `MA-FEAT-###` for product features;
  - `MA-BUG-###` for confirmed defects; and
  - `MA-TR-###` for technical-readiness findings.
- Give living documents a `Status` and a maintenance date such as `Last updated`
  or `Last reviewed`. Give dated evidence a fixed event date and avoid changing
  its conclusions after the fact; add a newer record instead.

## Templates

- [`templates/feature-specification.md`](templates/feature-specification.md)
- [`templates/implementation-plan.md`](templates/implementation-plan.md)
