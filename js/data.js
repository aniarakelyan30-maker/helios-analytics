/**
 * data.js — Deterministic-ish mock data generation for the Helios dashboard.
 *
 * No backend is required: a small seeded PRNG produces stable, realistic-looking
 * time series so the demo is reproducible, and `reseed()` lets the "Refresh"
 * button simulate a fresh data pull.
 */

// Mulberry32 — tiny, fast, seedable PRNG.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let seed = 20260530;
let rand = mulberry32(seed);

/** Re-roll the generator so charts visibly change. */
export function reseed() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  rand = mulberry32(seed);
}

const CHANNELS = ['Organic', 'Paid', 'Referral', 'Social'];
const SEGMENTS = [
  { name: 'Enterprise', color: '#8b5cf6' },
  { name: 'Mid-market', color: '#22d3ee' },
  { name: 'SMB', color: '#6366f1' },
  { name: 'Startup', color: '#34d399' },
];

/**
 * Build a revenue series of `days` length. Channel filtering scales the
 * baseline so the chart reacts to the dropdown.
 */
export function getRevenueSeries(days, channel = 'all') {
  const channelWeight = channel === 'all' ? 1 : 0.18 + rand() * 0.32;
  const base = 38000 * channelWeight;
  const points = [];
  let value = base;
  const today = new Date('2026-05-30T00:00:00');

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    // Trend up over time, weekly seasonality, and noise.
    const trend = (days - i) / days * base * 0.55;
    const weekly = Math.sin((date.getDay() / 7) * Math.PI * 2) * base * 0.08;
    const noise = (rand() - 0.5) * base * 0.18;
    value = Math.max(base * 0.4, base + trend + weekly + noise);

    points.push({ date, value: Math.round(value) });
  }
  return points;
}

/** Acquisition counts per channel, optionally isolating one channel. */
export function getChannelData(channel = 'all') {
  return CHANNELS.map((name) => {
    const dim = channel !== 'all' && channel !== name ? 0.22 : 1;
    return { label: name, value: Math.round((600 + rand() * 2600) * dim) };
  });
}

/** Revenue split by customer segment. */
export function getSegmentData() {
  return SEGMENTS.map((s) => ({ ...s, value: Math.round(120 + rand() * 480) }));
}

/** KPI summary derived from the revenue series + a few standalone metrics. */
export function getKpis(series) {
  const total = series.reduce((a, p) => a + p.value, 0);
  const half = Math.floor(series.length / 2) || 1;
  const recent = series.slice(-half).reduce((a, p) => a + p.value, 0);
  const prior = series.slice(0, half).reduce((a, p) => a + p.value, 0) || 1;
  const revDelta = ((recent - prior) / prior) * 100;

  const sparks = () => Array.from({ length: 12 }, () => 20 + rand() * 80);

  return [
    { label: 'Revenue', value: total, format: 'currency', delta: revDelta, spark: series.slice(-12).map((p) => p.value) },
    { label: 'Active users', value: Math.round(24000 + rand() * 9000), format: 'compact', delta: 4.2 + rand() * 6, spark: sparks() },
    { label: 'Conversion', value: 3.1 + rand() * 2.4, format: 'percent', delta: (rand() - 0.4) * 4, spark: sparks() },
    { label: 'Avg. session', value: 5.4 + rand() * 3, format: 'minutes', delta: (rand() - 0.5) * 8, spark: sparks() },
  ];
}

const COMPANY = ['Northwind', 'Quanta', 'Vertex', 'Lumen', 'Halcyon', 'Arcadia', 'Meridian', 'Cobalt', 'Solstice', 'Aperture', 'Ironclad', 'Brightwave'];
const SUFFIX = ['Labs', 'Group', 'Co', 'Systems', 'Digital', 'AI', 'Cloud'];
const PLANS = ['Starter', 'Growth', 'Enterprise'];

/** A roster of accounts for the sortable table. */
export function getAccounts() {
  return COMPANY.map((c, i) => {
    const plan = PLANS[Math.floor(rand() * PLANS.length)];
    const planMult = plan === 'Enterprise' ? 9 : plan === 'Growth' ? 3 : 1;
    return {
      name: `${c} ${SUFFIX[Math.floor(rand() * SUFFIX.length)]}`,
      plan,
      mrr: Math.round((900 + rand() * 4000) * planMult),
      seats: Math.round((4 + rand() * 30) * (planMult / 2 + 0.5)),
      health: Math.round(55 + rand() * 45),
    };
  });
}
