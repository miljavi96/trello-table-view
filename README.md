# Trello Table View Power-Up

A custom Trello Power-Up that renders the board's cards as tables grouped by
list. Works on the Trello Free plan, where the native Table view is not
available.

## Files

| File | Role |
| --- | --- |
| `index.html` | iframe connector Trello loads in the background |
| `client.js` | registers the `board-buttons` capability |
| `table.html` | the modal UI: one table per list |
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

## Notes

- A Power-Up cannot replace the board view; Trello exposes no such hook. The
  table opens in a fullscreen modal on top of the board.
- `t.lists()` and `t.cards()` return promises. Cards carry `idList`, which is
  what the grouping is built from.
- `t.cards()` only returns visible cards: not archived, and in open lists.
