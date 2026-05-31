// Price service: fetches real quotes from Finnhub when an API key is configured,
// otherwise produces realistic "wiggling" placeholder prices so the app is always
// playable (including outside US market hours).

import { STOCKS, TICKERS } from '../data/stocks.js'

const KEY = import.meta.env.VITE_FINNHUB_KEY
export const hasRealPrices = () => Boolean(KEY)

const BASE = Object.fromEntries(STOCKS.map((s) => [s.ticker, s.base]))

// Mutable simulated state so placeholder prices drift a little each refresh.
const simPrice = { ...BASE }

function simulate() {
  const out = {}
  for (const t of TICKERS) {
    const base = BASE[t]
    // random walk that gently pulls back toward the base price
    const drift = (Math.random() - 0.5) * base * 0.01
    const pull = (base - simPrice[t]) * 0.05
    simPrice[t] = Math.max(0.5, simPrice[t] + drift + pull)
    const change = simPrice[t] - base
    out[t] = {
      price: round2(simPrice[t]),
      change: round2(change),
      changePct: round2((change / base) * 100),
    }
  }
  return out
}

async function fetchOne(ticker) {
  const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`quote ${ticker} -> ${res.status}`)
  const q = await res.json()
  // Finnhub: c=current, d=change, dp=percent change, pc=previous close
  if (!q || !q.c) throw new Error(`no price for ${ticker}`)
  return {
    price: round2(q.c),
    change: round2(q.d ?? 0),
    changePct: round2(q.dp ?? 0),
  }
}

// Fetch quotes for all tickers. Returns a map { TICKER: {price, change, changePct} }.
// Falls back to simulated prices on any error or when no key is set.
export async function fetchAllPrices() {
  if (!hasRealPrices()) return simulate()
  try {
    const entries = await Promise.all(
      TICKERS.map(async (t) => {
        try {
          return [t, await fetchOne(t)]
        } catch {
          return [t, simulate()[t]] // per-ticker fallback
        }
      }),
    )
    return Object.fromEntries(entries)
  } catch {
    return simulate()
  }
}

function round2(n) {
  return Math.round(n * 100) / 100
}
