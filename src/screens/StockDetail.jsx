import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { getStock } from '../data/stocks.js'
import { money, pct, signClass, arrow } from '../utils/format.js'
import StockLogo from '../components/StockLogo.jsx'
import TradeModal from '../components/TradeModal.jsx'
import PriceChart from '../components/PriceChart.jsx'

export default function StockDetail({ onToast }) {
  const { ticker } = useParams()
  const navigate = useNavigate()
  const { prices, priceOf, portfolio, isFollowing, toggleFollow } = useApp()
  const [trade, setTrade] = useState(null) // 'buy' | 'sell' | null

  const stock = getStock(ticker)
  if (!stock) return <div className="page">Stock not found.</div>

  const price = priceOf(ticker)
  const p = prices[ticker]
  const change = p?.changePct ?? 0
  const held = portfolio.holdings[ticker]
  const owned = held?.shares || 0
  const value = owned * price
  const gain = held ? value - held.avgPrice * owned : 0

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button className="btn secondary" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <button
          className="btn secondary"
          style={{ width: 'auto', padding: '8px 16px' }}
          onClick={() => toggleFollow(ticker)}
        >
          {isFollowing(ticker) ? '⭐ Following' : '☆ Follow'}
        </button>
      </div>

      <div className="card center">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <StockLogo stock={stock} size={64} />
        </div>
        <h2 style={{ margin: '4px 0' }}>{stock.name}</h2>
        <div className="muted">{stock.ticker}</div>
        <div style={{ fontSize: 38, fontWeight: 700, margin: '8px 0 2px' }}>{money(price)}</div>
        <span className={`pill ${signClass(change)}`}>{arrow(change)} {pct(change)} today</span>
      </div>

      <PriceChart ticker={ticker} currentPrice={price} />

      <div className="info-box" style={{ marginTop: 14 }}>
        {stock.blurb}
      </div>

      {owned > 0 && (
        <div className="card" style={{ marginTop: 14, display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div className="muted" style={{ fontSize: 13 }}>You own</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{owned} {owned === 1 ? 'share' : 'shares'}</div>
            <div className="muted" style={{ fontSize: 13 }}>{money(value)}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="muted" style={{ fontSize: 13 }}>Your gain/loss</div>
            <div className={`${signClass(gain)}`} style={{ fontSize: 20, fontWeight: 700 }}>
              {arrow(gain)} {money(Math.abs(gain))}
            </div>
            <div className="muted" style={{ fontSize: 13 }}>bought at {money(held.avgPrice)}</div>
          </div>
        </div>
      )}

      <div className="btn-row" style={{ marginTop: 16 }}>
        <button className="btn buy" onClick={() => setTrade('buy')}>Buy 🎉</button>
        <button className="btn sell" onClick={() => setTrade('sell')} disabled={owned === 0}>Sell 💰</button>
      </div>

      {trade && (
        <TradeModal
          stock={stock}
          mode={trade}
          onClose={() => setTrade(null)}
          onDone={(msg) => {
            setTrade(null)
            onToast(msg)
          }}
        />
      )}
    </div>
  )
}
