/* connectWithTechies — client-side event board.
   No framework, no build step. Reads data/events.json, filters in memory,
   and mirrors the active filters into the URL so a view can be shared. */
(function () {
  'use strict';

  var DATA_URL = 'data/events.json';
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  var ALL = [];
  var REGIONS = {};         // region name -> { name, country, count }
  var CITIES = [];          // [{ key, city, region, country, count }]
  var TODAY = isoToday();

  var state = {
    q: '',
    cities: [],             // array of city keys, e.g. "toronto|ontario"
    when: 'upcoming',
    type: '',
    country: '',
    region: '',
    sort: 'date',
    view: 'list',           // list | calendar
    month: '',              // calendar month shown, YYYY-MM
    day: ''                 // calendar day opened, YYYY-MM-DD
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

  /* The date an event is filed under depends on which way you are looking.
     Browsing Past, an annual event should show the edition that actually
     happened, even when a future one is already scheduled. Everywhere else
     the next edition leads, falling back to the last one held. */
  function keyDate(e) {
    if (e._occurrence) return e.next_date;   // a calendar day's own occurrence
    if (state.when === 'past') return e.last_date || (isPastISO(e.next_date) ? e.next_date : '');
    if (state.when === 'upcoming') return e.next_date;   // never advertise a held date as upcoming
    return e.next_date || e.last_date || '';
  }

  function keyDateEnd(e) {
    return keyDate(e) === e.next_date ? e.next_date_end : '';
  }

  function isPastISO(iso) { return !!iso && iso < TODAY; }

  /* An annual event with no announced date still tells you when it usually
     runs, which is the useful thing when you are planning a year. */
  function monthHint(e) {
    var m = String(e.month || '').trim();
    if (!m || /^varies$/i.test(m)) return 'TBA';
    return m.length > 9 ? m.slice(0, 8) + '.' : m;
  }

  /* Index of the first month named in the `month` field, so undated annual
     events can still be ordered and grouped across the year. 99 = unknown. */
  function monthIndex(e) {
    var m = fold(e.month);
    for (var i = 0; i < MONTHS.length; i++) {
      if (m.indexOf(MONTHS[i].toLowerCase().slice(0, 3)) >= 0) return i;
    }
    return 99;
  }

  /* Match on the raw string and escape each fragment separately. Searching the
     escaped string instead would let a needle land inside an entity like
     "&amp;" and split it, producing broken markup. */
  function highlight(text, needle) {
    var raw = String(text == null ? '' : text);
    if (!needle) return esc(raw);
    var i = fold(raw).indexOf(fold(needle));
    if (i < 0) return esc(raw);
    return esc(raw.slice(0, i)) +
      '<mark>' + esc(raw.slice(i, i + needle.length)) + '</mark>' +
      esc(raw.slice(i + needle.length));
  }

  /* ------------------------------------------------------------ url state */

  function readURL() {
    var p = new URLSearchParams(location.search);
    if (p.has('q')) state.q = p.get('q');
    if (p.has('when') && ['upcoming', 'past', 'all'].indexOf(p.get('when')) >= 0) state.when = p.get('when');
    if (p.has('type')) state.type = p.get('type');
    if (p.has('country')) state.country = p.get('country');
    if (p.has('region')) state.region = p.get('region');
    if (p.get('view') === 'calendar') state.view = 'calendar';
    if (/^\d{4}-\d{2}$/.test(p.get('month') || '')) state.month = p.get('month');
    if (/^\d{4}-\d{2}-\d{2}$/.test(p.get('day') || '')) state.day = p.get('day');
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
    if (state.region) p.set('region', state.region);
    if (state.sort !== 'date') p.set('sort', state.sort);
    if (state.view === 'calendar') {
      p.set('view', 'calendar');
      if (state.month) p.set('month', state.month);
      if (state.day) p.set('day', state.day);
    }
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
    // Past = any edition that has actually been held. An annual event with a
    // future date still belongs here for the edition that already happened.
    return !!e.last_date || e.status === 'past' || isPastISO(e.next_date);
  }

  function filtered() {
    var needle = fold(state.q.trim());
    var citySet = state.cities.length ? state.cities : null;

    var out = ALL.filter(function (e) {
      if (citySet && citySet.indexOf(e._citykey) < 0) return false;
      if (state.country && e.country !== state.country) return false;
      if (state.region && e.region !== state.region) return false;
      if (state.type && e.type !== state.type) return false;
      if (!inWhen(e)) return false;
      if (!matchesQuery(e, needle)) return false;
      return true;
    });

    var dir = state.when === 'past' ? -1 : 1;
    out.sort(function (a, b) {
      if (state.sort === 'name') return a.name.localeCompare(b.name);
      if (state.sort === 'city') {
        // Region breaks the tie, so Bloomington IN and Bloomington MN stay
        // as two contiguous groups rather than interleaving.
        var c = a.city.localeCompare(b.city) || a.region.localeCompare(b.region);
        return c !== 0 ? c : cmpDate(a, b, 1);
      }
      return cmpDate(a, b, dir);
    });
    return out;
  }

  /* Dated events lead, in date order. Undated annual events follow, ordered by
     the month they usually run in — which is the thing you actually want when
     planning a year around events whose next date is not announced yet. */
  function cmpDate(a, b, dir) {
    var da = keyDate(a), db = keyDate(b);
    if (!da && !db) return (monthIndex(a) - monthIndex(b)) || a.name.localeCompare(b.name);
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
    if (d) return MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    var mi = monthIndex(e);
    return mi < 12 ? 'Usually ' + MONTHS[mi] + ' — date not yet announced'
                   : 'Date not yet announced';
  }

  function renderRow(e, i) {
    var needle = state.q.trim();
    var dated = !!keyDate(e);
    var when = dated
      ? '<span class="ev__when">' +
        '<span class="ev__d1">' + esc(fmtDay(keyDate(e))) + '</span>' +
        '<span class="ev__d2">' + esc(fmtMonYear(keyDate(e))) + '</span>' +
        '</span>'
      : '<span class="ev__when ev__when--tbd">' +
        '<span class="ev__d1">' + esc(monthHint(e)) + '</span>' +
        '<span class="ev__d2">' + esc(e.cadence || 'date tba') + '</span>' +
        '</span>';

    var tags = ['<span class="ev__tag ev__tag--kind">' + esc(e.type.replace(/-/g, ' ')) + '</span>'];
    if (e.cost === 'free') tags.push('<span class="ev__tag ev__tag--free">free</span>');
    else if (e.cost && e.cost !== 'varies') tags.push('<span class="ev__tag">' + esc(e.cost) + '</span>');
    if (e.attendance) tags.push('<span class="ev__tag">~' + esc(e.attendance) + ' people</span>');
    (e.topics || []).slice(0, 4).forEach(function (t) {
      tags.push('<span class="ev__tag">' + esc(t) + '</span>');
    });

    var mi = monthIndex(e);
    var dateLine = dated ? fmtRange(keyDate(e), keyDateEnd(e))
      : mi < 12 ? 'usually ' + MONTHS[mi] + ', next date not yet announced'
      : 'date not yet announced';
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

  /* ------------------------------------------------------ add to calendar */

  /* Only a confirmed date that has not passed can go in someone's calendar.
     Dates here are whole days (organisers rarely publish times in a form we
     keep), so every calendar entry is all-day, with the end exclusive. */
  function calDates(e) {
    if (!e.next_date) return null;
    var end = e.next_date_end && e.next_date_end > e.next_date ? e.next_date_end : e.next_date;
    if (isPastISO(end)) return null;
    var after = parseISO(end);
    after.setDate(after.getDate() + 1);
    var endEx = after.getFullYear() + '-' + pad(after.getMonth() + 1) + '-' + pad(after.getDate());
    return { start: e.next_date, endEx: endEx };
  }

  function calText(e) {
    return (e.description ? e.description + '\n\n' : '') + 'Official page: ' + e.url +
      '\nFound on connectWithTechies — confirm details with the organiser before you go.';
  }
  function calPlace(e) {
    return [e.venue, e.city, e.region, e.country].filter(Boolean).join(', ');
  }

  function icsEscape(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }

  /* An RFC 5545 file: what Apple Calendar, Thunderbird and most desktop
     calendars import, and the fallback for anything not listed. */
  function icsFile(e, d) {
    var compact = function (iso) { return iso.replace(/-/g, ''); };
    var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    return [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//connectWithTechies//EN', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:' + compact(d.start) + '-' + fold(e.name).replace(/[^a-z0-9]+/g, '-').slice(0, 40) + '@connectwithtechies',
      'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + compact(d.start),
      'DTEND;VALUE=DATE:' + compact(d.endEx),
      'SUMMARY:' + icsEscape(e.name),
      'DESCRIPTION:' + icsEscape(calText(e)),
      'LOCATION:' + icsEscape(calPlace(e)),
      'URL:' + e.url,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
  }

  function calLinks(e) {
    var d = calDates(e);
    if (!d) return [];
    var q = function (o) {
      return Object.keys(o).map(function (k) { return k + '=' + encodeURIComponent(o[k]); }).join('&');
    };
    var compact = function (iso) { return iso.replace(/-/g, ''); };
    var outlook = {
      path: '/calendar/action/compose', rru: 'addevent', allday: 'true',
      startdt: d.start, enddt: d.endEx, subject: e.name, body: calText(e), location: calPlace(e)
    };
    return [
      { label: 'Google Calendar', href: 'https://calendar.google.com/calendar/render?' + q({
        action: 'TEMPLATE', text: e.name, dates: compact(d.start) + '/' + compact(d.endEx),
        details: calText(e), location: calPlace(e) }) },
      { label: 'Outlook.com', href: 'https://outlook.live.com/calendar/0/deeplink/compose?' + q(outlook) },
      { label: 'Outlook / Microsoft 365', href: 'https://outlook.office.com/calendar/0/deeplink/compose?' + q(outlook) },
      { label: 'Yahoo Calendar', href: 'https://calendar.yahoo.com/?' + q({
        v: '60', title: e.name, st: compact(d.start), et: compact(d.endEx), dur: 'allday',
        desc: calText(e), in_loc: calPlace(e) }) },
      { label: 'Apple Calendar / other (.ics)', ics: true,
        href: 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icsFile(e, d)),
        download: fold(e.name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) + '.ics' }
    ];
  }

  /* The menu is a <details>, so it opens without script; its links are built
     on first open, so four thousand rows do not each carry five URLs. */
  function calMenu(e, ref) {
    // Only when the row shows the date that would go in the calendar: under
    // Past, an annual event shows the edition already held, not the next one.
    if (!calDates(e) || keyDate(e) !== e.next_date) return '';
    return '<details class="addcal" data-ref="' + ref + '">' +
      '<summary aria-label="Add ' + esc(e.name) + ' to your calendar">+ Calendar</summary>' +
      '<div class="addcal__menu" role="menu"></div>' +
    '</details>';
  }

  function fillCalMenu(details) {
    var menu = details.querySelector('.addcal__menu');
    if (menu.childElementCount) return;
    var e = SHOWN[+details.getAttribute('data-ref')];
    if (!e) return;
    menu.innerHTML = calLinks(e).map(function (l) {
      return '<a role="menuitem" href="' + esc(l.href) + '"' +
        (l.ics ? ' download="' + esc(l.download) + '"' : ' target="_blank" rel="noopener noreferrer"') +
        '>' + esc(l.label) + '</a>';
    }).join('');
  }

  /* Every event currently on screen, so a menu can find its event by index. */
  var SHOWN = [];

  function rowWithCal(e, i) {
    var ref = SHOWN.push(e) - 1;
    return '<div class="evrow">' + renderRow(e, i) + calMenu(e, ref) + '</div>';
  }

  /* ------------------------------------------------------------ calendar */

  function isoOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  /* Every day an event is on the calendar for: its next edition (each day of
     it, unless it is a long programme, which shows on its first day only),
     the edition last held, and each upcoming session of a recurring series. */
  var LONG_SPAN_DAYS = 7;
  function eventDays(e) {
    var days = [];
    if (e.next_date) {
      var a = parseISO(e.next_date), b = parseISO(e.next_date_end) || a;
      var span = Math.round((b - a) / 86400000);
      if (span < 0 || span > LONG_SPAN_DAYS) days.push(e.next_date);
      else for (var d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) days.push(isoOf(d));
    }
    if (e.last_date && e.last_date !== e.next_date) days.push(e.last_date);
    (e.feed_dates || []).forEach(function (x) { if (days.indexOf(x) < 0) days.push(x); });
    return days;
  }

  /* The edition of an event that a calendar day stands for: the next edition
     if the day falls inside it, the edition last held, or one session of a
     series. Returned as a view of the event dated to that occurrence, so the
     day list shows the day you clicked and adds that day to a calendar. */
  function occurrenceOn(e, iso) {
    var o = Object.create(e);
    o._occurrence = true;
    var end = e.next_date_end || e.next_date;
    if (e.next_date && e.next_date <= iso && iso <= end) return o;   // inside the next edition
    o.next_date = iso;
    o.next_date_end = '';
    return o;
  }

  /* All filters apply except When: the calendar is itself the time axis. */
  function calendarEvents() {
    var saved = state.when;
    state.when = 'all';
    var list = filtered();
    state.when = saved;
    return list;
  }

  var WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var CHIPS_PER_DAY = 3;

  /* A day cell has room for three names, so the ones worth travelling for
     lead; within a kind, alphabetical, ignoring leading quotes and emoji. */
  var KIND_RANK = ['hackathon', 'conference', 'summit', 'tech-week', 'startup-week', 'expo',
    'demo-day', 'ctf', 'game-jam', 'unconference', 'festival', 'career-fair', 'workshop'];
  function kindRank(e) { var i = KIND_RANK.indexOf(e.type); return i < 0 ? KIND_RANK.length : i; }
  function bareName(e) { return fold(e.name).replace(/^[^a-z0-9]+/, ''); }
  function cmpForDay(a, b) { return kindRank(a) - kindRank(b) || bareName(a).localeCompare(bareName(b)); }

  /* The same title in three cities is one line on the grid; the day panel
     still lists every one. */
  function chipsFor(evs) {
    var seen = Object.create(null), out = [];
    for (var i = 0; i < evs.length && out.length < CHIPS_PER_DAY; i++) {
      var k = bareName(evs[i]);
      if (!seen[k]) { seen[k] = 1; out.push(evs[i]); }
    }
    return out;
  }

  function renderCalendar() {
    // Arriving with no month (a plain ?view=calendar link): this month, today open.
    if (!state.month) { state.month = TODAY.slice(0, 7); state.day = state.day || TODAY; }
    var y = +state.month.slice(0, 4), m = +state.month.slice(5, 7) - 1;
    var first = new Date(y, m, 1);
    var gridStart = new Date(y, m, 1 - first.getDay());          // weeks start on Sunday
    var weeks = Math.ceil((first.getDay() + new Date(y, m + 1, 0).getDate()) / 7);
    var gridEnd = new Date(gridStart); gridEnd.setDate(gridStart.getDate() + weeks * 7 - 1);
    var lo = isoOf(gridStart), hi = isoOf(gridEnd);

    var byDay = Object.create(null);
    var inMonth = 0;
    calendarEvents().forEach(function (e) {
      var counted = false;
      eventDays(e).forEach(function (d) {
        if (d < lo || d > hi) return;
        (byDay[d] = byDay[d] || []).push(e);
        if (!counted && d.slice(0, 7) === state.month) { inMonth++; counted = true; }
      });
    });
    Object.keys(byDay).forEach(function (d) { byDay[d].sort(cmpForDay); });

    if (state.day && state.day.slice(0, 7) !== state.month) state.day = '';
    if (!state.day && state.month === TODAY.slice(0, 7)) state.day = TODAY;
    SHOWN = [];

    var monthName = MONTHS[m] + ' ' + y;
    var html = ['<div class="cal__head">',
      '<button type="button" class="cal__nav" data-month="-1" aria-label="Previous month">‹</button>',
      '<h2 class="cal__title">' + esc(monthName) + '</h2>',
      '<button type="button" class="cal__nav" data-month="1" aria-label="Next month">›</button>',
      '<button type="button" class="cal__today linky" data-month="0">today</button>',
      '</div>',
      '<div class="cal__grid" aria-label="' + esc(monthName) + '">'];
    WEEKDAYS.forEach(function (w) { html.push('<div class="cal__wd" aria-hidden="true">' + w + '</div>'); });

    for (var i = 0; i < weeks * 7; i++) {
      var d = new Date(gridStart); d.setDate(gridStart.getDate() + i);
      var iso = isoOf(d);
      var evs = byDay[iso] || [];
      var cls = ['cal__day'];
      if (iso.slice(0, 7) !== state.month) cls.push('is-out');
      if (iso === TODAY) cls.push('is-today');
      if (iso < TODAY) cls.push('is-past');
      if (iso === state.day) cls.push('is-sel');
      if (evs.length) cls.push('has-ev');
      var label = d.getDate() + ' ' + MONTHS[d.getMonth()] + ', ' + evs.length + (evs.length === 1 ? ' event' : ' events');
      var chips = chipsFor(evs);
      html.push('<button type="button" class="' + cls.join(' ') + '" data-day="' + iso + '"' +
        ' aria-pressed="' + (iso === state.day) + '" aria-label="' + esc(WEEKDAYS[d.getDay()] + ' ' + label) + '">' +
        '<span class="cal__num">' + d.getDate() +
          (evs.length ? '<span class="cal__count">' + evs.length + '</span>' : '') + '</span>' +
        chips.map(function (e) {
          return '<span class="cal__ev' + (e.type === 'hackathon' ? ' cal__ev--hack' : '') + '">' + esc(e.name) + '</span>';
        }).join('') +
        (evs.length > chips.length ? '<span class="cal__more">+' + (evs.length - chips.length) + ' more</span>' : '') +
      '</button>');
    }
    html.push('</div>');

    // The opened day, listed in full with the same rows as the board.
    if (state.day) {
      var dayEvs = byDay[state.day] || [];
      var dd = parseISO(state.day);
      html.push('<div class="cal__dayview">' +
        '<h3 class="groupbar"><span>' + esc(WEEKDAYS[dd.getDay()] + ', ' + MONTHS[dd.getMonth()] + ' ' + dd.getDate()) +
        '</span><span>' + dayEvs.length + (dayEvs.length === 1 ? ' event' : ' events') + '</span></h3>' +
        (dayEvs.length ? dayEvs.map(function (e, i) { return rowWithCal(occurrenceOn(e, state.day), i); }).join('')
          : '<p class="cal__none">Nothing on this day with the current filters.</p>') +
      '</div>');
    }

    el.cal.innerHTML = html.join('');
    el.empty.hidden = true;
    el.count.innerHTML = '<b>' + inMonth + '</b> ' + (inMonth === 1 ? 'event' : 'events') + ' in ' + esc(monthName);
  }

  function shiftMonth(delta) {
    if (delta === 0) { state.month = TODAY.slice(0, 7); state.day = TODAY; return; }
    var y = +state.month.slice(0, 4), m = +state.month.slice(5, 7) - 1 + delta;
    var d = new Date(y, m, 1);
    state.month = d.getFullYear() + '-' + pad(d.getMonth() + 1);
    state.day = '';
  }

  function render() {
    var cal = state.view === 'calendar';
    el.board.hidden = cal;
    el.cal.hidden = !cal;
    document.body.classList.toggle('is-cal', cal);
    // Clear the view not shown: hidden rows would still be read by assistive
    // tech and still weigh on the page.
    if (cal) el.board.innerHTML = ''; else el.cal.innerHTML = '';
    if (cal) {
      el.board.setAttribute('aria-busy', 'false');
      renderCalendar();
      renderChips();
      syncDropdowns();
      writeURL();
      return;
    }

    var list = filtered();
    var html = [];
    var lastGroup = null;
    SHOWN = [];

    list.forEach(function (e, i) {
      var g = groupLabel(e);
      if (g !== lastGroup) {
        html.push('<h3 class="groupbar"><span>' + esc(g) + '</span></h3>');
        lastGroup = g;
      }
      html.push(rowWithCal(e, i));
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
    syncDropdowns();
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

    document.querySelectorAll('.segmented button[data-view]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.view = b.getAttribute('data-view');
        // Opening the calendar lands on this month with today's events open.
        if (state.view === 'calendar' && !state.month) { state.month = TODAY.slice(0, 7); state.day = TODAY; }
        syncControls();
        render();
      });
    });

    el.cal.addEventListener('click', function (ev) {
      var nav = ev.target.closest('[data-month]');
      if (nav) { shiftMonth(+nav.getAttribute('data-month')); render(); return; }
      var day = ev.target.closest('[data-day]');
      if (day) {
        var iso = day.getAttribute('data-day');
        // A day from the neighbouring month opens that month.
        if (iso.slice(0, 7) !== state.month) state.month = iso.slice(0, 7);
        state.day = iso;
        render();
        var panel = el.cal.querySelector('.cal__dayview');
        if (panel && state.day && panel.scrollIntoView) panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });

    // Add-to-calendar menus: build on first open, one open at a time.
    document.addEventListener('click', function (ev) {
      if (!ev.target.closest('.dd')) DROPDOWNS.forEach(function (d) { closeDropdown(d, false); });
      var summary = ev.target.closest('.addcal > summary');
      var inside = ev.target.closest('.addcal');
      document.querySelectorAll('.addcal[open]').forEach(function (d) {
        if (d !== inside) d.removeAttribute('open');
      });
      if (summary) fillCalMenu(summary.parentNode);
      // Choosing a calendar closes the menu behind it.
      if (inside && ev.target.closest('.addcal__menu a')) inside.removeAttribute('open');
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      document.querySelectorAll('.addcal[open]').forEach(function (d) {
        d.removeAttribute('open');
        d.querySelector('summary').focus();
      });
    });

    document.querySelectorAll('.segmented button[data-when]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.when = b.getAttribute('data-when');
        document.querySelectorAll('.segmented button[data-when]').forEach(function (x) {
          var on = x === b;
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        render();
      });
    });

    el.type.addEventListener('change', function () { state.type = el.type.value; render(); });
    el.country.addEventListener('change', function () {
      state.country = el.country.value;
      // A province picked under Canada means nothing once the US is chosen.
      if (state.region && REGIONS[state.region] && state.country && REGIONS[state.region].country !== state.country) {
        state.region = '';
      }
      fillRegions();
      render();
    });
    el.region.addEventListener('change', function () {
      state.region = el.region.value;
      // Choosing a province also settles the country, so the two never disagree.
      if (state.region && REGIONS[state.region]) state.country = REGIONS[state.region].country;
      el.country.value = state.country;
      fillRegions();
      render();
    });
    el.sort.addEventListener('change', function () { state.sort = el.sort.value; render(); });

    el.empty.addEventListener('click', function (ev) {
      if (!ev.target.matches('[data-reset]')) return;
      state.q = ''; state.cities = []; state.when = 'all'; state.type = ''; state.country = ''; state.region = '';
      fillRegions();
      syncControls();
      render();
    });
  }

  function syncControls() {
    el.q.value = state.q;
    el.type.value = state.type;
    el.country.value = state.country;
    el.region.value = state.region;
    el.sort.value = state.sort;
    syncDropdowns();
    document.querySelectorAll('.segmented button[data-view]').forEach(function (x) {
      var on = x.getAttribute('data-view') === state.view;
      x.classList.toggle('is-on', on);
      x.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    document.querySelectorAll('.segmented button[data-when]').forEach(function (x) {
      var on = x.getAttribute('data-when') === state.when;
      x.classList.toggle('is-on', on);
      x.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }

  /* ------------------------------------------------------------ dropdowns */

  /* The browser's own <select> list cannot be styled: no padding, no count
     column, system fonts. Each select is kept, hidden, as the source of truth
     (filters, URL state and tests all read it), and a listbox drawn in the
     page's own style stands in front of it. The list is rebuilt from the
     select's options on every open, so options filled in later are current. */
  var DROPDOWNS = [];
  var SEARCHABLE_FROM = 12;   // longer lists get a filter box

  function enhanceSelect(sel) {
    var box = sel.parentNode;
    box.classList.add('dd');
    sel.classList.add('dd__native');
    sel.tabIndex = -1;
    sel.setAttribute('aria-hidden', 'true');

    var id = sel.id + '-dd';
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'dd__trigger';
    trigger.id = id;
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = '<span class="dd__value"></span>' +
      '<svg class="dd__chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

    var panel = document.createElement('div');
    panel.className = 'dd__panel';
    panel.hidden = true;

    box.appendChild(trigger);
    box.appendChild(panel);

    // The visible label now names the trigger, not the hidden select.
    var label = document.querySelector('label[for="' + sel.id + '"]');
    if (label) {
      label.setAttribute('for', id);
      if (!label.id) label.id = sel.id + '-label';
      trigger.setAttribute('aria-labelledby', label.id + ' ' + id);
    }

    var dd = { sel: sel, box: box, trigger: trigger, panel: panel };
    DROPDOWNS.push(dd);

    trigger.addEventListener('click', function () { dd.open ? closeDropdown(dd, true) : openDropdown(dd); });
    trigger.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp' || ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        openDropdown(dd);
      }
    });
    panel.addEventListener('keydown', function (ev) { dropdownKey(dd, ev); });
    panel.addEventListener('click', function (ev) {
      var opt = ev.target.closest('[role="option"]');
      if (opt) chooseOption(dd, opt.getAttribute('data-value'));
    });
    panel.addEventListener('input', function (ev) {
      if (ev.target.classList.contains('dd__search')) filterOptions(dd, ev.target.value);
    });
    syncDropdown(dd);
  }

  function optionLabel(o) { return o.textContent.trim(); }

  function buildPanel(dd) {
    var items = [];
    var html = [];
    var n = 0;
    var addOption = function (o) {
      var count = o.getAttribute('data-count');
      var sel = o.value === dd.sel.value;
      html.push('<li role="option" id="' + dd.sel.id + '-opt-' + (n++) + '" tabindex="-1" data-value="' + esc(o.value) + '"' +
        ' data-label="' + esc(fold(optionLabel(o))) + '" aria-selected="' + sel + '"' +
        (o.value === '' ? ' class="is-all"' : '') + '>' +
        '<span class="dd__opt">' + esc(optionLabel(o)) + '</span>' +
        (count ? '<span class="dd__count">' + esc(count) + '</span>' : '') + '</li>');
      items.push(o);
    };
    [].forEach.call(dd.sel.children, function (c) {
      if (c.tagName === 'OPTGROUP') {
        html.push('<li class="dd__group" role="presentation">' + esc(c.label) + '</li>');
        [].forEach.call(c.children, addOption);
      } else addOption(c);
    });
    var searchable = items.length >= SEARCHABLE_FROM;
    dd.panel.innerHTML =
      (searchable ? '<input class="dd__search" type="text" placeholder="Filter" aria-label="Filter options" autocomplete="off" spellcheck="false">' : '') +
      '<ul class="dd__list" role="listbox" aria-labelledby="' + dd.trigger.id + '">' + html.join('') + '</ul>' +
      (searchable ? '<p class="dd__none" hidden>No match</p>' : '');
  }

  function visibleOptions(dd) {
    return [].filter.call(dd.panel.querySelectorAll('[role="option"]'), function (li) { return !li.hidden; });
  }

  function openDropdown(dd) {
    DROPDOWNS.forEach(function (o) { if (o !== dd && o.open) closeDropdown(o, false); });
    buildPanel(dd);
    dd.open = true;
    dd.panel.hidden = false;
    dd.box.classList.add('is-open');
    dd.trigger.setAttribute('aria-expanded', 'true');
    // Open towards the side with room, so the last column never runs off-screen.
    dd.panel.classList.remove('dd__panel--right');
    var r = dd.panel.getBoundingClientRect();
    if (r.right > (window.innerWidth || document.documentElement.clientWidth) - 8) dd.panel.classList.add('dd__panel--right');
    var search = dd.panel.querySelector('.dd__search');
    var current = dd.panel.querySelector('[aria-selected="true"]') || visibleOptions(dd)[0];
    if (search) search.focus(); else if (current) current.focus();
    if (current && current.scrollIntoView) current.scrollIntoView({ block: 'nearest' });
  }

  function closeDropdown(dd, refocus) {
    if (!dd.open) return;
    dd.open = false;
    dd.panel.hidden = true;
    dd.box.classList.remove('is-open');
    dd.trigger.setAttribute('aria-expanded', 'false');
    if (refocus) dd.trigger.focus();
  }

  function chooseOption(dd, value) {
    closeDropdown(dd, true);
    if (dd.sel.value === value) return;
    dd.sel.value = value;
    dd.sel.dispatchEvent(new Event('change', { bubbles: true }));
    syncDropdown(dd);
  }

  function filterOptions(dd, q) {
    var needle = fold(q.trim());
    var shown = 0;
    [].forEach.call(dd.panel.querySelectorAll('[role="option"]'), function (li) {
      var hit = !needle || li.getAttribute('data-label').indexOf(needle) >= 0;
      li.hidden = !hit;
      if (hit) shown++;
    });
    // A country heading stays only while one of its options does.
    [].forEach.call(dd.panel.querySelectorAll('.dd__group'), function (g) {
      var next = g.nextElementSibling, any = false;
      while (next && !next.classList.contains('dd__group')) { if (!next.hidden) any = true; next = next.nextElementSibling; }
      g.hidden = !any;
    });
    var none = dd.panel.querySelector('.dd__none');
    if (none) none.hidden = shown > 0;
  }

  function dropdownKey(dd, ev) {
    var opts = visibleOptions(dd);
    var at = opts.indexOf(document.activeElement);
    var inSearch = document.activeElement && document.activeElement.classList.contains('dd__search');
    var go = function (i) { if (opts[i]) { opts[i].focus(); opts[i].scrollIntoView && opts[i].scrollIntoView({ block: 'nearest' }); } };
    if (ev.key === 'Escape') { ev.preventDefault(); closeDropdown(dd, true); return; }
    if (ev.key === 'Tab') { closeDropdown(dd, false); return; }
    if (ev.key === 'ArrowDown') { ev.preventDefault(); go(inSearch ? 0 : Math.min(at + 1, opts.length - 1)); return; }
    if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      if (at <= 0) { var s = dd.panel.querySelector('.dd__search'); if (s) s.focus(); return; }
      go(at - 1); return;
    }
    if (ev.key === 'Home' && !inSearch) { ev.preventDefault(); go(0); return; }
    if (ev.key === 'End' && !inSearch) { ev.preventDefault(); go(opts.length - 1); return; }
    if (ev.key === 'Enter' || (ev.key === ' ' && !inSearch)) {
      ev.preventDefault();
      var pick = inSearch ? opts[0] : opts[at];
      if (pick) chooseOption(dd, pick.getAttribute('data-value'));
      return;
    }
    // Type a letter to jump, as a native select does.
    if (!inSearch && ev.key.length === 1 && /\S/.test(ev.key)) {
      var k = fold(ev.key);
      for (var j = 1; j <= opts.length; j++) {
        var cand = opts[(at + j) % opts.length];
        if (cand.getAttribute('data-label').charAt(0) === k) { go(opts.indexOf(cand)); break; }
      }
    }
  }

  /* The trigger shows the select's current choice; the "all" choice reads dimmer. */
  function syncDropdown(dd) {
    var o = dd.sel.options[dd.sel.selectedIndex];
    var v = dd.trigger.querySelector('.dd__value');
    v.textContent = o ? optionLabel(o) : '';
    dd.trigger.classList.toggle('is-all', !o || o.value === '');
  }
  function syncDropdowns() { DROPDOWNS.forEach(syncDropdown); }

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
      // "Various" and similar placeholders are not places to filter by.
      if (e.region && !/^(various|multiple|n\/a|us & canada)$/i.test(e.region)) {
        if (!REGIONS[e.region]) REGIONS[e.region] = { name: e.region, country: e.country, count: 0 };
        REGIONS[e.region].count++;
      }
    });

    CITIES = Object.keys(cityMap).map(function (k) { return cityMap[k]; })
      .sort(function (a, b) { return b.count - a.count || a.city.localeCompare(b.city); });

    var typeOpts = Object.keys(types).sort(function (a, b) { return types[b] - types[a]; });
    el.type.innerHTML = '<option value="">All kinds</option>' + typeOpts.map(function (t) {
      var label = t.replace(/-/g, ' ');
      return '<option value="' + esc(t) + '" data-count="' + types[t] + '">' +
        esc(label.charAt(0).toUpperCase() + label.slice(1)) + '</option>';
    }).join('');
  }

  /** The province/state picker: grouped by country, narrowed to the chosen one. */
  function fillRegions() {
    var groups = ['United States', 'Canada'].filter(function (c) { return !state.country || c === state.country; });
    el.region.innerHTML = '<option value="">All provinces &amp; states</option>' + groups.map(function (c) {
      var list = Object.keys(REGIONS).map(function (k) { return REGIONS[k]; })
        .filter(function (r) { return r.country === c; })
        .sort(function (a, b) { return a.name.localeCompare(b.name); });
      return '<optgroup label="' + esc(c) + '">' + list.map(function (r) {
        return '<option value="' + esc(r.name) + '" data-count="' + r.count + '">' + esc(r.name) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
    el.region.value = state.region;
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
    ['q', 'cityq', 'citylist', 'clearCities', 'chips', 'type', 'country', 'region', 'sort', 'cal',
      'board', 'empty', 'count', 'tally'].forEach(function (id) { el[id] = $(id); });

    ['type', 'country', 'region', 'sort'].forEach(function (id) { enhanceSelect(el[id]); });
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
        // The kinds only exist now, so a ?type= from the URL can only be shown now.
        el.type.value = state.type;
        // A shared ?region= link carries no country; take it from the region.
        if (state.region && !REGIONS[state.region]) state.region = '';
        if (state.region) { state.country = REGIONS[state.region].country; el.country.value = state.country; }
        fillRegions();
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
