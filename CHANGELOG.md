# Changelog

## 2.0.0 — 2026-09-10

Full modernization of the 2017-era v1 aggregator. Breaking release.

### Breaking

- **Pure ESM.** `require('promise-fun')` no longer works; use `import`. A dual CJS/ESM build is impossible because every dependency is ESM-only. The top level has named exports only (no default export).
- **Node.js >= 22** (`engines` floor, driven by `p-retry@8`).
- **Dropped `p-finally`** (deprecated on npm — use native `Promise.prototype.finally`). The only removed export.
- **Every dependency moved to its current major.** Inherited upstream API breaks include (non-exhaustive — see each package's releases):
  - `p-retry`: `forever` option removed; `AbortError` and `makeRetriable` named exports added.
  - `p-timeout`: signal/`AbortError`-based API.
  - `p-queue`, `p-event`: API evolution across majors.
  - `p-memoize`, `delay`: option changes.
- Top-level keys are otherwise unchanged from v1 (49 kept).

### Added

- 5 packages missing from v1: `yoctodelay`, `p-mutex`, `p-progress` (it was listed in the v1 readme but never wired up), `p-state`, `make-synchronous`. Total: 53 packages.
- Subpath exports for every package (`promise-fun/p-limit`, …) mirroring the exact upstream API.
- Upstream named exports forwarded at the top level under `<camel><Name>` (`pRetryAbortError`, `pMapSkip`, `PProgress`, …), plus `pState` as a namespace object (`p-state` has no default export).
- TypeScript types re-exported from upstream for all 53 packages (`pMapOptions`, …). `p-break@2` ships no types, so its small surface is declared in this package instead.
- Test suite (import smoke + upstream-parity + static type tests), ESLint/Prettier, GitHub Actions CI (Node 22 + 24), `publint` + `attw` gates.

### Notes

- `hard-rejection`, `loud-rejection`, `p-every`, `p-one` are no longer listed upstream but still ship here for back-compat, marked legacy in the readme.
- `p-break`, `p-catch-if`, `p-if`, `p-log`, `p-tap` follow the upstream `.then`/`.catch`-based grouping (generally avoid in favor of `async`/`await`).
- `make-synchronous` runs work through worker threads — verify platform support for your target.

## 1.0.1 — 2017-09-26

Initial CJS aggregator (`require('promise-fun')`, 49 keys, no types or tests).
