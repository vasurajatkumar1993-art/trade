# TradeX — Nasdaq Momentum Dashboard

A real-time Nasdaq momentum trading dashboard built with Next.js 14.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Layout

```
┌─────────────────────────────────────────────────────┐
│  TopBar                                             │
├──────────┬───────────┬───────────┬──────────────────┤
│  News    │  Top      │  10%+     │  Stock Quote     │
│  Window  │  Gainers  │  Movers   │  (selected)      │
│          │           │ (click!)  │                  │
├──────────┴───────────┴───────────┴──────────────────┤
│  1 Min Chart    │  5 Min Chart    │  Daily Chart    │
│  (with volume)  │  (with volume)  │  (with volume)  │
└─────────────────────────────────────────────────────┘
```

## Features

- **News Window**: Live-updating stock news with source, timestamp, and ticker tags
- **Top Gainers**: Top 10 Nasdaq movers with change%, AH%, PM%, volume, float
- **10%+ Movers**: High-conviction setups with RVOL, float, avg volume, current volume
- **Stock Quote**: Detailed quote panel for the selected ticker
- **Triple Charts**: 1-min, 5-min, and Daily candlestick charts with volume bars
- **Live Simulation**: 15 Nasdaq stocks ticking every 2 seconds
