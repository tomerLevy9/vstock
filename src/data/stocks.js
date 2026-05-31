// The curated starter list of kid-friendly real companies.
// Users can also add ANY other real stock/ETF (e.g. QQQ) from the Market page;
// those get registered at runtime so the rest of the app can look them up too.
//
// `base` is a realistic stand-in price used until live prices load (or if no API key).
// `domain` is used to fetch the company logo. `blurb` explains the company in kid terms.

export const STOCKS = [
  { ticker: 'AAPL',  name: 'Apple',        domain: 'apple.com',      color: '#7d7d7d', base: 213.40, blurb: 'Makes iPhones, iPads, Macs and AirPods. 📱' },
  { ticker: 'DIS',   name: 'Disney',       domain: 'disney.com',     color: '#1a4b9c', base: 102.15, blurb: 'Makes movies and runs theme parks. 🏰' },
  { ticker: 'RBLX',  name: 'Roblox',       domain: 'roblox.com',     color: '#e8242c', base: 41.92,  blurb: 'The online world where you play and build games. 🎮' },
  { ticker: 'NTDOY', name: 'Nintendo',     domain: 'nintendo.com',   color: '#e60012', base: 14.70,  blurb: 'Makes the Switch, Mario and Zelda games. 🍄' },
  { ticker: 'MSFT',  name: 'Microsoft',    domain: 'microsoft.com',  color: '#0078d4', base: 421.30, blurb: 'Makes Windows, Xbox and Minecraft. 🟩' },
  { ticker: 'TSLA',  name: 'Tesla',        domain: 'tesla.com',      color: '#cc0000', base: 248.50, blurb: 'Builds electric cars and batteries. 🚗⚡' },
  { ticker: 'NFLX',  name: 'Netflix',      domain: 'netflix.com',    color: '#e50914', base: 695.20, blurb: 'Streams movies and TV shows. 🍿' },
  { ticker: 'MCD',   name: "McDonald's",   domain: 'mcdonalds.com',  color: '#ffc72c', base: 295.80, blurb: 'The restaurant with burgers and fries. 🍟' },
  { ticker: 'NKE',   name: 'Nike',         domain: 'nike.com',       color: '#111111', base: 78.40,  blurb: 'Makes sneakers and sports gear. 👟' },
  { ticker: 'KO',    name: 'Coca-Cola',    domain: 'coca-cola.com',  color: '#f40000', base: 71.10,  blurb: 'Makes soda and lots of drinks. 🥤' },
  { ticker: 'AMZN',  name: 'Amazon',       domain: 'amazon.com',     color: '#ff9900', base: 186.30, blurb: 'The giant online store that delivers stuff. 📦' },
  { ticker: 'GOOGL', name: 'Google',       domain: 'google.com',     color: '#4285f4', base: 178.90, blurb: 'The search engine and maker of Android. 🔍' },
  { ticker: 'SPOT',  name: 'Spotify',      domain: 'spotify.com',    color: '#1db954', base: 472.60, blurb: 'The app for listening to music. 🎧' },
  { ticker: 'CROX',  name: 'Crocs',        domain: 'crocs.com',      color: '#7fd3d8', base: 112.20, blurb: 'Makes those comfy foam shoes. 🐊' },
  { ticker: 'CMG',   name: 'Chipotle',     domain: 'chipotle.com',   color: '#a81612', base: 58.40,  blurb: 'The restaurant with burritos and tacos. 🌯' },
  { ticker: 'MAT',   name: 'Mattel',       domain: 'mattel.com',     color: '#e2231a', base: 18.30,  blurb: 'Makes Barbie and Hot Wheels toys. 🚙' },
  { ticker: 'HAS',   name: 'Hasbro',       domain: 'hasbro.com',     color: '#00a6e2', base: 61.50,  blurb: 'Makes Nerf, Play-Doh and board games. 🎲' },
  { ticker: 'HSY',   name: 'Hershey',      domain: 'hershey.com',    color: '#6f4e37', base: 188.10, blurb: 'Makes chocolate and candy. 🍫' },
  { ticker: 'GME',   name: 'GameStop',     domain: 'gamestop.com',   color: '#e21f26', base: 23.10,  blurb: 'The store that sells video games. 🕹️' },
  { ticker: 'BBW',   name: 'Build-A-Bear', domain: 'buildabear.com', color: '#5b2d8e', base: 38.70,  blurb: 'Where you make your own teddy bear. 🧸' },
]

// Runtime registry: starts with the curated list, grows as users add custom stocks.
const BY_TICKER = Object.fromEntries(STOCKS.map((s) => [s.ticker, s]))

export function registerStock(stock) {
  if (!BY_TICKER[stock.ticker]) BY_TICKER[stock.ticker] = stock
}

export function getStock(ticker) {
  return BY_TICKER[ticker]
}

export function logoUrl(stock) {
  if (stock.logo) return stock.logo
  if (stock.domain) return `https://logo.clearbit.com/${stock.domain}`
  return '' // triggers the colored-initials fallback in StockLogo
}

// Stable color for custom-added stocks (so each gets a consistent fallback badge color).
const PALETTE = ['#6c5ce7', '#e8242c', '#1db954', '#ff9900', '#0078d4', '#e60012', '#a81612', '#5b2d8e', '#00a6e2', '#f4a000']
export function colorFor(ticker) {
  let h = 0
  for (const c of ticker) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]
}
