/* forTechies — client-side event board.
   No framework, no build step. Reads data/events.json, filters in memory,
   and mirrors the active filters into the URL so a view can be shared. */
(function () {
  'use strict';

  var DATA_URL = 'data/events.json';
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  var ALL = [];
  var CITIES = [];          // [{ key, city, region, country, count }]
  var TODAY = isoToday();

  var state = {
    q: '',
    cities: [],             // array of city keys, e.g. "toronto|ontario"
    when: 'upcoming',
    type: '',
    country: '',
    sort: 'date'
  };

  var el = {};
  var highlightIndex = -1;

  /* ---------------------------------------------------------------- utils */

  function $(id) { return document.getElementById(id); }

  function isoToday() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fold(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function cityKey(e) { return fold(e.city) + '|' + fold(e.region); }

  /* Parse an ISO date without letting the browser shift it by timezone. */
  function parseISO(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
    var p = iso.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function fmtDay(iso) {
    var d = parseISO(iso);
    return d ? pad(d.getDate()) : '';
  }
  function fmtMonYear(iso) {
    var d = parseISO(iso);
    return d ? MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear() : '';
  }
  function fmtRange(a, b) {
    var da = parseISO(a);
    if (!da) return '';
    var db = parseISO(b);
    if (!db || b === a) return MONTHS[da.getMonth()] + ' ' + da.getDate() + ', ' + da.getFullYear();
    if (da.getMonth() === db.getMonth() && da.getFullYear() === db.getFullYear()) {
      return MONTHS[da.getMonth()] + ' ' + da.getDate() + '–' + db.getDate() + ', ' + da.getFullYear();
    }
    return MONTHS[da.getMonth()] + ' ' + da.getDate() + ' – ' +
      MONTHS[db.getMonth()] + ' ' + db.getDate() + ', ' + db.getFullYear();
  }

  /* The date this event is filed under: next edition, else last edition. */
  function keyDate(e) { return e.next_date || e.last_date || ''; }

  function highlight(text, needle) {
    var out = esc(text);
    if (!needle) return out;
    var i = fold(out).indexOf(fold(needle));
    if (i < 0) return out;
    return out.slice(0, i) + '<mark>' + out.slice(i, i + needle.length) + '</mark>' + out.slice(i + needle.length);
  }

  /* ------------------------------------------------------------ url state */

  function readURL() {
    var p = new URLSearchParams(location.search);
    if (p.has('q')) state.q = p.get('q');
    if (p.has('when') && ['upcoming', 'past', 'all'].indexOf(p.get('when')) >= 0) state.when = p.get('when');
    if (p.has('type')) state.type = p.get('type');
    if (p.has('country')) state.country = p.get('country');
    if (p.has('sort') && ['date', 'city', 'name'].indexOf(p.get('sort')) >= 0) state.sort = p.get('sort');
    if (p.has('cities')) {
      state.cities = p.get('cities').split(',').map(fold).filter(Boolean);
    }
  }

  function writeURL() {
    var p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.cities.length) p.set('cities', state.cities.join(','));
    if (state.when !== 'upcoming') p.set('when', state.when);
    if (state.type) p.set('type', state.type);
    if (state.country) p.set('country', state.country);
    if (state.sort !== 'date') p.set('sort', state.sort);
    var qs = p.toString();
    history.replaceState(null, '', qs ? '?' + qs : location.pathname);
  }

  /* ------------------------------------------------------------ filtering */

  function matchesQuery(e, needle) {
    if (!needle) return true;
    return e._hay.indexOf(needle) >= 0;
  }

  function inWhen(e) {
    if (state.when === 'all') return true;
    if (state.when === 'upcoming') {
      // A confirmed future date, or an annual event whose next edition is unannounced.
      return e.status === 'upcoming' || e.status === 'recurring-tbd';
    }
    return e.status === 'past' || (!!e.last_date && e.status !== 'upcoming');
  }

  function filtered() {
    var needle = fold(state.q.trim());
    var citySet = state.cities.length ? state.cities : null;

    var out = ALL.filter(function (e) {
      if (citySet && citySet.indexOf(e._citykey) < 0) return false;
      if (state.country && e.country !== state.country) return false;
      if (state.type && e.type !== state.type) return false;
      if (!inWhen(e)) return false;
      if (!matchesQuery(e, needle)) return false;
      return true;
    });

    var dir = state.when === 'past' ? -1 : 1;
    out.sort(function (a, b) {
      if (state.sort === 'name') return a.name.localeCompare(b.name);
      if (state.sort === 'city') {
        var c = a.city.localeCompare(b.city);
        return c !== 0 ? c : cmpDate(a, b, 1);
      }
      return cmpDate(a, b, dir);
    });
    return out;
  }

  /* Undated recurring events always sink to the bottom of a date sort. */
  function cmpDate(a, b, dir) {
    var da = keyDate(a), db = keyDate(b);
    if (!da && !db) return a.name.localeCompare(b.name);
    if (!da) return 1;
    if (!db) return -1;
    if (da === db) return a.name.localeCompare(b.name);
    return da < db ? -dir : dir;
  }

  /* ------------------------------------------------------------ rendering */

  function groupLabel(e) {
    if (state.sort === 'city') return e.city + ', ' + e.region;
    if (state.sort === 'name') return (e.name[0] || '#').toUpperCase();
    var d = parseISO(keyDate(e));
    if (!d) return 'Date not yet announced';
    return MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  function renderRow(e, i) {
    var needle = state.q.trim();
    var dated = !!keyDate(e);
    var when = dated
      ? '<span class="ev__when">' +
        '<span class="ev__d1">' + esc(fmtDay(keyDate(e))) + '</span>' +
        '<span class="ev__d2">' + esc(fmtMonYear(keyDate(e))) + '</span>' +
        '</span>'
      : '<span class="ev__when ev__when--tbd"><span class="ev__d1">TBA</span></span>';

    var tags = ['<span class="ev__tag ev__tag--kind">' + esc(e.type.replace(/-/g, ' ')) + '</span>'];
    if (e.cost === 'free') tags.push('<span class="ev__tag ev__tag--free">free</span>');
    else if (e.cost && e.cost !== 'varies') tags.push('<span class="ev__tag">' + esc(e.cost) + '</span>');
    if (e.attendance) tags.push('<span class="ev__tag">~' + esc(e.attendance) + ' people</span>');
    (e.topics || []).slice(0, 4).forEach(function (t) {
      tags.push('<span class="ev__tag">' + esc(t) + '</span>');
    });

    var dateLine = dated ? fmtRange(keyDate(e), e.next_date ? e.next_date_end : '') : 'date to be announced';
    var aria = e.name + ' — ' + dateLine + ' — ' + e.city + ' — opens the official site in a new tab';

    return '<a class="ev" href="' + esc(e.url) + '" target="_blank" rel="noopener noreferrer"' +
      ' style="animation-delay:' + Math.min(i, 14) * 22 + 'ms" aria-label="' + esc(aria) + '">' +
      when +
      '<div class="ev__main">' +
        '<h2 class="ev__name">' + highlight(e.name, needle) + '</h2>' +
        (e.description ? '<p class="ev__desc">' + highlight(e.description, needle) + '</p>' : '') +
        '<div class="ev__tags">' + tags.join('') + '</div>' +
      '</div>' +
      '<span class="ev__where">' +
        '<span class="ev__city">' + highlight(e.city, needle) + '</span>' +
        '<span class="ev__geo">' + esc(e.region) + (e.country === 'Canada' ? ' · CA' : ' · US') + '</span>' +
        (e.venue ? '<span class="ev__venue">' + esc(e.venue) + '</span>' : '') +
      '</span>' +
      '<span class="ev__go" aria-hidden="true">↗</span>' +
    '</a>';
  }

  function render() {
    var list = filtered();
    var html = [];
    var lastGroup = null;

    list.forEach(function (e, i) {
      var g = groupLabel(e);
      if (g !== lastGroup) {
        html.push('<h3 class="groupbar"><span>' + esc(g) + '</span></h3>');
        lastGroup = g;
      }
      html.push(renderRow(e, i));
    });

    el.board.innerHTML = html.join('');
    el.board.setAttribute('aria-busy', 'false');
    el.empty.hidden = list.length > 0;

    var scope = state.cities.length
      ? state.cities.length + (state.cities.length === 1 ? ' city' : ' cities')
      : 'all cities';
    el.count.innerHTML = '<b>' + list.length + '</b> ' +
      (list.length === 1 ? 'event' : 'events') + ' &middot; ' + esc(scope) + ' &middot; ' + esc(state.when);

    renderChips();
    writeURL();
  }

  function renderChips() {
    if (!state.cities.length) { el.chips.hidden = true; el.chips.innerHTML = ''; el.clearCities.hidden = true; return; }
    el.chips.hidden = false;
    el.clearCities.hidden = false;
    el.chips.innerHTML = state.cities.map(function (k) {
      var c = CITIES.find(function (x) { return x.key === k; });
      var label = c ? c.city + ', ' + c.region : k.split('|')[0];
      return '<span class="chip">' + esc(label) +
        '<button type="button" data-remove="' + esc(k) + '" aria-label="Remove ' + esc(label) + '">×</button></span>';
    }).join('');
  }

  /* ------------------------------------------------------- city typeahead */

  function citySuggestions() {
    var needle = fold(el.cityq.value.trim());
    return CITIES
      .filter(function (c) {
        if (state.cities.indexOf(c.key) >= 0) return false;
        if (!needle) return true;
        return fold(c.city).indexOf(needle) >= 0 || fold(c.region).indexOf(needle) >= 0;
      })
      .slice(0, 60);
  }

  function openCityList() {
    var items = citySuggestions();
    highlightIndex = -1;
    if (!items.length) {
      el.citylist.innerHTML = '<li class="citylist__none">no matching city</li>';
    } else {
      el.citylist.innerHTML = items.map(function (c, i) {
        return '<li role="option" aria-selected="false" data-key="' + esc(c.key) + '" data-i="' + i + '">' +
          '<span>' + esc(c.city) + '</span><small>' + esc(c.region) + ' · ' + c.count + '</small></li>';
      }).join('');
    }
    el.citylist.hidden = false;
    el.cityq.setAttribute('aria-expanded', 'true');
  }

  function closeCityList() {
    el.citylist.hidden = true;
    el.cityq.setAttribute('aria-expanded', 'false');
    highlightIndex = -1;
  }

  function moveHighlight(delta) {
    var opts = el.citylist.querySelectorAll('li[data-key]');
    if (!opts.length) return;
    highlightIndex = (highlightIndex + delta + opts.length) % opts.length;
    for (var i = 0; i < opts.length; i++) {
      opts[i].setAttribute('aria-selected', i === highlightIndex ? 'true' : 'false');
    }
    opts[highlightIndex].scrollIntoView({ block: 'nearest' });
  }

  function addCity(key) {
    if (!key || state.cities.indexOf(key) >= 0) return;
    state.cities.push(key);
    el.cityq.value = '';
    closeCityList();
    render();
  }

  /* ------------------------------------------------------------- wiring   */

  function bind() {
    var t;
    el.q.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () { state.q = el.q.value; render(); }, 110);
    });

    el.cityq.addEventListener('focus', openCityList);
    el.cityq.addEventListener('input', openCityList);
    el.cityq.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowDown') { ev.preventDefault(); if (el.citylist.hidden) openCityList(); else moveHighlight(1); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); moveHighlight(-1); }
      else if (ev.key === 'Enter') {
        ev.preventDefault();
        var opts = el.citylist.querySelectorAll('li[data-key]');
        var pick = highlightIndex >= 0 ? opts[highlightIndex] : opts[0];
        if (pick) addCity(pick.getAttribute('data-key'));
      } else if (ev.key === 'Escape') { closeCityList(); }
      else if (ev.key === 'Backspace' && !el.cityq.value && state.cities.length) {
        state.cities.pop(); render();
      }
    });

    el.citylist.addEventListener('mousedown', function (ev) {
      var li = ev.target.closest('li[data-key]');
      if (!li) return;
      ev.preventDefault();
      addCity(li.getAttribute('data-key'));
    });

    document.addEventListener('click', function (ev) {
      if (!ev.target.closest('.field--city')) closeCityList();
    });

    el.chips.addEventListener('click', function (ev) {
      var btn = ev.target.closest('button[data-remove]');
      if (!btn) return;
      var k = btn.getAttribute('data-remove');
      state.cities = state.cities.filter(function (x) { return x !== k; });
      render();
    });

    el.clearCities.addEventListener('click', function () { state.cities = []; render(); });

    document.querySelectorAll('.segmented button').forEach(function (b) {
      b.addEventListener('click', function () {
        state.when = b.getAttribute('data-when');
        document.querySelectorAll('.segmented button').forEach(function (x) {
          var on = x === b;
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        render();
      });
    });

    el.type.addEventListener('change', function () { state.type = el.type.value; render(); });
    el.country.addEventListener('change', function () { state.country = el.country.value; render(); });
    el.sort.addEventListener('change', function () { state.sort = el.sort.value; render(); });

    el.empty.addEventListener('click', function (ev) {
      if (!ev.target.matches('[data-reset]')) return;
      state.q = ''; state.cities = []; state.when = 'all'; state.type = ''; state.country = '';
      syncControls();
      render();
    });
  }

  function syncControls() {
    el.q.value = state.q;
    el.type.value = state.type;
    el.country.value = state.country;
    el.sort.value = state.sort;
    document.querySelectorAll('.segmented button').forEach(function (x) {
      var on = x.getAttribute('data-when') === state.when;
      x.classList.toggle('is-on', on);
      x.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }

  /* --------------------------------------------------------------- boot   */

  function buildIndexes() {
    var cityMap = Object.create(null);
    var types = Object.create(null);

    ALL.forEach(function (e) {
      e._citykey = cityKey(e);
      e._hay = fold([
        e.name, e.description, e.city, e.region, e.country, e.venue,
        e.type, e.audience, (e.topics || []).join(' ')
      ].join(' · '));

      if (!cityMap[e._citykey]) {
        cityMap[e._citykey] = { key: e._citykey, city: e.city, region: e.region, country: e.country, count: 0 };
      }
      cityMap[e._citykey].count++;
      types[e.type] = (types[e.type] || 0) + 1;
    });

    CITIES = Object.keys(cityMap).map(function (k) { return cityMap[k]; })
      .sort(function (a, b) { return b.count - a.count || a.city.localeCompare(b.city); });

    var typeOpts = Object.keys(types).sort(function (a, b) { return types[b] - types[a]; });
    el.type.innerHTML = '<option value="">every kind</option>' + typeOpts.map(function (t) {
      return '<option value="' + esc(t) + '">' + esc(t.replace(/-/g, ' ')) + ' (' + types[t] + ')</option>';
    }).join('');
  }

  function renderTally(meta) {
    var upcoming = ALL.filter(function (e) { return e.status === 'upcoming'; }).length;
    var tbd = ALL.filter(function (e) { return e.status === 'recurring-tbd'; }).length;
    var rows = [
      ['Events tracked', ALL.length, ''],
      ['Cities', CITIES.length, ''],
      ['Dated & upcoming', upcoming, ''],
      ['Annual, date TBA', tbd, ''],
      ['Countries', 2, 'US / CA']
    ];
    el.tally.innerHTML = rows.map(function (r) {
      return '<div><dt>' + esc(r[0]) + '</dt><dd>' + r[1] +
        (r[2] ? '<span class="u">' + esc(r[2]) + '</span>' : '') + '</dd></div>';
    }).join('');
    $('stamp').textContent = 'DATA ' + (meta.generated_on || TODAY);
    $('footmeta').textContent = 'Dataset generated ' + (meta.generated_on || TODAY) +
      ' · ' + ALL.length + ' events · ' + CITIES.length + ' cities';
  }

  function fail(msg) {
    el.board.innerHTML = '<p class="board__loading">' + esc(msg) + '</p>';
    el.board.setAttribute('aria-busy', 'false');
  }

  function init() {
    ['q', 'cityq', 'citylist', 'clearCities', 'chips', 'type', 'country', 'sort',
      'board', 'empty', 'count', 'tally'].forEach(function (id) { el[id] = $(id); });

    readURL();
    syncControls();

    fetch(DATA_URL, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (payload) {
        ALL = payload.events || [];
        if (!ALL.length) return fail('The dataset is empty. Run `npm run build:data` to generate it.');
        buildIndexes();
        renderTally(payload);
        bind();
        render();
      })
      .catch(function (err) {
        fail('Could not load ' + DATA_URL + ' (' + err.message + '). ' +
          'If you opened this file directly, serve the folder instead: `npx serve .` or `python -m http.server`.');
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
