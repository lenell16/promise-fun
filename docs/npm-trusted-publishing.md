# npm trusted publishing (OIDC) for promise-fun

No long-lived `NPM_TOKEN` needed. Publishing uses npm [trusted publishing]
via GitHub Actions OIDC, with provenance attestations on every release.

## One-time setup on npmjs.com (package owner action)

1. Log in at <https://www.npmjs.com> as a maintainer of `promise-fun`.
2. Open the package page → **Settings** → **Trusted Publisher** →
   **Manage Trusted Publishers** → **Add a trusted publisher** → **GitHub Actions**.
3. Enter exactly:
   - Organization: `lenell16`
   - Repository: `promise-fun`
   - Workflow filename: `publish.yml`
   - Environment: `npm` (must match the `environment: npm` in
     `.github/workflows/publish.yml`; leave blank in npm only if you also
     remove it from the workflow)
4. Save. npm now mints a short-lived token per run of that workflow —
   nothing to store in GitHub Secrets.

Requirements for provenance: the workflow must run on a public repo with
`permissions.id-token: write`, `registry-url` set in `setup-node`, and
`npm publish --provenance` — all already configured in `publish.yml`.
npm CLI >= 9.5 with Node >= 18 is required; the workflow pins Node 24.

## Release flow

```bash
git checkout master && git pull origin master
# version already bumped in package.json (e.g. 2.0.0)
git tag v2.0.0 && git push origin v2.0.0
```

Pushing a `v*` tag triggers `publish.yml`, which runs the final gates
(`npm ci`, `npm test`, `npm run lint`, `publint`, `attw --pack .`,
`npm pack --dry-run`), verifies the tag matches `package.json`'s version,
then runs `npm publish --provenance --access public`.

## Dry-run notes (no registry writes)

- **Manual dry run (recommended before first release):** Actions →
  `Publish` → `Run workflow` → leave `dry_run` checked. Runs every gate
  plus `npm publish --provenance --access public --dry-run`. Safe without
  trusted-publisher setup, but the OIDC mint step is skipped in dry-run
  mode only if npm auth is never reached — if npm rejects the token,
  complete the trusted-publisher setup first.
- **Local dry run:** `npm ci && npm test && npm run lint && npx publint &&
npx attw --pack . && npm pack --dry-run`.
- **Real publish via dispatch:** uncheck `dry_run` when running manually.
  Prefer tag pushes for releases so the tag and tarball stay in sync.
- Verify after publish: `npm view promise-fun dist-tags` and install from
  a temp dir (`npm i promise-fun@<version>`), then import `promise-fun`.

## Troubleshooting

- `403 Forbidden` on publish → trusted publisher org/repo/workflow/
  environment does not match exactly, or the run is from a fork/PR.
- Tag/version mismatch failure → the `v*` tag must equal
  `package.json`'s `version` (e.g. tag `v2.0.0` for `"version": "2.0.0"`).
- Provenance errors → keep `id-token: write` permission and
  `--provenance` flag; do not publish via a granulated token without
  provenance support.

[trusted publishing]: https://docs.npmjs.com/trusted-publishers/
