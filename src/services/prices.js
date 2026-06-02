// Price service.
//
// Strategy to stay under free-tier rate limits:
//  - BULK quotes (browse list + held/followed background refresh): use Financial
//    Modeling Prep (FMP) batch endpoint when a key is set — ONE call for all symbols.
//  - REALTIME single-stock quote (when viewing a stock): use Finnhub.
//  - SEARCH / ADD a new stock: Finnhub.
//  - No keys at all: realistic simulated prices so the app stays playable.
//
// Everything degrades gracefully: if FMP isn't configured or fails, bulk quotes fall
// back to Finnhub per-symbol; failed fetches carry forward the last known price.

import { getStock, colorFor } from '../data/stocks.js'

const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_KEY
const FMP_KEY = import.meta.env.VITE_FMP_KEY

export const hasRealPrices = () => Boolean(FINNHUB_KEY || FMP_KEY)
export const hasBulkProvider = () => Boolean(FMP_KEY)

const FINNHUB = 'https://finnhub.io/api/v1'
const FMP = 'https://financialmodelingprep.com/api/v3'

// Simulated state (demo mode) and last-known real prices (for carry-forward).
const simPrice = {}
const lastGood = {}

function baseOf(ticker) {
  return getStock(ticker)?.base ?? 100
}

function flat(ticker) {
  return lastGood[ticker] ?? { price: baseOf(ticker), change: 0, changePct: 0 }
}

// ---- simulated (demo) prices ----------------------------------------------
function simulateOne(ticker) {
  const base = baseOf(ticker)
  if (simPrice[ticker] == null) simPrice[ticker] = base
  const drift = (Math.random() - 0.5) * base * 0.01
  const pull = (base - simPrice[ticker]) * 0.05
  simPrice[ticker] = Math.max(0.5, simPrice[ticker] + drift + pull)
  const change = simPrice[ticker] - base
  return { price: round2(simPrice[ticker]), change: round2(change), changePct: round2((change / base) * 100) }
}

function simulate(tickers) {
  return Object.fromEntries(tickers.map((t) => [t, simulateOne(t)]))
}

// ---- Finnhub (realtime single quote, search, profiles) --------------------
async function finnhubQuote(ticker) {
  const res = await fetch(`${FINNHUB}/quote?symbol=${ticker}&token=${FINNHUB_KEY}`)
  if (!res.ok) throw new Error(`finnhub quote ${ticker} -> ${res.status}`)
  const q = await res.json()
  if (!q || !q.c) throw new Error(`no price for ${ticker}`)
  return { price: round2(q.c), change: round2(q.d ?? 0), changePct: round2(q.dp ?? 0) }
}

async function finnhubProfile(ticker) {
  const res = await fetch(`${FINNHUB}/stock/profile2?symbol=${ticker}&token=${FINNHUB_KEY}`)
  if (!res.ok) return null
  const p = await res.json()
  return p && Object.keys(p).length ? p : null
}

// ---- FMP (batch bulk quotes — one call for many symbols) ------------------
async function fmpBulk(tickers) {
  const res = await fetch(`${FMP}/quote/${tickers.join(',')}?apikey=${FMP_KEY}`)
  if (!res.ok) throw new Error(`fmp bulk -> ${res.status}`)
  const arr = await res.json()
  if (!Array.isArray(arr)) throw new Error('fmp bad response')
  const out = {}
  for (const q of arr) {
    if (!q || !q.symbol || q.price == null) continue
    out[q.symbol.toUpperCase()] = {
      price: round2(q.price),
      change: round2(q.change ?? 0),
      changePct: round2(q.changesPercentage ?? 0),
    }
  }
  return out
}

// ---- public API -----------------------------------------------------------

// Bulk quotes for the browse list + held/followed background refresh.
// One FMP call for everything when available; otherwise Finnhub per-symbol.
export async function fetchAllPrices(tickers) {
  if (!tickers.length) return {}
  if (!hasRealPrices()) return simulate(tickers)

  if (FMP_KEY) {
    try {
      const bulk = await fmpBulk(tickers)
      const out = {}
      for (const t of tickers) {
        if (bulk[t]) {
          lastGood[t] = bulk[t]
          out[t] = bulk[t]
        } else {
          out[t] = flat(t) // FMP didn't return this symbol (e.g. OTC) — carry forward
        }
      }
      return out
    } catch {
      // fall through to Finnhub per-symbol
    }
  }

  if (!FINNHUB_KEY) {
    return Object.fromEntries(tickers.map((t) => [t, flat(t)]))
  }
  const entries = await Promise.all(
    tickers.map(async (t) => {
      try {
        const q = await finnhubQuote(t)
        lastGood[t] = q
        return [t, q]
      } catch {
        return [t, flat(t)]
      }
    }),
  )
  return Object.fromEntries(entries)
}

// Realtime single-stock quote (for the stock detail view). Prefers Finnhub.
export async function fetchRealtimeQuote(ticker) {
  if (FINNHUB_KEY) {
    try {
      const q = await finnhubQuote(ticker)
      lastGood[ticker] = q
      return q
    } catch {
      /* fall through */
    }
  }
  if (FMP_KEY) {
    try {
      const b = await fmpBulk([ticker])
      if (b[ticker]) {
        lastGood[ticker] = b[ticker]
        return b[ticker]
      }
    } catch {
      /* fall through */
    }
  }
  if (!hasRealPrices()) return simulateOne(ticker)
  return lastGood[ticker] ?? flat(ticker)
}

// Search the whole market for matching symbols (Finnhub).
export async function searchSymbols(query) {
  if (!FINNHUB_KEY || !query.trim()) return []
  try {
    const res = await fetch(`${FINNHUB}/search?q=${encodeURIComponent(query.trim())}&token=${FINNHUB_KEY}`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.result || [])
      .filter((r) => r.symbol && !r.symbol.includes('.') && r.type)
      .slice(0, 8)
      .map((r) => ({ symbol: r.symbol.toUpperCase(), description: r.description, type: r.type }))
  } catch {
    return []
  }
}

// Look up everything needed to add a brand-new stock (name, logo, current price).
export async function lookupStock(symbol, fallbackName) {
  const t = symbol.toUpperCase()
  if (!hasRealPrices()) return { error: 'Connect a market key to add new stocks.' }
  const quote = await fetchRealtimeQuote(t)
  if (!quote || !quote.price) return { error: `Hmm, we couldn't find a price for "${t}".` }
  const profile = FINNHUB_KEY ? await finnhubProfile(t).catch(() => null) : null
  const name = profile?.name || titleCase(fallbackName) || t
  const domain = profile?.weburl ? domainFrom(profile.weburl) : null
  const logo = profile?.logo || null
  const industry = profile?.finnhubIndustry
  return {
    stock: {
      ticker: t,
      name,
      domain,
      logo,
      color: colorFor(t),
      base: quote.price,
      blurb: industry
        ? `${name} — ${industry}. You added this one to your market! 🌟`
        : `You added ${name} to your market. Nice find! 🌟`,
      custom: true,
    },
    price: quote,
  }
}

// ---- helpers --------------------------------------------------------------
function titleCase(s) {
  if (!s) return s
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function domainFrom(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function round2(n) {
  return Math.round(n * 100) / 100
}
