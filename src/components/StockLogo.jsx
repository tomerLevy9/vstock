import { useState } from 'react'
import { logoUrl } from '../data/stocks.js'

// Company logo with a colored-initials fallback if the logo image fails to load.
export default function StockLogo({ stock, size = 46 }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div
        className="logo-fallback"
        style={{ background: stock.color, width: size, height: size }}
      >
        {stock.ticker.slice(0, 2)}
      </div>
    )
  }
  return (
    <img
      className="logo"
      src={logoUrl(stock)}
      alt={stock.name}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  )
}
