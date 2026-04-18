import { StockTicker, NewsItem, Candle, ChartTimeframe, Level2Data, Level2Entry, TimeSaleEntry } from './types'

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function formatUSD(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatCompact(value: number): string {
  if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B'
  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M'
  if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K'
  return value.toString()
}

// ─── Simulated Nasdaq Stocks ───

const STOCK_DEFS: { symbol: string; name: string; basePrice: number; float: string; floatNum: number; marketCap: string }[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corp',       basePrice: 142.50, float: '2.45B', floatNum: 2450e6, marketCap: '3.49T' },
  { symbol: 'TSLA', name: 'Tesla Inc',          basePrice: 178.20, float: '3.19B', floatNum: 3190e6, marketCap: '569B' },
  { symbol: 'AAPL', name: 'Apple Inc',          basePrice: 213.40, float: '15.2B', floatNum: 15200e6, marketCap: '3.28T' },
  { symbol: 'AMD',  name: 'Advanced Micro',     basePrice: 164.80, float: '1.61B', floatNum: 1610e6, marketCap: '266B' },
  { symbol: 'SMCI', name: 'Super Micro',        basePrice: 38.70,  float: '165M',  floatNum: 165e6, marketCap: '22.8B' },
  { symbol: 'MSTR', name: 'MicroStrategy',      basePrice: 368.50, float: '13.6M', floatNum: 13.6e6, marketCap: '73.2B' },
  { symbol: 'PLTR', name: 'Palantir Tech',      basePrice: 87.20,  float: '2.13B', floatNum: 2130e6, marketCap: '198B' },
  { symbol: 'RIVN', name: 'Rivian Automotive',  basePrice: 14.30,  float: '835M',  floatNum: 835e6, marketCap: '14.3B' },
  { symbol: 'SOFI', name: 'SoFi Technologies', basePrice: 14.85,  float: '950M',  floatNum: 950e6, marketCap: '15.7B' },
  { symbol: 'IONQ', name: 'IonQ Inc',           basePrice: 32.40,  float: '168M',  floatNum: 168e6, marketCap: '7.1B' },
  { symbol: 'RGTI', name: 'Rigetti Computing',  basePrice: 11.20,  float: '158M',  floatNum: 158e6, marketCap: '2.8B' },
  { symbol: 'LUNR', name: 'Intuitive Machines', basePrice: 18.60,  float: '82M',   floatNum: 82e6, marketCap: '5.2B' },
  { symbol: 'BTOG', name: 'Bit Origin Ltd',     basePrice: 2.55,   float: '14.7M', floatNum: 14.7e6, marketCap: '45M' },
  { symbol: 'MYSE', name: 'MySE Holdings',      basePrice: 5.47,   float: '8.2M',  floatNum: 8.2e6, marketCap: '32M' },
  { symbol: 'ONFQ', name: 'OnfoQuest Inc',      basePrice: 1.52,   float: '12M',   floatNum: 12e6, marketCap: '28M' },
  { symbol: 'SECT', name: 'Sector Labs Inc',    basePrice: 3.65,   float: '6.1M',  floatNum: 6.1e6, marketCap: '22M' },
  { symbol: 'GNNX', name: 'GenNext Bio',        basePrice: 4.99,   float: '9.8M',  floatNum: 9.8e6, marketCap: '51M' },
  { symbol: 'SKKL', name: 'Skykelp Energy',     basePrice: 6.32,   float: '5.4M',  floatNum: 5.4e6, marketCap: '34M' },
  { symbol: 'ARTV', name: 'ArtivateAI Inc',     basePrice: 7.80,   float: '11.3M', floatNum: 11.3e6, marketCap: '88M' },
  { symbol: 'PLUB', name: 'PlusBridge Tech',    basePrice: 3.84,   float: '7.6M',  floatNum: 7.6e6, marketCap: '29M' },
]

export function generateStocks(): StockTicker[] {
  return STOCK_DEFS.map(s => {
    const changePct = Math.round((Math.random() * 40 - 5) * 100) / 100
    const price = Math.round(s.basePrice * (1 + changePct / 100) * 100) / 100
    const avgVol = Math.round(Math.random() * 20e6 + 500e3)
    const vol = Math.round(avgVol * (0.5 + Math.random() * 8))

    return {
      symbol: s.symbol,
      name: s.name,
      price,
      prevClose: s.basePrice,
      changePct,
      afterHoursPct: Math.round((Math.random() * 8 - 2) * 100) / 100,
      preMarketPct: Math.round((Math.random() * 6 - 1) * 100) / 100,
      volume: vol,
      avgVolume30d: avgVol,
      relativeVolume: Math.round((vol / avgVol) * 100) / 100,
      float: s.float,
      floatNum: s.floatNum,
      marketCap: s.marketCap,
    }
  })
}

export function tickStocks(prev: StockTicker[]): StockTicker[] {
  return prev.map(s => {
    const volatility = s.price * 0.003
    const delta = (Math.random() - 0.48) * volatility
    const newPrice = Math.round((s.price + delta) * 100) / 100
    const changePct = Math.round(((newPrice - s.prevClose) / s.prevClose) * 100 * 100) / 100
    const newVol = s.volume + Math.round(Math.random() * 50000)
    const relVol = Math.round((newVol / s.avgVolume30d) * 100) / 100

    return { ...s, price: newPrice, changePct, volume: newVol, relativeVolume: relVol }
  })
}

// ─── News ───

const NEWS_HEADLINES = [
  { headline: 'NVIDIA announces next-gen Blackwell Ultra GPU for AI data centers', symbols: ['NVDA'] },
  { headline: 'Tesla Cybertruck deliveries surge 340% in Q1, beating estimates', symbols: ['TSLA'] },
  { headline: 'Super Micro receives new DOJ subpoena related to accounting practices', symbols: ['SMCI'] },
  { headline: 'MicroStrategy purchases additional 12,000 BTC at $97.5K average', symbols: ['MSTR'] },
  { headline: 'Palantir wins $480M Army contract for AI battlefield analytics', symbols: ['PLTR'] },
  { headline: 'AMD unveils MI400 accelerator, targeting NVIDIA market share', symbols: ['AMD'] },
  { headline: 'Rivian partners with Volkswagen on next-gen EV software platform', symbols: ['RIVN'] },
  { headline: 'SoFi reports record Q1 revenue, raises full-year guidance', symbols: ['SOFI'] },
  { headline: 'IonQ achieves quantum advantage milestone in materials simulation', symbols: ['IONQ'] },
  { headline: 'Rigetti Computing secures $100M government quantum contract', symbols: ['RGTI'] },
  { headline: 'Bit Origin announces strategic expansion into AI computing services', symbols: ['BTOG'] },
  { headline: 'Apple reportedly developing in-house AI chip for server infrastructure', symbols: ['AAPL'] },
  { headline: 'Intuitive Machines selected for second lunar lander mission by NASA', symbols: ['LUNR'] },
  { headline: 'Nasdaq composite hits all-time high as tech rally broadens', symbols: ['NVDA', 'AAPL', 'AMD'] },
  { headline: 'Small-cap momentum continues as retail volume surges pre-market', symbols: ['BTOG', 'MYSE', 'ONFQ'] },
]

const SOURCES = ['Reuters', 'Bloomberg', 'CNBC', 'MarketWatch', 'Benzinga', 'WSJ', 'Barrons', 'SEC Filing']

export function generateNews(count: number = 8): NewsItem[] {
  const shuffled = [...NEWS_HEADLINES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map((n, i) => ({
    id: uid(),
    time: Date.now() - i * (Math.random() * 300000 + 60000),
    headline: n.headline,
    source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
    symbols: n.symbols,
    isHot: Math.random() > 0.7,
  }))
}

// ─── Candles ───

const TF_INTERVALS: Record<ChartTimeframe, number> = {
  '1m': 60000,
  '5m': 300000,
  '1D': 86400000,
}

export function generateCandles(basePrice: number, count: number, tf: ChartTimeframe = '1m'): Candle[] {
  const candles: Candle[] = []
  let price = basePrice * 0.97
  const now = Date.now()
  const interval = TF_INTERVALS[tf]
  const volScale = tf === '1m' ? 0.004 : tf === '5m' ? 0.008 : 0.04
  const baseVol = tf === '1m' ? 8000 : tf === '5m' ? 35000 : 500000

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

// ─── Level 2 ───

const MAKERS = ['CITI', 'GSCO', 'JPMC', 'MSCO', 'BARX', 'BOFA', 'UBSS', 'NOMS', 'ARCA', 'EDGX', 'BATS', 'IEX']

function randomMaker(): string {
  return MAKERS[Math.floor(Math.random() * MAKERS.length)]
}

export function generateLevel2(currentPrice: number, depth: number = 10): Level2Data {
  const bids: Level2Entry[] = []
  const asks: Level2Entry[] = []
  const tickSize = currentPrice > 100 ? 0.05 : currentPrice > 10 ? 0.02 : 0.01
  let bt = 0, at = 0

  for (let i = 1; i <= depth; i++) {
    const bs = Math.round(Math.random() * 5000 + 100)
    const as2 = Math.round(Math.random() * 5000 + 100)
    bt += bs; at += as2

    bids.push({ price: Math.round((currentPrice - i * tickSize) * 100) / 100, size: bs, total: bt, maker: randomMaker() })
    asks.push({ price: Math.round((currentPrice + i * tickSize) * 100) / 100, size: as2, total: at, maker: randomMaker() })
  }
  return { bids, asks }
}

export function tickLevel2(prev: Level2Data, currentPrice: number): Level2Data {
  const tickSize = currentPrice > 100 ? 0.05 : currentPrice > 10 ? 0.02 : 0.01

  const bids = prev.bids.map((b, i) => {
    const delta = Math.round((Math.random() - 0.5) * 400)
    return { price: Math.round((currentPrice - (i + 1) * tickSize) * 100) / 100, size: Math.max(10, b.size + delta), total: 0, maker: Math.random() > 0.75 ? randomMaker() : b.maker }
  })
  const asks = prev.asks.map((a, i) => {
    const delta = Math.round((Math.random() - 0.5) * 400)
    return { price: Math.round((currentPrice + (i + 1) * tickSize) * 100) / 100, size: Math.max(10, a.size + delta), total: 0, maker: Math.random() > 0.75 ? randomMaker() : a.maker }
  })

  let bt = 0; bids.forEach(b => { bt += b.size; b.total = bt })
  let at = 0; asks.forEach(a => { at += a.size; a.total = at })
  return { bids, asks }
}

// ─── Time & Sales ───

export function generateTimeSales(currentPrice: number, count: number = 30): TimeSaleEntry[] {
  const entries: TimeSaleEntry[] = []
  const now = Date.now()
  for (let i = 0; i < count; i++) {
    const offset = currentPrice * 0.002
    entries.push({
      id: uid(),
      time: now - i * (Math.random() * 2000 + 200),
      price: Math.round((currentPrice + (Math.random() - 0.5) * offset * 2) * 100) / 100,
      size: Math.round(Math.random() * 2000 + 10),
      side: Math.random() > 0.5 ? 'buy' : 'sell',
    })
  }
  return entries
}

export function addTimeSale(prev: TimeSaleEntry[], currentPrice: number): TimeSaleEntry[] {
  const offset = currentPrice * 0.002
  const entry: TimeSaleEntry = {
    id: uid(),
    time: Date.now(),
    price: Math.round((currentPrice + (Math.random() - 0.5) * offset * 2) * 100) / 100,
    size: Math.round(Math.random() * 1500 + 10),
    side: Math.random() > 0.5 ? 'buy' : 'sell',
  }
  return [entry, ...prev].slice(0, 60)
}
