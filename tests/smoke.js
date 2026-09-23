const fs = require('fs');
const vm = require('vm');
const path = require('path');

const REPO = path.join(__dirname, '..');
const SOURCE = fs.readFileSync(path.join(REPO, 'table.js'), 'utf8');

const CARDS = [
  { id: 'c1', idShort: 3, name: 'Zeta task', idList: 'l1', due: '2020-01-01T00:00:00Z',
    dueComplete: false, labels: [{ name: 'Urgente', color: 'red_dark' }], members: [{ fullName: 'Javi' }], url: 'https://trello.com/c/1' },
  { id: 'c2', idShort: 1, name: 'Alpha task', idList: 'l1', due: null,
    dueComplete: false, labels: [], members: [], url: 'https://trello.com/c/2' },
  { id: 'c4', idShort: 4, name: 'Mid task', idList: 'l1', due: null,
    dueComplete: false, labels: [], members: [], url: 'https://trello.com/c/4' },
  { id: 'c3', idShort: 2, name: 'Done thing', idList: 'l2', due: '2020-01-01T00:00:00Z',
    dueComplete: true, labels: [{ name: '', color: 'green' }], members: [], url: 'https://trello.com/c/3' }
];

const run = (storedPrefs) =>
  new Promise((resolve) => {
    const makeEl = () => ({
      innerHTML: '', textContent: '', value: '', checked: false,
      dataset: {}, addEventListener() {}
    });
    const els = {};
    const document = {
      _theme: null,
      getElementById: (id) => (els[id] = els[id] || makeEl()),
      querySelector: () => makeEl(),
      documentElement: { setAttribute(k, v) { document._theme = v; } }
    };
    let saved = null;
    const trello = {
      lists: () => Promise.resolve([
        { id: 'l1', name: 'Pendientes' },
        { id: 'l2', name: 'Terminados' }
      ]),
      cards: () => Promise.resolve(CARDS),
      get: (s, v, k, def) => Promise.resolve(storedPrefs || def),
      set: (s, v, k, value) => { saved = value; return Promise.resolve(); },
      getContext: () => ({ theme: 'dark', initialTheme: 'dark' })
    };
    const window = { TrelloPowerUp: { iframe: () => trello } };

    vm.runInNewContext(SOURCE, {
      window, document, console, Promise, Map, Set, Date, Number, String,
      Boolean, Array, Object, JSON
    });

    setTimeout(() => resolve({ html: els.root.innerHTML, els, saved }), 120);
  });

// Row numbers inside the first <section>, in painted order
const rowNumbers = (html) => {
  const firstSection = html.split('<section>')[1] || '';
  return [...firstSection.matchAll(/class="row-number">(\d+)</g)].map((m) => m[1]);
};

const cardOrder = (html) => {
  const firstSection = html.split('<section>')[1] || '';
  return [...firstSection.matchAll(/rel="noopener noreferrer">([^<]+)</g)].map((m) => m[1]);
};

let failed = 0;
const check = (name, cond) => { if (!cond) failed++; console.log((cond ? 'PASS  ' : 'FAIL  ') + name); };

(async () => {
  const asc = await run(null);
  const desc = await run({
    version: 2, groupByList: true,
    columns: ['rowNumber', 'name', 'due', 'labels', 'members'],
    hiddenLists: [], sortKey: 'name', sortDir: 'desc'
  });

  console.log('--- row number column ---');
  check('row number column is in the header', asc.html.includes('<th class="static">N\u00B0</th>'));
  check('row number header is NOT sortable', !asc.html.includes('data-sort="rowNumber"'));
  check('numbers 1,2,3 under ascending sort', rowNumbers(asc.html).join(',') === '1,2,3');
  check('numbers 1,2,3 under descending sort', rowNumbers(desc.html).join(',') === '1,2,3');

  console.log('--- sorting does move the other columns ---');
  const ascOrder = cardOrder(asc.html);
  const descOrder = cardOrder(desc.html);
  check('asc: Alpha, Mid, Zeta', ascOrder.join('|') === 'Alpha task|Mid task|Zeta task');
  check('desc: Zeta, Mid, Alpha', descOrder.join('|') === 'Zeta task|Mid task|Alpha task');
  check('the order actually flipped', ascOrder.join() !== descOrder.join());
  check('same rows, different order', [...ascOrder].sort().join() === [...descOrder].sort().join());

  console.log('--- migration of stored preferences ---');
  const legacy = await run({
    groupByList: true, columns: ['name', 'labels'],
    hiddenLists: [], sortKey: 'name', sortDir: 'asc'
  });
  check('old prefs gain the row number column', legacy.html.includes('row-number'));
  check('keeps a column the member had on (Labels)', legacy.html.includes('>Labels '));
  check('keeps a column the member had off (Due)', !legacy.html.includes('>Due <'));

  console.log('--- regressions ---');
  check('groups by list', asc.html.includes('Pendientes') && asc.html.includes('Terminados'));
  check('label shade red_dark maps to red', asc.html.includes('data-color="red"'));
  check('overdue flagged, completed not', (asc.html.match(/overdue/g) || []).length === 1);
  check('card counter', asc.els.summary.textContent === '4 of 4 cards');

  console.log(failed ? '\n=> ' + failed + ' FAILED' : '\n=> ALL GREEN');
  process.exit(failed ? 1 : 0);
})();
