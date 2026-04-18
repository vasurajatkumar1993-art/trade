import { NextResponse } from 'next/server'

const ALPACA_KEY    = process.env.ALPACA_API_KEY || ''
const ALPACA_SECRET = process.env.ALPACA_API_SECRET || ''
const DATA_URL      = 'https://data.alpaca.markets'

const headers: HeadersInit = {
  'APCA-API-KEY-ID': ALPACA_KEY,
  'APCA-API-SECRET-KEY': ALPACA_SECRET,
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol    = searchParams.get('symbol')
  const timeframe = searchParams.get('timeframe') || '1Min'

  if (!symbol) {
    return NextResponse.json({ error: 'symbol required' }, { status: 400 })
  }

  if (!ALPACA_KEY || !ALPACA_SECRET) {
    return NextResponse.json({ source: 'simulated', bars: [] })
  }

  try {
    // Calculate time range based on timeframe
    const now = new Date()
    let start: Date
    let tf: string
    let limit: number

    switch (timeframe) {
      case '1m':
        tf = '1Min'
        start = new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours
        limit = 120
        break
      case '5m':
        tf = '5Min'
        start = new Date(now.getTime() - 8 * 60 * 60 * 1000) // 8 hours
        limit = 96
        break
      case '1D':
        tf = '1Day'
        start = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) // 6 months
        limit = 180
        break
      default:
        tf = '1Min'
        start = new Date(now.getTime() - 2 * 60 * 60 * 1000)
        limit = 120
    }

    const startStr = start.toISOString()
    const endStr   = now.toISOString()

    // CACHE: 1-minute charts refresh every 5 seconds, 5-min and daily refresh every 30 seconds
    const res = await fetch(
      `${DATA_URL}/v2/stocks/${encodeURIComponent(symbol)}/bars?timeframe=${tf}&start=${startStr}&end=${endStr}&limit=${limit}&feed=iex&sort=asc`,
      { headers, next: { revalidate: timeframe === '1m' ? 5 : 30 } }
    )

    if (!res.ok) {
      throw new Error(`Alpaca bars returned ${res.status}`)
    }

    const data = await res.json()
    const bars = (data.bars || []).map((bar: any) => ({
      time: new Date(bar.t).getTime(),
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    }))

    return NextResponse.json({ source: 'alpaca', bars })
  } catch (error) {
    console.error('Alpaca bars error:', error)
    return NextResponse.json({ source: 'error', bars: [] })
  }
}
