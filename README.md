# Trello Table View Power-Up

A custom Trello Power-Up that renders the board's cards as sortable, filterable
tables. Works on the Trello Free plan, where the native Table view is not
available.

## Features

- Group by list, or one flat table across the whole board.
- Filter across card name, list, labels, members and card number.
- A row number column (`N°`) that always counts 1..n in painted order and is
  never reordered by sorting.
- Choose which columns to show: row number, card number, card, list, due date,
  labels, members.
- Choose which lists to show, with All / None shortcuts.
- Sort by any column; click a header again to flip the direction.
- Label colors match Trello's palette, including `_light` / `_dark` shades.
- Overdue cards are highlighted; cards marked complete are not.
- Follows Trello's light and dark color theme.
- Preferences persist per board, private to the member, through Trello's
  own storage API, and are migrated forward when a new column ships.

## Files

| File | Role |
| --- | --- |
| `index.html` | iframe connector Trello loads in the background |
| `client.js` | registers the `board-buttons` capability |
| `table.html` | modal markup: toolbar and table container |
| `table.css` | theme tokens and layout |
| `table.js` | data loading, filtering, sorting, preferences |
| `icon-black.svg` / `icon-white.svg` | board button icons (light / dark chrome) |

## Setup

1. Push this repository to GitHub as a **public** repository.
2. Enable GitHub Pages: **Settings > Pages > Deploy from a branch >
   `main` / `(root)`**.
3. Confirm `https://<user>.github.io/<repo>/index.html` returns 200. The
   connector must be served over HTTPS or Trello cannot talk to it.
4. Open <https://trello.com/apps/admin>, pick your Workspace, click **New**,
   and set the **iframe connector URL** to the Pages URL above.
5. In the **Capabilities** tab, enable `board-buttons`.
6. On the board: **Power-Ups > Custom**, then enable this Power-Up. A **Table**
   button appears in the board header.

`BASE_URL` in `client.js` must match the published Pages URL.

## Notes

- A Power-Up cannot replace the board view; Trello exposes no such hook. The
  table opens in a fullscreen modal on top of the board.
- Board button icons are rendered by Trello on its own page, so those URLs must
  be **absolute**. The modal `url` is loaded by the Power-Up's own iframe, so a
  relative path is correct there.
- `t.cards()` only returns visible cards: not archived, and in open lists.
- Preferences use `t.set('board', 'private', ...)` rather than `localStorage`,
  which browsers increasingly partition or block inside third-party iframes.
