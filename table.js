// Locales live in ./strings/{locale}.json as flat key/value files. Adding a
// language is one file plus one entry in supportedLocales — nothing else.
const LOCALIZATION = {
  defaultLocale: 'en',
  supportedLocales: ['en', 'es'],
  resourceUrl: './strings/{locale}.json'
};

const t = window.TrelloPowerUp.iframe({ localization: LOCALIZATION });

// t.localizeKey is synchronous once the localizer has loaded, so call sites
// stay plain. The one wait happens in the boot sequence at the bottom.
// If the localizer never loaded, the key itself is returned rather than
// throwing: a missing translation must never take the whole table down.
const i18n = (key, data) => {
  try {
    return t.localizeKey(key, data);
  } catch (error) {
    return key;
  }
};

const PREFS_KEY = 'tableViewPrefs';

// Bumped whenever a new column ships, so stored preferences pick it up
// instead of silently hiding it from members who already saved a layout.
const PREFS_VERSION = 2;

const DEFAULT_PREFS = {
  version: PREFS_VERSION,
  groupByList: true,
  columns: ['rowNumber', 'name', 'due', 'labels', 'members'],
  hiddenLists: [],
  sortKey: 'name',
  sortDir: 'asc'
};

const dom = {
  root: document.getElementById('root'),
  search: document.getElementById('search'),
  columnsBody: document.getElementById('columns-body'),
  listsBody: document.getElementById('lists-body'),
  listsActions: document.querySelector('.menu-actions'),
  groupByList: document.getElementById('group-by-list'),
  summary: document.getElementById('summary'),
  reset: document.getElementById('reset')
};

let prefs = { ...DEFAULT_PREFS };
let lists = [];
let cards = [];
let listNames = new Map();
let query = '';

/* ---------- helpers ---------- */

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);

const listNameOf = (card) => listNames.get(card.idList) || '';

const labelsText = (card) =>
  (card.labels || []).map((label) => label.name || label.color || '').join(' ');

const membersText = (card) =>
  (card.members || []).map((member) => member.fullName || member.username || '').join(', ');

const isOverdue = (card) =>
  Boolean(card.due) && !card.dueComplete && new Date(card.due) < new Date();

// Trello label colors come as "green", but also as shades like "green_dark".
// The base color carries the identity, so the shade suffix is dropped.
const baseColor = (color) => String(color || 'none').split('_')[0];

/* ---------- static text ---------- */

// The toolbar ships with English text inline so the chrome is never blank if
// the strings file fails. These two passes swap in the member's language.
//
// i18n() returns the key itself when the localizer never loaded, so a blind
// assignment here would replace "Columns" with "menu-columns" and destroy the
// very fallback table.html exists to provide. Only a real translation wins.
const translated = (key) => {
  const value = i18n(key);
  return value && value !== key ? value : null;
};

const localizeStatic = () => {
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const value = translated(node.dataset.i18n);
    if (value) node.textContent = value;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
    const value = translated(node.dataset.i18nPlaceholder);
    if (value) node.setAttribute('placeholder', value);
  });
};

/* ---------- columns ---------- */

// labelKey / menuKey are translation keys, not text: COLUMNS is built at load
// time, before the localizer is ready, so the lookup has to happen at render.
const COLUMNS = [
  {
    // Positional, not a card field: it numbers the rows as they are painted,
    // so sorting the other columns never changes it.
    key: 'rowNumber',
    labelKey: 'column-row-number',
    menuKey: 'column-row-number-menu',
    sortable: false,
    render: (card, index) => `<span class="row-number">${index + 1}</span>`
  },
  {
    key: 'idShort',
    labelKey: 'column-card-number',
    menuKey: 'column-card-number-menu',
    sortValue: (card) => card.idShort,
    render: (card) => `<span class="muted">${escapeHtml(card.idShort)}</span>`
  },
  {
    key: 'name',
    labelKey: 'column-name',
    sortValue: (card) => card.name.toLowerCase(),
    render: (card) =>
      `<a href="${escapeHtml(card.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(card.name)}</a>`
  },
  {
    key: 'list',
    labelKey: 'column-list',
    sortValue: (card) => listNameOf(card).toLowerCase(),
    render: (card) => escapeHtml(listNameOf(card))
  },
  {
    key: 'due',
    labelKey: 'column-due',
    sortValue: (card) => (card.due ? new Date(card.due).getTime() : Number.POSITIVE_INFINITY),
    render: (card) => {
      if (!card.due) return '<span class="muted">&mdash;</span>';
      const text = escapeHtml(new Date(card.due).toLocaleDateString());
      return isOverdue(card) ? `<span class="overdue">${text}</span>` : text;
    }
  },
  {
    key: 'labels',
    labelKey: 'column-labels',
    sortValue: (card) => labelsText(card).toLowerCase(),
    render: (card) => {
      const labels = card.labels || [];
      if (!labels.length) return '<span class="muted">&mdash;</span>';
      return labels
        .map((label) => {
          const color = baseColor(label.color);
          const text = label.name || color;
          return `<span class="label" data-color="${escapeHtml(color)}" title="${escapeHtml(text)}">${escapeHtml(text)}</span>`;
        })
        .join('');
    }
  },
  {
    key: 'members',
    labelKey: 'column-members',
    sortValue: (card) => membersText(card).toLowerCase(),
    render: (card) => {
      const text = membersText(card);
      return text ? escapeHtml(text) : '<span class="muted">&mdash;</span>';
    }
  }
];

const columnByKey = new Map(COLUMNS.map((column) => [column.key, column]));

const visibleColumns = () => {
  const selected = COLUMNS.filter((column) => prefs.columns.includes(column.key));
  return selected.length ? selected : [columnByKey.get('name')];
};

/* ---------- data shaping ---------- */

const matchesQuery = (card) => {
  if (!query) return true;
  const haystack = [
    card.name,
    listNameOf(card),
    labelsText(card),
    membersText(card),
    String(card.idShort)
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
};

const sortCards = (subset) => {
  const chosen = columnByKey.get(prefs.sortKey);
  const column = chosen && chosen.sortValue ? chosen : columnByKey.get('name');
  const direction = prefs.sortDir === 'desc' ? -1 : 1;

  return [...subset].sort((a, b) => {
    const left = column.sortValue(a);
    const right = column.sortValue(b);
    if (left < right) return -1 * direction;
    if (left > right) return 1 * direction;
    return 0;
  });
};

/* ---------- rendering ---------- */

const renderHead = () => {
  const cells = visibleColumns()
    .map((column) => {
      const label = escapeHtml(i18n(column.labelKey));
      if (column.sortable === false) {
        return `<th class="static">${label}</th>`;
      }
      const active = prefs.sortKey === column.key;
      const arrow = active
        ? `<span class="arrow">${prefs.sortDir === 'asc' ? '▲' : '▼'}</span>`
        : '';
      return `<th data-sort="${column.key}">${label} ${arrow}</th>`;
    })
    .join('');
  return `<thead><tr>${cells}</tr></thead>`;
};

const renderRows = (subset) => {
  const columns = visibleColumns();
  if (!subset.length) {
    return `<tr><td colspan="${columns.length}" class="empty">${escapeHtml(i18n('empty-no-cards'))}</td></tr>`;
  }
  return subset
    .map(
      (card, index) =>
        `<tr>${columns.map((column) => `<td>${column.render(card, index)}</td>`).join('')}</tr>`
    )
    .join('');
};

const renderTable = (subset) =>
  `<table>${renderHead()}<tbody>${renderRows(subset)}</tbody></table>`;

const render = () => {
  const visible = cards.filter(
    (card) => !prefs.hiddenLists.includes(card.idList) && matchesQuery(card)
  );

  if (prefs.groupByList) {
    const shownLists = lists.filter((list) => !prefs.hiddenLists.includes(list.id));
    dom.root.innerHTML = shownLists.length
      ? shownLists
          .map((list) => {
            const subset = sortCards(visible.filter((card) => card.idList === list.id));
            return `
              <section>
                <h2>${escapeHtml(list.name)}<span class="count">${subset.length}</span></h2>
                ${renderTable(subset)}
              </section>`;
          })
          .join('')
      : `<p class="empty">${escapeHtml(i18n('empty-all-lists-hidden'))}</p>`;
  } else {
    dom.root.innerHTML = `<section>${renderTable(sortCards(visible))}</section>`;
  }

  dom.summary.textContent = i18n('summary', { visible: visible.length, total: cards.length });
};

/* ---------- menus ---------- */

const renderColumnsMenu = () => {
  dom.columnsBody.innerHTML = COLUMNS.map(
    (column) => `
      <label>
        <input type="checkbox" data-column="${column.key}" ${prefs.columns.includes(column.key) ? 'checked' : ''} />
        ${escapeHtml(i18n(column.menuKey || column.labelKey))}
      </label>`
  ).join('');
};

const renderListsMenu = () => {
  dom.listsBody.innerHTML = lists
    .map(
      (list) => `
      <label>
        <input type="checkbox" data-list="${escapeHtml(list.id)}" ${prefs.hiddenLists.includes(list.id) ? '' : 'checked'} />
        ${escapeHtml(list.name)}
      </label>`
    )
    .join('');
};

const syncControls = () => {
  dom.groupByList.checked = prefs.groupByList;
  renderColumnsMenu();
  renderListsMenu();
};

/* ---------- preferences ---------- */

// Columns introduced in each preferences version. A stored payload only gains
// the columns that shipped after it was written, so a column the member
// deliberately turned off is never switched back on.
const COLUMNS_ADDED_IN = {
  2: ['rowNumber']
};

const migratePrefs = (stored) => {
  const from = Number(stored.version) || 1;
  if (from >= PREFS_VERSION) return stored;

  const known = new Set(COLUMNS.map((column) => column.key));
  const selected = new Set(
    (stored.columns || DEFAULT_PREFS.columns).filter((key) => known.has(key))
  );

  for (let version = from + 1; version <= PREFS_VERSION; version += 1) {
    (COLUMNS_ADDED_IN[version] || []).forEach((key) => selected.add(key));
  }

  return {
    ...stored,
    version: PREFS_VERSION,
    columns: COLUMNS.map((column) => column.key).filter((key) => selected.has(key))
  };
};

const savePrefs = () => {
  // Preferences are a convenience: a failed write must never break the view.
  t.set('board', 'private', PREFS_KEY, prefs).catch(() => {});
};

const updatePrefs = (patch) => {
  prefs = { ...prefs, ...patch };
  savePrefs();
  render();
};

/* ---------- events ---------- */

dom.search.addEventListener('input', (event) => {
  query = event.target.value.trim().toLowerCase();
  render();
});

dom.groupByList.addEventListener('change', (event) => {
  updatePrefs({ groupByList: event.target.checked });
});

dom.columnsBody.addEventListener('change', (event) => {
  const key = event.target.dataset.column;
  if (!key) return;

  const next = event.target.checked
    ? [...prefs.columns, key]
    : prefs.columns.filter((item) => item !== key);

  if (!next.length) {
    event.target.checked = true;
    return;
  }

  updatePrefs({
    columns: COLUMNS.filter((column) => next.includes(column.key)).map((column) => column.key)
  });
});

dom.listsBody.addEventListener('change', (event) => {
  const id = event.target.dataset.list;
  if (!id) return;

  const hiddenLists = event.target.checked
    ? prefs.hiddenLists.filter((item) => item !== id)
    : [...prefs.hiddenLists, id];

  updatePrefs({ hiddenLists });
});

dom.listsActions.addEventListener('click', (event) => {
  const mode = event.target.dataset.lists;
  if (!mode) return;

  updatePrefs({ hiddenLists: mode === 'none' ? lists.map((list) => list.id) : [] });
  renderListsMenu();
});

dom.root.addEventListener('click', (event) => {
  const header = event.target.closest('th[data-sort]');
  if (!header) return;

  const sortKey = header.dataset.sort;
  const sortDir = prefs.sortKey === sortKey && prefs.sortDir === 'asc' ? 'desc' : 'asc';
  updatePrefs({ sortKey, sortDir });
});

dom.reset.addEventListener('click', () => {
  query = '';
  dom.search.value = '';
  prefs = { ...DEFAULT_PREFS };
  savePrefs();
  syncControls();
  render();
});

/* ---------- theme ---------- */

const applyTheme = (theme) => {
  if (theme) document.documentElement.setAttribute('data-color-mode', theme);
};

const context = t.getContext();
applyTheme(context.theme || context.initialTheme);

if (typeof t.subscribeToThemeChanges === 'function') {
  t.subscribeToThemeChanges(() => applyTheme(t.getContext().theme));
}

/* ---------- boot ---------- */

const loadBoard = () => {
  // Before the data, not after: the toolbar and the "Loading…" line should
  // already be in the member's language while the board is still in flight,
  // and they must be translated on the failure path too.
  localizeStatic();

  return Promise.all([
    t.lists('id', 'name'),
    t.cards('id', 'idShort', 'name', 'idList', 'due', 'dueComplete', 'labels', 'members', 'url'),
    t.get('board', 'private', PREFS_KEY, DEFAULT_PREFS)
  ])
    .then(([loadedLists, loadedCards, loadedPrefs]) => {
      lists = loadedLists;
      cards = loadedCards;
      listNames = new Map(lists.map((list) => [list.id, list.name]));
      // migratePrefs must see the raw stored payload: merging the defaults in
      // first would hand it a current version number and skip the migration.
      prefs = { ...DEFAULT_PREFS, ...migratePrefs(loadedPrefs || {}) };

      syncControls();
      render();
    })
    .catch((error) => {
      dom.root.innerHTML = `<p class="error">${escapeHtml(i18n('load-error', { message: error.message }))}</p>`;
    });
};

// The localizer has to be ready before the first render, and t.render() is
// never called here, so it is initialized by hand.
//
// Guarded the same way subscribeToThemeChanges is above: if util.initLocalizer
// is not there, calling it throws at load time and nothing renders at all.
// Losing the translations is survivable, losing the table is not.
const util = window.TrelloPowerUp.util;
const localizerReady =
  util && typeof util.initLocalizer === 'function'
    ? util.initLocalizer(window.locale || LOCALIZATION.defaultLocale, {
        localization: LOCALIZATION
      })
    : Promise.reject(new Error('localizer unavailable'));

// Both handlers are loadBoard on purpose: failing to load the strings must
// still boot the board. The English text in table.html carries the toolbar.
localizerReady.then(loadBoard, loadBoard);
