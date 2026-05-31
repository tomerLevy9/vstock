import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { hasRealPrices } from '../services/prices.js'
import { money, pct, signClass, arrow } from '../utils/format.js'
import StockLogo from '../components/StockLogo.jsx'

export default function Market() {
  const { STOCKS, prices, priceOf, pricesLoaded } = useApp()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const list = STOCKS.filter(
    (s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.ticker.toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <div className="page">
      <h2 style={{ margin: '6px 4px 12px' }}>Browse Stocks 🛒</h2>
      <div className="field" style={{ marginBottom: 12 }}>
        <input placeholder="🔍 Find a company…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {!hasRealPrices() && (
        <div className="info-box" style={{ marginBottom: 12 }}>
          ℹ️ Showing practice prices. Add a Finnhub key to see real market prices.
        </div>
      )}

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
            </div>
          )
        })}
        {list.length === 0 && <div className="empty">No companies match "{q}".</div>}
      </div>
    </div>
  )
}
