import { useNavigate } from 'react-router-dom'
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts'
import { useApp } from '../context/AppContext.jsx'
import { getStock } from '../data/stocks.js'
import { money, moneyShort, pct, signClass, arrow, sharesLabel } from '../utils/format.js'
import StockLogo from '../components/StockLogo.jsx'

export default function Portfolio() {
  const { portfolio, prices, priceOf, STARTING_CASH, total, totalGain, stocksValue, currentLevel } = useApp()
  const navigate = useNavigate()

  const gainPct = (totalGain / STARTING_CASH) * 100
  const holdings = Object.entries(portfolio.holdings)
  const chartData = portfolio.snapshots.map((s) => ({ at: s.at, value: s.value }))

  return (
    <div className="page">
      <div className="hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="label">Your total worth</div>
          <span className="hero-level">{currentLevel.icon} {currentLevel.name}</span>
        </div>
        <div className="value">{money(total)}</div>
        <span className={`chip`}>
          {arrow(totalGain)} {money(Math.abs(totalGain))} ({pct(gainPct)})
        </span>
        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.9 }}>
          {totalGain > 0
            ? "You're up! Great trading! 🎉"
            : totalGain < 0
              ? 'Down a bit — markets go up and down. Hang in there! 💪'
              : 'Buy your first stock to get started! 🚀'}
        </div>
      </div>

      {chartData.length > 1 && (
        <div className="card" style={{ marginTop: 14, paddingBottom: 6 }}>
          <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>Your money over time</div>
          <div style={{ height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <YAxis domain={['dataMin', 'dataMax']} hide />
                <Tooltip
                  formatter={(v) => money(v)}
                  labelFormatter={() => ''}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow)' }}
                />
                <Line type="monotone" dataKey="value" stroke="#6c5ce7" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 14, display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div className="muted" style={{ fontSize: 12 }}>💵 Cash</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{money(portfolio.cash)}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="muted" style={{ fontSize: 12 }}>📈 In stocks</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{money(stocksValue)}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="muted" style={{ fontSize: 12 }}>🏆 Total profit</div>
          <div className={signClass(totalGain)} style={{ fontSize: 18, fontWeight: 700 }}>
            {totalGain >= 0 ? '+' : '-'}{money(Math.abs(totalGain))}
          </div>
        </div>
      </div>

      <div className="section-title">My Stocks</div>
      {holdings.length === 0 ? (
        <div className="card empty">
          <div className="big">🪙</div>
          <p>You don't own any stocks yet.<br />Tap below to go shopping!</p>
          <button className="btn" onClick={() => navigate('/market')}>Browse Stocks 🛒</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 6 }}>
          {holdings.map(([ticker, h]) => {
            const stock = getStock(ticker)
            const price = priceOf(ticker)
            const value = price * h.shares
            const cost = h.avgPrice * h.shares
            const gain = value - cost
            const gp = (gain / cost) * 100
            return (
              <div key={ticker} className="stock-row" onClick={() => navigate(`/stock/${ticker}`)}>
                <StockLogo stock={stock} />
                <div className="row-main">
                  <div className="row-name">{stock.name}</div>
                  <div className="row-sub">{sharesLabel(h.shares)} · {money(price)}</div>
                </div>
                <div className="row-right">
                  <div className="row-price">{money(value)}</div>
                  <div className={`row-sub ${signClass(gain)}`}>{arrow(gain)} {pct(gp)}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
