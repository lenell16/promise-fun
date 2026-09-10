// Build-time only: untyped upstream dependencies resolve to `any` during
// `tsc`. This file is type input only — `.d.ts` sources are never emitted,
// so nothing here ships in dist/ or leaks into consumer type resolution.
// Every entry must have a self-contained hand-authored subpath module
// (see HAND_AUTHOR_SUBPATHS in scripts/generate-exports.mjs).
declare module 'p-break';
