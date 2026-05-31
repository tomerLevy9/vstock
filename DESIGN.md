# vStock — Virtual Stock Trader for Kids 🚀📈

A fun, safe app where kids (ages 8–12) get $50,000 in pretend money and learn to
invest by buying and selling **real** company stocks at **real** market prices —
with zero real-world risk.

---

## 1. The Idea

- You sign up and get **$50,000 of virtual cash**.
- You browse **real companies kids know** (Apple, Disney, Roblox, Nintendo, Nike…)
  and see their **real, live-ish prices**.
- You **buy** shares. The price you paid is remembered (your "cost").
- Over time prices move. You watch your portfolio go **up 📈 or down 📉**.
- You decide when to **sell** and lock in your gains (or losses).
- The goal: grow your $50,000 into as much as you can — and learn how investing
  works along the way.

**Later versions add:** options trading (advanced), and a **leaderboard** to see
who has the best-performing portfolio across all players.

---

## 2. Who It's For

Kids **8–12**. That means the UI is:
- Big, colorful, rounded, friendly buttons.
- Plain language ("a *share* is a tiny piece of a company you can own").
- Built-in explanations / tooltips for every money word.
- Celebrations and a friendly mascot to make it feel like a game, not a bank app.
- Hard to mess up — clear confirmations before every trade.

---

## 3. v1 Scope (what we build first)

**In v1:**
- Username + password login & sign-up (local only).
- $50,000 starting cash.
- Browse a curated list of ~20 kid-friendly real stocks with live prices.
- Buy and sell stocks.
- Portfolio dashboard: cash, total value, total gain/loss, holdings list, and a
  value-over-time chart.
- Transaction history.
- Friendly explanations of key terms.

**NOT in v1 (planned for later):**
- Options trading (advanced mode).
- Cross-user leaderboard & social ("who's winning").
- Real backend + secure accounts (v1 stores data in the browser).

---

## 4. Screens

### Screen 1 — Welcome / Login
- Big friendly logo + mascot.
- Two tabs: **Log In** and **Sign Up**.
- Sign Up: pick a username, password, and a fun avatar.
- Log In: username + password.
- (Local-only: accounts are saved in this browser. Not real security yet — we add
  that with the real backend later.)

### Screen 2 — Home / My Portfolio (the dashboard)
- **Top:** "Hi, [name]! 👋" + your avatar.
- **Big number:** Total Portfolio Value (cash + stocks), with the total gain/loss
  shown in green ▲ or red ▼ and a kid-friendly note ("You're up $1,240! 🎉").
- **Chart:** a line chart of your portfolio value over time.
- **Cash available** to invest.
- **My Stocks:** a list of what you own — each row shows the company logo, shares
  owned, current value, and gain/loss.
- Big buttons: **Browse Stocks** and **My History**.

### Screen 3 — Market / Browse Stocks
- A grid/list of available companies: logo, name, ticker, current price, and
  today's change (▲/▼ %).
- Search/filter ("Find a company").
- Tap any company → Stock Detail.

### Screen 4 — Stock Detail
- Company logo, name, current price, today's change.
- A price chart.
- Plain-language blurb ("Disney makes movies and runs theme parks 🏰").
- "You own: X shares (worth $Y)".
- Big **Buy** and **Sell** buttons.

### Screen 5 — Buy / Sell
- Choose how many shares (or enter a dollar amount, auto-converts to shares).
- Shows the total cost and your cash after.
- Stops you if you can't afford it / don't own enough — with a kind message.
- Big **Confirm** button.

### Screen 6 — Confirmation
- A celebratory popup: "You bought 2 shares of Apple for $426! 🎉"
- Returns you to the portfolio.

### Screen 7 — History
- A simple list of every buy/sell with date, company, shares, and price.

### Screen 8 — Profile / Settings
- Username, avatar, "Reset my account" (back to $50,000).
- Placeholder for the future **Leaderboard**.

---

## 5. How Money & Trades Work (the rules)

- Everyone starts with **$50,000 cash**.
- **Buy:** cost = shares × current price. Cash goes down, you gain shares. We record
  your average buy price ("cost basis").
- **Sell:** you get shares × current price back as cash. Gain/loss = (sell price −
  your average buy price) × shares.
- **Portfolio value** = cash + (each holding's shares × current price).
- We snapshot your portfolio value over time so the chart can show your progress.
- No fractional-share complexity in v1 unless we want it — whole shares keep it simple
  for kids (open question below).

---

## 6. Stock Price Data

- **Source:** a free market-data API (recommended: **Finnhub** — free tier, real
  US stock prices, works from the browser). Needs a free API key.
- **Curated stock list (~20):** Apple (AAPL), Disney (DIS), Roblox (RBLX), Nintendo
  (NTDOY), Microsoft (MSFT), Tesla (TSLA), Netflix (NFLX), McDonald's (MCD), Nike
  (NKE), Coca-Cola (KO), Amazon (AMZN), Google (GOOGL), Spotify (SPOT), Crocs (CROX),
  Chipotle (CMG), Mattel (MAT), Hasbro (HAS), Hershey (HSY), GameStop (GME), Build-A-Bear (BBW).
- **Note on market hours:** real prices only move while the US market is open
  (weekdays ~9:30am–4pm ET). Outside those hours prices sit still. The app stays fully
  playable — you can still trade at the last known price; we just show a "Market closed 😴"
  note.

---

## 7. Tech Plan

- **Frontend:** React + Vite (same family as your other app), responsive for phone & laptop.
- **Routing:** React Router.
- **Charts:** Recharts (clean, easy line charts).
- **State + storage:** React Context, saved to the browser's `localStorage`
  (accounts, cash, holdings, history, value snapshots).
- **Styling:** a playful kid-friendly design system (rounded cards, bright accent
  colors, big tap targets).
- **Prices:** small service module that polls the market API for the stocks you're
  viewing/holding, respecting the free-tier rate limits.

When we add the leaderboard + real accounts later, we replace the `localStorage`
layer with a real backend — the screens stay the same.

---

## 8. Open Questions

1. **App name.** "vStock" is the repo name. For kids we might want something more fun —
   e.g. *StockStars*, *Money Monsters*, *TradeQuest*, *Cub Trader*, *PocketTrader*. Pick one or suggest your own.
2. **Whole shares only, or dollar amounts?** Whole shares are simpler for kids; dollar
   amounts (fractional shares) feel more modern. Recommend whole shares for v1.
3. **Mascot / theme.** Any preference for the vibe — e.g. a friendly bull mascot,
   space/rocket theme, animal theme? (Can decide during design.)
4. **API key.** Real prices need a free Finnhub key (2-min signup). We can also build
   first with placeholder prices and plug the key in after, so this never blocks us.

---

*This is the v1 design. We start by scaffolding the app and building the screens above.*
