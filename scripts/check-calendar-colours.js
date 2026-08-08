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
    /<div class="card svc-card" style="--svc:(#[0-9A-Fa-f]{6})">.*?<h3 data-i18n="svc\d+t">([^<]+)<\/h3>/g)];

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

  console.log('\n' + (bad ? bad + ' problem(s)' : 'all cards match their calendar, no duplicate colours'));
  process.exitCode = bad ? 1 : 0;
})();
