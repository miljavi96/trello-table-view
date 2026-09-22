const t = window.TrelloPowerUp.iframe();

const PREFS_KEY = 'tableViewPrefs';

const DEFAULT_PREFS = {
  groupByList: true,
  columns: ['name', 'due', 'labels', 'members'],
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

/* ---------- columns ---------- */

const COLUMNS = [
  {
    key: 'idShort',
    label: '#',
    menuLabel: 'Card number',
    sortValue: (card) => card.idShort,
    render: (card) => `<span class="muted">${escapeHtml(card.idShort)}</span>`
  },
  {
    key: 'name',
    label: 'Card',
    sortValue: (card) => card.name.toLowerCase(),
    render: (card) =>
      `<a href="${escapeHtml(card.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(card.name)}</a>`
  },
  {
    key: 'list',
    label: 'List',
    sortValue: (card) => listNameOf(card).toLowerCase(),
    render: (card) => escapeHtml(listNameOf(card))
  },
  {
    key: 'due',
    label: 'Due',
    sortValue: (card) => (card.due ? new Date(card.due).getTime() : Number.POSITIVE_INFINITY),
    render: (card) => {
      if (!card.due) return '<span class="muted">&mdash;</span>';
      const text = escapeHtml(new Date(card.due).toLocaleDateString());
      return isOverdue(card) ? `<span class="overdue">${text}</span>` : text;
    }
  },
  {
    key: 'labels',
    label: 'Labels',
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
    label: 'Members',
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
  const column = columnByKey.get(prefs.sortKey) || columnByKey.get('name');
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
      const active = prefs.sortKey === column.key;
      const arrow = active
        ? `<span class="arrow">${prefs.sortDir === 'asc' ? '▲' : '▼'}</span>`
        : '';
      return `<th data-sort="${column.key}">${escapeHtml(column.label)} ${arrow}</th>`;
    })
    .join('');
  return `<thead><tr>${cells}</tr></thead>`;
};

const renderRows = (subset) => {
  const columns = visibleColumns();
  if (!subset.length) {
    return `<tr><td colspan="${columns.length}" class="empty">No cards</td></tr>`;
  }
  return subset
    .map(
      (card) =>
        `<tr>${columns.map((column) => `<td>${column.render(card)}</td>`).join('')}</tr>`
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
      : '<p class="empty">Every list is hidden. Use the Lists menu to bring some back.</p>';
  } else {
    dom.root.innerHTML = `<section>${renderTable(sortCards(visible))}</section>`;
  }

  dom.summary.textContent = `${visible.length} of ${cards.length} cards`;
};

/* ---------- menus ---------- */

const renderColumnsMenu = () => {
  dom.columnsBody.innerHTML = COLUMNS.map(
    (column) => `
      <label>
        <input type="checkbox" data-column="${column.key}" ${prefs.columns.includes(column.key) ? 'checked' : ''} />
        ${escapeHtml(column.menuLabel || column.label)}
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

Promise.all([
  t.lists('id', 'name'),
  t.cards('id', 'idShort', 'name', 'idList', 'due', 'dueComplete', 'labels', 'members', 'url'),
  t.get('board', 'private', PREFS_KEY, DEFAULT_PREFS)
])
  .then(([loadedLists, loadedCards, loadedPrefs]) => {
    lists = loadedLists;
    cards = loadedCards;
    listNames = new Map(lists.map((list) => [list.id, list.name]));
    prefs = { ...DEFAULT_PREFS, ...loadedPrefs };

    syncControls();
    render();
  })
  .catch((error) => {
    dom.root.innerHTML = `<p class="error">Could not load board data: ${escapeHtml(error.message)}</p>`;
  });
