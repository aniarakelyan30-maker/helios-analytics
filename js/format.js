/** format.js — Small number/string formatting helpers shared across the app. */

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const currencyCompact = new Intl.NumberFormat('en-US', { notation: 'compact', style: 'currency', currency: 'USD', maximumFractionDigits: 1 });

export function fmt(value, type) {
  switch (type) {
    case 'currency': return currencyCompact.format(value);
    case 'currencyFull': return currency.format(value);
    case 'compact': return compact.format(value);
    case 'percent': return `${value.toFixed(1)}%`;
    case 'minutes': return `${value.toFixed(1)}m`;
    default: return compact.format(value);
  }
}

export function signedPct(value) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function fmtDate(date, withYear = false) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: '2-digit' } : {}) });
}
