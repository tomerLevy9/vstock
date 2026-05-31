import { useState, useEffect } from 'react'
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts'
import { getHistory, RANGES, hasRealHistory } from '../services/history.js'
import { money, pct, signClass, arrow } from '../utils/format.js'

export default function PriceChart({ ticker, currentPrice }) {
  const [range, setRange] = useState('1M')
  const [points, setPoints] = useState(null)
  const [isReal, setIsReal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    getHistory(ticker, range, currentPrice).then(({ points, real }) => {
      if (!active) return
      setPoints(points)
      setIsReal(real)
      setLoading(false)
    })
    return () => { active = false }
    // currentPrice intentionally excluded: we don't want to refetch on every price tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, range])

  const first = points?.[0]?.price
  const last = points?.[points.length - 1]?.price
  const change = first != null ? last - first : 0
  const changePct = first ? (change / first) * 100 : 0
  const lineColor = change >= 0 ? '#18b566' : '#ef4d5a'
  const rangeLabel = RANGES.find((r) => r.key === range)?.label.toLowerCase()

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div className="muted" style={{ fontSize: 13 }}>Price history</div>
        {points && !loading && (
          <div className={`${signClass(change)}`} style={{ fontWeight: 600, fontSize: 14 }}>
            {arrow(change)} {money(Math.abs(change))} ({pct(changePct)}) this {rangeLabel}
          </div>
        )}
      </div>

      <div style={{ height: 160 }}>
        {loading || !points ? (
          <div className="empty" style={{ padding: 50 }}>Loading chart… 📈</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
              <XAxis dataKey="t" hide />
              <YAxis domain={['dataMin', 'dataMax']} hide />
              <Tooltip
                formatter={(v) => [money(v), 'Price']}
                labelFormatter={(t) => labelFor(t, range)}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow)' }}
              />
              <Line type="monotone" dataKey="price" stroke={lineColor} strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="seg" style={{ marginTop: 12, marginBottom: 0 }}>
        {RANGES.map((r) => (
          <button key={r.key} className={range === r.key ? 'active' : ''} onClick={() => setRange(r.key)}>
            {r.label}
          </button>
        ))}
      </div>

      {!hasRealHistory() && (
        <div className="muted" style={{ fontSize: 12, marginTop: 8, textAlign: 'center' }}>
          Showing demo history — add a Twelve Data key for real charts.
        </div>
      )}
    </div>
  )
}

function labelFor(t, range) {
  const d = new Date(t)
  if (range === '1D' || range === '1W') {
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
