import { NextResponse } from 'next/server'

const ALPACA_KEY    = process.env.ALPACA_API_KEY || ''
const ALPACA_SECRET = process.env.ALPACA_API_SECRET || ''
const DATA_URL      = 'https://data.alpaca.markets'
const TRADING_URL   = 'https://paper-api.alpaca.markets'

const headers: HeadersInit = {
  'APCA-API-KEY-ID': ALPACA_KEY,
  'APCA-API-SECRET-KEY': ALPACA_SECRET,
}

export async function GET() {
  if (!ALPACA_KEY || !ALPACA_SECRET) {
    return NextResponse.json({ source: 'simulated', stocks: [] })
  }

  try {
    // 1. Fetch most active / top movers to discover what's moving
    const moversRes = await fetch(
      `${DATA_URL}/v1beta1/screener/stocks/most-actives?by=trades&top=50`,
      { headers, next: { revalidate: 10 } }
    )

    let symbols: string[] = []

    if (moversRes.ok) {
      const moversData = await moversRes.json()
      const movers = moversData.most_actives || []
      symbols = movers.map((m: any) => m.symbol).slice(0, 40)
    }

    // Fallback symbols if screener doesn't return enough
    const fallback = ['NVDA', 'TSLA', 'AAPL', 'AMD', 'SMCI', 'PLTR', 'SOFI', 'IONQ', 'RIVN', 'MSTR']
    fallback.forEach(s => { if (!symbols.includes(s)) symbols.push(s) })
    symbols = symbols.slice(0, 50)

    // 2. Fetch snapshots for all symbols
    const symsParam = symbols.join(',')
    const snapRes = await fetch(
      `${DATA_URL}/v2/stocks/snapshots?symbols=${symsParam}&feed=iex`,
      { headers, next: { revalidate: 5 } }
    )

    if (!snapRes.ok) {
      throw new Error(`Alpaca snapshots returned ${snapRes.status}`)
    }

    const snapData = await snapRes.json()

    // 3. Normalize to our StockTicker format
    const stocks = Object.entries(snapData).map(([symbol, snap]: [string, any]) => {
      const latest    = snap.latestTrade?.p || snap.minuteBar?.c || 0
      const prevClose = snap.prevDailyBar?.c || latest
      const change    = prevClose > 0 ? ((latest - prevClose) / prevClose) * 100 : 0
      const volume    = snap.dailyBar?.v || 0
      const prevVol   = snap.prevDailyBar?.v || 1

      return {
        symbol,
        name: symbol,
        price: Math.round(latest * 100) / 100,
        prevClose: Math.round(prevClose * 100) / 100,
        changePct: Math.round(change * 100) / 100,
        afterHoursPct: 0,
        preMarketPct: 0,
        volume,
        avgVolume30d: prevVol,
        relativeVolume: Math.round((volume / Math.max(prevVol, 1)) * 100) / 100,
        float: '—',
        floatNum: 0,
        marketCap: '—',
      }
    })

    // Sort by change% descending
    stocks.sort((a: any, b: any) => b.changePct - a.changePct)

    return NextResponse.json({ source: 'alpaca', stocks })
  } catch (error) {
    console.error('Alpaca stocks error:', error)
    return NextResponse.json({ source: 'error', stocks: [] })
  }
}
