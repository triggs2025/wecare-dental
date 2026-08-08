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
    /<a class="card svc-card" href="services\/([a-z0-9-]+)\.html" style="--svc:(#[0-9A-Fa-f]{6})">.*?<h3 data-i18n="svc(\d+)t">([^<]+)<\/h3>/g)]
    .map(m => ({ slug: m[1], colour: m[2], n: Number(m[3]), title: m[4] }));

  // Not every service is bookable online. Deep Cleaning and Orthodontics are
  // done by visiting specialists, so they have a card and a page but no
  // calendar and no picker button. A card with no picker button is expected;
  // a picker button with no calendar is not.
  const picks = [...html.matchAll(
    /<button type="button" class="pick" data-cal="([^"]+)" data-slug="([a-z0-9-]+)" data-key="svc(\d+)t" style="--svc:(#[0-9A-Fa-f]{6})">/g)]
    .map(m => ({ cal: m[1], slug: m[2], n: Number(m[3]), colour: m[4] }));
  const bookable = new Set(picks.map(p => p.slug));

  console.log('cards: ' + cards.length + '   bookable: ' + picks.length +
              '   calendars: ' + byName.size + '\n');
  let bad = 0;
  for (const card of cards) {
    if (!bookable.has(card.slug)) {
      console.log('  --    ' + card.title.padEnd(28) + 'site ' + card.colour + '   no calendar by design');
      continue;
    }
    const key = ALIAS[card.title] || card.title;
    const cal = byName.get(key);
    if (!cal) { console.log('  NO CALENDAR  ' + card.title.padEnd(28) + card.colour); bad++; continue; }
    const ok = cal.eventColor.toUpperCase() === card.colour.toUpperCase();
    if (!ok) bad++;
    console.log((ok ? '  ok  ' : '  DIFF') + '  ' + card.title.padEnd(28) +
      'site ' + card.colour + '   ghl ' + cal.eventColor + '   ' + cal.slotDuration + 'min');
    byName.delete(key);
  }
  for (const name of byName.keys()) { console.log('  CALENDAR WITH NO CARD: ' + name); bad++; }

  // Colours must stay distinct across ALL services, bookable or not, or two
  // cards look like the same thing on the home page.
  const seen = cards.map(c => c.colour.toUpperCase());
  const dupes = [...new Set(seen.filter((c, i) => seen.indexOf(c) !== i))];
  if (dupes.length) { console.log('\n  DUPLICATE COLOURS: ' + dupes.join(', ')); bad++; }

  // svcN keys must run 1..N in display order, and every card needs its page.
  cards.forEach((card, i) => {
    const problems = [];
    if (card.n !== i + 1) problems.push('i18n key is svc' + card.n + 't but it is card ' + (i + 1));
    if (!fs.existsSync(path.join(repo, 'services', card.slug + '.html'))) {
      problems.push('services/' + card.slug + '.html does not exist, run the build');
    }
    if (problems.length) { console.log('  CARD  ' + card.title + ': ' + problems.join('; ')); bad++; }
  });

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

  console.log('\npicker buttons: ' + picks.length);
  const cardBySlug = new Map(cards.map(c => [c.slug, c]));
  picks.forEach(p => {
    const cal = byId.get(p.cal);
    const card = cardBySlug.get(p.slug);
    const problems = [];
    if (!card) problems.push('no Services card links to services/' + p.slug + '.html');
    if (!cal) problems.push('unknown calendar id');
    else if (card && cal.name !== (ALIAS[card.title] || card.title)) {
      problems.push('id belongs to "' + cal.name + '" but the card says "' + card.title + '"');
    }
    if (card && p.colour.toUpperCase() !== card.colour.toUpperCase()) problems.push('colour differs from the service card');
    if (card && p.n !== card.n) problems.push('i18n key svc' + p.n + 't but the card uses svc' + card.n + 't');
    if (problems.length) bad++;
    console.log((problems.length ? '  BAD ' : '  ok  ') + '  ' + (card ? card.title : p.slug).padEnd(28) +
      (cal ? cal.name : p.cal).padEnd(28) + (problems.length ? problems.join('; ') : ''));
  });

  console.log('\n' + (bad ? bad + ' problem(s)' : 'service cards and picker both match GHL'));
  process.exitCode = bad ? 1 : 0;
})();
