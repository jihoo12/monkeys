# GitHub compatibility notes

Monkey Civilization is built for one very specific deployment target: an SVG loaded by GitHub's README image pipeline. That pipeline is not the same as opening an SVG file directly, and it is not the same as inlining SVG into Markdown.

This document explains what the renderer relies on, what it deliberately avoids, and what can still go wrong.

## The short version

- Embed the generated file with `<img src="...">` (or a Markdown image). **Do not inline the SVG.**
- The SVG is fully self-contained: inline shapes, paths, gradients, and CSS only.
- There is no JavaScript, no external font, no external image, and no network request.
- CSS animation is progressive enhancement. The first frame is a complete, readable scene.
- GitHub's Camo image proxy caches by URL. Use a `?v=...` query string when you need to force a refresh.
- GitHub mobile apps and some readers show the static first frame.

## What GitHub does with README images

When a README contains an image, GitHub rewrites the URL through its Camo image proxy. The browser then loads the proxied SVG as an image document.

Consequences:

1. **SVG is treated as an image, not as HTML.** Scripts would not run even if they were present. We do not emit any.
2. **External resources are blocked or unreliable.** The SVG cannot fetch fonts, images, stylesheets, or scripts. Everything must be inline.
3. **CSS inside the SVG still applies.** Inline `<style>` and CSS animations work in browsers that support them when the SVG is loaded through `<img>`.
4. **The proxy may cache aggressively.** A new commit does not necessarily mean a new image immediately.
5. **Inline SVG in Markdown is a different path.** GitHub sanitizes it and may remove `<style>` or animation-related markup. Use `<img>`.

## What the renderer uses

| Feature | Used? | Why |
| --- | --- | --- |
| `<svg>`, `<g>`, `<rect>`, `<path>`, `<circle>`, `<ellipse>`, `<polygon>` | Yes | Universally supported SVG geometry. |
| `<linearGradient>`, `<radialGradient>` | Yes | Sky, atmospheric glow and HUD surfaces, all referenced by internal fragment IDs. |
| Inline `<style>` with `@keyframes` | Yes | Drives all motion without JavaScript. |
| CSS `transform`, `opacity`, `animation` | Yes | Walking, bobbing, smoke, fire, stars, day/night. |
| `transform-box: fill-box` | Yes | Rotates limbs and wheels around their own boxes. Supported by modern browsers; the static frame does not depend on it. |
| `prefers-reduced-motion` | Yes | Disables animation for users who request reduced motion. |
| `<title>`, `<desc>`, `role="img"`, `aria-labelledby` | Yes | Accessibility. |
| Path-based text | Yes | No font dependency. |
| `<script>` | No | Stripped by GitHub and unnecessary. |
| `<foreignObject>` | No | Not reliable in image rendering. |
| `<image>` / external raster | No | Breaks self-containment. |
| `<text>` | No | Font availability and metrics are unpredictable. |
| SVG filters | No | Expensive and inconsistent. |
| External `href`, `xlink:href`, `@import`, `@font-face`, `url(https://...)` | No | Blocked by the image proxy. |
| Inline event handlers | No | Stripped by GitHub and a security risk. |

`src/compat.ts` enforces the hard rules and warns about soft risks. Run:

```bash
npm run check:svg
# or
npm run check:svg -- path/to/file.svg
```

## Rendering contexts

| Context | Geometry | CSS animation | Notes |
| --- | --- | --- | --- |
| GitHub README, desktop browser | Yes | Yes | The primary target. |
| GitHub README, mobile web | Yes | Usually | Depends on the browser. |
| GitHub mobile app | Yes | No / static | The app often shows only the first frame. |
| GitHub Camo proxy | Yes | Yes | Caches by URL. |
| `raw.githubusercontent.com` directly | Yes | Yes | Useful for debugging. |
| `docs/` GitHub Pages | Yes | Yes | Same SVG, normal browser context. |
| VS Code / IDE preview | Yes | Usually | Depends on the previewer. |
| `resvg` rasterization | Yes | No | Used for PNG screenshots; CSS animation is ignored. |
| Email / RSS readers | Usually | No | Many strip animation. |

The static first frame is deliberately a complete daytime scene, so every context gets a usable image.

## Size and performance

The animated space-age example is roughly **180 KB** and about **1,900 SVG elements**. The compatibility checker uses these thresholds:

- **Over 500 KB**: warning. It should render, but smaller is safer for READMEs.
- **Over 2 MB**: error. Some image proxies or clients may reject or struggle with it.

The renderer keeps the scene at 960×660 and uses simple geometry. There are no filters, no large embedded rasters, and no external requests. Animation is CSS-only and uses transform/opacity where possible.

If you need a smaller file, use `--no-animation`. That removes all keyframes and animation declarations while keeping the full scene.

## Cache busting

GitHub Camo caches images by URL. The daily workflow commits new contents to the same path, so the URL does not change.

If the README looks stale:

1. Open the raw URL directly and confirm the new SVG is there.
2. Append a version query string to the README image URL:

   ```html
   <img src="https://raw.githubusercontent.com/OWNER/REPO/main/monkey-civilization.svg?v=2026-10-27" width="960" alt="...">
   ```

3. Commit the README change. The new URL is a new cache key.

You can also point at a versioned release asset or a commit-specific raw URL if you prefer immutable URLs, but then you must update the README when you want a new version.

## Private repositories and private contributions

- The SVG must be publicly readable for a public profile README. A raw URL from a private repository is not anonymously fetchable.
- Private contribution counts only appear if the token can see them **and** the user's GitHub contribution settings include private contributions on their profile.
- The GraphQL query reads `contributionCalendar`. It does not expose private repository names or commit contents.
- The generated SVG contains only aggregate counts, the username, and derived simulation state. It does not contain commit messages, repository names, or code.

## GitHub Actions notes

The included workflow uses:

```yaml
permissions:
  contents: write
```

and commits the generated SVG and JSON back to the same repository. If the default branch is protected, either allow the bot to push or open a pull request instead of pushing directly.

### Token choice

The workflow tries `secrets.MONKEY_TOKEN` first, then `secrets.GITHUB_TOKEN`.

- The automatic `GITHUB_TOKEN` is scoped to the repository and may be sufficient for public contribution calendars.
- If the GraphQL query is rejected, create a classic PAT with `read:user` and store it as `MONKEY_TOKEN`.
- For private contribution counts, the token also needs access to those private repositories.

### Schedule

The workflow runs at **03:17 UTC** every day and on manual dispatch. GitHub Actions schedules can be delayed during busy periods; the SVG is still deterministic for the window it fetches.

### Repository variable

`GITHUB_USER` defaults to `github.repository_owner`. Set a repository variable if you want to generate a civilization for a different account.

## Accessibility

- The root SVG has `role="img"` and `aria-labelledby` pointing at `<title>` and `<desc>`.
- The title includes the username, age, population, and banana count.
- The description includes active days, contributions, and building count.
- `prefers-reduced-motion: reduce` disables all animation.
- The scene does not rely on color alone for its labels: counters and the age bar have text rendered as paths.

## Security

- No scripts, event handlers, or external references are emitted.
- User-controlled metadata (username) is XML-escaped before it enters `<title>`/`<desc>`.
- The scene header uses the pixel font, which normalizes text to printable ASCII and renders it as paths.
- The compatibility checker rejects inline event handlers, `javascript:` URLs, external `href`s, external CSS, and external fonts.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Image is blank | Bad raw URL, private repo, or wrong branch | Open the raw URL in a browser; check owner/repo/branch. |
| Image is stale | Camo cache | Append `?v=YYYY-MM-DD` to the README URL. |
| No animation | Mobile app, email client, or reduced motion | Expected. The static frame is complete. |
| Text looks like boxes or is missing | A `<text>` element was introduced | The renderer uses paths; run `npm run check:svg` and keep it that way. |
| Animation stutters | Very large SVG or heavy transforms | Use `--no-animation`, reduce the window, or keep the scene simple. |
| GitHub Action cannot read contributions | Token lacks permission | Add a `read:user` classic PAT as `MONKEY_TOKEN`. |
| Push fails | Branch protection or missing `contents: write` | Allow the bot to push or switch to a pull request. |
| Colors look wrong in dark mode | The scene paints its own background | The SVG is self-contained and should not depend on the page theme. Check the raw file. |

## Verification performed

The project verifies:

- Deterministic simulation and rendering with the Node test suite.
- SVG compatibility rules with `src/compat.ts`.
- Static rasterization with `@resvg/resvg-js` for visual inspection.
- Absence of scripts, external references, `<text>`, filters, and fonts in generated output.
- The static fallback has no keyframes or animation declarations.

Actual GitHub rendering still depends on GitHub's current sanitizer and Camo behavior. If GitHub changes its image pipeline, re-run `npm run check:svg` and inspect the raw SVG in a desktop browser.
