export function currency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function number(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

export function date(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export function status(value) {
  if (!value) return '-';
  return String(value)
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function percent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

export function productStatus(quantity) {
  const stock = Number(quantity || 0);
  if (stock <= 0) return 'Out of Stock';
  if (stock <= 10) return 'Low Stock';
  return 'In Stock';
}

export function lastMonthsSeries(items, dateKey, valueKey, months = 12) {
  const now = new Date();
  const buckets = Array.from({ length: months }, (_, index) => {
    const dateValue = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1);
    return {
      key: `${dateValue.getFullYear()}-${dateValue.getMonth()}`,
      label: dateValue.toLocaleString('en-US', { month: 'short' }),
      value: 0,
    };
  });

  items.forEach((item) => {
    const rawDate = item[dateKey];
    if (!rawDate) return;
    const itemDate = new Date(rawDate);
    const key = `${itemDate.getFullYear()}-${itemDate.getMonth()}`;
    const bucket = buckets.find((entry) => entry.key === key);
    if (bucket) bucket.value += Number(item[valueKey] || 0);
  });

  const max = Math.max(...buckets.map((bucket) => bucket.value), 1);
  return {
    labels: buckets.map((bucket) => bucket.label),
    values: buckets.map((bucket) => Math.max(6, Math.round((bucket.value / max) * 96))),
    raw: buckets.map((bucket) => bucket.value),
  };
}

export function indexById(items) {
  return items.reduce((lookup, item) => {
    lookup[item.id] = item;
    return lookup;
  }, {});
}
