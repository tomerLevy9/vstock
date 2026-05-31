export const money = (n) =>
  (n < 0 ? '-' : '') +
  '$' +
  Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const moneyShort = (n) =>
  (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })

export const pct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`

export const signClass = (n) => (n > 0 ? 'up' : n < 0 ? 'down' : 'flat')

export const arrow = (n) => (n > 0 ? '▲' : n < 0 ? '▼' : '—')

export const dateLabel = (ts) => new Date(ts).toLocaleString('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})
