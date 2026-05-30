/**
 * ui.js — All the "chrome" interactions: theme switching, navigation, scroll
 * reveals, animated counters, command palette, pricing toggle, FAQ, toasts,
 * and the email capture form. Each piece is an isolated init function so it
 * fails gracefully if its markup is absent.
 */

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- Theme ---------------- */
export function initTheme() {
  const toggle = $('#themeToggle');
  const stored = localStorage.getItem('helios-theme');
  const theme = stored || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  apply(theme);

  toggle?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    apply(next);
    localStorage.setItem('helios-theme', next);
  });

  function apply(t) {
    document.documentElement.dataset.theme = t;
    toggle?.setAttribute('aria-pressed', String(t === 'light'));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#0a0b14' : '#f4f6fc');
  }
}

/* ---------------- Header scroll state + back to top ---------------- */
export function initScrollChrome() {
  const header = $('#siteHeader');
  const toTop = $('#toTop');
  const onScroll = () => {
    const y = scrollY;
    header?.classList.toggle('is-scrolled', y > 12);
    if (toTop) toTop.hidden = y < 600;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop?.addEventListener('click', () => scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' }));
}

/* ---------------- Mobile menu ---------------- */
export function initMobileMenu() {
  const burger = $('#navBurger');
  const menu = $('#mobileMenu');
  if (!burger || !menu) return;

  const close = () => { menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); };
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    if (open) close();
    else { menu.hidden = false; burger.setAttribute('aria-expanded', 'true'); }
  });
  $$('a', menu).forEach((a) => a.addEventListener('click', close));
}

/* ---------------- Scroll reveal ---------------- */
export function initReveal() {
  const items = $$('.reveal');
  if (prefersReduced || !('IntersectionObserver' in window)) {
    items.forEach((i) => i.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach((i) => io.observe(i));
}

/* ---------------- Animated counters ---------------- */
export function initCounters() {
  const counters = $$('.counter');
  if (!counters.length) return;

  const run = (node) => {
    const target = parseFloat(node.dataset.target);
    const decimals = parseInt(node.dataset.decimals || '0', 10);
    const prefix = node.dataset.prefix || '';
    const suffix = node.dataset.suffix || '';
    const compact = node.dataset.format === 'compact';
    const dur = prefersReduced ? 0 : 1500;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min((now - start) / dur || 1, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const val = target * eased;
      node.textContent = prefix + format(val, decimals, compact) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const format = (v, decimals, compact) => {
    if (compact) return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
    return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.5 });
  counters.forEach((c) => io.observe(c));
}

/* ---------------- Pricing billing toggle ---------------- */
export function initPricing() {
  const sw = $('#billingSwitch');
  if (!sw) return;
  sw.addEventListener('click', () => {
    const annual = sw.getAttribute('aria-checked') === 'true';
    const next = !annual;
    sw.setAttribute('aria-checked', String(next));
    $$('.plan__amount').forEach((amt) => {
      const value = next ? amt.dataset.annual : amt.dataset.monthly;
      if (value) animateNumber(amt, parseInt(amt.textContent.replace(/\D/g, ''), 10) || 0, parseInt(value, 10));
    });
  });

  function animateNumber(node, from, to) {
    if (prefersReduced) { node.textContent = to; return; }
    const start = performance.now(), dur = 350;
    const step = (now) => {
      const t = Math.min((now - start) / dur, 1);
      node.textContent = Math.round(from + (to - from) * t);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}

/* ---------------- Accordion (single-open) ---------------- */
export function initAccordion() {
  const items = $$('#accordion .accordion__item');
  items.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) items.forEach((o) => { if (o !== item) o.open = false; });
    });
  });
}

/* ---------------- Toasts ---------------- */
export function initToasts() {
  const region = $('#toastRegion');
  document.addEventListener('helios:toast', (e) => toast(e.detail));

  function toast(message) {
    if (!region) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span class="toast__dot"></span>${message}`;
    region.appendChild(t);
    setTimeout(() => {
      t.classList.add('is-leaving');
      t.addEventListener('animationend', () => t.remove());
    }, 2600);
  }
}

/* ---------------- CTA form ---------------- */
export function initForm() {
  const form = $('#ctaForm');
  if (!form) return;
  const input = $('#ctaEmail');
  const msg = $('#ctaMsg');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!valid) {
      msg.textContent = 'Please enter a valid email address.';
      msg.style.color = '#ffe3e3';
      input.focus();
      return;
    }
    msg.textContent = `Thanks! We'd send a confirmation to ${value} — this is a demo, so no email goes out. 🎉`;
    msg.style.color = '#fff';
    form.reset();
  });
}

/* ---------------- Command palette (⌘K) ---------------- */
export function initCommandPalette() {
  const cmdk = $('#cmdk');
  const trigger = $('#cmdTrigger');
  const input = $('#cmdkInput');
  const list = $('#cmdkList');
  const empty = $('#cmdkEmpty');
  if (!cmdk || !list) return;

  const commands = [
    { label: 'Go to Dashboard', hint: 'Section', icon: '📊', action: () => goto('#dashboard') },
    { label: 'Go to Features', hint: 'Section', icon: '✨', action: () => goto('#features') },
    { label: 'Go to Pricing', hint: 'Section', icon: '💳', action: () => goto('#pricing') },
    { label: 'Go to FAQ', hint: 'Section', icon: '❓', action: () => goto('#faq') },
    { label: 'Toggle theme', hint: 'Command', icon: '🌗', action: () => $('#themeToggle')?.click() },
    { label: 'Refresh dashboard data', hint: 'Command', icon: '🔄', action: () => $('#shuffleData')?.click() },
    { label: 'Back to top', hint: 'Command', icon: '⬆️', action: () => scrollTo({ top: 0, behavior: 'smooth' }) },
    { label: "View source on GitHub", hint: 'Link', icon: '🐙', action: () => document.dispatchEvent(new CustomEvent('helios:toast', { detail: 'Add your repo URL here!' })) },
  ];

  let active = 0;
  let filtered = commands;

  const open = () => {
    cmdk.hidden = false;
    input.value = '';
    filtered = commands;
    active = 0;
    render();
    requestAnimationFrame(() => input.focus());
  };
  const close = () => { cmdk.hidden = true; trigger?.focus(); };

  const render = () => {
    list.innerHTML = filtered.map((c, i) => `
      <li class="cmdk__item ${i === active ? 'is-active' : ''}" role="option" data-i="${i}" aria-selected="${i === active}">
        <span class="ic">${c.icon}</span>
        <span>${c.label}</span>
        <small>${c.hint}</small>
      </li>`).join('');
    empty.hidden = filtered.length > 0;
  };

  const goto = (sel) => {
    close();
    $(sel)?.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
  };

  trigger?.addEventListener('click', open);
  cmdk.querySelector('[data-cmdk-close]')?.addEventListener('click', close);

  input?.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    filtered = commands.filter((c) => c.label.toLowerCase().includes(q));
    active = 0;
    render();
  });

  list.addEventListener('click', (e) => {
    const li = e.target.closest('.cmdk__item');
    if (li) filtered[Number(li.dataset.i)]?.action();
  });
  list.addEventListener('pointermove', (e) => {
    const li = e.target.closest('.cmdk__item');
    if (li) { active = Number(li.dataset.i); render(); }
  });

  // Global keyboard handling
  addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); cmdk.hidden ? open() : close(); return; }
    if (cmdk.hidden) return;

    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % filtered.length; render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + filtered.length) % filtered.length; render(); }
    else if (e.key === 'Enter') { e.preventDefault(); filtered[active]?.action(); }
  });
}

/* ---------------- Footer year ---------------- */
export function initMisc() {
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
}
