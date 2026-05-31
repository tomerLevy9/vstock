// Global app state: accounts (local-only), the logged-in user's portfolio,
// live prices, and the buy/sell logic. Everything persists to localStorage.

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { STOCKS, getStock } from '../data/stocks.js'
import { fetchAllPrices } from '../services/prices.js'

const STARTING_CASH = 50000
const PRICE_REFRESH_MS = 30000 // every 30s

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

// ---- localStorage helpers -------------------------------------------------
const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value))

const USERS_KEY = 'stockstars_users'
const SESSION_KEY = 'stockstars_session'
const portfolioKey = (u) => `stockstars_portfolio_${u}`

const freshPortfolio = () => ({
  cash: STARTING_CASH,
  holdings: {}, // ticker -> { shares, avgPrice }
  history: [], // { type:'buy'|'sell', ticker, shares, price, total, at }
  snapshots: [], // { at, value } portfolio value over time
})

export function AppProvider({ children }) {
  const [users, setUsers] = useState(() => load(USERS_KEY, {}))
  const [username, setUsername] = useState(() => load(SESSION_KEY, null))
  const [portfolio, setPortfolio] = useState(() =>
    username ? load(portfolioKey(username), freshPortfolio()) : null,
  )
  const [prices, setPrices] = useState({})
  const [pricesLoaded, setPricesLoaded] = useState(false)

  // ---- price polling ------------------------------------------------------
  useEffect(() => {
    let alive = true
    const tick = async () => {
      const p = await fetchAllPrices()
      if (!alive) return
      setPrices(p)
      setPricesLoaded(true)
    }
    tick()
    const id = setInterval(tick, PRICE_REFRESH_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  // ---- persist portfolio whenever it changes ------------------------------
  useEffect(() => {
    if (username && portfolio) save(portfolioKey(username), portfolio)
  }, [username, portfolio])

  // ---- value snapshots (for the progress chart) ---------------------------
  const lastSnap = useRef(0)
  useEffect(() => {
    if (!portfolio || !pricesLoaded) return
    const now = Date.now()
    if (now - lastSnap.current < 20000) return // throttle to ~every 20s
    lastSnap.current = now
    setPortfolio((p) => {
      if (!p) return p
      const value = totalValue(p, prices)
      const snapshots = [...p.snapshots, { at: now, value }].slice(-500)
      return { ...p, snapshots }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prices, pricesLoaded, username])

  // ---- auth ---------------------------------------------------------------
  const signup = useCallback(
    (name, password, avatar) => {
      const key = name.trim().toLowerCase()
      if (!key) return { error: 'Please pick a username.' }
      if (users[key]) return { error: 'That username is taken. Try another!' }
      if (!password) return { error: 'Please pick a password.' }
      const nextUsers = { ...users, [key]: { name: name.trim(), password, avatar } }
      setUsers(nextUsers)
      save(USERS_KEY, nextUsers)
      const p = freshPortfolio()
      p.snapshots.push({ at: Date.now(), value: STARTING_CASH })
      save(portfolioKey(key), p)
      setUsername(key)
      save(SESSION_KEY, key)
      setPortfolio(p)
      return { ok: true }
    },
    [users],
  )

  const login = useCallback(
    (name, password) => {
      const key = name.trim().toLowerCase()
      const u = users[key]
      if (!u || u.password !== password) return { error: 'Wrong username or password.' }
      setUsername(key)
      save(SESSION_KEY, key)
      setPortfolio(load(portfolioKey(key), freshPortfolio()))
      return { ok: true }
    },
    [users],
  )

  const logout = useCallback(() => {
    setUsername(null)
    setPortfolio(null)
    localStorage.removeItem(SESSION_KEY)
  }, [])

  const resetAccount = useCallback(() => {
    if (!username) return
    const p = freshPortfolio()
    p.snapshots.push({ at: Date.now(), value: STARTING_CASH })
    setPortfolio(p)
  }, [username])

  // ---- trading ------------------------------------------------------------
  const priceOf = useCallback(
    (ticker) => prices[ticker]?.price ?? getStock(ticker)?.base ?? 0,
    [prices],
  )

  const buy = useCallback(
    (ticker, shares) => {
      shares = Math.floor(shares)
      if (shares <= 0) return { error: 'Pick at least 1 share.' }
      const price = priceOf(ticker)
      const total = price * shares
      if (total > portfolio.cash) return { error: "You don't have enough cash for that." }
      setPortfolio((p) => {
        const h = p.holdings[ticker] || { shares: 0, avgPrice: 0 }
        const newShares = h.shares + shares
        const newAvg = (h.avgPrice * h.shares + total) / newShares
        return {
          ...p,
          cash: round2(p.cash - total),
          holdings: { ...p.holdings, [ticker]: { shares: newShares, avgPrice: round2(newAvg) } },
          history: [{ type: 'buy', ticker, shares, price, total: round2(total), at: Date.now() }, ...p.history],
        }
      })
      return { ok: true, shares, total }
    },
    [portfolio, priceOf],
  )

  const sell = useCallback(
    (ticker, shares) => {
      shares = Math.floor(shares)
      if (shares <= 0) return { error: 'Pick at least 1 share.' }
      const h = portfolio.holdings[ticker]
      if (!h || h.shares < shares) return { error: "You don't own that many shares." }
      const price = priceOf(ticker)
      const total = price * shares
      setPortfolio((p) => {
        const cur = p.holdings[ticker]
        const remaining = cur.shares - shares
        const holdings = { ...p.holdings }
        if (remaining <= 0) delete holdings[ticker]
        else holdings[ticker] = { ...cur, shares: remaining }
        return {
          ...p,
          cash: round2(p.cash + total),
          holdings,
          history: [{ type: 'sell', ticker, shares, price, total: round2(total), at: Date.now() }, ...p.history],
        }
      })
      return { ok: true, shares, total }
    },
    [portfolio, priceOf],
  )

  // ---- derived ------------------------------------------------------------
  const stocksValue = portfolio ? holdingsValue(portfolio, prices) : 0
  const total = portfolio ? portfolio.cash + stocksValue : 0
  const totalGain = total - STARTING_CASH

  const value = {
    STARTING_CASH,
    STOCKS,
    users,
    username,
    displayName: username ? users[username]?.name : null,
    avatar: username ? users[username]?.avatar : null,
    portfolio,
    prices,
    pricesLoaded,
    priceOf,
    stocksValue,
    total,
    totalGain,
    signup,
    login,
    logout,
    resetAccount,
    buy,
    sell,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// ---- pure helpers ---------------------------------------------------------
function holdingsValue(portfolio, prices) {
  let sum = 0
  for (const [ticker, h] of Object.entries(portfolio.holdings)) {
    const price = prices[ticker]?.price ?? getStock(ticker)?.base ?? 0
    sum += price * h.shares
  }
  return round2(sum)
}

function totalValue(portfolio, prices) {
  return round2(portfolio.cash + holdingsValue(portfolio, prices))
}

function round2(n) {
  return Math.round(n * 100) / 100
}
