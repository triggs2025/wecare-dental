// Makes the GoHighLevel calendar descriptions bilingual, so the one piece of
// English a Spanish-speaking patient still meets inside the booking widget is at
// least followed by Spanish. The widget's own date and time UI stays English;
// that is GHL's, and ?locale=es is ignored.
//
//   node scripts/sync-calendar-descriptions.js            # all 14
//   node scripts/sync-calendar-descriptions.js "Root Canal"  # just one, to test
//
// Both languages are read out of index.html rather than retyped here, so the
// site and the booking widget cannot drift apart.
//
// GHL's calendar PUT is a FULL REPLACE. This reads the whole object back,
// changes one field, returns all of it, then re-reads to prove slotDuration and
// openHours survived. Empty arrays are dropped: these calendars have no team
// members, and echoing teamMembers:[] back is rejected outright.
const fs = require('fs'), os = require('os'), path = require('path');

const LOCATION_ID = '3tIu8i8uehDSpyeXiWtR';
const ALIAS = { 'Extractions': 'Extraction' };
const READ_ONLY = ['id', 'locationId'];

// Separator between the two languages. A bare newline does NOT work: the widget
// renders the description in a div with white-space:normal, so the break
// collapses and the two languages run together as one paragraph. Verified on
// the live widget, not assumed. The middle dot survives that collapse and
// matches the separator used elsewhere on the site; the newlines are kept in
// case GHL ever switches that element to pre-line.
const SEP = '\n\n· ';

const repo = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(repo, 'index.html'), 'utf8');

// The two dictionaries, split at the start of the Spanish one.
const body = html.slice(html.indexOf('const I18N'));
const esAt = body.search(/\n\s*es\s*:\s*\{/);
const grab = (part, key) => {
  const m = part.match(new RegExp(key + ':"((?:[^"\\\\]|\\\\.)*)"'));
  return m ? m[1].replace(/\\"/g, '"') : null;
};
const EN = body.slice(0, esAt), ES = body.slice(esAt);

const services = [];
for (let i = 1; i <= 14; i++) {
  services.push({
    title: grab(EN, 'svc' + i + 't'),
    en: grab(EN, 'svc' + i + 'd'),
    es: grab(ES, 'svc' + i + 'd'),
  });
}
const missing = services.filter(s => !s.title || !s.en || !s.es);
if (missing.length) { console.error('Could not read all 14 services from index.html'); process.exit(2); }

const only = process.argv[2];

(async () => {
  const tokenPath = path.join(os.homedir(), '.ghl-wecare-token.txt');
  const headers = {
    Authorization: 'Bearer ' + fs.readFileSync(tokenPath, 'utf8').trim(),
    Version: '2021-04-15',
    Accept: 'application/json',
  };
  const list = await (await fetch(
    'https://services.leadconnectorhq.com/calendars/?locationId=' + LOCATION_ID, { headers })).json();
  const byName = new Map(list.calendars.map(c => [c.name, c]));

  let done = 0, failed = 0;
  for (const svc of services) {
    const name = ALIAS[svc.title] || svc.title;
    if (only && name !== only && svc.title !== only) continue;
    const stub = byName.get(name);
    if (!stub) { console.log('  ' + svc.title.padEnd(28) + 'NO CALENDAR'); failed++; continue; }

    const url = 'https://services.leadconnectorhq.com/calendars/' + stub.id;
    const before = (await (await fetch(url, { headers })).json()).calendar;

    const payload = {};
    for (const [k, v] of Object.entries(before)) {
      if (READ_ONLY.includes(k) || v === null) continue;
      if (Array.isArray(v) && v.length === 0) continue;
      payload[k] = v;
    }
    payload.description = svc.en + SEP + svc.es;

    const res = await fetch(url, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.log('  ' + svc.title.padEnd(28) + 'FAIL ' + res.status + ' ' + (await res.text()).slice(0, 160));
      failed++; continue;
    }

    await new Promise(r => setTimeout(r, 400));
    const after = (await (await fetch(url, { headers })).json()).calendar;
    const ok = after.description === payload.description &&
               after.slotDuration === before.slotDuration &&
               after.openHours.length === before.openHours.length;
    console.log('  ' + (ok ? 'ok  ' : 'BAD ') + svc.title.padEnd(28) +
      after.slotDuration + 'min  openHours ' + after.openHours.length +
      '  desc ' + after.description.length + ' chars');
    ok ? done++ : failed++;
  }
  console.log('\nupdated ' + done + ', failed ' + failed);
  process.exitCode = failed ? 1 : 0;
})();
