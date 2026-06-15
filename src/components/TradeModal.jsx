import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { money, sharesLabel } from '../utils/format.js'
import StockLogo from './StockLogo.jsx'

const roundShares = (n) => Math.round(n * 1e4) / 1e4
const round2 = (n) => Math.round(n * 100) / 100

// Buy/sell sheet. Kids can trade by dollar amount OR by (fractional) shares.
export default function TradeModal({ stock, mode, onClose, onDone }) {
  const { priceOf, portfolio, buy, sell } = useApp()
  const isBuy = mode === 'buy'
  const price = priceOf(stock.ticker)
  const owned = portfolio.holdings[stock.ticker]?.shares || 0
  const cash = portfolio.cash

  const [inputMode, setInputMode] = useState(isBuy ? 'dollars' : 'shares')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const amt = parseFloat(amount) || 0
  let shares = inputMode === 'dollars' ? (price ? amt / price : 0) : amt
  shares = roundShares(shares)
  const cost = round2(shares * price)

  const maxShares = isBuy ? roundShares(cash / price) : owned
  const maxDollars = isBuy ? round2(cash) : round2(owned * price)

  const presets = inputMode === 'dollars' ? [10, 25, 100] : [0.5, 1, 2]
  const max = inputMode === 'dollars' ? maxDollars : maxShares

  const setPreset = (v) => {
    setError('')
    setAmount(String(Math.min(v, max)))
  }
  const setMax = () => {
    setError('')
    setAmount(String(max))
  }

  const switchMode = (m) => {
    setInputMode(m)
    setAmount('')
    setError('')
  }

  const tooMuch = isBuy ? cost > cash + 1e-6 : shares > owned + 1e-6
  const canConfirm = shares > 0 && !tooMuch

  const confirm = () => {
    if (shares <= 0) {
      setError('Enter an amount first.')
      return
    }
    const res = isBuy ? buy(stock.ticker, shares) : sell(stock.ticker, shares)
    if (res.error) {
      setError(res.error)
      return
    }
    onDone(
      isBuy
        ? `You bought ${sharesLabel(shares)} of ${stock.name} for ${money(cost)}! 🎉`
        : `You sold ${sharesLabel(shares)} of ${stock.name} for ${money(cost)}! 💰`,
    )
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="stock-row" style={{ padding: 0, marginBottom: 12 }}>
          <StockLogo stock={stock} />
          <div className="row-main">
            <div className="row-name">{isBuy ? 'Buy' : 'Sell'} {stock.name}</div>
            <div className="row-sub">{money(price)} per share</div>
          </div>
        </div>

        {/* Dollars / Shares toggle */}
        <div className="seg" style={{ marginBottom: 14 }}>
          <button className={inputMode === 'dollars' ? 'active' : ''} onClick={() => switchMode('dollars')}>
            💵 Dollars
          </button>
          <button className={inputMode === 'shares' ? 'active' : ''} onClick={() => switchMode('shares')}>
            📈 Shares
          </button>
        </div>

        {/* Amount input */}
        <div className="amount-input">
          {inputMode === 'dollars' && <span className="amount-prefix">$</span>}
          <input
            type="number"
            inputMode="decimal"
            min="0"
            placeholder="0"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError('') }}
            autoFocus
          />
        </div>

        {/* Quick amounts */}
        <div className="amt-chips">
          {presets.map((v) => (
            <button key={v} className="amt-chip" onClick={() => setPreset(v)}>
              {inputMode === 'dollars' ? `$${v}` : v}
            </button>
          ))}
          <button className="amt-chip max" onClick={setMax}>Max</button>
        </div>

        {/* Live conversion + total */}
        <div className="center" style={{ margin: '14px 0 6px' }}>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{money(cost)}</div>
          <div className="muted">
            {shares > 0 ? `${sharesLabel(shares)} @ ${money(price)}` : 'Enter an amount above'}
          </div>
        </div>

        <div className="info-box" style={{ marginBottom: 14 }}>
          {isBuy
            ? `Cash after: ${money(Math.max(0, cash - cost))}`
            : `You own ${sharesLabel(owned)}. Cash after: ${money(cash + cost)}`}
        </div>

        {error && <div className="error-msg center">{error}</div>}

        <div className="btn-row">
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className={`btn ${isBuy ? 'buy' : 'sell'}`} onClick={confirm} disabled={!canConfirm}>
            {tooMuch
              ? isBuy ? 'Not enough cash' : 'You don\'t own that much'
              : isBuy ? 'Buy 🎉' : 'Sell 💰'}
          </button>
        </div>
      </div>
    </div>
  )
}
