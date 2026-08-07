// Fetches the CBP border wait time feed and writes two things:
//
//   assets/border.json        the current San Luis I snapshot, read by the site
//   data/border-history.csv   one row per run, the raw material for the
//                             "what is it usually like at this hour" estimates
//
// CBP sends no Access-Control-Allow-Origin header, so the browser cannot call
// their API directly. This runs server-side (GitHub Actions) and commits the
// result, which the page then reads same-origin.
//
// Run locally with: node scripts/fetch-border.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FEED = 'https://bwt.cbp.gov/api/waittimes';
const PORT_NUMBER = '260801';          // San Luis I, the 24 hrs/day crossing
const SNAPSHOT = join(ROOT, 'assets', 'border.json');
const HISTORY = join(ROOT, 'data', 'border-history.csv');

// CBP uses "" and "N/A" and "Lanes Closed" interchangeably for "nothing here".
const num = v => {
  const n = parseInt(String(v ?? '').trim(), 10);
  return Number.isFinite(n) ? n : null;
};
const str = v => {
  const s = String(v ?? '').trim();
  return s && s !== 'N/A' ? s : null;
};

// A lane group is only meaningful if CBP actually reported a delay for it.
// "no delay" with a blank delay_minutes still means open with no wait.
function lane(group) {
  if (!group) return null;
  const status = str(group.operational_status);
  if (!status || /^lanes closed$/i.test(status)) return null;
  return {
    delayMinutes: num(group.delay_minutes) ?? 0,
    lanesOpen: num(group.lanes_open),
    status,
    updated: str(group.update_time)
  };
}

async function main() {
  const res = await fetch(FEED, {
    headers: { 'User-Agent': 'wecare-dental-border-bot' }
  });
  if (!res.ok) throw new Error(`CBP feed returned HTTP ${res.status}`);

  const ports = await res.json();
  if (!Array.isArray(ports) || ports.length === 0) {
    throw new Error('CBP feed was not a non-empty array');
  }

  const port = ports.find(p => String(p.port_number).trim() === PORT_NUMBER);
  if (!port) throw new Error(`port ${PORT_NUMBER} not present in feed`);

  const snapshot = {
    // ISO instant of when WE fetched it, not CBP's own clock
    fetchedAt: new Date().toISOString(),
    port: {
      number: PORT_NUMBER,
      name: str(port.port_name),
      crossing: str(port.crossing_name),
      hours: str(port.hours),
      status: str(port.port_status)
    },
    // CBP reports its own local reading time; keep it so we can show staleness
    reportedDate: str(port.date),
    reportedTime: str(port.time),
    vehicle: lane(port.passenger_vehicle_lanes?.standard_lanes),
    vehicleSentri: lane(port.passenger_vehicle_lanes?.NEXUS_SENTRI_lanes),
    vehicleReady: lane(port.passenger_vehicle_lanes?.ready_lanes),
    pedestrian: lane(port.pedestrian_lanes?.standard_lanes),
    pedestrianReady: lane(port.pedestrian_lanes?.ready_lanes),
    maxVehicleLanes: num(port.passenger_vehicle_lanes?.maximum_lanes),
    maxPedestrianLanes: num(port.pedestrian_lanes?.maximum_lanes),
    notice: str(port.construction_notice),
    source: 'https://bwt.cbp.gov/'
  };

  mkdirSync(dirname(SNAPSHOT), { recursive: true });
  writeFileSync(SNAPSHOT, JSON.stringify(snapshot, null, 2) + '\n');

  // Append one history row. Timestamps are UTC; the site converts to MST for
  // display. Keeping UTC means DST never corrupts the series.
  mkdirSync(dirname(HISTORY), { recursive: true });
  const header = 'fetched_at_utc,port_status,vehicle_delay_min,vehicle_lanes_open,pedestrian_delay_min,pedestrian_lanes_open\n';
  if (!existsSync(HISTORY)) writeFileSync(HISTORY, header);

  const row = [
    snapshot.fetchedAt,
    snapshot.port.status ?? '',
    snapshot.vehicle?.delayMinutes ?? '',
    snapshot.vehicle?.lanesOpen ?? '',
    snapshot.pedestrian?.delayMinutes ?? '',
    snapshot.pedestrian?.lanesOpen ?? ''
  ].join(',') + '\n';

  const existing = existsSync(HISTORY) ? readFileSync(HISTORY, 'utf8') : header;
  writeFileSync(HISTORY, existing.endsWith('\n') ? existing + row : existing + '\n' + row);

  const v = snapshot.vehicle, p = snapshot.pedestrian;
  console.log(`OK ${snapshot.port.status}  car=${v ? v.delayMinutes + 'min/' + v.lanesOpen + ' lanes' : 'n/a'}  ped=${p ? p.delayMinutes + 'min/' + p.lanesOpen + ' lanes' : 'n/a'}`);
}

main().catch(err => {
  // Fail loudly so a broken run does not silently publish stale or empty data.
  console.error('border fetch failed:', err.message);
  process.exit(1);
});
