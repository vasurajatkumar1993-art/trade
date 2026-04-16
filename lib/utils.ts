import { Candle, CoinId } from './types'

export function formatUSD(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatCrypto(value: number, decimals: number): string {
  return value.toFixed(decimals)
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// Generate realistic-looking candle data for a given base price
export function generateCandles(basePrice: number, count: number): Candle[] {
  const candles: Candle[] = []
  let price = basePrice * 0.97
  const now = Date.now()
  const interval = 3600000 // 1 hour

  for (let i = 0; i < count; i++) {
    const volatility = price * 0.015
    const open = price
    const close = open + (Math.random() - 0.45) * volatility
    const high = Math.max(open, close) + Math.random() * volatility * 0.5
    const low  = Math.min(open, close) - Math.random() * volatility * 0.5

    candles.push({
      time: now - (count - i) * interval,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low:  Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    })

    price = close
  }

  return candles
}

// Simulated initial market data per coin
export function getInitialMarket() {
  return {
    BTC:  { price: 77420, change24hPct: 2.34, high24h: 78902, low24h: 74110, volume24h: '$41.2B' },
    ETH:  { price: 3245,  change24hPct: 1.87, high24h: 3312,  low24h: 3180,  volume24h: '$18.7B' },
    SOL:  { price: 168.5, change24hPct: -0.92, high24h: 174.2, low24h: 165.1, volume24h: '$4.1B' },
    AVAX: { price: 38.2,  change24hPct: 3.15, high24h: 39.8,  low24h: 36.9,  volume24h: '$890M' },
  }
}
