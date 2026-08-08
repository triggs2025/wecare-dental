// Proves the colour stripe on each service card in index.html still matches the
// eventColor of that service's calendar in GoHighLevel. The site copies those
// colours, so without a check the two drift the moment someone recolours a
// calendar in the GHL UI and the stripe quietly starts lying.
//
//   node scripts/check-calendar-colours.js
//
// Needs the GHL token at ~/.ghl-wecare-token.txt. That file is deliberately
// outside the repo, which is public. Never move it in.
//
// Exits non-zero on any mismatch, missing calendar, orphan calendar, or repeated
// colour, so it can be wired into a hook later.
const fs = require('fs'), os = require('os'), path = require('path');

const LOCATION_ID = '3tIu8i8uehDSpyeXiWtR';

// The one service whose name differs between the site and GHL. Add to this map
// rather than switching to fuzzy matching, so a real mismatch still fails.
const ALIAS = { 'Extractions': 'Extraction' };

(async () => {
  const repo = path.resolve(__dirname, '..');
  const tokenPath = path.join(os.homedir(), '.ghl-wecare-token.txt');
  if (!fs.existsSync(tokenPath)) {
    console.error('No token at ' + tokenPath + '. See BACKEND-PLAN.md.');
    process.exit(2);
  }

  const res = await fetch(
    'https://services.leadconnectorhq.com/calendars/?locationId=' + LOCATION_ID,
    { headers: {
        Authorization: 'Bearer ' + fs.readFileSync(tokenPath, 'utf8').trim(),
        Version: '2021-04-15',
        Accept: 'application/json',
    } });
  if (!res.ok) { console.error('GHL request failed: ' + res.status + ' ' + res.statusText); process.exit(2); }
  const byName = new Map((await res.json()).calendars.map(c => [c.name, c]));

  const html = fs.readFileSync(path.join(repo, 'index.html'), 'utf8');
  const cards = [...html.matchAll(
    /<a class="card svc-card" href="services\/([a-z0-9-]+)\.html" style="--svc:(#[0-9A-Fa-f]{6})">.*?<h3 data-i18n="svc\d+t">([^<]+)<\/h3>/g)]
    .map(m => [m[0], m[2], m[3], m[1]]);   // [full, colour, title, slug]

  console.log('cards: ' + cards.length + '   calendars: ' + byName.size + '\n');
  let bad = 0;
  for (const [, colour, title] of cards) {
    const key = ALIAS[title] || title;
    const cal = byName.get(key);
    if (!cal) { console.log('  NO CALENDAR  ' + title.padEnd(28) + colour); bad++; continue; }
    const ok = cal.eventColor.toUpperCase() === colour.toUpperCase();
    if (!ok) bad++;
    console.log((ok ? '  ok  ' : '  DIFF') + '  ' + title.padEnd(28) +
      'site ' + colour + '   ghl ' + cal.eventColor + '   ' + cal.slotDuration + 'min');
    byName.delete(key);
  }
  for (const name of byName.keys()) { console.log('  CALENDAR WITH NO CARD: ' + name); bad++; }

  const seen = cards.map(c => c[1].toUpperCase());
  const dupes = [...new Set(seen.filter((c, i) => seen.indexOf(c) !== i))];
  if (dupes.length) { console.log('\n  DUPLICATE COLOURS: ' + dupes.join(', ')); bad++; }

  // The booking picker carries a hardcoded calendar id per card. A wrong id is
  // the worst failure mode on this page: it books silently, into the wrong
  // service, with the wrong duration, and nothing on screen looks broken. So
  // check every id against the live calendar, and that the picker's colour and
  // order still match the Services cards.
  const byId = new Map((await (await fetch(
    'https://services.leadconnectorhq.com/calendars/?locationId=' + LOCATION_ID,
    { headers: {
        Authorization: 'Bearer ' + fs.readFileSync(tokenPath, 'utf8').trim(),
        Version: '2021-04-15', Accept: 'application/json',
    } })).json()).calendars.map(c => [c.id, c]));

  const picks = [...html.matchAll(
    /<button type="button" class="pick" data-cal="([^"]+)" data-slug="([a-z0-9-]+)" data-key="(svc\d+t)" style="--svc:(#[0-9A-Fa-f]{6})">/g)]
    .map(m => [m[0], m[1], m[3], m[4], m[2]]);   // [full, calId, i18nKey, colour, slug]
  console.log('\npicker cards: ' + picks.length);
  if (picks.length !== cards.length) {
    console.log('  COUNT MISMATCH: ' + picks.length + ' picker vs ' + cards.length + ' service cards'); bad++;
  }
  picks.forEach(([, id, key, colour, slug], i) => {
    const cal = byId.get(id);
    const card = cards[i];
    const expectedTitle = card ? card[2] : '(no service card)';
    const problems = [];
    if (!cal) problems.push('unknown calendar id');
    else if (cal.name !== (ALIAS[expectedTitle] || expectedTitle)) problems.push('id belongs to "' + cal.name + '"');
    if (card && colour.toUpperCase() !== card[1].toUpperCase()) problems.push('colour differs from the service card');
    if (card && slug !== card[3]) problems.push('slug "' + slug + '" but the card links to "' + card[3] + '"');
    if (key !== 'svc' + (i + 1) + 't') problems.push('i18n key out of order');
    // The service page has to exist, or "Learn more" and "Book this service"
    // both land on a 404 and the sitemap advertises a dead URL.
    if (card && !fs.existsSync(path.join(repo, 'services', card[3] + '.html'))) {
      problems.push('services/' + card[3] + '.html does not exist, run the build');
    }
    if (problems.length) bad++;
    console.log((problems.length ? '  BAD ' : '  ok  ') + '  ' + expectedTitle.padEnd(28) +
      (cal ? cal.name : id).padEnd(28) + (problems.length ? problems.join('; ') : ''));
  });

  console.log('\n' + (bad ? bad + ' problem(s)' : 'service cards and picker both match GHL'));
  process.exitCode = bad ? 1 : 0;
})();
