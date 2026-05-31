// Price service: fetches real quotes from Finnhub when an API key is configured,
// otherwise produces realistic "wiggling" placeholder prices so the app is always
// playable (including outside US market hours). Also handles looking up brand-new
// stocks/ETFs the user wants to add to their market.

import { getStock, colorFor } from '../data/stocks.js'

const KEY = import.meta.env.VITE_FINNHUB_KEY
export const hasRealPrices = () => Boolean(KEY)
const API = 'https://finnhub.io/api/v1'

// Mutable simulated state so placeholder prices drift a little each refresh.
const simPrice = {}

function baseOf(ticker) {
  return getStock(ticker)?.base ?? 100
}

function simulateOne(ticker) {
  const base = baseOf(ticker)
  if (simPrice[ticker] == null) simPrice[ticker] = base
  const drift = (Math.random() - 0.5) * base * 0.01
  const pull = (base - simPrice[ticker]) * 0.05
  simPrice[ticker] = Math.max(0.5, simPrice[ticker] + drift + pull)
  const change = simPrice[ticker] - base
  return {
    price: round2(simPrice[ticker]),
    change: round2(change),
    changePct: round2((change / base) * 100),
  }
}

function simulate(tickers) {
  return Object.fromEntries(tickers.map((t) => [t, simulateOne(t)]))
}

async function fetchQuote(ticker) {
  const res = await fetch(`${API}/quote?symbol=${ticker}&token=${KEY}`)
  if (!res.ok) throw new Error(`quote ${ticker} -> ${res.status}`)
  const q = await res.json()
  if (!q || !q.c) throw new Error(`no price for ${ticker}`)
  return { price: round2(q.c), change: round2(q.d ?? 0), changePct: round2(q.dp ?? 0) }
}

async function fetchProfile(ticker) {
  const res = await fetch(`${API}/stock/profile2?symbol=${ticker}&token=${KEY}`)
  if (!res.ok) return null
  const p = await res.json()
  return p && Object.keys(p).length ? p : null
}

// Fetch quotes for the given tickers. Returns { TICKER: {price, change, changePct} }.
// Falls back to simulated prices per-ticker on any error or when no key is set.
export async function fetchAllPrices(tickers) {
  if (!tickers.length) return {}
  if (!hasRealPrices()) return simulate(tickers)
  const entries = await Promise.all(
    tickers.map(async (t) => {
      try {
        return [t, await fetchQuote(t)]
      } catch {
        return [t, simulateOne(t)]
      }
    }),
  )
  return Object.fromEntries(entries)
}

// Search the whole market for matching symbols (for the "add a stock" feature).
export async function searchSymbols(query) {
  if (!hasRealPrices() || !query.trim()) return []
  try {
    const res = await fetch(`${API}/search?q=${encodeURIComponent(query.trim())}&token=${KEY}`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.result || [])
      .filter((r) => r.symbol && !r.symbol.includes('.') && r.type) // keep simple US symbols
      .slice(0, 8)
      .map((r) => ({ symbol: r.symbol.toUpperCase(), description: r.description, type: r.type }))
  } catch {
    return []
  }
}

// Look up everything we need to add a brand-new stock: name, logo, current price.
// `fallbackName` is the description from search, used when there's no company profile
// (common for ETFs like QQQ).
export async function lookupStock(symbol, fallbackName) {
  const t = symbol.toUpperCase()
  if (!hasRealPrices()) {
    return { error: 'Connect a market key to add new stocks.' }
  }
  let quote
  try {
    quote = await fetchQuote(t)
  } catch {
    return { error: `Hmm, we couldn't find a price for "${t}".` }
  }
  const profile = await fetchProfile(t).catch(() => null)
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

function titleCase(s) {
  if (!s) return s
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
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
