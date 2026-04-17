export type OrderMode = 'buy' | 'sell'

export type CoinId = 'BTC' | 'ETH' | 'SOL' | 'AVAX'

export interface CoinConfig {
  id: CoinId
  name: string
  color: string
  decimals: number
}

export const COINS: CoinConfig[] = [
  { id: 'BTC',  name: 'Bitcoin',   color: '#f0c14b', decimals: 5 },
  { id: 'ETH',  name: 'Ethereum',  color: '#627eea', decimals: 4 },
  { id: 'SOL',  name: 'Solana',    color: '#9945ff', decimals: 2 },
  { id: 'AVAX', name: 'Avalanche', color: '#e84142', decimals: 2 },
]

export interface Position {
  held: number
  avgBuyPrice: number
}

export type Positions = Record<CoinId, Position>

export interface MarketData {
  price: number
  change24hPct: number
  high24h: number
  low24h: number
  volume24h: string
}

export type MarketDataMap = Record<CoinId, MarketData>

export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
}

export interface TradeRecord {
  id: string
  timestamp: number
  coin: CoinId
  mode: OrderMode
  amount: number
  price: number
  total: number
  fee: number
}

export type AlertCondition = 'above' | 'below'

export interface PriceAlert {
  id: string
  coin: CoinId
  condition: AlertCondition
  targetPrice: number
  triggered: boolean
  createdAt: number
}

export interface Level2Entry {
  price: number
  size: number
  total: number
}

export interface Level2Data {
  bids: Level2Entry[]
  asks: Level2Entry[]
}

export type Level2Map = Record<CoinId, Level2Data>

export interface TimeSaleEntry {
  id: string
  time: number
  price: number
  size: number
  side: 'buy' | 'sell'
}

export type TimeSalesMap = Record<CoinId, TimeSaleEntry[]>

export type Timeframe = '1m' | '1H' | '4H' | '1D'
