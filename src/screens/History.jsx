import { useApp } from '../context/AppContext.jsx'
import { getStock } from '../data/stocks.js'
import { getLesson } from '../data/lessons.js'
import { money, dateLabel } from '../utils/format.js'
import StockLogo from '../components/StockLogo.jsx'

export default function History() {
  const { portfolio } = useApp()
  const { history } = portfolio

  return (
    <div className="page">
      <h2 style={{ margin: '6px 4px 12px' }}>My History 📜</h2>
      {history.length === 0 ? (
        <div className="card empty">
          <div className="big">📭</div>
          <p>No trades yet. Your buys and sells will show up here!</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 6 }}>
          {history.map((t, i) => {
            if (t.type === 'reward') {
              const lesson = getLesson(t.lessonId)
              return (
                <div key={i} className="stock-row">
                  <div className="logo-fallback" style={{ background: '#6c5ce7', fontSize: 22 }}>🎓</div>
                  <div className="row-main">
                    <div className="row-name">Lesson reward</div>
                    <div className="row-sub">{lesson?.title || 'Learn & Earn'} · {dateLabel(t.at)}</div>
                  </div>
                  <div className="row-right">
                    <div className="row-price up">+{money(t.total)}</div>
                  </div>
                </div>
              )
            }
            const stock = getStock(t.ticker)
            const isBuy = t.type === 'buy'
            return (
              <div key={i} className="stock-row">
                <StockLogo stock={stock} />
                <div className="row-main">
                  <div className="row-name">
                    {isBuy ? '🟢 Bought' : '🔴 Sold'} {t.shares} {t.shares === 1 ? 'share' : 'shares'}
                  </div>
                  <div className="row-sub">{stock.name} · {dateLabel(t.at)}</div>
                </div>
                <div className="row-right">
                  <div className="row-price">{money(t.total)}</div>
                  <div className="row-sub">@ {money(t.price)}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
