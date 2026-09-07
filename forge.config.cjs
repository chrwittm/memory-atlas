const { execFile } = require('node:child_process')
const fs = require('node:fs/promises')
const path = require('node:path')
const { promisify } = require('node:util')
const packageJson = require('./package.json')
const releasePolicy = require('./scripts/release-policy.json')

const execFileAsync = promisify(execFile)
const forgeOutDir = releasePolicy.forgeOutDir
const releaseDir = path.join(__dirname, 'out', 'make')
let packagedOutputPaths = []

async function stripFinderMetadata(targetPath) {
  await execFileAsync('xattr', ['-dr', 'com.apple.FinderInfo', targetPath])
  await execFileAsync('xattr', ['-dr', 'com.apple.ResourceFork', targetPath])
}

module.exports = {
  // OneDrive can add FinderInfo attributes to .framework directories and
  // invalidate a macOS signature. Build outside the synchronized workspace;
  // postMake copies only the sealed DMG back into the repository.
  outDir: forgeOutDir,
  packagerConfig: {
    name: packageJson.productName,
    executableName: packageJson.productName,
    appBundleId: releasePolicy.application.bundleIdentifier,
    icon: path.join(__dirname, 'assets', 'icon', 'MemoryAtlas.icns'),
    extraResource: [
      path.join(__dirname, 'node_modules', 'electron', 'dist', 'LICENSE'),
      path.join(__dirname, 'node_modules', 'electron', 'dist', 'LICENSES.chromium.html'),
      path.join(__dirname, 'public', 'images', 'README.md'),
    ],
    appCategoryType: 'public.app-category.photography',
    extendInfo: { CFBundleIconFile: releasePolicy.application.iconFile },
    asar: true,
    prune: true,
    // A valid ad-hoc signature is sufficient for this originating-Mac test
    // build. Transferable releases still require Developer ID + notarization.
    osxSign: {
      identity: '-',
      identityValidation: false,
      preAutoEntitlements: false,
      preEmbedProvisioningProfile: false,
      optionsForFile: () => ({
        hardenedRuntime: false,
        timestamp: 'none',
      }),
    },
    ignore: [
      /^\/.git($|\/)/,
      /^\/docs($|\/)/,
      /^\/assets($|\/)/,
      /^\/fixtures($|\/)/,
      /^\/node_modules($|\/)/,
      /^\/public($|\/)/,
      /^\/src($|\/)/,
      /^\/scripts($|\/)/,
      /^\/out($|\/)/,
      /^\/.*\.config\.(js|ts)$/,
      /^\/\.gitignore$/,
      /^\/forge\.config\.cjs$/,
      /^\/index\.html$/,
      /^\/package-lock\.json$/,
      /^\/tsconfig.*\.json$/,
      /^\/AGENTS\.md$/,
      /^\/README\.md$/,
      /^\/dist\/\.DS_Store$/,
      /^\/dist\/images\/README\.md$/,
      /^\/electron\/.*\.test\.ts$/,
    ],
  },
  makers: [
    {
      name: '@electron-forge/maker-dmg',
      config: (arch) => ({
        name: `${packageJson.productName}-${packageJson.version}-${arch}`,
        format: 'UDZO',
        overwrite: true,
        additionalDMGOptions: {
          filesystem: 'APFS',
        },
      }),
    },
  ],
  hooks: {
    generateAssets: async () => {
      // Electron 42 downloads lazily instead of during npm ci. Ensure the
      // exact locked distribution and its license files exist before copying.
      await execFileAsync(process.execPath, [require.resolve('electron/install.js')])
    },
    packageAfterExtract: async (_forgeConfig, buildPath, _electronVersion, platform) => {
      if (platform === 'darwin') {
        // Finder/OneDrive attributes invalidate a macOS bundle signature. Strip
        // them before osx-sign adds the signature attributes that must remain.
        await execFileAsync('xattr', ['-cr', buildPath])
      }
    },
    postPackage: async (_forgeConfig, packageResult) => {
      packagedOutputPaths = packageResult.outputPaths
      await Promise.all(packagedOutputPaths.map(stripFinderMetadata))
    },
    preMake: async () => {
      // OneDrive may restore Finder metadata after the bundle is moved into
      // out/. Remove only the forbidden attributes immediately before DMG copy.
      await Promise.all(packagedOutputPaths.map(stripFinderMetadata))
      // appdmg copies the app with macOS cp -R. Prevent that copy from carrying
      // filesystem metadata into the disk image and invalidating signing.
      process.env.COPYFILE_DISABLE = '1'
    },
    postMake: async (_forgeConfig, makeResults) => {
      await fs.mkdir(releaseDir, { recursive: true })

      const copiedResults = []
      for (const result of makeResults) {
        const artifacts = []
        for (const artifact of result.artifacts) {
          const destination = path.join(releaseDir, path.basename(artifact))
          await fs.copyFile(artifact, destination)
          artifacts.push(destination)
        }
        copiedResults.push({ ...result, artifacts })
      }

      return copiedResults
    },
  },
}
