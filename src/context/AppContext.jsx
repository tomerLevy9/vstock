// Global app state: accounts (local-only), the logged-in user's portfolio,
// custom-added stocks, follows/favorites, live prices, and the buy/sell logic.
// Everything persists to localStorage.

import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { STOCKS as BASE_STOCKS, getStock, registerStock } from '../data/stocks.js'
import { fetchAllPrices, fetchRealtimeQuote, lookupStock } from '../services/prices.js'
import { LEVELS, ROOKIE, isLevelComplete, currentLevel as pickLevel } from '../data/levels.js'

const STARTING_CASH = 1000
const PRICE_REFRESH_MS = 60000 // every 60s — stays under Finnhub's free 60 calls/min limit

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
const CUSTOM_KEY = 'stockstars_custom_stocks'
const SNAPFIX_KEY = 'stockstars_snapfix_v2' // one-time cleanup of bug-induced chart jitter
const RESTART_KEY = 'stockstars_restart_v1' // one-time fresh restart at the new $1,000 starting cash
const portfolioKey = (u) => `stockstars_portfolio_${u}`

// Load a portfolio, applying small migrations (follows field, one-time snapshot cleanup,
// and a one-time fresh restart so everyone begins again with the new starting cash).
const loadPortfolio = (key) => {
  if (!localStorage.getItem(RESTART_KEY)) {
    localStorage.setItem(RESTART_KEY, '1')
    const fresh = freshPortfolio()
    fresh.snapshots.push({ at: Date.now(), value: STARTING_CASH })
    save(portfolioKey(key), fresh)
    return fresh
  }
  const p = load(portfolioKey(key), freshPortfolio())
  if (!p.follows) p.follows = []
  if (!p.lessonsDone) p.lessonsDone = []
  if (!p.levelsUnlocked) p.levelsUnlocked = []
  if (!localStorage.getItem(SNAPFIX_KEY)) p.snapshots = [] // drop jittery intraday history once
  return p
}

const freshPortfolio = () => ({
  cash: STARTING_CASH,
  holdings: {}, // ticker -> { shares, avgPrice }
  history: [], // { type:'buy'|'sell'|'reward', ticker, shares, price, total, at }
  snapshots: [], // { at, value } portfolio value over time
  follows: [], // tickers the user follows
  lessonsDone: [], // ids of completed Learn & Earn lessons
  levelsUnlocked: [], // ids of achievement levels reached
})

export function AppProvider({ children }) {
  const [users, setUsers] = useState(() => load(USERS_KEY, {}))
  const [username, setUsername] = useState(() => load(SESSION_KEY, null))
  const [portfolio, setPortfolio] = useState(() => (username ? loadPortfolio(username) : null))
  // Custom stocks the user added. Register them synchronously so getStock() works everywhere.
  const [customStocks, setCustomStocks] = useState(() => {
    const list = load(CUSTOM_KEY, [])
    list.forEach(registerStock)
    return list
  })
  const [prices, setPrices] = useState({})
  const [pricesLoaded, setPricesLoaded] = useState(false)
  const [levelUp, setLevelUp] = useState(null) // newly-reached level, for the celebration

  // Mark the one-time snapshot cleanup as done so it doesn't re-run next session.
  useEffect(() => {
    localStorage.setItem(SNAPFIX_KEY, '1')
  }, [])

  const allStocks = useMemo(() => [...BASE_STOCKS, ...customStocks], [customStocks])

  // Background polling only refreshes the stocks the user actually cares about
  // (held + followed). This keeps us well under the API's rate limit and leaves
  // plenty of headroom for searches/adds. The full browse list is refreshed on
  // demand via refreshAllPrices() (e.g. when the Market screen opens).
  const coreTickersRef = useRef([])
  coreTickersRef.current = [
    ...new Set([...Object.keys(portfolio?.holdings || {}), ...(portfolio?.follows || [])]),
  ]

  // Fetch prices for every stock once (used by the Market screen on mount).
  const refreshAllPrices = useCallback(async () => {
    const p = await fetchAllPrices(allStocks.map((s) => s.ticker))
    setPrices((prev) => ({ ...prev, ...p }))
    setPricesLoaded(true)
  }, [allStocks])

  // Realtime refresh for a single stock (used by the stock detail view).
  const refreshOne = useCallback(async (ticker) => {
    const q = await fetchRealtimeQuote(ticker)
    if (q) setPrices((prev) => ({ ...prev, [ticker]: q }))
  }, [])

  // ---- price polling ------------------------------------------------------
  useEffect(() => {
    let alive = true
    const tick = async () => {
      const p = await fetchAllPrices(coreTickersRef.current)
      if (!alive) return
      setPrices((prev) => ({ ...prev, ...p }))
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

  // ---- achievement levels -------------------------------------------------
  const leveledRef = useRef(false) // false until the first (silent) sync runs
  useEffect(() => {
    if (!portfolio) return
    const stats = computeStats(portfolio, prices, STARTING_CASH)
    const unlocked = portfolio.levelsUnlocked || []
    const newly = LEVELS.filter((l) => !unlocked.includes(l.id) && isLevelComplete(l, stats))
    if (!newly.length) {
      leveledRef.current = true
      return
    }
    setPortfolio((p) => ({
      ...p,
      levelsUnlocked: [...(p.levelsUnlocked || []), ...newly.map((l) => l.id)],
    }))
    // Celebrate only genuinely new unlocks (not the first load of an already-qualified account).
    if (leveledRef.current) setLevelUp(newly[newly.length - 1])
    leveledRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolio, prices])

  // Reset the "first sync" guard when switching accounts.
  useEffect(() => {
    leveledRef.current = false
  }, [username])

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
      setPortfolio(loadPortfolio(key))
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

  // ---- custom stocks (add any real stock/ETF) -----------------------------
  const addStockBySymbol = useCallback(async (symbol, fallbackName) => {
    const t = symbol.trim().toUpperCase()
    if (!t) return { error: 'Type a stock symbol.' }
    if (getStock(t)) return { error: `${t} is already in your market!` }
    const res = await lookupStock(t, fallbackName)
    if (res.error) return res
    registerStock(res.stock)
    setCustomStocks((prev) => {
      const next = [...prev, res.stock]
      save(CUSTOM_KEY, next)
      return next
    })
    setPrices((prev) => ({ ...prev, [t]: res.price }))
    return { ok: true, stock: res.stock }
  }, [])

  // ---- follows / favorites ------------------------------------------------
  const toggleFollow = useCallback((ticker) => {
    setPortfolio((p) => {
      const cur = p.follows || []
      const follows = cur.includes(ticker) ? cur.filter((x) => x !== ticker) : [...cur, ticker]
      return { ...p, follows }
    })
  }, [])

  const isFollowing = useCallback(
    (ticker) => (portfolio?.follows || []).includes(ticker),
    [portfolio],
  )

  // ---- Learn & Earn -------------------------------------------------------
  const isLessonDone = useCallback(
    (id) => (portfolio?.lessonsDone || []).includes(id),
    [portfolio],
  )

  const completeLesson = useCallback(
    (lessonId, reward) => {
      if ((portfolio?.lessonsDone || []).includes(lessonId)) return { already: true }
      setPortfolio((p) => ({
        ...p,
        cash: round2(p.cash + reward),
        lessonsDone: [...p.lessonsDone, lessonId],
        history: [{ type: 'reward', lessonId, total: round2(reward), at: Date.now() }, ...p.history],
      }))
      return { ok: true, reward }
    },
    [portfolio],
  )

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
    STOCKS: allStocks,
    users,
    username,
    displayName: username ? users[username]?.name : null,
    avatar: username ? users[username]?.avatar : null,
    portfolio,
    prices,
    pricesLoaded,
    priceOf,
    refreshAllPrices,
    refreshOne,
    stocksValue,
    total,
    totalGain,
    follows: portfolio?.follows || [],
    isFollowing,
    toggleFollow,
    lessonsDone: portfolio?.lessonsDone || [],
    isLessonDone,
    completeLesson,
    LEVELS,
    levelStats: portfolio ? computeStats(portfolio, prices, STARTING_CASH) : {},
    levelsUnlocked: portfolio?.levelsUnlocked || [],
    currentLevel: pickLevel(portfolio?.levelsUnlocked || []),
    levelUp,
    dismissLevelUp: () => setLevelUp(null),
    addStockBySymbol,
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

// Stats used to evaluate achievement-level quests.
function computeStats(portfolio, prices, startingCash) {
  const distinctBought = new Set(
    portfolio.history.filter((h) => h.type === 'buy').map((h) => h.ticker),
  ).size
  const total = totalValue(portfolio, prices)
  return {
    distinctBought,
    lessonsDone: portfolio.lessonsDone.length,
    follows: portfolio.follows.length,
    gainPct: ((total - startingCash) / startingCash) * 100,
  }
}

function round2(n) {
  return Math.round(n * 100) / 100
}
