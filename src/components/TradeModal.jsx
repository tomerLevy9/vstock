import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { money } from '../utils/format.js'
import StockLogo from './StockLogo.jsx'

// Buy/sell sheet. `mode` is 'buy' or 'sell'. Calls onDone(resultMessage) on success.
export default function TradeModal({ stock, mode, onClose, onDone }) {
  const { priceOf, portfolio, buy, sell } = useApp()
  const [shares, setShares] = useState(1)
  const [error, setError] = useState('')

  const price = priceOf(stock.ticker)
  const owned = portfolio.holdings[stock.ticker]?.shares || 0
  const maxAffordable = Math.floor(portfolio.cash / price)
  const maxShares = mode === 'buy' ? Math.max(maxAffordable, 0) : owned
  const total = price * shares
  const isBuy = mode === 'buy'

  const inc = () => setShares((s) => Math.min(s + 1, Math.max(maxShares, 1)))
  const dec = () => setShares((s) => Math.max(1, s - 1))

  const confirm = () => {
    const res = isBuy ? buy(stock.ticker, shares) : sell(stock.ticker, shares)
    if (res.error) {
      setError(res.error)
      return
    }
    onDone(
      isBuy
        ? `You bought ${shares} ${plural(shares)} of ${stock.name} for ${money(total)}! 🎉`
        : `You sold ${shares} ${plural(shares)} of ${stock.name} for ${money(total)}! 💰`,
    )
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="stock-row" style={{ padding: 0, marginBottom: 6 }}>
          <StockLogo stock={stock} />
          <div className="row-main">
            <div className="row-name">{isBuy ? 'Buy' : 'Sell'} {stock.name}</div>
            <div className="row-sub">{money(price)} per share</div>
          </div>
        </div>

        <div className="qty">
          <button onClick={dec} disabled={shares <= 1}>−</button>
          <div className="n">{shares}</div>
          <button onClick={inc} disabled={shares >= maxShares}>+</button>
        </div>

        <div className="center muted" style={{ marginBottom: 4 }}>
          {shares} {plural(shares)} × {money(price)}
        </div>
        <div className="center" style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          {money(total)}
        </div>

        <div className="info-box" style={{ marginBottom: 14 }}>
          {isBuy
            ? `Cash after: ${money(portfolio.cash - total)}`
            : `You own ${owned} ${plural(owned)}. Cash after: ${money(portfolio.cash + total)}`}
        </div>

        {error && <div className="error-msg center">{error}</div>}

        <div className="btn-row">
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button
            className={`btn ${isBuy ? 'buy' : 'sell'}`}
            onClick={confirm}
            disabled={maxShares < 1}
          >
            {maxShares < 1
              ? isBuy ? 'Not enough cash' : 'Nothing to sell'
              : isBuy ? 'Buy 🎉' : 'Sell 💰'}
          </button>
        </div>
      </div>
    </div>
  )
}

const plural = (n) => (n === 1 ? 'share' : 'shares')
