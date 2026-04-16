# TradeX — Bitcoin Trading Simulator

A paper trading dashboard built with Next.js 14, React, and TypeScript.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
tradex/
├── app/
│   ├── layout.tsx        # Root layout (fonts, metadata)
│   ├── globals.css       # Global styles & CSS variables
│   ├── page.tsx          # Main dashboard page (state lives here)
│   └── page.module.css   # Dashboard layout grid
├── components/
│   ├── TopBar.tsx         # Logo + paper mode badge
│   ├── BalancePanel.tsx   # Total portfolio value (USD + BTC)
│   ├── PricePanel.tsx     # BTC/USD price + 24h stats
│   ├── TradePanel.tsx     # Buy/Sell order form
│   ├── SparklineChart.tsx # 24h price sparkline (SVG)
│   └── HoldingsPanel.tsx  # BTC position + unrealised P&L
└── lib/
    ├── types.ts           # Shared TypeScript interfaces
    └── utils.ts           # formatUSD, formatBTC helpers
```

## State Architecture

All state lives in `app/page.tsx` and flows down as props:

| State        | Type        | Description                        |
|-------------|-------------|------------------------------------|
| `usdBalance` | `number`    | Available USD cash                 |
| `position`   | `Position`  | BTC held, avg buy price, trade count |
| `market`     | `MarketData`| Price, 24h change, high/low/volume |

## Trade Logic

- **Buy**: deducts `(btcAmount × price) + fee` from USD, adds BTC, recalculates avg price
- **Sell**: adds `(btcAmount × price) − fee` to USD, removes BTC
- **Fee**: 0.1% per trade
- Buttons are disabled when balance is insufficient

## Next Steps

- Connect a real BTC price API (e.g. CoinGecko, Binance WebSocket)
- Persist state with `localStorage` or a database
- Add a trade history log
- Build out a live candlestick chart with a charting library
