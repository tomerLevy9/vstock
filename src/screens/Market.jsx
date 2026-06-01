import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { hasRealPrices, searchSymbols } from '../services/prices.js'
import { money, pct, signClass, arrow } from '../utils/format.js'
import StockLogo from '../components/StockLogo.jsx'

export default function Market() {
  const { STOCKS, prices, priceOf, pricesLoaded, follows, isFollowing, toggleFollow, addStockBySymbol } = useApp()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('all') // 'all' | 'following'
  const [marketResults, setMarketResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const matches = (s) =>
    s.name.toLowerCase().includes(q.toLowerCase()) || s.ticker.toLowerCase().includes(q.toLowerCase())

  const followed = STOCKS.filter((s) => isFollowing(s.ticker))
  const list = (tab === 'following' ? followed : STOCKS).filter(matches)

  // Search the whole market (Finnhub) for stocks not already in our list.
  useEffect(() => {
    if (tab !== 'all' || q.trim().length < 1) {
      setMarketResults([])
      setSearching(false)
      return
    }
    let active = true
    setSearching(true)
    const id = setTimeout(async () => {
      const results = await searchSymbols(q)
      if (!active) return
      const have = new Set(STOCKS.map((s) => s.ticker))
      setMarketResults(results.filter((r) => !have.has(r.symbol)))
      setSearching(false)
    }, 400)
    return () => {
      active = false
      clearTimeout(id)
    }
  }, [q, tab, STOCKS])

  const add = async (symbol, description) => {
    setAdding(symbol)
    setError('')
    const res = await addStockBySymbol(symbol, description)
    setAdding(null)
    if (res.error) {
      setError(res.error)
      return
    }
    setMarketResults([])
    setQ('')
    setNotice(`⭐ Added ${res.stock.name} to your market!`)
    setTimeout(() => setNotice(''), 2600)
  }

  return (
    <div className="page">
      <h2 style={{ margin: '6px 4px 12px' }}>Browse Stocks 🛒</h2>

      <div className="field" style={{ marginBottom: 12 }}>
        <input placeholder="🔍 Find or add a company…" value={q} onChange={(e) => setQ(e.target.value)} autoCapitalize="none" />
      </div>

      <div className="seg">
        <button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>All</button>
        <button className={tab === 'following' ? 'active' : ''} onClick={() => setTab('following')}>
          ⭐ Following{follows.length ? ` (${follows.length})` : ''}
        </button>
      </div>

      {notice && <div className="info-box" style={{ marginBottom: 12 }}>{notice}</div>}
      {error && <div className="error-msg">{error}</div>}

      {!hasRealPrices() && (
        <div className="info-box" style={{ marginBottom: 12 }}>
          ℹ️ Showing practice prices. Add a Finnhub key to see real prices and add new stocks.
        </div>
      )}

      {/* Main list */}
      <div className="card" style={{ padding: 6 }}>
        {list.map((stock) => {
          const p = prices[stock.ticker]
          const change = p?.changePct ?? 0
          return (
            <div key={stock.ticker} className="stock-row" onClick={() => navigate(`/stock/${stock.ticker}`)}>
              <StockLogo stock={stock} />
              <div className="row-main">
                <div className="row-name">{stock.name}</div>
                <div className="row-sub">{stock.ticker}</div>
              </div>
              <div className="row-right">
                <div className="row-price">{money(priceOf(stock.ticker))}</div>
                <div className={`row-sub ${signClass(change)}`}>
                  {pricesLoaded ? `${arrow(change)} ${pct(change)}` : '…'}
                </div>
              </div>
              <button
                className="star-btn"
                onClick={(e) => { e.stopPropagation(); toggleFollow(stock.ticker) }}
                aria-label="follow"
              >
                {isFollowing(stock.ticker) ? '⭐' : '☆'}
              </button>
            </div>
          )
        })}

        {list.length === 0 && tab === 'following' && (
          <div className="empty">
            <div className="big">⭐</div>
            <p>You're not following any stocks yet.<br />Tap the ☆ star on a stock to follow it!</p>
          </div>
        )}
        {list.length === 0 && tab === 'all' && !searching && marketResults.length === 0 && (
          <div className="empty">No companies match "{q}".</div>
        )}
      </div>

      {/* Add-a-new-stock results from the wider market */}
      {tab === 'all' && q.trim().length >= 1 && (
        <>
          <div className="section-title">Add a new stock</div>
          <div className="card" style={{ padding: 6 }}>
            {searching && <div className="empty">Searching the market for "{q}"… 🔎</div>}
            {!searching && marketResults.length === 0 && (
              <div className="empty muted" style={{ padding: 18 }}>
                No new stocks found for "{q}". Try a ticker like QQQ or SPY.
              </div>
            )}
            {marketResults.map((r) => (
              <div key={r.symbol} className="stock-row">
                <div className="logo-fallback" style={{ background: '#6c5ce7' }}>{r.symbol.slice(0, 2)}</div>
                <div className="row-main">
                  <div className="row-name">{r.symbol}</div>
                  <div className="row-sub" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.description}
                  </div>
                </div>
                <button
                  className="btn"
                  style={{ width: 'auto', padding: '10px 16px', fontSize: 15 }}
                  onClick={() => add(r.symbol, r.description)}
                  disabled={adding === r.symbol}
                >
                  {adding === r.symbol ? 'Adding…' : '+ Add'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
