# Public listing — submission kit

Everything needed to submit **Cardsheet** to the Trello Power-Up directory.
Copy the blocks below straight into the fields at <https://trello.com/apps/admin>.

> The product is named **Cardsheet**. The repository stays `trello-table-view`
> and the connector URL never changes — renaming the repo would break the
> published Power-Up. Nobody sees the repo name; everybody sees the listing.

## Fixed values

| Field | Value |
| --- | --- |
| Name | `Cardsheet` |
| Iframe connector URL | `https://miljavi96.github.io/trello-table-view/index.html` |
| Privacy policy URL | `https://miljavi96.github.io/trello-table-view/privacy.html` |
| Support email | `miljavi96.mj@gmail.com` |
| Icon | `https://miljavi96.github.io/trello-table-view/icon-app.svg` |
| Capabilities | `board-buttons` |
| Categories | Board Utilities / Reporting (pick the closest two offered) |

## Where each field lives in the admin portal

Verified against the portal itself, because the documentation does not say and
the fields are spread across four different tabs:

| Field | Tab |
| --- | --- |
| Iframe connector URL, Icon, Categories, Email, Support contact, Author | **Basic information** |
| `board-buttons` | **Capabilities** |
| Overview and Description | **Listings** |
| Privacy policy URL | **Privacy and compliance** |

The Icon field states **144px by 144px, served over https**, and takes a single
image — there is no light/dark pair as there is for the board button. That is
why `icon-app.svg` carries its own background: it has to read on a white
directory card and on Trello's dark chrome alike. Do not point this field at
`icon-black.svg`; that one is 24x24 and is the board button icon.

## Positioning

The directory already has table-style Power-Ups, and at least one of them does
more than Cardsheet: bulk actions, inline editing, multi-field sorting. Do not
compete on feature count — that comparison is already lost and it is the wrong
fight.

Compete on the four things they cannot match:

1. **Free**, with no paid tier waiting behind a feature.
2. **No account, no sign-up, no authorization prompt.**
3. **Read-only.** It cannot damage a board, so it is safe to hand to anyone.
4. **Open source**, so every privacy claim is verifiable.

Every piece of copy below leads with those.

## Overview

> Plain text only — this field does not render markdown.

```
See every card on your board as a sortable, filterable sheet. Group by list or
view the whole board at once, choose which columns and lists to show, and sort
by any column. Free, no account, and read-only: Cardsheet can never change your
board. Your layout is remembered per board. Available in English and Spanish.
```

## Description

> This field renders markdown.

```markdown
**Cardsheet turns your board into a sheet.**

Boards are great for moving work along. They are less great when you need to
scan two hundred cards and answer a question. Cardsheet gives you the other
half of that: one screen, every card, sorted the way you need it.

Enable it and it works. There is no account to create, nothing to authorize,
and no paid tier waiting behind a feature.

### What it does

- **Group by list, or don't.** See a section per list, or one flat sheet across
  the entire board.
- **Filter as you type.** Search across card name, list, labels, members and
  card number at once.
- **Pick your columns.** Row number, card number, card, list, due date, labels
  and members — show the ones you care about, hide the rest.
- **Pick your lists.** Hide the lists that are noise, with All / None shortcuts.
- **Sort by any column.** Click a header to sort, click it again to flip the
  direction.
- **Spot what's late.** Overdue cards are highlighted; cards marked complete
  are not.
- **A stable row number.** The `N°` column always counts 1..n in painted order,
  so it never scrambles when you sort by something else.

### Safe by design

Cardsheet is **read-only**. It never creates, edits, moves, archives or deletes
anything in Trello — there is no click in it that can damage a board. Card
names link straight to the card when you do want to make a change.

That also means there is nothing to undo, nothing to train your team on, and no
reason to think twice before enabling it on a board that matters.

### Built to stay out of your way

- **Your layout is remembered** per board and private to you — columns, hidden
  lists and sort order are all still there next time you open it.
- **It follows your theme.** Light and dark, matching Trello.
- **It speaks your language.** English and Spanish, picked up automatically
  from your own Trello language setting.
- **No account and no sign-up.** Enable it and it works.

### Privacy

Cardsheet has no server of its own. Board data is read in your browser to draw
the sheet and is never sent anywhere. Your preferences are stored through
Trello's own storage API, so they never leave Trello. No analytics, no cookies,
no tracking.

The source is public, so none of that has to be taken on trust:
<https://github.com/miljavi96/trello-table-view>
```

## Screenshots to capture

Reviewers and the directory both want to see it working. Capture on a real
board with enough cards to look convincing:

1. Grouped by list, several sections visible.
2. Flat sheet sorted by due date, with an overdue card highlighted.
3. The Columns menu open, showing the column picker.
4. The filter box with a query typed and the result count visible.
5. An animated GIF of typing in the filter and clicking a header to sort —
   the launch playbook specifically recommends a GIF.

Crop to the modal. Do not include real client names or anything confidential
from the SISCOTIC board — use a demo board.

## Submission checklist

Things only you can do:

- [ ] Set the support email in the admin portal to the same address already
      in `privacy.html`: `miljavi96.mj@gmail.com`.
- [ ] Confirm `Cardsheet` is actually free when you register it — a web search
      is not proof, the portal is.
- [ ] Register the Power-Up at <https://trello.com/apps/admin> in a Workspace
      **you administer**, and sign the Joint Developer's Agreement.
- [ ] Fill in Overview, Description, icon and categories from this file.
- [ ] Capture the screenshots and the GIF above.
- [ ] Note the **Power-Up ID** from the editing URL.
- [ ] Submit at <https://go.trello.com/dev-support> with the connector URL and
      the Power-Up ID.
- [ ] Expect **two or more weeks** of review, plus two weeks of marketing prep
      after approval if you coordinate a launch date.

Review criteria to keep in mind: zero JavaScript console errors, zero typos,
no timeouts on a large board, correctly styled icons, no Trello trademark in
the name or assets, no ads or pop-ups.

## Localization

Cardsheet ships in **English and Spanish**, following the member's own Trello
language automatically. Mention this in the listing: most small Power-Ups are
English-only.

Adding a language before launch is cheap — one `strings/<locale>.json` file
plus one entry in `supportedLocales` in `table.js`. `tests/smoke.js` fails if a
locale is missing a key, so a half-finished translation cannot ship.

The listing itself also supports localized Overview and Description fields. If
you translate them, translate the screenshots too: a Spanish description over
English screenshots reads worse than leaving both in English.
