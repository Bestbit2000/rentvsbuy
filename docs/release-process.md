# Release process

The live site is GitHub Pages serving the `main` branch of
`Bestbit2000/rentvsbuy`. Anything merged into `main` is published within a
minute or two, so `main` is production.

Releases are tracked as Jira Versions on the `RVB` project (site
`bestbit2000.atlassian.net`), so Jira is the record of what shipped when.
This follows the Music Ledger's release process, cut down to what a static
site with no build step needs.

## Rules

- **Work happens on `sandbox`**, never directly on `main`. A branch rule on
  `main` refuses direct pushes; the only way in is a pull request.
- **Nothing is released unless the owner asks for it** in so many words.
  Claude prepares and checks; the owner decides.
- **Jira statuses:** Done = built on `sandbox`. Released = live on `main`.

## Versioning rule

X.Y.Z, keyed to the type of Jira issue in the release, not strict semver:

- **Patch (Z):** the release contains only Bug-type issues.
- **Minor (Y):** the release contains any non-Bug issue (Story or Task); patch resets to 0.
- **Major (X):** only for a deliberate milestone the owner calls out. Never picked automatically.

The site is pre-1.0 (it started at `0.1.0`): it is still a draft, not the
finalised version. Whoever proposes a version number states it and waits for
confirmation before it is cut. The Jira Version is named `0.1.0`; the git tag
is `v0.1.0`.

## Before asking for a release: checks on `sandbox`

Run these against a local preview of `sandbox` and report the results in the
release's Jira issues:

1. **Nothing moved that shouldn't have.** For changes meant to be invisible
   (refactors, style clean-ups), compare `main` and `sandbox` element by
   element in the calculator's main states and on the home and scenario pages.
2. **Accessibility (WCAG 2.2 AA, 44px targets, 14px minimum text).** axe scan
   with zero violations on all four pages, light and dark, at desktop and
   phone width. For every screen the release changed, also check by hand:
   keyboard only (Tab order, visible focus, Esc closes pop-ups and focus
   returns), and text zoomed to 200%.
3. **JavaScript off.** The home and scenario pages keep their layout; the
   calculator shows its "not available" panel.
4. **Tailwind is rebuilt** if any Tailwind class changed on the home or
   scenario pages (the command is at the top of `css/tailwind.input.css`),
   and `css/tailwind.css` is committed.
5. **Cache busting.** If `css/style.css` or `javascript/main.js` changed,
   their `?v=` numbers in `rent_buy_calculator.html` are bumped.

## Steps

1. Decide which Done issues belong in the release and what the next version
   number should be per the rule above. **Propose it, get it confirmed.**
2. Open a pull request from `sandbox` into `main`:
   ```bash
   gh pr create --base main --head sandbox --title "Release <version>" --body "<what is going out, with the RVB issue keys>"
   ```
3. Merge it. This publishes the site.
   ```bash
   gh pr merge <number> --merge
   ```
4. Check the live site: open `https://bestbit2000.github.io/rentvsbuy/`,
   load the calculator with sample data, and confirm the change is there.
   The Pages deployment is listed under the repository's Deployments.
5. Run the Jira-side automation, once the release really is live:
   ```bash
   node scripts/cut-release.mjs <version> <ISSUE-1> [ISSUE-2 ...]
   # e.g. node scripts/cut-release.mjs 0.1.0 RVB-1 RVB-2 RVB-3 RVB-4
   ```
   This finds or creates the Jira Version, sets each issue's Fix Version,
   moves each issue to Released, and marks the Version released. It needs the
   four `JIRA_` settings in `.env` (see `.env.example`).
   `node scripts/cut-release.mjs --check` tests the connection without
   changing anything.
6. Tag the release on `main` and push the tag:
   ```bash
   git fetch origin
   git tag -a v<version> origin/main -m "Release <version>"
   git push origin v<version>
   ```
7. Bring `sandbox` level with `main`, so the next piece of work starts from
   what is live:
   ```bash
   git checkout sandbox
   git merge --ff-only origin/main
   git push origin sandbox
   ```
   `git rev-parse origin/main origin/sandbox` must then print the same hash twice.

## If something is wrong after a release

Revert through a pull request, not a force push (force pushes to `main` are
blocked): on `sandbox`, `git revert` the merge or the offending commits, check
it locally, then release the revert by the steps above as a patch version.

## Secrets

`.env` holds local credentials and is ignored by git. The repository is
public, so stage files by name (never `git add .` or `git add -A`) and never
commit `.env`.
