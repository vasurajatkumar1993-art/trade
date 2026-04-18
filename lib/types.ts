// ─── Nasdaq Stock Types ───

export interface StockTicker {
  symbol: string
  name: string
  price: number
  prevClose: number
  changePct: number
  afterHoursPct: number
  preMarketPct: number
  volume: number
  avgVolume30d: number
  relativeVolume: number
  float: string
  floatNum: number
  marketCap: string
}

export interface NewsItem {
  id: string
  time: number
  headline: string
  source: string
  symbols: string[]
  isHot: boolean
  url?: string
}

export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type ChartTimeframe = '1m' | '5m' | '1D'

// ─── Level 2 ───

export interface Level2Entry {
  price: number
  size: number
  total: number
  maker: string
}

export interface Level2Data {
  bids: Level2Entry[]
  asks: Level2Entry[]
}

// ─── Time & Sales ───

export interface TimeSaleEntry {
  id: string
  time: number
  price: number
  size: number
  side: 'buy' | 'sell'
}

// ─── Position & Order ───

export type OrderMode = 'buy' | 'sell'

export interface Position {
  held: number
  avgBuyPrice: number
  realisedPnL: number
  totalQty: number
}

export interface TradeRecord {
  id: string
  timestamp: number
  symbol: string
  mode: OrderMode
  amount: number
  price: number
  total: number
  fee: number
}

export type AlertCondition = 'above' | 'below'

export interface PriceAlert {
  id: string
  symbol: string
  condition: AlertCondition
  targetPrice: number
  triggered: boolean
  createdAt: number
}
