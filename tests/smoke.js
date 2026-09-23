const fs = require('fs');
const vm = require('vm');
const path = require('path');

const REPO = path.join(__dirname, '..');
const SOURCE = fs.readFileSync(path.join(REPO, 'table.js'), 'utf8');

// The real strings files, not fixtures. A key table.js asks for that is
// missing from a locale is recorded and fails the run, so a forgotten
// translation cannot reach the directory.
const readStrings = (locale) =>
  JSON.parse(fs.readFileSync(path.join(REPO, 'strings', locale + '.json'), 'utf8'));

const STRINGS = { en: readStrings('en'), es: readStrings('es') };
const missingKeys = [];

const makeLocalize = (locale) => (key, data) => {
  const table = STRINGS[locale];
  if (!Object.prototype.hasOwnProperty.call(table, key)) {
    missingKeys.push(locale + ':' + key);
    return '!!' + key + '!!';
  }
  return String(table[key]).replace(/\{(\w+)\}/g, (match, name) =>
    data && name in data ? data[name] : match
  );
};

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

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// options.noLocalizer reproduces a Power-Up whose strings never loaded: no
// TrelloPowerUp.util at all, and a localizeKey that throws.
const run = (storedPrefs, locale, options) =>
  new Promise((resolve) => {
    const chosen = locale || 'en';
    const opts = options || {};

    const makeEl = () => ({
      innerHTML: '', textContent: '', value: '', checked: false,
      dataset: {}, attributes: {},
      _listeners: {},
      addEventListener(type, fn) {
        (this._listeners[type] = this._listeners[type] || []).push(fn);
      },
      setAttribute(key, value) { this.attributes[key] = value; },
      fire(type, event) { (this._listeners[type] || []).forEach((fn) => fn(event)); }
    });

    const els = {};

    // Mirrors the data-i18n nodes in table.html so the static pass is exercised.
    const staticNodes = [
      { dataset: { i18n: 'menu-columns' }, textContent: 'Columns' },
      { dataset: { i18n: 'menu-lists' }, textContent: 'Lists' },
      { dataset: { i18n: 'lists-all' }, textContent: 'All' },
      { dataset: { i18n: 'lists-none' }, textContent: 'None' },
      { dataset: { i18n: 'group-by-list' }, textContent: 'Group by list' },
      { dataset: { i18n: 'reset' }, textContent: 'Reset' },
      { dataset: { i18n: 'loading' }, textContent: 'Loading…' }
    ];
    const placeholderNodes = [
      {
        dataset: { i18nPlaceholder: 'filter-placeholder' },
        attributes: {},
        setAttribute(key, value) { this.attributes[key] = value; }
      }
    ];

    const document = {
      _theme: null,
      getElementById: (id) => (els[id] = els[id] || makeEl()),
      querySelector: () => makeEl(),
      querySelectorAll: (selector) => {
        if (selector === '[data-i18n]') return staticNodes;
        if (selector === '[data-i18n-placeholder]') return placeholderNodes;
        return [];
      },
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
      getContext: () => ({ theme: 'dark', initialTheme: 'dark' }),
      localizeKey: opts.noLocalizer
        ? () => { throw new Error('localizer unavailable'); }
        : makeLocalize(chosen)
    };

    const window = {
      locale: chosen,
      TrelloPowerUp: {
        iframe: () => trello,
        util: opts.noLocalizer ? undefined : { initLocalizer: () => Promise.resolve() }
      }
    };

    vm.runInNewContext(SOURCE, {
      window, document, console, Promise, Map, Set, Date, Number, String,
      Boolean, Array, Object, JSON, setTimeout, clearTimeout
    });

    setTimeout(
      () => resolve({ html: els.root.innerHTML, els, staticNodes, placeholderNodes, saved }),
      120
    );
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
  check('row number column is in the header', asc.html.includes('<th class="static">N°</th>'));
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

  console.log('--- localization ---');
  const enKeys = Object.keys(STRINGS.en).sort();
  const esKeys = Object.keys(STRINGS.es).sort();
  check('en and es define exactly the same keys', enKeys.join() === esKeys.join());

  const es = await run(null, 'es');
  check('spanish column header', es.html.includes('>Tarjeta '));
  check('spanish summary line', es.els.summary.textContent === '4 de 4 tarjetas');
  check('spanish toolbar text', es.staticNodes.some((n) => n.textContent === 'Columnas'));
  check(
    'spanish search placeholder',
    es.placeholderNodes[0].attributes.placeholder === 'Filtrar tarjetas…'
  );
  check('english is still the default', asc.staticNodes.some((n) => n.textContent === 'Columns'));
  check(
    'row number header is shared, not mistranslated',
    es.html.includes('<th class="static">N°</th>')
  );

  console.log('--- survives a dead localizer ---');
  const dead = await run(null, 'es', { noLocalizer: true });
  check('the board still renders', dead.html.includes('Zeta task'));
  check('grouping still works', dead.html.includes('Pendientes'));
  check(
    'the english fallback in table.html is NOT clobbered with raw keys',
    dead.staticNodes.every((node) => !node.textContent.startsWith(node.dataset.i18n))
  );
  check(
    'Columns still reads "Columns", not "menu-columns"',
    dead.staticNodes.find((node) => node.dataset.i18n === 'menu-columns').textContent === 'Columns'
  );
  check(
    'the placeholder is left to the markup',
    dead.placeholderNodes[0].attributes.placeholder === undefined
  );

  console.log('--- search debounce ---');
  const typed = await run(null);
  const before = typed.els.root.innerHTML;
  typed.els.search.fire('input', { target: { value: 'Zeta' } });
  check('does not repaint on the keystroke itself', typed.els.root.innerHTML === before);

  await wait(250);
  const after = typed.els.root.innerHTML;
  check('repaints once the typing settles', after !== before);
  check('filter actually applied', after.includes('Zeta task') && !after.includes('Alpha task'));
  check('counter reflects the filter', typed.els.summary.textContent === '1 of 4 cards');

  const burst = await run(null);
  const baseline = burst.els.root.innerHTML;
  ['Z', 'Ze', 'Zet', 'Zeta'].forEach((value) =>
    burst.els.search.fire('input', { target: { value } })
  );
  check('a burst of keystrokes repaints nothing yet', burst.els.root.innerHTML === baseline);
  await wait(250);
  check('the burst collapses into one repaint', burst.els.summary.textContent === '1 of 4 cards');

  // Last on purpose: every locale above has now been rendered, so this sees
  // the keys all of them actually asked for. Run it earlier and it only ever
  // checks whichever locale happened to have run by then.
  console.log('--- translation coverage ---');
  check(
    'no key requested by table.js is missing from any locale',
    missingKeys.length === 0 || console.log('       missing: ' + missingKeys.join(', '))
  );

  console.log(failed ? '\n=> ' + failed + ' FAILED' : '\n=> ALL GREEN');
  process.exit(failed ? 1 : 0);
})();
