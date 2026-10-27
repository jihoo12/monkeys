# Releasing the action

The repository is prepared for release. Publishing is a deliberate manual step:
CI and the generation workflow never create or move tags, and preparing the action
does not publish a release or a `v1` tag.

## 1. Preflight

Run everything from a clean `main` checkout:

```bash
git switch main
git pull --ff-only
git status --short          # must be empty

npm ci
npm run typecheck
npm test                    # includes the action and consumer-workspace tests
npm run generate:demo
npm run check:svg
```

Confirm that `action.yml` still:

- uses `runs.using: composite`;
- installs Node.js 24;
- exposes `github_token`, `username`, `output`, `json_output`, and `animate`;
- runs `node "$GITHUB_ACTION_PATH/src/action.ts"`;
- never runs `npm ci` or `npm install` in the caller's workspace.

The test suite parses `action.yml` and asserts these properties.

## 2. Pick a version

Use semantic versioning for the action itself:

```bash
npm version 1.0.0 --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore: release v1.0.0"
git push origin main
```

If `package.json` is already at the release version, skip the `npm version`
step and commit the release notes instead.

## 3. Tag the exact release

```bash
git tag -a v1.0.0 -m "Monkey Civilization v1.0.0"
git push origin v1.0.0
```

Create the GitHub release (this does **not** move `v1`):

```bash
gh release create v1.0.0 \
  --title "Monkey Civilization v1.0.0" \
  --generate-notes
```

## 4. Verify the tagged action

Before moving the major tag, use the exact version from a separate repository:

```yaml
- uses: jihoo12/monkeys@v1.0.0
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    username: ${{ github.repository_owner }}
```

Check that:

- the workflow resolves the action and installs Node 24;
- the SVG is written to the consumer workspace;
- the caller's `package.json` is unchanged and no `node_modules` is created;
- the job summary and action outputs are populated.

The local equivalent is `npm run test:action`, which copies the action and a
consumer fixture into separate temporary directories.

## 5. Move the major tag (optional, deliberate)

Only after the exact version has been verified:

```bash
git tag -fa v1 -m "Monkey Civilization v1"
git push origin v1 --force
```

This is the only command that changes what `jihoo12/monkeys@v1` resolves to.
It is intentionally not automated: neither CI nor the generation workflow
creates or moves tags. If the repository uses GitHub's immutable releases
setting, tags cannot be moved; publish a new version instead.

## 6. Marketplace (optional)

In the GitHub release editor, select **Publish this Action to the GitHub
Marketplace**, accept the developer agreement, and choose a category. The
action already declares `branding` (`git-branch`, yellow) in `action.yml`.

## Rollback

If a release is broken:

1. Do not move `v1` to the broken version.
2. Publish a fixed patch (`v1.0.1`) and point `v1` at it.
3. If `v1` already points at the broken release, move it back deliberately:

   ```bash
   git tag -fa v1 v1.0.0 -m "Monkey Civilization v1"
   git push origin v1 --force
   ```

Consumers who pinned `@v1.0.0` are unaffected by major-tag changes.
