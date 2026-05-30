/**
 * dashboard.js — Wires the interactive demo together: state, rendering, and
 * the toolbar/table event handlers. Single source of truth lives in `state`.
 */

import { reseed, getRevenueSeries, getChannelData, getSegmentData, getKpis, getAccounts } from './data.js';
import { renderAreaChart, renderBarChart, renderDonutChart, sparklineSVG } from './charts.js';
import { fmt, signedPct, fmtDate } from './format.js';

const state = {
  range: 7,
  channel: 'all',
  sort: { key: 'mrr', dir: 'desc' },
  accounts: [],
};

const $ = (sel, ctx = document) => ctx.querySelector(sel);

function renderKpis(series) {
  const grid = $('#kpiGrid');
  if (!grid) return;
  const kpis = getKpis(series);
  grid.innerHTML = kpis.map((k) => {
    const up = k.delta >= 0;
    const arrow = up ? '▲' : '▼';
    return `
      <div class="kpi">
        <span class="kpi__label">${k.label}</span>
        <span class="kpi__value">${fmt(k.value, k.format)}</span>
        <span class="kpi__delta ${up ? 'up' : 'down'}">${arrow} ${signedPct(k.delta).replace('+', '').replace('-', '')}</span>
        ${sparklineSVG(k.spark, up ? 'var(--success)' : 'var(--danger)')}
      </div>`;
  }).join('');
}

function renderTable() {
  const tbody = $('#accountsTable tbody');
  if (!tbody) return;
  const { key, dir } = state.sort;
  const sorted = [...state.accounts].sort((a, b) => {
    const av = a[key], bv = b[key];
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
    return dir === 'asc' ? cmp : -cmp;
  });

  tbody.innerHTML = sorted.map((a) => `
    <tr>
      <td>${a.name}</td>
      <td><span class="plan-pill">${a.plan}</span></td>
      <td class="is-num">${fmt(a.mrr, 'currencyFull')}</td>
      <td class="is-num">${a.seats}</td>
      <td class="is-num">
        <span class="health-bar">
          ${a.health}
          <span class="health-bar__track"><span class="health-bar__fill" style="width:${a.health}%"></span></span>
        </span>
      </td>
    </tr>`).join('');

  // Reflect sort state in headers
  document.querySelectorAll('#accountsTable th').forEach((th) => {
    if (th.dataset.sort === key) th.dataset.dir = dir;
    else th.removeAttribute('data-dir');
  });
}

function renderAll() {
  const series = getRevenueSeries(state.range, state.channel);
  renderAreaChart($('#revenueChart'), series);
  renderBarChart($('#channelChart'), getChannelData(state.channel));
  renderDonutChart($('#segmentChart'), getSegmentData());
  renderKpis(series);

  const sub = $('#revenueSub');
  if (sub) {
    const labels = { 7: 'Last 7 days', 30: 'Last 30 days', 90: 'Last 90 days', 365: 'Last 12 months' };
    sub.textContent = `${labels[state.range]} · ${state.channel === 'all' ? 'All channels' : state.channel}`;
  }
}

export function initDashboard() {
  const app = $('#dashboardApp');
  if (!app) return;

  state.accounts = getAccounts();

  // Range segmented control
  app.querySelectorAll('.seg__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      app.querySelectorAll('.seg__btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      state.range = Number(btn.dataset.range);
      renderAll();
    });
  });

  // Channel filter
  $('#channelFilter')?.addEventListener('change', (e) => {
    state.channel = e.target.value;
    renderAll();
  });

  // Refresh / reshuffle
  $('#shuffleData')?.addEventListener('click', () => {
    reseed();
    state.accounts = getAccounts();
    renderAll();
    renderTable();
    document.dispatchEvent(new CustomEvent('helios:toast', { detail: 'Data refreshed' }));
  });

  // Sortable table headers
  document.querySelectorAll('#accountsTable th.is-sortable').forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (state.sort.key === key) {
        state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sort.key = key;
        state.sort.dir = typeof state.accounts[0][key] === 'string' ? 'asc' : 'desc';
      }
      renderTable();
    });
  });

  // Defer first render until the dashboard scrolls into view (perf + nicer reveal).
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        renderAll();
        renderTable();
        obs.disconnect();
      }
    });
  }, { threshold: 0.15 });
  io.observe(app);

  // Re-render charts on resize (debounced) so SVG text/scale stays crisp.
  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(renderAll, 200);
  });
}
