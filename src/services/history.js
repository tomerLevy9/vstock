// Historical price data for the Day/Week/Month/Year charts on each stock.
//
// Finnhub's free tier does NOT include historical candles, so we use Twelve Data
// (twelvedata.com) when a free key is configured. Without a key we generate a
// realistic, stable demo series anchored to the stock's current price so the
// charts are always visible — and become real the moment a key is added.

import { getStock } from '../data/stocks.js'

const KEY = import.meta.env.VITE_TWELVEDATA_KEY
export const hasRealHistory = () => Boolean(KEY)

export const RANGES = [
  { key: '1D', label: 'Day' },
  { key: '1W', label: 'Week' },
  { key: '1M', label: 'Month' },
  { key: '1Y', label: 'Year' },
]

// Twelve Data request params per range.
const TD = {
  '1D': { interval: '5min', outputsize: 78 },
  '1W': { interval: '30min', outputsize: 70 },
  '1M': { interval: '1day', outputsize: 22 },
  '1Y': { interval: '1week', outputsize: 52 },
}

export async function getHistory(ticker, range, currentPrice) {
  if (hasRealHistory()) {
    try {
      const real = await fetchTwelve(ticker, range)
      if (real.length > 1) return { points: real, real: true }
    } catch {
      /* fall through to demo data */
    }
  }
  return { points: simulateHistory(ticker, range, currentPrice), real: false }
}

async function fetchTwelve(ticker, range) {
  const { interval, outputsize } = TD[range]
  const url = `https://api.twelvedata.com/time_series?symbol=${ticker}&interval=${interval}&outputsize=${outputsize}&apikey=${KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`history ${res.status}`)
  const data = await res.json()
  if (data.status === 'error' || !Array.isArray(data.values)) {
    throw new Error(data.message || 'no history')
  }
  return data.values
    .map((v) => ({ t: new Date(v.datetime).getTime(), price: Number(v.close) }))
    .filter((p) => Number.isFinite(p.price))
    .reverse() // Twelve Data returns newest-first; we want oldest-first
}

// ---- demo history (stable per ticker+range, ends at the current price) ----
const SIM = {
  '1D': { n: 78, vol: 0.004, span: 24 * 3600e3 },
  '1W': { n: 70, vol: 0.006, span: 7 * 24 * 3600e3 },
  '1M': { n: 22, vol: 0.012, span: 30 * 24 * 3600e3 },
  '1Y': { n: 52, vol: 0.03, span: 365 * 24 * 3600e3 },
}

function simulateHistory(ticker, range, currentPrice) {
  const end = currentPrice || getStock(ticker)?.base || 100
  const { n, vol, span } = SIM[range]
  const rand = mulberry32(hashStr(ticker + range))
  // Build backwards from the current price so the last point matches what's shown.
  const prices = [end]
  for (let i = 1; i < n; i++) {
    const prev = prices[prices.length - 1]
    const step = (rand() - 0.5) * 2 * vol * prev
    const driftBack = (end - prev) * 0.01
    prices.push(Math.max(0.5, prev - step - driftBack))
  }
  prices.reverse()
  const now = Date.now()
  const start = now - span
  return prices.map((price, i) => ({
    t: Math.round(start + (span * i) / (n - 1)),
    price: round2(price),
  }))
}

function hashStr(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function round2(n) {
  return Math.round(n * 100) / 100
}
