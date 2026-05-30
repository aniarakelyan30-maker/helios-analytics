/**
 * charts.js — Hand-built SVG charts (area, bars, donut, sparkline).
 *
 * Deliberately dependency-free: every chart is produced by composing SVG
 * strings / nodes directly. This keeps the bundle tiny and demonstrates the
 * underlying geometry (path commands, polar→cartesian, scales) rather than
 * leaning on a library.
 */

import { fmt, fmtDate } from './format.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const el = (name, attrs = {}) => {
  const node = document.createElementNS(SVGNS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
};

/* ---------- Shared tooltip (single instance) ---------- */
let tip;
function tooltip() {
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'chart-tooltip';
    document.body.appendChild(tip);
  }
  return tip;
}
function showTip(html, x, y) {
  const t = tooltip();
  t.innerHTML = html;
  t.classList.add('is-visible');
  // Position above cursor, clamped to viewport.
  const rect = t.getBoundingClientRect();
  t.style.left = `${Math.min(Math.max(x - rect.width / 2, 8), innerWidth - rect.width - 8)}px`;
  t.style.top = `${y - rect.height - 14}px`;
}
function hideTip() { if (tip) tip.classList.remove('is-visible'); }

/* ---------- Build a smooth path through points (Catmull-Rom → Bézier) ---------- */
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/* ============================ AREA CHART ============================ */
export function renderAreaChart(container, series) {
  const W = 720, H = 280, pad = { t: 20, r: 16, b: 30, l: 52 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const values = series.map((p) => p.value);
  const max = Math.max(...values) * 1.1;
  const min = Math.min(...values) * 0.9;
  const x = (i) => pad.l + (i / (series.length - 1)) * innerW;
  const y = (v) => pad.t + innerH - ((v - min) / (max - min)) * innerH;

  const pts = series.map((p, i) => ({ x: x(i), y: y(p.value) }));

  const svg = el('svg', { class: 'chart-svg', viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid meet' });

  // Gradient def
  const defs = el('defs');
  const grad = el('linearGradient', { id: 'areaGrad', x1: 0, y1: 0, x2: 0, y2: 1 });
  grad.appendChild(el('stop', { offset: '0', 'stop-color': '#8b5cf6', 'stop-opacity': '0.38' }));
  grad.appendChild(el('stop', { offset: '1', 'stop-color': '#8b5cf6', 'stop-opacity': '0' }));
  defs.appendChild(grad);
  svg.appendChild(defs);

  // Horizontal gridlines + y labels
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const v = min + (max - min) * (i / ticks);
    const gy = y(v);
    svg.appendChild(el('line', { class: 'chart-grid-line', x1: pad.l, y1: gy, x2: W - pad.r, y2: gy }));
    const label = el('text', { class: 'chart-axis-label', x: pad.l - 10, y: gy + 4, 'text-anchor': 'end' });
    label.textContent = fmt(v, 'currency');
    svg.appendChild(label);
  }

  // X labels (a few)
  const step = Math.max(1, Math.floor(series.length / 6));
  series.forEach((p, i) => {
    if (i % step === 0 || i === series.length - 1) {
      const label = el('text', { class: 'chart-axis-label', x: x(i), y: H - 8, 'text-anchor': 'middle' });
      label.textContent = fmtDate(p.date);
      svg.appendChild(label);
    }
  });

  const linePath = smoothPath(pts);
  const areaPath = `${linePath} L ${pad.l + innerW} ${pad.t + innerH} L ${pad.l} ${pad.t + innerH} Z`;

  svg.appendChild(el('path', { class: 'area-fill', d: areaPath }));
  const line = el('path', { class: 'area-line', d: linePath });
  svg.appendChild(line);

  // Animate the line drawing
  requestAnimationFrame(() => {
    const len = line.getTotalLength();
    line.style.strokeDasharray = len;
    line.style.strokeDashoffset = len;
    line.style.transition = 'stroke-dashoffset 1.1s var(--ease)';
    requestAnimationFrame(() => { line.style.strokeDashoffset = '0'; });
  });

  // Hover layer: a moving dot + guide line + tooltip
  const guide = el('line', { class: 'chart-grid-line', x1: 0, y1: pad.t, x2: 0, y2: pad.t + innerH, opacity: 0, stroke: 'var(--primary)' });
  const dot = el('circle', { class: 'dot', r: 5, cx: 0, cy: 0 });
  svg.appendChild(guide);
  svg.appendChild(dot);

  const hit = el('rect', { x: pad.l, y: pad.t, width: innerW, height: innerH, fill: 'transparent', style: 'cursor:crosshair' });
  svg.appendChild(hit);

  hit.addEventListener('pointermove', (e) => {
    const box = svg.getBoundingClientRect();
    const localX = ((e.clientX - box.left) / box.width) * W;
    const i = Math.round(((localX - pad.l) / innerW) * (series.length - 1));
    const idx = Math.min(Math.max(i, 0), series.length - 1);
    const p = series[idx];
    guide.setAttribute('x1', x(idx)); guide.setAttribute('x2', x(idx)); guide.setAttribute('opacity', 0.5);
    dot.setAttribute('cx', x(idx)); dot.setAttribute('cy', y(p.value)); dot.style.opacity = 1;
    showTip(`<strong>${fmt(p.value, 'currencyFull')}</strong><br>${fmtDate(p.date, true)}`, e.clientX, e.clientY);
  });
  hit.addEventListener('pointerleave', () => { guide.setAttribute('opacity', 0); dot.style.opacity = 0; hideTip(); });

  container.replaceChildren(svg);
}

/* ============================ BAR CHART ============================ */
export function renderBarChart(container, data) {
  const W = 360, H = 260, pad = { t: 16, r: 12, b: 34, l: 12 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const max = Math.max(...data.map((d) => d.value), 1) * 1.15;
  const bw = innerW / data.length;

  const svg = el('svg', { class: 'chart-svg', viewBox: `0 0 ${W} ${H}` });

  data.forEach((d, i) => {
    const h = (d.value / max) * innerH;
    const bx = pad.l + i * bw + bw * 0.18;
    const by = pad.t + innerH - h;
    const w = bw * 0.64;

    const rect = el('rect', { class: 'bar', x: bx, y: pad.t + innerH, width: w, height: 0, rx: 7 });
    svg.appendChild(rect);
    requestAnimationFrame(() => {
      rect.style.transition = `y .7s var(--ease) ${i * 70}ms, height .7s var(--ease) ${i * 70}ms`;
      requestAnimationFrame(() => { rect.setAttribute('y', by); rect.setAttribute('height', h); });
    });

    const label = el('text', { class: 'bar-label', x: bx + w / 2, y: H - 16 });
    label.textContent = d.label;
    svg.appendChild(label);

    rect.addEventListener('pointermove', (e) => showTip(`<strong>${fmt(d.value, 'compact')}</strong><br>${d.label}`, e.clientX, e.clientY));
    rect.addEventListener('pointerleave', hideTip);
  });

  container.replaceChildren(svg);
}

/* ============================ DONUT CHART ============================ */
function polar(cx, cy, r, angle) {
  const a = (angle - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function arc(cx, cy, r, start, end) {
  const s = polar(cx, cy, r, end);
  const e = polar(cx, cy, r, start);
  const large = end - start <= 180 ? 0 : 1;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
}

export function renderDonutChart(container, data) {
  const size = 200, cx = size / 2, cy = size / 2, r = 78, stroke = 26;
  const total = data.reduce((a, d) => a + d.value, 0) || 1;

  const svg = el('svg', { class: 'chart-svg', viewBox: `0 0 ${size} ${size}`, style: 'max-width:220px;margin-inline:auto' });

  let angle = 0;
  data.forEach((d, i) => {
    const sweep = (d.value / total) * 360;
    const path = el('path', {
      class: 'donut-seg', d: arc(cx, cy, r, angle, angle + sweep - 1.5),
      fill: 'none', stroke: d.color, 'stroke-width': stroke, 'stroke-linecap': 'round',
    });
    const len = (sweep / 360) * (2 * Math.PI * r);
    path.style.strokeDasharray = `${len} 999`;
    path.style.strokeDashoffset = len;
    svg.appendChild(path);
    requestAnimationFrame(() => {
      path.style.transition = `stroke-dashoffset .8s var(--ease) ${i * 90}ms`;
      requestAnimationFrame(() => { path.style.strokeDashoffset = '0'; });
    });

    const pct = Math.round((d.value / total) * 100);
    path.addEventListener('pointermove', (e) => showTip(`<strong>${pct}%</strong><br>${d.name}`, e.clientX, e.clientY));
    path.addEventListener('pointerleave', hideTip);

    angle += sweep;
  });

  // Center labels
  const val = el('text', { class: 'donut-center-value', x: cx, y: cy - 2, 'text-anchor': 'middle', 'font-size': 26 });
  val.textContent = fmt(total, 'compact');
  const lab = el('text', { class: 'donut-center-label', x: cx, y: cy + 18, 'text-anchor': 'middle' });
  lab.textContent = 'total / mo';
  svg.appendChild(val); svg.appendChild(lab);

  // Legend
  const legend = document.createElement('ul');
  legend.className = 'donut-legend';
  data.forEach((d) => {
    const pct = Math.round((d.value / total) * 100);
    const li = document.createElement('li');
    li.innerHTML = `<span class="sw" style="background:${d.color}"></span>${d.name}<span class="val">${pct}%</span>`;
    legend.appendChild(li);
  });

  container.replaceChildren(svg, legend);
}

/* ============================ SPARKLINE ============================ */
export function sparklineSVG(values, color = 'var(--primary)') {
  const W = 90, H = 38;
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * W,
    y: H - 4 - ((v - min) / range) * (H - 8),
  }));
  const d = smoothPath(pts);
  return `<svg class="kpi__spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
  </svg>`;
}
