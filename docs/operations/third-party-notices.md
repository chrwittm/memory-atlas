# Packaged third-party notices

The desktop package includes JavaScript dependencies compiled into Vite assets.
Their license obligations survive compilation: the short MapLibre comment in a
bundle is not a substitute for its complete redistribution notices. Electron's
own `LICENSE` and `LICENSES.chromium.html` are retained separately.

Run after `npm ci` and before packaging:

```sh
node scripts/generate-third-party-notices.mjs
npm test -- scripts/generate-third-party-notices.test.mjs
```

The generator writes ignored `out/legal/third-party/` containing:

- `THIRD_PARTY_NOTICES.txt`: verbatim license/notice files from exact installed
  production-lockfile packages, including MapLibre's combined Mapbox, glfx.js,
  and d3-color notices, and MurmurHash's license from its README.
- `SOURCE_AVAILABILITY.txt`: instructions for obtaining the bundled ExifReader
  source under MPL-2.0, separate from the project's Apache-2.0 license.
- `source/exifreader-<version>/`: unmodified installed `src/`, `bin/` build scripts, license, README,
  package metadata, and Babel/Webpack configuration. This supplies the preferred
  source form of the MPL component alongside the executable distribution.
- `inventory.json`: exact versions, repository-relative package locations,
  hashes of notice contents, and explicit non-runtime exclusions.

The production dependency closure is included conservatively, so notices can
also cover compiler/type packages whose code is not distributed. Three
exact-version compiler/validation utilities absent from the distributed runtime
are excluded: `is-reference@3.0.3`, `locate-character@3.0.0`, and
`@mapbox/jsonlint-lines-primitives@2.0.2`. They have no complete installed license
files; a future version is not automatically excluded. If the application starts
bundling any of these utilities, obtain and preserve its complete upstream
notice before distribution. Missing notices and installed/locked version
mismatches fail generation rather than silently dropping a component.

MapLibre 6.4.1's ESM source maps contain no embedded tslib; the generator
checks this assumption and fails if tslib reappears. Its other embedded package
sources are covered by the production closure notices. Review these maps when
MapLibre changes, including dependencies outside that closure. Historical
0.2.1 materials retained the tslib notice required by MapLibre 5.

## Forge integration

Call the generator in Forge's `generateAssets` hook before packaging, then add
`out/legal/third-party` to `packagerConfig.extraResource`. Electron Packager copies
the directory to `Memory Atlas.app/Contents/Resources/third-party`, outside ASAR,
where recipients can open the text files and source with ordinary tools.

The module also exports `generate(projectRoot, outputDir)`; `outputDir` defaults
to `out/legal/third-party` and can be an absolute destination for isolated tests.
The command-line form uses the repository root derived from the script location.

Release verification must assert the notices, source-availability text, source
license, and source files exist in the finished application's Resources directory.
Compare packaged notice/source hashes with generated inputs, retain Electron's
separate notices, and rebuild/sign the complete artifact after changing any legal
resource. Add a release-note pointer to the bundled `third-party` directory so
recipients can find the ExifReader source availability instructions.

The focused test verifies repeatable output, complete primary notices,
MurmurHash notices, absence of host paths, and byte-identical ExifReader
source files. The generator adds no runtime dependencies or network requests.
