import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { money, pct } from '../utils/format.js'

export default function Profile() {
  const { displayName, avatar, total, totalGain, STARTING_CASH, logout, resetAccount, portfolio } = useApp()
  const [confirmReset, setConfirmReset] = useState(false)
  const gainPct = (totalGain / STARTING_CASH) * 100
  const trades = portfolio.history.length

  return (
    <div className="page">
      <h2 style={{ margin: '6px 4px 12px' }}>Me 🧑‍🚀</h2>

      <div className="card center">
        <div style={{ fontSize: 64 }}>{avatar}</div>
        <h2 style={{ margin: '4px 0' }}>{displayName}</h2>
        <div className="muted">StockStars Trader</div>
      </div>

      <div className="card" style={{ marginTop: 14, display: 'flex', gap: 10, textAlign: 'center' }}>
        <div style={{ flex: 1 }}>
          <div className="muted" style={{ fontSize: 12 }}>Worth</div>
          <div style={{ fontWeight: 700 }}>{money(total)}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="muted" style={{ fontSize: 12 }}>Gain/Loss</div>
          <div style={{ fontWeight: 700 }} className={totalGain >= 0 ? 'up' : 'down'}>{pct(gainPct)}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="muted" style={{ fontSize: 12 }}>Trades</div>
          <div style={{ fontWeight: 700 }}>{trades}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="muted" style={{ fontSize: 14, marginBottom: 6 }}>🏆 Leaderboard</div>
        <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14 }}>
          Coming soon! Soon you'll be able to see who has the best portfolio of all the StockStars. ✨
        </p>
      </div>

      <div style={{ marginTop: 18 }}>
        {confirmReset ? (
          <div className="card">
            <p className="center" style={{ marginTop: 0 }}>Start over with a fresh $50,000? This erases your stocks and history.</p>
            <div className="btn-row">
              <button className="btn secondary" onClick={() => setConfirmReset(false)}>Keep playing</button>
              <button className="btn sell" onClick={() => { resetAccount(); setConfirmReset(false) }}>Reset</button>
            </div>
          </div>
        ) : (
          <button className="btn secondary" onClick={() => setConfirmReset(true)} style={{ marginBottom: 12 }}>
            🔄 Reset my account
          </button>
        )}
        <button className="btn secondary" onClick={logout}>👋 Log out</button>
      </div>
    </div>
  )
}
