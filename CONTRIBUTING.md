# Contributing to Strata React Charts

This guide is for repository development and release maintenance. The main
[README.md](README.md) documents installation and usage for package consumers.

## Development

Use Node 18+ and npm. React and React DOM are development dependencies; the
published library has no runtime dependencies and declares React as a peer.

```sh
npm ci
npm test
npm run benchmark
npm run demo
```

On Windows with a restricted PowerShell policy, use `npm.cmd` instead of `npm`.
The demo starts at http://127.0.0.1:5173 and selects the next free port if needed.
It uses locally installed React without a CDN.

Set `POINTS` to change benchmark size. On PowerShell:

```powershell
$env:POINTS = 5000000
npm.cmd run benchmark
```

Tests use Node's built-in test runner. Renderer geometry tests use a canvas
context double; browser interaction and visual checks are also necessary before
releasing UI changes. Benchmarks measure indexing/sampling, not browser FPS.

## Project Structure

| Location | Responsibility |
| --- | --- |
| [src/data.js](src/data.js) | Data access, cached indexes, viewport search, sampling |
| [src/renderer.js](src/renderer.js) | Canvas layouts, drawing, scales, hit testing |
| [src/core.js](src/core.js) | React-free entry point |
| [src/Chart.js](src/Chart.js) | React lifecycle, resizing, interaction, accessibility |
| [src/index.js](src/index.js) | Public React entry point |
| [src/core.d.ts](src/core.d.ts) | Core and options declarations |
| [src/index.d.ts](src/index.d.ts) | React declarations |
| [examples/catalog.js](examples/catalog.js) | Chart guides and shared preview/snippet configuration |
| [examples/reference.js](examples/reference.js) | Complete public option reference |
| [examples/docs.js](examples/docs.js) | Documentation and option-editor panels |

For new chart families, add the type, geometry, hit behavior, declarations, tests,
and a documented input contract. Keep option metadata consistent with public
declarations. Avoid third-party runtime dependencies and unqualified performance
claims. Data buffers are immutable by identity unless explicitly invalidated.

## GitHub Pages

```sh
npm run build:site
npm run preview:site
```

The generated, Git-ignored `site/` directory contains the static explorer,
production React/React DOM assets and their licenses, library modules, and README.
The root redirects to `examples/`. All asset URLs are relative.

To test a repository subpath:

```sh
node examples/server.js --site --base=/chart-library
```

Each of the 28 demos has a live preview, chart guide, synchronized JSX snippet,
all-options editor, and searchable API reference. Share a demo using a fragment
such as `examples/#chart=candlestick&tab=code`. Supported tabs are `guide`, `code`,
`playground`, and `reference`. Reload the browser after rebuilding the static
site; fragment-only navigation retains already-loaded JavaScript modules.

To deploy, select **Settings > Pages > GitHub Actions** in the GitHub repository,
then push to `main` or `master` or manually run the
[Pages workflow](.github/workflows/pages.yml). Adjust its branch filter when
necessary. The deployment environment exposes the live site URL. This workflow
uses GitHub's built-in token; no npm token is required.

## Chart Configuration READMEs

Every chart has a separate README under [docs/charts](docs/charts/README.md).
The [shared configuration reference](docs/configuration/README.md) documents
common options, point fields, callbacks, and ref methods.

Regenerate these files after changing chart APIs or demo metadata:

```sh
npm run docs:charts
npm run check:docs
```

The generator reuses the demo catalog and option reference, with chart-specific
applicability/defaults in
[scripts/build-chart-docs.js](scripts/build-chart-docs.js). Tests check README
freshness, examples, defaults, and local links. The guides are included in both
the npm package and the generated GitHub Pages site.

## Release Checklist

1. Review the consumer README, supported APIs, license, author, and funding URL.
2. Verify scope access and that the intended npm version has not been published.
   Published versions cannot be overwritten.
3. Run `npm test`, `npm run benchmark`, and `npm pack --dry-run`.
4. Run `npm pack` and install the resulting tarball into a separate React app.
   Check both the React and core package entry points.
5. Authenticate through `npm login` when needed. Enter passwords, tokens, and
   one-time codes directly in the terminal, never in source files or chat.
6. Publish using `npm publish --access public --registry=https://registry.npmjs.org/`.
   The package's `prepublishOnly` hook runs the tests.
7. Verify the published version and npm funding metadata after publication.

Only `src`, `docs`, README, LICENSE, and npm metadata are included in the package.
Development files, the contributor guide, generated site, and tests are excluded.
No compilation or minification is required. Use `--provenance` only in a supported
trusted CI environment; the Pages workflow does not publish the npm package.