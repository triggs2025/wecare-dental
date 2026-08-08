// Turns data/border-history.csv into assets/border-pattern.json: the typical
// northbound crossing delay for each hour of the local day.
//
//   node scripts/build-border-pattern.js
//
// Runs after every fetch in .github/workflows/border-wait.yml, so the pattern
// sharpens on its own as history accumulates.
//
// WHY THIS EXISTS
// CBP publishes only the CURRENT delay. There is no history and no forecast
// anywhere, so this CSV is the only way the site can ever say "book the 4pm and
// you will hit a shorter queue going home". The number that matters to a patient
// is the wait when their appointment ENDS, not when it starts, because that is
// when they drive back into Arizona.
//
// MEDIAN, NOT MEAN. A single 80-minute spike would drag an average up and make a
// normally quiet hour look bad. With the small sample sizes here that matters.
//
// TIME ZONE: San Luis Rio Colorado and San Luis, Arizona are both permanently
// UTC-7 and do not observe DST, so local hour is simply UTC hour minus 7. This
// is the one border on the US southwest where the clocks never diverge; do not
// "fix" this with a DST-aware conversion.
const fs = require('fs'), path = require('path');

const UTC_OFFSET = -7;
const repo = path.resolve(__dirname, '..');
const csv = path.join(repo, 'data', 'border-history.csv');

// Below this many samples in an hour, the number is noise rather than a pattern
// and the site should not present it as guidance.
const MIN_SAMPLES = 3;

if (!fs.existsSync(csv)) { console.error('no history yet at ' + csv); process.exit(1); }

const rows = fs.readFileSync(csv, 'utf8').trim().split(/\r?\n/).slice(1)
  .map(l => l.split(','))
  .filter(c => c.length >= 5)
  .map(c => ({
    t: new Date(c[0]),
    open: !/closed/i.test(c[1] || ''),
    vehicle: Number(c[2]),
    pedestrian: Number(c[4]),
  }))
  .filter(r => !isNaN(r.t) && r.open && Number.isFinite(r.vehicle));

if (!rows.length) { console.error('no usable rows'); process.exit(1); }

const median = a => {
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

const byHour = new Map();
for (const r of rows) {
  const h = (r.t.getUTCHours() + 24 + UTC_OFFSET) % 24;
  if (!byHour.has(h)) byHour.set(h, { vehicle: [], pedestrian: [] });
  byHour.get(h).vehicle.push(r.vehicle);
  if (Number.isFinite(r.pedestrian)) byHour.get(h).pedestrian.push(r.pedestrian);
}

const hours = {};
for (const [h, v] of byHour) {
  hours[h] = {
    n: v.vehicle.length,
    vehicle: median(v.vehicle),
    pedestrian: v.pedestrian.length ? median(v.pedestrian) : null,
    low: Math.min(...v.vehicle),
    high: Math.max(...v.vehicle),
    reliable: v.vehicle.length >= MIN_SAMPLES,
  };
}

const first = rows[0].t, last = rows[rows.length - 1].t;
const days = Math.max(1, Math.round((last - first) / 864e5 * 10) / 10);
const reliableHours = Object.values(hours).filter(h => h.reliable).length;

const out = {
  generatedAt: new Date().toISOString(),
  source: 'U.S. Customs and Border Protection, port 260801 San Luis, collected hourly',
  timezone: 'America/Phoenix',
  note: 'Median northbound (into Arizona) delay by local hour. An estimate from ' +
        'collected history, not a forecast and not a promise.',
  samples: rows.length,
  days,
  firstSample: first.toISOString(),
  lastSample: last.toISOString(),
  minSamples: MIN_SAMPLES,
  reliableHours,
  hours,
};

fs.writeFileSync(path.join(repo, 'assets', 'border-pattern.json'), JSON.stringify(out, null, 1) + '\n');

console.log('samples ' + rows.length + ' over ' + days + ' day(s), ' +
            Object.keys(hours).length + ' hours covered, ' + reliableHours +
            ' with ' + MIN_SAMPLES + '+ samples');
for (let h = 0; h < 24; h++) {
  const v = hours[h];
  if (!v) continue;
  const label = ((h % 12) || 12) + (h < 12 ? 'am' : 'pm');
  console.log('  ' + label.padStart(5) + '  n=' + String(v.n).padStart(2) +
    '  median ' + String(v.vehicle).padStart(3) + ' min' +
    (v.low === v.high ? '' : '  (range ' + v.low + '-' + v.high + ')') +
    (v.reliable ? '' : '   thin'));
}
