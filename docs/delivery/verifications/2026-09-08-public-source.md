# Public source import verification

**Date:** 2026-09-08

**Status:** Gate A source import completed; Gate B tester release pending

The approved public source import replaced only the verified license-only
placeholder `25c3ae3bc03c1cef22023f7007384be1884be694`, using an exact
`--force-with-lease` guard. Only `main` was pushed. Its initial source import
head is `acc9eeeeadda516a05a2146c8a99480b2065879a`; no tags, backup refs,
private photos, or generated artifacts were pushed.

[GitHub source checks](https://github.com/chrwittm/memory-atlas/actions/runs/34144072801)
passed in a fresh Ubuntu checkout with Node 24.20.0. GitHub renders the README,
Apache-2.0 license, security policy, repository description and topics. The
README screenshot loaded at its expected 1280×720 dimensions, and release links
resolve to the repository's Releases listing.

Private vulnerability reporting and dependency alerts are enabled. Secret
scanning and push protection are enabled. The default `main` branch is protected
against deletion and force pushes, with the `Node 24 source checks` status
required and administrative bypass retained for the owner's workflow. The
repository remains public. GitHub's generated social preview remains in use;
a custom social-preview upload and narrow-width visual inspection have not been
verified through an authenticated browser.

Gitleaks 8.30.1 scanned all 14 imported local commits without findings. Targeted
privacy scans and historical asset checks are recorded in the
[implementation evidence](2026-09-07-publication-readiness.md). A durable local
recovery bundle and rewrite maps were retained outside the repository. Existing
historical verification records retain their original artifact facts.

The [0.2.1 candidate](2026-09-08-v0.2.1-candidate.md) passed the automated macOS
release gate and was installed, but installed interaction evidence is still
pending. Gate B must not be represented as complete, and no public binary release
or version tag exists yet. Gate C remains deferred.
