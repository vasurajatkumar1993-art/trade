import { Candle, CoinId, Level2Data, Level2Entry, TimeSaleEntry, Timeframe } from './types'

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

// Timeframe intervals in ms
export const TF_INTERVALS: Record<Timeframe, number> = {
  '1m': 60000,
  '1H': 3600000,
  '4H': 14400000,
  '1D': 86400000,
}

export function generateCandles(basePrice: number, count: number, tf: Timeframe = '1H'): Candle[] {
  const candles: Candle[] = []
  let price = basePrice * 0.97
  const now = Date.now()
  const interval = TF_INTERVALS[tf]

  // Scale volatility to timeframe
  const volScale = tf === '1m' ? 0.003 : tf === '1H' ? 0.015 : tf === '4H' ? 0.025 : 0.04
  const baseVol = tf === '1m' ? 50 : tf === '1H' ? 400 : tf === '4H' ? 1200 : 3000

  for (let i = 0; i < count; i++) {
    const volatility = price * volScale
    const open = price
    const close = open + (Math.random() - 0.45) * volatility
    const high = Math.max(open, close) + Math.random() * volatility * 0.5
    const low  = Math.min(open, close) - Math.random() * volatility * 0.5
    const volume = Math.round(baseVol * (0.3 + Math.random() * 1.4))

    candles.push({
      time: now - (count - i) * interval,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low:  Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    })

    price = close
  }

  return candles
}

// Simulated market maker names
const MAKERS = ['CITI', 'GSCO', 'JPMC', 'MSCO', 'BARX', 'BOFA', 'UBSS', 'DBAB', 'NOMS', 'HSBC', 'RBCC', 'ARCA']

function randomMaker(): string {
  return MAKERS[Math.floor(Math.random() * MAKERS.length)]
}

// Generate simulated Level 2 order book
export function generateLevel2(currentPrice: number, depth: number = 12): Level2Data {
  const bids: Level2Entry[] = []
  const asks: Level2Entry[] = []

  const tickSize = currentPrice > 1000 ? 10 : currentPrice > 100 ? 1 : 0.1
  let bidTotal = 0
  let askTotal = 0

  for (let i = 1; i <= depth; i++) {
    const bidSize = Math.round((Math.random() * 3 + 0.1) * 1000) / 1000
    const askSize = Math.round((Math.random() * 3 + 0.1) * 1000) / 1000
    bidTotal += bidSize
    askTotal += askSize

    bids.push({
      price: Math.round((currentPrice - i * tickSize) * 100) / 100,
      size: bidSize,
      total: Math.round(bidTotal * 1000) / 1000,
      maker: randomMaker(),
    })
    asks.push({
      price: Math.round((currentPrice + i * tickSize) * 100) / 100,
      size: askSize,
      total: Math.round(askTotal * 1000) / 1000,
      maker: randomMaker(),
    })
  }

  return { bids, asks }
}

// Generate simulated Time & Sales tape
export function generateTimeSales(currentPrice: number, count: number = 30): TimeSaleEntry[] {
  const entries: TimeSaleEntry[] = []
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    const offset = currentPrice * 0.001
    const price = currentPrice + (Math.random() - 0.5) * offset * 2
    entries.push({
      id: uid(),
      time: now - i * (Math.random() * 3000 + 500),
      price: Math.round(price * 100) / 100,
      size: Math.round((Math.random() * 2 + 0.001) * 10000) / 10000,
      side: Math.random() > 0.5 ? 'buy' : 'sell',
    })
  }

  return entries
}

// Update Level 2 with small random shifts
export function tickLevel2(prev: Level2Data, currentPrice: number): Level2Data {
  const tickSize = currentPrice > 1000 ? 10 : currentPrice > 100 ? 1 : 0.1

  const bids = prev.bids.map((b, i) => {
    const sizeDelta = (Math.random() - 0.5) * 0.3
    const newSize = Math.max(0.01, b.size + sizeDelta)
    return {
      price: Math.round((currentPrice - (i + 1) * tickSize) * 100) / 100,
      size: Math.round(newSize * 1000) / 1000,
      total: 0,
      maker: Math.random() > 0.7 ? randomMaker() : b.maker,
    }
  })

  const asks = prev.asks.map((a, i) => {
    const sizeDelta = (Math.random() - 0.5) * 0.3
    const newSize = Math.max(0.01, a.size + sizeDelta)
    return {
      price: Math.round((currentPrice + (i + 1) * tickSize) * 100) / 100,
      size: Math.round(newSize * 1000) / 1000,
      total: 0,
      maker: Math.random() > 0.7 ? randomMaker() : a.maker,
    }
  })

  // Recalc cumulative totals
  let bt = 0
  bids.forEach(b => { bt += b.size; b.total = Math.round(bt * 1000) / 1000 })
  let at = 0
  asks.forEach(a => { at += a.size; a.total = Math.round(at * 1000) / 1000 })

  return { bids, asks }
}

// Add a new time & sale entry
export function addTimeSale(prev: TimeSaleEntry[], currentPrice: number): TimeSaleEntry[] {
  const offset = currentPrice * 0.001
  const entry: TimeSaleEntry = {
    id: uid(),
    time: Date.now(),
    price: Math.round((currentPrice + (Math.random() - 0.5) * offset * 2) * 100) / 100,
    size: Math.round((Math.random() * 1.5 + 0.001) * 10000) / 10000,
    side: Math.random() > 0.5 ? 'buy' : 'sell',
  }
  return [entry, ...prev].slice(0, 60)
}

export function getInitialMarket() {
  return {
    BTC:  { price: 77420, change24hPct: 2.34, high24h: 78902, low24h: 74110, volume24h: '$41.2B' },
    ETH:  { price: 3245,  change24hPct: 1.87, high24h: 3312,  low24h: 3180,  volume24h: '$18.7B' },
    SOL:  { price: 168.5, change24hPct: -0.92, high24h: 174.2, low24h: 165.1, volume24h: '$4.1B' },
    AVAX: { price: 38.2,  change24hPct: 3.15, high24h: 39.8,  low24h: 36.9,  volume24h: '$890M' },
  }
}
