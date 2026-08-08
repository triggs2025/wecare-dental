// Sets the GoHighLevel appointment lengths to Karina's real numbers, sent
// Aug 8 2026. Everything before this was my estimate, and nine of the fourteen
// were wrong, most of them too long, which quietly ate her availability.
//
//   node scripts/set-calendar-durations.js
//
// FIVE SERVICES ARE TWO VISITS. GHL books one appointment, so the value here is
// the length of ONE session, not the total. The second visit is booked when she
// sees the patient. The site descriptions say so in both languages, which is
// what a patient driving over a border needs to know before they set off.
//
// GHL's calendar PUT is a FULL REPLACE, so this reads the whole object back,
// changes the two length fields, returns all of it, then re-reads to prove the
// colour and openHours survived. Empty arrays are dropped: these calendars have
// no team members and echoing teamMembers:[] back is rejected outright.
const fs = require('fs'), os = require('os'), path = require('path');

const LOCATION_ID = '3tIu8i8uehDSpyeXiWtR';
const READ_ONLY = ['id', 'locationId'];

// minutes per session, and how many sessions the treatment actually takes
const DURATIONS = [
  ['General Consultation',      30, 1],
  ['Dental Cleaning',           30, 1],
  ['Fillings',                  40, 1],
  ['Teeth Whitening',           60, 1],
  ['Extraction',                60, 1],
  ['Root Canal',                90, 1],
  ['Root Canal Retreatment',    60, 2],
  ['Dental Post',               30, 1],
  ['Crowns',                    40, 2],
  ['Veneers',                   40, 2],
  ['Dental Surgery',            90, 1],
  ['Removable Partial Denture', 30, 2],
  ['Full Denture',              30, 2],
  ['Dental Implants',           90, 1],
];

(async () => {
  const headers = {
    Authorization: 'Bearer ' + fs.readFileSync(path.join(os.homedir(), '.ghl-wecare-token.txt'), 'utf8').trim(),
    Version: '2021-04-15',
    Accept: 'application/json',
  };
  const list = await (await fetch(
    'https://services.leadconnectorhq.com/calendars/?locationId=' + LOCATION_ID, { headers })).json();
  const byName = new Map(list.calendars.map(c => [c.name, c]));

  let changed = 0, same = 0, failed = 0;
  for (const [name, mins, sessions] of DURATIONS) {
    const stub = byName.get(name);
    if (!stub) { console.log('  ' + name.padEnd(28) + 'NO CALENDAR'); failed++; continue; }

    const url = 'https://services.leadconnectorhq.com/calendars/' + stub.id;
    const before = (await (await fetch(url, { headers })).json()).calendar;
    const note = sessions > 1 ? '  (' + sessions + ' visits of ' + mins + 'min)' : '';

    if (before.slotDuration === mins && before.slotInterval === mins) {
      console.log('  ' + name.padEnd(28) + mins + 'min  already correct' + note);
      same++; continue;
    }

    const payload = {};
    for (const [k, v] of Object.entries(before)) {
      if (READ_ONLY.includes(k) || v === null) continue;
      if (Array.isArray(v) && v.length === 0) continue;
      payload[k] = v;
    }
    payload.slotDuration = mins;
    payload.slotInterval = mins;

    const res = await fetch(url, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.log('  ' + name.padEnd(28) + 'FAIL ' + res.status + ' ' + (await res.text()).slice(0, 160));
      failed++; continue;
    }

    await new Promise(r => setTimeout(r, 400));
    const after = (await (await fetch(url, { headers })).json()).calendar;
    const ok = after.slotDuration === mins && after.slotInterval === mins &&
               after.eventColor === before.eventColor &&
               after.openHours.length === before.openHours.length;
    console.log('  ' + (ok ? 'ok  ' : 'BAD ') + name.padEnd(28) +
      before.slotDuration + 'min -> ' + after.slotDuration + 'min' +
      '   colour ' + after.eventColor + '   openHours ' + after.openHours.length + note);
    ok ? changed++ : failed++;
  }
  console.log('\nchanged ' + changed + ', already correct ' + same + ', failed ' + failed);
  process.exitCode = failed ? 1 : 0;
})();
