import { NextResponse } from 'next/server'

const ALPACA_KEY    = process.env.ALPACA_API_KEY || ''
const ALPACA_SECRET = process.env.ALPACA_API_SECRET || ''
const FINNHUB_KEY   = process.env.FINNHUB_API_KEY || ''
const DATA_URL      = 'https://data.alpaca.markets'

const alpacaHeaders: HeadersInit = {
  'APCA-API-KEY-ID': ALPACA_KEY,
  'APCA-API-SECRET-KEY': ALPACA_SECRET,
}

// In-memory cache for float data (doesn't change frequently)
const floatCache: Record<string, { float: string; floatNum: number; marketCap: string; name: string; ts: number }> = {}
const FLOAT_CACHE_TTL = 3600000 // 1 hour

async function getFloatData(symbol: string): Promise<{ float: string; floatNum: number; marketCap: string; name: string }> {
  // Check cache
  const cached = floatCache[symbol]
  if (cached && Date.now() - cached.ts < FLOAT_CACHE_TTL) {
    return cached
  }

  if (!FINNHUB_KEY) {
    return { float: '—', floatNum: 0, marketCap: '—', name: symbol }
  }

  try {
    // Finnhub company profile2 endpoint — free tier, has shares outstanding + market cap
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_KEY}`,
      { next: { revalidate: 3600 } }
    )

    if (!res.ok) return { float: '—', floatNum: 0, marketCap: '—', name: symbol }

    const data = await res.json()
    const sharesOut = data.shareOutstanding || 0 // in millions
    const mktCap = data.marketCapitalization || 0 // in millions
    const companyName = data.name || symbol

    const floatNum = sharesOut * 1e6
    const floatStr = formatNum(floatNum)
    const mcStr = formatNum(mktCap * 1e6)

    const result = { float: floatStr, floatNum, marketCap: mcStr, name: companyName }
    floatCache[symbol] = { ...result, ts: Date.now() }
    return result
  } catch {
    return { float: '—', floatNum: 0, marketCap: '—', name: symbol }
  }
}

function formatNum(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T'
  if (n >= 1e9)  return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6)  return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3)  return (n / 1e3).toFixed(0) + 'K'
  return n.toString()
}

export async function GET() {
  if (!ALPACA_KEY || !ALPACA_SECRET) {
    return NextResponse.json({ source: 'simulated', stocks: [] })
  }

  try {
    // 1. Discover active stocks
    const moversRes = await fetch(
      `${DATA_URL}/v1beta1/screener/stocks/most-actives?by=trades&top=50`,
      { headers: alpacaHeaders, next: { revalidate: 10 } }
    )

    let symbols: string[] = []
    if (moversRes.ok) {
      const moversData = await moversRes.json()
      symbols = (moversData.most_actives || []).map((m: any) => m.symbol).slice(0, 40)
    }

    const fallback = ['NVDA', 'TSLA', 'AAPL', 'AMD', 'SMCI', 'PLTR', 'SOFI', 'IONQ', 'RIVN', 'MSTR']
    fallback.forEach(s => { if (!symbols.includes(s)) symbols.push(s) })
    symbols = symbols.slice(0, 50)

    // 2. Fetch price snapshots
    const snapRes = await fetch(
      `${DATA_URL}/v2/stocks/snapshots?symbols=${symbols.join(',')}&feed=iex`,
      { headers: alpacaHeaders, next: { revalidate: 5 } }
    )

    if (!snapRes.ok) throw new Error(`Alpaca snapshots returned ${snapRes.status}`)
    const snapData = await snapRes.json()

    // 3. Enrich with float data (batch — max 5 at a time to respect Finnhub rate limits)
    // Only fetch float for top gainers to stay within limits
    const snapEntries = Object.entries(snapData)
    const topSymbols = snapEntries
      .map(([sym, snap]: [string, any]) => {
        const latest = snap.latestTrade?.p || snap.minuteBar?.c || 0
        const prev = snap.prevDailyBar?.c || latest
        return { sym, changePct: prev > 0 ? ((latest - prev) / prev) * 100 : 0 }
      })
      .sort((a, b) => b.changePct - a.changePct)
      .slice(0, 20)
      .map(s => s.sym)

    // Fetch float for top 20 in parallel batches of 5
    const floatResults: Record<string, Awaited<ReturnType<typeof getFloatData>>> = {}
    for (let i = 0; i < topSymbols.length; i += 5) {
      const batch = topSymbols.slice(i, i + 5)
      const results = await Promise.all(batch.map(s => getFloatData(s)))
      batch.forEach((sym, j) => { floatResults[sym] = results[j] })
    }

    // 4. Build response
    const stocks = snapEntries.map(([symbol, snap]: [string, any]) => {
      const latest    = snap.latestTrade?.p || snap.minuteBar?.c || 0
      const prevClose = snap.prevDailyBar?.c || latest
      const change    = prevClose > 0 ? ((latest - prevClose) / prevClose) * 100 : 0
      const volume    = snap.dailyBar?.v || 0
      const prevVol   = snap.prevDailyBar?.v || 1
      const fd        = floatResults[symbol]

      return {
        symbol,
        name: fd?.name || symbol,
        price: Math.round(latest * 100) / 100,
        prevClose: Math.round(prevClose * 100) / 100,
        changePct: Math.round(change * 100) / 100,
        afterHoursPct: 0,
        preMarketPct: 0,
        volume,
        avgVolume30d: prevVol,
        relativeVolume: Math.round((volume / Math.max(prevVol, 1)) * 100) / 100,
        float: fd?.float || '—',
        floatNum: fd?.floatNum || 0,
        marketCap: fd?.marketCap || '—',
      }
    })

    stocks.sort((a: any, b: any) => b.changePct - a.changePct)

    return NextResponse.json({ source: 'alpaca', stocks })
  } catch (error) {
    console.error('Stocks API error:', error)
    return NextResponse.json({ source: 'error', stocks: [] })
  }
}
