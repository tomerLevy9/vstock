import { useState, useEffect } from 'react'
import { fetchFundamentals } from '../services/prices.js'

// Kid-friendly "report card" for a stock: How big is it? and Is it a good deal?
export default function StockReportCard({ ticker }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchFundamentals(ticker).then((d) => {
      if (!active) return
      setData(d)
      setLoading(false)
    })
    return () => { active = false }
  }, [ticker])

  const size = sizeInfo(data?.marketCap)
  const deal = peInfo(data?.pe)

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>🃏 Stock Report Card</div>

      {loading ? (
        <div className="empty" style={{ padding: 24 }}>Loading… 🔍</div>
      ) : (
        <>
          <ReportRow icon="📏" label="How big is it?" info={size} />
          <div style={{ height: 1, background: '#f0eef7', margin: '12px 0' }} />
          <ReportRow icon="🏷️" label="Is it a good deal?" info={deal} />
        </>
      )}

      <div className="info-box" style={{ marginTop: 12, fontSize: 13 }}>
        💡 These are just clues — no single number tells the whole story. Spread out and think long-term!
      </div>
    </div>
  )
}

function ReportRow({ icon, label, info }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div className="level-ic">{icon}</div>
      <div style={{ flex: 1 }}>
        <div className="row-name">{label}</div>
        <div className="row-sub">{info.explain}</div>
      </div>
      <div style={{ textAlign: 'right', flex: 'none' }}>
        <div className="row-price">{info.verdict}</div>
        <div className="row-sub">{info.value}</div>
      </div>
    </div>
  )
}

function sizeInfo(mc) {
  if (!mc) return { verdict: '—', value: 'not available', explain: 'Size info isn\'t available for this one.' }
  let verdict
  if (mc >= 200e9) verdict = 'Giant 🐘'
  else if (mc >= 10e9) verdict = 'Big'
  else if (mc >= 2e9) verdict = 'Medium'
  else verdict = 'Small 🐜'
  return {
    verdict,
    value: formatCap(mc),
    explain: 'Bigger companies are usually steadier. Smaller ones are riskier but can grow faster.',
  }
}

function peInfo(pe) {
  if (pe == null || pe <= 0) {
    return {
      verdict: 'No profit yet ⚠️',
      value: pe == null ? 'not available' : 'losing money',
      explain: 'This company isn\'t making a profit right now — that makes it riskier.',
    }
  }
  let verdict
  if (pe < 15) verdict = 'Cheap-ish 🏷️'
  else if (pe < 30) verdict = 'Fair'
  else if (pe < 60) verdict = 'Pricey'
  else verdict = 'Very pricey'
  return {
    verdict,
    value: `P/E ${Math.round(pe)}`,
    explain: `You pay about $${Math.round(pe)} for every $1 it earns in a year.`,
  }
}

function formatCap(n) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(0)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`
  return `$${Math.round(n)}`
}
