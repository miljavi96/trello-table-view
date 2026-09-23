# Cardsheet (Trello Power-Up) — working notes

A custom Trello Power-Up that shows a board's cards as sortable, filterable
tables. It exists because the native Table view is Premium-only and this board
is on the **Free** plan.

**Status: live and in use.** Deployed, registered, enabled on the board, and
serving a ~717-card board. Everything below is already done — read it before
changing anything, because several of these decisions look wrong until you know
why they were made.

## Quick path

```bash
# 1. change files, then validate
node --check table.js
node tests/smoke.js          # 15 assertions, must print ALL GREEN

# 2. ship
git push

# 3. confirm what is actually served (curl skips the browser cache)
curl -s -o /dev/null -w '%{http_code}\n' https://miljavi96.github.io/trello-table-view/table.js
```

GitHub Pages sends `Cache-Control: max-age=600`, so a browser may hold the old
`table.js` / `table.css` for **10 minutes** after a deploy. To force it: open
`https://miljavi96.github.io/trello-table-view/table.html` in a tab and hard
reload. It renders an error outside Trello — that is expected — but the fresh
files land in the cache.

## Live configuration

Do not redo any of this; it is already set up.

| Thing | Value |
|---|---|
| Repo | `miljavi96/trello-table-view`, public |
| Hosting | GitHub Pages, `main` / root |
| Connector URL | `https://miljavi96.github.io/trello-table-view/index.html` |
| Admin portal | <https://trello.com/apps/admin> (**not** `/power-ups/admin`) |
| Capability | `board-buttons` only |
| Plan | Trello Free — unlimited Power-Ups per board since Aug 2021 |

`BASE_URL` in `client.js` is hardcoded to the Pages URL and must match it.

## Files

| File | Role |
|---|---|
| `index.html` | connector; Trello loads it as a hidden iframe |
| `client.js` | registers the `board-buttons` capability, opens the modal |
| `table.html` | modal markup: toolbar + `#root` container |
| `table.css` | theme tokens, layout, label palette |
| `table.js` | data loading, filtering, sorting, preferences, localization |
| `strings/*.json` | one flat key/value file per locale |
| `tests/smoke.js` | headless render test with stubbed Trello + DOM |
| `icon-*.svg` | board button icons, light and dark chrome |

## Rules learned the hard way

Each of these cost real debugging time. They are not style preferences.

| Rule | Why |
|---|---|
| Board button icons need **absolute** URLs | Trello renders that icon on **its own page**, so a relative path resolves against `trello.com` and 404s. The modal `url` is loaded by the Power-Up's own iframe, so a relative path is correct *there*. Same file, two relative paths, only one works. |
| A Power-Up cannot replace the board view | Trello exposes no such hook. A fullscreen modal on top of the board is the ceiling. |
| `t.set()` does **not** edit a card | It stores Power-Up metadata attached to an object. It never touches `name`, `due`, `labels` or `idList`. |
| Preferences use `t.set`, never `localStorage` | The Power-Up runs in a third-party iframe, where browsers increasingly partition or block storage. `t.set('board', 'private', ...)` is scoped per board, per member, and is not subject to that. |
| Label colors arrive with shades | Trello sends `red_dark`, `green_light`, not just `red`. `baseColor()` strips the suffix before the CSS palette lookup. |
| `t.cards()` returns visible cards only | Not archived, and in open lists. |
| The client library is read-only | See *Not built yet* below. |
| The product is **Cardsheet**; the repo stays `trello-table-view` | Renaming the repo changes the Pages URL, which breaks `BASE_URL`, the registered connector URL and the live Power-Up on the board. The repo name is invisible to users. Never "tidy up" this mismatch. |
| Do not call it "Table View" | Trello's own Premium feature is called Table view, **and** a third-party Power-Up of that exact name already exists in the directory. Public listing guidelines reject names that clash with Trello naming. |

## Preferences: schema and migration contract

Preferences live in Trello under `t.get/set('board', 'private', 'tableViewPrefs')`.

```js
{ version, groupByList, columns[], hiddenLists[], sortKey, sortDir }
```

**Adding a column requires three edits, not one:**

1. Add the entry to `COLUMNS`.
2. Bump `PREFS_VERSION`.
3. List the new key in `COLUMNS_ADDED_IN[<new version>]`.

Skip step 2 or 3 and the column is invisible to everyone who already saved a
layout — which is every existing user. It will look fine on a fresh profile.

Two bugs already came from this, both caught by `tests/smoke.js` and neither
visible by reading the code:

- **Migration never ran.** `migratePrefs({...DEFAULT_PREFS, ...loadedPrefs})`
  injected a current `version` into an old payload, so the guard returned early.
  The raw stored payload must be passed in.
- **Migration silently reset choices.** It re-added every missing default
  column, switching back on the ones the member had deliberately turned off.
  Only columns introduced *after* the stored version may be added.

## Localization: schema and contract

Strings live in `strings/{locale}.json`, flat key/value, with `{placeholder}`
substitution. Trello's own localizer loads them — there is no custom i18n
layer. `t.localizeKey` is **synchronous**, but only after the localizer has
loaded, which is why `table.js` boots inside
`TrelloPowerUp.util.initLocalizer(...)` instead of calling `t.render()`.

**Adding a language requires two edits, not one:**

1. Add `strings/<locale>.json` with **every** key that `en.json` has.
2. Add the locale to `supportedLocales` in `LOCALIZATION` in `table.js`.

`tests/smoke.js` enforces both halves: it loads the real JSON files, fails if
two locales disagree on their key sets, and fails if `table.js` ever asks for a
key a locale does not define. A forgotten string cannot reach the directory.

Two things that look like mistakes and are not:

- **`COLUMNS` stores `labelKey`, not text.** `COLUMNS` is built at load time,
  before the localizer is ready, so the lookup has to happen at render time.
- **The English text in `table.html` is not decoration.** It is the fallback
  rendered if the strings file fails to load. Never empty those elements, and
  never assign a raw key over them.

`N°` and `#` are deliberately identical across locales: they are symbols, not
words.

## Columns

Two numeric columns exist and they are not the same thing:

- **`N°`** (`rowNumber`) — positional. Numbered while painting rows, so sorting
  never reorders it; it always reads 1..n. Header is `sortable: false` and
  renders without `data-sort`, so the click handler ignores it. Restarts per
  section when `groupByList` is on.
- **`#`** (`idShort`) — the card's real Trello number. A card field, sortable.

## Verification

`tests/smoke.js` runs `table.js` under `vm.runInNewContext` with a stubbed
`document` and a fake `TrelloPowerUp`, then asserts against the rendered HTML.
No browser, no network, no dependencies.

```bash
node tests/smoke.js
```

It covers: row numbers stable under asc and desc sorting, the `N°` header not
being sortable, migration preserving previous choices, grouping, label shade
normalization, overdue vs. complete, the card counter, locale key parity and
Spanish rendering, and survival when the localizer never loads.

The translation-coverage assertion runs **last on purpose**. It inspects the
keys every locale actually requested, so moving it earlier silently narrows it
to whichever locale happened to have rendered by then.

Add an assertion here before fixing any bug found from now on. Both bugs above
were found this way and neither was visible by reading.

## Not built yet

**Inline card editing.** The client library is read-only. Editing requires:
`TrelloPowerUp.initialize(capabilities, { appKey, appName, appAuthor })`, an
`authorize.html` page whose button calls `t.getRestApi().authorize({ scope:
'read,write' })` — only from a direct user click, or the popup is blocked —
then `PUT https://api.trello.com/1/cards/{id}`.

This is a genuine step up in cost: tokens, authorization state, network
failures, and deciding what the table shows when a write half-fails. Deliberately
deferred. The card name already links to the card, which covers editing at zero
maintenance.

**Other ideas:** CSV export (the filtered and sorted array is already in hand),
continuous row numbering across sections instead of restarting per list.

## Conventions

- Code, comments, UI strings and docs in English. Conversation in Spanish.
- Conventional commits, no AI attribution lines.
- No build step, no npm, no framework. Plain static files, and it should stay
  that way — the whole point is that GitHub Pages can serve it.
