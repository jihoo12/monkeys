# Monkey Civilization GitHub Action

`jihoo12/monkeys` is a composite GitHub Action. It runs the same fetcher,
simulation engine, renderer, and compatibility checker as the CLI, but it does
not require the caller to check out this repository, install Node packages, or
change its `package.json`.

## Minimal workflow

```yaml
name: Monkey Civilization

on:
  schedule:
    - cron: '17 3 * * *'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  monkeys:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: jihoo12/monkeys@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          username: ${{ github.repository_owner }}
      - run: |
          git add monkey-civilization.svg
          if git diff --cached --quiet; then exit 0; fi
          git config user.name "monkey-civilization[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git commit -m "chore: refresh monkey civilization"
          git push
```

A complete version that also writes and commits the JSON summary lives at
[`examples/consumer-workflow.yml`](../examples/consumer-workflow.yml).

## Inputs

| Input | Required | Default | Description |
| --- | --- | --- | --- |
| `github_token` | yes | — | Token used for the GraphQL request. Usually `${{ secrets.GITHUB_TOKEN }}`. |
| `username` | no | `github.repository_owner` | GitHub login to simulate. |
| `output` | no | `monkey-civilization.svg` | SVG path, relative to `GITHUB_WORKSPACE`. Absolute paths are also accepted. |
| `json_output` | no | empty | Optional JSON summary path. Empty disables the summary. |
| `animate` | no | `true` | `false`/`0`/`no`/`off` emits a fully static SVG. |

## Outputs

| Output | Description |
| --- | --- |
| `svg_path` | Absolute path to the generated SVG. |
| `json_path` | Absolute path to the JSON summary, or empty. |
| `age` | Age name, for example `SPACE AGE`. |
| `population` | Monkey population. |
| `contributions` | Contributions in the 365-day window. |
| `buildings` | Number of constructed buildings. |

The action also appends a short summary to the job's step summary.

## How it runs

`action.yml` uses `runs.using: composite` with two steps:

1. `actions/setup-node@v4` installs Node.js 24.
2. `node "$GITHUB_ACTION_PATH/src/action.ts"` runs the action entry point.

`GITHUB_ACTION_PATH` points at the action checkout (for example
`/home/runner/work/_actions/jihoo12/monkeys/v1`). Node resolves every import
relative to `src/action.ts`, so no files are read from the caller's repository
except through explicit input paths. The action has **zero runtime
dependencies**; `npm ci` is never run in the caller's project and no
`node_modules` directory is created there.

`actions/setup-node` makes Node.js 24 the default `node` for the rest of the
job. If a later step needs a different Node version, set up that version in the
later step (or run the other step before this action).

`src/action.ts` and `src/cli.ts` both call `src/generate.ts`, so the action and
the command line share one fetch → simulate → render → validate pipeline.

Output paths are resolved against `GITHUB_WORKSPACE` when they are relative, so
files always land in the caller's checkout. The action does not commit or push;
add a commit step like the one above, or upload the SVG as an artifact.

## Tokens and permissions

The caller workflow needs `contents: write` only if it commits the result.
Reading the contribution calendar requires a token that GitHub will accept:

- `secrets.GITHUB_TOKEN` works for many public calendars and needs no setup.
- If the GraphQL request is rejected (401/403 or "not visible"), use a classic
  PAT with `read:user` and store it as a secret:

  ```yaml
  - uses: jihoo12/monkeys@v1
    with:
      github_token: ${{ secrets.MONKEY_TOKEN }}
      username: ${{ github.repository_owner }}
  ```

- Private contribution counts appear only when the token can see the relevant
  private repositories and the user's contribution visibility settings allow it.
- The token is passed through the `INPUT_GITHUB_TOKEN` environment variable. It
  is never printed and is masked by the runner when it comes from a secret.

## GitHub Enterprise Server

On GHES, the action derives the GraphQL endpoint from `GITHUB_SERVER_URL`
(`https://ghe.example.com/api/graphql`). Override it explicitly if your
instance uses a different path:

```yaml
- uses: jihoo12/monkeys@v1
  env:
    MONKEY_GRAPHQL_URL: https://ghe.example.com/api/graphql
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    username: ${{ github.repository_owner }}
```

## Versioning

- `jihoo12/monkeys@v1` follows the latest compatible 1.x release.
- Pin `jihoo12/monkeys@v1.0.0` or a commit SHA for reproducible builds.
- The `v1` tag is moved only as part of a deliberate release. The daily
  generation workflow and CI never move tags. See
  [releasing.md](releasing.md) for the exact commands.

## Validation

```bash
npm run test:action
```

The tests simulate a real runner layout:

- the action is copied to a separate `_actions/jihoo12/monkeys/v1` directory;
- a consumer repository fixture is copied to another directory, with its own
  `package.json` and a dependency it never installs;
- a local fake GraphQL server returns a deterministic contribution calendar;
- the action runs with `GITHUB_ACTION_PATH`, `GITHUB_WORKSPACE`, `INPUT_*`,
  `GITHUB_OUTPUT`, and `GITHUB_STEP_SUMMARY` set;
- the tests assert that the SVG and JSON land in the consumer workspace, that
  outputs and the step summary are written, that the consumer's `package.json`
  is byte-for-byte unchanged, and that no `node_modules` appears.

`npm test` runs these tests together with the simulation, renderer, and CLI
suites.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `github_token is required` | Pass `github_token` explicitly; the action does not assume a token. |
| `GitHub GraphQL request failed (401/403)` | The token cannot read the calendar. Use a classic PAT with `read:user`. |
| `user "..." was not found` | Check the login, and make sure the token can see that user. |
| `Resource not accessible by integration` | The automatic token is restricted; switch to a PAT. |
| The README shows an old image | GitHub's Camo proxy caches by URL. Add or bump a `?v=` query string. |
| No animation | Set `animate: true` (the default). Mobile apps and some readers show the static first frame regardless. |
| The action is slow the first time | `actions/setup-node` may download Node 24. Later runs reuse the runner cache. |
