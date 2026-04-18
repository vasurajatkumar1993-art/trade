import { NextResponse } from 'next/server'

const FINNHUB_KEY = process.env.FINNHUB_API_KEY || ''
const FINNHUB_URL = 'https://finnhub.io/api/v1'

// Tracked symbols for company-specific news
const TRACKED_SYMBOLS = ['NVDA', 'TSLA', 'AAPL', 'AMD', 'SMCI', 'MSTR', 'PLTR', 'SOFI', 'IONQ', 'RGTI']

export async function GET() {
  if (!FINNHUB_KEY) {
    return NextResponse.json({ source: 'simulated', news: [] })
  }

  try {
    // Fetch general market news
    // CACHE: Vercel stores this response for 60 seconds before fetching fresh data
    const generalRes = await fetch(
      `${FINNHUB_URL}/news?category=general&token=${FINNHUB_KEY}`,
      { next: { revalidate: 60 } }
    )

    if (!generalRes.ok) {
      throw new Error(`Finnhub returned ${generalRes.status}`)
    }

    const generalNews = await generalRes.json()

    // Also fetch company news for top 3 tracked symbols (to stay within rate limits)
    const today = new Date()
    const from = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const toStr = today.toISOString().split('T')[0]
    const fromStr = from.toISOString().split('T')[0]

    const companyPromises = TRACKED_SYMBOLS.slice(0, 3).map(async (sym) => {
      try {
        const res = await fetch(
          // CACHE: Company news refreshes every 120 seconds (2 minutes)
          `${FINNHUB_URL}/company-news?symbol=${sym}&from=${fromStr}&to=${toStr}&token=${FINNHUB_KEY}`,
          { next: { revalidate: 120 } }
        )
        if (!res.ok) return []
        const data = await res.json()
        return (data || []).slice(0, 3).map((item: any) => ({
          ...item,
          _symbol: sym,
        }))
      } catch {
        return []
      }
    })

    const companyResults = await Promise.all(companyPromises)
    const companyNews = companyResults.flat()

    // Normalize Finnhub response to our NewsItem format
    const normalized = [
      ...generalNews.slice(0, 15).map((item: any) => ({
        id: String(item.id),
        time: item.datetime * 1000,
        headline: item.headline,
        source: item.source || 'Unknown',
        symbols: extractSymbols(item.headline, item.related || ''),
        isHot: false,
        url: item.url,
      })),
      ...companyNews.map((item: any) => ({
        id: String(item.id),
        time: item.datetime * 1000,
        headline: item.headline,
        source: item.source || 'Unknown',
        symbols: item._symbol ? [item._symbol] : [],
        isHot: true,
        url: item.url,
      })),
    ]

    // Deduplicate by id
    const seen = new Set<string>()
    const deduped = normalized.filter((n: any) => {
      if (seen.has(n.id)) return false
      seen.add(n.id)
      return true
    })

    // Sort by time descending
    deduped.sort((a: any, b: any) => b.time - a.time)

    return NextResponse.json({
      source: 'finnhub',
      news: deduped.slice(0, 20),
    })
  } catch (error) {
    console.error('Finnhub news fetch error:', error)
    return NextResponse.json({ source: 'error', news: [] })
  }
}

// Try to extract stock symbols from headline text and Finnhub's related field
function extractSymbols(headline: string, related: string): string[] {
  const symbols = new Set<string>()

  // From Finnhub's related field
  if (related) {
    related.split(',').forEach(s => {
      const trimmed = s.trim().toUpperCase()
      if (trimmed.length >= 1 && trimmed.length <= 5) symbols.add(trimmed)
    })
  }

  // Match known symbols in headline
  const known = ['NVDA', 'TSLA', 'AAPL', 'AMD', 'SMCI', 'MSTR', 'PLTR', 'RIVN', 'SOFI', 'IONQ', 'RGTI', 'LUNR', 'BTOG']
  known.forEach(sym => {
    if (headline.includes(sym)) symbols.add(sym)
  })

  return Array.from(symbols).slice(0, 4)
}
