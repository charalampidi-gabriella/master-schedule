// One-off: read coach shift assignments from the scheduling app and write
// them into master-schedule rosters. Run with:  node scripts/seed-roster.mjs
//
// Optional env: MASTER_URL (defaults to production). Existing blocks are preserved.

const SCHED_URL  = process.env.SCHED_URL  || 'https://scheduling-b3x.pages.dev';
const MASTER_URL = process.env.MASTER_URL || 'https://rippner-master-schedule.pages.dev';
const FACILITIES = [
  { id: 'satc',  key: 'master_satc'  },
  { id: 'pharr', key: 'master_pharr' },
  { id: 'wilco', key: 'master_wilco' },
];

async function main(){
  const [coaches, sched] = await Promise.all([
    fetch(`${SCHED_URL}/api/state/coaches`).then(r => r.json()),
    fetch(`${SCHED_URL}/api/state/current_schedule`).then(r => r.json()),
  ]);
  const nameById = new Map(coaches.map(c => [c.id, c.name]));

  // roster[facility][dayIdx] = { morning: Set, evening: Set }
  const roster = {};
  for (const f of FACILITIES) {
    roster[f.id] = {};
    for (let d = 0; d < 7; d++) roster[f.id][d] = { morning: new Set(), evening: new Set() };
  }

  for (const [k, v] of Object.entries(sched)) {
    const [coachIdStr, dayStr] = k.split('_');
    const coachId = +coachIdStr;
    const day = +dayStr;
    const name = nameById.get(coachId);
    if (!name) continue;
    for (const shift of ['morning', 'evening']) {
      const loc = v[shift];
      if (!loc || !roster[loc]) continue;
      roster[loc][day][shift].add(name);
    }
  }

  // Spread coaches alphabetically across 6 court slots (Ct1..Ct5, W). Extras
  // appended onto Court 1 comma-joined so nobody is dropped.
  const COURT_SLOTS = 6;
  const distribute = (set) => {
    const arr = Array(COURT_SLOTS).fill('');
    const list = [...set].sort();
    for (let i = 0; i < list.length; i++) {
      const idx = Math.min(i, COURT_SLOTS - 1);
      arr[idx] = arr[idx] ? `${arr[idx]}, ${list[i]}` : list[i];
    }
    return arr;
  };
  const flatten = (r) => {
    const out = {};
    for (let d = 0; d < 7; d++) {
      out[d] = { morning: distribute(r[d].morning), evening: distribute(r[d].evening) };
    }
    return out;
  };

  for (const f of FACILITIES) {
    const existing = await fetch(`${MASTER_URL}/api/state/${f.key}`).then(r => r.json()).catch(() => null);
    const merged = {
      ...(existing && typeof existing === 'object' ? existing : {}),
      blocks: (existing && Array.isArray(existing.blocks)) ? existing.blocks : [],
      roster: flatten(roster[f.id]),
    };
    const res = await fetch(`${MASTER_URL}/api/state/${f.key}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(merged),
    });
    if (!res.ok) {
      console.error(`✘ ${f.key}: HTTP ${res.status}`); process.exitCode = 1; continue;
    }
    console.log(`✓ ${f.key}`);
    for (let d = 0; d < 7; d++) {
      const day = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d];
      const m = merged.roster[d].morning.map(x => x || '—').join(' | ');
      const e = merged.roster[d].evening.map(x => x || '—').join(' | ');
      console.log(`   ${day}  morning  ${m}\n         evening  ${e}`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
