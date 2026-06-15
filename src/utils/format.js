export const money = (n) =>
  (n < 0 ? '-' : '') +
  '$' +
  Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const moneyShort = (n) =>
  (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })

export const pct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`

// Shares can now be fractional. Show up to 4 decimals, trimming trailing zeros.
export const formatShares = (n) => {
  const r = Math.round((n + Number.EPSILON) * 1e4) / 1e4
  return Number.isInteger(r) ? String(r) : String(r)
}
export const sharesLabel = (n) => `${formatShares(n)} ${n === 1 ? 'share' : 'shares'}`

export const signClass = (n) => (n > 0 ? 'up' : n < 0 ? 'down' : 'flat')

export const arrow = (n) => (n > 0 ? '▲' : n < 0 ? '▼' : '—')

export const dateLabel = (ts) => new Date(ts).toLocaleString('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})
