// Clear the per-court coach roster for all facilities while preserving blocks.
const MASTER_URL = process.env.MASTER_URL || 'https://master-schedule.pages.dev';
const KEYS = ['master_satc', 'master_pharr', 'master_wilco'];

for (const key of KEYS) {
  const existing = await fetch(`${MASTER_URL}/api/state/${key}`).then(r => r.json()).catch(() => null);
  const merged = {
    ...(existing && typeof existing === 'object' ? existing : {}),
    blocks: (existing && Array.isArray(existing.blocks)) ? existing.blocks : [],
    roster: {},
  };
  const res = await fetch(`${MASTER_URL}/api/state/${key}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(merged),
  });
  console.log(res.ok ? `✓ ${key} cleared` : `✘ ${key}: HTTP ${res.status}`);
}
